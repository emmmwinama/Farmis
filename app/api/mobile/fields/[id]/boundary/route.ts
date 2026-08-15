import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobilePermission } from "@/lib/mobileAuth";

type RouteContext = { params: { id: string } | Promise<{ id: string }> };

async function routeId(params: RouteContext["params"]) {
  return (await params).id;
}

function polygonCoords(geoJson: any): number[][] {
  return geoJson?.geometry?.coordinates?.[0] ?? geoJson?.coordinates?.[0] ?? [];
}

function calcAreaHa(coordinates: number[][]): number {
  if (coordinates.length < 3) return 0;
  const R = 6371000;
  let area = 0;
  for (let i = 0; i < coordinates.length; i += 1) {
    const j = (i + 1) % coordinates.length;
    const lat1 = (coordinates[i][1] * Math.PI) / 180;
    const lat2 = (coordinates[j][1] * Math.PI) / 180;
    const lng1 = (coordinates[i][0] * Math.PI) / 180;
    const lng2 = (coordinates[j][0] * Math.PI) / 180;
    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  return Math.abs((area * R * R) / 2) / 10000;
}

function calcCentroid(coordinates: number[][]) {
  if (coordinates.length === 0) return { lat: null, lng: null };
  return {
    lat: coordinates.reduce((sum, point) => sum + point[1], 0) / coordinates.length,
    lng: coordinates.reduce((sum, point) => sum + point[0], 0) / coordinates.length,
  };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const access = await requireMobilePermission(req, "fields");
  if (access.error) return access.error;
  const fieldId = await routeId(params);

  const boundary = await prisma.fieldBoundary.findFirst({
    where: { fieldId, farmId: access.session.farmId! },
    include: { zones: { include: { cropField: { include: { cropType: true } } } } },
  });

  return NextResponse.json(boundary ?? null);
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const access = await requireMobilePermission(req, "fields");
  if (access.error) return access.error;
  const fieldId = await routeId(params);

  const field = await prisma.field.findFirst({ where: { id: fieldId, farmId: access.session.farmId! } });
  if (!field) return NextResponse.json({ error: "Field not found" }, { status: 404 });

  const { geoJson, updateFieldArea = true } = await req.json();
  const coords = polygonCoords(geoJson);
  if (coords.length < 3) return NextResponse.json({ error: "A polygon boundary requires at least 3 points" }, { status: 400 });

  const areaHa = calcAreaHa(coords);
  const centroid = calcCentroid(coords);
  const boundary = await prisma.fieldBoundary.upsert({
    where: { fieldId },
    update: { geoJson, areaHa, centroidLat: centroid.lat, centroidLng: centroid.lng },
    create: { fieldId, farmId: access.session.farmId!, geoJson, areaHa, centroidLat: centroid.lat, centroidLng: centroid.lng },
  });

  if (updateFieldArea && areaHa > 0) {
    await prisma.field.update({
      where: { id: fieldId },
      data: { totalArea: Number(areaHa.toFixed(4)), cultivatableArea: Number(areaHa.toFixed(4)) },
    });
  }

  return NextResponse.json(boundary, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const access = await requireMobilePermission(req, "fields");
  if (access.error) return access.error;
  const fieldId = await routeId(params);

  const boundary = await prisma.fieldBoundary.findFirst({ where: { fieldId, farmId: access.session.farmId! } });
  if (!boundary) return NextResponse.json({ error: "Boundary not found" }, { status: 404 });

  await prisma.fieldBoundary.delete({ where: { id: boundary.id } });
  return NextResponse.json({ success: true });
}

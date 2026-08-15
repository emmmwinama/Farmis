import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobilePermission } from "@/lib/mobileAuth";

type RouteContext = { params: { id: string } | Promise<{ id: string }> };

async function routeId(params: RouteContext["params"]) {
  return (await params).id;
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

export async function GET(req: NextRequest, { params }: RouteContext) {
  const access = await requireMobilePermission(req, "fields");
  if (access.error) return access.error;
  const fieldId = await routeId(params);

  const zones = await prisma.fieldZone.findMany({
    where: { fieldId, farmId: access.session.farmId! },
    include: { cropField: { include: { cropType: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ zones });
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const access = await requireMobilePermission(req, "fields");
  if (access.error) return access.error;
  const fieldId = await routeId(params);

  const [field, boundary] = await Promise.all([
    prisma.field.findFirst({ where: { id: fieldId, farmId: access.session.farmId! } }),
    prisma.fieldBoundary.findFirst({ where: { fieldId, farmId: access.session.farmId! } }),
  ]);
  if (!field) return NextResponse.json({ error: "Field not found" }, { status: 404 });
  if (!boundary) return NextResponse.json({ error: "Create a field boundary before adding zones" }, { status: 400 });

  const body = await req.json();
  const coords: number[][] = body.geoJson?.geometry?.coordinates?.[0] ?? body.geoJson?.coordinates?.[0] ?? [];

  const zone = await prisma.fieldZone.create({
    data: {
      boundaryId: boundary.id,
      fieldId,
      farmId: access.session.farmId!,
      name: body.name || "Zone",
      type: body.type || "crop",
      cropFieldId: body.cropFieldId || null,
      geoJson: body.geoJson ?? {},
      areaHa: body.areaHa !== undefined ? parseFloat(body.areaHa) : calcAreaHa(coords),
      colour: body.colour || null,
      notes: body.notes || null,
    },
    include: { cropField: { include: { cropType: true } } },
  });

  return NextResponse.json(zone, { status: 201 });
}

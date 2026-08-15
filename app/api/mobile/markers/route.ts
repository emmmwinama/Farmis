import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobilePermission } from "@/lib/mobileAuth";

export async function GET(req: NextRequest) {
  const access = await requireMobilePermission(req, "fields");
  if (access.error) return access.error;

  const { searchParams } = new URL(req.url);
  const fieldId = searchParams.get("fieldId");
  const markers = await prisma.farmMarker.findMany({
    where: { farmId: access.session.farmId!, ...(fieldId ? { fieldId } : {}) },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ markers });
}

export async function POST(req: NextRequest) {
  const access = await requireMobilePermission(req, "fields");
  if (access.error) return access.error;

  const body = await req.json();
  if (!body.type || !body.label || body.lat === undefined || body.lng === undefined) {
    return NextResponse.json({ error: "Type, label, lat and lng are required" }, { status: 400 });
  }

  if (body.fieldId) {
    const field = await prisma.field.findFirst({ where: { id: body.fieldId, farmId: access.session.farmId! } });
    if (!field) return NextResponse.json({ error: "Field not found" }, { status: 404 });
  }

  const marker = await prisma.farmMarker.create({
    data: {
      farmId: access.session.farmId!,
      fieldId: body.fieldId || null,
      type: body.type,
      label: body.label,
      lat: parseFloat(body.lat),
      lng: parseFloat(body.lng),
      notes: body.notes || null,
      icon: body.icon || null,
    },
  });

  return NextResponse.json(marker, { status: 201 });
}

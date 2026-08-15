import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobilePermission } from "@/lib/mobileAuth";

type RouteContext = { params: { id: string } | Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const access = await requireMobilePermission(req, "fields");
  if (access.error) return access.error;
  const { id } = await params;

  const existing = await prisma.farmMarker.findFirst({ where: { id, farmId: access.session.farmId! } });
  if (!existing) return NextResponse.json({ error: "Marker not found" }, { status: 404 });

  const body = await req.json();
  const marker = await prisma.farmMarker.update({
    where: { id },
    data: {
      fieldId: body.fieldId === undefined ? existing.fieldId : body.fieldId || null,
      type: body.type ?? existing.type,
      label: body.label ?? existing.label,
      lat: body.lat === undefined ? existing.lat : parseFloat(body.lat),
      lng: body.lng === undefined ? existing.lng : parseFloat(body.lng),
      notes: body.notes === undefined ? existing.notes : body.notes || null,
      icon: body.icon === undefined ? existing.icon : body.icon || null,
    },
  });

  return NextResponse.json(marker);
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const access = await requireMobilePermission(req, "fields");
  if (access.error) return access.error;
  const { id } = await params;

  const existing = await prisma.farmMarker.findFirst({ where: { id, farmId: access.session.farmId! } });
  if (!existing) return NextResponse.json({ error: "Marker not found" }, { status: 404 });

  await prisma.farmMarker.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

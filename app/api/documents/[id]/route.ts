import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFarmPermission } from "@/lib/roleAccess";
import { DOCUMENT_TYPES } from "@/lib/documentValidation";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const access = await requireFarmPermission("documents", "write");
  if (access.error) return access.error;

  const existing = await prisma.farmDocument.findFirst({
    where: { id: params.id, farmId: access.farm.id },
  });
  if (!existing) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const body = await req.json();
  if (body.type !== undefined && !DOCUMENT_TYPES.has(String(body.type))) {
    return NextResponse.json({ error: "Unsupported document type" }, { status: 400 });
  }

  const document = await prisma.farmDocument.update({
    where: { id: params.id },
    data: {
      name: body.name ? String(body.name).trim() : undefined,
      type: body.type ?? undefined,
      linkedTo: body.linkedTo ?? undefined,
      linkedType: body.linkedType ?? undefined,
      notes: body.notes ?? undefined,
    },
  });

  return NextResponse.json(document);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const access = await requireFarmPermission("documents", "write");
  if (access.error) return access.error;

  const existing = await prisma.farmDocument.findFirst({
    where: { id: params.id, farmId: access.farm.id },
  });
  if (!existing) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  await prisma.farmDocument.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}

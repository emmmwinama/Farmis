import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFarmPermission } from "@/lib/roleAccess";
import { DOCUMENT_TYPES, validateDocumentInput } from "@/lib/documentValidation";

export async function GET(req: Request) {
  const access = await requireFarmPermission("documents");
  if (access.error) return access.error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const linkedType = searchParams.get("linkedType");

  if (type && !DOCUMENT_TYPES.has(type)) {
    return NextResponse.json({ error: "Unsupported document type" }, { status: 400 });
  }

  const documents = await prisma.farmDocument.findMany({
    where: {
      farmId: access.farm.id,
      ...(type ? { type } : {}),
      ...(linkedType ? { linkedType } : {}),
    },
    orderBy: { uploadedAt: "desc" },
  });

  return NextResponse.json({ documents });
}

export async function POST(req: Request) {
  const access = await requireFarmPermission("documents", "write");
  if (access.error) return access.error;

  const body = await req.json();
  const validated = validateDocumentInput(body);
  if (!validated.ok) return NextResponse.json({ error: validated.error }, { status: 400 });

  const document = await prisma.farmDocument.create({
    data: {
      farmId: access.farm.id,
      name: validated.name,
      type: validated.type,
      url: validated.url,
      size: validated.size,
      linkedTo: body.linkedTo || null,
      linkedType: body.linkedType || null,
      notes: body.notes ?? "",
    },
  });

  return NextResponse.json(document, { status: 201 });
}

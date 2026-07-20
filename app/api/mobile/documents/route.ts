import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobilePermission } from "@/lib/mobileAuth";

const TYPES = new Set(["receipt", "field_photo", "vet_record", "buyer_contract", "loan_document", "insurance_evidence", "certificate", "other"]);

export async function GET(req: NextRequest) {
  const access = await requireMobilePermission(req, "documents");
  if (access.error) return access.error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  const documents = await prisma.farmDocument.findMany({
    where: {
      farmId: access.session.farmId!,
      ...(type ? { type } : {}),
    },
    orderBy: { uploadedAt: "desc" },
  });

  return NextResponse.json({ documents });
}

export async function POST(req: NextRequest) {
  const access = await requireMobilePermission(req, "documents");
  if (access.error) return access.error;

  const body = await req.json();
  const { name, type, url, size, linkedTo, linkedType, notes } = body;

  if (!name || !type || !url) {
    return NextResponse.json({ error: "Name, type and file/link are required" }, { status: 400 });
  }
  if (!TYPES.has(type)) {
    return NextResponse.json({ error: "Unsupported document type" }, { status: 400 });
  }

  const document = await prisma.farmDocument.create({
    data: {
      farmId: access.session.farmId!,
      name: String(name).trim(),
      type,
      url,
      size: size ? Number(size) : null,
      linkedTo: linkedTo || null,
      linkedType: linkedType || null,
      notes: notes ?? "",
    },
  });

  return NextResponse.json(document, { status: 201 });
}

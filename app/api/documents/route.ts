import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFarmPermission } from "@/lib/roleAccess";

const TYPES = new Set([
  "receipt",
  "field_photo",
  "vet_record",
  "buyer_contract",
  "loan_document",
  "insurance_evidence",
  "certificate",
  "other",
]);
const ALLOWED_DATA_PREFIXES = [
  "data:application/pdf",
  "data:application/msword",
  "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "data:image/jpeg",
  "data:image/png",
  "data:image/webp",
];
const ALLOWED_URL_EXTENSIONS = /\.(pdf|doc|docx|jpg|jpeg|png|webp)(\?.*)?$/i;

export async function GET(req: Request) {
  const access = await requireFarmPermission("documents");
  if (access.error) return access.error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const linkedType = searchParams.get("linkedType");

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
  const { name, type, size, linkedTo, linkedType, notes } = body;
  let { url } = body;

  if (!name || !type || !url) {
    return NextResponse.json({ error: "Name, type and file/link are required" }, { status: 400 });
  }

  if (!TYPES.has(type)) {
    return NextResponse.json({ error: "Unsupported document type" }, { status: 400 });
  }

  url = String(url).trim();
  if (url.startsWith("data:") && !ALLOWED_DATA_PREFIXES.some((prefix) => url.startsWith(prefix))) {
    return NextResponse.json({ error: "Only PDF, Word documents, JPG, PNG, and WebP images are supported" }, { status: 400 });
  }
  if (!url.startsWith("data:") && !/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  if (!url.startsWith("data:") && !ALLOWED_URL_EXTENSIONS.test(url)) {
    return NextResponse.json({ error: "Links must point to a PDF, Word document, or image file" }, { status: 400 });
  }

  const document = await prisma.farmDocument.create({
    data: {
      farmId: access.farm.id,
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

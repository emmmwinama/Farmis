import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFarmPermission } from "@/lib/roleAccess";
import { parseDocumentDataUrl } from "@/lib/documentValidation";

function contentDisposition(name: string) {
  const safeName = name.replace(/[^\w.\- ]+/g, "_").trim() || "agrivault-document";
  return `inline; filename="${safeName.replace(/"/g, "")}"`;
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const access = await requireFarmPermission("documents");
  if (access.error) return access.error;

  const document = await prisma.farmDocument.findFirst({
    where: { id: params.id, farmId: access.farm.id },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const url = document.url.trim();

  if (/^https?:\/\//i.test(url)) {
    return NextResponse.redirect(url);
  }

  if (!url.startsWith("data:")) {
    return NextResponse.json({ error: "Document URL is invalid" }, { status: 400 });
  }

  const parsed = parseDocumentDataUrl(url);
  if (!parsed) return NextResponse.json({ error: "Uploaded document data is invalid" }, { status: 400 });

  const bytes = parsed.isBase64
    ? Buffer.from(parsed.payload, "base64")
    : Buffer.from(decodeURIComponent(parsed.payload), "utf8");

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": parsed.contentType,
      "Content-Disposition": contentDisposition(document.name),
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

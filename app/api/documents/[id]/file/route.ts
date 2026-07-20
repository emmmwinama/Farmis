import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFarmPermission } from "@/lib/roleAccess";

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

  const commaIndex = url.indexOf(",");
  if (commaIndex === -1) {
    return NextResponse.json({ error: "Uploaded document data is invalid" }, { status: 400 });
  }

  const meta = url.slice(5, commaIndex);
  const payload = url.slice(commaIndex + 1);
  const [contentType = "application/octet-stream"] = meta.split(";");
  const isBase64 = meta.toLowerCase().split(";").includes("base64");
  const bytes = isBase64
    ? Buffer.from(payload, "base64")
    : Buffer.from(decodeURIComponent(payload), "utf8");

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": contentDisposition(document.name),
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

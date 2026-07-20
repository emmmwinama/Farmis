import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FALLBACK_LEGAL_PAGES } from "@/lib/legalPages";

export async function GET(_: Request, { params }: { params: { slug: string } }) {
    const page = await prisma.cmsPage.findUnique({
        where: { slug: params.slug, isPublic: true },
    });
    if (!page) {
        const fallback = FALLBACK_LEGAL_PAGES[params.slug];
        if (fallback) return NextResponse.json({ slug: params.slug, isPublic: true, ...fallback });
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(page);
}

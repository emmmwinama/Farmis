import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const [content, testimonials, features, media] = await Promise.all([
        prisma.siteContent.findMany(),
        prisma.testimonial.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
        prisma.cmsFeature.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
        prisma.cmsMedia.findMany(),
    ]);

    const contentMap = Object.fromEntries(content.map((c) => [c.key, c.value]));
    const mediaMap = Object.fromEntries(media.map((m) => [m.key, m]));

    return NextResponse.json({ content: contentMap, testimonials, features, media: mediaMap });
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export async function GET() {
    try {
        const [
            contentItems,
            features,
            testimonials,
            media,
        ] = await Promise.all([
            prisma.siteContent.findMany({
                orderBy: { key: "asc" },
            }),

            prisma.cmsFeature.findMany({
                where: { isActive: true },
                orderBy: { sortOrder: "asc" },
            }),

            prisma.testimonial.findMany({
                where: { isActive: true },
                orderBy: [
                    { sortOrder: "asc" },
                    { createdAt: "desc" },
                ],
            }),

            prisma.cmsMedia.findMany(),
        ]);

        const content = Object.fromEntries(
            contentItems.map((item) => [item.key, item.value])
        );

        return NextResponse.json({
            success: true,
            content,
            contentItems,
            features,
            testimonials,
            media,
        });
    } catch (error) {
        console.error("Landing page API error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Failed to load landing page content.",
            },
            { status: 500 }
        );
    }
}

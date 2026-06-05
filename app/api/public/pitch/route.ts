import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const [sections, tiers, impactStats, testimonials, features] = await Promise.all([
        prisma.pitchSection.findMany({
            where:   { isActive: true },
            orderBy: { key: "asc" },
        }),
        prisma.subscriptionTier.findMany({
            where:   { isActive: true, isPublic: true },
            orderBy: { sortOrder: "asc" },
        }),
        prisma.impactStat.findMany({
            where:   { isActive: true },
            orderBy: { sortOrder: "asc" },
        }),
        prisma.testimonial.findMany({
            where: { isActive: true },
            take:  3,
        }),
        prisma.cmsFeature.findMany({
            where:   { isActive: true },
            orderBy: { sortOrder: "asc" },
        }),
    ]);

    const sectionMap = Object.fromEntries(sections.map((s) => [s.key, s]));

    return NextResponse.json({
        sections:     sectionMap,
        tiers,
        impactStats,
        testimonials,
        features,
    });
}
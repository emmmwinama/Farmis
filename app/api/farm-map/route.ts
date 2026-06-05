import { NextResponse } from "next/server";
import { getSessionFarm } from "@/lib/apiHelpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const { farm } = await getSessionFarm();

        if (!farm) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const [fields, markers] = await Promise.all([
            prisma.field.findMany({
                where: {
                    farmId: farm.id,
                },
                include: {
                    boundary: {
                        include: {
                            zones: true,
                        },
                    },
                    cropFields: {
                        where: {
                            status: "Active",
                        },
                        include: {
                            cropType: true,
                        },
                    },
                },
            }),

            prisma.farmMarker.findMany({
                where: {
                    farmId: farm.id,
                },
            }),
        ]);

        const totalMappedHa = fields.reduce(
            (sum, field) => sum + (field.boundary?.areaHa ?? 0),
            0
        );

        return NextResponse.json({
            farm: {
                id: farm.id,
                name: farm.name,
                location: farm.location,
            },

            fields: fields.map((field) => ({
                id: field.id,
                name: field.name,
                totalArea: field.totalArea,
                soilType: field.soilType,

                boundary: field.boundary
                    ? {
                        ...field.boundary,
                        zones: field.boundary.zones,
                    }
                    : null,

                activeCrops: field.cropFields.map((crop) => ({
                    id: crop.id,
                    cropName: crop.cropType.name,
                    variety: crop.variety,
                    season: crop.season,
                    status: crop.status,
                    area: crop.areaPlanted,
                })),
            })),

            markers,

            stats: {
                totalFields: fields.length,
                fieldsMapped: fields.filter((f) => f.boundary).length,
                totalMappedHa: Number(totalMappedHa.toFixed(4)),
                totalHa: fields.reduce(
                    (sum, field) => sum + field.totalArea,
                    0
                ),
            },
        });
    } catch (error) {
        console.error("farm-map error:", error);

        return NextResponse.json(
            {
                error: "Internal server error",
                fields: [],
                markers: [],
                stats: {},
            },
            {
                status: 500,
            }
        );
    }
}
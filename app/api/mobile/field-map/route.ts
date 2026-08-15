import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobilePermission } from "@/lib/mobileAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const access = await requireMobilePermission(req, "fields");
  if (access.error) return access.error;

  const [fields, markers] = await Promise.all([
    prisma.field.findMany({
      where: { farmId: access.session.farmId! },
      include: {
        boundary: { include: { zones: { include: { cropField: { include: { cropType: true } } } } } },
        cropFields: {
          where: { status: "Active" },
          include: { cropType: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.farmMarker.findMany({
      where: { farmId: access.session.farmId! },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalHa = fields.reduce((sum, field) => sum + field.totalArea, 0);
  const totalMappedHa = fields.reduce((sum, field) => sum + (field.boundary?.areaHa ?? 0), 0);

  return NextResponse.json({
    farm: { id: access.farm.id, name: access.farm.name, location: access.farm.location },
    readiness: {
      totalFields: fields.length,
      fieldsWithCoordinates: fields.filter((field) => field.locationLat != null && field.locationLng != null).length,
      fieldsWithBoundary: fields.filter((field) => field.boundary).length,
      totalMarkers: markers.length,
      totalZones: fields.reduce((sum, field) => sum + (field.boundary?.zones.length ?? 0), 0),
      totalHa,
      totalMappedHa: Number(totalMappedHa.toFixed(4)),
      mappedPct: totalHa > 0 ? Number(((totalMappedHa / totalHa) * 100).toFixed(1)) : 0,
    },
    concepts: {
      boundary: "GPS polygon for the outside edge of a field.",
      zones: "Internal field areas for crops, soil, drainage, infrastructure, or unplanted land.",
      markers: "Point locations such as boreholes, irrigation, sheds, roads, gates, trees, or notes.",
    },
    fields: fields.map((field) => ({
      id: field.id,
      name: field.name,
      totalArea: field.totalArea,
      cultivatableArea: field.cultivatableArea,
      soilType: field.soilType,
      locationLat: field.locationLat,
      locationLng: field.locationLng,
      gpsReady: field.locationLat != null && field.locationLng != null,
      boundary: field.boundary,
      zoneCount: field.boundary?.zones.length ?? 0,
      activeCrops: field.cropFields.map((crop) => ({
        id: crop.id,
        cropName: crop.cropType.name,
        variety: crop.variety,
        season: crop.season,
        areaPlanted: crop.areaPlanted,
      })),
    })),
    markers,
  });
}

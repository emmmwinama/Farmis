import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFarm } from "@/lib/apiHelpers";

export async function GET(req: Request) {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const typeId     = searchParams.get("typeId");
    const status     = searchParams.get("status");
    const group      = searchParams.get("group");

    const animals = await prisma.animal.findMany({
        where: {
            farmId: farm.id,
            ...(typeId ? { livestockTypeId: typeId } : {}),
            ...(status ? { status } : {}),
            ...(group  ? { group }  : {}),
        },
        include: {
            livestockType: true,
            healthRecords: { orderBy: { date: "desc" }, take: 1 },
            weightRecords: { orderBy: { date: "desc" }, take: 1 },
            productions:   { orderBy: { date: "desc" }, take: 5 },
            sales:         { orderBy: { saleDate: "desc" }, take: 1 },
            _count:        { select: { healthRecords: true, productions: true, offsprings: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    // Aggregate stats
    const activeAnimals = animals.filter((a) => a.status === "Active");
    const byType: Record<string, { name: string; icon: string; count: number; active: number }> = {};
    for (const a of animals) {
        const key = a.livestockType.name;
        if (!byType[key]) byType[key] = { name: key, icon: a.livestockType.icon, count: 0, active: 0 };
        byType[key].count++;
        if (a.status === "Active") byType[key].active++;
    }

    const groups = [...new Set(animals.map((a) => a.group).filter(Boolean))];
    const allTypes = await prisma.livestockType.findMany({ where: { farmId: farm.id } });

    return NextResponse.json({
        animals: animals.map((a) => ({
            id:              a.id,
            tag:             a.tag,
            name:            a.name,
            group:           a.group,
            sex:             a.sex,
            breed:           a.breed,
            colour:          a.colour,
            status:          a.status,
            acquisitionType: a.acquisitionType,
            acquisitionDate: a.acquisitionDate,
            acquisitionCost: a.acquisitionCost,
            birthDate:       a.birthDate,
            notes:           a.notes,
            weight:          a.weight,
            livestockTypeId: a.livestockTypeId,
            typeName:        a.livestockType.name,
            typeIcon:        a.livestockType.icon,
            typeCategory:    a.livestockType.category,
            lastHealth:      a.healthRecords[0] ?? null,
            lastWeight:      a.weightRecords[0] ?? null,
            recentProduction: a.productions,
            lastSale:        a.sales[0] ?? null,
            offspringCount:  a._count.offsprings,
            healthCount:     a._count.healthRecords,
            productionCount: a._count.productions,
            parentId:        a.parentId,
        })),
        byType: Object.values(byType),
        groups,
        allTypes,
        totals: {
            total:  animals.length,
            active: activeAnimals.length,
            sold:   animals.filter((a) => a.status === "Sold").length,
            deceased: animals.filter((a) => a.status === "Deceased").length,
        },
    });
}

export async function POST(req: Request) {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
        livestockTypeId, tag, name, group, sex, breed, colour,
        birthDate, acquisitionDate, acquisitionType, acquisitionCost,
        weight, notes, parentId,
    } = body;

    if (!livestockTypeId) {
        return NextResponse.json({ error: "Livestock type is required" }, { status: 400 });
    }

    const animal = await prisma.animal.create({
        data: {
            farmId:          farm.id,
            livestockTypeId,
            tag:             tag || null,
            name:            name || null,
            group:           group || null,
            sex:             sex || "Unknown",
            breed:           breed || null,
            colour:          colour || null,
            birthDate:       birthDate ? new Date(birthDate) : null,
            acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : new Date(),
            acquisitionType: acquisitionType || "Born on farm",
            acquisitionCost: acquisitionCost ? parseFloat(acquisitionCost) : null,
            weight:          weight ? parseFloat(weight) : null,
            notes:           notes || null,
            parentId:        parentId || null,
        },
        include: { livestockType: true },
    });

    // If it was purchased, create a finance expense
    if (acquisitionCost && parseFloat(acquisitionCost) > 0 && acquisitionType === "Purchased") {
        await prisma.animalExpense.create({
            data: {
                farmId:      farm.id,
                animalId:    animal.id,
                category:    "Purchase",
                description: `Purchased ${animal.livestockType.name}${tag ? ` #${tag}` : ""}${name ? ` (${name})` : ""}`,
                amount:      parseFloat(acquisitionCost),
                date:        acquisitionDate ? new Date(acquisitionDate) : new Date(),
            },
        });
    }

    return NextResponse.json(animal, { status: 201 });
}
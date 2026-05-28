import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const animal = await prisma.animal.findUnique({
        where: { id: params.id },
        include: {
            livestockType:   true,
            healthRecords:   { orderBy: { date: "desc" } },
            weightRecords:   { orderBy: { date: "desc" } },
            productions:     { orderBy: { date: "desc" } },
            expenses:        { orderBy: { date: "desc" } },
            sales:           { orderBy: { saleDate: "desc" } },
            offsprings:      { include: { livestockType: true } },
            parent:          { include: { livestockType: true } },
        },
    });

    if (!animal) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const totalExpenses = animal.expenses.reduce((s, e) => s + e.amount, 0) + (animal.acquisitionCost ?? 0);
    const totalRevenue  = animal.sales.reduce((s, s2) => s + s2.totalAmount, 0);
    const totalProduction = animal.productions.reduce((s, p) => s + (p.totalValue ?? 0), 0);

    return NextResponse.json({
        ...animal,
        totalExpenses,
        totalRevenue,
        totalProduction,
        netValue: totalRevenue + totalProduction - totalExpenses,
    });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
        tag, name, group, sex, breed, colour, status,
        birthDate, acquisitionDate, acquisitionType, acquisitionCost,
        weight, notes, parentId, livestockTypeId,
    } = body;

    const animal = await prisma.animal.update({
        where: { id: params.id },
        data: {
            tag:             tag || null,
            name:            name || null,
            group:           group || null,
            sex:             sex || "Unknown",
            breed:           breed || null,
            colour:          colour || null,
            status:          status || "Active",
            birthDate:       birthDate ? new Date(birthDate) : null,
            acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : undefined,
            acquisitionType: acquisitionType || "Born on farm",
            acquisitionCost: acquisitionCost ? parseFloat(acquisitionCost) : null,
            weight:          weight ? parseFloat(weight) : null,
            notes:           notes || null,
            parentId:        parentId || null,
            livestockTypeId: livestockTypeId || undefined,
        },
    });

    return NextResponse.json(animal);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.animal.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
}
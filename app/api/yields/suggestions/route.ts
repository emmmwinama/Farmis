import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Convert any unit to kg
function toKg(quantity: number, unit: string, unitWeight: number | null): number {
    if (unit === "kg") return quantity;
    if (unit === "tonnes") return quantity * 1000;
    if (unitWeight) return quantity * unitWeight;
    return quantity;
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const cropFieldId = searchParams.get("cropFieldId");
    const targetMargin = parseFloat(searchParams.get("margin") ?? "30") / 100;

    if (!cropFieldId) return NextResponse.json({ error: "cropFieldId required" }, { status: 400 });

    const cropField = await prisma.cropField.findUnique({
        where: { id: cropFieldId },
        include: {
            cropType: true,
            field: true,
            yields: true,
            activities: {
                include: {
                    labourRecords: true,
                    inputs: true,
                    otherCosts: true,
                },
            },
        },
    });

    if (!cropField) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const labourCost = cropField.activities
        .flatMap((a) => a.labourRecords)
        .reduce((s, l) => s + l.totalCost, 0);

    const inputCost = cropField.activities
        .flatMap((a) => a.inputs)
        .reduce((s, i) => s + i.totalCost, 0);

    const otherCost = cropField.activities
        .flatMap((a) => a.otherCosts)
        .reduce((s, o) => s + o.amount, 0);

    const totalCost = labourCost + inputCost + otherCost;

    // Convert all yield records to kg using the correct unit logic
    const totalYieldKg = cropField.yields.reduce((s, y) => {
        return s + toKg(y.quantity, y.unit, y.unitWeight);
    }, 0);

    // Also express yield in common units for display
    const totalYieldBags50 = totalYieldKg / 50;   // standard 50kg bag
    const totalYieldBags90 = totalYieldKg / 90;   // standard 90kg bag
    const totalYieldTonnes = totalYieldKg / 1000;

    // Break-even prices (cost recovery only, zero profit)
    const breakEvenPerKg = totalYieldKg > 0 ? totalCost / totalYieldKg : null;
    const breakEvenPerBag50 = breakEvenPerKg ? breakEvenPerKg * 50 : null;
    const breakEvenPerBag90 = breakEvenPerKg ? breakEvenPerKg * 90 : null;
    const breakEvenPerTonne = breakEvenPerKg ? breakEvenPerKg * 1000 : null;

    // Suggested prices at target margin
    const suggestedPerKg = breakEvenPerKg ? breakEvenPerKg * (1 + targetMargin) : null;
    const suggestedPerBag50 = suggestedPerKg ? suggestedPerKg * 50 : null;
    const suggestedPerBag90 = suggestedPerKg ? suggestedPerKg * 90 : null;
    const suggestedPerTonne = suggestedPerKg ? suggestedPerKg * 1000 : null;

    // Projected financials
    const projectedRevenueAtSuggested = suggestedPerKg
        ? suggestedPerKg * totalYieldKg
        : null;
    const projectedProfit = projectedRevenueAtSuggested
        ? projectedRevenueAtSuggested - totalCost
        : null;

    return NextResponse.json({
        cropName: cropField.cropType.name,
        variety: cropField.variety,
        fieldName: cropField.field.name,
        season: cropField.season,
        areaPlanted: cropField.areaPlanted,
        totalCost,
        labourCost,
        inputCost,
        otherCost,
        costPerHectare: cropField.areaPlanted > 0 ? totalCost / cropField.areaPlanted : null,
        // Yield quantities in all units
        totalYieldKg,
        totalYieldBags50,
        totalYieldBags90,
        totalYieldTonnes,
        yieldPerHectare: cropField.areaPlanted > 0 && totalYieldKg > 0
            ? totalYieldKg / cropField.areaPlanted
            : null,
        targetMarginPercent: targetMargin * 100,
        // Break-even prices
        breakEven: {
            perKg: breakEvenPerKg,
            perBag50: breakEvenPerBag50,
            perBag90: breakEvenPerBag90,
            perTonne: breakEvenPerTonne,
        },
        // Suggested prices at target margin
        suggested: {
            perKg: suggestedPerKg,
            perBag50: suggestedPerBag50,
            perBag90: suggestedPerBag90,
            perTonne: suggestedPerTonne,
        },
        projectedRevenueAtSuggested,
        projectedProfit,
    });
}
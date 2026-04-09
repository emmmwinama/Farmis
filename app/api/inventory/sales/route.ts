import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFarm } from "@/lib/apiHelpers";

export async function GET(req: Request) {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const inventoryItemId = searchParams.get("inventoryItemId");

    const sales = await prisma.inventorySale.findMany({
        where: {
            inventoryItem: { farmId: farm.id },
            ...(inventoryItemId ? { inventoryItemId } : {}),
        },
        include: {
            inventoryItem: { include: { cropField: { include: { cropType: true } } } },
            transaction: true,
        },
        orderBy: { saleDate: "desc" },
    });

    return NextResponse.json(sales);
}

export async function POST(req: Request) {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
        inventoryItemId, quantitySold, unit, pricePerUnit,
        buyerName, saleDate, notes, createTransaction,
        season, fieldId, cropFieldId,
    } = body;

    if (!inventoryItemId || !quantitySold || !pricePerUnit || !saleDate) {
        return NextResponse.json({ error: "Item, quantity, price and date are required" }, { status: 400 });
    }

    const item = await prisma.inventoryItem.findUnique({
        where: { id: inventoryItemId },
        include: { cropField: { include: { cropType: true } } },
    });

    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    if (parseFloat(quantitySold) > item.quantity) {
        return NextResponse.json(
            { error: `Only ${item.quantity} ${item.unit} available in inventory` },
            { status: 400 }
        );
    }

    const totalAmount = parseFloat(quantitySold) * parseFloat(pricePerUnit);

    let transaction = null;

    // Optionally create a linked finance transaction
    if (createTransaction) {
        transaction = await prisma.transaction.create({
            data: {
                farmId: farm.id,
                type: "Income",
                category: "Crop sales",
                amount: totalAmount,
                date: new Date(saleDate),
                description: `Sale: ${item.name}${item.cropField ? ` (${item.cropField.cropType.name})` : ""} — ${quantitySold} ${unit ?? item.unit}`,
                season: season || item.season || null,
                fieldId: fieldId || item.cropField?.fieldId || null,
                cropFieldId: cropFieldId || item.cropFieldId || null,
                harvestYieldId: item.harvestYieldId || null,
            },
        });
    }

    const sale = await prisma.inventorySale.create({
        data: {
            inventoryItemId,
            transactionId: transaction?.id ?? null,
            quantitySold: parseFloat(quantitySold),
            unit: unit ?? item.unit,
            pricePerUnit: parseFloat(pricePerUnit),
            totalAmount,
            buyerName: buyerName ?? null,
            saleDate: new Date(saleDate),
            notes: notes ?? null,
        },
    });

    // Deduct from inventory
    await prisma.inventoryItem.update({
        where: { id: inventoryItemId },
        data: { quantity: { decrement: parseFloat(quantitySold) } },
    });

    return NextResponse.json({ sale, transaction }, { status: 201 });
}
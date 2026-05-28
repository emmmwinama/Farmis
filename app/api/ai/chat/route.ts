import { NextResponse } from "next/server";
import { getSessionFarm } from "@/lib/apiHelpers";
import { prisma } from "@/lib/prisma";

function toKg(quantity: number, unit: string, unitWeight: number | null): number {
    if (unit === "kg") return quantity;
    if (unit === "tonnes") return quantity * 1000;
    if (unitWeight) return quantity * unitWeight;
    return quantity;
}

export async function POST(req: Request) {
    const { user, farm } = await getSessionFarm();
    if (!farm || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { messages } = await req.json();
    if (!messages?.length) return NextResponse.json({ error: "No messages" }, { status: 400 });

    // Build farm context
    const [fields, employees, transactions, overhead, inventory] = await Promise.all([
        prisma.field.findMany({
            where: { farmId: farm.id },
            include: {
                cropFields: {
                    include: {
                        cropType: true,
                        yields: true,
                        activities: {
                            include: { labourRecords: true, inputs: true, otherCosts: true },
                        },
                    },
                },
            },
        }),
        prisma.employee.findMany({ where: { farmId: farm.id } }),
        prisma.transaction.findMany({
            where: { farmId: farm.id },
            orderBy: { date: "desc" },
            take: 50,
        }),
        prisma.overheadExpense.findMany({ where: { farmId: farm.id } }),
        prisma.inventoryItem.findMany({
            where: { farmId: farm.id },
            include: { sales: true, cropField: { include: { cropType: true } } },
        }),
    ]);

    const allCropFields = fields.flatMap((f) => f.cropFields);

    // Compute season summaries
    const seasonMap: Record<string, any> = {};
    for (const cf of allCropFields) {
        if (!seasonMap[cf.season]) {
            seasonMap[cf.season] = { season: cf.season, crops: [], totalArea: 0, totalCost: 0, totalYieldKg: 0 };
        }
        const cost =
            cf.activities.flatMap((a) => a.labourRecords).reduce((s, l) => s + l.totalCost, 0) +
            cf.activities.flatMap((a) => a.inputs).reduce((s, i) => s + i.totalCost, 0) +
            cf.activities.flatMap((a) => a.otherCosts).reduce((s, o) => s + o.amount, 0);
        const yieldKg = cf.yields.reduce((s, y) => s + toKg(y.quantity, y.unit, y.unitWeight), 0);
        seasonMap[cf.season].crops.push(cf.cropType.name);
        seasonMap[cf.season].totalArea += cf.areaPlanted;
        seasonMap[cf.season].totalCost += cost;
        seasonMap[cf.season].totalYieldKg += yieldKg;
    }

    const totalIncome = transactions.filter((t) => t.type === "Income").reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter((t) => t.type === "Expense").reduce((s, t) => s + t.amount, 0);
    const totalOverhead = overhead.reduce((s, o) => s + o.amount, 0);

    const farmContext = `
You are an expert farm management AI assistant for ${user.name}'s farm called "${farm.name}" located in ${farm.location ?? "Malawi"}.

FARM OVERVIEW:
- Fields: ${fields.length} fields, total area: ${fields.reduce((s, f) => s + f.totalArea, 0).toFixed(1)} ha
- Active crops: ${allCropFields.filter((c) => c.status === "Active").length}
- Harvested crops: ${allCropFields.filter((c) => c.status === "Harvested").length}
- Employees: ${employees.length} (${employees.filter((e) => e.isActive).length} active)
- Inventory items: ${inventory.length}

FIELDS:
${fields.map((f) => `- ${f.name}: ${f.totalArea} ha total, ${f.cultivatableArea} ha cultivatable, ${f.soilType ?? "unknown"} soil`).join("\n")}

SEASONS:
${Object.values(seasonMap).map((s: any) => `- ${s.season}: ${[...new Set(s.crops)].join(", ")} on ${s.totalArea.toFixed(1)} ha, total cost MWK ${Math.round(s.totalCost).toLocaleString()}, yield ${Math.round(s.totalYieldKg).toLocaleString()} kg`).join("\n")}

CURRENT CROPS (Active):
${allCropFields.filter((c) => c.status === "Active").map((c) => {
        const cost = c.activities.flatMap((a) => a.labourRecords).reduce((s, l) => s + l.totalCost, 0) +
            c.activities.flatMap((a) => a.inputs).reduce((s, i) => s + i.totalCost, 0) +
            c.activities.flatMap((a) => a.otherCosts).reduce((s, o) => s + o.amount, 0);
        return `- ${c.cropType.name} (${c.variety}) — ${c.areaPlanted} ha — Season: ${c.season} — Activities: ${c.activities.length} — Cost so far: MWK ${Math.round(cost).toLocaleString()}`;
    }).join("\n")}

FINANCES:
- Total income: MWK ${Math.round(totalIncome).toLocaleString()}
- Total expenses: MWK ${Math.round(totalExpense).toLocaleString()}
- Overhead costs: MWK ${Math.round(totalOverhead).toLocaleString()}
- Net: MWK ${Math.round(totalIncome - totalExpense - totalOverhead).toLocaleString()}

INVENTORY:
${inventory.map((i) => `- ${i.name}: ${i.quantity} ${i.unit} available, ${i.sales.length} sales, revenue MWK ${Math.round(i.sales.reduce((s, sale) => s + sale.totalAmount, 0)).toLocaleString()}`).join("\n")}

EMPLOYEES:
${employees.map((e) => `- ${e.name} (${e.role}): MWK ${e.payRate}/${e.payRateUnit}`).join("\n")}

You have deep knowledge of African smallholder and commercial farming practices, crop management, soil health, market prices in Malawi and southern Africa, and agricultural finance. 

Always give practical, specific advice based on the actual farm data above. Use MWK for currency. Be conversational, warm and helpful. Keep answers concise — 2-4 paragraphs maximum unless the farmer asks for detailed analysis. Format numbers clearly.
  `.trim();

    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1024,
            system: farmContext,
            messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
        }),
    });

    if (!response.ok) {
        const err = await response.json();
        console.error("Claude API error:", err);
        return NextResponse.json({ error: "AI service unavailable" }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? "";

    return NextResponse.json({ message: text });
}
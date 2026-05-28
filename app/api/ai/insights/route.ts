import { NextResponse } from "next/server";
import { getSessionFarm } from "@/lib/apiHelpers";
import { prisma } from "@/lib/prisma";

function toKg(q: number, unit: string, uw: number | null) {
    if (unit === "kg") return q;
    if (unit === "tonnes") return q * 1000;
    if (uw) return q * uw;
    return q;
}

export async function GET() {
    const { user, farm } = await getSessionFarm();
    if (!farm || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const fields = await prisma.field.findMany({
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
    });

    const transactions = await prisma.transaction.findMany({ where: { farmId: farm.id } });
    const allCropFields = fields.flatMap((f) => f.cropFields);

    // Build per-cropField stats
    const cfStats = allCropFields.map((cf) => {
        const cost =
            cf.activities.flatMap((a) => a.labourRecords).reduce((s, l) => s + l.totalCost, 0) +
            cf.activities.flatMap((a) => a.inputs).reduce((s, i) => s + i.totalCost, 0) +
            cf.activities.flatMap((a) => a.otherCosts).reduce((s, o) => s + o.amount, 0);
        const yieldKg = cf.yields.reduce((s, y) => s + toKg(y.quantity, y.unit, y.unitWeight), 0);
        const costPerHa = cf.areaPlanted > 0 ? cost / cf.areaPlanted : 0;
        const costPerKg = yieldKg > 0 ? cost / yieldKg : null;
        return {
            id: cf.id,
            crop: cf.cropType.name,
            variety: cf.variety,
            season: cf.season,
            status: cf.status,
            areaPlanted: cf.areaPlanted,
            cost,
            yieldKg,
            costPerHa,
            costPerKg,
            activityCount: cf.activities.length,
            plantingDate: cf.plantingDate,
        };
    });

    // Build season comparisons
    const bySeason: Record<string, { cost: number; area: number; yieldKg: number; crops: string[] }> = {};
    for (const cf of cfStats) {
        if (!bySeason[cf.season]) bySeason[cf.season] = { cost: 0, area: 0, yieldKg: 0, crops: [] };
        bySeason[cf.season].cost += cf.cost;
        bySeason[cf.season].area += cf.areaPlanted;
        bySeason[cf.season].yieldKg += cf.yieldKg;
        if (!bySeason[cf.season].crops.includes(cf.crop)) bySeason[cf.season].crops.push(cf.crop);
    }

    // Build crop type averages across all seasons
    const byCrop: Record<string, { costPerHa: number[]; costPerKg: number[]; yieldPerHa: number[] }> = {};
    for (const cf of cfStats) {
        if (!byCrop[cf.crop]) byCrop[cf.crop] = { costPerHa: [], costPerKg: [], yieldPerHa: [] };
        if (cf.costPerHa > 0) byCrop[cf.crop].costPerHa.push(cf.costPerHa);
        if (cf.costPerKg !== null) byCrop[cf.crop].costPerKg.push(cf.costPerKg);
        if (cf.yieldKg > 0 && cf.areaPlanted > 0) byCrop[cf.crop].yieldPerHa.push(cf.yieldKg / cf.areaPlanted);
    }

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    // Build the context for anomaly detection
    const seasons = Object.entries(bySeason);
    const cropAverages = Object.entries(byCrop).map(([name, data]) => ({
        name,
        avgCostPerHa: avg(data.costPerHa),
        avgCostPerKg: avg(data.costPerKg),
        avgYieldPerHa: avg(data.yieldPerHa),
    }));

    const income = transactions.filter((t) => t.type === "Income").reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter((t) => t.type === "Expense").reduce((s, t) => s + t.amount, 0);

    const prompt = `
You are an agricultural AI analyst. Analyse this farm data and return a JSON array of insights.

FARM: ${farm.name}, ${farm.location ?? "Malawi"}

SEASON DATA:
${seasons.map(([s, d]) => `- ${s}: ${d.crops.join(", ")}, ${d.area.toFixed(1)} ha, MWK ${Math.round(d.cost).toLocaleString()} cost, ${Math.round(d.yieldKg).toLocaleString()} kg yield, MWK ${Math.round(d.cost / (d.area || 1)).toLocaleString()}/ha`).join("\n")}

CROP AVERAGES:
${cropAverages.map((c) => `- ${c.name}: avg MWK ${Math.round(c.avgCostPerHa).toLocaleString()}/ha, avg ${Math.round(c.avgYieldPerHa).toLocaleString()} kg/ha`).join("\n")}

ACTIVE CROPS WITH NO ACTIVITY IN 30+ DAYS:
${cfStats.filter((cf) => cf.status === "Active" && cf.activityCount === 0).map((cf) => `- ${cf.crop} (${cf.variety}) on ${cf.areaPlanted}ha, planted ${new Date(cf.plantingDate).toLocaleDateString()}`).join("\n") || "None"}

FINANCE: Income MWK ${Math.round(income).toLocaleString()}, Expense MWK ${Math.round(expense).toLocaleString()}, Net MWK ${Math.round(income - expense).toLocaleString()}

Return ONLY a valid JSON array (no markdown, no explanation) with 3-5 insights. Each insight must be:
{
  "type": "warning" | "success" | "info" | "tip",
  "title": "Short title (max 8 words)",
  "message": "Specific actionable insight referencing actual data (1-2 sentences)",
  "metric": "optional key metric e.g. 'MWK 45,000/ha'" 
}

Focus on: cost anomalies vs averages, yield gaps, crops needing attention, finance health, seasonal trends, actionable recommendations.
  `.trim();

    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1024,
            messages: [{ role: "user", content: prompt }],
        }),
    });

    if (!response.ok) {
        return NextResponse.json({ insights: [] });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? "[]";

    try {
        const clean = text.replace(/```json|```/g, "").trim();
        const insights = JSON.parse(clean);
        return NextResponse.json({ insights });
    } catch {
        return NextResponse.json({ insights: [] });
    }
}
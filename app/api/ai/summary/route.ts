import { NextResponse } from "next/server";
import { getSessionFarm } from "@/lib/apiHelpers";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const { user, farm } = await getSessionFarm();
    if (!farm || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { season, reportData } = await req.json();
    if (!reportData) return NextResponse.json({ error: "No report data" }, { status: 400 });

    const prompt = `
You are an expert agricultural business analyst. Write a concise executive summary for a farm season report.

FARM: ${farm.name}, operated by ${user.name}
SEASON: ${season ?? "All seasons"}

SEASON PERFORMANCE:
${reportData.seasonReport?.map((s: any) => `
Season: ${s.season}
- Area: ${s.totalArea?.toFixed(1)} ha
- Crops: ${s.crops?.join(", ")}
- Total production cost: MWK ${Math.round(s.totalActivityCost || 0).toLocaleString()}
- Revenue: MWK ${Math.round(s.totalRevenue || 0).toLocaleString()}
- Gross profit: MWK ${Math.round(s.grossProfit || 0).toLocaleString()}
- Yield: ${Math.round(s.totalYieldKg || 0).toLocaleString()} kg
- Cost per hectare: MWK ${Math.round(s.costPerHectare || 0).toLocaleString()}
- Yield per hectare: ${Math.round(s.yieldPerHectare || 0).toLocaleString()} kg
`).join("\n") ?? "No season data"}

TOP CROPS BY AREA:
${reportData.cropReport?.slice(0, 5).map((c: any) => `
- ${c.cropName}: ${c.totalArea?.toFixed(1)} ha, MWK ${Math.round(c.totalCost || 0).toLocaleString()} cost, ${Math.round(c.totalYieldKg || 0).toLocaleString()} kg yield, MWK ${Math.round(c.costPerHectare || 0).toLocaleString()}/ha
`).join("") ?? "No crop data"}

FINANCE SUMMARY:
- Total income: MWK ${Math.round(reportData.financeSummary?.totalIncome || 0).toLocaleString()}
- Total inventory revenue: MWK ${Math.round(reportData.financeSummary?.totalInventoryRevenue || 0).toLocaleString()}
- Activity costs: MWK ${Math.round(reportData.financeSummary?.totalActivityCost || 0).toLocaleString()}
- Overhead costs: MWK ${Math.round(reportData.financeSummary?.totalOverheadCost || 0).toLocaleString()}
- Gross profit: MWK ${Math.round(reportData.financeSummary?.grossProfit || 0).toLocaleString()}

Write a professional executive summary in 3 short paragraphs:
1. Overall performance assessment (what went well, key numbers)
2. Key challenges or areas of concern (costs, yields, specific crops)
3. Specific recommendations for the next season

Be direct, data-driven and practical. Reference specific numbers. Use MWK for currency. Write for a farm owner, not a technical analyst.
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
        return NextResponse.json({ error: "AI service unavailable" }, { status: 500 });
    }

    const data = await response.json();
    const summary = data.content?.[0]?.text ?? "";
    return NextResponse.json({ summary });
}
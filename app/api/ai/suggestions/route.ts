import { NextResponse } from "next/server";
import { getSessionFarm } from "@/lib/apiHelpers";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const cropFieldId = searchParams.get("cropFieldId");
    if (!cropFieldId) return NextResponse.json({ error: "cropFieldId required" }, { status: 400 });

    const cropField = await prisma.cropField.findUnique({
        where: { id: cropFieldId },
        include: {
            cropType: true,
            field: true,
            activities: {
                include: { inputs: true, labourRecords: true },
                orderBy: { date: "desc" },
            },
            yields: true,
        },
    });

    if (!cropField) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const today = new Date();
    const plantingDate = new Date(cropField.plantingDate);
    const expectedHarvest = new Date(cropField.expectedHarvestDate);
    const daysPlanted = Math.floor((today.getTime() - plantingDate.getTime()) / 86400000);
    const daysToHarvest = Math.floor((expectedHarvest.getTime() - today.getTime()) / 86400000);
    const lastActivity = cropField.activities[0];
    const daysSinceLastActivity = lastActivity
        ? Math.floor((today.getTime() - new Date(lastActivity.date).getTime()) / 86400000)
        : null;

    const inputsUsed = cropField.activities.flatMap((a) => a.inputs).map((i) => i.inputName);

    const prompt = `
You are an expert agronomist specialising in African smallholder farming. Provide activity suggestions for this crop.

CROP DETAILS:
- Crop: ${cropField.cropType.name} (variety: ${cropField.variety})
- Field: ${cropField.field.name} (${cropField.field.soilType ?? "unknown"} soil)
- Area: ${cropField.areaPlanted} ha
- Season: ${cropField.season}
- Status: ${cropField.status}
- Planted: ${plantingDate.toLocaleDateString()} (${daysPlanted} days ago)
- Expected harvest: ${expectedHarvest.toLocaleDateString()} (${daysToHarvest > 0 ? daysToHarvest + " days away" : "overdue"})
- Activities so far: ${cropField.activities.length} (${cropField.activities.map((a) => a.activityType).join(", ") || "none"})
- Inputs used: ${[...new Set(inputsUsed)].join(", ") || "none"}
- Days since last activity: ${daysSinceLastActivity ?? "no activities yet"}
- Harvest recorded: ${cropField.yields.length > 0 ? "Yes" : "No"}

Return ONLY a valid JSON array (no markdown) with 3-4 suggested next activities:
{
  "activity": "Activity type (e.g. Weeding, Top dressing, Spraying, Irrigation, Harvesting)",
  "priority": "high" | "medium" | "low",
  "reason": "Why this activity is needed now (1 sentence, reference crop stage/days)",
  "timing": "When to do it (e.g. 'This week', 'Within 2 weeks', 'Immediately')",
  "inputs": "Recommended inputs if applicable (e.g. 'CAN fertiliser 50kg/ha') or null"
}
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
        return NextResponse.json({ suggestions: [] });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? "[]";

    try {
        const clean = text.replace(/```json|```/g, "").trim();
        const suggestions = JSON.parse(clean);
        return NextResponse.json({ suggestions, cropName: cropField.cropType.name, variety: cropField.variety });
    } catch {
        return NextResponse.json({ suggestions: [] });
    }
}
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileSession } from "@/lib/mobileAuth";
import { createSimplePdf, type PdfLine } from "@/lib/simplePdf";
import { GET as getReports } from "../route";

const reportLabels: Record<string, string> = {
    season: "Season P&L",
    crop: "Crop costs",
    field: "Field costs",
    cropField: "Crop-field detail",
    labour: "Labour",
    inputs: "Input efficiency",
    yields: "Yields",
};

function money(value: number) {
    return `MWK ${Math.round(value || 0).toLocaleString("en-US")}`;
}

function number(value: number, suffix = "") {
    return `${Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}${suffix}`;
}

function selectedReports(searchParams: URLSearchParams) {
    const selected = searchParams.getAll("report").filter(Boolean);
    return selected.length > 0 ? selected : Object.keys(reportLabels);
}

function pushTable(
    lines: PdfLine[],
    title: string,
    headers: string[],
    rows: string[][],
    maxRows = 12
) {
    lines.push({ text: title, size: 15, bold: true, color: [2, 132, 199], gapBefore: 16 });
    if (rows.length === 0) {
        lines.push({ text: "No records for the selected filters.", size: 9, color: [71, 85, 105], gapBefore: 4 });
        return;
    }

    lines.push({ text: headers.join(" | "), size: 8, bold: true, mono: true, color: [15, 23, 42], gapBefore: 4 });
    lines.push({ text: headers.map((header) => "-".repeat(Math.min(18, Math.max(6, header.length)))).join("-+-"), size: 8, mono: true, color: [148, 163, 184] });
    for (const row of rows.slice(0, maxRows)) {
        lines.push({ text: row.join(" | "), size: 8, mono: true, color: [15, 23, 42] });
    }
    if (rows.length > maxRows) {
        lines.push({ text: `Showing first ${maxRows} of ${rows.length} rows. Narrow the filters for a shorter PDF.`, size: 8, color: [71, 85, 105], gapBefore: 4 });
    }
}

export async function GET(req: NextRequest) {
    const session = getMobileSession(req);
    if (!session?.farmId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") ?? "pdf";
    if (format !== "pdf") {
        return NextResponse.json({ error: "PDF export is required for mobile reports." }, { status: 400 });
    }

    const response = await getReports(req);
    if (!response.ok) return response;

    const data = await response.json();
    const farm = await prisma.farm.findUnique({
        where: { id: session.farmId },
        select: { name: true },
    });
    const selected = new Set(selectedReports(searchParams));
    const generatedAt = new Date();

    const filterLines = Object.entries(data.filters ?? {})
        .map(([key, value]) => `${key}: ${value ?? "all"}`)
        .join(" | ");

    const lines: PdfLine[] = [
        { text: `Farm: ${farm?.name ?? "Active farm"}`, size: 11, bold: true },
        { text: `Generated: ${generatedAt.toLocaleString("en-GB")}`, size: 9, color: [71, 85, 105] },
        { text: `Filters: ${filterLines || "none"}`, size: 9, color: [71, 85, 105] },
        { text: `Sections: ${[...selected].map((key) => reportLabels[key] ?? key).join(", ")}`, size: 9, color: [71, 85, 105] },
        { text: "Charts available in the mobile app are represented here with report tables for audit-ready review.", size: 9, color: [71, 85, 105], gapBefore: 8 },
    ];

    lines.push({ text: "Financial summary", size: 15, bold: true, color: [2, 132, 199], gapBefore: 16 });
    {
        const summary = data.financeSummary ?? {};
        pushTable(lines, "Finance overview", ["Metric", "Value"], [
            ["Income", money(summary.totalIncome)],
            ["Activity costs", money(summary.totalActivityCost)],
            ["Overhead costs", money(summary.totalOverheadCost)],
            ["Net", money(summary.net)],
        ]);
    }

    if (selected.has("season")) {
        pushTable(
            lines,
            "Season P&L",
            ["Season", "Area", "Crops", "Cost/ha"],
            (data.seasonReport ?? []).map((row: any) => [
                row.season,
                number(row.totalArea, " ha"),
                String(row.cropCount),
                money(row.costPerHectare),
            ])
        );
    }

    if (selected.has("crop")) {
        pushTable(
            lines,
            "Crop costs",
            ["Crop", "Area", "Cost", "Cost/ha"],
            (data.cropReport ?? []).map((row: any) => [
                row.cropName,
                number(row.totalArea, " ha"),
                money(row.totalCost),
                money(row.costPerHectare),
            ])
        );
    }

    if (selected.has("field")) {
        pushTable(
            lines,
            "Field costs",
            ["Field", "Area", "Crops", "Cost"],
            (data.fieldReport ?? []).map((row: any) => [
                row.fieldName,
                number(row.totalArea, " ha"),
                (row.crops ?? []).join(", "),
                money(row.totalCost),
            ])
        );
    }

    if (selected.has("cropField")) {
        pushTable(
            lines,
            "Crop-field detail",
            ["Crop", "Field", "Season", "Cost"],
            (data.cropFieldDetail ?? []).map((row: any) => [
                `${row.cropName} ${row.variety ?? ""}`.trim(),
                row.fieldName,
                row.season,
                money(row.totalCost),
            ])
        );
    }

    if (selected.has("labour")) {
        pushTable(
            lines,
            "Labour",
            ["Employee", "Role", "Activities", "Earned"],
            (data.employeeReport ?? []).map((row: any) => [
                row.name,
                row.role,
                String(row.activities),
                money(row.totalEarned),
            ])
        );
    }

    if (selected.has("inputs")) {
        pushTable(
            lines,
            "Input efficiency",
            ["Input", "Category", "Qty", "Cost"],
            (data.inputReport ?? []).map((row: any) => [
                row.inputName,
                row.category,
                number(row.totalQuantity, ` ${row.unit}`),
                money(row.totalCost),
            ])
        );
    }

    if (selected.has("yields")) {
        pushTable(
            lines,
            "Yields",
            ["Crop", "Yield kg", "Cost/kg", "Yield/ha"],
            (data.yieldsReport?.records ?? []).map((row: any) => [
                row.cropName,
                number(row.totalYieldKg),
                money(row.costPerKg),
                number(row.yieldPerHa, " kg/ha"),
            ])
        );
    }

    const pdf = createSimplePdf("AgriVault Farm Report", lines);
    const filename = `agrivault-report-${generatedAt.toISOString().slice(0, 10)}.pdf`;
    return new NextResponse(pdf, {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
}

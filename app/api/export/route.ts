import { NextResponse } from "next/server";
import { getSessionFarm } from "@/lib/apiHelpers";
import { prisma } from "@/lib/prisma";

function toCSV(headers: string[], rows: Array<(string | number | null | undefined)[]>): string {
    const escape = (v: string | number | null | undefined): string => {
        if (v == null) return "";
        const str = String(v);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };
    const lines = [headers.map(escape).join(",")];
    for (const row of rows) {
        lines.push(row.map(escape).join(","));
    }
    return lines.join("\n");
}

export async function GET(req: Request) {
    const { farm } = await getSessionFarm();
    if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? "transactions";

    let csv = "";
    let filename = "";

    if (type === "transactions") {
        const transactions = await prisma.transaction.findMany({
            where: { farmId: farm.id },
            include: { field: true, cropField: { include: { cropType: true } } },
            orderBy: { date: "desc" },
        });
        filename = `farmio-transactions-${Date.now()}.csv`;
        csv = toCSV(
            ["Date", "Type", "Category", "Description", "Amount (MWK)", "Season", "Field", "Crop"],
            transactions.map((t) => [
                new Date(t.date).toLocaleDateString("en-GB"),
                t.type,
                t.category,
                t.description,
                t.amount,
                t.season ?? "",
                t.field?.name ?? "",
                (t.cropField as any)?.cropType?.name ?? "",
            ])
        );
    }

    else if (type === "activities") {
        const fields = await prisma.field.findMany({
            where: { farmId: farm.id },
            include: {
                cropFields: {
                    include: {
                        cropType: true,
                        activities: {
                            include: { labourRecords: true, inputs: true, otherCosts: true },
                        },
                    },
                },
            },
        });
        filename = `farmio-activities-${Date.now()}.csv`;
        const rows: any[] = [];
        for (const field of fields) {
            for (const cf of field.cropFields) {
                for (const a of cf.activities) {
                    const labourCost = a.labourRecords.reduce((s, l) => s + l.totalCost, 0);
                    const inputCost = a.inputs.reduce((s, i) => s + i.totalCost, 0);
                    const otherCost = a.otherCosts.reduce((s, o) => s + o.amount, 0);
                    rows.push([
                        new Date(a.date).toLocaleDateString("en-GB"),
                        a.activityType,
                        field.name,
                        cf.cropType.name,
                        cf.variety,
                        cf.season,
                        labourCost,
                        inputCost,
                        otherCost,
                        labourCost + inputCost + otherCost,
                    ]);
                }
            }
        }
        csv = toCSV(
            ["Date", "Activity", "Field", "Crop", "Variety", "Season", "Labour Cost", "Input Cost", "Other Cost", "Total Cost"],
            rows
        );
    }

    else if (type === "yields") {
        const fields = await prisma.field.findMany({
            where: { farmId: farm.id },
            include: { cropFields: { include: { cropType: true, yields: true } } },
        });
        filename = `farmio-yields-${Date.now()}.csv`;
        const rows: any[] = [];
        for (const field of fields) {
            for (const cf of field.cropFields) {
                for (const y of cf.yields) {
                    rows.push([
                        new Date(y.harvestDate).toLocaleDateString("en-GB"),
                        cf.cropType.name,
                        cf.variety,
                        field.name,
                        cf.season,
                        y.quantity,
                        y.unit,
                        y.unitWeight ?? "",
                        y.unitWeight ? y.quantity * y.unitWeight : y.quantity,
                        y.notes ?? "",
                    ]);
                }
            }
        }
        csv = toCSV(
            ["Harvest Date", "Crop", "Variety", "Field", "Season", "Quantity", "Unit", "Unit Weight (kg)", "Total kg", "Notes"],
            rows
        );
    }

    else if (type === "inventory") {
        const items = await prisma.inventoryItem.findMany({
            where: { farmId: farm.id },
            include: { sales: true, cropField: { include: { cropType: true } } },
        });
        filename = `farmio-inventory-${Date.now()}.csv`;
        csv = toCSV(
            ["Name", "Category", "Unit", "Quantity", "Season", "Crop", "Total Sold", "Revenue (MWK)"],
            items.map((i) => [
                i.name,
                i.category,
                i.unit,
                i.quantity,
                i.season ?? "",
                (i.cropField as any)?.cropType?.name ?? "",
                i.sales.reduce((s, sale) => s + sale.quantitySold, 0),
                i.sales.reduce((s, sale) => s + sale.totalAmount, 0),
            ])
        );
    }

    else if (type === "employees") {
        const employees = await prisma.employee.findMany({ where: { farmId: farm.id } });
        filename = `farmio-employees-${Date.now()}.csv`;
        csv = toCSV(
            ["Name", "Role", "Pay Rate (MWK)", "Pay Unit", "Phone", "Active"],
            employees.map((e) => [e.name, e.role, e.payRate, e.payRateUnit, e.phone ?? "", e.isActive ? "Yes" : "No"])
        );
    }

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
}
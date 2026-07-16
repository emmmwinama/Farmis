import { NextResponse } from "next/server";
import { getSessionFarm } from "@/lib/apiHelpers";
import { prisma } from "@/lib/prisma";
import { createSimplePdf, type PdfLine } from "@/lib/simplePdf";

const PACKS = {
  loan: {
    title: "Loan Readiness Record Pack",
    purpose: "Cashflow, production history, labour capacity, and repayment evidence.",
  },
  buyer: {
    title: "Buyer and Offtaker Record Pack",
    purpose: "Traceability, crop volumes, quality notes, and sales history.",
  },
  audit: {
    title: "Audit Record Pack",
    purpose: "Field, activity, input, payroll, finance, and inventory evidence.",
  },
  insurance: {
    title: "Insurance Record Pack",
    purpose: "Farm location, acreage, crop status, activity records, yields, and loss evidence.",
  },
} as const;

const SECTION_LABELS = {
  fields: "Fields and crops",
  activities: "Activities and input evidence",
  finance: "Finance records",
  payroll: "Payroll capacity",
  livestock: "Livestock summary",
} as const;

type ExportSection = keyof typeof SECTION_LABELS;

type PackType = keyof typeof PACKS;

function csv(value: string | number | null | undefined) {
  if (value == null) return "";
  const text = String(value);
  return text.includes(",") || text.includes('"') || text.includes("\n")
    ? `"${text.replace(/"/g, '""')}"`
    : text;
}

function row(values: Array<string | number | null | undefined>) {
  return values.map(csv).join(",");
}

function section(lines: string[], title: string, headers: string[]) {
  lines.push("");
  lines.push(title);
  lines.push(row(headers));
}

export async function GET(req: Request) {
  const { farm } = await getSessionFarm();
  if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const requestedType = searchParams.get("type") as PackType | null;
  const type: PackType = requestedType && requestedType in PACKS ? requestedType : "loan";
  const pack = PACKS[type];
  const format = searchParams.get("format") === "csv" ? "csv" : "pdf";
  const requestedSections = searchParams.getAll("section").filter((item): item is ExportSection => item in SECTION_LABELS);
  const sections: ExportSection[] = requestedSections.length
    ? requestedSections
    : ["fields", "activities", "finance", "payroll", "livestock"];

  const [fields, employees, transactions, activities, animals] = await Promise.all([
    prisma.field.findMany({
      where: { farmId: farm.id },
      include: {
        cropFields: {
          include: {
            cropType: true,
            yields: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.employee.findMany({ where: { farmId: farm.id }, orderBy: { name: "asc" } }),
    prisma.transaction.findMany({
      where: { farmId: farm.id },
      include: { field: true, cropField: { include: { cropType: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.farmActivity.findMany({
      where: { field: { farmId: farm.id } },
      include: {
        field: true,
        cropField: { include: { cropType: true } },
        labourRecords: true,
        inputs: true,
        otherCosts: true,
      },
      orderBy: { date: "desc" },
    }),
    prisma.animal.findMany({
      where: { farmId: farm.id },
      include: { livestockType: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalArea = fields.reduce((sum, field) => sum + field.totalArea, 0);
  const cultivatableArea = fields.reduce((sum, field) => sum + field.cultivatableArea, 0);
  const income = transactions.filter((t) => t.type === "Income").reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === "Expense").reduce((sum, t) => sum + t.amount, 0);
  const harvestedKg = fields.flatMap((field) => field.cropFields)
    .flatMap((cropField) => cropField.yields)
    .reduce((sum, yieldRecord) => sum + (yieldRecord.unitWeight ? yieldRecord.quantity * yieldRecord.unitWeight : yieldRecord.quantity), 0);

  const lines: string[] = [
    pack.title,
    row(["Generated", new Date().toISOString()]),
    row(["Farm", farm.name]),
    row(["Location", farm.location]),
    row(["Purpose", pack.purpose]),
    row(["Fields", fields.length]),
    row(["Total area", `${totalArea.toFixed(2)} ha`]),
    row(["Cultivatable area", `${cultivatableArea.toFixed(2)} ha`]),
    row(["Employees", employees.length]),
    row(["Livestock records", animals.length]),
    row(["Income", income]),
    row(["Expenses", expenses]),
    row(["Net", income - expenses]),
    row(["Harvested quantity estimate", `${harvestedKg.toFixed(2)} kg`]),
  ];

  if (sections.includes("fields")) {
    section(lines, "Fields and Crops", ["Field", "Area", "Cultivatable", "Soil", "Crop", "Variety", "Season", "Status", "Planted", "Expected harvest"]);
    for (const field of fields) {
      if (field.cropFields.length === 0) {
        lines.push(row([field.name, field.totalArea, field.cultivatableArea, field.soilType, "", "", "", "", "", ""]));
      }
      for (const cropField of field.cropFields) {
        lines.push(row([
          field.name,
          field.totalArea,
          field.cultivatableArea,
          field.soilType,
          cropField.cropType.name,
          cropField.variety,
          cropField.season,
          cropField.status,
          cropField.plantingDate.toISOString().slice(0, 10),
          cropField.expectedHarvestDate.toISOString().slice(0, 10),
        ]));
      }
    }
  }

  if (sections.includes("activities")) {
    section(lines, "Activities and Input Evidence", ["Date", "Activity", "Field", "Crop", "Labour cost", "Input cost", "Other cost", "Notes"]);
    for (const activity of activities) {
      const labourCost = activity.labourRecords.reduce((sum, item) => sum + item.totalCost, 0);
      const inputCost = activity.inputs.reduce((sum, item) => sum + item.totalCost, 0);
      const otherCost = activity.otherCosts.reduce((sum, item) => sum + item.amount, 0);
      lines.push(row([
        activity.date.toISOString().slice(0, 10),
        activity.activityType,
        activity.field.name,
        activity.cropField?.cropType.name ?? "",
        labourCost,
        inputCost,
        otherCost,
        activity.notes ?? "",
      ]));
    }
  }

  if (sections.includes("finance")) {
    section(lines, "Finance Records", ["Date", "Type", "Category", "Amount", "Field", "Crop", "Season", "Description"]);
    for (const transaction of transactions) {
      lines.push(row([
        transaction.date.toISOString().slice(0, 10),
        transaction.type,
        transaction.category,
        transaction.amount,
        transaction.field?.name ?? "",
        transaction.cropField?.cropType.name ?? "",
        transaction.season ?? "",
        transaction.description,
      ]));
    }
  }

  if (sections.includes("payroll")) {
    section(lines, "Payroll Capacity", ["Name", "Role", "Pay rate", "Pay unit", "Phone", "Active"]);
    for (const employee of employees) {
      lines.push(row([employee.name, employee.role, employee.payRate, employee.payRateUnit, employee.phone ?? "", employee.isActive ? "Yes" : "No"]));
    }
  }

  if (sections.includes("livestock")) {
    section(lines, "Livestock Summary", ["Tag", "Type", "Breed", "Status", "Birth date", "Acquisition cost"]);
    for (const animal of animals) {
      lines.push(row([
        animal.tag ?? animal.name ?? "",
        animal.livestockType.name,
        animal.breed ?? "",
        animal.status,
        animal.birthDate?.toISOString().slice(0, 10) ?? "",
        animal.acquisitionCost ?? "",
      ]));
    }
  }

  if (format === "pdf") {
    const pdfLines: PdfLine[] = [
      { text: `Generated: ${new Date().toLocaleDateString("en-GB")}`, size: 10, color: [71, 85, 105] },
      { text: `Farm: ${farm.name}`, size: 14, bold: true, gapBefore: 8 },
      { text: `Location: ${farm.location ?? "Not recorded"}`, size: 10 },
      { text: `Purpose: ${pack.purpose}`, size: 10 },
      { text: "Executive summary", size: 15, bold: true, color: [15, 23, 42], gapBefore: 14 },
      { text: `Fields: ${fields.length} | Cultivatable area: ${cultivatableArea.toFixed(2)} ha | Employees: ${employees.length} | Livestock: ${animals.length}`, size: 10 },
      { text: `Income: MWK ${income.toLocaleString("en-MW")} | Expenses: MWK ${expenses.toLocaleString("en-MW")} | Net: MWK ${(income - expenses).toLocaleString("en-MW")}`, size: 10 },
      { text: `Harvested quantity estimate: ${harvestedKg.toFixed(2)} kg`, size: 10 },
      { text: `Included sections: ${sections.map((item) => SECTION_LABELS[item]).join(", ")}`, size: 10 },
    ];

    const pushSection = (title: string, items: string[]) => {
      pdfLines.push({ text: title, size: 15, bold: true, color: [2, 132, 199], gapBefore: 16 });
      for (const item of items) pdfLines.push({ text: item, size: 9 });
    };

    if (sections.includes("fields")) {
      pushSection("Fields and crops", fields.flatMap((field) => {
        if (field.cropFields.length === 0) return [`${field.name}: ${field.totalArea.toFixed(2)} ha, no crop recorded.`];
        return field.cropFields.map((cropField) => `${field.name}: ${cropField.cropType.name} ${cropField.variety}, ${cropField.season}, ${cropField.status}, ${cropField.areaPlanted.toFixed(2)} ha.`);
      }));
    }
    if (sections.includes("activities")) {
      pushSection("Activities and input evidence", activities.slice(0, 120).map((activity) => {
        const labourCost = activity.labourRecords.reduce((sum, item) => sum + item.totalCost, 0);
        const inputCost = activity.inputs.reduce((sum, item) => sum + item.totalCost, 0);
        const otherCost = activity.otherCosts.reduce((sum, item) => sum + item.amount, 0);
        return `${activity.date.toISOString().slice(0, 10)} - ${activity.activityType} on ${activity.field.name}${activity.cropField ? ` / ${activity.cropField.cropType.name}` : ""}. Costs: labour MWK ${labourCost}, inputs MWK ${inputCost}, other MWK ${otherCost}.`;
      }));
    }
    if (sections.includes("finance")) {
      pushSection("Finance records", transactions.slice(0, 120).map((transaction) => `${transaction.date.toISOString().slice(0, 10)} - ${transaction.type}: ${transaction.category}, MWK ${transaction.amount}. ${transaction.description}`));
    }
    if (sections.includes("payroll")) {
      pushSection("Payroll capacity", employees.map((employee) => `${employee.name} - ${employee.role}, MWK ${employee.payRate}/${employee.payRateUnit}, ${employee.isActive ? "active" : "inactive"}.`));
    }
    if (sections.includes("livestock")) {
      pushSection("Livestock summary", animals.map((animal) => `${animal.tag ?? animal.name ?? "Animal"} - ${animal.livestockType.name}, ${animal.status}, ${animal.breed ?? "breed not recorded"}.`));
    }

    const filename = `agrivault-${type}-record-pack-${new Date().toISOString().slice(0, 10)}.pdf`;
    return new NextResponse(createSimplePdf(pack.title, pdfLines), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  const filename = `agrivault-${type}-record-pack-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

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
  overview: "Executive overview",
  fields: "Fields and crops",
  activities: "Activities and input evidence",
  finance: "Finance records",
  analytics: "Analytics tables",
  yields: "Yield records",
  overhead: "Overhead and machinery costs",
  trends: "Yield and cost trends",
  performance: "Crop performance",
  breakeven: "Break-even analysis",
  comparison: "Season comparison",
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

function money(value: number) {
  return `MWK ${Math.round(value).toLocaleString("en-MW")}`;
}

function tableRows(headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  const widths = headers.map((header, index) => Math.min(
    Math.max(
      header.length,
      ...rows.slice(0, 30).map((row) => String(row[index] ?? "").length),
    ),
    index === 0 ? 24 : 18,
  ));

  const formatCell = (value: string | number | null | undefined, index: number) => {
    const text = String(value ?? "");
    const clipped = text.length > widths[index] ? `${text.slice(0, Math.max(widths[index] - 3, 0))}...` : text;
    return clipped.padEnd(widths[index], " ");
  };

  return [
    headers.map(formatCell).join("  "),
    widths.map((width) => "-".repeat(width)).join("  "),
    ...rows.map((row) => row.map(formatCell).join("  ")),
  ];
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
    : Object.keys(SECTION_LABELS) as ExportSection[];
  const season = searchParams.get("season")?.trim() || "";
  const cropFieldId = searchParams.get("cropFieldId")?.trim() || "";
  const fieldId = searchParams.get("fieldId")?.trim() || "";
  const lifecycle = searchParams.get("lifecycle") ?? "all";
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const dateRange = {
    ...(from ? { gte: new Date(from) } : {}),
    ...(to ? { lte: new Date(to) } : {}),
  };
  const hasDateRange = Boolean(from || to);
  const cropFilter = {
    ...(season ? { season } : {}),
    ...(cropFieldId ? { id: cropFieldId } : {}),
    ...(lifecycle === "active" ? { isArchived: false, status: "Active" } : {}),
    ...(lifecycle === "archived" ? { isArchived: true } : {}),
  };
  const hasCropFilter = Object.keys(cropFilter).length > 0;

  const [fields, employees, transactions, activities, animals, overheadExpenses] = await Promise.all([
    prisma.field.findMany({
      where: {
        farmId: farm.id,
        ...(fieldId ? { id: fieldId } : {}),
        ...(hasCropFilter ? { cropFields: { some: cropFilter } } : {}),
      },
      include: {
        cropFields: {
          where: cropFilter,
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
      where: {
        farmId: farm.id,
        ...(fieldId ? { fieldId } : {}),
        ...(cropFieldId ? { cropFieldId } : {}),
        ...(season ? { season } : {}),
        ...(hasDateRange ? { date: dateRange } : {}),
        ...(lifecycle === "active" ? { cropField: { isArchived: false, status: "Active" } } : {}),
        ...(lifecycle === "archived" ? { cropField: { isArchived: true } } : {}),
      },
      include: { field: true, cropField: { include: { cropType: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.farmActivity.findMany({
      where: {
        field: { farmId: farm.id, ...(fieldId ? { id: fieldId } : {}) },
        ...(cropFieldId ? { cropFieldId } : {}),
        ...(hasDateRange ? { date: dateRange } : {}),
        ...(hasCropFilter ? { cropField: cropFilter } : {}),
      },
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
      include: {
        livestockType: true,
        healthRecords: true,
        expenses: true,
        productions: true,
        sales: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.overheadExpense.findMany({
      where: {
        farmId: farm.id,
        ...(hasDateRange ? { date: dateRange } : {}),
      },
      orderBy: { date: "desc" },
    }),
  ]);

  const totalArea = fields.reduce((sum, field) => sum + field.totalArea, 0);
  const cultivatableArea = fields.reduce((sum, field) => sum + field.cultivatableArea, 0);
  const income = transactions.filter((t) => t.type === "Income").reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === "Expense").reduce((sum, t) => sum + t.amount, 0);
  const harvestedKg = fields.flatMap((field) => field.cropFields)
    .flatMap((cropField) => cropField.yields)
    .reduce((sum, yieldRecord) => sum + (yieldRecord.unitWeight ? yieldRecord.quantity * yieldRecord.unitWeight : yieldRecord.quantity), 0);
  const cropRows = fields.flatMap((field) => field.cropFields.map((cropField) => {
    const cropActivities = activities.filter((activity) => activity.cropFieldId === cropField.id);
    const cropTransactions = transactions.filter((transaction) => transaction.cropFieldId === cropField.id);
    const inputCost = cropActivities.flatMap((activity) => activity.inputs).reduce((sum, item) => sum + item.totalCost, 0);
    const labourCost = cropActivities.flatMap((activity) => activity.labourRecords).reduce((sum, item) => sum + item.totalCost, 0);
    const otherCost = cropActivities.flatMap((activity) => activity.otherCosts).reduce((sum, item) => sum + item.amount, 0);
    const totalCost = inputCost + labourCost + otherCost;
    const revenue = cropTransactions.filter((transaction) => transaction.type === "Income").reduce((sum, item) => sum + item.amount, 0);
    const totalYieldKg = cropField.yields.reduce((sum, yieldRecord) => sum + (yieldRecord.unitWeight ? yieldRecord.quantity * yieldRecord.unitWeight : yieldRecord.quantity), 0);
    return {
      id: cropField.id,
      fieldName: field.name,
      cropName: cropField.cropType.name,
      variety: cropField.variety,
      season: cropField.season,
      status: cropField.status,
      area: cropField.areaPlanted,
      activityCount: cropActivities.length,
      inputCost,
      labourCost,
      otherCost,
      totalCost,
      revenue,
      netProfit: revenue - totalCost,
      totalYieldKg,
      yieldPerHa: cropField.areaPlanted > 0 ? totalYieldKg / cropField.areaPlanted : 0,
      costPerHa: cropField.areaPlanted > 0 ? totalCost / cropField.areaPlanted : 0,
      costPerKg: totalYieldKg > 0 ? totalCost / totalYieldKg : 0,
    };
  }));
  const cashflowByMonth = Object.values(transactions.reduce((acc, transaction) => {
    const month = transaction.date.toISOString().slice(0, 7);
    if (!acc[month]) acc[month] = { month, income: 0, expenses: 0, net: 0 };
    if (transaction.type === "Income") acc[month].income += transaction.amount;
    else acc[month].expenses += transaction.amount;
    acc[month].net = acc[month].income - acc[month].expenses;
    return acc;
  }, {} as Record<string, { month: string; income: number; expenses: number; net: number }>)).sort((a, b) => a.month.localeCompare(b.month));
  const fieldProfitability = Object.values(cropRows.reduce((acc, crop) => {
    if (!acc[crop.fieldName]) acc[crop.fieldName] = { fieldName: crop.fieldName, area: 0, revenue: 0, cost: 0, netProfit: 0 };
    acc[crop.fieldName].area += crop.area;
    acc[crop.fieldName].revenue += crop.revenue;
    acc[crop.fieldName].cost += crop.totalCost;
    acc[crop.fieldName].netProfit += crop.netProfit;
    return acc;
  }, {} as Record<string, { fieldName: string; area: number; revenue: number; cost: number; netProfit: number }>)).sort((a, b) => b.netProfit - a.netProfit);
  const seasonComparison = Object.values(cropRows.reduce((acc, crop) => {
    if (!acc[crop.season]) acc[crop.season] = { season: crop.season, crops: 0, area: 0, revenue: 0, cost: 0, yieldKg: 0, netProfit: 0 };
    acc[crop.season].crops += 1;
    acc[crop.season].area += crop.area;
    acc[crop.season].revenue += crop.revenue;
    acc[crop.season].cost += crop.totalCost;
    acc[crop.season].yieldKg += crop.totalYieldKg;
    acc[crop.season].netProfit += crop.netProfit;
    return acc;
  }, {} as Record<string, { season: string; crops: number; area: number; revenue: number; cost: number; yieldKg: number; netProfit: number }>)).sort((a, b) => b.season.localeCompare(a.season));
  const livestockProfitability = Object.values(animals.reduce((acc, animal) => {
    const typeName = animal.livestockType.name;
    if (!acc[typeName]) acc[typeName] = { type: typeName, count: 0, sales: 0, production: 0, expenses: 0, health: 0, net: 0 };
    const sales = animal.sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const production = animal.productions.reduce((sum, productionRecord) => sum + (productionRecord.totalValue ?? 0), 0);
    const animalExpenses = animal.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const health = animal.healthRecords.reduce((sum, record) => sum + record.cost, 0);
    acc[typeName].count += 1;
    acc[typeName].sales += sales;
    acc[typeName].production += production;
    acc[typeName].expenses += animalExpenses;
    acc[typeName].health += health;
    acc[typeName].net += sales + production - animalExpenses - health - (animal.acquisitionCost ?? 0);
    return acc;
  }, {} as Record<string, { type: string; count: number; sales: number; production: number; expenses: number; health: number; net: number }>));

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

  if (sections.includes("overview")) {
    section(lines, "Executive Overview", ["Metric", "Value"]);
    [
      ["Fields", fields.length],
      ["Cultivatable area", `${cultivatableArea.toFixed(2)} ha`],
      ["Crop records", cropRows.length],
      ["Activity records", activities.length],
      ["Income", income],
      ["Expenses", expenses],
      ["Net", income - expenses],
      ["Harvested quantity", `${harvestedKg.toFixed(2)} kg`],
    ].forEach((item) => lines.push(row(item)));
  }

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

  if (sections.includes("analytics")) {
    section(lines, "Cashflow By Month", ["Month", "Income", "Expenses", "Net"]);
    cashflowByMonth.forEach((item) => lines.push(row([item.month, item.income, item.expenses, item.net])));
    section(lines, "Crop Profitability Ranking", ["Crop", "Variety", "Field", "Season", "Revenue", "Cost", "Net"]);
    cropRows.sort((a, b) => b.netProfit - a.netProfit).forEach((crop) => lines.push(row([crop.cropName, crop.variety, crop.fieldName, crop.season, crop.revenue, crop.totalCost, crop.netProfit])));
    section(lines, "Field Profitability Comparison", ["Field", "Area", "Revenue", "Cost", "Net", "Profit per ha"]);
    fieldProfitability.forEach((field) => lines.push(row([field.fieldName, field.area, field.revenue, field.cost, field.netProfit, field.area > 0 ? field.netProfit / field.area : 0])));
    section(lines, "Input Efficiency Report", ["Crop", "Field", "Season", "Input cost", "Cost per ha", "Cost per kg", "Yield response"]);
    cropRows.forEach((crop) => lines.push(row([crop.cropName, crop.fieldName, crop.season, crop.inputCost, crop.area > 0 ? crop.inputCost / crop.area : 0, crop.totalYieldKg > 0 ? crop.inputCost / crop.totalYieldKg : 0, crop.inputCost > 0 ? crop.totalYieldKg / crop.inputCost : 0])));
  }

  if (sections.includes("yields")) {
    section(lines, "Yield Records", ["Crop", "Variety", "Field", "Season", "Yield kg", "Yield per ha", "Cost per kg"]);
    cropRows.forEach((crop) => lines.push(row([crop.cropName, crop.variety, crop.fieldName, crop.season, crop.totalYieldKg, crop.yieldPerHa, crop.costPerKg])));
  }

  if (sections.includes("overhead")) {
    section(lines, "Overhead And Machinery Costs", ["Date", "Category", "Description", "Amount", "Recurring", "Notes"]);
    overheadExpenses.forEach((expense) => lines.push(row([expense.date.toISOString().slice(0, 10), expense.category, expense.description, expense.amount, expense.recurring ? "Yes" : "No", expense.notes ?? ""])));
  }

  if (sections.includes("trends")) {
    section(lines, "Yield And Cost Trends", ["Season", "Crop", "Area", "Yield kg", "Yield per ha", "Cost per ha", "Cost per kg"]);
    cropRows.forEach((crop) => lines.push(row([crop.season, crop.cropName, crop.area, crop.totalYieldKg, crop.yieldPerHa, crop.costPerHa, crop.costPerKg])));
  }

  if (sections.includes("performance")) {
    section(lines, "Crop Performance", ["Crop", "Field", "Season", "Activities", "Revenue", "Cost", "Net", "Margin"]);
    cropRows.forEach((crop) => lines.push(row([crop.cropName, crop.fieldName, crop.season, crop.activityCount, crop.revenue, crop.totalCost, crop.netProfit, crop.revenue > 0 ? `${((crop.netProfit / crop.revenue) * 100).toFixed(1)}%` : "0%"])));
  }

  if (sections.includes("breakeven")) {
    section(lines, "Break Even Analysis", ["Crop", "Field", "Season", "Total cost", "Yield kg", "Break-even price per kg"]);
    cropRows.forEach((crop) => lines.push(row([crop.cropName, crop.fieldName, crop.season, crop.totalCost, crop.totalYieldKg, crop.costPerKg])));
  }

  if (sections.includes("comparison")) {
    section(lines, "Season Comparison", ["Season", "Crops", "Area", "Revenue", "Cost", "Yield kg", "Net"]);
    seasonComparison.forEach((seasonRow) => lines.push(row([seasonRow.season, seasonRow.crops, seasonRow.area, seasonRow.revenue, seasonRow.cost, seasonRow.yieldKg, seasonRow.netProfit])));
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
    section(lines, "Livestock Profitability", ["Type", "Count", "Sales", "Production", "Expenses", "Health cost", "Net"]);
    livestockProfitability.forEach((rowItem) => lines.push(row([rowItem.type, rowItem.count, rowItem.sales, rowItem.production, rowItem.expenses, rowItem.health, rowItem.net])));
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

    const pushTable = (
      title: string,
      headers: string[],
      rows: Array<Array<string | number | null | undefined>>,
      maxRows = 80,
    ) => {
      pdfLines.push({ text: title, size: 15, bold: true, color: [2, 132, 199], gapBefore: 18 });
      if (rows.length === 0) {
        pdfLines.push({ text: "No records for the selected filters.", size: 9, color: [71, 85, 105], gapBefore: 4 });
        return;
      }
      for (const line of tableRows(headers, rows.slice(0, maxRows))) {
        pdfLines.push({ text: line, size: 7, mono: true, color: [15, 23, 42], gapBefore: line.startsWith("---") ? 1 : 0 });
      }
      if (rows.length > maxRows) {
        pdfLines.push({ text: `Showing first ${maxRows} of ${rows.length} rows. Use CSV export for the full table.`, size: 8, color: [71, 85, 105], gapBefore: 4 });
      }
    };

    if (sections.includes("overview")) {
      pushTable("Executive overview", ["Metric", "Value"], [
        ["Fields", fields.length],
        ["Cultivatable", `${cultivatableArea.toFixed(2)} ha`],
        ["Crop records", cropRows.length],
        ["Activities", activities.length],
        ["Income", money(income)],
        ["Expenses", money(expenses)],
        ["Net", money(income - expenses)],
        ["Harvested", `${harvestedKg.toFixed(2)} kg`],
      ], 20);
    }

    if (sections.includes("fields")) {
      pushTable("Fields and crops", ["Field", "Crop", "Season", "Status", "Area"], fields.flatMap((field) =>
        field.cropFields.length === 0
          ? [[field.name, "No crop", "", "", field.totalArea.toFixed(2)]]
          : field.cropFields.map((cropField) => [field.name, `${cropField.cropType.name} ${cropField.variety}`, cropField.season, cropField.status, cropField.areaPlanted.toFixed(2)]),
      ));
    }

    if (sections.includes("activities")) {
      pushTable("Activities and input evidence", ["Date", "Activity", "Field", "Crop", "Cost"], activities.map((activity) => {
        const labourCost = activity.labourRecords.reduce((sum, item) => sum + item.totalCost, 0);
        const inputCost = activity.inputs.reduce((sum, item) => sum + item.totalCost, 0);
        const otherCost = activity.otherCosts.reduce((sum, item) => sum + item.amount, 0);
        return [activity.date.toISOString().slice(0, 10), activity.activityType, activity.field.name, activity.cropField?.cropType.name ?? "Whole field", money(labourCost + inputCost + otherCost)];
      }));
    }

    if (sections.includes("finance")) {
      pushTable("Financials", ["Date", "Type", "Category", "Amount", "Crop"], transactions.map((transaction) => [
        transaction.date.toISOString().slice(0, 10),
        transaction.type,
        transaction.category,
        money(transaction.amount),
        transaction.cropField?.cropType.name ?? "",
      ]));
    }

    if (sections.includes("analytics")) {
      pushTable("Cashflow by month", ["Month", "Income", "Expenses", "Net"], cashflowByMonth.map((item) => [item.month, money(item.income), money(item.expenses), money(item.net)]), 36);
      pushTable("Crop profitability ranking", ["Crop", "Field", "Season", "Revenue", "Cost", "Net"], cropRows.sort((a, b) => b.netProfit - a.netProfit).map((crop) => [crop.cropName, crop.fieldName, crop.season, money(crop.revenue), money(crop.totalCost), money(crop.netProfit)]));
      pushTable("Field profitability comparison", ["Field", "Area", "Revenue", "Cost", "Net"], fieldProfitability.map((field) => [field.fieldName, field.area.toFixed(2), money(field.revenue), money(field.cost), money(field.netProfit)]));
      pushTable("Input efficiency report", ["Crop", "Field", "Input cost", "Cost/ha", "Cost/kg"], cropRows.map((crop) => [crop.cropName, crop.fieldName, money(crop.inputCost), money(crop.area > 0 ? crop.inputCost / crop.area : 0), money(crop.totalYieldKg > 0 ? crop.inputCost / crop.totalYieldKg : 0)]));
    }

    if (sections.includes("yields")) {
      pushTable("Yield records", ["Crop", "Field", "Season", "Yield kg", "Yield/ha", "Cost/kg"], cropRows.map((crop) => [crop.cropName, crop.fieldName, crop.season, crop.totalYieldKg.toFixed(2), crop.yieldPerHa.toFixed(2), money(crop.costPerKg)]));
    }

    if (sections.includes("overhead")) {
      pushTable("Overhead and machinery costs", ["Date", "Category", "Description", "Amount"], overheadExpenses.map((expense) => [expense.date.toISOString().slice(0, 10), expense.category, expense.description, money(expense.amount)]));
    }

    if (sections.includes("trends")) {
      pushTable("Yield and cost trends", ["Season", "Crop", "Yield/ha", "Cost/ha", "Cost/kg"], cropRows.map((crop) => [crop.season, crop.cropName, crop.yieldPerHa.toFixed(2), money(crop.costPerHa), money(crop.costPerKg)]));
    }

    if (sections.includes("performance")) {
      pushTable("Crop performance", ["Crop", "Field", "Season", "Activities", "Net"], cropRows.map((crop) => [crop.cropName, crop.fieldName, crop.season, crop.activityCount, money(crop.netProfit)]));
    }

    if (sections.includes("breakeven")) {
      pushTable("Break-even analysis", ["Crop", "Field", "Season", "Cost", "Yield kg", "Price/kg"], cropRows.map((crop) => [crop.cropName, crop.fieldName, crop.season, money(crop.totalCost), crop.totalYieldKg.toFixed(2), money(crop.costPerKg)]));
    }

    if (sections.includes("comparison")) {
      pushTable("Season comparison", ["Season", "Crops", "Area", "Revenue", "Cost", "Net"], seasonComparison.map((seasonRow) => [seasonRow.season, seasonRow.crops, seasonRow.area.toFixed(2), money(seasonRow.revenue), money(seasonRow.cost), money(seasonRow.netProfit)]));
    }

    if (sections.includes("payroll")) {
      pushTable("Payroll capacity", ["Name", "Role", "Rate", "Unit", "Active"], employees.map((employee) => [employee.name, employee.role, money(employee.payRate), employee.payRateUnit, employee.isActive ? "Yes" : "No"]));
    }

    if (sections.includes("livestock")) {
      pushTable("Livestock summary", ["Animal", "Type", "Breed", "Status", "Cost"], animals.map((animal) => [animal.tag ?? animal.name ?? "Animal", animal.livestockType.name, animal.breed ?? "", animal.status, animal.acquisitionCost ? money(animal.acquisitionCost) : ""]));
      pushTable("Livestock profitability", ["Type", "Count", "Sales", "Production", "Health", "Net"], livestockProfitability.map((item) => [item.type, item.count, money(item.sales), money(item.production), money(item.health), money(item.net)]));
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

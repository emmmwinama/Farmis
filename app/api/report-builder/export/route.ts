import { NextResponse } from "next/server";
import { getSessionFarm } from "@/lib/apiHelpers";

const SECTIONS = {
  cropProfitabilityRanking: {
    label: "Crop profitability",
    columns: ["cropName", "variety", "fieldName", "season", "revenue", "totalCost", "netProfit"],
  },
  fieldProfitabilityComparison: {
    label: "Field profitability",
    columns: ["fieldName", "area", "revenue", "cost", "netProfit", "profitPerHa"],
  },
  inputEfficiencyReport: {
    label: "Input efficiency",
    columns: ["cropName", "fieldName", "season", "inputCost", "costPerHa", "costPerKg", "yieldResponse"],
  },
  livestockProfitability: {
    label: "Livestock profitability",
    columns: ["type", "count", "sales", "productionValue", "expenses", "healthCost", "netProfit"],
  },
} as const;

type SectionKey = keyof typeof SECTIONS;

function isSectionKey(value: string): value is SectionKey {
  return value in SECTIONS;
}

function cell(value: unknown) {
  if (typeof value === "number") return Math.round(value).toLocaleString("en-US");
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? "-");
}

function label(column: string) {
  return column
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (char) => char.toUpperCase());
}

function escapePdf(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function clip(text: string, width: number, size: number) {
  const maxChars = Math.max(4, Math.floor(width / (size * 0.52)));
  return text.length > maxChars ? `${text.slice(0, Math.max(maxChars - 3, 1))}...` : text;
}

function metricFor(key: SectionKey) {
  if (key === "fieldProfitabilityComparison") return "profitPerHa";
  if (key === "inputEfficiencyReport") return "yieldResponse";
  return "netProfit";
}

function createTablePdf(title: string, farmName: string, audience: string, generatedAt: Date, selectedSections: SectionKey[], analytics: any) {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;
  const pages: string[][] = [];
  let commands: string[] = [];
  let y = pageHeight - margin;

  const rgb = (color: [number, number, number]) =>
    `${(color[0] / 255).toFixed(3)} ${(color[1] / 255).toFixed(3)} ${(color[2] / 255).toFixed(3)}`;

  const pushPage = () => {
    if (commands.length) pages.push(commands);
    commands = [];
    y = pageHeight - margin;
  };

  const text = (
    value: string,
    x: number,
    yPos: number,
    size = 9,
    font: "F1" | "F2" = "F1",
    color: [number, number, number] = [15, 23, 42],
  ) => {
    commands.push(`${rgb(color)} rg`);
    commands.push(`BT /${font} ${size} Tf ${x.toFixed(2)} ${yPos.toFixed(2)} Td (${escapePdf(value)}) Tj ET`);
  };

  const rect = (
    x: number,
    yPos: number,
    width: number,
    height: number,
    fill?: [number, number, number],
    stroke: [number, number, number] = [226, 232, 240],
  ) => {
    if (fill) commands.push(`${rgb(fill)} rg ${x.toFixed(2)} ${yPos.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f`);
    commands.push(`${rgb(stroke)} RG ${x.toFixed(2)} ${yPos.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re S`);
  };

  const ensureSpace = (height: number) => {
    if (y - height < margin) pushPage();
  };

  const drawHeader = () => {
    rect(margin, y - 96, contentWidth, 96, [15, 23, 42], [15, 23, 42]);
    text("AgriVault", margin + 18, y - 22, 10, "F2", [125, 211, 252]);
    text(title, margin + 18, y - 47, 20, "F2", [255, 255, 255]);
    text(`Farm: ${farmName}`, margin + 18, y - 68, 10, "F1", [226, 232, 240]);
    text(`Audience: ${audience}`, margin + 18, y - 84, 9, "F1", [186, 230, 253]);
    text(`Generated: ${generatedAt.toLocaleString("en-GB")}`, margin + contentWidth - 190, y - 22, 9, "F1", [203, 213, 225]);
    y -= 118;
  };

  const columnWidths = (columns: readonly string[]) => {
    const weights = columns.map((column) => {
      if (/crop|field|type|name/i.test(column)) return 1.25;
      if (/season|count|area|variety/i.test(column)) return 0.72;
      return 1;
    });
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    return weights.map((weight) => (contentWidth * weight) / total);
  };

  const drawTableHeader = (columns: readonly string[], widths: number[]) => {
    const height = 24;
    let x = margin;
    rect(margin, y - height, contentWidth, height, [239, 246, 255], [191, 219, 254]);
    columns.forEach((column, index) => {
      if (index > 0) commands.push(`${rgb([191, 219, 254])} RG ${x.toFixed(2)} ${(y - height).toFixed(2)} m ${x.toFixed(2)} ${y.toFixed(2)} l S`);
      text(clip(label(column), widths[index] - 8, 7), x + 4, y - 15, 7, "F2", [30, 64, 175]);
      x += widths[index];
    });
    y -= height;
  };

  const drawChart = (sectionTitle: string, rows: any[], metric: string) => {
    if (rows.length === 0) return;
    ensureSpace(150);
    const topRows = [...rows]
      .sort((a, b) => Math.abs(Number(b[metric] ?? 0)) - Math.abs(Number(a[metric] ?? 0)))
      .slice(0, 5);
    const max = Math.max(...topRows.map((row) => Math.abs(Number(row[metric] ?? 0))), 1);

    text(`${sectionTitle} snapshot`, margin, y, 11, "F2", [15, 23, 42]);
    y -= 16;
    rect(margin, y - 104, contentWidth, 104, [248, 250, 252], [226, 232, 240]);

    topRows.forEach((row, index) => {
      const name = cell(row.cropName ?? row.fieldName ?? row.type ?? `Item ${index + 1}`);
      const value = Number(row[metric] ?? 0);
      const barWidth = Math.max(4, (Math.abs(value) / max) * (contentWidth - 190));
      const rowY = y - 20 - index * 18;
      text(clip(name, 118, 8), margin + 10, rowY, 8, "F1", [71, 85, 105]);
      rect(margin + 132, rowY - 5, barWidth, 8, value >= 0 ? [14, 165, 233] : [248, 113, 113], value >= 0 ? [14, 165, 233] : [248, 113, 113]);
      text(cell(value), margin + 142 + barWidth, rowY, 8, "F2", value >= 0 ? [2, 132, 199] : [185, 28, 28]);
    });
    y -= 122;
  };

  const drawTable = (sectionTitle: string, columns: readonly string[], rows: any[]) => {
    ensureSpace(72);
    text(sectionTitle, margin, y, 13, "F2", [2, 132, 199]);
    y -= 18;

    if (rows.length === 0) {
      rect(margin, y - 30, contentWidth, 30, [248, 250, 252]);
      text("No records match the selected filters.", margin + 10, y - 19, 9, "F1", [100, 116, 139]);
      y -= 42;
      return;
    }

    const widths = columnWidths(columns);
    drawTableHeader(columns, widths);

    rows.forEach((row, rowIndex) => {
      const rowHeight = 21;
      if (y - rowHeight < margin) {
        pushPage();
        text(sectionTitle, margin, y, 12, "F2", [2, 132, 199]);
        y -= 18;
        drawTableHeader(columns, widths);
      }

      let x = margin;
      rect(margin, y - rowHeight, contentWidth, rowHeight, rowIndex % 2 === 0 ? [255, 255, 255] : [248, 250, 252]);
      columns.forEach((column, index) => {
        if (index > 0) commands.push(`${rgb([226, 232, 240])} RG ${x.toFixed(2)} ${(y - rowHeight).toFixed(2)} m ${x.toFixed(2)} ${y.toFixed(2)} l S`);
        text(clip(cell(row[column]), widths[index] - 8, 7), x + 4, y - 13, 7, "F1", [51, 65, 85]);
        x += widths[index];
      });
      y -= rowHeight;
    });

    y -= 18;
  };

  drawHeader();
  selectedSections.forEach((key) => {
    const section = SECTIONS[key];
    const rows = analytics?.[key] ?? [];
    drawChart(section.label, rows, metricFor(key));
    drawTable(section.label, section.columns, rows);
  });
  pushPage();

  const objects: string[] = [
    "",
    "",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];
  const pageIds: number[] = [];

  pages.forEach((page, index) => {
    const footer = [
      `${rgb([100, 116, 139])} rg`,
      `BT /F1 8 Tf ${margin} 20 Td (${escapePdf(`Generated by AgriVault - Page ${index + 1} of ${pages.length}`)}) Tj ET`,
    ];
    const stream = ["q", ...page, ...footer, "Q"].join("\n");
    const streamId = objects.length + 1;
    objects.push(`<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`);
    const pageId = objects.length + 1;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${streamId} 0 R >>`);
    pageIds.push(pageId);
  });

  objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  const ordered = objects.map((body, index) => `${index + 1} 0 obj\n${body}\nendobj\n`);
  const header = "%PDF-1.4\n";
  let offset = Buffer.byteLength(header, "utf8");
  const offsets = [0];
  for (const object of ordered) {
    offsets.push(offset);
    offset += Buffer.byteLength(object, "utf8");
  }
  const xrefStart = offset;
  const xref = [
    `xref\n0 ${ordered.length + 1}`,
    "0000000000 65535 f ",
    ...offsets.slice(1).map((item) => `${String(item).padStart(10, "0")} 00000 n `),
    `trailer\n<< /Size ${ordered.length + 1} /Root 1 0 R >>`,
    `startxref\n${xrefStart}\n%%EOF`,
  ].join("\n");

  return Buffer.from(header + ordered.join("") + xref, "utf8");
}

export async function GET(req: Request) {
  const { farm } = await getSessionFarm();
  if (!farm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const title = url.searchParams.get("title")?.trim() || "AgriVault Custom Report";
  const audience = url.searchParams.get("audience")?.trim() || "Stakeholder report";
  const selected = url.searchParams.getAll("section").filter(isSectionKey);
  const sections = selected.length ? selected : Object.keys(SECTIONS) as SectionKey[];

  const reportParams = new URLSearchParams();
  for (const key of ["season", "fieldId", "cropFieldId", "from", "to"]) {
    const value = url.searchParams.get(key);
    if (value) reportParams.set(key, value);
  }
  const lifecycle = url.searchParams.get("lifecycle");
  if (lifecycle === "active") reportParams.set("includeArchived", "false");
  if (lifecycle === "archived") reportParams.set("includeArchived", "true");

  const reportUrl = new URL(`/api/reports?${reportParams}`, url.origin);
  const response = await fetch(reportUrl, {
    headers: { cookie: req.headers.get("cookie") ?? "" },
  });
  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json({ error: data?.error ?? "Failed to build report" }, { status: response.status });
  }

  return new NextResponse(createTablePdf(title, farm.name, audience, new Date(), sections, data?.analytics ?? {}), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="agrivault-custom-report.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

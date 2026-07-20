"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2, Printer } from "lucide-react";

const SECTIONS = [
  { key: "summary", label: "Farm summary", source: "summary", columns: ["totalCrops", "totalArea", "totalKgHarvested", "avgYieldPerHa", "totalRevenue", "totalExpenses", "allocatedOverhead"] },
  { key: "crops", label: "Crop records", source: "crops", columns: ["cropName", "variety", "fieldName", "season", "areaPlanted", "status", "revenue", "totalCost", "netProfit"] },
  { key: "transactions", label: "Finance transactions", source: "finance.transactions", columns: ["date", "type", "category", "amount", "description", "season"] },
  { key: "cashflowByMonth", label: "Cashflow by month", source: "finance.cashflowByMonth", columns: ["month", "income", "expense", "net"] },
  { key: "yields", label: "Yield records", source: "yields", columns: ["cropName", "variety", "fieldName", "season", "harvestDate", "quantityKg", "yieldPerHa", "costPerKg"] },
  { key: "cropProfitabilityRanking", label: "Crop profitability", columns: ["cropName", "variety", "fieldName", "season", "revenue", "totalCost", "netProfit"] },
  { key: "fieldProfitabilityComparison", label: "Field profitability", columns: ["fieldName", "area", "revenue", "cost", "netProfit", "profitPerHa"] },
  { key: "inputEfficiencyReport", label: "Input efficiency", columns: ["cropName", "fieldName", "season", "inputCost", "costPerHa", "costPerKg", "yieldResponse"] },
  { key: "livestockProfitability", label: "Livestock profitability", columns: ["type", "count", "sales", "productionValue", "expenses", "healthCost", "netProfit"] },
];

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function sectionRows(data: any, section: any) {
  if (!data) return [];
  if (!section.source) return data?.analytics?.[section.key] ?? [];
  if (section.source === "summary") return [data.summary ?? {}];
  return section.source.split(".").reduce((value: any, key: string) => value?.[key], data) ?? [];
}

export default function ReportBuilderPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("AgriVault Custom Report");
  const [audience, setAudience] = useState("Stakeholder report");
  const [selected, setSelected] = useState(SECTIONS.map((section) => section.key));
  const [fields, setFields] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    season: "",
    fieldId: "",
    cropFieldId: "",
    lifecycle: "all",
    from: "",
    to: "",
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.season) params.set("season", filters.season);
    if (filters.fieldId) params.set("fieldId", filters.fieldId);
    if (filters.cropFieldId) params.set("cropFieldId", filters.cropFieldId);
    if (filters.lifecycle !== "all") params.set("includeArchived", filters.lifecycle === "archived" ? "true" : "false");
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);

    setLoading(true);
    Promise.all([
      fetch(`/api/reports?${params}`).then((res) => res.json()),
      fetch("/api/fields").then((res) => res.json()).catch(() => []),
      fetch("/api/crops?archived=both").then((res) => res.json()).catch(() => []),
    ]).then(([reportData, fieldData, cropData]) => {
      setData(reportData);
      setFields(Array.isArray(fieldData) ? fieldData : []);
      setCrops(Array.isArray(cropData) ? cropData : []);
      setLoading(false);
    });
  }, [filters]);

  const rows = useMemo(() => {
    return SECTIONS.filter((section) => selected.includes(section.key)).flatMap((section) => {
      const items = sectionRows(data, section);
      return [
        { __section: section.label },
        ...items.map((item: any) => ({ __section: section.label, ...item })),
      ];
    });
  }, [data, selected]);

  const csv = useMemo(() => {
    const lines = [
      [title],
      [`Audience: ${audience}`],
      [`Generated: ${new Date().toISOString()}`],
      [],
    ].map((line) => line.map(csvCell).join(","));

    for (const section of SECTIONS.filter((item) => selected.includes(item.key))) {
      lines.push("");
      lines.push(csvCell(section.label));
      lines.push(section.columns.map(csvCell).join(","));
      for (const row of sectionRows(data, section)) {
        lines.push(section.columns.map((column) => csvCell(row[column])).join(","));
      }
    }
    return lines.join("\n");
  }, [audience, data, selected, title]);

  const exportParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("title", title);
    params.set("audience", audience);
    for (const section of selected) params.append("section", section);
    if (filters.season) params.set("season", filters.season);
    if (filters.fieldId) params.set("fieldId", filters.fieldId);
    if (filters.cropFieldId) params.set("cropFieldId", filters.cropFieldId);
    if (filters.lifecycle !== "all") params.set("lifecycle", filters.lifecycle);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    return params.toString();
  }, [audience, filters, selected, title]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="page-header flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Custom report builder</h1>
          <p className="page-subtitle">Choose columns, sections, filters, and branding for any reporting audience.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="btn-secondary min-h-11"><Printer size={16} /> Print</button>
          <a href={`/api/report-builder/export?${exportParams}`} className="btn-secondary min-h-11">
            <FileText size={16} /> Export PDF
          </a>
          <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download="agrivault-custom-report.csv" className="btn-primary min-h-11">
            <Download size={16} /> Export CSV
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <div className="card p-5 h-fit">
          <p className="text-sm font-black mb-4" style={{ color: "var(--text-primary)" }}>Report setup</p>
          <div className="flex flex-col gap-3">
            <input className="input min-h-12" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input className="input min-h-12" value={audience} onChange={(e) => setAudience(e.target.value)} />
            <input className="input min-h-12" placeholder="Season e.g. 2026A" value={filters.season}
                   onChange={(e) => setFilters((current) => ({ ...current, season: e.target.value }))} />
            <select className="input min-h-12" value={filters.fieldId}
                    onChange={(e) => setFilters((current) => ({ ...current, fieldId: e.target.value, cropFieldId: "" }))}>
              <option value="">All fields</option>
              {fields.map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}
            </select>
            <select className="input min-h-12" value={filters.cropFieldId}
                    onChange={(e) => setFilters((current) => ({ ...current, cropFieldId: e.target.value }))}>
              <option value="">All crops</option>
              {crops
                .filter((crop) => !filters.fieldId || crop.fieldId === filters.fieldId)
                .map((crop) => <option key={crop.id} value={crop.id}>{crop.cropTypeName} {crop.variety} - {crop.season}</option>)}
            </select>
            <select className="input min-h-12" value={filters.lifecycle}
                    onChange={(e) => setFilters((current) => ({ ...current, lifecycle: e.target.value }))}>
              <option value="all">Active and archived</option>
              <option value="active">Active only</option>
              <option value="archived">Archived only</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input className="input min-h-12" type="date" value={filters.from}
                     onChange={(e) => setFilters((current) => ({ ...current, from: e.target.value }))} />
              <input className="input min-h-12" type="date" value={filters.to}
                     onChange={(e) => setFilters((current) => ({ ...current, to: e.target.value }))} />
            </div>
            {SECTIONS.map((section) => (
              <label key={section.key} className="min-h-12 rounded-2xl px-4 flex items-center gap-3 cursor-pointer" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                <input type="checkbox" className="h-5 w-5" checked={selected.includes(section.key)}
                       onChange={() => setSelected((current) => current.includes(section.key) ? current.filter((item) => item !== section.key) : [...current, section.key])} />
                <span className="text-sm font-bold" style={{ color: "var(--text-secondary)" }}>{section.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-6 py-5" style={{ background: "#0F172A", color: "white" }}>
            <p className="text-2xl font-black">{title}</p>
            <p className="text-sm text-sky-100 mt-1">{audience} - Generated by AgriVault</p>
          </div>
          <div className="p-6 flex flex-col gap-6">
            {SECTIONS.filter((section) => selected.includes(section.key)).map((section) => (
              <div key={section.key}>
                <div className="flex items-center gap-2 mb-3">
                  <FileSpreadsheet size={17} style={{ color: "#0284C7" }} />
                  <p className="text-sm font-black" style={{ color: "var(--text-primary)" }}>{section.label}</p>
                </div>
                <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid var(--border)" }}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border)" }}>
                        {section.columns.map((column) => <th key={column} className="px-4 py-3 text-left font-black">{column}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {sectionRows(data, section).slice(0, 20).map((row: any, index: number) => (
                        <tr key={index} style={{ borderBottom: "1px solid var(--border)" }}>
                          {section.columns.map((column) => <td key={column} className="px-4 py-3">{String(row[column] ?? "-")}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            {rows.length === 0 && <p className="text-sm" style={{ color: "var(--text-muted)" }}>Select at least one section.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

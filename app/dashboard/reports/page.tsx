"use client";

import { useEffect, useState } from "react";
import { Loader2, FileBarChart, Download } from "lucide-react";

function ExportMenu() {
    const [open, setOpen] = useState(false);

    const types = [
        { key: "transactions", label: "Transactions CSV" },
        { key: "activities", label: "Activities CSV" },
        { key: "yields", label: "Yields CSV" },
        { key: "inventory", label: "Inventory CSV" },
        { key: "employees", label: "Employees CSV" },
    ];

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="btn-secondary text-xs flex items-center gap-2"
            >
                <Download size={13} />
                Export
                <ChevronDown size={11} />
            </button>

            {open && (
                <div
                    className="absolute right-0 top-full mt-2 z-30 rounded-xl overflow-hidden"
                    style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        boxShadow: "0 8px 24px rgba(28,25,23,0.12)",
                        minWidth: "200px",
                    }}
                >
                    {types.map(({ key, label }) => (
                        <a
                            key={key}
                            href={`/api/export?type=${key}`}
                            download
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors"
                            style={{ color: "var(--text-secondary)" }}
                            onMouseOver={(e) =>
                                (e.currentTarget.style.background =
                                    "var(--bg-subtle)")
                            }
                            onMouseOut={(e) =>
                                (e.currentTarget.style.background =
                                    "transparent")
                            }
                        >
                            <Download size={12} />
                            {label}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}

function fmt(n: number) { return new Intl.NumberFormat("en-MW").format(Math.round(n)); }
function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const REPORTS = [
    { key: "season", label: "Season report" },
    { key: "crop", label: "Crop report" },
    { key: "field", label: "Field report" },
    { key: "cropField", label: "Crop detail" },
    { key: "employee", label: "Labour report" },
    { key: "input", label: "Input report" },
    { key: "inventory", label: "Inventory report" },
];

export default function ReportsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeReport, setActiveReport] = useState("season");

    useEffect(() => {
        fetch("/api/reports").then((r) => r.json()).then((d) => { setData(d); setLoading(false); });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-[#1a3d1f] border-t-transparent animate-spin" />
                    <p className="text-sm text-slate-400">Building your reports...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">

            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports</h1>
                    <p className="text-slate-400 text-sm mt-1">Comprehensive farm performance analytics</p>
                </div>
            </div>

            {/* Finance summary */}
            {data?.financeSummary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: "Total revenue", value: `MWK ${fmt(data.financeSummary.totalRevenue ?? 0)}`, color: "text-green-600 dark:text-green-400" },
                        { label: "Total costs", value: `MWK ${fmt(data.financeSummary.totalCost ?? 0)}`, color: "text-red-500" },
                        { label: "Gross profit", value: `MWK ${fmt(Math.abs(data.financeSummary.grossProfit ?? 0))}`, color: (data.financeSummary.grossProfit ?? 0) >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-500" },
                        { label: "Inventory revenue", value: `MWK ${fmt(data.financeSummary.totalInventoryRevenue ?? 0)}`, color: "text-purple-600 dark:text-purple-400" },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">{label}</p>
                            <p className={`text-xl font-black ${color}`}>{value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Report selector */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {REPORTS.map(({ key, label }) => (
                    <button key={key} onClick={() => setActiveReport(key)}
                            className={`h-9 px-4 rounded-xl text-sm font-bold transition-colors ${
                                activeReport === key
                                    ? "bg-[#1a3d1f] text-white"
                                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-[#1a3d1f]"
                            }`}>
                        {label}
                    </button>
                ))}
            </div>

            {/* Season report */}
            {activeReport === "season" && (
                <ReportTable
                    title="Season performance"
                    subtitle="Revenue, costs and yield per growing season"
                    columns={["Season", "Area (ha)", "Crops", "Activity cost", "Revenue", "Gross profit", "Cost/ha", "Yield/ha"]}
                    rows={(data?.seasonReport ?? []).map((s: any) => [
                        s.season,
                        s.totalArea?.toFixed(1) ?? "—",
                        (s.crops ?? []).join(", "),
                        `MWK ${fmt(s.totalActivityCost ?? 0)}`,
                        `MWK ${fmt(s.totalRevenue ?? 0)}`,
                        { value: `MWK ${fmt(Math.abs(s.grossProfit ?? 0))}`, color: (s.grossProfit ?? 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500" },
                        s.costPerHectare ? `MWK ${fmt(s.costPerHectare)}` : "—",
                        s.yieldPerHectare ? `${fmt(s.yieldPerHectare)} kg` : "—",
                    ])}
                />
            )}

            {/* Crop report */}
            {activeReport === "crop" && (
                <ReportTable
                    title="Crop type performance"
                    subtitle="Aggregated across all fields and seasons"
                    columns={["Crop", "Records", "Area (ha)", "Total cost", "Total revenue", "Gross profit", "Cost/ha", "Yield/ha"]}
                    rows={(data?.cropReport ?? []).map((c: any) => [
                        c.cropName,
                        String(c.count),
                        c.totalArea?.toFixed(1) ?? "—",
                        `MWK ${fmt(c.totalActivityCost ?? 0)}`,
                        `MWK ${fmt(c.totalRevenue ?? 0)}`,
                        { value: `MWK ${fmt(Math.abs(c.grossProfit ?? 0))}`, color: (c.grossProfit ?? 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500" },
                        c.costPerHectare ? `MWK ${fmt(c.costPerHectare)}` : "—",
                        c.yieldPerHectare ? `${fmt(c.yieldPerHectare)} kg` : "—",
                    ])}
                />
            )}

            {/* Field report */}
            {activeReport === "field" && (
                <ReportTable
                    title="Field performance"
                    subtitle="Per-field cost and yield breakdown"
                    columns={["Field", "Area (ha)", "Crops", "Seasons", "Total cost", "Revenue", "Gross profit", "Yield/ha"]}
                    rows={(data?.fieldReport ?? []).map((f: any) => [
                        f.fieldName,
                        f.totalAreaPlanted?.toFixed(1) ?? "—",
                        (f.crops ?? []).join(", "),
                        (f.seasons ?? []).length.toString(),
                        `MWK ${fmt(f.totalCost ?? 0)}`,
                        `MWK ${fmt(f.totalRevenue ?? 0)}`,
                        { value: `MWK ${fmt(Math.abs(f.grossProfit ?? 0))}`, color: (f.grossProfit ?? 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500" },
                        f.yieldPerHectare ? `${fmt(f.yieldPerHectare)} kg` : "—",
                    ])}
                />
            )}

            {/* Crop-field detail */}
            {activeReport === "cropField" && (
                <ReportTable
                    title="Crop-field detail"
                    subtitle="Every crop record with full cost and yield breakdown"
                    columns={["Crop", "Field", "Season", "Area", "Activities", "Total cost", "Revenue", "Profit", "Yield (kg)", "Cost/kg"]}
                    rows={(data?.cropFieldDetail ?? []).map((cf: any) => [
                        `${cf.cropName} (${cf.variety})`,
                        cf.fieldName,
                        cf.season,
                        `${cf.areaPlanted} ha`,
                        String(cf.activityCount),
                        `MWK ${fmt(cf.totalCost ?? 0)}`,
                        `MWK ${fmt(cf.totalRevenue ?? 0)}`,
                        { value: `MWK ${fmt(Math.abs(cf.grossProfit ?? 0))}`, color: (cf.grossProfit ?? 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500" },
                        cf.totalYieldKg > 0 ? fmt(cf.totalYieldKg) : "—",
                        cf.costPerKg ? `MWK ${fmt(cf.costPerKg)}` : "—",
                    ])}
                />
            )}

            {/* Employee report */}
            {activeReport === "employee" && (
                <ReportTable
                    title="Labour report"
                    subtitle="Employee contribution across all activities"
                    columns={["Employee", "Role", "Days worked", "Hours worked", "Activities", "Total earned"]}
                    rows={(data?.employeeReport ?? []).map((e: any) => [
                        e.name,
                        e.role,
                        String(Math.round(e.totalDays)),
                        String(Math.round(e.totalHours)),
                        String(e.activities),
                        `MWK ${fmt(e.totalEarned)}`,
                    ])}
                />
            )}

            {/* Input report */}
            {activeReport === "input" && (
                <ReportTable
                    title="Input usage report"
                    subtitle="All farm inputs used across activities"
                    columns={["Input", "Category", "Unit", "Total qty", "Usage count", "Total cost"]}
                    rows={(data?.inputReport ?? []).map((i: any) => [
                        i.inputName,
                        i.category,
                        i.unit,
                        String(Math.round(i.totalQuantity)),
                        String(i.usageCount),
                        `MWK ${fmt(i.totalCost)}`,
                    ])}
                />
            )}

            {/* Inventory report */}
            {activeReport === "inventory" && (
                <ReportTable
                    title="Inventory & sales report"
                    subtitle="Crop harvest inventory and sales reconciliation"
                    columns={["Item", "Category", "Season", "Field", "Qty available", "Total sold", "Revenue", "Avg price"]}
                    rows={(data?.inventoryReport ?? []).map((i: any) => [
                        i.name,
                        i.category,
                        i.season ?? "—",
                        i.fieldName ?? "—",
                        `${fmt(i.quantity)} ${i.unit}`,
                        i.totalSold > 0 ? fmt(i.totalSold) : "—",
                        i.totalRevenue > 0 ? `MWK ${fmt(i.totalRevenue)}` : "—",
                        i.avgPricePerUnit > 0 ? `MWK ${fmt(i.avgPricePerUnit)}` : "—",
                    ])}
                />
            )}
        </div>
    );
}

function ReportTable({ title, subtitle, columns, rows }: {
    title: string; subtitle: string;
    columns: string[];
    rows: Array<Array<string | { value: string; color: string }>>;
}) {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            </div>
            {rows.length === 0 ? (
                <div className="p-12 text-center">
                    <FileBarChart size={32} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No data yet</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                            {columns.map((col) => (
                                <th key={col} className="text-left text-xs font-bold text-slate-400 uppercase tracking-wide px-5 py-3">{col}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {rows.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                {row.map((cell, j) => (
                                    <td key={j} className={`px-5 py-3.5 ${j === 0 ? "font-bold text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"} ${typeof cell === "object" ? cell.color : ""}`}>
                                        {typeof cell === "object" ? cell.value : cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
"use client";

import { useEffect, useState } from "react";
import {
    Loader2, Filter,
    TrendingUp, TrendingDown, Minus,
    ArrowUpRight, ArrowDownRight,
    Download,
} from "lucide-react";
import {
    LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer,
    ReferenceLine,
} from "recharts";

function fmt(n: number) {
    return new Intl.NumberFormat("en-MW").format(Math.round(n));
}
function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
    });
}
function fmtKg(kg: number) {
    if (kg >= 1000) return `${(kg / 1000).toFixed(2)} t`;
    return `${fmt(kg)} kg`;
}
function shortSeason(s: string) {
    const match = s.match(/(\d{2,4})\/(\d{2,4})/);
    if (match) return `${match[1].slice(-2)}/${match[2].slice(-2)}`;
    return s.slice(0, 8);
}

const CROP_COLORS = [
    "#0D9488", "#10B981", "#3B82F6", "#8B5CF6",
    "#06B6D4", "#EF4444", "#EC4899", "#06B6D4",
];

const CustomTooltip = ({ active, payload, label, formatter }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border p-3 text-xs shadow-lg"
             style={{ background: "var(--bg-card)", borderColor: "var(--border)", minWidth: 160 }}>
            <p className="font-extrabold mb-2" style={{ color: "var(--text-primary)" }}>{label}</p>
            {payload.map((p: any) => (
                <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-1">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full flex-shrink-0"
                             style={{ background: p.color }} />
                        <span style={{ color: "var(--text-secondary)" }}>{p.name}</span>
                    </div>
                    <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                        {formatter ? formatter(p.value) : p.value}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default function ReportsPage() {
    const [data,          setData]          = useState<any>(null);
    const [trendsData,    setTrendsData]    = useState<any>(null);
    const [loading,       setLoading]       = useState(true);
    const [season,        setSeason]        = useState("all");
    const [archived,      setArchived]      = useState<"active" | "archived" | "both">("active");
    const [seasons,       setSeasons]       = useState<string[]>([]);
    const [activeTab,     setActiveTab]     = useState<"overview" | "crops" | "finance" | "yields" | "overhead" |
    "trends"   | "performance" | "breakeven" | "comparison"
    >("overview");
    const [compareA,      setCompareA]      = useState("");
    const [compareB,      setCompareB]      = useState("");
    const [selectedCrops, setSelectedCrops] = useState<string[]>([]);

    const load = async () => {
        setLoading(true);
        try {
            const [activeCrops, archivedCrops] = await Promise.all([
                fetch("/api/crops?archived=false").then(async (r) => {
                    const t = await r.text(); return t ? JSON.parse(t) : [];
                }),
                fetch("/api/crops?archived=true").then(async (r) => {
                    const t = await r.text(); return t ? JSON.parse(t) : [];
                }),
            ]);

            const uniqueSeasons = [...new Set(
                [...(Array.isArray(activeCrops)   ? activeCrops   : []),
                    ...(Array.isArray(archivedCrops) ? archivedCrops : [])]
                    .map((c: any) => c.season).filter(Boolean)
            )].sort().reverse() as string[];
            setSeasons(uniqueSeasons);

            const params = new URLSearchParams();
            if (season !== "all")    params.set("season", season);
            if (archived !== "both") params.set("includeArchived",
                archived === "archived" ? "true" : "false");

            const [reportRes, trendsRes] = await Promise.all([
                fetch(`/api/reports?${params}`).then(async (r) => {
                    const t = await r.text(); return t ? JSON.parse(t) : null;
                }),
                fetch("/api/reports/trends").then(async (r) => {
                    const t = await r.text(); return t ? JSON.parse(t) : null;
                }),
            ]);

            setData(reportRes);
            setTrendsData(trendsRes);

            if (trendsRes?.allSeasons?.length >= 2 && !compareA) {
                setCompareA(trendsRes.allSeasons[trendsRes.allSeasons.length - 1]);
                setCompareB(trendsRes.allSeasons[trendsRes.allSeasons.length - 2] ?? "");
            }
            if (trendsRes?.allCropTypes && selectedCrops.length === 0) {
                setSelectedCrops(trendsRes.allCropTypes);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [season, archived]);

    const summary      = data?.summary                  ?? {};
    const crops        = data?.crops                    ?? [];
    const finance      = data?.finance                  ?? {};
    const yields       = data?.yields                   ?? [];
    const overhead     = data?.overheadAllocationSummary ?? {};
    const netProfit    = (summary.totalRevenue ?? 0) - (summary.totalExpenses ?? 0);
    const isProfitable = netProfit >= 0;

    const allCropTypes   = trendsData?.allCropTypes ?? [];
    const allSeasonsList = trendsData?.allSeasons   ?? [];

    const TABS = [
        { key: "overview",    label: "Overview"            },
        { key: "crops",       label: "Crop summary"        },
        { key: "finance",     label: "Financials"          },
        { key: "yields",      label: "Yields"              },
        { key: "overhead",    label: "Overhead"            },
        { key: "trends",      label: "Yield trends"     },
        { key: "performance", label: "Crop performance" },
        { key: "breakeven",   label: "Break-even"       },
        { key: "comparison",  label: "Season compare"   },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto">

            {/* Header */}
            <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black"
                        style={{ color: "var(--text-primary)", letterSpacing: "-0.04em" }}>
                        Reports
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                        Costs from activities - overhead allocated by area - revenue from sales
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <a
                        href="/api/export/records?type=audit&format=pdf&section=fields&section=activities&section=finance&section=payroll&section=livestock"
                        className="btn-primary min-h-11"
                    >
                        <Download size={16} />
                        Export PDF
                    </a>
                    <a href="/dashboard/records" className="btn-secondary min-h-11">
                        Build pack
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                {[
                    "Cashflow by month for loan repayment planning",
                    "Input efficiency by crop and field",
                    "Buyer traceability report by crop lot",
                ].map((label) => (
                    <div key={label} className="rounded-2xl p-4"
                         style={{ background: "#F0F9FF", border: "1px solid #BAE6FD" }}>
                        <p className="text-xs font-bold" style={{ color: "#075985" }}>{label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex items-end gap-4 mb-6 flex-wrap">
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                           style={{ color: "var(--text-muted)" }}>Season</label>
                    <select value={season} onChange={(e) => setSeason(e.target.value)}
                            className="h-10 px-3 rounded-xl text-sm outline-none"
                            style={{ border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-primary)" }}>
                        <option value="all">All seasons</option>
                        {seasons.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                           style={{ color: "var(--text-muted)" }}>Records</label>
                    <div className="flex rounded-xl overflow-hidden"
                         style={{ border: "1px solid var(--border)" }}>
                        {([
                            { key: "active",   label: "Active"   },
                            { key: "archived", label: "Archived" },
                            { key: "both",     label: "Both"     },
                        ] as const).map(({ key, label }) => (
                            <button key={key} onClick={() => setArchived(key)}
                                    className="h-10 px-4 text-sm font-bold transition-all"
                                    style={{
                                        background: archived === key
                                            ? key === "archived" ? "#7C3AED" : "var(--farm-green)"
                                            : "var(--bg-card)",
                                        color: archived === key ? "white" : "var(--text-muted)",
                                    }}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {(season !== "all" || archived !== "active") && (
                    <button onClick={() => { setSeason("all"); setArchived("active"); }}
                            className="flex items-center gap-2 h-10 px-3 rounded-xl text-xs font-bold"
                            style={{ background: "var(--bg-subtle)", color: "#EF4444", border: "1px solid var(--border)" }}>
                        <Filter size={12} /> Clear filters
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {TABS.map(({ key, label }) => (
                    <button key={key}
                            onClick={() => setActiveTab(key as any)}
                            className="h-10 px-5 rounded-xl text-sm font-bold whitespace-nowrap flex-shrink-0 transition-all"
                            style={{
                                background: activeTab === key ? "var(--farm-green)" : "var(--bg-card)",
                                color:      activeTab === key ? "white"              : "var(--text-secondary)",
                                border:     `1.5px solid ${activeTab === key ? "transparent" : "var(--border)"}`,
                            }}>
                        {label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={24} className="animate-spin" style={{ color: "var(--farm-green)" }} />
                </div>
            ) : !data ? (
                <NoData label="No data available - add crops and activities to generate reports" />
            ) : (
                <>
                    {/* -- OVERVIEW ------------------------------------------- */}
                    {activeTab === "overview" && (
                        <div className="flex flex-col gap-6">

                            {/* Top stat cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: "Total crops",     value: String(summary.totalCrops ?? 0),       color: "var(--farm-green)" },
                                    { label: "Area tracked",    value: `${(summary.totalArea ?? 0).toFixed(2)} ha`, color: "#2563EB"      },
                                    { label: "Total harvested", value: fmtKg(summary.totalKgHarvested ?? 0),  color: "#0284C7"           },
                                    { label: "Avg yield / ha",  value: (summary.avgYieldPerHa ?? 0) > 0
                                            ? `${fmt(summary.avgYieldPerHa)} kg/ha` : "-",                        color: "#9333EA"           },
                                ].map(({ label, value, color }) => (
                                    <div key={label} className="rounded-2xl p-5"
                                         style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
                                        <p className="text-[10px] font-black uppercase tracking-widest mb-2"
                                           style={{ color: "var(--text-muted)" }}>{label}</p>
                                        <p className="text-2xl font-black" style={{ color }}>{value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* P&L */}
                            <div className="rounded-2xl p-6"
                                 style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                                        Profit & Loss
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        {isProfitable
                                            ? <TrendingUp  size={16} style={{ color: "#16A34A" }} />
                                            : <TrendingDown size={16} style={{ color: "#DC2626" }} />}
                                        <span className="text-sm font-extrabold"
                                              style={{ color: isProfitable ? "#16A34A" : "#DC2626" }}>
                                            {isProfitable ? "Profitable" : "Loss-making"}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-5">
                                    <div className="rounded-xl p-4"
                                         style={{ background: "#ECFDF5", border: "1.5px solid #86EFAC" }}>
                                        <p className="text-xs font-bold mb-1" style={{ color: "#166534" }}>Revenue (sales)</p>
                                        <p className="text-xl font-black" style={{ color: "#16A34A" }}>
                                            MWK {fmt(summary.totalRevenue ?? 0)}
                                        </p>
                                    </div>
                                    <div className="rounded-xl p-4"
                                         style={{ background: "#FEF2F2", border: "1.5px solid #FCA5A5" }}>
                                        <p className="text-xs font-bold mb-1" style={{ color: "#7F1D1D" }}>Total expenses</p>
                                        <p className="text-xl font-black" style={{ color: "#DC2626" }}>
                                            MWK {fmt(summary.totalExpenses ?? 0)}
                                        </p>
                                    </div>
                                    <div className="rounded-xl p-4"
                                         style={{
                                             background: isProfitable ? "#EFF6FF" : "#FEF2F2",
                                             border: `1.5px solid ${isProfitable ? "#BFDBFE" : "#FCA5A5"}`,
                                         }}>
                                        <p className="text-xs font-bold mb-1"
                                           style={{ color: isProfitable ? "#1E3A8A" : "#7F1D1D" }}>Net profit</p>
                                        <p className="text-xl font-black"
                                           style={{ color: isProfitable ? "#2563EB" : "#DC2626" }}>
                                            {netProfit < 0 ? "-" : ""}MWK {fmt(Math.abs(netProfit))}
                                        </p>
                                    </div>
                                </div>

                                {/* Expense breakdown */}
                                <div className="rounded-xl p-4"
                                     style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                                    <p className="text-xs font-extrabold uppercase tracking-wider mb-3"
                                       style={{ color: "var(--text-muted)" }}>Expense breakdown</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {[
                                            { label: "Inputs",           value: crops.reduce((s: number, c: any) => s + (c.inputCost  ?? 0), 0), color: "#0284C7" },
                                            { label: "Labour",           value: crops.reduce((s: number, c: any) => s + (c.labourCost ?? 0), 0), color: "#9333EA" },
                                            { label: "Other costs",      value: crops.reduce((s: number, c: any) => s + (c.otherCost  ?? 0), 0), color: "#0891B2" },
                                            { label: "Overhead (share)", value: summary.allocatedOverhead ?? 0,                                   color: "#64748B" },
                                        ].map(({ label, value, color }) => (
                                            <div key={label} className="rounded-xl p-3"
                                                 style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                                                <p className="text-[9px] font-black uppercase tracking-wide mb-1"
                                                   style={{ color: "var(--text-muted)" }}>{label}</p>
                                                <p className="text-sm font-extrabold" style={{ color }}>
                                                    MWK {fmt(value)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                    {(summary.totalOverhead ?? 0) > 0 && (
                                        <div className="mt-3 rounded-xl p-3"
                                             style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                —ï¸ Overhead: MWK {fmt(summary.totalOverhead)} total  - 
                                                MWK {fmt(summary.allocatedOverhead ?? 0)} allocated
                                                {(summary.unallocatedOverhead ?? 0) > 0 && (
                                                    <span style={{ color: "#0284C7" }}>
                                                        {" "} -  MWK {fmt(summary.unallocatedOverhead)} unallocated (no crops active)
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* By season table */}
                            {(summary.bySeasonBreakdown ?? []).length > 0 && (
                                <div className="rounded-2xl overflow-hidden"
                                     style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                                    <div className="px-5 py-4"
                                         style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                                        <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                                            By season
                                        </p>
                                    </div>
                                    <table className="w-full text-sm">
                                        <thead>
                                        <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                            {["Season", "Crops", "Area (ha)", "Expenses", "Revenue", "Net profit"].map((h) => (
                                                <th key={h} className="text-left py-3 px-5 text-[10px] font-black uppercase tracking-widest"
                                                    style={{ color: "var(--text-muted)" }}>{h}</th>
                                            ))}
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {summary.bySeasonBreakdown.map((row: any) => {
                                            const net = (row.revenue ?? 0) - (row.expenses ?? 0);
                                            return (
                                                <tr key={row.season}
                                                    style={{ borderBottom: "1px solid var(--border)" }}
                                                    onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
                                                    onMouseOut={(e)  => (e.currentTarget.style.background = "transparent")}>
                                                    <td className="py-3 px-5 font-bold" style={{ color: "var(--text-primary)" }}>
                                                        {row.season}
                                                        {row.archivedCount > 0 && (
                                                            <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full"
                                                                  style={{ background: "#F5F3FF", color: "#7C3AED" }}>
                                                                {row.archivedCount} archived
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-5 text-xs" style={{ color: "var(--text-secondary)" }}>{row.cropCount}</td>
                                                    <td className="py-3 px-5 text-xs" style={{ color: "var(--text-secondary)" }}>{(row.area ?? 0).toFixed(2)}</td>
                                                    <td className="py-3 px-5 font-semibold" style={{ color: "#DC2626" }}>MWK {fmt(row.expenses ?? 0)}</td>
                                                    <td className="py-3 px-5 font-semibold" style={{ color: "#16A34A" }}>MWK {fmt(row.revenue  ?? 0)}</td>
                                                    <td className="py-3 px-5 font-extrabold"
                                                        style={{ color: net >= 0 ? "#2563EB" : "#DC2626" }}>
                                                        {net < 0 ? "-" : ""}MWK {fmt(Math.abs(net))}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* -- CROPS ---------------------------------------------- */}
                    {activeTab === "crops" && (
                        <div className="flex flex-col gap-4">
                            {crops.length === 0 ? (
                                <NoData label="No crops match the current filters" />
                            ) : crops.map((crop: any) => {
                                const profit = (crop.revenue ?? 0) - (crop.totalCost ?? 0);
                                return (
                                    <div key={crop.id} className="rounded-2xl overflow-hidden"
                                         style={{ background: "var(--bg-card)", border: "1.5px solid var(--border)" }}>
                                        <div className="flex items-center justify-between px-5 py-4"
                                             style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                                            <div>
                                                <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                                                    {crop.cropTypeName} - {crop.variety}
                                                </p>
                                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                    {crop.fieldName}  -  {crop.season}  -  {(crop.areaPlanted ?? 0).toFixed(2)} ha
                                                    {crop.plantingDate ? `  -  Planted ${fmtDate(crop.plantingDate)}` : ""}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold"
                                                   style={{ color: profit >= 0 ? "#2563EB" : "#DC2626" }}>
                                                    Net {profit >= 0 ? "profit" : "loss"}
                                                </p>
                                                <p className="text-lg font-black"
                                                   style={{ color: profit >= 0 ? "#2563EB" : "#DC2626" }}>
                                                    {profit < 0 ? "-" : ""}MWK {fmt(Math.abs(profit))}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 md:grid-cols-6 gap-0">
                                            {[
                                                { label: "Inputs",           value: crop.inputCost,         color: "#0284C7" },
                                                { label: "Labour",           value: crop.labourCost,        color: "#9333EA" },
                                                { label: "Other",            value: crop.otherCost,         color: "#0891B2" },
                                                { label: "Overhead (share)", value: crop.allocatedOverhead, color: "#64748B" },
                                                { label: "Total cost",       value: crop.totalCost,         color: "#DC2626" },
                                                { label: "Revenue",          value: crop.revenue,           color: "#16A34A" },
                                            ].map(({ label, value, color }, i, arr) => (
                                                <div key={label} className="p-4"
                                                     style={{
                                                         borderRight: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                                                         borderTop:   "1px solid var(--border)",
                                                     }}>
                                                    <p className="text-[9px] font-black uppercase tracking-wide mb-1"
                                                       style={{ color: "var(--text-muted)" }}>{label}</p>
                                                    <p className="text-sm font-extrabold" style={{ color }}>
                                                        MWK {fmt(value ?? 0)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        {(crop.totalYieldKg ?? 0) > 0 && (
                                            <div className="flex items-center gap-6 px-5 py-3"
                                                 style={{ borderTop: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                                                {[
                                                    { label: "Yield",      value: fmtKg(crop.totalYieldKg)          },
                                                    { label: "Yield/ha",   value: fmtKg(crop.yieldPerHa)            },
                                                    { label: "Cost/ha",    value: `MWK ${fmt(crop.costPerHa ?? 0)}` },
                                                    { label: "Cost/kg",    value: `MWK ${fmt(crop.costPerKg ?? 0)}` },
                                                    { label: "Activities", value: crop.activityCount                },
                                                ].map(({ label, value }) => (
                                                    <div key={label}>
                                                        <p className="text-[9px] font-black uppercase tracking-wide"
                                                           style={{ color: "var(--text-muted)" }}>{label}</p>
                                                        <p className="text-sm font-extrabold"
                                                           style={{ color: "var(--farm-green)" }}>{value}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Totals footer */}
                            {crops.length > 1 && (
                                <div className="rounded-2xl p-5"
                                     style={{ background: "var(--farm-pale)", border: "1.5px solid var(--farm-green)" }}>
                                    <p className="text-xs font-extrabold uppercase tracking-wider mb-3"
                                       style={{ color: "var(--farm-green)" }}>
                                        Totals across {crops.length} crops
                                    </p>
                                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                                        {[
                                            { label: "Inputs",     value: crops.reduce((s: number, c: any) => s + (c.inputCost         ?? 0), 0), color: "#0284C7" },
                                            { label: "Labour",     value: crops.reduce((s: number, c: any) => s + (c.labourCost        ?? 0), 0), color: "#9333EA" },
                                            { label: "Overhead",   value: crops.reduce((s: number, c: any) => s + (c.allocatedOverhead ?? 0), 0), color: "#64748B" },
                                            { label: "Total cost", value: crops.reduce((s: number, c: any) => s + (c.totalCost         ?? 0), 0), color: "#DC2626" },
                                            { label: "Revenue",    value: crops.reduce((s: number, c: any) => s + (c.revenue          ?? 0), 0), color: "#16A34A" },
                                            { label: "Net profit", value: crops.reduce((s: number, c: any) => s + (c.netProfit        ?? 0), 0),
                                                color: crops.reduce((s: number, c: any) => s + (c.netProfit ?? 0), 0) >= 0 ? "#2563EB" : "#DC2626" },
                                        ].map(({ label, value, color }) => (
                                            <div key={label}>
                                                <p className="text-[9px] font-black uppercase tracking-wide mb-0.5"
                                                   style={{ color: "var(--farm-green)" }}>{label}</p>
                                                <p className="text-sm font-extrabold" style={{ color }}>
                                                    {value < 0 ? "-" : ""}MWK {fmt(Math.abs(value))}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* -- FINANCE -------------------------------------------- */}
                    {activeTab === "finance" && (
                        <div className="flex flex-col gap-5">
                            <div className="grid grid-cols-2 gap-5">
                                {/* Income */}
                                <div className="rounded-2xl p-6"
                                     style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                                    <h2 className="text-sm font-extrabold mb-4" style={{ color: "var(--text-primary)" }}>
                                        Income by category
                                    </h2>
                                    {(finance.incomeByCategory ?? []).length === 0 ? (
                                        <p className="text-sm" style={{ color: "var(--text-muted)" }}>No income records</p>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            {finance.incomeByCategory.map((c: any) => (
                                                <div key={c.category}>
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{c.category}</span>
                                                        <span className="text-xs font-extrabold" style={{ color: "#16A34A" }}>MWK {fmt(c.total)}</span>
                                                    </div>
                                                    <div className="h-1.5 rounded-full overflow-hidden"
                                                         style={{ background: "var(--bg-subtle)" }}>
                                                        <div className="h-full rounded-full"
                                                             style={{ width: `${Math.min(100, (c.total / (finance.totalIncome || 1)) * 100)}%`, background: "#16A34A" }} />
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="flex justify-between pt-2"
                                                 style={{ borderTop: "1px solid var(--border)" }}>
                                                <span className="text-xs font-extrabold" style={{ color: "var(--text-primary)" }}>Total</span>
                                                <span className="text-xs font-extrabold" style={{ color: "#16A34A" }}>MWK {fmt(finance.totalIncome ?? 0)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Expenses */}
                                <div className="rounded-2xl p-6"
                                     style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                                    <h2 className="text-sm font-extrabold mb-1" style={{ color: "var(--text-primary)" }}>
                                        Expenses by category
                                    </h2>
                                    <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
                                        From activities + allocated overhead
                                    </p>
                                    {(finance.expensesByCategory ?? []).length === 0 ? (
                                        <p className="text-sm" style={{ color: "var(--text-muted)" }}>No expense records</p>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            {finance.expensesByCategory.map((c: any) => (
                                                <div key={c.category}>
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{c.category}</span>
                                                        <span className="text-xs font-extrabold" style={{ color: "#DC2626" }}>MWK {fmt(c.total)}</span>
                                                    </div>
                                                    <div className="h-1.5 rounded-full overflow-hidden"
                                                         style={{ background: "var(--bg-subtle)" }}>
                                                        <div className="h-full rounded-full"
                                                             style={{ width: `${Math.min(100, (c.total / (finance.totalExpenses || 1)) * 100)}%`, background: "#DC2626" }} />
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="flex justify-between pt-2"
                                                 style={{ borderTop: "1px solid var(--border)" }}>
                                                <span className="text-xs font-extrabold" style={{ color: "var(--text-primary)" }}>Total</span>
                                                <span className="text-xs font-extrabold" style={{ color: "#DC2626" }}>MWK {fmt(finance.totalExpenses ?? 0)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Transactions table */}
                            <div className="rounded-2xl overflow-hidden"
                                 style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                                <div className="px-5 py-4"
                                     style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                                    <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                                        All transactions ({(finance.transactions ?? []).length})
                                    </p>
                                </div>
                                <table className="w-full text-sm">
                                    <thead>
                                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                        {["Date", "Type", "Category", "Description", "Amount"].map((h) => (
                                            <th key={h} className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest"
                                                style={{ color: "var(--text-muted)" }}>{h}</th>
                                        ))}
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {(finance.transactions ?? []).length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-10 text-center text-sm"
                                                style={{ color: "var(--text-muted)" }}>
                                                No transactions for current filters
                                            </td>
                                        </tr>
                                    ) : (finance.transactions ?? []).slice(0, 100).map((t: any) => (
                                        <tr key={t.id}
                                            style={{ borderBottom: "1px solid var(--border)" }}
                                            onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
                                            onMouseOut={(e)  => (e.currentTarget.style.background = "transparent")}>
                                            <td className="px-5 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{fmtDate(t.date)}</td>
                                            <td className="px-5 py-3">
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                                                      style={{
                                                          background: t.type === "Income" ? "#ECFDF5" : "#FEF2F2",
                                                          color:      t.type === "Income" ? "#059669" : "#DC2626",
                                                      }}>
                                                    {t.type}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>{t.category}</td>
                                            <td className="px-5 py-3 text-xs" style={{ color: "var(--text-primary)" }}>{t.description}</td>
                                            <td className="px-5 py-3 text-sm font-extrabold"
                                                style={{ color: t.type === "Income" ? "#16A34A" : "#DC2626" }}>
                                                {t.type === "Expense" ? "-" : "+"}MWK {fmt(t.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* -- YIELDS --------------------------------------------- */}
                    {activeTab === "yields" && (
                        <div className="flex flex-col gap-5">
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: "Yield records",    value: String(yields.length),                                                            color: "var(--farm-green)" },
                                    { label: "Total harvested",  value: fmtKg(summary.totalKgHarvested ?? 0),                                            color: "#2563EB"           },
                                    { label: "Average yield/ha", value: (summary.avgYieldPerHa ?? 0) > 0 ? `${fmt(summary.avgYieldPerHa)} kg/ha` : "-", color: "#0284C7"           },
                                ].map(({ label, value, color }) => (
                                    <div key={label} className="rounded-2xl p-5"
                                         style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                                        <p className="text-[10px] font-black uppercase tracking-widest mb-2"
                                           style={{ color: "var(--text-muted)" }}>{label}</p>
                                        <p className="text-2xl font-black" style={{ color }}>{value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="rounded-2xl overflow-hidden"
                                 style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                                <table className="w-full text-sm">
                                    <thead>
                                    <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                                        {["Crop", "Field", "Season", "Harvest date", "As recorded", "Total (kg)", "Notes"].map((h) => (
                                            <th key={h} className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest"
                                                style={{ color: "var(--text-muted)" }}>{h}</th>
                                        ))}
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {yields.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-5 py-12 text-center text-sm"
                                                style={{ color: "var(--text-muted)" }}>No yield records for current filters</td>
                                        </tr>
                                    ) : yields.map((y: any) => (
                                        <tr key={y.id}
                                            style={{ borderBottom: "1px solid var(--border)" }}
                                            onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
                                            onMouseOut={(e)  => (e.currentTarget.style.background = "transparent")}>
                                            <td className="px-5 py-3.5 font-bold" style={{ color: "var(--text-primary)" }}>{y.cropName}</td>
                                            <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-secondary)" }}>{y.fieldName}</td>
                                            <td className="px-5 py-3.5 text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{y.season}</td>
                                            <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-muted)" }}>{fmtDate(y.harvestDate)}</td>
                                            <td className="px-5 py-3.5 font-extrabold" style={{ color: "var(--farm-green)" }}>{y.displayQty}</td>
                                            <td className="px-5 py-3.5 text-xs font-bold" style={{ color: "#2563EB" }}>{fmtKg(y.kg)}</td>
                                            <td className="px-5 py-3.5 text-xs italic" style={{ color: "var(--text-muted)" }}>{y.notes ?? "-"}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                                <div className="px-5 py-3 flex items-center justify-between"
                                     style={{ borderTop: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                        {yields.length} record{yields.length !== 1 ? "s" : ""}  -  quantities shown as recorded then converted to kg
                                    </p>
                                    <p className="text-xs font-extrabold" style={{ color: "#2563EB" }}>
                                        Total: {fmtKg(summary.totalKgHarvested ?? 0)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* -- OVERHEAD ------------------------------------------- */}
                    {activeTab === "overhead" && (
                        <div className="flex flex-col gap-5">
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: "Total overhead",  value: `MWK ${fmt(overhead.totalOverhead    ?? 0)}`, color: "var(--text-primary)" },
                                    { label: "Allocated",       value: `MWK ${fmt(overhead.totalAllocated   ?? 0)}`, color: "var(--farm-green)"   },
                                    { label: "Unallocated",     value: `MWK ${fmt(overhead.totalUnallocated ?? 0)}`,
                                        color: (overhead.totalUnallocated ?? 0) > 0 ? "#0284C7" : "var(--text-muted)" },
                                ].map(({ label, value, color }) => (
                                    <div key={label} className="rounded-2xl p-5"
                                         style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                                        <p className="text-[10px] font-black uppercase tracking-widest mb-2"
                                           style={{ color: "var(--text-muted)" }}>{label}</p>
                                        <p className="text-2xl font-black" style={{ color }}>{value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="rounded-2xl p-5"
                                 style={{ background: "var(--farm-pale)", border: "1.5px solid var(--farm-green)" }}>
                                <p className="text-sm font-extrabold mb-2" style={{ color: "var(--farm-green)" }}>
                                    How overhead is allocated
                                </p>
                                <p className="text-sm leading-relaxed" style={{ color: "#166534" }}>
                                    For each overhead expense, AgriVault identifies all crops that were actively growing on that date.
                                    The expense is split proportionally by area planted. This allocation is fixed and does not
                                    change when you switch between Active and Both filters.
                                </p>
                            </div>

                            {(overhead.perCrop ?? []).length > 0 && (
                                <div className="rounded-2xl overflow-hidden"
                                     style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                                    <div className="px-5 py-4"
                                         style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                                        <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                                            Overhead per crop
                                        </p>
                                    </div>
                                    <table className="w-full text-sm">
                                        <thead>
                                        <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                            {["Crop", "Field", "Season", "Area (ha)", "Allocated overhead", "Share of total"].map((h) => (
                                                <th key={h} className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest"
                                                    style={{ color: "var(--text-muted)" }}>{h}</th>
                                            ))}
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {overhead.perCrop.map((c: any, i: number) => {
                                            const pct = (overhead.totalAllocated ?? 0) > 0
                                                ? (c.allocatedOverhead / overhead.totalAllocated) * 100 : 0;
                                            return (
                                                <tr key={i}
                                                    style={{ borderBottom: "1px solid var(--border)" }}
                                                    onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
                                                    onMouseOut={(e)  => (e.currentTarget.style.background = "transparent")}>
                                                    <td className="px-5 py-3.5 font-bold" style={{ color: "var(--text-primary)" }}>{c.cropTypeName}</td>
                                                    <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-secondary)" }}>{c.fieldName}</td>
                                                    <td className="px-5 py-3.5 text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{c.season}</td>
                                                    <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-secondary)" }}>{(c.areaPlanted ?? 0).toFixed(2)} ha</td>
                                                    <td className="px-5 py-3.5 font-extrabold" style={{ color: "#64748B" }}>MWK {fmt(c.allocatedOverhead)}</td>
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                                                                 style={{ background: "var(--bg-subtle)", minWidth: "60px" }}>
                                                                <div className="h-full rounded-full"
                                                                     style={{ width: `${Math.min(100, pct)}%`, background: "#64748B" }} />
                                                            </div>
                                                            <span className="text-xs font-bold w-10 text-right"
                                                                  style={{ color: "var(--text-muted)" }}>
                                                                {pct.toFixed(1)}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* -- YIELD TRENDS --------------------------------------- */}
                    {activeTab === "trends" && trendsData && (
                        <div className="flex flex-col gap-8">

                            {/* Crop filter chips */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>
                                    Show crops:
                                </span>
                                {allCropTypes.map((crop: string, i: number) => {
                                    const active = selectedCrops.includes(crop);
                                    return (
                                        <button key={crop}
                                                onClick={() => setSelectedCrops(
                                                    active
                                                        ? selectedCrops.filter((c) => c !== crop)
                                                        : [...selectedCrops, crop]
                                                )}
                                                className="h-7 px-3 rounded-lg text-xs font-bold transition-all"
                                                style={{
                                                    background: active ? CROP_COLORS[i % CROP_COLORS.length] : "var(--bg-subtle)",
                                                    color:      active ? "white" : "var(--text-muted)",
                                                    border:     `1px solid ${active ? "transparent" : "var(--border)"}`,
                                                }}>
                                            {crop}
                                        </button>
                                    );
                                })}
                            </div>

                            <ChartCard title="Yield per hectare by season"
                                       sub="kg harvested per hectare planted - tracks if you're getting more from the same land">
                                <ResponsiveContainer width="100%" height={320}>
                                    <LineChart data={trendsData.yieldTrend}
                                               margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                        <XAxis dataKey="season" tickFormatter={shortSeason}
                                               tick={{ fontSize: 11, fill: "var(--text-muted)" as string }} />
                                        <YAxis tickFormatter={(v) => `${fmt(v)} kg`}
                                               tick={{ fontSize: 11, fill: "var(--text-muted)" as string }} width={90} />
                                        <Tooltip content={<CustomTooltip formatter={(v: number) => `${fmt(v)} kg/ha`} />} />
                                        <Legend formatter={(v) => v.replace("_kgPerHa", "")} wrapperStyle={{ fontSize: 12 }} />
                                        {selectedCrops.map((crop, i) => (
                                            <Line key={crop} type="monotone" dataKey={`${crop}_kgPerHa`} name={crop}
                                                  stroke={CROP_COLORS[i % CROP_COLORS.length]} strokeWidth={2.5}
                                                  dot={{ r: 5, strokeWidth: 2, fill: "white" }} activeDot={{ r: 7 }} connectNulls />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            <ChartCard title="Cost of production per hectare"
                                       sub="Total MWK spent per hectare - rising costs = tighter margins">
                                <ResponsiveContainer width="100%" height={320}>
                                    <LineChart data={trendsData.costPerHaTrend}
                                               margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                        <XAxis dataKey="season" tickFormatter={shortSeason}
                                               tick={{ fontSize: 11, fill: "var(--text-muted)" as string }} />
                                        <YAxis tickFormatter={(v) => `MWK ${fmt(v)}`}
                                               tick={{ fontSize: 11, fill: "var(--text-muted)" as string }} width={110} />
                                        <Tooltip content={<CustomTooltip formatter={(v: number) => `MWK ${fmt(v)}/ha`} />} />
                                        <Legend formatter={(v) => v.replace("_costPerHa", "")} wrapperStyle={{ fontSize: 12 }} />
                                        {selectedCrops.map((crop, i) => (
                                            <Line key={crop} type="monotone" dataKey={`${crop}_costPerHa`} name={crop}
                                                  stroke={CROP_COLORS[i % CROP_COLORS.length]} strokeWidth={2.5}
                                                  dot={{ r: 5, strokeWidth: 2, fill: "white" }} activeDot={{ r: 7 }} connectNulls />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            <ChartCard title="Cost per kg produced"
                                       sub="How much it costs to produce 1 kg - key efficiency metric">
                                <ResponsiveContainer width="100%" height={320}>
                                    <LineChart data={trendsData.costPerKgTrend}
                                               margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                        <XAxis dataKey="season" tickFormatter={shortSeason}
                                               tick={{ fontSize: 11, fill: "var(--text-muted)" as string }} />
                                        <YAxis tickFormatter={(v) => `MWK ${fmt(v)}`}
                                               tick={{ fontSize: 11, fill: "var(--text-muted)" as string }} width={110} />
                                        <Tooltip content={<CustomTooltip formatter={(v: number) => `MWK ${fmt(v)}/kg`} />} />
                                        <Legend formatter={(v) => v.replace("_costPerKg", "")} wrapperStyle={{ fontSize: 12 }} />
                                        {selectedCrops.map((crop, i) => (
                                            <Line key={crop} type="monotone" dataKey={`${crop}_costPerKg`} name={crop}
                                                  stroke={CROP_COLORS[i % CROP_COLORS.length]} strokeWidth={2.5}
                                                  dot={{ r: 5, strokeWidth: 2, fill: "white" }} activeDot={{ r: 7 }} connectNulls />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            <ChartCard title="Revenue vs expenses by season"
                                       sub="Income against total production cost - the core P&L view">
                                <ResponsiveContainer width="100%" height={320}>
                                    <BarChart data={trendsData.revenueVsExpenses}
                                              margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                        <XAxis dataKey="season" tickFormatter={shortSeason}
                                               tick={{ fontSize: 11, fill: "var(--text-muted)" as string }} />
                                        <YAxis tickFormatter={(v) => `MWK ${fmt(v)}`}
                                               tick={{ fontSize: 11, fill: "var(--text-muted)" as string }} width={110} />
                                        <Tooltip content={<CustomTooltip formatter={(v: number) => `MWK ${fmt(v)}`} />} />
                                        <Legend wrapperStyle={{ fontSize: 12 }} />
                                        <ReferenceLine y={0} stroke="var(--border)" />
                                        <Bar dataKey="revenue"  name="Revenue"  fill="#16A34A" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="expenses" name="Expenses" fill="#DC2626" radius={[4, 4, 0, 0]} />
                                        <Line type="monotone" dataKey="net" name="Net profit"
                                              stroke="#2563EB" strokeWidth={2.5}
                                              dot={{ r: 5, strokeWidth: 2, fill: "white" }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            <ChartCard title="Expense breakdown by season"
                                       sub="Where your money goes each season - inputs, labour, overhead">
                                <ResponsiveContainer width="100%" height={320}>
                                    <BarChart data={trendsData.revenueVsExpenses}
                                              margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                        <XAxis dataKey="season" tickFormatter={shortSeason}
                                               tick={{ fontSize: 11, fill: "var(--text-muted)" as string }} />
                                        <YAxis tickFormatter={(v) => `MWK ${fmt(v)}`}
                                               tick={{ fontSize: 11, fill: "var(--text-muted)" as string }} width={110} />
                                        <Tooltip content={<CustomTooltip formatter={(v: number) => `MWK ${fmt(v)}`} />} />
                                        <Legend wrapperStyle={{ fontSize: 12 }} />
                                        <Bar dataKey="inputCost"  name="Inputs"   stackId="a" fill="#0284C7" />
                                        <Bar dataKey="labourCost" name="Labour"   stackId="a" fill="#9333EA" />
                                        <Bar dataKey="otherCost"  name="Other"    stackId="a" fill="#0891B2" />
                                        <Bar dataKey="overhead"   name="Overhead" stackId="a" fill="#64748B" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>
                        </div>
                    )}

                    {/* -- CROP PERFORMANCE ----------------------------------- */}
                    {activeTab === "performance" && trendsData && (
                        <div className="flex flex-col gap-4">
                            <div className="rounded-xl p-4 mb-2"
                                 style={{ background: "var(--farm-pale)", border: "1.5px solid var(--farm-green)" }}>
                                <p className="text-sm" style={{ color: "#166534" }}>
                                    Performance summary across all seasons for each crop type.
                                    Trend is calculated by comparing yield/ha in the first recorded season against the most recent.
                                </p>
                            </div>

                            {(trendsData.cropPerformance ?? []).length === 0 ? (
                                <NoData label="No crop performance data yet - add yield records first" />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {trendsData.cropPerformance.map((perf: any, i: number) => (
                                        <div key={perf.cropName} className="rounded-2xl p-5"
                                             style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>

                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black"
                                                         style={{ background: CROP_COLORS[i % CROP_COLORS.length] }}>
                                                        {perf.cropName[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-extrabold" style={{ color: "var(--text-primary)" }}>
                                                            {perf.cropName}
                                                        </p>
                                                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                            {perf.totalSeasons} season{perf.totalSeasons !== 1 ? "s" : ""}
                                                        </p>
                                                    </div>
                                                </div>
                                                <TrendBadge trend={perf.trend} />
                                            </div>

                                            <div className="grid grid-cols-3 gap-3 mb-4">
                                                {[
                                                    { label: "Avg yield/ha", value: `${fmt(perf.avgYieldPerHa)} kg`, color: "var(--farm-green)" },
                                                    { label: "Avg cost/ha",  value: `MWK ${fmt(perf.avgCostPerHa)}`,  color: "#DC2626"          },
                                                    { label: "Avg cost/kg",  value: perf.avgCostPerKg > 0 ? `MWK ${fmt(perf.avgCostPerKg)}` : "-", color: "#0284C7" },
                                                ].map(({ label, value, color }) => (
                                                    <div key={label} className="rounded-xl p-3 text-center"
                                                         style={{ background: "var(--bg-subtle)" }}>
                                                        <p className="text-[9px] font-black uppercase tracking-wide mb-1"
                                                           style={{ color: "var(--text-muted)" }}>{label}</p>
                                                        <p className="text-sm font-extrabold" style={{ color }}>{value}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 mb-4">
                                                <div className="rounded-xl p-3"
                                                     style={{ background: "#ECFDF5", border: "1px solid #86EFAC" }}>
                                                    <p className="text-[9px] font-black uppercase tracking-wide mb-0.5"
                                                       style={{ color: "#166534" }}>Best season</p>
                                                    <p className="text-xs font-extrabold" style={{ color: "#166534" }}>
                                                        {perf.bestSeason?.season}
                                                    </p>
                                                    <p className="text-xs" style={{ color: "#16A34A" }}>
                                                        {fmt(perf.bestSeason?.yieldPerHa ?? 0)} kg/ha
                                                    </p>
                                                </div>
                                                <div className="rounded-xl p-3"
                                                     style={{ background: "#FEF2F2", border: "1px solid #FCA5A5" }}>
                                                    <p className="text-[9px] font-black uppercase tracking-wide mb-0.5"
                                                       style={{ color: "#7F1D1D" }}>Lowest yield</p>
                                                    <p className="text-xs font-extrabold" style={{ color: "#7F1D1D" }}>
                                                        {perf.worstSeason?.season}
                                                    </p>
                                                    <p className="text-xs" style={{ color: "#DC2626" }}>
                                                        {fmt(perf.worstSeason?.yieldPerHa ?? 0)} kg/ha
                                                    </p>
                                                </div>
                                            </div>

                                            <table className="w-full text-xs">
                                                <thead>
                                                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                                    {["Season", "Yield/ha", "Cost/ha", "Cost/kg"].map((h) => (
                                                        <th key={h} className="text-left py-1.5 text-[9px] font-black uppercase tracking-wide"
                                                            style={{ color: "var(--text-muted)" }}>{h}</th>
                                                    ))}
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {perf.seasons.map((s: any) => (
                                                    <tr key={s.season} style={{ borderBottom: "1px solid var(--border)" }}>
                                                        <td className="py-1.5 font-semibold" style={{ color: "var(--text-secondary)" }}>
                                                            {shortSeason(s.season)}
                                                        </td>
                                                        <td className="py-1.5 font-bold" style={{ color: "var(--farm-green)" }}>
                                                            {fmt(s.yieldPerHa)} kg
                                                        </td>
                                                        <td className="py-1.5" style={{ color: "#DC2626" }}>
                                                            MWK {fmt(s.costPerHa)}
                                                        </td>
                                                        <td className="py-1.5" style={{ color: "#0284C7" }}>
                                                            {s.costPerKg > 0 ? `MWK ${fmt(s.costPerKg)}` : "-"}
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* -- BREAK-EVEN ----------------------------------------- */}
                    {activeTab === "breakeven" && trendsData && (
                        <div className="flex flex-col gap-4">
                            <div className="rounded-xl p-4"
                                 style={{ background: "var(--farm-pale)", border: "1.5px solid var(--farm-green)" }}>
                                <p className="text-sm font-extrabold mb-1" style={{ color: "var(--farm-green)" }}>
                                    How break-even price is calculated
                                </p>
                                <p className="text-sm" style={{ color: "#166534" }}>
                                    Break-even price = Total cost Ã· kg harvested. This is the minimum price per kg
                                    you must sell at to cover all costs. Compare it to ADMARC prices to see if
                                    you're operating profitably.
                                </p>
                            </div>

                            {(trendsData.breakEven ?? []).length === 0 ? (
                                <NoData label="No break-even data - add yield and cost records first" />
                            ) : (
                                <div className="rounded-2xl overflow-hidden"
                                     style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                                    <table className="w-full text-sm">
                                        <thead>
                                        <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                                            {["Crop", "Field", "Season", "Area", "Total cost", "Yield", "Cost/ha", "Break-even/kg", "Revenue", "Profitable"].map((h) => (
                                                <th key={h} className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-wider"
                                                    style={{ color: "var(--text-muted)" }}>{h}</th>
                                            ))}
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {trendsData.breakEven.map((b: any, i: number) => (
                                            <tr key={i}
                                                style={{ borderBottom: "1px solid var(--border)" }}
                                                onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
                                                onMouseOut={(e)  => (e.currentTarget.style.background = "transparent")}>
                                                <td className="px-4 py-3 font-bold" style={{ color: "var(--text-primary)" }}>{b.cropName}</td>
                                                <td className="px-4 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>{b.fieldName}</td>
                                                <td className="px-4 py-3 text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{b.season}</td>
                                                <td className="px-4 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>{b.areaPlanted.toFixed(2)} ha</td>
                                                <td className="px-4 py-3 font-semibold" style={{ color: "#DC2626" }}>MWK {fmt(b.totalCost)}</td>
                                                <td className="px-4 py-3 font-semibold" style={{ color: "var(--farm-green)" }}>
                                                    {b.totalYieldKg > 0 ? fmtKg(b.totalYieldKg) : "-"}
                                                </td>
                                                <td className="px-4 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>MWK {fmt(b.costPerHa)}</td>
                                                <td className="px-4 py-3">
                                                    {b.breakEvenPricePerKg != null ? (
                                                        <span className="font-extrabold text-sm" style={{ color: "#0284C7" }}>
                                                            MWK {fmt(b.breakEvenPricePerKg)}/kg
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: "var(--text-muted)" }}>No yield</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 font-semibold"
                                                    style={{ color: b.revenue > 0 ? "#16A34A" : "var(--text-muted)" }}>
                                                    {b.revenue > 0 ? `MWK ${fmt(b.revenue)}` : "-"}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {b.totalYieldKg === 0 ? (
                                                        <span className="text-xs px-2 py-1 rounded-full font-bold"
                                                              style={{ background: "var(--bg-subtle)", color: "var(--text-muted)" }}>
                                                            No yield
                                                        </span>
                                                    ) : b.isProfitable ? (
                                                        <span className="flex items-center gap-1 text-xs font-bold"
                                                              style={{ color: "#16A34A" }}>
                                                            <ArrowUpRight size={12} /> Yes
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-xs font-bold"
                                                              style={{ color: "#DC2626" }}>
                                                            <ArrowDownRight size={12} /> No
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* -- SEASON COMPARISON ---------------------------------- */}
                    {activeTab === "comparison" && trendsData && (
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-4 flex-wrap">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                           style={{ color: "var(--text-muted)" }}>Season A</label>
                                    <select value={compareA} onChange={(e) => setCompareA(e.target.value)}
                                            className="h-10 px-3 rounded-xl text-sm outline-none"
                                            style={{ border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-primary)" }}>
                                        {allSeasonsList.map((s: string) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mt-5 text-xl font-black" style={{ color: "var(--text-muted)" }}>vs</div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                           style={{ color: "var(--text-muted)" }}>Season B</label>
                                    <select value={compareB} onChange={(e) => setCompareB(e.target.value)}
                                            className="h-10 px-3 rounded-xl text-sm outline-none"
                                            style={{ border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-primary)" }}>
                                        <option value="">- select -</option>
                                        {allSeasonsList.map((s: string) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {compareA && compareB && (() => {
                                const a = trendsData.seasonSummaries?.find((s: any) => s.season === compareA);
                                const b = trendsData.seasonSummaries?.find((s: any) => s.season === compareB);
                                if (!a || !b) return <NoData label="No data for selected seasons" />;

                                const metrics = [
                                    { label: "Crops",        a: a.cropCount,    b: b.cropCount,    fmt: (v: number) => String(v),       higherIsBetter: true  },
                                    { label: "Area (ha)",    a: a.area,         b: b.area,         fmt: (v: number) => v.toFixed(2),    higherIsBetter: true  },
                                    { label: "Total cost",   a: a.totalCost,    b: b.totalCost,    fmt: (v: number) => `MWK ${fmt(v)}`, higherIsBetter: false },
                                    { label: "Revenue",      a: a.revenue,      b: b.revenue,      fmt: (v: number) => `MWK ${fmt(v)}`, higherIsBetter: true  },
                                    { label: "Net profit",   a: a.netProfit,    b: b.netProfit,    fmt: (v: number) => `MWK ${fmt(v)}`, higherIsBetter: true  },
                                    { label: "Total yield",  a: a.totalYieldKg, b: b.totalYieldKg, fmt: fmtKg,                          higherIsBetter: true  },
                                    { label: "Yield / ha",   a: a.yieldPerHa,   b: b.yieldPerHa,   fmt: (v: number) => `${fmt(v)} kg`,  higherIsBetter: true  },
                                    { label: "Cost / ha",    a: a.costPerHa,    b: b.costPerHa,    fmt: (v: number) => `MWK ${fmt(v)}`, higherIsBetter: false },
                                ];

                                return (
                                    <div className="rounded-2xl overflow-hidden"
                                         style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                                        <div className="grid grid-cols-4"
                                             style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                                            <div className="px-5 py-4 text-[10px] font-black uppercase tracking-wider"
                                                 style={{ color: "var(--text-muted)" }}>Metric</div>
                                            <div className="px-5 py-4 text-center">
                                                <p className="text-sm font-extrabold" style={{ color: "var(--farm-green)" }}>{compareA}</p>
                                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                    {a.cropTypes?.join(", ").slice(0, 40) || "-"}
                                                </p>
                                            </div>
                                            <div className="px-5 py-4 text-center">
                                                <p className="text-sm font-extrabold" style={{ color: "#9333EA" }}>{compareB}</p>
                                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                    {b.cropTypes?.join(", ").slice(0, 40) || "-"}
                                                </p>
                                            </div>
                                            <div className="px-5 py-4 text-center text-[10px] font-black uppercase tracking-wider"
                                                 style={{ color: "var(--text-muted)" }}>Change</div>
                                        </div>

                                        {metrics.map(({ label, a: va, b: vb, fmt: fmtFn, higherIsBetter }) => {
                                            const delta    = va - vb;
                                            const deltaPct = vb !== 0 ? ((delta / Math.abs(vb)) * 100) : 0;
                                            const improved = higherIsBetter ? delta > 0 : delta < 0;
                                            const neutral  = Math.abs(deltaPct) < 1;

                                            return (
                                                <div key={label}
                                                     className="grid grid-cols-4"
                                                     style={{ borderBottom: "1px solid var(--border)" }}
                                                     onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
                                                     onMouseOut={(e)  => (e.currentTarget.style.background = "transparent")}>
                                                    <div className="px-5 py-3.5 text-xs font-bold"
                                                         style={{ color: "var(--text-secondary)" }}>{label}</div>
                                                    <div className="px-5 py-3.5 text-center font-extrabold text-sm"
                                                         style={{ color: "var(--farm-green)" }}>{fmtFn(va)}</div>
                                                    <div className="px-5 py-3.5 text-center font-extrabold text-sm"
                                                         style={{ color: "#9333EA" }}>{fmtFn(vb)}</div>
                                                    <div className="px-5 py-3.5 text-center">
                                                        {neutral ? (
                                                            <span className="text-xs font-bold flex items-center justify-center gap-1"
                                                                  style={{ color: "var(--text-muted)" }}>
                                                                <Minus size={12} /> No change
                                                            </span>
                                                        ) : improved ? (
                                                            <span className="text-xs font-bold flex items-center justify-center gap-1"
                                                                  style={{ color: "#16A34A" }}>
                                                                <ArrowUpRight size={13} />
                                                                {Math.abs(deltaPct).toFixed(1)}% better
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs font-bold flex items-center justify-center gap-1"
                                                                  style={{ color: "#DC2626" }}>
                                                                <ArrowDownRight size={13} />
                                                                {Math.abs(deltaPct).toFixed(1)}% worse
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// -- Shared components ---------------------------------------------------------

function ChartCard({ title, sub, children }: {
    title: string; sub: string; children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl p-6"
             style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="mb-5">
                <p className="text-base font-extrabold" style={{ color: "var(--text-primary)" }}>{title}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>
            </div>
            {children}
        </div>
    );
}

function TrendBadge({ trend }: { trend: "improving" | "declining" | "stable" }) {
    const config = {
        improving: { icon: <TrendingUp   size={13} />, label: "Improving", color: "#16A34A", bg: "#ECFDF5" },
        declining: { icon: <TrendingDown size={13} />, label: "Declining", color: "#DC2626", bg: "#FEF2F2" },
        stable:    { icon: <Minus        size={13} />, label: "Stable",    color: "#0284C7", bg: "#F0F9FF" },
    }[trend];

    return (
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold"
              style={{ background: config.bg, color: config.color }}>
            {config.icon} {config.label}
        </span>
    );
}

function NoData({ label }: { label: string }) {
    return (
        <div className="rounded-2xl p-16 text-center"
             style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center text-sm font-black"
                 style={{ background: "var(--bg-subtle)", color: "var(--text-hint)" }}>
                RP
            </div>
            <p className="font-bold mb-1" style={{ color: "var(--text-primary)" }}>{label}</p>
        </div>
    );
}


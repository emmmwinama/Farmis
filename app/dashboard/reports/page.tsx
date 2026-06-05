"use client";

import { useEffect, useState } from "react";
import { Loader2, Download, Archive, Filter, TrendingUp, TrendingDown } from "lucide-react";

function fmt(n: number) { return new Intl.NumberFormat("en-MW").format(Math.round(n)); }
function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtKg(kg: number) {
    if (kg >= 1000) return `${(kg / 1000).toFixed(2)} t`;
    return `${fmt(kg)} kg`;
}

export default function ReportsPage() {
    const [data,      setData]      = useState<any>(null);
    const [loading,   setLoading]   = useState(true);
    const [season,    setSeason]    = useState("all");
    const [archived,  setArchived]  = useState<"active" | "archived" | "both">("active");
    const [seasons,   setSeasons]   = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<"overview" | "crops" | "finance" | "yields" | "overhead">("overview");

    const load = async () => {
        setLoading(true);
        try {
            const [activeCrops, archivedCrops] = await Promise.all([
                fetch("/api/crops?archived=false").then(async (r) => { const t = await r.text(); return t ? JSON.parse(t) : []; }),
                fetch("/api/crops?archived=true").then(async  (r) => { const t = await r.text(); return t ? JSON.parse(t) : []; }),
            ]);
            const uniqueSeasons = [...new Set(
                [...(Array.isArray(activeCrops) ? activeCrops : []), ...(Array.isArray(archivedCrops) ? archivedCrops : [])]
                    .map((c: any) => c.season).filter(Boolean)
            )].sort().reverse() as string[];
            setSeasons(uniqueSeasons);

            const params = new URLSearchParams();
            if (season !== "all")    params.set("season", season);
            if (archived !== "both") params.set("includeArchived", archived === "archived" ? "true" : "false");

            const res  = await fetch(`/api/reports?${params}`);
            const text = await res.text();
            setData(text ? JSON.parse(text) : null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [season, archived]);

    const summary  = data?.summary  ?? {};
    const crops    = data?.crops    ?? [];
    const finance  = data?.finance  ?? {};
    const yields   = data?.yields   ?? [];
    const overhead = data?.overheadAllocationSummary ?? {};

    const netProfit    = (summary.totalRevenue ?? 0) - (summary.totalExpenses ?? 0);
    const isProfitable = netProfit >= 0;

    return (
        <div className="p-8 max-w-7xl mx-auto">

            {/* Header */}
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)", letterSpacing: "-0.04em" }}>
                        Reports
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                        Costs from activities · Overhead allocated by area · Revenue from sales
                    </p>
                </div>
                <button className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-bold"
                        style={{ background: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                    <Download size={15} /> Export PDF
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-end gap-4 mb-8 flex-wrap">
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                           style={{ color: "var(--text-muted)" }}>Season</label>
                    <select value={season} onChange={(e) => setSeason(e.target.value)}
                            className="h-10 px-3 rounded-xl text-sm outline-none pr-8"
                            style={{ border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-primary)" }}>
                        <option value="all">All seasons</option>
                        {seasons.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                           style={{ color: "var(--text-muted)" }}>Records</label>
                    <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
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
                    <div className="flex items-center gap-2 h-10 px-3 rounded-xl"
                         style={{ background: "var(--farm-pale)", border: "1.5px solid var(--farm-green)" }}>
                        <Filter size={13} style={{ color: "var(--farm-green)" }} />
                        <span className="text-xs font-bold" style={{ color: "var(--farm-green)" }}>Filtered</span>
                        <button onClick={() => { setSeason("all"); setArchived("active"); }}
                                className="text-xs font-bold ml-1" style={{ color: "#DC2626" }}>
                            Clear
                        </button>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {[
                    { key: "overview",  label: "Overview"      },
                    { key: "crops",     label: "Crop summary"  },
                    { key: "finance",   label: "Financials"    },
                    { key: "yields",    label: "Yields"        },
                    { key: "overhead",  label: "Overhead allocation" },
                ].map(({ key, label }) => (
                    <button key={key} onClick={() => setActiveTab(key as any)}
                            className="h-10 px-5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0"
                            style={{
                                background: activeTab === key ? "var(--farm-green)" : "var(--bg-card)",
                                color:      activeTab === key ? "white"             : "var(--text-secondary)",
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
                <div className="rounded-2xl p-12 text-center"
                     style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                    <p className="text-4xl mb-3">📊</p>
                    <p className="font-bold mb-1" style={{ color: "var(--text-primary)" }}>No data available</p>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                        Add crops and activities to generate reports
                    </p>
                </div>
            ) : (
                <>
                    {/* ── OVERVIEW ─────────────────────────────────────────────── */}
                    {activeTab === "overview" && (
                        <div className="flex flex-col gap-6">

                            {/* Top stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: "Total crops",     value: String(summary.totalCrops ?? 0),                                      color: "var(--farm-green)" },
                                    { label: "Area tracked",    value: `${(summary.totalArea ?? 0).toFixed(2)} ha`,                          color: "#2563EB" },
                                    { label: "Total harvested", value: fmtKg(summary.totalKgHarvested ?? 0),                                 color: "#D97706" },
                                    { label: "Avg yield / ha",  value: (summary.avgYieldPerHa ?? 0) > 0 ? `${fmt(summary.avgYieldPerHa)} kg/ha` : "—", color: "#9333EA" },
                                ].map(({ label, value, color }) => (
                                    <div key={label} className="rounded-2xl p-5"
                                         style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
                                        <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                                            {label}
                                        </p>
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

                                {/* 3 big numbers */}
                                <div className="grid grid-cols-3 gap-4 mb-5">
                                    <div className="rounded-xl p-4" style={{ background: "#ECFDF5", border: "1.5px solid #86EFAC" }}>
                                        <p className="text-xs font-bold mb-1" style={{ color: "#166534" }}>Revenue (sales)</p>
                                        <p className="text-xl font-black" style={{ color: "#16A34A" }}>
                                            MWK {fmt(summary.totalRevenue ?? 0)}
                                        </p>
                                    </div>
                                    <div className="rounded-xl p-4" style={{ background: "#FEF2F2", border: "1.5px solid #FCA5A5" }}>
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
                                           style={{ color: isProfitable ? "#1E3A8A" : "#7F1D1D" }}>
                                            Net profit
                                        </p>
                                        <p className="text-xl font-black"
                                           style={{ color: isProfitable ? "#2563EB" : "#DC2626" }}>
                                            {netProfit < 0 ? "−" : ""}MWK {fmt(Math.abs(netProfit))}
                                        </p>
                                    </div>
                                </div>

                                {/* Expense breakdown */}
                                <div className="rounded-xl p-4" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                                    <p className="text-xs font-extrabold uppercase tracking-wider mb-3"
                                       style={{ color: "var(--text-muted)" }}>
                                        Expense breakdown
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {[
                                            { label: "Inputs (seeds, fertiliser, chemicals)", value: crops.reduce((s: number, c: any) => s + (c.inputCost  ?? 0), 0), color: "#D97706" },
                                            { label: "Labour",                                 value: crops.reduce((s: number, c: any) => s + (c.labourCost ?? 0), 0), color: "#9333EA" },
                                            { label: "Other activity costs",                   value: crops.reduce((s: number, c: any) => s + (c.otherCost  ?? 0), 0), color: "#0891B2" },
                                            { label: "Overhead (allocated to active crops)",   value: summary.allocatedOverhead ?? 0,                                   color: "#64748B" },
                                        ].map(({ label, value, color }) => (
                                            <div key={label} className="rounded-xl p-3"
                                                 style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                                                <p className="text-[9px] font-black uppercase tracking-wide mb-1 leading-tight"
                                                   style={{ color: "var(--text-muted)" }}>
                                                    {label}
                                                </p>
                                                <p className="text-sm font-extrabold" style={{ color }}>
                                                    MWK {fmt(value)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Overhead note */}
                                    {(summary.totalOverhead ?? 0) > 0 && (
                                        <div className="mt-3 rounded-xl p-3"
                                             style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                                            <p className="text-xs font-bold mb-1" style={{ color: "var(--text-muted)" }}>
                                                🏗️ Overhead: MWK {fmt(summary.totalOverhead)} total ·
                                                MWK {fmt(summary.allocatedOverhead ?? 0)} allocated ·
                                                {(summary.unallocatedOverhead ?? 0) > 0 && (
                                                    <span style={{ color: "#D97706" }}>
                                                        {" "}MWK {fmt(summary.unallocatedOverhead)} unallocated (no crops active)
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                Distributed proportionally by hectares among crops active on each expense date.
                                                See the <button onClick={() => setActiveTab("overhead")}
                                                                className="underline font-bold"
                                                                style={{ color: "var(--farm-green)" }}>
                                                Overhead allocation
                                            </button> tab for the full breakdown.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* By-season table */}
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
                                                    <td className="py-3 px-5 font-semibold" style={{ color: "#16A34A" }}>MWK {fmt(row.revenue ?? 0)}</td>
                                                    <td className="py-3 px-5 font-extrabold"
                                                        style={{ color: net >= 0 ? "#2563EB" : "#DC2626" }}>
                                                        {net < 0 ? "−" : ""}MWK {fmt(Math.abs(net))}
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

                    {/* ── CROPS ────────────────────────────────────────────────── */}
                    {activeTab === "crops" && (
                        <div className="flex flex-col gap-4">
                            {crops.length === 0 ? (
                                <div className="rounded-2xl p-12 text-center"
                                     style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>No crops match the current filters</p>
                                </div>
                            ) : crops.map((crop: any) => {
                                const profit = (crop.revenue ?? 0) - (crop.totalCost ?? 0);
                                return (
                                    <div key={crop.id} className="rounded-2xl overflow-hidden"
                                         style={{ background: "var(--bg-card)", border: `1.5px solid ${crop.isArchived ? "#E2E8F0" : "var(--border)"}` }}>

                                        {/* Crop header */}
                                        <div className="flex items-center justify-between px-5 py-4"
                                             style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                                            <div className="flex items-center gap-3">
                                                {crop.isArchived && <Archive size={14} style={{ color: "#7C3AED" }} />}
                                                <div>
                                                    <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                                                        {crop.cropTypeName} — {crop.variety}
                                                    </p>
                                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                        {crop.fieldName} · {crop.season} · {(crop.areaPlanted ?? 0).toFixed(2)} ha
                                                        {crop.plantingDate ? ` · Planted ${fmtDate(crop.plantingDate)}` : ""}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold" style={{ color: profit >= 0 ? "#2563EB" : "#DC2626" }}>
                                                    Net {profit >= 0 ? "profit" : "loss"}
                                                </p>
                                                <p className="text-lg font-black" style={{ color: profit >= 0 ? "#2563EB" : "#DC2626" }}>
                                                    {profit < 0 ? "−" : ""}MWK {fmt(Math.abs(profit))}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Crop details grid */}
                                        <div className="grid grid-cols-3 md:grid-cols-6 gap-0">
                                            {[
                                                { label: "Inputs",           value: `MWK ${fmt(crop.inputCost    ?? 0)}`, color: "#D97706" },
                                                { label: "Labour",           value: `MWK ${fmt(crop.labourCost   ?? 0)}`, color: "#9333EA" },
                                                { label: "Other",            value: `MWK ${fmt(crop.otherCost    ?? 0)}`, color: "#0891B2" },
                                                { label: "Overhead (share)", value: `MWK ${fmt(crop.allocatedOverhead ?? 0)}`, color: "#64748B" },
                                                { label: "Total cost",       value: `MWK ${fmt(crop.totalCost    ?? 0)}`, color: "#DC2626" },
                                                { label: "Revenue",          value: `MWK ${fmt(crop.revenue      ?? 0)}`, color: "#16A34A" },
                                            ].map(({ label, value, color }, i, arr) => (
                                                <div key={label} className="p-4"
                                                     style={{ borderRight: i < arr.length - 1 ? "1px solid var(--border)" : "none", borderTop: "1px solid var(--border)" }}>
                                                    <p className="text-[9px] font-black uppercase tracking-wide mb-1"
                                                       style={{ color: "var(--text-muted)" }}>
                                                        {label}
                                                    </p>
                                                    <p className="text-sm font-extrabold" style={{ color }}>{value}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Yield & efficiency row */}
                                        {(crop.totalYieldKg ?? 0) > 0 && (
                                            <div className="flex items-center gap-6 px-5 py-3"
                                                 style={{ borderTop: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                                                        Total yield
                                                    </p>
                                                    <p className="text-sm font-extrabold" style={{ color: "var(--farm-green)" }}>
                                                        {fmtKg(crop.totalYieldKg)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                                                        Yield / ha
                                                    </p>
                                                    <p className="text-sm font-extrabold" style={{ color: "var(--farm-green)" }}>
                                                        {fmtKg(crop.yieldPerHa ?? 0)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                                                        Cost / kg
                                                    </p>
                                                    <p className="text-sm font-extrabold" style={{ color: "#D97706" }}>
                                                        {(crop.costPerKg ?? 0) > 0 ? `MWK ${fmt(crop.costPerKg)}` : "—"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                                                        Activities
                                                    </p>
                                                    <p className="text-sm font-extrabold" style={{ color: "var(--text-secondary)" }}>
                                                        {crop.activityCount}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Totals footer */}
                            {crops.length > 1 && (
                                <div className="rounded-2xl p-5"
                                     style={{ background: "var(--farm-pale)", border: "1.5px solid var(--farm-green)" }}>
                                    <p className="text-xs font-extrabold uppercase tracking-wider mb-3" style={{ color: "var(--farm-green)" }}>
                                        Totals across {crops.length} crops
                                    </p>
                                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                                        {[
                                            { label: "Inputs",    value: crops.reduce((s: number, c: any) => s + (c.inputCost         ?? 0), 0), color: "#D97706" },
                                            { label: "Labour",    value: crops.reduce((s: number, c: any) => s + (c.labourCost        ?? 0), 0), color: "#9333EA" },
                                            { label: "Overhead",  value: crops.reduce((s: number, c: any) => s + (c.allocatedOverhead ?? 0), 0), color: "#64748B" },
                                            { label: "Total cost",value: crops.reduce((s: number, c: any) => s + (c.totalCost         ?? 0), 0), color: "#DC2626" },
                                            { label: "Revenue",   value: crops.reduce((s: number, c: any) => s + (c.revenue          ?? 0), 0), color: "#16A34A" },
                                            { label: "Net profit",value: crops.reduce((s: number, c: any) => s + (c.netProfit        ?? 0), 0),
                                                color: crops.reduce((s: number, c: any) => s + (c.netProfit ?? 0), 0) >= 0 ? "#2563EB" : "#DC2626" },
                                        ].map(({ label, value, color }) => (
                                            <div key={label}>
                                                <p className="text-[9px] font-black uppercase tracking-wide mb-0.5" style={{ color: "var(--farm-green)" }}>
                                                    {label}
                                                </p>
                                                <p className="text-sm font-extrabold" style={{ color }}>
                                                    {value < 0 ? "−" : ""}MWK {fmt(Math.abs(value))}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── FINANCE ──────────────────────────────────────────────── */}
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
                                                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-subtle)" }}>
                                                        <div className="h-full rounded-full"
                                                             style={{ width: `${Math.min(100, (c.total / (finance.totalIncome || 1)) * 100)}%`, background: "#16A34A" }} />
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="flex justify-between pt-2" style={{ borderTop: "1px solid var(--border)" }}>
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
                                                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-subtle)" }}>
                                                        <div className="h-full rounded-full"
                                                             style={{ width: `${Math.min(100, (c.total / (finance.totalExpenses || 1)) * 100)}%`, background: "#DC2626" }} />
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="flex justify-between pt-2" style={{ borderTop: "1px solid var(--border)" }}>
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
                                            <td className="px-5 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                                                {fmtDate(t.date)}
                                            </td>
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
                                                {t.type === "Expense" ? "−" : "+"}MWK {fmt(t.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── YIELDS ───────────────────────────────────────────────── */}
                    {activeTab === "yields" && (
                        <div className="flex flex-col gap-5">
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: "Yield records",    value: String(yields.length),                                                    color: "var(--farm-green)" },
                                    { label: "Total harvested",  value: fmtKg(summary.totalKgHarvested ?? 0),                                    color: "#2563EB" },
                                    { label: "Average yield/ha", value: (summary.avgYieldPerHa ?? 0) > 0 ? `${fmt(summary.avgYieldPerHa)} kg/ha` : "—", color: "#D97706" },
                                ].map(({ label, value, color }) => (
                                    <div key={label} className="rounded-2xl p-5"
                                         style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                                        <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>{label}</p>
                                        <p className="text-2xl font-black" style={{ color }}>{value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="rounded-2xl overflow-hidden"
                                 style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                                <table className="w-full text-sm">
                                    <thead>
                                    <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                                        {["Crop", "Field", "Season", "Harvest date", "As recorded", "Unit weight", "Total (kg)","Notes"].map((h) => (
                                            <th key={h} className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest"
                                                style={{ color: "var(--text-muted)" }}>{h}</th>
                                        ))}
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {yields.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-5 py-12 text-center text-sm"
                                                style={{ color: "var(--text-muted)" }}>
                                                No yield records for current filters
                                            </td>
                                        </tr>
                                    ) : yields.map((y: any) => (
                                        <tr key={y.id}
                                            style={{ borderBottom: "1px solid var(--border)" }}
                                            onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
                                            onMouseOut={(e)  => (e.currentTarget.style.background = "transparent")}>
                                            <td className="px-5 py-3.5 font-bold" style={{ color: "var(--text-primary)" }}>
                                                {y.cropName ?? "—"}
                                            </td>
                                            <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-secondary)" }}>{y.fieldName ?? "—"}</td>
                                            <td className="px-5 py-3.5 text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{y.season ?? "—"}</td>
                                            <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-muted)" }}>
                                                {y.harvestDate ? fmtDate(y.harvestDate) : "—"}
                                            </td>
                                            <td className="px-5 py-3.5 font-extrabold" style={{ color: "var(--farm-green)" }}>
                                                {y.displayQty}
                                            </td>
                                            <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-muted)" }}>
                                                {y.displayUnit}
                                            </td>
                                            <td className="px-5 py-3.5 text-xs font-bold" style={{ color: "#2563EB" }}>
                                                {fmtKg(y.kg)}
                                            </td>
                                            <td className="px-5 py-3.5 text-xs italic" style={{ color: "var(--text-muted)" }}>
                                                {y.notes ?? "—"}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                                <div className="px-5 py-3 flex items-center justify-between"
                                     style={{ borderTop: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                        {yields.length} record{yields.length !== 1 ? "s" : ""} · quantities shown as recorded then converted to kg
                                    </p>
                                    <p className="text-xs font-extrabold" style={{ color: "#2563EB" }}>
                                        Total: {fmtKg(summary.totalKgHarvested ?? 0)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── OVERHEAD ALLOCATION ───────────────────────────────────── */}
                    {activeTab === "overhead" && (
                        <div className="flex flex-col gap-5">
                            {/* Summary */}
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: "Total overhead",   value: `MWK ${fmt(overhead.totalOverhead   ?? 0)}`, color: "var(--text-primary)" },
                                    { label: "Allocated",        value: `MWK ${fmt(overhead.totalAllocated  ?? 0)}`, color: "var(--farm-green)"   },
                                    { label: "Unallocated",      value: `MWK ${fmt(overhead.totalUnallocated ?? 0)}`, color: (overhead.totalUnallocated ?? 0) > 0 ? "#D97706" : "var(--text-muted)" },
                                ].map(({ label, value, color }) => (
                                    <div key={label} className="rounded-2xl p-5"
                                         style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                                        <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>{label}</p>
                                        <p className="text-2xl font-black" style={{ color }}>{value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Explainer */}
                            <div className="rounded-2xl p-5"
                                 style={{ background: "var(--farm-pale)", border: "1.5px solid var(--farm-green)" }}>
                                <p className="text-sm font-extrabold mb-2" style={{ color: "var(--farm-green)" }}>
                                    How overhead is allocated
                                </p>
                                <p className="text-sm leading-relaxed" style={{ color: "#166534" }}>
                                    For each overhead expense (rent, vehicle, electricity, etc.), Farmio finds all crops that were
                                    active on that date — i.e. already planted and not yet harvested. The expense is then split
                                    among those crops in proportion to their area planted.
                                </p>
                                <p className="text-sm mt-2 leading-relaxed" style={{ color: "#166534" }}>
                                    For example: MWK 50,000 vehicle expense on 15 March, with Maize (2 ha) and Soya (1 ha) active
                                    → Maize gets MWK 33,333 (⅔) and Soya gets MWK 16,667 (⅓).
                                </p>
                                {(overhead.totalUnallocated ?? 0) > 0 && (
                                    <p className="text-sm mt-2 font-semibold" style={{ color: "#D97706" }}>
                                        ⚠️ MWK {fmt(overhead.totalUnallocated)} is unallocated — these expenses occurred when no crops
                                        were active. They are included in the farm total but not charged to any crop.
                                    </p>
                                )}
                            </div>

                            {/* Per-crop allocation table */}
                            {(overhead.perCrop ?? []).length > 0 ? (
                                <div className="rounded-2xl overflow-hidden"
                                     style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                                    <div className="px-5 py-4"
                                         style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                                        <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                                            Overhead allocated per crop
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
                                                ? (c.allocatedOverhead / overhead.totalAllocated) * 100
                                                : 0;
                                            return (
                                                <tr key={i}
                                                    style={{ borderBottom: "1px solid var(--border)" }}
                                                    onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
                                                    onMouseOut={(e)  => (e.currentTarget.style.background = "transparent")}>
                                                    <td className="px-5 py-3.5 font-bold" style={{ color: "var(--text-primary)" }}>
                                                        {c.cropTypeName}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-secondary)" }}>{c.fieldName}</td>
                                                    <td className="px-5 py-3.5 text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{c.season}</td>
                                                    <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                                                        {(c.areaPlanted ?? 0).toFixed(2)} ha
                                                    </td>
                                                    <td className="px-5 py-3.5 font-extrabold" style={{ color: "#64748B" }}>
                                                        MWK {fmt(c.allocatedOverhead)}
                                                    </td>
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
                            ) : (
                                <div className="rounded-2xl p-12 text-center"
                                     style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                                    <p className="text-4xl mb-3">🏗️</p>
                                    <p className="font-bold mb-1" style={{ color: "var(--text-primary)" }}>No overhead expenses recorded</p>
                                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                                        Add overhead expenses (rent, vehicle, utilities) in the Finance section
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    TrendingUp, TrendingDown, Map, Sprout, Wheat,
    Users, Wallet, ArrowRight, Sparkles, AlertTriangle,
    CheckCircle, Info, Lightbulb, Loader2, RefreshCw,
    Package, Plus, ClipboardList, BarChart2,
} from "lucide-react";

function fmt(n: number) {
    return new Intl.NumberFormat("en-MW").format(Math.round(n));
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const ACTIVITY_ICONS: Record<string, string> = {
    Planting: "🌱", Spraying: "🧪", Weeding: "🌿", Irrigation: "💧",
    Fertilising: "🌾", Harvesting: "🏃", "Land preparation": "🚜", Other: "📋",
};

const INSIGHT_CONFIG: Record<string, {
    bg: string; border: string; iconBg: string;
    icon: any; iconColor: string; titleColor: string; msgColor: string;
}> = {
    warning: {
        bg: "#FFFBEB", border: "#FDE68A",
        iconBg: "#FEF3C7", icon: AlertTriangle, iconColor: "#D97706", titleColor: "#92400E", msgColor: "#A16207",
    },
    success: {
        bg: "#F0FDF4", border: "#BBF7D0",
        iconBg: "#DCFCE7", icon: CheckCircle, iconColor: "#16A34A", titleColor: "#14532D", msgColor: "#166534",
    },
    info: {
        bg: "#EFF6FF", border: "#BFDBFE",
        iconBg: "#DBEAFE", icon: Info, iconColor: "#2563EB", titleColor: "#1E3A8A", msgColor: "#1D4ED8",
    },
    tip: {
        bg: "#FAF5FF", border: "#E9D5FF",
        iconBg: "#F3E8FF", icon: Lightbulb, iconColor: "#9333EA", titleColor: "#581C87", msgColor: "#7E22CE",
    },
};

function StatCard({
                      label, value, sub, icon: Icon, iconBg, trend, trendLabel, href, valueColor,
                  }: {
    label: string; value: string; sub?: string; icon: any; iconBg: string;
    trend?: "up" | "down" | "neutral"; trendLabel?: string; href?: string; valueColor?: string;
}) {
    const content = (
        <div className="stat-card card-hover group relative overflow-hidden h-full">
            {/* Subtle background pattern */}
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.04]"
                 style={{ background: iconBg, transform: "translate(30%, -30%)" }} />

            <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                     style={{ background: iconBg }}>
                    <Icon size={18} style={{ color: "var(--farm-green)" }} />
                </div>
                {trend && trendLabel && (
                    <span className={`badge ${trend === "up" ? "badge-green" : trend === "down" ? "badge-red" : "badge-warm"}`}>
            {trend === "up" ? <TrendingUp size={9} /> : trend === "down" ? <TrendingDown size={9} /> : null}
                        {trendLabel}
          </span>
                )}
            </div>

            <p className="metric-value" style={{ color: valueColor ?? "var(--text-primary)" }}>{value}</p>
            <p className="metric-label mt-1">{label}</p>
            {sub && <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>{sub}</p>}

            {href && (
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight size={14} style={{ color: "var(--text-hint)" }} />
                </div>
            )}
        </div>
    );

    return href ? <Link href={href} className="block h-full">{content}</Link> : content;
}

function QuickAction({ href, icon: Icon, label, color }: { href: string; icon: any; label: string; color: string }) {
    return (
        <Link href={href}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all hover:-translate-y-0.5 group"
              style={{ background: "var(--bg-card)", border: "1.5px solid var(--border)", boxShadow: "0 1px 3px rgba(28,25,23,0.06)" }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
                 style={{ background: color + "20" }}>
                <Icon size={20} style={{ color }} />
            </div>
            <span className="text-xs font-bold text-center leading-tight" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
        </Link>
    );
}

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [insights, setInsights] = useState<any[]>([]);
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingInsights, setLoadingInsights] = useState(true);
    const [refreshingInsights, setRefreshingInsights] = useState(false);

    const loadStats = () => {
        setLoadingStats(true);
        fetch("/api/stats").then((r) => r.json()).then((d) => { setStats(d); setLoadingStats(false); });
    };

    const loadInsights = (refresh = false) => {
        if (refresh) setRefreshingInsights(true);
        else setLoadingInsights(true);
        fetch("/api/ai/insights")
            .then((r) => r.json())
            .then((d) => {
                setInsights(d.insights ?? []);
                setLoadingInsights(false);
                setRefreshingInsights(false);
            })
            .catch(() => { setLoadingInsights(false); setRefreshingInsights(false); });
    };

    useEffect(() => { loadStats(); loadInsights(); }, []);

    if (loadingStats) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                         style={{ background: "var(--farm-pale)" }}>
                        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                             style={{ borderColor: "var(--farm-green)", borderTopColor: "transparent" }} />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                        Loading your farm...
                    </p>
                </div>
            </div>
        );
    }

    const netPositive = (stats?.net ?? 0) >= 0;

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in">

            {/* ── Page header ───────────────────────────────────────────────── */}
            <div className="page-header flex items-start justify-between">
                <div>
                    <h1 className="page-title">
                        Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},
                        {" "}{stats?.userName?.split(" ")[0]} 👋
                    </h1>
                    <p className="page-subtitle">
                        Here&apos;s what&apos;s happening at{" "}
                        <span className="font-bold" style={{ color: "var(--text-secondary)" }}>{stats?.farmName}</span>
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: "var(--text-secondary)" }}>
                        {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                </div>
            </div>

            {/* ── Quick actions ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-5 gap-3 mb-8">
                <QuickAction href="/dashboard/activities/new" icon={ClipboardList} label="Log activity"    color="#1a3d1f" />
                <QuickAction href="/dashboard/yields"         icon={Wheat}         label="Record harvest"  color="#D97706" />
                <QuickAction href="/dashboard/finance"        icon={Wallet}        label="Add transaction" color="#2563EB" />
                <QuickAction href="/dashboard/market"         icon={BarChart2}     label="Market prices"   color="#7C3AED" />
                <QuickAction href="/dashboard/reports"        icon={Sprout}        label="View reports"    color="#059669" />
            </div>

            {/* ── Primary stats ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <StatCard label="Total fields"   value={String(stats?.totalFields ?? 0)}
                          sub={`${fmt(stats?.totalArea ?? 0)} ha`}
                          icon={Map} iconBg="#EBF5EC" href="/dashboard/fields" />
                <StatCard label="Active crops"   value={String(stats?.activeCrops ?? 0)}
                          sub={`${stats?.harvestedCrops ?? 0} harvested`}
                          icon={Sprout} iconBg="#EBF5EC" href="/dashboard/crops" />
                <StatCard label="Total yield"    value={`${fmt(stats?.totalYieldKg ?? 0)} kg`}
                          sub="All harvests"
                          icon={Wheat} iconBg="#FEF3C7" href="/dashboard/yields" />
                <StatCard label="Net income"     value={`MWK ${fmt(Math.abs(stats?.net ?? 0))}`}
                          sub={netPositive ? "Profitable" : "Running at loss"}
                          icon={Wallet} iconBg={netPositive ? "#EBF5EC" : "#FFF1F2"}
                          trend={netPositive ? "up" : "down"}
                          trendLabel={netPositive ? "Profit" : "Loss"}
                          valueColor={netPositive ? "#16A34A" : "#DC2626"}
                          href="/dashboard/finance" />
            </div>

            {/* ── Secondary stats ───────────────────────────────────────────── */}
            <div className="grid grid-cols-4 gap-3 mb-8">
                {[
                    { label: "Income",         value: `MWK ${fmt(stats?.income ?? 0)}`,            color: "#16A34A" },
                    { label: "Activity costs", value: `MWK ${fmt(stats?.totalActivityCost ?? 0)}`, color: "#DC2626" },
                    { label: "Overhead",       value: `MWK ${fmt(stats?.totalOverhead ?? 0)}`,     color: "#D97706" },
                    { label: "Inventory items",value: String(stats?.totalInventoryItems ?? 0),     color: "#2563EB" },
                ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl px-4 py-3 flex items-center justify-between"
                         style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</p>
                        <p className="text-base font-extrabold" style={{ color }}>{value}</p>
                    </div>
                ))}
            </div>

            {/* ── Main grid ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* AI Insights — takes 2 cols */}
                <div className="lg:col-span-2 flex flex-col gap-4">

                    {/* Insights header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                 style={{ background: "linear-gradient(135deg, #1a3d1f, #3d8c47)" }}>
                                <Sparkles size={14} className="text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>AI Farm Insights</p>
                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Powered by your farm data</p>
                            </div>
                        </div>
                        <button
                            onClick={() => loadInsights(true)}
                            disabled={refreshingInsights}
                            className="btn-secondary h-8 px-3 text-xs disabled:opacity-50"
                        >
                            <RefreshCw size={11} className={refreshingInsights ? "animate-spin" : ""} />
                            Refresh
                        </button>
                    </div>

                    {/* Insight cards */}
                    {loadingInsights ? (
                        <div className="flex flex-col gap-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="rounded-2xl p-4 animate-pulse"
                                     style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                                    <div className="flex gap-3">
                                        <div className="w-9 h-9 rounded-xl" style={{ background: "var(--bg-muted)" }} />
                                        <div className="flex-1">
                                            <div className="h-4 rounded-lg w-40 mb-2" style={{ background: "var(--bg-muted)" }} />
                                            <div className="h-3 rounded-lg w-full" style={{ background: "var(--bg-subtle)" }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <p className="text-xs text-center flex items-center justify-center gap-1.5"
                               style={{ color: "var(--text-muted)" }}>
                                <Sparkles size={11} /> Analysing your farm data...
                            </p>
                        </div>
                    ) : insights.length === 0 ? (
                        <div className="rounded-2xl p-10 text-center"
                             style={{ background: "var(--bg-card)", border: "1.5px dashed var(--border)" }}>
                            <Sparkles size={28} style={{ color: "var(--text-hint)" }} className="mx-auto mb-3" />
                            <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                                Add more farm data to unlock AI insights
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {insights.map((insight: any, i: number) => {
                                const cfg = INSIGHT_CONFIG[insight.type] ?? INSIGHT_CONFIG.info;
                                const Icon = cfg.icon;
                                return (
                                    <div key={i} className="rounded-2xl p-4 transition-all hover:shadow-warm-sm animate-slide-up"
                                         style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}` }}>
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                                 style={{ background: cfg.iconBg }}>
                                                <Icon size={16} style={{ color: cfg.iconColor }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <p className="text-sm font-extrabold" style={{ color: cfg.titleColor }}>
                                                        {insight.title}
                                                    </p>
                                                    {insight.metric && (
                                                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0"
                                                              style={{ background: "rgba(255,255,255,0.7)", color: cfg.titleColor }}>
                              {insight.metric}
                            </span>
                                                    )}
                                                </div>
                                                <p className="text-sm leading-relaxed" style={{ color: cfg.msgColor }}>
                                                    {insight.message}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Season performance */}
                    {(stats?.seasons ?? []).length > 0 && (
                        <div className="rounded-2xl p-5"
                             style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(28,25,23,0.06)" }}>
                            <p className="text-xs font-extrabold uppercase tracking-widest mb-4"
                               style={{ color: "var(--text-muted)" }}>
                                Season performance
                            </p>
                            <div className="flex flex-col gap-3">
                                {stats.seasons.slice(0, 3).map((s: any) => {
                                    const maxCost = Math.max(...stats.seasons.map((ss: any) => ss.totalCost || 1));
                                    const pct = maxCost > 0 ? Math.round((s.totalCost / maxCost) * 100) : 0;
                                    const profitable = s.netRevenue >= 0;
                                    return (
                                        <div key={s.name}>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{s.name}</p>
                                                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{s.crops?.join(", ")}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                          <span className={`badge ${profitable ? "badge-green" : "badge-red"}`}>
                            {profitable ? "+" : ""}MWK {fmt(Math.abs(s.netRevenue ?? 0))}
                          </span>
                                                </div>
                                            </div>
                                            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                                                <div className={`h-full rounded-full transition-all`}
                                                     style={{
                                                         width: `${pct}%`,
                                                         background: profitable
                                                             ? "linear-gradient(90deg, #16a34a, #22c55e)"
                                                             : "linear-gradient(90deg, #dc2626, #ef4444)",
                                                     }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-4">

                    {/* Land use */}
                    <div className="rounded-2xl p-5"
                         style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(28,25,23,0.06)" }}>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>Land utilisation</p>
                            <Link href="/dashboard/fields"
                                  className="text-xs font-bold"
                                  style={{ color: "var(--farm-green)" }}>
                                View →
                            </Link>
                        </div>
                        {(stats?.fieldLandUse ?? []).length === 0 ? (
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>No fields added yet</p>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {stats.fieldLandUse.map((f: any) => {
                                    const pct = f.cultivatableArea > 0
                                        ? Math.min((f.allocated / f.cultivatableArea) * 100, 100)
                                        : 0;
                                    return (
                                        <div key={f.name}>
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{f.name}</p>
                                                <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                                                    {f.allocated.toFixed(1)}/{f.cultivatableArea.toFixed(1)} ha
                                                </p>
                                            </div>
                                            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                                                <div className="h-full rounded-full transition-all"
                                                     style={{
                                                         width: `${pct}%`,
                                                         background: pct > 90
                                                             ? "linear-gradient(90deg, #dc2626, #ef4444)"
                                                             : pct > 70
                                                                 ? "linear-gradient(90deg, #d97706, #f59e0b)"
                                                                 : "linear-gradient(90deg, #1a3d1f, #3d8c47)",
                                                     }} />
                                            </div>
                                            <p className="text-[10px] mt-0.5 text-right font-semibold"
                                               style={{ color: pct > 90 ? "#DC2626" : "var(--text-hint)" }}>
                                                {pct.toFixed(0)}% used
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Crop overview */}
                    <div className="rounded-2xl p-5"
                         style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(28,25,23,0.06)" }}>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>Crops</p>
                            <Link href="/dashboard/crops" className="text-xs font-bold" style={{ color: "var(--farm-green)" }}>View →</Link>
                        </div>
                        {(stats?.cropSummary ?? []).length === 0 ? (
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>No crops yet</p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {stats.cropSummary.slice(0, 5).map((c: any) => (
                                    <div key={c.name} className="flex items-center justify-between py-2"
                                         style={{ borderBottom: "1px solid var(--border)" }}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-base">🌱</span>
                                            <div>
                                                <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{c.name}</p>
                                                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{c.totalArea.toFixed(1)} ha</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {c.statuses.includes("Active") && (
                                                <span className="badge badge-green">Active</span>
                                            )}
                                            {c.statuses.filter((s: string) => s === "Harvested").length > 0 && (
                                                <span className="badge badge-blue">
                          {c.statuses.filter((s: string) => s === "Harvested").length} harvested
                        </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent activities */}
                    <div className="rounded-2xl p-5"
                         style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(28,25,23,0.06)" }}>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>Recent activities</p>
                            <Link href="/dashboard/activities" className="text-xs font-bold" style={{ color: "var(--farm-green)" }}>View →</Link>
                        </div>
                        {(stats?.recentActivities ?? []).length === 0 ? (
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>No activities logged yet</p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {stats.recentActivities.map((a: any) => (
                                    <div key={a.id} className="flex items-start gap-3 py-2"
                                         style={{ borderBottom: "1px solid var(--border)" }}>
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                                             style={{ background: "var(--bg-subtle)" }}>
                                            {ACTIVITY_ICONS[a.activityType] ?? "📋"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{a.activityType}</p>
                                            <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>
                                                {a.fieldName}{a.cropName ? ` · ${a.cropName}` : ""}
                                            </p>
                                        </div>
                                        <p className="text-[10px] font-semibold flex-shrink-0" style={{ color: "var(--text-hint)" }}>
                                            {formatDate(a.date)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
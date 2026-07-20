"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    TrendingUp, TrendingDown, Map, Sprout, Wheat,
    Users, Wallet, ArrowRight, AlertTriangle,
    CheckCircle, Loader2,
    Package, Plus, ClipboardList, BarChart2, FileBarChart,
    Beaker,
    Droplets, Leaf, Tractor, Scissors, Search,
} from "lucide-react";

function fmt(n: number) {
    return new Intl.NumberFormat("en-MW").format(Math.round(n));
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const ACTIVITY_ICONS: Record<string, any> = {
    Planting: Sprout,
    Spraying: Beaker,
    Weeding: Leaf,
    Irrigation: Droplets,
    Fertilising: Wheat,
    Harvesting: Package,
    "Land preparation": Tractor,
    Pruning: Scissors,
    Scouting: Search,
    Other: ClipboardList,
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

function GuidedOnboarding({ stats }: { stats: any }) {
    const steps = [
        { label: "Create farm", href: "/dashboard/farm", done: Boolean(stats?.farmName) },
        { label: "Add fields", href: "/dashboard/fields", done: (stats?.totalFields ?? 0) > 0 },
        { label: "Add crops", href: "/dashboard/crops", done: (stats?.activeCrops ?? 0) + (stats?.harvestedCrops ?? 0) > 0 },
        { label: "Record activity", href: "/dashboard/activities/new", done: (stats?.recentActivities ?? []).length > 0 },
        { label: "Export report", href: "/dashboard/records", done: false },
    ];
    const complete = steps.filter((step) => step.done).length;
    if (complete === steps.length) return null;

    return (
        <div className="rounded-2xl p-5 mb-6" style={{ background: "linear-gradient(135deg, #E0F2FE, #F8FAFC)", border: "1px solid #BAE6FD" }}>
            <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                    <p className="text-sm font-black" style={{ color: "#075985" }}>Getting started</p>
                    <p className="text-sm mt-1" style={{ color: "#0369A1" }}>Set up the minimum record trail lenders, buyers, and managers expect.</p>
                </div>
                <span className="badge badge-blue">{complete}/{steps.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {steps.map((step) => (
                    <Link key={step.label} href={step.href}
                          className="min-h-14 rounded-2xl px-4 flex items-center gap-3 transition-all hover:-translate-y-0.5"
                          style={{ background: step.done ? "rgba(255,255,255,0.78)" : "white", border: "1px solid #BAE6FD" }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: step.done ? "#CCFBF1" : "#E0F2FE", color: step.done ? "#0F766E" : "#0284C7" }}>
                            {step.done ? <CheckCircle size={16} /> : <Plus size={16} />}
                        </div>
                        <span className="text-sm font-bold" style={{ color: "#0F172A" }}>{step.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}

function RoleNextActions({ role }: { role: string }) {
    const actions: Record<string, { label: string; href: string; icon: any }[]> = {
        owner: [
            { label: "Review profitability", href: "/dashboard/reports", icon: BarChart2 },
            { label: "Invite team", href: "/dashboard/team", icon: Users },
        ],
        manager: [
            { label: "Plan field work", href: "/dashboard/calendar", icon: ClipboardList },
            { label: "Check active crops", href: "/dashboard/crops", icon: Sprout },
        ],
        accountant: [
            { label: "Add transaction", href: "/dashboard/finance", icon: Wallet },
            { label: "Export records", href: "/dashboard/records", icon: FileBarChart },
        ],
        agronomist: [
            { label: "Log scouting", href: "/dashboard/activities/new", icon: Search },
            { label: "Open farm map", href: "/dashboard/map", icon: Map },
        ],
        viewer: [
            { label: "View reports", href: "/dashboard/reports", icon: FileBarChart },
            { label: "View records", href: "/dashboard/records", icon: ClipboardList },
        ],
    };
    const items = actions[role] ?? actions.viewer;
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {items.map((item) => {
                const Icon = item.icon;
                return (
                    <Link key={item.label} href={item.href}
                          className="min-h-14 rounded-2xl px-4 flex items-center gap-3"
                          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "var(--info-bg)", color: "var(--info-text)" }}>
                            <Icon size={17} />
                        </div>
                        <div>
                            <p className="text-sm font-black" style={{ color: "var(--text-primary)" }}>{item.label}</p>
                            <p className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>{role} action</p>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}

function FarmAlerts({ stats }: { stats: any }) {
    const alerts = [
        (stats?.activeCrops ?? 0) > 0 && (stats?.recentActivities ?? []).length === 0
            ? "Missing activity records for active crops."
            : null,
        (stats?.net ?? 0) < 0 ? "Low margin detected from current costs and income." : null,
        (stats?.totalActivityCost ?? 0) > Math.max((stats?.income ?? 0) * 0.7, 1)
            ? "Input and activity costs are high compared with recorded income."
            : null,
    ].filter(Boolean);
    if (alerts.length === 0) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
            {alerts.map((alert) => (
                <div key={alert} className="min-h-14 rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                    <AlertTriangle size={17} style={{ color: "#2563EB" }} />
                    <p className="text-sm font-bold" style={{ color: "#1E3A8A" }}>{alert}</p>
                </div>
            ))}
        </div>
    );
}

function EmptyFarmNotice({ stats }: { stats: any }) {
    const hasRecords = [
        stats?.totalFields,
        stats?.activeCrops,
        stats?.harvestedCrops,
        stats?.activeEmployees,
        stats?.totalInventoryItems,
        stats?.recentActivities?.length,
    ].some((value) => (value ?? 0) > 0);

    if (hasRecords) return null;

    return (
        <div className="rounded-2xl p-5 mb-6" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-black" style={{ color: "#1E3A8A" }}>
                        This active farm has no records yet
                    </p>
                    <p className="text-sm mt-1" style={{ color: "#1D4ED8" }}>
                        You are viewing {stats?.farmName ?? "the selected farm"} under {stats?.userEmail ?? "this account"}. If your data is under another farm or account, use the farm switcher in the sidebar or sign in with that account.
                    </p>
                </div>
                <Link href="/dashboard/settings" className="btn-secondary min-h-10 text-xs flex-shrink-0">
                    Check farms
                </Link>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [statsError, setStatsError] = useState("");

    const readJson = async (response: Response) => {
        const text = await response.text();
        if (!text.trim()) return null;
        return JSON.parse(text);
    };

    const loadStats = () => {
        setLoadingStats(true);
        setStatsError("");
        fetch("/api/stats")
            .then(async (r) => {
                const data = await readJson(r);
                if (!r.ok) throw new Error(data?.error ?? "Failed to load dashboard stats");
                return data;
            })
            .then((d) => { setStats(d ?? {}); setLoadingStats(false); })
            .catch((error) => { setStats(null); setStatsError(error.message ?? "Dashboard stats could not be loaded"); setLoadingStats(false); });
    };

    useEffect(() => { loadStats(); }, []);

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

    if (statsError) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <div className="card p-8 text-center">
                    <p className="section-title mb-2">Dashboard data unavailable</p>
                    <p className="section-subtitle mb-5">{statsError}</p>
                    <button type="button" onClick={loadStats} className="btn-primary min-h-11">
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in">

            {/* -- Page header ------------------------------------------------- */}
            <div className="page-header flex items-start justify-between">
                <div>
                    <h1 className="page-title">
                        Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},
                        {" "}{stats?.userName?.split(" ")[0]}
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

            <GuidedOnboarding stats={stats} />
            <EmptyFarmNotice stats={stats} />
            <FarmAlerts stats={stats} />

            {/* -- Primary stats ----------------------------------------------- */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <StatCard label="Total fields"   value={String(stats?.totalFields ?? 0)}
                          sub={`${fmt(stats?.totalArea ?? 0)} ha`}
                          icon={Map} iconBg="#EBF5EC" href="/dashboard/fields" />
                <StatCard label="Active crops"   value={String(stats?.activeCrops ?? 0)}
                          sub={`${stats?.harvestedCrops ?? 0} harvested`}
                          icon={Sprout} iconBg="#EBF5EC" href="/dashboard/crops" />
                <StatCard label="Total yield"    value={`${fmt(stats?.totalYieldKg ?? 0)} kg`}
                          sub="All harvests"
                          icon={Wheat} iconBg="#E0F2FE" href="/dashboard/yields" />
                <StatCard label="Net income"     value={`MWK ${fmt(Math.abs(stats?.net ?? 0))}`}
                          sub={netPositive ? "Profitable" : "Running at loss"}
                          icon={Wallet} iconBg={netPositive ? "#EBF5EC" : "#FFF1F2"}
                          trend={netPositive ? "up" : "down"}
                          trendLabel={netPositive ? "Profit" : "Loss"}
                          valueColor={netPositive ? "#16A34A" : "#DC2626"}
                          href="/dashboard/finance" />
            </div>

            {/* -- Secondary stats --------------------------------------------- */}
            <div className="grid grid-cols-4 gap-3 mb-8">
                {[
                    { label: "Income",         value: `MWK ${fmt(stats?.income ?? 0)}`,            color: "#16A34A" },
                    { label: "Activity costs", value: `MWK ${fmt(stats?.totalActivityCost ?? 0)}`, color: "#DC2626" },
                    { label: "Overhead",       value: `MWK ${fmt(stats?.totalOverhead ?? 0)}`,     color: "#0284C7" },
                    { label: "Inventory items",value: String(stats?.totalInventoryItems ?? 0),     color: "#2563EB" },
                ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl px-4 py-3 flex items-center justify-between"
                         style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</p>
                        <p className="text-base font-extrabold" style={{ color }}>{value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                <div className="rounded-2xl p-5"
                     style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>Season profitability</p>
                        <BarChart2 size={17} style={{ color: "#0284C7" }} />
                    </div>
                    <div className="flex flex-col gap-3">
                        {(stats?.seasons ?? []).slice(0, 4).map((season: any) => {
                            const max = Math.max(...(stats?.seasons ?? []).map((item: any) => Math.abs(item.netRevenue ?? 0)), 1);
                            const width = Math.max(6, Math.round((Math.abs(season.netRevenue ?? 0) / max) * 100));
                            const positive = (season.netRevenue ?? 0) >= 0;
                            return (
                                <div key={season.name}>
                                    <div className="flex justify-between text-xs font-bold mb-1" style={{ color: "var(--text-secondary)" }}>
                                        <span>{season.name}</span>
                                        <span style={{ color: positive ? "#0D9488" : "#DC2626" }}>
                                            {positive ? "+" : "-"}MWK {fmt(Math.abs(season.netRevenue ?? 0))}
                                        </span>
                                    </div>
                                    <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                                        <div className="h-full rounded-full" style={{ width: `${width}%`, background: positive ? "#0D9488" : "#DC2626" }} />
                                    </div>
                                </div>
                            );
                        })}
                        {(stats?.seasons ?? []).length === 0 && (
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Add seasonal crop records to see profit trends.</p>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl p-5"
                     style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>Crop area mix</p>
                        <Sprout size={17} style={{ color: "#0284C7" }} />
                    </div>
                    <div className="flex flex-col gap-3">
                        {(stats?.cropSummary ?? []).slice(0, 5).map((crop: any) => {
                            const maxArea = Math.max(...(stats?.cropSummary ?? []).map((item: any) => item.totalArea || 0), 1);
                            const width = Math.max(6, Math.round((crop.totalArea / maxArea) * 100));
                            return (
                                <div key={crop.name}>
                                    <div className="flex justify-between text-xs font-bold mb-1" style={{ color: "var(--text-secondary)" }}>
                                        <span>{crop.name}</span>
                                        <span>{crop.totalArea.toFixed(1)} ha</span>
                                    </div>
                                    <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                                        <div className="h-full rounded-full" style={{ width: `${width}%`, background: "#0284C7" }} />
                                    </div>
                                </div>
                            );
                        })}
                        {(stats?.cropSummary ?? []).length === 0 && (
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Add crops to see area distribution.</p>
                        )}
                    </div>
                </div>
            </div>

            <RoleNextActions role={stats?.farmRole ?? "viewer"} />

            {/* -- Operational panels ------------------------------------------ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Land use */}
                    <div className="rounded-2xl p-5"
                         style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(28,25,23,0.06)" }}>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>Land utilisation</p>
                            <Link href="/dashboard/fields"
                                  className="text-xs font-bold"
                                  style={{ color: "var(--farm-green)" }}>
                                View
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
                            <Link href="/dashboard/crops" className="text-xs font-bold" style={{ color: "var(--farm-green)" }}>View</Link>
                        </div>
                        {(stats?.cropSummary ?? []).length === 0 ? (
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>No crops yet</p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {stats.cropSummary.slice(0, 5).map((c: any) => (
                                    <div key={c.name} className="flex items-center justify-between py-2"
                                         style={{ borderBottom: "1px solid var(--border)" }}>
                                        <div className="flex items-center gap-2">
                                            <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                                  style={{ background: "var(--bg-subtle)", color: "var(--farm-green)" }}>
                                                <Sprout size={16} />
                                            </span>
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
                            <Link href="/dashboard/activities" className="text-xs font-bold" style={{ color: "var(--farm-green)" }}>View</Link>
                        </div>
                        {(stats?.recentActivities ?? []).length === 0 ? (
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>No activities logged yet</p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {stats.recentActivities.map((a: any) => (
                                    <div key={a.id} className="flex items-start gap-3 py-3"
                                         style={{ borderBottom: "1px solid var(--border)" }}>
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                             style={{ background: "var(--bg-subtle)" }}>
                                            {(() => {
                                                const ActivityIcon = ACTIVITY_ICONS[a.activityType] ?? ClipboardList;
                                                return <ActivityIcon size={16} style={{ color: "var(--text-secondary)" }} />;
                                            })()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{a.activityType}</p>
                                            <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>
                                                {a.fieldName}{a.cropName ? `  -  ${a.cropName}` : ""}
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
    );
}


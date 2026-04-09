"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Map, Sprout, Users, TrendingUp, Plus, ArrowUpRight } from "lucide-react";
import Link from "next/link";

const activityIcons: Record<string, string> = {
    Planting: "🌱", Irrigation: "💧", Spraying: "🧴", Weeding: "🌿",
    Harvesting: "🌾", Fertilizing: "🪣", "Soil Preparation": "🚜",
    "Pest Control": "🐛", Other: "📋",
};

const statusColors: Record<string, string> = {
    Active: "bg-green-50 text-green-800",
    Harvested: "bg-blue-50 text-blue-800",
    Failed: "bg-red-50 text-red-800",
};

function fmt(n: number) {
    return new Intl.NumberFormat("en-MW").format(Math.round(n));
}

function greeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
}

export default function DashboardPage() {
    const { data: session } = useSession();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/stats")
            .then((r) => r.json())
            .then((d) => { setData(d); setLoading(false); });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-slate-400 text-sm">Loading...</div>
            </div>
        );
    }

    const today = new Date().toLocaleDateString("en-GB", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

    const statCards = [
        { label: "Fields", value: data.totalFields, sub: `${data.totalArea.toFixed(1)} ha total`, icon: Map, href: "/dashboard/fields" },
        { label: "Active crops", value: data.activeCrops, sub: `across ${data.totalFields} fields`, icon: Sprout, href: "/dashboard/crops" },
        { label: "Employees", value: data.activeEmployees, sub: `${data.totalEmployees} total`, icon: Users, href: "/dashboard/employees" },
        { label: "Net balance", value: `MWK ${fmt(data.net)}`, sub: "this season", icon: TrendingUp, href: "/dashboard/finance", positive: data.net >= 0 },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between mb-10">
                <div>
                    <h1 className="text-2xl font-medium text-slate-900">
                        {greeting()}, {session?.user?.name?.split(" ")[0]}
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">{data.farmName} &mdash; {today}</p>
                </div>
                <Link
                    href="/dashboard/activities/new"
                    className="flex items-center gap-2 h-10 px-4 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
                >
                    <Plus size={16} /> New activity
                </Link>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map(({ label, value, sub, icon: Icon, href, positive }) => (
                    <Link key={label} href={href}
                          className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-colors group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs uppercase tracking-wide text-slate-400 font-medium">{label}</span>
                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                                <Icon size={15} className="text-slate-500" />
                            </div>
                        </div>
                        <div className={`text-2xl font-medium mb-1 ${positive !== undefined ? positive ? "text-green-700" : "text-red-600" : "text-slate-900"}`}>
                            {value}
                        </div>
                        <div className="text-xs text-slate-400">{sub}</div>
                    </Link>
                ))}
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">

                {/* Recent activities */}
                <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-base font-medium text-slate-900">Recent activities</h2>
                        <Link href="/dashboard/activities" className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors">
                            View all <ArrowUpRight size={12} />
                        </Link>
                    </div>
                    {data.recentActivities.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-slate-400 text-sm">No activities yet</p>
                            <Link href="/dashboard/activities/new" className="text-sm text-slate-900 font-medium hover:underline mt-2 inline-block">
                                Log your first activity
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col divide-y divide-slate-100">
                            {data.recentActivities.map((a: any) => (
                                <div key={a.id} className="flex items-center gap-4 py-3.5">
                                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-base flex-shrink-0">
                                        {activityIcons[a.activityType] ?? "📋"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900">{a.activityType} &mdash; {a.fieldName}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{a.cropName ?? "Field-wide activity"}</p>
                                    </div>
                                    <span className="text-xs text-slate-400 flex-shrink-0">
                    {new Date(a.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right column */}
                <div className="lg:col-span-2 flex flex-col gap-6">

                    {/* Land use */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-base font-medium text-slate-900">Land use</h2>
                            <Link href="/dashboard/fields" className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors">
                                Manage <ArrowUpRight size={12} />
                            </Link>
                        </div>
                        {data.fieldLandUse.length === 0 ? (
                            <p className="text-slate-400 text-sm text-center py-6">No fields added yet</p>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {data.fieldLandUse.map((f: any) => {
                                    const pct = f.cultivatableArea > 0 ? Math.min((f.allocated / f.cultivatableArea) * 100, 100) : 0;
                                    return (
                                        <div key={f.name}>
                                            <div className="flex justify-between text-xs mb-1.5">
                                                <span className="text-slate-600 font-medium">{f.name}</span>
                                                <span className="text-slate-400">{f.allocated.toFixed(1)} / {f.cultivatableArea.toFixed(1)} ha</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct > 90 ? "#dc2626" : pct > 70 ? "#d97706" : "#16a34a" }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Finance */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-base font-medium text-slate-900">Finance</h2>
                            <Link href="/dashboard/finance" className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors">
                                View all <ArrowUpRight size={12} />
                            </Link>
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">Income</span>
                                <span className="text-sm font-medium text-green-700">MWK {fmt(data.income)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">Expenses</span>
                                <span className="text-sm font-medium text-red-600">MWK {fmt(data.expense)}</span>
                            </div>
                            <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-900">Net</span>
                                <span className={`text-base font-medium ${data.net >= 0 ? "text-green-700" : "text-red-600"}`}>
                  MWK {fmt(data.net)}
                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Crop type breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-base font-medium text-slate-900">Crop breakdown</h2>
                        <Link href="/dashboard/crops" className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors">
                            Manage <ArrowUpRight size={12} />
                        </Link>
                    </div>
                    {data.cropSummary.length === 0 ? (
                        <p className="text-slate-400 text-sm text-center py-8">No crops recorded yet</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {data.cropSummary.map((c: any, i: number) => {
                                const active = c.statuses.filter((s: string) => s === "Active").length;
                                const harvested = c.statuses.filter((s: string) => s === "Harvested").length;
                                const failed = c.statuses.filter((s: string) => s === "Failed").length;
                                const totalArea = data.cropSummary.reduce((s: number, x: any) => s + x.totalArea, 0);
                                const pct = totalArea > 0 ? (c.totalArea / totalArea) * 100 : 0;
                                return (
                                    <div key={`${c.name}-${i}`} className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-sm flex-shrink-0">🌱</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-slate-900">{c.name}</span>
                                                <span className="text-xs text-slate-400">{c.totalArea.toFixed(1)} ha</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                                            </div>
                                            <div className="flex gap-2 mt-1.5">
                                                {active > 0 && <span className="text-xs bg-green-50 text-green-800 px-1.5 py-0.5 rounded-md">{active} active</span>}
                                                {harvested > 0 && <span className="text-xs bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded-md">{harvested} harvested</span>}
                                                {failed > 0 && <span className="text-xs bg-red-50 text-red-800 px-1.5 py-0.5 rounded-md">{failed} failed</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Seasons summary */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-base font-medium text-slate-900">Seasons</h2>
                        <Link href="/dashboard/seasons" className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors">
                            View all <ArrowUpRight size={12} />
                        </Link>
                    </div>
                    {data.seasons.length === 0 ? (
                        <p className="text-slate-400 text-sm text-center py-8">No seasons recorded yet</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {data.seasons.slice(0, 4).map((s: any) => (
                                <Link
                                    key={s.name}
                                    href={`/dashboard/seasons?season=${encodeURIComponent(s.name)}`}
                                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{s.name}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{s.crops.slice(0, 3).join(", ")}{s.crops.length > 3 ? ` +${s.crops.length - 3} more` : ""}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-slate-900">{s.totalArea.toFixed(1)} ha</p>
                                        <p className="text-xs text-slate-400">{s.cropCount} crop{s.cropCount !== 1 ? "s" : ""}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
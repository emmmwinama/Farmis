"use client";

import { useEffect, useState } from "react";
import {
    Plus, Loader2, ChevronDown, ChevronUp,
    ClipboardList, Filter, TrendingUp,
} from "lucide-react";
import Link from "next/link";

const ACTIVITY_ICONS: Record<string, string> = {
    Planting: "🌱", Spraying: "🧪", Weeding: "🌿", Irrigation: "💧",
    Fertilising: "🌾", Harvesting: "🏃", "Land preparation": "🚜",
    Pruning: "✂️", Scouting: "🔍", Other: "📋",
};

function fmt(n: number) { return new Intl.NumberFormat("en-MW").format(Math.round(n)); }
function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function ActivitiesPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState("All");
    const [seasonFilter, setSeasonFilter] = useState("All");
    const [fieldFilter, setFieldFilter] = useState("All");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showAnalytics, setShowAnalytics] = useState(true);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (typeFilter !== "All") params.set("type", typeFilter);
        if (seasonFilter !== "All") params.set("season", seasonFilter);
        if (fieldFilter !== "All") params.set("fieldId", fieldFilter);
        fetch(`/api/activities?${params.toString()}`).then((r) => r.json()).then((d) => { setData(d); setLoading(false); });
    }, [typeFilter, seasonFilter, fieldFilter]);

    const activities = data?.activities ?? [];
    const allTypes = [...new Set(activities.map((a: any) => a.activityType))].sort() as string[];
    const totalCost = activities.reduce((s: number, a: any) => s + a.totalCost, 0);

    return (
        <div className="p-8 max-w-6xl mx-auto">

            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Activities</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {activities.length} activities · MWK {fmt(totalCost)} total cost
                    </p>
                </div>
                <Link href="/dashboard/activities/new"
                      className="flex items-center gap-2 h-10 px-5 bg-[#1a3d1f] text-white text-sm font-bold rounded-xl hover:bg-[#2d5c35] transition-colors hover:shadow-lg hover:shadow-[#1a3d1f]/20">
                    <Plus size={16} /> Log activity
                </Link>
            </div>

            {/* Analytics */}
            {data?.byType?.length > 0 && (
                <div className="mb-6">
                    <button onClick={() => setShowAnalytics(!showAnalytics)}
                            className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-3">
                        <TrendingUp size={15} />
                        Analytics
                        {showAnalytics ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {showAnalytics && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">By type</p>
                                <div className="flex flex-col gap-2">
                                    {(data?.byType ?? []).slice(0, 5).map((t: any) => (
                                        <div key={t.type} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">{ACTIVITY_ICONS[t.type] ?? "📋"}</span>
                                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t.type}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-slate-900 dark:text-white">{t.count}</p>
                                                <p className="text-xs text-slate-400">MWK {fmt(t.totalCost)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">By field</p>
                                <div className="flex flex-col gap-2">
                                    {(data?.byField ?? []).slice(0, 5).map((f: any) => (
                                        <div key={f.name} className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{f.name}</span>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-slate-900 dark:text-white">{f.count} activities</p>
                                                <p className="text-xs text-slate-400">MWK {fmt(f.totalCost)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">By season</p>
                                <div className="flex flex-col gap-2">
                                    {(data?.bySeason ?? []).slice(0, 5).map((s: any) => (
                                        <div key={s.season} className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{s.season}</span>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-slate-900 dark:text-white">{s.count}</p>
                                                <p className="text-xs text-slate-400">MWK {fmt(s.totalCost)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                        className="h-9 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-700 dark:text-slate-300">
                    <option value="All">All types</option>
                    {Object.keys(ACTIVITY_ICONS).map((t) => <option key={t}>{t}</option>)}
                </select>

                <select value={seasonFilter} onChange={(e) => setSeasonFilter(e.target.value)}
                        className="h-9 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-700 dark:text-slate-300">
                    <option value="All">All seasons</option>
                    {(data?.allSeasons ?? []).map((s: string) => <option key={s}>{s}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-slate-400" /></div>
            ) : activities.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                        <ClipboardList size={28} className="text-slate-400" />
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white text-lg mb-2">No activities yet</p>
                    <p className="text-slate-400 text-sm mb-6">Log your first farm activity to start tracking costs</p>
                    <Link href="/dashboard/activities/new"
                          className="inline-flex items-center gap-2 h-11 px-6 bg-[#1a3d1f] text-white text-sm font-bold rounded-xl hover:bg-[#2d5c35] transition-colors">
                        <Plus size={16} /> Log activity
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {activities.map((activity: any) => (
                        <div key={activity.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-sm transition-all">
                            <div
                                className="flex items-center gap-4 p-4 cursor-pointer"
                                onClick={() => setExpandedId(expandedId === activity.id ? null : activity.id)}
                            >
                                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xl flex-shrink-0">
                                    {ACTIVITY_ICONS[activity.activityType] ?? "📋"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <p className="font-bold text-slate-900 dark:text-white">{activity.activityType}</p>
                                        {activity.season && (
                                            <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 px-2 py-0.5 rounded-lg font-semibold">{activity.season}</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400">{activity.fieldName}{activity.cropName ? ` · ${activity.cropName} (${activity.cropVariety})` : ""}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="font-bold text-slate-900 dark:text-white">MWK {fmt(activity.totalCost)}</p>
                                    <p className="text-xs text-slate-400">{formatDate(activity.date)}</p>
                                </div>
                                <div className="flex flex-col gap-1 ml-2">
                                    <span className="text-xs text-slate-400">{expandedId === activity.id ? "▲" : "▼"}</span>
                                </div>
                            </div>

                            {expandedId === activity.id && (
                                <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        {[
                                            { label: "Labour cost", value: `MWK ${fmt(activity.totalLabourCost)}` },
                                            { label: "Input cost", value: `MWK ${fmt(activity.totalInputCost)}` },
                                            { label: "Other costs", value: `MWK ${fmt(activity.totalOtherCost)}` },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                                                <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {activity.labourRecords?.length > 0 && (
                                        <div className="mb-3">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Labour</p>
                                            <div className="flex flex-col gap-1.5">
                                                {activity.labourRecords.map((l: any) => (
                                                    <div key={l.id} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2">
                                                        <span className="font-semibold text-slate-700 dark:text-slate-300">{l.employeeName}</span>
                                                        <span className="text-slate-400">{l.daysWorked}d / {l.hoursWorked}h</span>
                                                        <span className="font-bold text-slate-900 dark:text-white">MWK {fmt(l.totalCost)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activity.inputs?.length > 0 && (
                                        <div className="mb-3">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Inputs used</p>
                                            <div className="flex flex-col gap-1.5">
                                                {activity.inputs.map((inp: any) => (
                                                    <div key={inp.id} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2">
                                                        <span className="font-semibold text-slate-700 dark:text-slate-300">{inp.inputName}</span>
                                                        <span className="text-slate-400">{inp.quantity} {inp.unit} @ MWK {fmt(inp.unitCost)}</span>
                                                        <span className="font-bold text-slate-900 dark:text-white">MWK {fmt(inp.totalCost)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activity.notes && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">{activity.notes}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {Loader2, CalendarDays, TrendingUp, ArrowLeftRight} from "lucide-react";

function fmt(n: number) { return new Intl.NumberFormat("en-MW").format(Math.round(n)); }
function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const ACTIVITY_ICONS: Record<string, string> = {
    Planting: "🌱", Spraying: "🧪", Weeding: "🌿", Irrigation: "💧",
    Fertilising: "🌾", Harvesting: "🏃", "Land preparation": "🚜", Other: "📋",
};

export default function SeasonsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedSeason, setSelectedSeason] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        const url = selectedSeason ? `/api/seasons?season=${encodeURIComponent(selectedSeason)}` : "/api/seasons";
        fetch(url).then((r) => r.json()).then((d) => {
            setData(d);
            if (!selectedSeason && d.allSeasons?.length > 0) setSelectedSeason(d.allSeasons[0]);
            setLoading(false);
        });
    }, [selectedSeason]);

    const seasons = data?.allSeasons ?? [];

    return (
        <div className="p-8 max-w-6xl mx-auto">

            <Link href="/dashboard/seasons/compare"
                  className="btn-secondary text-xs">
                <ArrowLeftRight size={13} />
                Compare seasons
            </Link>

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Seasons</h1>
                <p className="text-slate-400 text-sm mt-1">View crops, activities and performance by growing season</p>
            </div>

            {/* Season selector */}
            <div className="flex gap-2 mb-8 flex-wrap">
                {seasons.map((s: string) => (
                    <button key={s} onClick={() => setSelectedSeason(s)}
                            className={`h-10 px-5 rounded-xl text-sm font-bold transition-colors ${
                                selectedSeason === s
                                    ? "bg-[#1a3d1f] text-white shadow-md"
                                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-[#1a3d1f] hover:text-[#1a3d1f] dark:hover:text-[#7dd68a]"
                            }`}>
                        {s}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-slate-400" /></div>
            ) : !selectedSeason ? (
                <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                        <CalendarDays size={28} className="text-slate-400" />
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white text-lg mb-2">No seasons yet</p>
                    <p className="text-slate-400 text-sm">Add crops with a season name to start tracking seasons</p>
                </div>
            ) : (
                <>
                    {/* Season summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {[
                            { label: "Crops planted", value: String(data?.totals?.crops ?? 0) },
                            { label: "Total area", value: `${(data?.totals?.area ?? 0).toFixed(1)} ha` },
                            { label: "Activities", value: String(data?.totals?.activities ?? 0) },
                            { label: "Activity cost", value: `MWK ${fmt(data?.totals?.cost ?? 0)}` },
                        ].map(({ label, value }) => (
                            <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">{label}</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Crop type breakdown */}
                    {(data?.byType ?? []).length > 0 && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-6">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">Crops this season</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {data.byType.map((t: any) => {
                                    const activeCount = (t.statuses ?? []).filter((s: string) => s === "Active").length;
                                    const harvestedCount = (t.statuses ?? []).filter((s: string) => s === "Harvested").length;
                                    return (
                                        <div key={t.name} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-xl">🌱</span>
                                                <p className="font-bold text-slate-900 dark:text-white">{t.name}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <p className="text-xs text-slate-400">Area</p>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{t.totalArea.toFixed(1)} ha</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400">Cost</p>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">MWK {fmt(t.totalCost)}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    {activeCount > 0 && (
                                                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-2 py-0.5 rounded-lg font-bold">{activeCount} active</span>
                                                    )}
                                                    {harvestedCount > 0 && (
                                                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-2 py-0.5 rounded-lg font-bold">{harvestedCount} harvested</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Crop records */}
                    {(data?.cropFields ?? []).length > 0 && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden mb-6">
                            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                                <p className="text-sm font-bold text-slate-900 dark:text-white">Crop records</p>
                            </div>
                            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                {data.cropFields.map((cf: any) => (
                                    <div key={cf.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">🌱</span>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{cf.cropTypeName}</p>
                                                <p className="text-xs text-slate-400">{cf.variety} · {cf.fieldName} · {cf.areaPlanted} ha</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-lg font-bold ${
                          cf.status === "Active" ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400" :
                              cf.status === "Harvested" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400" :
                                  "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                      }`}>{cf.status}</span>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">MWK {fmt(cf.totalCost)}</p>
                                            <p className="text-xs text-slate-400">{cf.activityCount} activities</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent activities */}
                    {(data?.activities ?? []).length > 0 && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                                <p className="text-sm font-bold text-slate-900 dark:text-white">Season activities</p>
                            </div>
                            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                {data.activities.slice(0, 10).map((a: any) => (
                                    <div key={a.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className="text-base">{ACTIVITY_ICONS[a.activityType] ?? "📋"}</span>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{a.activityType}</p>
                                                <p className="text-xs text-slate-400">{a.fieldName}{a.cropName ? ` · ${a.cropName}` : ""}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">MWK {fmt(a.totalCost)}</p>
                                            <p className="text-xs text-slate-400">{formatDate(a.date)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
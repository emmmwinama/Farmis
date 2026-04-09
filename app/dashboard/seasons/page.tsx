"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, ArrowUpRight, ChevronDown } from "lucide-react";
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

function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function SeasonsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const seasonParam = searchParams.get("season") ?? "";

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedSeason, setSelectedSeason] = useState(seasonParam);
    const [activityTypeFilter, setActivityTypeFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");

    const load = (season: string) => {
        setLoading(true);
        const url = season ? `/api/seasons?season=${encodeURIComponent(season)}` : "/api/seasons";
        fetch(url)
            .then((r) => r.json())
            .then((d) => {
                setData(d);
                if (!season && d.allSeasons.length > 0) {
                    setSelectedSeason(d.allSeasons[0]);
                    load(d.allSeasons[0]);
                    return;
                }
                setLoading(false);
            });
    };

    useEffect(() => { load(seasonParam); }, []);

    const handleSeasonChange = (s: string) => {
        setSelectedSeason(s);
        setActivityTypeFilter("All");
        setStatusFilter("All");
        router.push(`/dashboard/seasons?season=${encodeURIComponent(s)}`);
        load(s);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 size={24} className="animate-spin text-slate-400" />
            </div>
        );
    }

    if (!data || data.allSeasons.length === 0) {
        return (
            <div className="p-8 max-w-6xl mx-auto text-center py-20">
                <p className="text-4xl mb-4">🌱</p>
                <p className="text-slate-900 font-medium mb-1">No seasons yet</p>
                <p className="text-slate-400 text-sm mb-6">Add crops with a season name to start tracking</p>
                <Link href="/dashboard/crops" className="inline-flex items-center gap-2 h-10 px-5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors">
                    Go to Crops
                </Link>
            </div>
        );
    }

    const filteredCrops = data.cropFields.filter((c: any) =>
        (statusFilter === "All" || c.status === statusFilter)
    );

    const activityTypes = ["All", ...Array.from(new Set(data.activities.map((a: any) => a.activityType))) as string[]];
    const filteredActivities = data.activities.filter((a: any) =>
        activityTypeFilter === "All" || a.activityType === activityTypeFilter
    );

    return (
        <div className="p-8 max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-medium text-slate-900">Seasons</h1>
                    <p className="text-slate-400 text-sm mt-1">Track performance by growing season</p>
                </div>

                {/* Season selector */}
                <div className="relative">
                    <select
                        value={selectedSeason}
                        onChange={(e) => handleSeasonChange(e.target.value)}
                        className="h-10 pl-4 pr-10 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:border-slate-400 appearance-none cursor-pointer"
                    >
                        {data.allSeasons.map((s: string) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Total area", value: `${data.totals.area.toFixed(1)} ha` },
                    { label: "Crop records", value: data.totals.crops },
                    { label: "Activities", value: data.totals.activities },
                    { label: "Total cost", value: `MWK ${fmt(data.totals.cost)}` },
                ].map(({ label, value }) => (
                    <div key={label} className="bg-white border border-slate-200 rounded-2xl p-5">
                        <p className="text-xs uppercase tracking-wide text-slate-400 font-medium mb-2">{label}</p>
                        <p className="text-2xl font-medium text-slate-900">{value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                {/* Crop type breakdown */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <h2 className="text-base font-medium text-slate-900 mb-5">Crop type breakdown</h2>
                    {data.byType.length === 0 ? (
                        <p className="text-slate-400 text-sm text-center py-8">No crops for this season</p>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {data.byType.map((c: any, i: number) => {
                                const totalArea = data.byType.reduce((s: number, x: any) => s + x.totalArea, 0);
                                const pct = totalArea > 0 ? (c.totalArea / totalArea) * 100 : 0;
                                const active = c.statuses.filter((s: string) => s === "Active").length;
                                const harvested = c.statuses.filter((s: string) => s === "Harvested").length;
                                const failed = c.statuses.filter((s: string) => s === "Failed").length;
                                return (
                                    <div key={`${c.name}-${i}`}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-sm font-medium text-slate-900">{c.name}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-slate-400">{c.totalArea.toFixed(1)} ha</span>
                                                {c.totalCost > 0 && <span className="text-xs text-slate-400">MWK {fmt(c.totalCost)}</span>}
                                            </div>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                                        </div>
                                        <div className="flex gap-2">
                                            {active > 0 && <span className="text-xs bg-green-50 text-green-800 px-1.5 py-0.5 rounded-md">{active} active</span>}
                                            {harvested > 0 && <span className="text-xs bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded-md">{harvested} harvested</span>}
                                            {failed > 0 && <span className="text-xs bg-red-50 text-red-800 px-1.5 py-0.5 rounded-md">{failed} failed</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Activity summary */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-base font-medium text-slate-900">Activity summary</h2>
                    </div>

                    {/* Activity type counts */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {activityTypes.filter((t) => t !== "All").map((type) => {
                            const count = data.activities.filter((a: any) => a.activityType === type).length;
                            if (count === 0) return null;
                            return (
                                <div key={type} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50">
                                    <span className="text-base">{activityIcons[type] ?? "📋"}</span>
                                    <div>
                                        <p className="text-xs font-medium text-slate-900">{type}</p>
                                        <p className="text-xs text-slate-400">{count} time{count !== 1 ? "s" : ""}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Crop records table */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-medium text-slate-900">Crop records</h2>
                    <div className="flex gap-2">
                        {["All", "Active", "Harvested", "Failed"].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`h-7 px-3 rounded-lg text-xs font-medium transition-colors ${
                                    statusFilter === s
                                        ? "bg-slate-900 text-white"
                                        : "border border-slate-200 text-slate-500 hover:border-slate-300"
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredCrops.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-8">No crop records match this filter</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="border-b border-slate-100">
                                <th className="text-left text-xs text-slate-400 font-medium pb-3">Crop</th>
                                <th className="text-left text-xs text-slate-400 font-medium pb-3">Variety</th>
                                <th className="text-left text-xs text-slate-400 font-medium pb-3">Field</th>
                                <th className="text-left text-xs text-slate-400 font-medium pb-3">Area</th>
                                <th className="text-left text-xs text-slate-400 font-medium pb-3">Planted</th>
                                <th className="text-left text-xs text-slate-400 font-medium pb-3">Harvest</th>
                                <th className="text-left text-xs text-slate-400 font-medium pb-3">Cost</th>
                                <th className="text-left text-xs text-slate-400 font-medium pb-3">Status</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                            {filteredCrops.map((c: any) => (
                                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-3 font-medium text-slate-900">{c.cropTypeName}</td>
                                    <td className="py-3 text-slate-500">{c.variety}</td>
                                    <td className="py-3 text-slate-500">{c.fieldName}</td>
                                    <td className="py-3 text-slate-900">{c.areaPlanted} ha</td>
                                    <td className="py-3 text-slate-500">{formatDate(c.plantingDate)}</td>
                                    <td className="py-3 text-slate-500">{formatDate(c.expectedHarvestDate)}</td>
                                    <td className="py-3 text-slate-900">{c.totalCost > 0 ? `MWK ${fmt(c.totalCost)}` : "—"}</td>
                                    <td className="py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${statusColors[c.status]}`}>
                        {c.status}
                      </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Activity log */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-medium text-slate-900">Activity log</h2>
                    <div className="flex gap-2 flex-wrap">
                        {activityTypes.map((t) => (
                            <button
                                key={t}
                                onClick={() => setActivityTypeFilter(t)}
                                className={`h-7 px-3 rounded-lg text-xs font-medium transition-colors ${
                                    activityTypeFilter === t
                                        ? "bg-slate-900 text-white"
                                        : "border border-slate-200 text-slate-500 hover:border-slate-300"
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredActivities.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-8">No activities for this season</p>
                ) : (
                    <div className="flex flex-col divide-y divide-slate-50">
                        {filteredActivities.map((a: any) => (
                            <div key={a.id} className="flex items-center gap-4 py-3.5">
                                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-base flex-shrink-0">
                                    {activityIcons[a.activityType] ?? "📋"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900">{a.activityType} &mdash; {a.fieldName}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{a.cropName ?? "Field-wide"}</p>
                                </div>
                                <div className="text-right">
                                    {a.totalCost > 0 && <p className="text-sm font-medium text-slate-900">MWK {fmt(a.totalCost)}</p>}
                                    <p className="text-xs text-slate-400">{formatDate(a.date)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SeasonsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-slate-400" /></div>}>
            <SeasonsContent />
        </Suspense>
    );
}
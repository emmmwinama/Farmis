"use client";

import { useEffect, useState } from "react";
import { Loader2, Users, MapPin, Sprout, Wheat, Wallet, Leaf } from "lucide-react";

function fmt(n: number) { return new Intl.NumberFormat("en-MW").format(Math.round(n)); }

export default function ImpactPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/impact").then((r) => r.json()).then((d) => { setData(d); setLoading(false); });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="w-8 h-8 rounded-full border-2 border-[#1a3d1f] border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto">

            {/* Header */}
            <div className="mb-8">
                <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-4 py-1.5 rounded-full text-xs font-bold mb-4 uppercase tracking-wide">
                    <Leaf size={12} /> Farm Impact Report
                </div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{data?.farmName}</h1>
                <p className="text-slate-400">Your farm's contribution to food security, employment and local economic growth</p>
            </div>

            {/* Hero metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {[
                    { label: "Hectares farmed", value: `${data?.totalArea?.toFixed(1)} ha`, icon: MapPin, color: "from-green-500 to-[#1a3d1f]" },
                    { label: "Food produced", value: `${fmt(data?.foodProducedKg ?? 0)} kg`, icon: Wheat, color: "from-amber-500 to-orange-600" },
                    { label: "People fed", value: `~${fmt(data?.peopleFedEstimate ?? 0)}`, icon: Users, color: "from-blue-500 to-indigo-600" },
                    { label: "Jobs created", value: String(data?.uniqueWorkers ?? 0), icon: Users, color: "from-purple-500 to-pink-600" },
                    { label: "Total revenue", value: `MWK ${fmt(data?.totalRevenue ?? 0)}`, icon: Wallet, color: "from-[#1a3d1f] to-[#3d8c47]" },
                    { label: "Labour days", value: fmt(data?.totalLabourDays ?? 0), icon: Sprout, color: "from-teal-500 to-cyan-600" },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
                            <Icon size={18} className="text-white" />
                        </div>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
                        <p className="text-sm text-slate-400 mt-1">{label}</p>
                    </div>
                ))}
            </div>

            {/* Cost benchmarking */}
            {data?.avgCostPerHa > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 mb-6">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white mb-5">Cost efficiency vs national benchmark</h2>
                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <p className="text-xs text-slate-400 mb-1 uppercase tracking-wide font-semibold">Your cost/ha</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white">MWK {fmt(data.avgCostPerHa)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 mb-1 uppercase tracking-wide font-semibold">Malawi benchmark</p>
                            <p className="text-3xl font-black text-slate-500">MWK {fmt(data.benchmarkCostPerHa)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 mb-1 uppercase tracking-wide font-semibold">Difference</p>
                            <p className={`text-3xl font-black ${(data.costVsBenchmark ?? 0) <= 0 ? "text-green-600" : "text-red-500"}`}>
                                {(data.costVsBenchmark ?? 0) > 0 ? "+" : ""}{data.costVsBenchmark ?? 0}%
                            </p>
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Malawi avg</span>
                            <span>Your cost</span>
                        </div>
                        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                            <div className="h-full bg-slate-300 dark:bg-slate-600 rounded-full" style={{ width: "100%" }} />
                            <div
                                className={`h-full rounded-full absolute top-0 left-0 ${(data.costVsBenchmark ?? 0) <= 0 ? "bg-green-500" : "bg-red-500"}`}
                                style={{ width: `${Math.min((data.avgCostPerHa / data.benchmarkCostPerHa) * 100, 150)}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            {(data.costVsBenchmark ?? 0) <= 0
                                ? `✅ Your farm is ${Math.abs(data.costVsBenchmark ?? 0)}% more cost-efficient than the national average`
                                : `⚠️ Your cost per hectare is ${data.costVsBenchmark}% above the national average — review your input costs`}
                        </p>
                    </div>
                </div>
            )}

            {/* SDG alignment */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 mb-6">
                <div className="flex items-center gap-2 mb-5">
                    <div className="w-6 h-6 rounded bg-[#1a3d1f] flex items-center justify-center">
                        <span className="text-white text-xs font-bold">UN</span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Sustainable Development Goals alignment</h2>
                </div>
                <div className="flex flex-col gap-3">
                    {(data?.sdgImpacts ?? []).map((sdg: any) => (
                        <div key={sdg.goal} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                            <div className="flex-shrink-0">
                                <span className="text-2xl">{sdg.icon}</span>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-black text-[#1a3d1f] dark:text-[#7dd68a] bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-lg">{sdg.goal}</span>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{sdg.title}</p>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{sdg.metric}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Season performance timeline */}
            {(data?.seasonPerformance ?? []).length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 mb-6">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white mb-5">Season performance timeline</h2>
                    <div className="flex flex-col gap-4">
                        {data.seasonPerformance.map((s: any, i: number) => {
                            const revenuePerHa = s.area > 0 ? s.cost / s.area : 0;
                            const yieldPerHa = s.area > 0 && s.yieldKg > 0 ? s.yieldKg / s.area : 0;
                            return (
                                <div key={s.season} className="relative pl-8">
                                    <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-[#1a3d1f] border-2 border-[#7dd68a]" />
                                    {i < data.seasonPerformance.length - 1 && (
                                        <div className="absolute left-[7px] top-6 w-0.5 h-full bg-slate-200 dark:bg-slate-700" />
                                    )}
                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 mb-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="font-bold text-slate-900 dark:text-white">{s.season}</p>
                                            <div className="flex gap-2 flex-wrap justify-end">
                                                {s.crops.map((c: string) => (
                                                    <span key={c} className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-2 py-0.5 rounded-lg font-medium">{c}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-xs text-slate-400">Area</p>
                                                <p className="font-semibold text-slate-900 dark:text-white">{s.area.toFixed(1)} ha</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400">Cost/ha</p>
                                                <p className="font-semibold text-slate-900 dark:text-white">MWK {fmt(revenuePerHa)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400">Yield/ha</p>
                                                <p className="font-semibold text-slate-900 dark:text-white">
                                                    {yieldPerHa > 0 ? `${fmt(yieldPerHa)} kg` : "Not recorded"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Environmental impact */}
            <div className="bg-gradient-to-r from-[#1a3d1f] to-[#2d5c35] rounded-3xl p-6">
                <h2 className="text-base font-bold text-white mb-2">Environmental contribution</h2>
                <p className="text-[#7dd68a] text-sm mb-5">Estimated based on your farmed area and crop production</p>
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: "CO₂ sequestered", value: `~${data?.estimatedCarbonSequesteredTonnes?.toFixed(1)} tonnes`, icon: "🌳" },
                        { label: "Crop diversity", value: `${data?.cropDiversity ?? 0} crop types`, icon: "🌱" },
                        { label: "Seasons active", value: `${data?.totalSeasons ?? 0} seasons`, icon: "📅" },
                    ].map(({ label, value, icon }) => (
                        <div key={label} className="bg-white/10 rounded-2xl p-4 text-center">
                            <span className="text-3xl">{icon}</span>
                            <p className="text-xl font-black text-white mt-2">{value}</p>
                            <p className="text-xs text-[#7dd68a] mt-1">{label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
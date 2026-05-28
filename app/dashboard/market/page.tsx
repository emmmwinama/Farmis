"use client";

import { useEffect, useState } from "react";
import {
    TrendingUp, TrendingDown, Minus, ShoppingCart,
    BarChart2, AlertCircle, CheckCircle, Clock, Filter,
} from "lucide-react";
import Link from "next/link";

function fmt(n: number) {
    return new Intl.NumberFormat("en-MW").format(Math.round(n));
}

const UNIT_LABELS: Record<string, string> = {
    kg: "per kg",
    bag50: "per 50kg bag",
    bag90: "per 90kg bag",
    tonne: "per tonne",
};

const RECOMMENDATION_CONFIG = {
    sell_now: { label: "Sell now", color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300", icon: CheckCircle, iconColor: "text-green-500" },
    acceptable: { label: "Acceptable margin", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300", icon: CheckCircle, iconColor: "text-blue-500" },
    hold: { label: "Consider holding", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300", icon: Clock, iconColor: "text-amber-500" },
    no_data: { label: "No price data", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400", icon: AlertCircle, iconColor: "text-slate-400" },
};

export default function MarketPage() {
    const [market, setMarket] = useState<any>(null);
    const [compare, setCompare] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedCrop, setSelectedCrop] = useState("All");
    const [selectedUnit, setSelectedUnit] = useState("kg");
    const [activeTab, setActiveTab] = useState<"prices" | "mysales">("prices");

    useEffect(() => {
        Promise.all([
            fetch(`/api/market?unit=${selectedUnit}`).then((r) => r.json()),
            fetch("/api/market/compare").then((r) => r.json()),
        ]).then(([m, c]) => {
            setMarket(m);
            setCompare(c);
            setLoading(false);
        });
    }, [selectedUnit]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="w-8 h-8 rounded-full border-2 border-[#1a3d1f] border-t-transparent animate-spin" />
            </div>
        );
    }

    const filteredByCrop = selectedCrop === "All"
        ? (market?.byCrop ?? [])
        : (market?.byCrop ?? []).filter((b: any) => b.cropName === selectedCrop);

    return (
        <div className="p-8 max-w-6xl mx-auto">

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1a3d1f] to-[#3d8c47] flex items-center justify-center">
                        <BarChart2 size={18} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Market Intelligence</h1>
                        <p className="text-sm text-slate-400">ADMARC farm gate prices &amp; selling recommendations</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-3 py-1 rounded-full font-semibold">
            📡 Source: ADMARC Official
          </span>
                    <span className="text-xs text-slate-400">Season: {market?.currentSeason}</span>
                </div>
            </div>

            {/* Season comparison */}
            {market?.seasonComparison?.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                        Price changes — {market.previousSeason} → {market.currentSeason}
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {market.seasonComparison.map((c: any) => {
                            const up = c.changePct > 0;
                            const neutral = c.changePct === 0;
                            return (
                                <div key={c.cropName} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">{c.cropName}</p>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">MWK {fmt(c.currentAvg)}</p>
                                    <p className="text-xs text-slate-400 mb-2">per kg</p>
                                    <div className={`flex items-center gap-1 text-xs font-semibold ${
                                        up ? "text-green-600 dark:text-green-400" :
                                            neutral ? "text-slate-500" : "text-red-500"
                                    }`}>
                                        {up ? <TrendingUp size={12} /> : neutral ? <Minus size={12} /> : <TrendingDown size={12} />}
                                        {up ? "+" : ""}{c.changePct.toFixed(1)}%
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                {[
                    { key: "prices", label: "Market prices" },
                    { key: "mysales", label: "My inventory vs market" },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key as any)}
                        className={`h-9 px-5 rounded-xl text-sm font-semibold transition-colors ${
                            activeTab === key
                                ? "bg-[#1a3d1f] text-white"
                                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300"
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Market Prices Tab */}
            {activeTab === "prices" && (
                <div>
                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 mb-6">
                        <div className="flex items-center gap-2">
                            <Filter size={14} className="text-slate-400" />
                            <select
                                value={selectedCrop}
                                onChange={(e) => setSelectedCrop(e.target.value)}
                                className="h-9 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-700 dark:text-slate-300"
                            >
                                <option value="All">All crops</option>
                                {(market?.allCrops ?? []).map((c: string) => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            {["kg", "bag50", "tonne"].map((u) => (
                                <button
                                    key={u}
                                    onClick={() => setSelectedUnit(u)}
                                    className={`h-9 px-4 rounded-xl text-sm font-medium transition-colors ${
                                        selectedUnit === u
                                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                                            : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"
                                    }`}
                                >
                                    {UNIT_LABELS[u]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Price cards */}
                    <div className="flex flex-col gap-4">
                        {filteredByCrop.map((crop: any) => {
                            const markets = crop.markets.filter((m: any) => m.unit === selectedUnit);
                            if (markets.length === 0) return null;
                            const best = [...markets].sort((a: any, b: any) => b.priceAvg - a.priceAvg)[0];
                            return (
                                <div key={crop.cropName} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-md transition-all">
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white">{crop.cropName}</h3>
                                            <p className="text-xs text-slate-400">{markets.length} market{markets.length !== 1 ? "s" : ""} reporting</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400">Best price</p>
                                            <p className="text-xl font-bold text-[#1a3d1f] dark:text-[#7dd68a]">
                                                MWK {fmt(best.priceAvg)}
                                            </p>
                                            <p className="text-xs text-slate-400">{UNIT_LABELS[selectedUnit]} at {best.market}</p>
                                        </div>
                                    </div>
                                    <div className="px-6 py-4">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                <tr className="border-b border-slate-100 dark:border-slate-800">
                                                    {["Market", "Region", "Min", "Avg", "Max", "Source"].map((h) => (
                                                        <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide pb-2 pr-4">{h}</th>
                                                    ))}
                                                </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                                {markets.sort((a: any, b: any) => b.priceAvg - a.priceAvg).map((m: any, i: number) => (
                                                    <tr key={i} className={i === 0 ? "bg-green-50/50 dark:bg-green-900/10" : ""}>
                                                        <td className="py-2.5 pr-4">
                                                            <p className="font-semibold text-slate-800 dark:text-slate-200">{m.market}</p>
                                                            {i === 0 && <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded font-semibold">Best</span>}
                                                        </td>
                                                        <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400">{m.region}</td>
                                                        <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">MWK {fmt(m.priceMin)}</td>
                                                        <td className="py-2.5 pr-4 font-bold text-slate-900 dark:text-white">MWK {fmt(m.priceAvg)}</td>
                                                        <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">MWK {fmt(m.priceMax)}</td>
                                                        <td className="py-2.5 text-xs text-slate-400">{m.source}</td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* My Inventory vs Market Tab */}
            {activeTab === "mysales" && (
                <div>
                    {(compare?.comparisons ?? []).length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center">
                            <ShoppingCart size={40} className="text-slate-300 mx-auto mb-4" />
                            <p className="font-bold text-slate-900 dark:text-white mb-2">No inventory to compare</p>
                            <p className="text-sm text-slate-400 mb-6">Record a harvest to see how your costs compare to market prices</p>
                            <Link href="/dashboard/yields" className="inline-flex items-center gap-2 h-10 px-5 bg-[#1a3d1f] text-white text-sm font-semibold rounded-xl hover:bg-[#2d5c35] transition-colors">
                                Record harvest
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-5">
                            {compare.comparisons.map((item: any) => {
                                const rec = RECOMMENDATION_CONFIG[item.recommendation as keyof typeof RECOMMENDATION_CONFIG];
                                const RecIcon = rec.icon;
                                return (
                                    <div key={item.inventoryItemId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-md transition-all">
                                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{item.cropName}</h3>
                                                    <p className="text-sm text-slate-400">{item.variety} · {item.season} · {item.availableQty} {item.unit} available</p>
                                                </div>
                                                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${rec.color}`}>
                                                    <RecIcon size={15} className={rec.iconColor} />
                                                    {rec.label}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="px-6 py-4">
                                            <div className="grid grid-cols-3 gap-4 mb-5">
                                                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                                                    <p className="text-xs text-slate-400 mb-1">Your cost / kg</p>
                                                    <p className="text-xl font-bold text-slate-900 dark:text-white">MWK {fmt(item.costPerKg)}</p>
                                                </div>
                                                {item.bestPrice && (
                                                    <>
                                                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                                                            <p className="text-xs text-slate-400 mb-1">Best market price / kg</p>
                                                            <p className="text-xl font-bold text-[#1a3d1f] dark:text-[#7dd68a]">MWK {fmt(item.bestPrice.priceAvg)}</p>
                                                            <p className="text-xs text-slate-400">{item.bestPrice.market}</p>
                                                        </div>
                                                        <div className={`rounded-xl p-4 ${item.bestPrice.profitPerKg >= 0 ? "bg-blue-50 dark:bg-blue-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
                                                            <p className="text-xs text-slate-400 mb-1">Profit / kg</p>
                                                            <p className={`text-xl font-bold ${item.bestPrice.profitPerKg >= 0 ? "text-blue-700 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}>
                                                                {item.bestPrice.profitPerKg >= 0 ? "+" : ""}MWK {fmt(Math.abs(item.bestPrice.profitPerKg))}
                                                            </p>
                                                            <p className="text-xs text-slate-400">{item.bestPrice.marginPct}% margin</p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* Market price table */}
                                            {item.marketPrices?.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Available markets</p>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm">
                                                            <thead>
                                                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                                                {["Market", "Region", "Price/kg", "Your profit/kg", "Margin", "Season"].map((h) => (
                                                                    <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide pb-2 pr-4">{h}</th>
                                                                ))}
                                                            </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                                            {item.marketPrices.sort((a: any, b: any) => b.profitPerKg - a.profitPerKg).map((mp: any, i: number) => (
                                                                <tr key={i}>
                                                                    <td className="py-2.5 pr-4 font-semibold text-slate-800 dark:text-slate-200">{mp.market}</td>
                                                                    <td className="py-2.5 pr-4 text-slate-500">{mp.region}</td>
                                                                    <td className="py-2.5 pr-4 font-bold text-slate-900 dark:text-white">MWK {fmt(mp.priceAvg)}</td>
                                                                    <td className={`py-2.5 pr-4 font-bold ${mp.profitPerKg >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                                                                        {mp.profitPerKg >= 0 ? "+" : ""}MWK {fmt(mp.profitPerKg)}
                                                                    </td>
                                                                    <td className={`py-2.5 pr-4 font-semibold ${mp.marginPct >= 20 ? "text-green-600" : mp.marginPct >= 0 ? "text-amber-600" : "text-red-500"}`}>
                                                                        {mp.marginPct}%
                                                                    </td>
                                                                    <td className="py-2.5 text-xs text-slate-400">{mp.season}</td>
                                                                </tr>
                                                            ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}

                                            {item.bestPrice && item.availableQty > 0 && (
                                                <div className="mt-4 bg-[#1a3d1f]/5 dark:bg-[#1a3d1f]/20 border border-[#1a3d1f]/20 rounded-xl p-4">
                                                    <p className="text-sm font-bold text-[#1a3d1f] dark:text-[#7dd68a] mb-1">
                                                        💡 If you sell all {item.availableQty} {item.unit} at {item.bestPrice.market}:
                                                    </p>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                                        Revenue: <strong className="text-slate-900 dark:text-white">MWK {fmt(item.availableQty * item.bestPrice.priceAvg)}</strong>
                                                        {" · "} Profit: <strong className={item.bestPrice.profitPerKg >= 0 ? "text-green-600" : "text-red-500"}>
                                                        MWK {fmt(item.availableQty * item.bestPrice.profitPerKg)}
                                                    </strong>
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
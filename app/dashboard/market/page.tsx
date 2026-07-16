"use client";

import { useEffect, useState } from "react";
import {
    TrendingUp, TrendingDown, Minus, ShoppingCart,
    BarChart2, AlertCircle, CheckCircle, Clock, Filter,
} from "lucide-react";
import Link from "next/link";

function fmt(n: number) { return new Intl.NumberFormat("en-MW").format(Math.round(n)); }

const UNIT_LABELS: Record<string, string> = {
    kg:     "per kg",
    bag50:  "per 50 kg bag",
    bag90:  "per 90 kg bag",
    tonne:  "per tonne",
};

const REC_CONFIG: Record<string, { label: string; bg: string; color: string; Icon: any }> = {
    sell_now:   { label: "Sell now",           bg: "#ECFDF5", color: "#166534", Icon: CheckCircle },
    acceptable: { label: "Acceptable margin",  bg: "#EFF6FF", color: "#1E3A8A", Icon: CheckCircle },
    hold:       { label: "Consider holding",   bg: "#F0F9FF", color: "#075985", Icon: Clock       },
    no_data:    { label: "No price data",      bg: "#F8FAFC", color: "#475569", Icon: AlertCircle },
};

const SEL: React.CSSProperties = {
    height: "36px", padding: "0 12px",
    fontSize: "12px", outline: "none", borderRadius: "10px",
    border: "1px solid var(--border)",
    background: "var(--bg-card)",
    color: "var(--text-primary)",
};

export default function MarketPage() {
    const [market,       setMarket]       = useState<any>(null);
    const [compare,      setCompare]      = useState<any>(null);
    const [loading,      setLoading]      = useState(true);
    const [selectedCrop, setSelectedCrop] = useState("All");
    const [selectedUnit, setSelectedUnit] = useState("kg");
    const [activeTab,    setActiveTab]    = useState<"prices" | "mysales">("prices");

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch(`/api/market?unit=${selectedUnit}`).then((r) => r.json()),
            fetch("/api/market/compare").then((r) => r.json()),
        ]).then(([m, c]) => { setMarket(m); setCompare(c); setLoading(false); });
    }, [selectedUnit]);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader size={24} style={{ color: "var(--farm-green)" }} />
        </div>
    );

    const filteredByCrop = selectedCrop === "All"
        ? (market?.byCrop ?? [])
        : (market?.byCrop ?? []).filter((b: any) => b.cropName === selectedCrop);

    return (
        <div className="p-8 max-w-6xl mx-auto">

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                         style={{ background: "var(--farm-green)" }}>
                        <BarChart2 size={18} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)", letterSpacing: "-0.04em" }}>
                            Market intelligence
                        </h1>
                        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                            ADMARC farm gate prices &amp; selling recommendations
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 mt-3">
                    <span className="text-[10px] font-black px-3 py-1 rounded-full"
                          style={{ background: "#ECFDF5", color: "#166534" }}>
                        Source: ADMARC Official
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Season: {market?.currentSeason}
                    </span>
                </div>
            </div>

            {/* Season comparison strip */}
            {market?.seasonComparison?.length > 0 && (
                <div className="mb-8">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                        Price changes — {market.previousSeason} → {market.currentSeason}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {market.seasonComparison.map((c: any) => {
                            const up      = c.changePct > 0;
                            const neutral = c.changePct === 0;
                            const col     = up ? "#16A34A" : neutral ? "var(--text-muted)" : "#DC2626";
                            return (
                                <div key={c.cropName}
                                     className="rounded-2xl p-4 transition-all"
                                     style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                                     onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--farm-green)")}
                                     onMouseOut={(e)  => (e.currentTarget.style.borderColor = "var(--border)")}>
                                    <p className="text-xs font-extrabold mb-2" style={{ color: "var(--text-primary)" }}>
                                        {c.cropName}
                                    </p>
                                    <p className="text-base font-black" style={{ color: "var(--text-primary)" }}>
                                        MWK {fmt(c.currentAvg)}
                                    </p>
                                    <p className="text-[10px] mb-2" style={{ color: "var(--text-muted)" }}>per kg</p>
                                    <div className="flex items-center gap-1 text-xs font-bold" style={{ color: col }}>
                                        {up ? <TrendingUp size={11} /> : neutral ? <Minus size={11} /> : <TrendingDown size={11} />}
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
                    { key: "prices",   label: "Market prices"           },
                    { key: "mysales",  label: "My inventory vs market"  },
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

            {/* ── Market prices tab ─────────────────────────────────────────── */}
            {activeTab === "prices" && (
                <div>
                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 mb-6">
                        <div className="flex items-center gap-2">
                            <Filter size={13} style={{ color: "var(--text-muted)" }} />
                            <select value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)} style={SEL}>
                                <option value="All">All crops</option>
                                {(market?.allCrops ?? []).map((c: string) => <option key={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Unit toggle */}
                        <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                            {["kg", "bag50", "tonne"].map((u) => (
                                <button key={u} onClick={() => setSelectedUnit(u)}
                                        className="h-9 px-4 text-xs font-bold transition-all"
                                        style={{
                                            background: selectedUnit === u ? "var(--farm-green)" : "var(--bg-card)",
                                            color:      selectedUnit === u ? "white"             : "var(--text-muted)",
                                        }}>
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
                                <div key={crop.cropName} className="rounded-2xl overflow-hidden"
                                     style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>

                                    {/* Card header */}
                                    <div className="flex items-center justify-between px-6 py-4"
                                         style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                                        <div>
                                            <h3 className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                                                {crop.cropName}
                                            </h3>
                                            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                                                {markets.length} market{markets.length !== 1 ? "s" : ""} reporting
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase tracking-wide mb-0.5"
                                               style={{ color: "var(--text-muted)" }}>
                                                Best price
                                            </p>
                                            <p className="text-xl font-black" style={{ color: "var(--farm-green)" }}>
                                                MWK {fmt(best.priceAvg)}
                                            </p>
                                            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                                                {UNIT_LABELS[selectedUnit]} at {best.market}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Markets table */}
                                    <div className="px-6 py-4 overflow-x-auto">
                                        <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
                                            <thead>
                                            <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                                {["Market", "Region", "Min", "Avg", "Max", "Source"].map((h) => (
                                                    <th key={h} className="text-left pb-2 pr-4 text-[10px] font-black uppercase tracking-widest"
                                                        style={{ color: "var(--text-muted)" }}>
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {[...markets].sort((a: any, b: any) => b.priceAvg - a.priceAvg).map((m: any, i: number) => (
                                                <tr key={i}
                                                    style={{
                                                        borderBottom: "1px solid var(--border)",
                                                        background: i === 0 ? "var(--farm-pale)" : "transparent",
                                                    }}>
                                                    <td className="py-2.5 pr-4">
                                                        <p className="text-xs font-extrabold" style={{ color: "var(--text-primary)" }}>
                                                            {m.market}
                                                        </p>
                                                        {i === 0 && (
                                                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                                                                  style={{ background: "#ECFDF5", color: "#166534" }}>
                                                                    Best
                                                                </span>
                                                        )}
                                                    </td>
                                                    <td className="py-2.5 pr-4 text-xs" style={{ color: "var(--text-muted)" }}>{m.region}</td>
                                                    <td className="py-2.5 pr-4 text-xs" style={{ color: "var(--text-secondary)" }}>MWK {fmt(m.priceMin)}</td>
                                                    <td className="py-2.5 pr-4 text-xs font-extrabold" style={{ color: "var(--text-primary)" }}>MWK {fmt(m.priceAvg)}</td>
                                                    <td className="py-2.5 pr-4 text-xs" style={{ color: "var(--text-secondary)" }}>MWK {fmt(m.priceMax)}</td>
                                                    <td className="py-2.5 text-xs" style={{ color: "var(--text-muted)" }}>{m.source}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── My inventory vs market tab ────────────────────────────────── */}
            {activeTab === "mysales" && (
                <div>
                    {(compare?.comparisons ?? []).length === 0 ? (
                        <div className="rounded-2xl p-16 text-center"
                             style={{ background: "var(--bg-card)", border: "1.5px dashed var(--border)" }}>
                            <ShoppingCart size={28} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                            <p className="font-black mb-1" style={{ color: "var(--text-primary)" }}>
                                No inventory to compare
                            </p>
                            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                                Record a harvest to see how your costs compare to market prices
                            </p>
                            <Link href="/dashboard/yields"
                                  className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold text-white"
                                  style={{ background: "var(--farm-green)" }}>
                                Record harvest
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-5">
                            {compare.comparisons.map((item: any) => {
                                const rec = REC_CONFIG[item.recommendation as keyof typeof REC_CONFIG] ?? REC_CONFIG.no_data;
                                const RecIcon = rec.Icon;

                                return (
                                    <div key={item.inventoryItemId} className="rounded-2xl overflow-hidden"
                                         style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>

                                        {/* Item header */}
                                        <div className="flex items-start justify-between px-6 py-5"
                                             style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                                            <div>
                                                <h3 className="text-base font-extrabold" style={{ color: "var(--text-primary)" }}>
                                                    {item.cropName}
                                                </h3>
                                                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                                                    {item.variety} · {item.season} · {item.availableQty} {item.unit} available
                                                </p>
                                            </div>
                                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black flex-shrink-0"
                                                  style={{ background: rec.bg, color: rec.color }}>
                                                <RecIcon size={12} />
                                                {rec.label}
                                            </span>
                                        </div>

                                        <div className="px-6 py-5 flex flex-col gap-5">
                                            {/* 3 metric cards */}
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="rounded-xl p-4"
                                                     style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                                                    <p className="text-[10px] font-black uppercase tracking-wide mb-1"
                                                       style={{ color: "var(--text-muted)" }}>
                                                        Your cost / kg
                                                    </p>
                                                    <p className="text-xl font-black" style={{ color: "var(--text-primary)" }}>
                                                        MWK {fmt(item.costPerKg)}
                                                    </p>
                                                </div>
                                                {item.bestPrice && (
                                                    <>
                                                        <div className="rounded-xl p-4"
                                                             style={{ background: "var(--farm-pale)", border: "1px solid #86efac" }}>
                                                            <p className="text-[10px] font-black uppercase tracking-wide mb-1"
                                                               style={{ color: "var(--text-muted)" }}>
                                                                Best market / kg
                                                            </p>
                                                            <p className="text-xl font-black" style={{ color: "var(--farm-green)" }}>
                                                                MWK {fmt(item.bestPrice.priceAvg)}
                                                            </p>
                                                            <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                                                                {item.bestPrice.market}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-xl p-4"
                                                             style={{
                                                                 background: item.bestPrice.profitPerKg >= 0 ? "#EFF6FF" : "#FEF2F2",
                                                                 border: `1px solid ${item.bestPrice.profitPerKg >= 0 ? "#BFDBFE" : "#FCA5A5"}`,
                                                             }}>
                                                            <p className="text-[10px] font-black uppercase tracking-wide mb-1"
                                                               style={{ color: "var(--text-muted)" }}>
                                                                Profit / kg
                                                            </p>
                                                            <p className="text-xl font-black"
                                                               style={{ color: item.bestPrice.profitPerKg >= 0 ? "#2563EB" : "#DC2626" }}>
                                                                {item.bestPrice.profitPerKg >= 0 ? "+" : "−"}MWK {fmt(Math.abs(item.bestPrice.profitPerKg))}
                                                            </p>
                                                            <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                                                                {item.bestPrice.marginPct}% margin
                                                            </p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* All markets table */}
                                            {item.marketPrices?.length > 0 && (
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest mb-3"
                                                       style={{ color: "var(--text-muted)" }}>
                                                        Available markets
                                                    </p>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm">
                                                            <thead>
                                                            <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                                                {["Market", "Region", "Price / kg", "Profit / kg", "Margin", "Season"].map((h) => (
                                                                    <th key={h} className="text-left pb-2 pr-4 text-[10px] font-black uppercase tracking-widest"
                                                                        style={{ color: "var(--text-muted)" }}>
                                                                        {h}
                                                                    </th>
                                                                ))}
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                            {[...item.marketPrices].sort((a: any, b: any) => b.profitPerKg - a.profitPerKg).map((mp: any, i: number) => {
                                                                const marginGood = mp.marginPct >= 20;
                                                                const marginOk   = mp.marginPct >= 0;
                                                                const marginCol  = marginGood ? "#16A34A" : marginOk ? "#0284C7" : "#DC2626";
                                                                return (
                                                                    <tr key={i}
                                                                        style={{ borderBottom: "1px solid var(--border)" }}
                                                                        onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
                                                                        onMouseOut={(e)  => (e.currentTarget.style.background = "transparent")}>
                                                                        <td className="py-2.5 pr-4 text-xs font-extrabold" style={{ color: "var(--text-primary)" }}>
                                                                            {mp.market}
                                                                        </td>
                                                                        <td className="py-2.5 pr-4 text-xs" style={{ color: "var(--text-muted)" }}>{mp.region}</td>
                                                                        <td className="py-2.5 pr-4 text-xs font-extrabold" style={{ color: "var(--text-primary)" }}>
                                                                            MWK {fmt(mp.priceAvg)}
                                                                        </td>
                                                                        <td className="py-2.5 pr-4 text-xs font-extrabold"
                                                                            style={{ color: mp.profitPerKg >= 0 ? "#16A34A" : "#DC2626" }}>
                                                                            {mp.profitPerKg >= 0 ? "+" : "−"}MWK {fmt(Math.abs(mp.profitPerKg))}
                                                                        </td>
                                                                        <td className="py-2.5 pr-4 text-xs font-extrabold" style={{ color: marginCol }}>
                                                                            {mp.marginPct}%
                                                                        </td>
                                                                        <td className="py-2.5 text-xs" style={{ color: "var(--text-muted)" }}>{mp.season}</td>
                                                                    </tr>
                                                                );
                                                            })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Sell-all projection */}
                                            {item.bestPrice && item.availableQty > 0 && (
                                                <div className="rounded-xl p-4"
                                                     style={{ background: "var(--farm-pale)", border: "1.5px solid var(--farm-green)" }}>
                                                    <p className="text-sm font-extrabold mb-1" style={{ color: "var(--farm-green)" }}>
                                                        If you sell all {item.availableQty} {item.unit} at {item.bestPrice.market}:
                                                    </p>
                                                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                                                        Revenue:{" "}
                                                        <span className="font-extrabold" style={{ color: "var(--text-primary)" }}>
                                                            MWK {fmt(item.availableQty * item.bestPrice.priceAvg)}
                                                        </span>
                                                        {" · "}Profit:{" "}
                                                        <span className="font-extrabold"
                                                              style={{ color: item.bestPrice.profitPerKg >= 0 ? "#16A34A" : "#DC2626" }}>
                                                            MWK {fmt(item.availableQty * item.bestPrice.profitPerKg)}
                                                        </span>
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

function Loader({ size, style }: { size: number; style?: React.CSSProperties }) {
    return <div style={{ width: size, height: size, borderRadius: "50%", border: "2.5px solid currentColor", borderTopColor: "transparent", animation: "spin 0.7s linear infinite", ...style }} />;
}

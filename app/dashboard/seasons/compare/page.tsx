"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingUp, TrendingDown, Minus, ArrowLeftRight } from "lucide-react";

function fmt(n: number) { return new Intl.NumberFormat("en-MW").format(Math.round(n)); }

function DiffBadge({ diff, lowerIsBetter = false }: { diff: any; lowerIsBetter?: boolean }) {
    if (!diff || diff.pct === null) return <span className="badge badge-warm">—</span>;
    const improved = lowerIsBetter ? diff.value < 0 : diff.value > 0;
    return (
        <span className={`badge ${improved ? "badge-green" : "badge-red"} flex items-center gap-1`}>
      {improved ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
            {diff.value > 0 ? "+" : ""}{diff.pct.toFixed(1)}%
    </span>
    );
}

export default function SeasonComparePage() {
    const [seasons, setSeasons] = useState<string[]>([]);
    const [seasonA, setSeasonA] = useState("");
    const [seasonB, setSeasonB] = useState("");
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [loadingSeasons, setLoadingSeasons] = useState(true);

    useEffect(() => {
        fetch("/api/seasons")
            .then((r) => r.json())
            .then((d) => {
                const s = d.allSeasons ?? [];
                setSeasons(s);
                if (s.length >= 2) { setSeasonA(s[0]); setSeasonB(s[1]); }
                else if (s.length === 1) setSeasonA(s[0]);
                setLoadingSeasons(false);
            });
    }, []);

    const compare = async () => {
        if (!seasonA || !seasonB || seasonA === seasonB) return;
        setLoading(true);
        const res = await fetch(`/api/seasons/compare?a=${encodeURIComponent(seasonA)}&b=${encodeURIComponent(seasonB)}`);
        const d = await res.json();
        setData(d);
        setLoading(false);
    };

    useEffect(() => { if (seasonA && seasonB && seasonA !== seasonB) compare(); }, [seasonA, seasonB]);

    const metrics = data ? [
        { label: "Total cost",     a: `MWK ${fmt(data.seasonA.totalCost)}`,     b: `MWK ${fmt(data.seasonB.totalCost)}`,    diff: data.comparison.totalCost,    lowerIsBetter: true },
        { label: "Cost / ha",      a: `MWK ${fmt(data.seasonA.costPerHa)}`,     b: `MWK ${fmt(data.seasonB.costPerHa)}`,   diff: data.comparison.costPerHa,    lowerIsBetter: true },
        { label: "Yield (kg)",     a: fmt(data.seasonA.totalYieldKg),           b: fmt(data.seasonB.totalYieldKg),          diff: data.comparison.totalYieldKg, lowerIsBetter: false },
        { label: "Yield / ha",     a: data.seasonA.yieldPerHa > 0 ? `${fmt(data.seasonA.yieldPerHa)} kg` : "—", b: data.seasonB.yieldPerHa > 0 ? `${fmt(data.seasonB.yieldPerHa)} kg` : "—", diff: data.comparison.yieldPerHa, lowerIsBetter: false },
        { label: "Gross profit",   a: `MWK ${fmt(data.seasonA.grossProfit)}`,   b: `MWK ${fmt(data.seasonB.grossProfit)}`, diff: data.comparison.grossProfit,  lowerIsBetter: false },
        { label: "Cost / kg",      a: data.seasonA.costPerKg ? `MWK ${fmt(data.seasonA.costPerKg)}` : "—", b: data.seasonB.costPerKg ? `MWK ${fmt(data.seasonB.costPerKg)}` : "—", diff: data.comparison.costPerKg, lowerIsBetter: true },
        { label: "Activities",     a: String(data.seasonA.activities),           b: String(data.seasonB.activities),         diff: data.comparison.activities,   lowerIsBetter: false },
        { label: "Area planted",   a: `${data.seasonA.totalArea.toFixed(1)} ha`, b: `${data.seasonB.totalArea.toFixed(1)} ha`, diff: null, lowerIsBetter: false },
    ] : [];

    return (
        <div className="p-8 max-w-5xl mx-auto animate-fade-in">

            <div className="page-header">
                <h1 className="page-title">Season Comparison</h1>
                <p className="page-subtitle">Compare performance across two growing seasons</p>
            </div>

            {/* Season selectors */}
            <div className="flex items-center gap-4 mb-8">
                <div className="flex-1">
                    <label className="form-label">Season A</label>
                    <select value={seasonA} onChange={(e) => setSeasonA(e.target.value)}
                            className="input">
                        <option value="">Select season...</option>
                        {seasons.map((s) => <option key={s}>{s}</option>)}
                    </select>
                </div>
                <div className="pt-5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                         style={{ background: "var(--bg-muted)", color: "var(--text-muted)" }}>
                        <ArrowLeftRight size={16} />
                    </div>
                </div>
                <div className="flex-1">
                    <label className="form-label">Season B</label>
                    <select value={seasonB} onChange={(e) => setSeasonB(e.target.value)}
                            className="input">
                        <option value="">Select season...</option>
                        {seasons.filter((s) => s !== seasonA).map((s) => <option key={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {loadingSeasons ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={24} className="animate-spin" style={{ color: "var(--farm-green)" }} />
                </div>
            ) : seasons.length < 2 ? (
                <div className="rounded-2xl p-12 text-center"
                     style={{ background: "var(--bg-card)", border: "1.5px dashed var(--border)" }}>
                    <p className="section-title mb-2">Need at least 2 seasons</p>
                    <p className="section-subtitle">Add crops with different season names to compare them</p>
                </div>
            ) : loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 size={24} className="animate-spin" style={{ color: "var(--farm-green)" }} />
                        <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>Comparing seasons...</p>
                    </div>
                </div>
            ) : data ? (
                <>
                    {/* Season overview cards */}
                    <div className="grid grid-cols-2 gap-6 mb-8">
                        {[data.seasonA, data.seasonB].map((s, i) => (
                            <div key={s.season} className="rounded-2xl p-6"
                                 style={{
                                     background: i === 0
                                         ? "linear-gradient(135deg, #1a3d1f, #2d6a35)"
                                         : "linear-gradient(135deg, #1E40AF, #2563EB)",
                                 }}>
                                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">
                                    Season {i === 0 ? "A" : "B"}
                                </p>
                                <p className="text-white text-2xl font-black mb-4">{s.season}</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: "Crops", value: String(s.cropCount) },
                                        { label: "Area", value: `${s.totalArea.toFixed(1)} ha` },
                                        { label: "Activities", value: String(s.activities) },
                                        { label: "Crop types", value: s.crops.join(", ") || "—" },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="rounded-xl p-3"
                                             style={{ background: "rgba(255,255,255,0.12)" }}>
                                            <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-1">{label}</p>
                                            <p className="text-white font-bold text-sm truncate">{value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Comparison table */}
                    <div className="rounded-2xl overflow-hidden"
                         style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(28,25,23,0.06)" }}>
                        <div className="px-5 py-4 border-b"
                             style={{ background: "var(--bg-subtle)", borderColor: "var(--border)" }}>
                            <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                                Detailed comparison
                            </p>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                {data.seasonA.season} vs {data.seasonB.season} — changes shown from B → A
                            </p>
                        </div>
                        <table className="data-table w-full">
                            <thead>
                            <tr>
                                <th>Metric</th>
                                <th>{data.seasonA.season}</th>
                                <th>{data.seasonB.season}</th>
                                <th>Change</th>
                            </tr>
                            </thead>
                            <tbody>
                            {metrics.map(({ label, a, b, diff, lowerIsBetter }) => (
                                <tr key={label}>
                                    <td className="font-bold" style={{ color: "var(--text-primary)" }}>{label}</td>
                                    <td className="font-extrabold" style={{ color: "#1a3d1f" }}>{a}</td>
                                    <td className="font-extrabold" style={{ color: "#1E40AF" }}>{b}</td>
                                    <td><DiffBadge diff={diff} lowerIsBetter={lowerIsBetter} /></td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Insight summary */}
                    <div className="rounded-2xl p-5 mt-5"
                         style={{ background: "var(--farm-pale)", border: "1.5px solid var(--farm-light)20" }}>
                        <p className="text-sm font-extrabold mb-3" style={{ color: "var(--farm-green)" }}>
                            📊 Key takeaways
                        </p>
                        <div className="flex flex-col gap-2 text-sm" style={{ color: "var(--farm-green)", opacity: 0.8 }}>
                            {data.comparison.costPerHa.value < 0 && (
                                <p>✅ Cost per hectare improved by {Math.abs(data.comparison.costPerHa.pct).toFixed(1)}% — good cost management</p>
                            )}
                            {data.comparison.costPerHa.value > 0 && (
                                <p>⚠️ Cost per hectare increased by {data.comparison.costPerHa.pct.toFixed(1)}% — review input costs</p>
                            )}
                            {data.comparison.yieldPerHa.value > 0 && (
                                <p>✅ Yield per hectare improved by {data.comparison.yieldPerHa.pct.toFixed(1)}% — great progress</p>
                            )}
                            {data.comparison.grossProfit.value > 0 && (
                                <p>✅ Profitability improved by MWK {fmt(data.comparison.grossProfit.value)}</p>
                            )}
                            {data.comparison.grossProfit.value < 0 && (
                                <p>⚠️ Profitability declined by MWK {fmt(Math.abs(data.comparison.grossProfit.value))} — analyse cost drivers</p>
                            )}
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    );
}
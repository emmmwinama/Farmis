"use client";

import { useEffect, useState } from "react";
import { Loader2, ChevronDown } from "lucide-react";


function fmt(n: number) {
    return new Intl.NumberFormat("en-MW").format(Math.round(n));
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const REPORTS = [
    { key: "season", label: "Season profitability" },
    { key: "crop", label: "Crop cost analysis" },
    { key: "field", label: "Field cost analysis" },
    { key: "cropfield", label: "Crop-field detail" },
    { key: "employee", label: "Labour summary" },
    { key: "input", label: "Input usage" },
    { key: "yields", label: "Yield analysis" },
];

export default function ReportsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeReport, setActiveReport] = useState("season");
    const [seasonFilter, setSeasonFilter] = useState("All");
    const [fieldFilter, setFieldFilter] = useState("All");

    useEffect(() => {
        fetch("/api/reports")
            .then((r) => r.json())
            .then((d) => { setData(d); setLoading(false); });
    }, []);

    if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-slate-400" /></div>;

    const allSeasons = [...new Set((data?.cropFieldDetail ?? []).map((c: any) => c.season))] as string[];
    const allFields = [...new Set((data?.cropFieldDetail ?? []).map((c: any) => c.fieldName))] as string[];

    const filteredCropField = (data?.cropFieldDetail ?? []).filter((c: any) => {
        if (seasonFilter !== "All" && c.season !== seasonFilter) return false;
        if (fieldFilter !== "All" && c.fieldName !== fieldFilter) return false;
        return true;
    });

    return (
        <div className="p-8 max-w-6xl mx-auto">

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-medium text-slate-900">Reports</h1>
                <p className="text-slate-400 text-sm mt-1">Detailed analysis of your farm performance</p>
            </div>

            {/* Finance summary banner */}
            {data?.financeSummary && (
                <div className="bg-slate-900 rounded-2xl p-6 mb-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: "Total income", value: `MWK ${fmt(data.financeSummary.totalIncome)}`, color: "text-green-400" },
                        { label: "Activity costs", value: `MWK ${fmt(data.financeSummary.totalActivityCost)}`, color: "text-red-400" },
                        { label: "Overhead costs", value: `MWK ${fmt(data.financeSummary.totalOverheadCost)}`, color: "text-orange-400" },
                        { label: "Net balance", value: `MWK ${fmt(data.financeSummary.net)}`, color: data.financeSummary.net >= 0 ? "text-green-400" : "text-red-400" },
                    ].map(({ label, value, color }) => (
                        <div key={label}>
                            <p className="text-xs text-slate-400 mb-1">{label}</p>
                            <p className={`text-xl font-medium ${color}`}>{value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Report selector */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {REPORTS.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setActiveReport(key)}
                        className={`h-9 px-4 rounded-xl text-sm font-medium transition-colors ${
                            activeReport === key
                                ? "bg-slate-900 text-white"
                                : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Season profitability ─────────────────────────────────────────────── */}
            {activeReport === "season" && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100">
                        <h2 className="text-base font-medium text-slate-900">Season profitability</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Cost breakdown and efficiency per growing season</p>
                    </div>
                    {data.seasonReport.length === 0 ? (
                        <div className="p-16 text-center"><p className="text-slate-400 text-sm">No season data yet</p></div>
                    ) : (
                        <>
                            <div className="grid grid-cols-7 px-6 py-3 border-b border-slate-100 bg-slate-50">
                                {["Season", "Area (ha)", "Crops", "Labour cost", "Input cost", "Total cost", "Cost/ha"].map((h) => (
                                    <p key={h} className="text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</p>
                                ))}
                            </div>
                            <div className="flex flex-col divide-y divide-slate-50">
                                {data.seasonReport.map((s: any, i: number) => (
                                    <div key={`${s.season}-${i}`} className="grid grid-cols-7 px-6 py-4 hover:bg-slate-50 transition-colors">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{s.season}</p>
                                            <p className="text-xs text-slate-400">{s.fields.join(", ")}</p>
                                        </div>
                                        <p className="text-sm text-slate-900">{s.totalArea.toFixed(1)}</p>
                                        <div>
                                            <p className="text-sm text-slate-900">{s.cropCount}</p>
                                            <p className="text-xs text-slate-400">{s.crops.slice(0, 2).join(", ")}{s.crops.length > 2 ? ` +${s.crops.length - 2}` : ""}</p>
                                        </div>
                                        <p className="text-sm text-slate-900">MWK {fmt(s.labourCost)}</p>
                                        <p className="text-sm text-slate-900">MWK {fmt(s.inputCost)}</p>
                                        <p className="text-sm font-medium text-red-600">MWK {fmt(s.totalCost)}</p>
                                        <p className="text-sm font-medium text-slate-900">MWK {fmt(s.costPerHectare)}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── Crop cost analysis ───────────────────────────────────────────────── */}
            {activeReport === "crop" && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100">
                        <h2 className="text-base font-medium text-slate-900">Crop cost analysis</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Aggregated costs per crop type across all seasons and fields</p>
                    </div>
                    {data.cropReport.length === 0 ? (
                        <div className="p-16 text-center"><p className="text-slate-400 text-sm">No crop data yet</p></div>
                    ) : (
                        <>
                            <div className="grid grid-cols-7 px-6 py-3 border-b border-slate-100 bg-slate-50">
                                {["Crop", "Area (ha)", "Records", "Labour", "Inputs", "Total cost", "Cost/ha"].map((h) => (
                                    <p key={h} className="text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</p>
                                ))}
                            </div>
                            <div className="flex flex-col divide-y divide-slate-50">
                                {data.cropReport.map((c: any, i: number) => (
                                    <div key={`${c.cropName}-${i}`} className="grid grid-cols-7 px-6 py-4 hover:bg-slate-50 transition-colors">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{c.cropName}</p>
                                            <p className="text-xs text-slate-400">{c.seasons.length} season{c.seasons.length !== 1 ? "s" : ""}</p>
                                        </div>
                                        <p className="text-sm text-slate-900">{c.totalArea.toFixed(1)}</p>
                                        <p className="text-sm text-slate-900">{c.count}</p>
                                        <p className="text-sm text-slate-900">MWK {fmt(c.labourCost)}</p>
                                        <p className="text-sm text-slate-900">MWK {fmt(c.inputCost)}</p>
                                        <p className="text-sm font-medium text-red-600">MWK {fmt(c.totalCost)}</p>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">MWK {fmt(c.costPerHectare)}</p>
                                            <div className="h-1 bg-slate-100 rounded-full mt-1 overflow-hidden" style={{ width: "60px" }}>
                                                <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min((c.costPerHectare / (data.cropReport[0]?.costPerHectare || 1)) * 100, 100)}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── Field cost analysis ──────────────────────────────────────────────── */}
            {activeReport === "field" && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100">
                        <h2 className="text-base font-medium text-slate-900">Field cost analysis</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Total costs incurred per field</p>
                    </div>
                    {data.fieldReport.length === 0 ? (
                        <div className="p-16 text-center"><p className="text-slate-400 text-sm">No field data yet</p></div>
                    ) : (
                        <>
                            <div className="grid grid-cols-6 px-6 py-3 border-b border-slate-100 bg-slate-50">
                                {["Field", "Total / Planted (ha)", "Soil", "Labour", "Total cost", "Cost/ha"].map((h) => (
                                    <p key={h} className="text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</p>
                                ))}
                            </div>
                            <div className="flex flex-col divide-y divide-slate-50">
                                {data.fieldReport.map((f: any, i: number) => (
                                    <div key={`${f.fieldId}-${i}`} className="grid grid-cols-6 px-6 py-4 hover:bg-slate-50 transition-colors">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{f.fieldName}</p>
                                            <p className="text-xs text-slate-400">{f.crops.slice(0, 2).join(", ")}</p>
                                        </div>
                                        <p className="text-sm text-slate-900">{f.totalArea.toFixed(1)} / {f.totalAreaPlanted.toFixed(1)}</p>
                                        <p className="text-sm text-slate-900">{f.soilType}</p>
                                        <p className="text-sm text-slate-900">MWK {fmt(f.labourCost)}</p>
                                        <p className="text-sm font-medium text-red-600">MWK {fmt(f.totalCost)}</p>
                                        <p className="text-sm font-medium text-slate-900">MWK {fmt(f.costPerHectare)}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── Crop-field detail ────────────────────────────────────────────────── */}
            {activeReport === "cropfield" && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <h2 className="text-base font-medium text-slate-900">Crop-field detail</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Every crop record with full cost breakdown</p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <select
                                value={seasonFilter}
                                onChange={(e) => setSeasonFilter(e.target.value)}
                                className="h-8 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                            >
                                <option value="All">All seasons</option>
                                {allSeasons.map((s) => <option key={s}>{s}</option>)}
                            </select>
                            <select
                                value={fieldFilter}
                                onChange={(e) => setFieldFilter(e.target.value)}
                                className="h-8 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                            >
                                <option value="All">All fields</option>
                                {allFields.map((f) => <option key={f}>{f}</option>)}
                            </select>
                        </div>
                    </div>
                    {filteredCropField.length === 0 ? (
                        <div className="p-16 text-center"><p className="text-slate-400 text-sm">No data matches your filters</p></div>
                    ) : (
                        <>
                            <div className="grid grid-cols-8 px-6 py-3 border-b border-slate-100 bg-slate-50">
                                {["Crop", "Variety", "Field", "Season", "Area", "Labour", "Inputs", "Cost/ha"].map((h) => (
                                    <p key={h} className="text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</p>
                                ))}
                            </div>
                            <div className="flex flex-col divide-y divide-slate-50">
                                {filteredCropField.map((c: any, i: number) => (
                                    <div key={`${c.id}-${i}`} className="grid grid-cols-8 px-6 py-3.5 hover:bg-slate-50 transition-colors">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{c.cropName}</p>
                                            <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${c.status === "Active" ? "bg-green-50 text-green-800" : c.status === "Harvested" ? "bg-blue-50 text-blue-800" : "bg-red-50 text-red-800"}`}>{c.status}</span>
                                        </div>
                                        <p className="text-sm text-slate-900">{c.variety}</p>
                                        <p className="text-sm text-slate-900">{c.fieldName}</p>
                                        <p className="text-sm text-slate-900">{c.season}</p>
                                        <p className="text-sm text-slate-900">{c.areaPlanted} ha</p>
                                        <p className="text-sm text-slate-900">MWK {fmt(c.labour)}</p>
                                        <p className="text-sm text-slate-900">MWK {fmt(c.inputs)}</p>
                                        <p className="text-sm font-medium text-slate-900">MWK {fmt(c.costPerHectare)}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 grid grid-cols-8">
                                <p className="text-xs font-medium text-slate-600 col-span-4">Totals ({filteredCropField.length} records)</p>
                                <p className="text-xs font-medium text-slate-900">{filteredCropField.reduce((s: number, c: any) => s + c.areaPlanted, 0).toFixed(1)} ha</p>
                                <p className="text-xs font-medium text-slate-900">MWK {fmt(filteredCropField.reduce((s: number, c: any) => s + c.labour, 0))}</p>
                                <p className="text-xs font-medium text-slate-900">MWK {fmt(filteredCropField.reduce((s: number, c: any) => s + c.inputs, 0))}</p>
                                <p className="text-xs font-medium text-slate-900"></p>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── Labour summary ───────────────────────────────────────────────────── */}
            {activeReport === "employee" && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100">
                        <h2 className="text-base font-medium text-slate-900">Labour summary</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Total days, hours and earnings per employee</p>
                    </div>
                    {data.employeeReport.length === 0 ? (
                        <div className="p-16 text-center"><p className="text-slate-400 text-sm">No labour records yet</p></div>
                    ) : (
                        <>
                            <div className="grid grid-cols-6 px-6 py-3 border-b border-slate-100 bg-slate-50">
                                {["Employee", "Role", "Activities", "Days worked", "Hours worked", "Total earned"].map((h) => (
                                    <p key={h} className="text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</p>
                                ))}
                            </div>
                            <div className="flex flex-col divide-y divide-slate-50">
                                {data.employeeReport.map((e: any, i: number) => (
                                    <div key={`${e.employeeId}-${i}`} className="grid grid-cols-6 px-6 py-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-700">
                                                {e.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                                            </div>
                                            <p className="text-sm font-medium text-slate-900">{e.name}</p>
                                        </div>
                                        <p className="text-sm text-slate-500">{e.role}</p>
                                        <p className="text-sm text-slate-900">{e.activities}</p>
                                        <p className="text-sm text-slate-900">{e.totalDays.toFixed(1)}</p>
                                        <p className="text-sm text-slate-900">{e.totalHours.toFixed(1)}</p>
                                        <p className="text-sm font-medium text-slate-900">MWK {fmt(e.totalEarned)}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 grid grid-cols-6">
                                <p className="text-xs font-medium text-slate-600 col-span-2">Total ({data.employeeReport.length} employees)</p>
                                <p className="text-xs font-medium text-slate-900">{data.employeeReport.reduce((s: number, e: any) => s + e.activities, 0)}</p>
                                <p className="text-xs font-medium text-slate-900">{data.employeeReport.reduce((s: number, e: any) => s + e.totalDays, 0).toFixed(1)}</p>
                                <p className="text-xs font-medium text-slate-900">{data.employeeReport.reduce((s: number, e: any) => s + e.totalHours, 0).toFixed(1)}</p>
                                <p className="text-xs font-medium text-slate-900">MWK {fmt(data.employeeReport.reduce((s: number, e: any) => s + e.totalEarned, 0))}</p>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── Input usage ──────────────────────────────────────────────────────── */}
            {activeReport === "input" && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100">
                        <h2 className="text-base font-medium text-slate-900">Input usage report</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Total quantity and cost of every input used across all activities</p>
                    </div>
                    {data.inputReport.length === 0 ? (
                        <div className="p-16 text-center"><p className="text-slate-400 text-sm">No input records yet</p></div>
                    ) : (
                        <>
                            <div className="grid grid-cols-6 px-6 py-3 border-b border-slate-100 bg-slate-50">
                                {["Input", "Category", "Total quantity", "Unit", "Times used", "Total cost"].map((h) => (
                                    <p key={h} className="text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</p>
                                ))}
                            </div>
                            <div className="flex flex-col divide-y divide-slate-50">
                                {data.inputReport.map((inp: any, i: number) => (
                                    <div key={`${inp.inputName}-${i}`} className="grid grid-cols-6 px-6 py-4 hover:bg-slate-50 transition-colors">
                                        <p className="text-sm font-medium text-slate-900">{inp.inputName}</p>
                                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg h-fit">{inp.category}</span>
                                        <p className="text-sm text-slate-900">{inp.totalQuantity.toFixed(1)}</p>
                                        <p className="text-sm text-slate-500">{inp.unit}</p>
                                        <p className="text-sm text-slate-900">{inp.usageCount}</p>
                                        <p className="text-sm font-medium text-slate-900">MWK {fmt(inp.totalCost)}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 grid grid-cols-6">
                                <p className="text-xs font-medium text-slate-600 col-span-4">Total ({data.inputReport.length} inputs)</p>
                                <p className="text-xs font-medium text-slate-900">{data.inputReport.reduce((s: number, i: any) => s + i.usageCount, 0)}</p>
                                <p className="text-xs font-medium text-slate-900">MWK {fmt(data.inputReport.reduce((s: number, i: any) => s + i.totalCost, 0))}</p>
                            </div>
                        </>
                    )}
                </div>
            )}
            {activeReport === "yields" && (
                <YieldsReportSection />
            )}
        </div>
    );
}

function YieldsReportSection() {
    const [yieldData, setYieldData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/yields")
            .then((r) => r.json())
            .then((d) => { setYieldData(d); setLoading(false); });
    }, []);

    if (loading) return <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-slate-400" /></div>;

    const records = yieldData?.records ?? [];
    const byType = yieldData?.byType ?? [];

    return (
        <div className="flex flex-col gap-6">
            {/* Aggregate by type */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="text-base font-medium text-slate-900">Yield by crop type</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Aggregated across all fields and seasons</p>
                </div>
                {byType.length === 0 ? (
                    <div className="p-16 text-center"><p className="text-slate-400 text-sm">No yield records yet</p></div>
                ) : (
                    <>
                        <div className="grid grid-cols-6 px-6 py-3 border-b border-slate-100 bg-slate-50">
                            {["Crop", "Records", "Total area (ha)", "Total yield (kg)", "Yield / ha", "Cost / kg"].map((h) => (
                                <p key={h} className="text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</p>
                            ))}
                        </div>
                        <div className="flex flex-col divide-y divide-slate-50">
                            {byType.map((t: any, i: number) => (
                                <div key={`${t.cropName}-${i}`} className="grid grid-cols-6 px-6 py-4 hover:bg-slate-50 transition-colors">
                                    <p className="text-sm font-medium text-slate-900">{t.cropName}</p>
                                    <p className="text-sm text-slate-900">{t.records}</p>
                                    <p className="text-sm text-slate-900">{t.totalAreaPlanted.toFixed(1)}</p>
                                    <p className="text-sm font-medium text-slate-900">{new Intl.NumberFormat("en-MW").format(Math.round(t.totalYieldKg))} kg</p>
                                    <p className="text-sm text-slate-900">
                                        {t.totalAreaPlanted > 0 ? `${new Intl.NumberFormat("en-MW").format(Math.round(t.totalYieldKg / t.totalAreaPlanted))} kg` : "—"}
                                    </p>
                                    <p className="text-sm text-slate-900">
                                        {t.totalYieldKg > 0 ? `MWK ${new Intl.NumberFormat("en-MW").format(Math.round(t.totalCost / t.totalYieldKg))}` : "—"}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Detail records */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="text-base font-medium text-slate-900">Yield detail</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Per crop-field record</p>
                </div>
                {records.filter((r: any) => r.totalYieldKg > 0).length === 0 ? (
                    <div className="p-16 text-center"><p className="text-slate-400 text-sm">No yield records yet</p></div>
                ) : (
                    <>
                        <div className="grid grid-cols-7 px-6 py-3 border-b border-slate-100 bg-slate-50">
                            {["Crop", "Field", "Season", "Area", "Total cost", "Yield (kg)", "Cost / kg"].map((h) => (
                                <p key={h} className="text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</p>
                            ))}
                        </div>
                        <div className="flex flex-col divide-y divide-slate-50">
                            {records.filter((r: any) => r.totalYieldKg > 0).map((r: any, i: number) => (
                                <div key={`${r.cropFieldId}-${i}`} className="grid grid-cols-7 px-6 py-3.5 hover:bg-slate-50 transition-colors">
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{r.cropName}</p>
                                        <p className="text-xs text-slate-400">{r.variety}</p>
                                    </div>
                                    <p className="text-sm text-slate-900">{r.fieldName}</p>
                                    <p className="text-sm text-slate-900">{r.season}</p>
                                    <p className="text-sm text-slate-900">{r.areaPlanted} ha</p>
                                    <p className="text-sm text-slate-900">MWK {new Intl.NumberFormat("en-MW").format(Math.round(r.totalCost))}</p>
                                    <p className="text-sm font-medium text-slate-900">{new Intl.NumberFormat("en-MW").format(Math.round(r.totalYieldKg))}</p>
                                    <p className="text-sm font-medium text-slate-900">
                                        {r.costPerKg ? `MWK ${new Intl.NumberFormat("en-MW").format(Math.round(r.costPerKg))}` : "—"}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
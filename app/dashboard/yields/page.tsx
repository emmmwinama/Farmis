"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Loader2, X, Check, Pencil, Trash2, TrendingUp, Wheat } from "lucide-react";

const UNITS = ["kg", "bags", "tonnes", "crates", "buckets"];

function fmt(n: number) { return new Intl.NumberFormat("en-MW").format(Math.round(n)); }
function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const emptyForm = {
    cropFieldId: "",
    harvestDate: new Date().toISOString().split("T")[0],
    quantity: "", unit: "bags", unitWeight: "50", notes: "",
};

function YieldsContent() {
    const searchParams = useSearchParams();
    const cropFieldIdParam = searchParams.get("cropFieldId") ?? "";

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingYield, setEditingYield] = useState<any>(null);
    const [form, setForm] = useState({ ...emptyForm, cropFieldId: cropFieldIdParam });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [seasonFilter, setSeasonFilter] = useState("All");
    const [selectedRecord, setSelectedRecord] = useState<any>(null);
    const [suggestion, setSuggestion] = useState<any>(null);
    const [margin, setMargin] = useState(30);
    const [loadingSuggestion, setLoadingSuggestion] = useState(false);

    const load = () => {
        setLoading(true);
        fetch("/api/yields").then((r) => r.json()).then((d) => { setData(d); setLoading(false); });
    };

    useEffect(() => { load(); }, []);
    useEffect(() => { if (cropFieldIdParam) setShowForm(true); }, [cropFieldIdParam]);

    const loadSuggestion = async (cropFieldId: string, targetMargin: number) => {
        setLoadingSuggestion(true);
        const res = await fetch(`/api/yields/suggestions?cropFieldId=${cropFieldId}&margin=${targetMargin}`);
        const d = await res.json();
        setSuggestion(d);
        setLoadingSuggestion(false);
    };

    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

    const openAdd = (cropFieldId?: string) => {
        setEditingYield(null);
        setForm({ ...emptyForm, cropFieldId: cropFieldId ?? cropFieldIdParam });
        setError(""); setShowForm(true);
    };

    const openEdit = (y: any, cropFieldId: string) => {
        setEditingYield(y);
        setForm({
            cropFieldId,
            harvestDate: new Date(y.harvestDate).toISOString().split("T")[0],
            quantity: y.quantity.toString(), unit: y.unit,
            unitWeight: y.unitWeight?.toString() ?? "", notes: y.notes ?? "",
        });
        setError(""); setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true); setError("");
        const url = editingYield ? `/api/yields/${editingYield.id}` : "/api/yields";
        const method = editingYield ? "PATCH" : "POST";
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        const d = await res.json();
        if (!res.ok) { setError(d.error); setSaving(false); } else { setShowForm(false); load(); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this yield record?")) return;
        setDeletingId(id);
        await fetch(`/api/yields/${id}`, { method: "DELETE" });
        setDeletingId(null); load();
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-slate-400" /></div>;

    const allSeasons = data?.allSeasons ?? [];
    const records = (data?.records ?? []).filter((r: any) => seasonFilter === "All" || r.season === seasonFilter);
    const byType = data?.byType ?? [];
    const totalYieldKg = records.reduce((s: number, r: any) => s + r.totalYieldKg, 0);

    return (
        <div className="p-8 max-w-6xl mx-auto">

            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Yields</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {records.length} crop record{records.length !== 1 ? "s" : ""} · {fmt(totalYieldKg)} kg total
                    </p>
                </div>
                <button onClick={() => openAdd()}
                        className="flex items-center gap-2 h-10 px-5 bg-[#1a3d1f] text-white text-sm font-bold rounded-xl hover:bg-[#2d5c35] transition-colors hover:shadow-lg hover:shadow-[#1a3d1f]/20">
                    <Plus size={16} /> Record yield
                </button>
            </div>

            {/* Season filter */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {["All", ...allSeasons].map((s: string) => (
                    <button key={s} onClick={() => setSeasonFilter(s)}
                            className={`h-9 px-4 rounded-xl text-sm font-semibold transition-colors ${
                                seasonFilter === s
                                    ? "bg-[#1a3d1f] text-white"
                                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300"
                            }`}>
                        {s}
                    </button>
                ))}
            </div>

            {/* Aggregates by crop type */}
            {byType.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-6">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">Yield by crop type</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {byType.map((t: any, i: number) => {
                            const yieldPerHa = t.totalAreaPlanted > 0 ? t.totalYieldKg / t.totalAreaPlanted : 0;
                            const costPerKg = t.totalYieldKg > 0 ? t.totalCost / t.totalYieldKg : 0;
                            return (
                                <div key={`${t.cropName}-${i}`} className="bg-gradient-to-br from-[#1a3d1f]/5 to-[#3d8c47]/10 dark:from-[#1a3d1f]/20 dark:to-[#3d8c47]/20 rounded-xl p-4 border border-[#1a3d1f]/10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-xl">🌾</span>
                                        <p className="font-bold text-slate-900 dark:text-white">{t.cropName}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { label: "Total yield", value: `${fmt(t.totalYieldKg)} kg` },
                                            { label: "Area", value: `${t.totalAreaPlanted.toFixed(1)} ha` },
                                            { label: "Yield/ha", value: `${fmt(yieldPerHa)} kg` },
                                            { label: "Cost/kg", value: `MWK ${fmt(costPerKg)}` },
                                        ].map(({ label, value }) => (
                                            <div key={label}>
                                                <p className="text-xs text-slate-400">{label}</p>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Records */}
            {records.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                        <Wheat size={28} className="text-slate-400" />
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white text-lg mb-2">No yield records yet</p>
                    <p className="text-slate-400 text-sm mb-6">Record harvests from the crops page or click below</p>
                    <button onClick={() => openAdd()} className="inline-flex items-center gap-2 h-11 px-6 bg-[#1a3d1f] text-white text-sm font-bold rounded-xl hover:bg-[#2d5c35] transition-colors">
                        <Plus size={16} /> Record yield
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {records.map((record: any) => (
                        <div key={record.cropFieldId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-sm transition-all">
                            <div className="flex items-start justify-between mb-5">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-slate-900 dark:text-white text-lg">{record.cropName}</h3>
                                        <span className="text-sm text-slate-400">{record.variety}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-lg font-bold ${
                                            record.status === "Active" ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400" :
                                                record.status === "Harvested" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400" :
                                                    "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                                        }`}>{record.status}</span>
                                    </div>
                                    <p className="text-sm text-slate-400">{record.fieldName} · {record.season} · {record.areaPlanted} ha</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedRecord(selectedRecord?.cropFieldId === record.cropFieldId ? null : record);
                                        if (selectedRecord?.cropFieldId !== record.cropFieldId && record.totalYieldKg > 0) {
                                            loadSuggestion(record.cropFieldId, margin);
                                        }
                                    }}
                                    className="flex items-center gap-2 h-9 px-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-400 text-xs font-bold rounded-xl hover:bg-amber-100 transition-colors"
                                >
                                    <TrendingUp size={13} /> Price suggestion
                                </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                {[
                                    { label: "Total cost", value: `MWK ${fmt(record.totalCost)}` },
                                    { label: "Cost/ha", value: record.costPerHectare ? `MWK ${fmt(record.costPerHectare)}` : "—" },
                                    { label: "Total yield", value: record.totalYieldKg > 0 ? `${fmt(record.totalYieldKg)} kg` : "Not recorded" },
                                    { label: "Yield/ha", value: record.yieldPerHectare ? `${fmt(record.yieldPerHectare)} kg` : "—" },
                                ].map(({ label, value }) => (
                                    <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                                        <p className="text-xs text-slate-400 mb-1">{label}</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Price suggestion panel */}
                            {selectedRecord?.cropFieldId === record.cropFieldId && (
                                <div className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-sm font-bold text-amber-900 dark:text-amber-300">Selling price suggestion</p>
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs text-amber-700 dark:text-amber-400">Target margin:</label>
                                            <input type="number" min="0" max="200" value={margin}
                                                   onChange={(e) => {
                                                       setMargin(parseInt(e.target.value) || 0);
                                                       loadSuggestion(record.cropFieldId, parseInt(e.target.value) || 0);
                                                   }}
                                                   className="w-16 h-7 px-2 text-xs bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 rounded-lg outline-none text-center font-bold" />
                                            <span className="text-xs text-amber-700 dark:text-amber-400">%</span>
                                        </div>
                                    </div>
                                    {loadingSuggestion ? (
                                        <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-amber-600" /></div>
                                    ) : suggestion && (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {[
                                                { label: "Break-even / kg", value: suggestion.breakEven?.perKg ? `MWK ${fmt(suggestion.breakEven.perKg)}` : "—" },
                                                { label: "Break-even / 50kg bag", value: suggestion.breakEven?.perBag50 ? `MWK ${fmt(suggestion.breakEven.perBag50)}` : "—" },
                                                { label: "Break-even / tonne", value: suggestion.breakEven?.perTonne ? `MWK ${fmt(suggestion.breakEven.perTonne)}` : "—" },
                                                { label: `Suggested / kg (${margin}%)`, value: suggestion.suggested?.perKg ? `MWK ${fmt(suggestion.suggested.perKg)}` : "—" },
                                                { label: "Suggested / 50kg bag", value: suggestion.suggested?.perBag50 ? `MWK ${fmt(suggestion.suggested.perBag50)}` : "—" },
                                                { label: "Projected profit", value: suggestion.projectedProfit ? `MWK ${fmt(suggestion.projectedProfit)}` : "—" },
                                            ].map(({ label, value }) => (
                                                <div key={label} className="bg-white dark:bg-slate-800 rounded-xl p-3">
                                                    <p className="text-xs text-amber-700 dark:text-amber-400 mb-1">{label}</p>
                                                    <p className="text-sm font-bold text-amber-900 dark:text-amber-300">{value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Harvest records */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Harvest records</p>
                                    <button onClick={() => openAdd(record.cropFieldId)}
                                            className="flex items-center gap-1.5 text-xs text-[#1a3d1f] dark:text-[#7dd68a] font-bold hover:underline">
                                        <Plus size={12} /> Add harvest
                                    </button>
                                </div>
                                {record.yields.length === 0 ? (
                                    <p className="text-xs text-slate-400">No harvests recorded yet</p>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {record.yields.map((y: any) => (
                                            <div key={y.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {fmt(y.quantity)} {y.unit}
                                                        {y.unitWeight && <span className="text-xs text-slate-400 font-normal ml-2">({fmt(y.quantity * y.unitWeight)} kg)</span>}
                                                    </p>
                                                    <p className="text-xs text-slate-400">{formatDate(y.harvestDate)}{y.notes ? ` · ${y.notes}` : ""}</p>
                                                </div>
                                                <div className="flex gap-1.5">
                                                    <button onClick={() => openEdit(y, record.cropFieldId)} className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 transition-colors"><Pencil size={13} /></button>
                                                    <button onClick={() => handleDelete(y.id)} disabled={deletingId === y.id} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 transition-colors">
                                                        {deletingId === y.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Form */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setShowForm(false)} />
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full overflow-y-auto shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">{editingYield ? "Edit harvest" : "Record harvest"}</h2>
                            <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="flex-1 p-6 flex flex-col gap-5">
                            {!cropFieldIdParam && !editingYield && (
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Crop record</label>
                                    <select value={form.cropFieldId} onChange={(e) => set("cropFieldId", e.target.value)} required
                                            className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white">
                                        <option value="">Select crop...</option>
                                        {(data?.records ?? []).map((r: any) => (
                                            <option key={r.cropFieldId} value={r.cropFieldId}>{r.cropName} — {r.fieldName} ({r.season})</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Harvest date</label>
                                <input type="date" value={form.harvestDate} onChange={(e) => set("harvestDate", e.target.value)} required
                                       className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Quantity</label>
                                    <input type="number" step="0.01" min="0" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} placeholder="0" required
                                           className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white" />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Unit</label>
                                    <select value={form.unit} onChange={(e) => set("unit", e.target.value)}
                                            className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white">
                                        {UNITS.map((u) => <option key={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>
                            {form.unit !== "kg" && (
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Weight per {form.unit} (kg)</label>
                                    <input type="number" step="0.1" min="0" value={form.unitWeight} onChange={(e) => set("unitWeight", e.target.value)} placeholder="e.g. 50"
                                           className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white" />
                                </div>
                            )}
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Notes (optional)</label>
                                <input value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Any notes..."
                                       className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white" />
                            </div>
                            {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">{error}</p>}
                            <div className="flex gap-3 mt-auto pt-4">
                                <button type="button" onClick={() => setShowForm(false)}
                                        className="flex-1 h-12 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                                <button type="submit" disabled={saving}
                                        className="flex-1 h-12 bg-[#1a3d1f] text-white text-sm font-bold rounded-xl hover:bg-[#2d5c35] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                    {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Check size={15} /> {editingYield ? "Update" : "Save harvest"}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function YieldsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-slate-400" /></div>}>
            <YieldsContent />
        </Suspense>
    );
}
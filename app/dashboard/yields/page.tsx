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

const INP: React.CSSProperties = {
    width: "100%", height: "44px", padding: "0 14px",
    fontSize: "13px", outline: "none",
    borderRadius: "10px",
    border:      "1px solid var(--border)",
    background:  "var(--bg-subtle)",
    color:       "var(--text-primary)",
};

const SEL: React.CSSProperties = { ...INP };

function YieldsContent() {
    const searchParams    = useSearchParams();
    const cropFieldIdParam = searchParams.get("cropFieldId") ?? "";

    const [data,              setData]              = useState<any>(null);
    const [loading,           setLoading]           = useState(true);
    const [showForm,          setShowForm]          = useState(false);
    const [editingYield,      setEditingYield]      = useState<any>(null);
    const [form,              setForm]              = useState({ ...emptyForm, cropFieldId: cropFieldIdParam });
    const [saving,            setSaving]            = useState(false);
    const [error,             setError]             = useState("");
    const [deletingId,        setDeletingId]        = useState<string | null>(null);
    const [seasonFilter,      setSeasonFilter]      = useState("All");
    const [selectedRecord,    setSelectedRecord]    = useState<any>(null);
    const [suggestion,        setSuggestion]        = useState<any>(null);
    const [margin,            setMargin]            = useState(30);
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
        const d   = await res.json();
        setSuggestion(d);
        setLoadingSuggestion(false);
    };

    const setF = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

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
            quantity:    y.quantity.toString(),
            unit:        y.unit,
            unitWeight:  y.unitWeight?.toString() ?? "",
            notes:       y.notes ?? "",
        });
        setError(""); setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true); setError("");
        const url    = editingYield ? `/api/yields/${editingYield.id}` : "/api/yields";
        const method = editingYield ? "PATCH" : "POST";
        const res    = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(form),
        });
        const d = await res.json();
        if (!res.ok) { setError(d.error); setSaving(false); }
        else         { setShowForm(false); setSaving(false); load(); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this yield record?")) return;
        setDeletingId(id);
        await fetch(`/api/yields/${id}`, { method: "DELETE" });
        setDeletingId(null); load();
    };

    if (loading) return (
        <div className="flex justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: "var(--farm-green)" }} />
        </div>
    );

    const allSeasons   = data?.allSeasons ?? [];
    const records      = (data?.records ?? []).filter((r: any) => seasonFilter === "All" || r.season === seasonFilter);
    const byType       = data?.byType ?? [];
    const totalYieldKg = records.reduce((s: number, r: any) => s + r.totalYieldKg, 0);

    return (
        <div className="p-8 max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)", letterSpacing: "-0.04em" }}>
                        Yields
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                        {records.length} crop record{records.length !== 1 ? "s" : ""} · {fmt(totalYieldKg)} kg total
                    </p>
                </div>
                <button onClick={() => openAdd()}
                        className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold text-white"
                        style={{ background: "var(--farm-green)", boxShadow: "0 4px 12px rgba(26,61,31,0.25)" }}>
                    <Plus size={15} /> Record yield
                </button>
            </div>

            {/* Season filter pills */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {["All", ...allSeasons].map((s: string) => (
                    <button key={s} onClick={() => setSeasonFilter(s)}
                            className="h-9 px-4 rounded-xl text-sm font-bold transition-all"
                            style={{
                                background: seasonFilter === s ? "var(--farm-green)" : "var(--bg-card)",
                                color:      seasonFilter === s ? "white"             : "var(--text-secondary)",
                                border:     `1.5px solid ${seasonFilter === s ? "transparent" : "var(--border)"}`,
                            }}>
                        {s}
                    </button>
                ))}
            </div>

            {/* By crop type summary */}
            {byType.length > 0 && (
                <div className="rounded-2xl p-6 mb-6"
                     style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-4"
                       style={{ color: "var(--text-muted)" }}>
                        Yield by crop type
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {byType.map((t: any, i: number) => {
                            const yieldPerHa = t.totalAreaPlanted > 0 ? t.totalYieldKg / t.totalAreaPlanted : 0;
                            const costPerKg  = t.totalYieldKg     > 0 ? t.totalCost    / t.totalYieldKg    : 0;
                            return (
                                <div key={`${t.cropName}-${i}`}
                                     className="rounded-xl p-4"
                                     style={{
                                         background: "var(--farm-pale)",
                                         border:     "1px solid var(--farm-green-light, #86efac)",
                                     }}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Wheat size={16} style={{ color: "var(--farm-green)" }} />
                                        <p className="font-extrabold" style={{ color: "var(--text-primary)" }}>
                                            {t.cropName}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { label: "Total yield", value: `${fmt(t.totalYieldKg)} kg` },
                                            { label: "Area",        value: `${t.totalAreaPlanted.toFixed(1)} ha` },
                                            { label: "Yield / ha",  value: `${fmt(yieldPerHa)} kg` },
                                            { label: "Cost / kg",   value: `MWK ${fmt(costPerKg)}` },
                                        ].map(({ label, value }) => (
                                            <div key={label}>
                                                <p className="text-[10px] font-black uppercase tracking-wide mb-0.5"
                                                   style={{ color: "var(--text-muted)" }}>
                                                    {label}
                                                </p>
                                                <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                                                    {value}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {records.length === 0 ? (
                <div className="rounded-2xl p-16 text-center"
                     style={{ background: "var(--bg-card)", border: "1.5px dashed var(--border)" }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                         style={{ background: "var(--bg-subtle)" }}>
                        <Wheat size={24} style={{ color: "var(--text-muted)" }} />
                    </div>
                    <p className="text-lg font-black mb-1" style={{ color: "var(--text-primary)" }}>
                        No yield records yet
                    </p>
                    <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                        Record harvests from the crops page or click below
                    </p>
                    <button onClick={() => openAdd()}
                            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-bold text-white"
                            style={{ background: "var(--farm-green)" }}>
                        <Plus size={15} /> Record yield
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {records.map((record: any) => {
                        const isPanelOpen = selectedRecord?.cropFieldId === record.cropFieldId;

                        const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
                            Active:    { bg: "#ECFDF5", color: "#166534" },
                            Harvested: { bg: "#EFF6FF", color: "#1E3A8A" },
                            Failed:    { bg: "#FEF2F2", color: "#7F1D1D" },
                        };
                        const statusCfg = STATUS_STYLE[record.status] ?? STATUS_STYLE["Active"];

                        return (
                            <div key={record.cropFieldId}
                                 className="rounded-2xl overflow-hidden"
                                 style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>

                                {/* Card header */}
                                <div className="flex items-start justify-between px-6 py-5"
                                     style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <h3 className="text-base font-extrabold" style={{ color: "var(--text-primary)" }}>
                                                {record.cropName}
                                            </h3>
                                            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                                                {record.variety}
                                            </span>
                                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full"
                                                  style={{ background: statusCfg.bg, color: statusCfg.color }}>
                                                {record.status}
                                            </span>
                                        </div>
                                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                            {record.fieldName} · {record.season} · {record.areaPlanted} ha
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedRecord(isPanelOpen ? null : record);
                                            setSuggestion(null);
                                            if (!isPanelOpen && record.totalYieldKg > 0) {
                                                loadSuggestion(record.cropFieldId, margin);
                                            }
                                        }}
                                        className="flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-bold transition-all flex-shrink-0"
                                        style={{
                                            background: isPanelOpen ? "#F0F9FF" : "var(--bg-card)",
                                            color:      "#075985",
                                            border:     "1.5px solid #BAE6FD",
                                        }}>
                                        <TrendingUp size={13} /> Price suggestion
                                    </button>
                                </div>

                                <div className="p-5 flex flex-col gap-4">
                                    {/* Key metrics */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {[
                                            { label: "Total cost",  value: `MWK ${fmt(record.totalCost)}`,                                         color: "#DC2626" },
                                            { label: "Cost / ha",   value: record.costPerHectare  ? `MWK ${fmt(record.costPerHectare)}`  : "—",     color: "var(--text-primary)" },
                                            { label: "Total yield", value: record.totalYieldKg > 0 ? `${fmt(record.totalYieldKg)} kg`   : "Not recorded", color: "var(--farm-green)" },
                                            { label: "Yield / ha",  value: record.yieldPerHectare ? `${fmt(record.yieldPerHectare)} kg` : "—",      color: "var(--farm-green)" },
                                        ].map(({ label, value, color }) => (
                                            <div key={label} className="rounded-xl p-3"
                                                 style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                                                <p className="text-[10px] font-black uppercase tracking-wide mb-1"
                                                   style={{ color: "var(--text-muted)" }}>
                                                    {label}
                                                </p>
                                                <p className="text-sm font-extrabold" style={{ color }}>{value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Price suggestion panel */}
                                    {isPanelOpen && (
                                        <div className="rounded-xl p-4"
                                             style={{ background: "#F0F9FF", border: "1.5px solid #BAE6FD" }}>
                                            <div className="flex items-center justify-between mb-3">
                                                <p className="text-sm font-extrabold" style={{ color: "#075985" }}>
                                                    Selling price suggestion
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <label className="text-xs font-bold" style={{ color: "#075985" }}>
                                                        Target margin:
                                                    </label>
                                                    <input type="number" min="0" max="200" value={margin}
                                                           onChange={(e) => {
                                                               setMargin(parseInt(e.target.value) || 0);
                                                               loadSuggestion(record.cropFieldId, parseInt(e.target.value) || 0);
                                                           }}
                                                           style={{
                                                               width: "56px", height: "28px",
                                                               padding: "0 8px", fontSize: "12px",
                                                               borderRadius: "8px", outline: "none",
                                                               textAlign: "center", fontWeight: 700,
                                                               border: "1px solid #BAE6FD",
                                                               background: "var(--bg-card)",
                                                               color: "#075985",
                                                           }} />
                                                    <span className="text-xs font-bold" style={{ color: "#075985" }}>%</span>
                                                </div>
                                            </div>

                                            {loadingSuggestion ? (
                                                <div className="flex justify-center py-4">
                                                    <Loader2 size={16} className="animate-spin" style={{ color: "#0284C7" }} />
                                                </div>
                                            ) : suggestion && (
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {[
                                                        { label: "Break-even / kg",           value: suggestion.breakEven?.perKg     ? `MWK ${fmt(suggestion.breakEven.perKg)}`     : "—" },
                                                        { label: "Break-even / 50 kg bag",    value: suggestion.breakEven?.perBag50  ? `MWK ${fmt(suggestion.breakEven.perBag50)}`  : "—" },
                                                        { label: "Break-even / tonne",        value: suggestion.breakEven?.perTonne  ? `MWK ${fmt(suggestion.breakEven.perTonne)}`  : "—" },
                                                        { label: `Suggested / kg (${margin}%)`, value: suggestion.suggested?.perKg   ? `MWK ${fmt(suggestion.suggested.perKg)}`     : "—" },
                                                        { label: "Suggested / 50 kg bag",     value: suggestion.suggested?.perBag50 ? `MWK ${fmt(suggestion.suggested.perBag50)}`  : "—" },
                                                        { label: "Projected profit",          value: suggestion.projectedProfit      ? `MWK ${fmt(suggestion.projectedProfit)}`      : "—" },
                                                    ].map(({ label, value }) => (
                                                        <div key={label} className="rounded-xl p-3"
                                                             style={{ background: "var(--bg-card)", border: "1px solid #BAE6FD" }}>
                                                            <p className="text-[10px] font-black uppercase tracking-wide mb-1"
                                                               style={{ color: "#0284C7" }}>
                                                                {label}
                                                            </p>
                                                            <p className="text-sm font-extrabold" style={{ color: "#075985" }}>
                                                                {value}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Harvest records */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest"
                                               style={{ color: "var(--text-muted)" }}>
                                                Harvest records
                                            </p>
                                            <button onClick={() => openAdd(record.cropFieldId)}
                                                    className="flex items-center gap-1.5 text-xs font-bold"
                                                    style={{ color: "var(--farm-green)" }}>
                                                <Plus size={12} /> Add harvest
                                            </button>
                                        </div>

                                        {record.yields.length === 0 ? (
                                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                No harvests recorded yet
                                            </p>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                {record.yields.map((y: any) => (
                                                    <div key={y.id}
                                                         className="flex items-center justify-between rounded-xl px-4 py-3"
                                                         style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                                                        <div>
                                                            <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                                                                {fmt(y.quantity)} {y.unit}
                                                                {y.unitWeight && (
                                                                    <span className="text-xs font-normal ml-2"
                                                                          style={{ color: "var(--text-muted)" }}>
                                                                        ({fmt(y.quantity * y.unitWeight)} kg)
                                                                    </span>
                                                                )}
                                                            </p>
                                                            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                                                                {formatDate(y.harvestDate)}{y.notes ? ` · ${y.notes}` : ""}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-1.5">
                                                            <button onClick={() => openEdit(y, record.cropFieldId)}
                                                                    className="p-1.5 rounded-lg transition-colors"
                                                                    style={{ color: "var(--text-muted)", background: "var(--bg-card)" }}>
                                                                <Pencil size={13} />
                                                            </button>
                                                            <button onClick={() => handleDelete(y.id)}
                                                                    disabled={deletingId === y.id}
                                                                    className="p-1.5 rounded-lg transition-colors"
                                                                    style={{ background: "#FFF1F2", color: "#E11D48" }}>
                                                                {deletingId === y.id
                                                                    ? <Loader2 size={13} className="animate-spin" />
                                                                    : <Trash2 size={13} />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Slide-over form ──────────────────────────────────────────────── */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setShowForm(false)} />
                    <div className="w-full max-w-md flex flex-col shadow-2xl"
                         style={{ background: "var(--bg-card)", borderLeft: "1px solid var(--border)", height: "100vh" }}>

                        {/* Panel header */}
                        <div className="flex items-center justify-between px-6 py-5 flex-shrink-0"
                             style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                            <h2 className="text-base font-black" style={{ color: "var(--text-primary)" }}>
                                {editingYield ? "Edit harvest" : "Record harvest"}
                            </h2>
                            <button onClick={() => setShowForm(false)}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                                    style={{ background: "var(--bg-subtle)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                                <X size={15} />
                            </button>
                        </div>

                        {/* Scrollable form */}
                        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

                                {/* Crop selector */}
                                {!cropFieldIdParam && !editingYield && (
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                               style={{ color: "var(--text-muted)" }}>
                                            Crop record *
                                        </label>
                                        <select value={form.cropFieldId}
                                                onChange={(e) => setF("cropFieldId", e.target.value)}
                                                required style={SEL}>
                                            <option value="">Select crop...</option>
                                            {(data?.records ?? []).map((r: any) => (
                                                <option key={r.cropFieldId} value={r.cropFieldId}>
                                                    {r.cropName} — {r.fieldName} ({r.season})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Harvest date */}
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                           style={{ color: "var(--text-muted)" }}>
                                        Harvest date *
                                    </label>
                                    <input type="date" value={form.harvestDate}
                                           onChange={(e) => setF("harvestDate", e.target.value)}
                                           required style={INP} />
                                </div>

                                {/* Quantity + unit */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                               style={{ color: "var(--text-muted)" }}>
                                            Quantity *
                                        </label>
                                        <input type="number" step="0.01" min="0"
                                               value={form.quantity}
                                               onChange={(e) => setF("quantity", e.target.value)}
                                               placeholder="0" required style={INP} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                               style={{ color: "var(--text-muted)" }}>
                                            Unit *
                                        </label>
                                        <select value={form.unit}
                                                onChange={(e) => setF("unit", e.target.value)}
                                                style={SEL}>
                                            {UNITS.map((u) => <option key={u}>{u}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Unit weight (when not kg) */}
                                {form.unit !== "kg" && (
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                               style={{ color: "var(--text-muted)" }}>
                                            Weight per {form.unit} (kg)
                                        </label>
                                        <input type="number" step="0.1" min="0"
                                               value={form.unitWeight}
                                               onChange={(e) => setF("unitWeight", e.target.value)}
                                               placeholder="e.g. 50" style={INP} />
                                        {form.quantity && form.unitWeight && (
                                            <p className="text-[10px] mt-1.5 font-bold"
                                               style={{ color: "var(--farm-green)" }}>
                                                = {fmt(parseFloat(form.quantity) * parseFloat(form.unitWeight))} kg total
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Notes */}
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                           style={{ color: "var(--text-muted)" }}>
                                        Notes (optional)
                                    </label>
                                    <input value={form.notes}
                                           onChange={(e) => setF("notes", e.target.value)}
                                           placeholder="Any notes..."
                                           style={INP} />
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="rounded-xl px-4 py-3"
                                         style={{ background: "#FFF1F2", border: "1px solid #FFE4E6" }}>
                                        <p className="text-sm font-semibold" style={{ color: "#9F1239" }}>{error}</p>
                                    </div>
                                )}
                            </div>

                            {/* Sticky footer */}
                            <div className="flex gap-3 px-6 py-5 flex-shrink-0"
                                 style={{ borderTop: "1px solid var(--border)", background: "var(--bg-card)" }}>
                                <button type="button" onClick={() => setShowForm(false)}
                                        className="flex-1 h-11 rounded-xl font-bold text-sm"
                                        style={{ border: "1.5px solid var(--border)", color: "var(--text-muted)" }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                        className="flex-1 h-11 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
                                        style={{ background: saving ? "#94A3B8" : "var(--farm-green)" }}>
                                    {saving
                                        ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
                                        : <><Check size={14} /> {editingYield ? "Update" : "Save harvest"}</>}
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
        <Suspense fallback={
            <div className="flex justify-center py-20">
                <Loader2 size={24} className="animate-spin" style={{ color: "var(--farm-green)" }} />
            </div>
        }>
            <YieldsContent />
        </Suspense>
    );
}

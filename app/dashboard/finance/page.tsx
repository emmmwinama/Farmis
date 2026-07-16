"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, X, Check, Pencil, Trash2, Wallet, TrendingUp, TrendingDown } from "lucide-react";

const INCOME_CATEGORIES   = ["Crop sales", "Livestock sales", "Grant", "Loan", "Other income"];
const EXPENSE_CATEGORIES  = ["Seeds", "Fertiliser", "Chemicals", "Equipment", "Fuel", "Transport", "Labour", "Land rent", "Loan repayment", "Other expense"];
const OVERHEAD_CATEGORIES = ["Electricity", "Water", "Insurance", "Admin", "Marketing", "Other overhead"];

function fmt(n: number) { return new Intl.NumberFormat("en-MW").format(Math.round(n)); }
function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const emptyTx = {
    type: "Income", category: "Crop sales", amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "", season: "", fieldId: "", cropFieldId: "", harvestYieldId: "",
};
const emptyOverhead = {
    description: "", category: "Admin", amount: "",
    date: new Date().toISOString().split("T")[0], recurring: false, notes: "",
};

const INP: React.CSSProperties = {
    width: "100%", height: "44px", padding: "0 14px",
    fontSize: "13px", outline: "none", borderRadius: "10px",
    border: "1px solid var(--border)",
    background: "var(--bg-subtle)",
    color: "var(--text-primary)",
};

function Label({ children }: { children: React.ReactNode }) {
    return (
        <label style={{
            display: "block", fontSize: "10px", fontWeight: 900,
            textTransform: "uppercase", letterSpacing: "0.08em",
            marginBottom: "6px", color: "var(--text-muted)",
        }}>
            {children}
        </label>
    );
}

export default function FinancePage() {
    const [data,         setData]         = useState<any>(null);
    const [overhead,     setOverhead]     = useState<any[]>([]);
    const [loading,      setLoading]      = useState(true);
    const [tab,          setTab]          = useState<"transactions" | "overhead">("transactions");
    const [showTxForm,   setShowTxForm]   = useState(false);
    const [showOhForm,   setShowOhForm]   = useState(false);
    const [editingTx,    setEditingTx]    = useState<any>(null);
    const [editingOh,    setEditingOh]    = useState<any>(null);
    const [txForm,       setTxForm]       = useState({ ...emptyTx });
    const [ohForm,       setOhForm]       = useState({ ...emptyOverhead });
    const [saving,       setSaving]       = useState(false);
    const [error,        setError]        = useState("");
    const [deletingId,   setDeletingId]   = useState<string | null>(null);
    const [typeFilter,   setTypeFilter]   = useState("All");
    const [seasonFilter, setSeasonFilter] = useState("All");

    const load = () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (typeFilter   !== "All") params.set("type",   typeFilter);
        if (seasonFilter !== "All") params.set("season", seasonFilter);
        Promise.all([
            fetch(`/api/finance?${params.toString()}`).then((r) => r.json()),
            fetch("/api/overhead").then((r) => r.json()),
        ]).then(([f, o]) => { setData(f); setOverhead(o); setLoading(false); });
    };

    useEffect(() => { load(); }, [typeFilter, seasonFilter]);

    const setTx = (k: string, v: any) => setTxForm((f) => ({ ...f, [k]: v }));
    const setOh = (k: string, v: any) => setOhForm((f) => ({ ...f, [k]: v }));

    const openAddTx = () => { setEditingTx(null); setTxForm({ ...emptyTx }); setError(""); setShowTxForm(true); };
    const openEditTx = (tx: any) => {
        setEditingTx(tx);
        setTxForm({
            type: tx.type, category: tx.category, amount: tx.amount.toString(),
            date: new Date(tx.date).toISOString().split("T")[0],
            description: tx.description, season: tx.season ?? "",
            fieldId: tx.fieldId ?? "", cropFieldId: tx.cropFieldId ?? "",
            harvestYieldId: tx.harvestYieldId ?? "",
        });
        setError(""); setShowTxForm(true);
    };
    const openAddOh = () => { setEditingOh(null); setOhForm({ ...emptyOverhead }); setError(""); setShowOhForm(true); };
    const openEditOh = (oh: any) => {
        setEditingOh(oh);
        setOhForm({
            description: oh.description, category: oh.category, amount: oh.amount.toString(),
            date: new Date(oh.date).toISOString().split("T")[0],
            recurring: oh.recurring, notes: oh.notes ?? "",
        });
        setError(""); setShowOhForm(true);
    };

    const handleTxSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true); setError("");
        const url    = editingTx ? `/api/finance/${editingTx.id}` : "/api/finance";
        const method = editingTx ? "PATCH" : "POST";
        const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(txForm) });
        const d      = await res.json();
        if (!res.ok) { setError(d.error); setSaving(false); } else { setShowTxForm(false); load(); }
    };

    const handleOhSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true); setError("");
        const url    = editingOh ? `/api/overhead/${editingOh.id}` : "/api/overhead";
        const method = editingOh ? "PATCH" : "POST";
        const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(ohForm) });
        const d      = await res.json();
        if (!res.ok) { setError(d.error); setSaving(false); } else { setShowOhForm(false); load(); }
    };

    const handleDeleteTx = async (id: string) => {
        if (!confirm("Delete this transaction?")) return;
        setDeletingId(id);
        await fetch(`/api/finance/${id}`, { method: "DELETE" });
        setDeletingId(null); load();
    };

    const handleDeleteOh = async (id: string) => {
        if (!confirm("Delete this overhead expense?")) return;
        setDeletingId(id);
        await fetch(`/api/overhead/${id}`, { method: "DELETE" });
        setDeletingId(null); load();
    };

    const transactions      = data?.transactions ?? [];
    const netPositive       = (data?.net ?? 0) >= 0;
    const totalOverheadCost = overhead.reduce((s, o) => s + o.amount, 0);
    const txCategories      = txForm.type === "Income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    return (
        <div className="p-8 max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)", letterSpacing: "-0.04em" }}>
                        Finance
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                        Track income, expenses and overhead costs
                    </p>
                </div>
                <button onClick={tab === "transactions" ? openAddTx : openAddOh}
                        className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold text-white"
                        style={{ background: "var(--farm-green)", boxShadow: "0 4px 12px rgba(26,61,31,0.25)" }}>
                    <Plus size={15} /> Add {tab === "transactions" ? "transaction" : "overhead"}
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Income",   value: `MWK ${fmt(data?.income ?? 0)}`,            color: "#16A34A", Icon: TrendingUp   },
                    { label: "Expenses", value: `MWK ${fmt(data?.expense ?? 0)}`,           color: "#DC2626", Icon: TrendingDown },
                    { label: "Overhead", value: `MWK ${fmt(totalOverheadCost)}`,            color: "#0284C7", Icon: Wallet       },
                    { label: "Net",      value: `MWK ${fmt(Math.abs(data?.net ?? 0))}`,     color: netPositive ? "#2563EB" : "#DC2626", Icon: netPositive ? TrendingUp : TrendingDown },
                ].map(({ label, value, color, Icon }) => (
                    <div key={label} className="rounded-2xl p-5"
                         style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                                {label}
                            </p>
                            <Icon size={15} style={{ color }} />
                        </div>
                        <p className="text-2xl font-black" style={{ color }}>{value}</p>
                        {label === "Net" && !netPositive && (
                            <p className="text-[10px] mt-1 font-bold" style={{ color: "#DC2626" }}>Loss</p>
                        )}
                    </div>
                ))}
            </div>

            {/* By-season breakdown */}
            {(data?.bySeason?.length ?? 0) > 0 && (
                <div className="rounded-2xl p-5 mb-6"
                     style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
                        By season
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {data.bySeason.map((s: any) => (
                            <div key={s.season} className="rounded-xl p-4"
                                 style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                                <p className="text-sm font-extrabold mb-2" style={{ color: "var(--text-primary)" }}>
                                    {s.season}
                                </p>
                                <div className="flex justify-between text-xs">
                                    <span className="font-bold" style={{ color: "#16A34A" }}>+MWK {fmt(s.income)}</span>
                                    <span className="font-bold" style={{ color: "#DC2626" }}>−MWK {fmt(s.expense)}</span>
                                    <span className="font-extrabold" style={{ color: s.net >= 0 ? "#2563EB" : "#DC2626" }}>
                                        {s.net >= 0 ? "+" : "−"}MWK {fmt(Math.abs(s.net))}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                {[
                    { key: "transactions", label: `Transactions (${transactions.length})` },
                    { key: "overhead",     label: `Overhead (${overhead.length})`         },
                ].map(({ key, label }) => (
                    <button key={key} onClick={() => setTab(key as any)}
                            className="h-10 px-5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0"
                            style={{
                                background: tab === key ? "var(--farm-green)" : "var(--bg-card)",
                                color:      tab === key ? "white"             : "var(--text-secondary)",
                                border:     `1.5px solid ${tab === key ? "transparent" : "var(--border)"}`,
                            }}>
                        {label}
                    </button>
                ))}
            </div>

            {/* Transaction filters */}
            {tab === "transactions" && (
                <div className="flex flex-wrap gap-3 mb-5">
                    <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                        {[
                            { key: "All",     label: "All",     activeColor: "var(--farm-green)" },
                            { key: "Income",  label: "Income",  activeColor: "#16A34A"           },
                            { key: "Expense", label: "Expense", activeColor: "#DC2626"           },
                        ].map(({ key, label, activeColor }) => (
                            <button key={key} onClick={() => setTypeFilter(key)}
                                    className="h-9 px-4 text-sm font-bold transition-all"
                                    style={{
                                        background: typeFilter === key ? activeColor : "var(--bg-card)",
                                        color:      typeFilter === key ? "white"     : "var(--text-muted)",
                                    }}>
                                {label}
                            </button>
                        ))}
                    </div>
                    <select value={seasonFilter} onChange={(e) => setSeasonFilter(e.target.value)}
                            style={{ ...INP, width: "auto", height: "36px" }}>
                        <option value="All">All seasons</option>
                        {(data?.allSeasons ?? []).map((s: string) => <option key={s}>{s}</option>)}
                    </select>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 size={24} className="animate-spin" style={{ color: "var(--farm-green)" }} />
                </div>
            ) : tab === "transactions" ? (
                <div className="rounded-2xl overflow-hidden"
                     style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                    {transactions.length === 0 ? (
                        <div className="p-16 text-center">
                            <Wallet size={28} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                            <p className="font-black mb-1" style={{ color: "var(--text-primary)" }}>No transactions yet</p>
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                                Add your first transaction to start tracking finances
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Table header */}
                            <div className="grid grid-cols-6 px-5 py-3"
                                 style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                                {["Description", "Category", "Season", "Linked to", "Date", "Amount"].map((h) => (
                                    <p key={h} className="text-[10px] font-black uppercase tracking-widest"
                                       style={{ color: "var(--text-muted)" }}>
                                        {h}
                                    </p>
                                ))}
                            </div>
                            {/* Rows */}
                            <div>
                                {transactions.map((tx: any) => (
                                    <div key={tx.id}
                                         className="group grid grid-cols-6 px-5 py-3.5 items-center transition-colors"
                                         style={{ borderBottom: "1px solid var(--border)" }}
                                         onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
                                         onMouseOut={(e)  => (e.currentTarget.style.background = "transparent")}>
                                        <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                                            {tx.description}
                                        </p>
                                        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{tx.category}</p>
                                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{tx.season ?? "—"}</p>
                                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                            {tx.cropName ?? tx.fieldName ?? "General"}
                                        </p>
                                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(tx.date)}</p>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-extrabold"
                                               style={{ color: tx.type === "Income" ? "#16A34A" : "#DC2626" }}>
                                                {tx.type === "Income" ? "+" : "−"}MWK {fmt(tx.amount)}
                                            </p>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEditTx(tx)}
                                                        className="p-1.5 rounded-lg"
                                                        style={{ color: "var(--text-muted)", background: "var(--bg-subtle)" }}>
                                                    <Pencil size={12} />
                                                </button>
                                                <button onClick={() => handleDeleteTx(tx.id)}
                                                        disabled={deletingId === tx.id}
                                                        className="p-1.5 rounded-lg"
                                                        style={{ background: "#FFF1F2", color: "#E11D48" }}>
                                                    {deletingId === tx.id
                                                        ? <Loader2 size={12} className="animate-spin" />
                                                        : <Trash2 size={12} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <div className="rounded-2xl overflow-hidden"
                     style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                    {overhead.length === 0 ? (
                        <div className="p-16 text-center">
                            <Wallet size={28} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                            <p className="font-black mb-1" style={{ color: "var(--text-primary)" }}>No overhead expenses</p>
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                                Track recurring costs like electricity and insurance
                            </p>
                        </div>
                    ) : (
                        <div>
                            {overhead.map((oh: any) => (
                                <div key={oh.id}
                                     className="group flex items-center justify-between px-5 py-4 transition-colors"
                                     style={{ borderBottom: "1px solid var(--border)" }}
                                     onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
                                     onMouseOut={(e)  => (e.currentTarget.style.background = "transparent")}>
                                    <div>
                                        <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                                            {oh.description}
                                        </p>
                                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                                            {oh.category} · {formatDate(oh.date)}
                                            {oh.recurring && (
                                                <span className="ml-2 text-[10px] font-black px-2 py-0.5 rounded-full"
                                                      style={{ background: "#EFF6FF", color: "#1E3A8A" }}>
                                                    Recurring
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className="text-sm font-extrabold" style={{ color: "#DC2626" }}>
                                            MWK {fmt(oh.amount)}
                                        </p>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditOh(oh)}
                                                    className="p-1.5 rounded-lg"
                                                    style={{ color: "var(--text-muted)", background: "var(--bg-subtle)" }}>
                                                <Pencil size={12} />
                                            </button>
                                            <button onClick={() => handleDeleteOh(oh.id)}
                                                    disabled={deletingId === oh.id}
                                                    className="p-1.5 rounded-lg"
                                                    style={{ background: "#FFF1F2", color: "#E11D48" }}>
                                                {deletingId === oh.id
                                                    ? <Loader2 size={12} className="animate-spin" />
                                                    : <Trash2 size={12} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Transaction slide-over ────────────────────────────────────── */}
            {showTxForm && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setShowTxForm(false)} />
                    <div className="w-full max-w-md flex flex-col shadow-2xl"
                         style={{ background: "var(--bg-card)", borderLeft: "1px solid var(--border)", height: "100vh" }}>

                        <div className="flex items-center justify-between px-6 py-5 flex-shrink-0"
                             style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                            <h2 className="text-base font-black" style={{ color: "var(--text-primary)" }}>
                                {editingTx ? "Edit transaction" : "Add transaction"}
                            </h2>
                            <button onClick={() => setShowTxForm(false)}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                                    style={{ background: "var(--bg-subtle)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                                <X size={15} />
                            </button>
                        </div>

                        <form onSubmit={handleTxSubmit} className="flex-1 flex flex-col min-h-0">
                            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

                                {/* Income / Expense toggle */}
                                <div className="flex gap-2">
                                    {[
                                        { t: "Income",  color: "#16A34A" },
                                        { t: "Expense", color: "#DC2626" },
                                    ].map(({ t, color }) => (
                                        <button key={t} type="button"
                                                onClick={() => { setTx("type", t); setTx("category", t === "Income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]); }}
                                                className="flex-1 h-11 rounded-xl text-sm font-bold transition-all"
                                                style={{
                                                    background: txForm.type === t ? color : "var(--bg-subtle)",
                                                    color:      txForm.type === t ? "white" : "var(--text-muted)",
                                                    border:     `1.5px solid ${txForm.type === t ? color : "var(--border)"}`,
                                                }}>
                                            {t}
                                        </button>
                                    ))}
                                </div>

                                <div>
                                    <Label>Category</Label>
                                    <select value={txForm.category} onChange={(e) => setTx("category", e.target.value)} style={INP}>
                                        {txCategories.map((c) => <option key={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <Label>Description *</Label>
                                    <input value={txForm.description}
                                           onChange={(e) => setTx("description", e.target.value)}
                                           placeholder="What is this for?" required style={INP} />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label>Amount (MWK) *</Label>
                                        <input type="number" step="1" min="0"
                                               value={txForm.amount}
                                               onChange={(e) => setTx("amount", e.target.value)}
                                               placeholder="0" required style={INP} />
                                    </div>
                                    <div>
                                        <Label>Date *</Label>
                                        <input type="date" value={txForm.date}
                                               onChange={(e) => setTx("date", e.target.value)}
                                               required style={INP} />
                                    </div>
                                </div>

                                <div>
                                    <Label>Season (optional)</Label>
                                    <select value={txForm.season} onChange={(e) => setTx("season", e.target.value)} style={INP}>
                                        <option value="">General — not season-specific</option>
                                        {(data?.allSeasons ?? []).map((s: string) => <option key={s}>{s}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <Label>Link to crop (optional)</Label>
                                    <select value={txForm.cropFieldId} onChange={(e) => setTx("cropFieldId", e.target.value)} style={INP}>
                                        <option value="">Not linked to a specific crop</option>
                                        {(data?.allCropFields ?? []).map((c: any) => (
                                            <option key={c.id} value={c.id}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {error && (
                                    <div className="rounded-xl px-4 py-3"
                                         style={{ background: "#FFF1F2", border: "1px solid #FFE4E6" }}>
                                        <p className="text-sm font-semibold" style={{ color: "#9F1239" }}>{error}</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 px-6 py-5 flex-shrink-0"
                                 style={{ borderTop: "1px solid var(--border)", background: "var(--bg-card)" }}>
                                <button type="button" onClick={() => setShowTxForm(false)}
                                        className="flex-1 h-11 rounded-xl font-bold text-sm"
                                        style={{ border: "1.5px solid var(--border)", color: "var(--text-muted)" }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                        className="flex-1 h-11 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
                                        style={{ background: saving ? "#94A3B8" : "var(--farm-green)" }}>
                                    {saving
                                        ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
                                        : <><Check size={14} /> {editingTx ? "Update" : "Save"}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Overhead slide-over ───────────────────────────────────────── */}
            {showOhForm && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setShowOhForm(false)} />
                    <div className="w-full max-w-md flex flex-col shadow-2xl"
                         style={{ background: "var(--bg-card)", borderLeft: "1px solid var(--border)", height: "100vh" }}>

                        <div className="flex items-center justify-between px-6 py-5 flex-shrink-0"
                             style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                            <h2 className="text-base font-black" style={{ color: "var(--text-primary)" }}>
                                {editingOh ? "Edit overhead" : "Add overhead expense"}
                            </h2>
                            <button onClick={() => setShowOhForm(false)}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                                    style={{ background: "var(--bg-subtle)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                                <X size={15} />
                            </button>
                        </div>

                        <form onSubmit={handleOhSubmit} className="flex-1 flex flex-col min-h-0">
                            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

                                <div>
                                    <Label>Description *</Label>
                                    <input value={ohForm.description}
                                           onChange={(e) => setOh("description", e.target.value)}
                                           placeholder="e.g. Electricity bill" required style={INP} />
                                </div>

                                <div>
                                    <Label>Category</Label>
                                    <select value={ohForm.category} onChange={(e) => setOh("category", e.target.value)} style={INP}>
                                        {OVERHEAD_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label>Amount (MWK) *</Label>
                                        <input type="number" step="1" min="0"
                                               value={ohForm.amount}
                                               onChange={(e) => setOh("amount", e.target.value)}
                                               placeholder="0" required style={INP} />
                                    </div>
                                    <div>
                                        <Label>Date *</Label>
                                        <input type="date" value={ohForm.date}
                                               onChange={(e) => setOh("date", e.target.value)}
                                               required style={INP} />
                                    </div>
                                </div>

                                {/* Recurring toggle */}
                                <div className="rounded-xl p-4 flex items-center justify-between"
                                     style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                                    <div>
                                        <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                                            Recurring expense
                                        </p>
                                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                                            Repeats every month
                                        </p>
                                    </div>
                                    <button type="button"
                                            onClick={() => setOh("recurring", !ohForm.recurring)}
                                            className="w-11 h-6 rounded-full relative flex-shrink-0 transition-colors"
                                            style={{ background: ohForm.recurring ? "var(--farm-green)" : "#CBD5E1" }}>
                                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all"
                                             style={{ left: ohForm.recurring ? "calc(100% - 20px)" : "4px" }} />
                                    </button>
                                </div>

                                {error && (
                                    <div className="rounded-xl px-4 py-3"
                                         style={{ background: "#FFF1F2", border: "1px solid #FFE4E6" }}>
                                        <p className="text-sm font-semibold" style={{ color: "#9F1239" }}>{error}</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 px-6 py-5 flex-shrink-0"
                                 style={{ borderTop: "1px solid var(--border)", background: "var(--bg-card)" }}>
                                <button type="button" onClick={() => setShowOhForm(false)}
                                        className="flex-1 h-11 rounded-xl font-bold text-sm"
                                        style={{ border: "1.5px solid var(--border)", color: "var(--text-muted)" }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                        className="flex-1 h-11 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
                                        style={{ background: saving ? "#94A3B8" : "var(--farm-green)" }}>
                                    {saving
                                        ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
                                        : <><Check size={14} /> {editingOh ? "Update" : "Save"}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

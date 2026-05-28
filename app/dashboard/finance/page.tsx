"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, X, Check, Pencil, Trash2, Wallet, TrendingUp, TrendingDown } from "lucide-react";

const INCOME_CATEGORIES = ["Crop sales", "Livestock sales", "Grant", "Loan", "Other income"];
const EXPENSE_CATEGORIES = ["Seeds", "Fertiliser", "Chemicals", "Equipment", "Fuel", "Transport", "Labour", "Land rent", "Loan repayment", "Other expense"];
const OVERHEAD_CATEGORIES = ["Electricity", "Water", "Insurance", "Admin", "Marketing", "Other overhead"];

function fmt(n: number) { return new Intl.NumberFormat("en-MW").format(Math.round(n)); }
function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const emptyTx = {
    type: "Income", category: "Crop sales", amount: "", date: new Date().toISOString().split("T")[0],
    description: "", season: "", fieldId: "", cropFieldId: "", harvestYieldId: "",
};

const emptyOverhead = {
    description: "", category: "Admin", amount: "",
    date: new Date().toISOString().split("T")[0], recurring: false, notes: "",
};

export default function FinancePage() {
    const [data, setData] = useState<any>(null);
    const [overhead, setOverhead] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"transactions" | "overhead">("transactions");
    const [showTxForm, setShowTxForm] = useState(false);
    const [showOhForm, setShowOhForm] = useState(false);
    const [editingTx, setEditingTx] = useState<any>(null);
    const [editingOh, setEditingOh] = useState<any>(null);
    const [txForm, setTxForm] = useState({ ...emptyTx });
    const [ohForm, setOhForm] = useState({ ...emptyOverhead });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [typeFilter, setTypeFilter] = useState("All");
    const [seasonFilter, setSeasonFilter] = useState("All");

    const load = () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (typeFilter !== "All") params.set("type", typeFilter);
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
        const url = editingTx ? `/api/finance/${editingTx.id}` : "/api/finance";
        const method = editingTx ? "PATCH" : "POST";
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(txForm) });
        const d = await res.json();
        if (!res.ok) { setError(d.error); setSaving(false); } else { setShowTxForm(false); load(); }
    };

    const handleOhSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true); setError("");
        const url = editingOh ? `/api/overhead/${editingOh.id}` : "/api/overhead";
        const method = editingOh ? "PATCH" : "POST";
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(ohForm) });
        const d = await res.json();
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

    const transactions = data?.transactions ?? [];
    const netPositive = (data?.net ?? 0) >= 0;
    const totalOverheadCost = overhead.reduce((s, o) => s + o.amount, 0);

    const categories = txForm.type === "Income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    return (
        <div className="p-8 max-w-6xl mx-auto">

            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Finance</h1>
                    <p className="text-slate-400 text-sm mt-1">Track income, expenses and overhead costs</p>
                </div>
                <button onClick={tab === "transactions" ? openAddTx : openAddOh}
                        className="flex items-center gap-2 h-10 px-5 bg-[#1a3d1f] text-white text-sm font-bold rounded-xl hover:bg-[#2d5c35] transition-colors hover:shadow-lg hover:shadow-[#1a3d1f]/20">
                    <Plus size={16} /> Add {tab === "transactions" ? "transaction" : "overhead"}
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Income", value: `MWK ${fmt(data?.income ?? 0)}`, color: "text-green-600 dark:text-green-400", icon: TrendingUp, iconColor: "text-green-500" },
                    { label: "Expenses", value: `MWK ${fmt(data?.expense ?? 0)}`, color: "text-red-500", icon: TrendingDown, iconColor: "text-red-500" },
                    { label: "Overhead", value: `MWK ${fmt(totalOverheadCost)}`, color: "text-orange-500 dark:text-orange-400", icon: Wallet, iconColor: "text-orange-500" },
                    { label: "Net", value: `MWK ${fmt(Math.abs(data?.net ?? 0))}`, color: netPositive ? "text-blue-600 dark:text-blue-400" : "text-red-500", icon: netPositive ? TrendingUp : TrendingDown, iconColor: netPositive ? "text-blue-500" : "text-red-500" },
                ].map(({ label, value, color, icon: Icon, iconColor }) => (
                    <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-sm transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">{label}</p>
                            <Icon size={16} className={iconColor} />
                        </div>
                        <p className={`text-2xl font-black ${color}`}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Season breakdown */}
            {(data?.bySeason?.length ?? 0) > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mb-6">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">By season</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {data.bySeason.map((s: any) => (
                            <div key={s.season} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                                <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">{s.season}</p>
                                <div className="flex justify-between text-xs">
                                    <span className="text-green-600 dark:text-green-400 font-semibold">+MWK {fmt(s.income)}</span>
                                    <span className="text-red-500 font-semibold">-MWK {fmt(s.expense)}</span>
                                    <span className={`font-bold ${s.net >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-500"}`}>
                    {s.net >= 0 ? "+" : ""}MWK {fmt(s.net)}
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
                    { key: "overhead", label: `Overhead (${overhead.length})` },
                ].map(({ key, label }) => (
                    <button key={key} onClick={() => setTab(key as any)}
                            className={`h-9 px-5 rounded-xl text-sm font-bold transition-colors ${
                                tab === key ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"
                            }`}>
                        {label}
                    </button>
                ))}
            </div>

            {/* Filters for transactions */}
            {tab === "transactions" && (
                <div className="flex flex-wrap gap-3 mb-4">
                    <div className="flex gap-2">
                        {["All", "Income", "Expense"].map((t) => (
                            <button key={t} onClick={() => setTypeFilter(t)}
                                    className={`h-8 px-4 rounded-xl text-xs font-bold transition-colors ${
                                        typeFilter === t
                                            ? t === "Income" ? "bg-green-600 text-white" : t === "Expense" ? "bg-red-500 text-white" : "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                                            : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500"
                                    }`}>
                                {t}
                            </button>
                        ))}
                    </div>
                    <select value={seasonFilter} onChange={(e) => setSeasonFilter(e.target.value)}
                            className="h-8 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-700 dark:text-slate-300">
                        <option value="All">All seasons</option>
                        {(data?.allSeasons ?? []).map((s: string) => <option key={s}>{s}</option>)}
                    </select>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-slate-400" /></div>
            ) : tab === "transactions" ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    {transactions.length === 0 ? (
                        <div className="p-16 text-center">
                            <Wallet size={32} className="text-slate-300 mx-auto mb-3" />
                            <p className="font-bold text-slate-900 dark:text-white mb-1">No transactions yet</p>
                            <p className="text-sm text-slate-400">Add your first transaction to start tracking finances</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-6 px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                                {["Description", "Category", "Season", "Linked to", "Date", "Amount"].map((h) => (
                                    <p key={h} className="text-xs font-bold text-slate-400 uppercase tracking-wide">{h}</p>
                                ))}
                            </div>
                            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                {transactions.map((tx: any) => (
                                    <div key={tx.id} className="group grid grid-cols-6 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors items-center">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{tx.description}</p>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{tx.category}</p>
                                        <p className="text-xs text-slate-400">{tx.season ?? "—"}</p>
                                        <p className="text-xs text-slate-400">{tx.cropName ?? tx.fieldName ?? "General"}</p>
                                        <p className="text-xs text-slate-400">{formatDate(tx.date)}</p>
                                        <div className="flex items-center justify-between">
                                            <p className={`text-sm font-bold ${tx.type === "Income" ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                                                {tx.type === "Income" ? "+" : "-"}MWK {fmt(tx.amount)}
                                            </p>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEditTx(tx)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 transition-colors"><Pencil size={12} /></button>
                                                <button onClick={() => handleDeleteTx(tx.id)} disabled={deletingId === tx.id} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors">
                                                    {deletingId === tx.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
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
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    {overhead.length === 0 ? (
                        <div className="p-16 text-center">
                            <Wallet size={32} className="text-slate-300 mx-auto mb-3" />
                            <p className="font-bold text-slate-900 dark:text-white mb-1">No overhead expenses</p>
                            <p className="text-sm text-slate-400">Track recurring costs like electricity and insurance</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50 dark:divide-slate-800">
                            {overhead.map((oh: any) => (
                                <div key={oh.id} className="group flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{oh.description}</p>
                                        <p className="text-xs text-slate-400">{oh.category} · {formatDate(oh.date)}{oh.recurring ? " · Recurring" : ""}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className="text-sm font-bold text-red-500">MWK {fmt(oh.amount)}</p>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditOh(oh)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 transition-colors"><Pencil size={12} /></button>
                                            <button onClick={() => handleDeleteOh(oh.id)} disabled={deletingId === oh.id} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors">
                                                {deletingId === oh.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Transaction Form */}
            {showTxForm && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setShowTxForm(false)} />
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full overflow-y-auto shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">{editingTx ? "Edit transaction" : "Add transaction"}</h2>
                            <button onClick={() => setShowTxForm(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleTxSubmit} className="flex-1 p-6 flex flex-col gap-4">

                            <div className="flex gap-2">
                                {["Income", "Expense"].map((t) => (
                                    <button key={t} type="button" onClick={() => { setTx("type", t); setTx("category", t === "Income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]); }}
                                            className={`flex-1 h-11 rounded-xl text-sm font-bold transition-colors ${
                                                txForm.type === t
                                                    ? t === "Income" ? "bg-green-600 text-white" : "bg-red-500 text-white"
                                                    : "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500"
                                            }`}>
                                        {t}
                                    </button>
                                ))}
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Category</label>
                                <select value={txForm.category} onChange={(e) => setTx("category", e.target.value)}
                                        className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white">
                                    {categories.map((c) => <option key={c}>{c}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Description</label>
                                <input value={txForm.description} onChange={(e) => setTx("description", e.target.value)} placeholder="What is this for?" required
                                       className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Amount (MWK)</label>
                                    <input type="number" step="1" min="0" value={txForm.amount} onChange={(e) => setTx("amount", e.target.value)} placeholder="0" required
                                           className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white" />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Date</label>
                                    <input type="date" value={txForm.date} onChange={(e) => setTx("date", e.target.value)} required
                                           className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white" />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Season (optional)</label>
                                <select value={txForm.season} onChange={(e) => setTx("season", e.target.value)}
                                        className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white">
                                    <option value="">General — not season-specific</option>
                                    {(data?.allSeasons ?? []).map((s: string) => <option key={s}>{s}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Link to crop (optional)</label>
                                <select value={txForm.cropFieldId} onChange={(e) => setTx("cropFieldId", e.target.value)}
                                        className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white">
                                    <option value="">Not linked to a specific crop</option>
                                    {(data?.allCropFields ?? []).map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.label}</option>
                                    ))}
                                </select>
                            </div>

                            {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">{error}</p>}

                            <div className="flex gap-3 mt-auto pt-4">
                                <button type="button" onClick={() => setShowTxForm(false)}
                                        className="flex-1 h-12 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                                <button type="submit" disabled={saving}
                                        className="flex-1 h-12 bg-[#1a3d1f] text-white text-sm font-bold rounded-xl hover:bg-[#2d5c35] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                    {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Check size={15} /> {editingTx ? "Update" : "Save"}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Overhead Form */}
            {showOhForm && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setShowOhForm(false)} />
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full overflow-y-auto shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">{editingOh ? "Edit overhead" : "Add overhead expense"}</h2>
                            <button onClick={() => setShowOhForm(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleOhSubmit} className="flex-1 p-6 flex flex-col gap-4">
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Description</label>
                                <input value={ohForm.description} onChange={(e) => setOh("description", e.target.value)} placeholder="e.g. Electricity bill" required
                                       className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white" />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Category</label>
                                <select value={ohForm.category} onChange={(e) => setOh("category", e.target.value)}
                                        className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white">
                                    {OVERHEAD_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Amount (MWK)</label>
                                    <input type="number" step="1" min="0" value={ohForm.amount} onChange={(e) => setOh("amount", e.target.value)} placeholder="0" required
                                           className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white" />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Date</label>
                                    <input type="date" value={ohForm.date} onChange={(e) => setOh("date", e.target.value)} required
                                           className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Recurring expense</p>
                                    <p className="text-xs text-slate-400">Repeats every month</p>
                                </div>
                                <button type="button" onClick={() => setOh("recurring", !ohForm.recurring)}
                                        className={`w-10 h-5 rounded-full transition-colors relative ${ohForm.recurring ? "bg-[#1a3d1f]" : "bg-slate-300 dark:bg-slate-600"}`}>
                                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${ohForm.recurring ? "translate-x-5" : "translate-x-0.5"}`} />
                                </button>
                            </div>
                            {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">{error}</p>}
                            <div className="flex gap-3 mt-auto pt-4">
                                <button type="button" onClick={() => setShowOhForm(false)}
                                        className="flex-1 h-12 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                                <button type="submit" disabled={saving}
                                        className="flex-1 h-12 bg-[#1a3d1f] text-white text-sm font-bold rounded-xl hover:bg-[#2d5c35] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                    {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Check size={15} /> {editingOh ? "Update" : "Save"}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
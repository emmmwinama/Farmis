"use client";

import { useEffect, useState } from "react";
import {
    Plus, Loader2, Trash2, Pencil, X, Check,
    TrendingUp, TrendingDown, Filter, BarChart2,
    Building2,
} from "lucide-react";
import Link from "next/link";

const INCOME_CATEGORIES = [
    "Crop Sales", "Livestock Sales", "Equipment Hire",
    "Grants & Subsidies", "Insurance Payout", "Other Income",
];

const EXPENSE_CATEGORIES = [
    "Seeds", "Fertilizer", "Chemicals & Pesticides", "Labour",
    "Equipment & Machinery", "Fuel & Transport", "Irrigation",
    "Land Preparation", "Storage", "Insurance",
    "Loan Repayment", "Utilities", "Other Expense",
];

const OVERHEAD_CATEGORIES = [
    "Employee Salary", "Rent & Lease", "Utilities",
    "Insurance", "Loan Repayment", "Equipment Maintenance",
    "Administration", "Other Overhead",
];

function fmt(n: number) {
    return new Intl.NumberFormat("en-MW").format(Math.round(n));
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
    });
}

const emptyTxForm = {
    type: "Income",
    category: "Crop Sales",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
};

const emptyOverheadForm = {
    description: "",
    category: "Employee Salary",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    recurring: false,
    notes: "",
};

export default function FinancePage() {
    const [tab, setTab] = useState<"transactions" | "overhead" | "activity">("transactions");
    const [txData, setTxData] = useState<any>(null);
    const [overhead, setOverhead] = useState<any[]>([]);
    const [activityCosts, setActivityCosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Transaction form
    const [showTxForm, setShowTxForm] = useState(false);
    const [editingTx, setEditingTx] = useState<any>(null);
    const [txForm, setTxForm] = useState(emptyTxForm);

    // Overhead form
    const [showOhForm, setShowOhForm] = useState(false);
    const [editingOh, setEditingOh] = useState<any>(null);
    const [ohForm, setOhForm] = useState(emptyOverheadForm);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showStats, setShowStats] = useState(false);
    const [typeFilter, setTypeFilter] = useState("All");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const loadAll = () => {
        setLoading(true);
        Promise.all([
            fetch("/api/finance").then((r) => r.json()),
            fetch("/api/overhead").then((r) => r.json()),
            fetch("/api/reports").then((r) => r.json()),
        ]).then(([tx, oh, rep]) => {
            setTxData(tx);
            setOverhead(oh);
            setActivityCosts(rep.cropFieldDetail ?? []);
            setLoading(false);
        });
    };

    useEffect(() => { loadAll(); }, []);

    // Totals
    const totalIncome = txData?.income ?? 0;
    const totalTxExpense = txData?.expense ?? 0;
    const totalOverhead = overhead.reduce((s: number, o: any) => s + o.amount, 0);
    const totalActivityCost = activityCosts.reduce((s: number, c: any) => s + c.total, 0);
    const totalExpense = totalTxExpense + totalOverhead + totalActivityCost;
    const net = totalIncome - totalExpense;

    // Transaction handlers
    const openAddTx = () => { setEditingTx(null); setTxForm(emptyTxForm); setError(""); setShowTxForm(true); };
    const openEditTx = (tx: any) => {
        setEditingTx(tx);
        setTxForm({ type: tx.type, category: tx.category, amount: tx.amount.toString(), date: new Date(tx.date).toISOString().split("T")[0], description: tx.description });
        setError(""); setShowTxForm(true);
    };
    const closeTxForm = () => { setShowTxForm(false); setEditingTx(null); };
    const setTx = (k: string, v: string) => setTxForm((f) => ({ ...f, [k]: v }));

    const handleTxSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true); setError("");
        const url = editingTx ? `/api/finance/${editingTx.id}` : "/api/finance";
        const res = await fetch(url, { method: editingTx ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(txForm) });
        const d = await res.json();
        if (!res.ok) { setError(d.error); setSaving(false); } else { closeTxForm(); loadAll(); }
    };

    const handleTxDelete = async (id: string) => {
        if (!confirm("Delete this transaction?")) return;
        setDeletingId(id);
        await fetch(`/api/finance/${id}`, { method: "DELETE" });
        setDeletingId(null); loadAll();
    };

    // Overhead handlers
    const openAddOh = () => { setEditingOh(null); setOhForm(emptyOverheadForm); setError(""); setShowOhForm(true); };
    const openEditOh = (oh: any) => {
        setEditingOh(oh);
        setOhForm({ description: oh.description, category: oh.category, amount: oh.amount.toString(), date: new Date(oh.date).toISOString().split("T")[0], recurring: oh.recurring, notes: oh.notes ?? "" });
        setError(""); setShowOhForm(true);
    };
    const closeOhForm = () => { setShowOhForm(false); setEditingOh(null); };
    const setOh = (k: string, v: any) => setOhForm((f) => ({ ...f, [k]: v }));

    const handleOhSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true); setError("");
        const url = editingOh ? `/api/overhead/${editingOh.id}` : "/api/overhead";
        const res = await fetch(url, { method: editingOh ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ohForm) });
        const d = await res.json();
        if (!res.ok) { setError(d.error); setSaving(false); } else { closeOhForm(); loadAll(); }
    };

    const handleOhDelete = async (id: string) => {
        if (!confirm("Delete this overhead expense?")) return;
        setDeletingId(id);
        await fetch(`/api/overhead/${id}`, { method: "DELETE" });
        setDeletingId(null); loadAll();
    };

    const filteredTx = (txData?.transactions ?? []).filter((t: any) => {
        if (typeFilter !== "All" && t.type !== typeFilter) return false;
        if (fromDate && new Date(t.date) < new Date(fromDate)) return false;
        if (toDate && new Date(t.date) > new Date(toDate)) return false;
        return true;
    });

    const maxBar = Math.max(...(txData?.byMonth ?? []).map((m: any) => Math.max(m.income, m.expense)), 1);

    if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-slate-400" /></div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-medium text-slate-900">Finance</h1>
                    <p className="text-slate-400 text-sm mt-1">Track income, expenses and farm profitability</p>
                </div>
                <div className="flex gap-2">
                    <Link
                        href="/dashboard/reports"
                        className="flex items-center gap-2 h-10 px-4 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        Reports
                    </Link>
                    <button
                        onClick={tab === "overhead" ? openAddOh : openAddTx}
                        className="flex items-center gap-2 h-10 px-4 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
                    >
                        <Plus size={16} /> Add {tab === "overhead" ? "overhead" : "transaction"}
                    </button>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={15} className="text-green-600" />
                        <p className="text-xs uppercase tracking-wide text-slate-400 font-medium">Income</p>
                    </div>
                    <p className="text-2xl font-medium text-green-700">MWK {fmt(totalIncome)}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingDown size={15} className="text-red-500" />
                        <p className="text-xs uppercase tracking-wide text-slate-400 font-medium">Activity costs</p>
                    </div>
                    <p className="text-2xl font-medium text-red-600">MWK {fmt(totalActivityCost)}</p>
                    <p className="text-xs text-slate-400 mt-1">from {activityCosts.length} crop records</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Building2 size={15} className="text-orange-500" />
                        <p className="text-xs uppercase tracking-wide text-slate-400 font-medium">Overhead</p>
                    </div>
                    <p className="text-2xl font-medium text-orange-600">MWK {fmt(totalOverhead)}</p>
                    <p className="text-xs text-slate-400 mt-1">{overhead.length} expenses</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <p className="text-xs uppercase tracking-wide text-slate-400 font-medium mb-3">Net balance</p>
                    <p className={`text-2xl font-medium ${net >= 0 ? "text-green-700" : "text-red-600"}`}>
                        MWK {fmt(net)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">income minus all costs</p>
                </div>
            </div>

            {/* Analytics toggle */}
            <button
                onClick={() => setShowStats(!showStats)}
                className={`flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium border transition-colors mb-4 ${
                    showStats ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
            >
                <BarChart2 size={14} /> Analytics
            </button>

            {/* Analytics panel */}
            {showStats && txData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

                    {/* Monthly chart */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                        <h3 className="text-sm font-medium text-slate-900 mb-5">Monthly overview</h3>
                        {txData.byMonth.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-8">No data yet</p>
                        ) : (
                            <>
                                <div className="flex items-end gap-2 h-36 mb-2">
                                    {txData.byMonth.slice(-8).map((m: any, i: number) => (
                                        <div key={`${m.month}-${i}`} className="flex-1 flex flex-col items-center gap-0.5">
                                            <div className="w-full flex gap-0.5 items-end" style={{ height: "110px" }}>
                                                <div className="flex-1 bg-green-200 rounded-t" style={{ height: `${(m.income / maxBar) * 100}%`, minHeight: m.income > 0 ? "2px" : "0" }} />
                                                <div className="flex-1 bg-red-200 rounded-t" style={{ height: `${(m.expense / maxBar) * 100}%`, minHeight: m.expense > 0 ? "2px" : "0" }} />
                                            </div>
                                            <span className="text-slate-400 text-center leading-tight" style={{ fontSize: "9px" }}>{m.month}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-green-200 rounded-sm" /><span className="text-xs text-slate-400">Income</span></div>
                                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-200 rounded-sm" /><span className="text-xs text-slate-400">Expense</span></div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Cost breakdown */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                        <h3 className="text-sm font-medium text-slate-900 mb-4">Cost breakdown</h3>
                        <div className="flex flex-col gap-3">
                            {[
                                { label: "Activity costs", value: totalActivityCost, color: "bg-red-400" },
                                { label: "Overhead expenses", value: totalOverhead, color: "bg-orange-400" },
                                { label: "Other expenses", value: totalTxExpense, color: "bg-amber-400" },
                            ].map(({ label, value, color }) => {
                                const pct = totalExpense > 0 ? (value / totalExpense) * 100 : 0;
                                return (
                                    <div key={label}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-600">{label}</span>
                                            <span className="text-slate-900 font-medium">MWK {fmt(value)} ({pct.toFixed(0)}%)</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* By category */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                        <h3 className="text-sm font-medium text-slate-900 mb-4">By category</h3>
                        {txData.byCategory.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-4">No data yet</p>
                        ) : (
                            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                                {txData.byCategory.map((c: any, i: number) => (
                                    <div key={`${c.category}-${i}`} className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.type === "Income" ? "bg-green-500" : "bg-red-400"}`} />
                                            <span className="text-xs text-slate-600 truncate">{c.category}</span>
                                        </div>
                                        <span className={`text-xs font-medium flex-shrink-0 ${c.type === "Income" ? "text-green-700" : "text-red-600"}`}>
                      MWK {fmt(c.total)}
                    </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Activity cost by crop */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                        <h3 className="text-sm font-medium text-slate-900 mb-4">Activity cost by crop</h3>
                        {activityCosts.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-4">No activity costs yet</p>
                        ) : (
                            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                                {activityCosts.sort((a: any, b: any) => b.total - a.total).slice(0, 8).map((c: any, i: number) => (
                                    <div key={`${c.id}-${i}`} className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium text-slate-900 truncate">{c.cropName} — {c.fieldName}</p>
                                            <p className="text-xs text-slate-400">{c.season} · {c.areaPlanted} ha</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-xs font-medium text-slate-900">MWK {fmt(c.total)}</p>
                                            <p className="text-xs text-slate-400">MWK {fmt(c.costPerHectare)}/ha</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                {[
                    { key: "transactions", label: "Transactions" },
                    { key: "overhead", label: "Overhead expenses" },
                    { key: "activity", label: "Activity costs" },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key as any)}
                        className={`h-9 px-4 rounded-xl text-sm font-medium transition-colors ${
                            tab === key
                                ? "bg-slate-900 text-white"
                                : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Transaction tab */}
            {tab === "transactions" && (
                <>
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                        <div className="flex gap-2">
                            {["All", "Income", "Expense"].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTypeFilter(t)}
                                    className={`h-8 px-4 rounded-xl text-sm font-medium transition-colors ${
                                        typeFilter === t ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-500 hover:border-slate-300"
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-8 px-3 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-slate-400" />
                            <span className="text-slate-400 text-xs">to</span>
                            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-8 px-3 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-slate-400" />
                        </div>
                    </div>

                    {filteredTx.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
                            <p className="text-4xl mb-4">💰</p>
                            <p className="text-slate-900 font-medium mb-1">No transactions yet</p>
                            <p className="text-slate-400 text-sm mb-6">Record income and expenses to track your farm finances</p>
                            <button onClick={openAddTx} className="inline-flex items-center gap-2 h-10 px-5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors">
                                <Plus size={16} /> Add transaction
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                            <div className="flex flex-col divide-y divide-slate-100">
                                {filteredTx.map((tx: any) => (
                                    <div key={tx.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === "Income" ? "bg-green-50" : "bg-red-50"}`}>
                                            {tx.type === "Income" ? <TrendingUp size={16} className="text-green-600" /> : <TrendingDown size={16} className="text-red-500" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900">{tx.description}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-slate-400">{tx.category}</span>
                                                <span className="text-slate-200 text-xs">·</span>
                                                <span className="text-xs text-slate-400">{formatDate(tx.date)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className={`text-sm font-medium ${tx.type === "Income" ? "text-green-700" : "text-red-600"}`}>
                                                {tx.type === "Income" ? "+" : "-"}MWK {fmt(tx.amount)}
                                            </p>
                                            <button onClick={() => openEditTx(tx)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"><Pencil size={14} /></button>
                                            <button onClick={() => handleTxDelete(tx.id)} disabled={deletingId === tx.id} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                                                {deletingId === tx.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Overhead tab */}
            {tab === "overhead" && (
                <>
                    {overhead.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
                            <p className="text-4xl mb-4">🏢</p>
                            <p className="text-slate-900 font-medium mb-1">No overhead expenses</p>
                            <p className="text-slate-400 text-sm mb-6">Track salaries, rent, utilities and other fixed costs</p>
                            <button onClick={openAddOh} className="inline-flex items-center gap-2 h-10 px-5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors">
                                <Plus size={16} /> Add overhead expense
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                            <div className="flex flex-col divide-y divide-slate-100">
                                {overhead.map((oh: any) => (
                                    <div key={oh.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                                        <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                                            <Building2 size={16} className="text-orange-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-slate-900">{oh.description}</p>
                                                {oh.recurring && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">Recurring</span>}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-slate-400">{oh.category}</span>
                                                <span className="text-slate-200 text-xs">·</span>
                                                <span className="text-xs text-slate-400">{formatDate(oh.date)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className="text-sm font-medium text-orange-600">-MWK {fmt(oh.amount)}</p>
                                            <button onClick={() => openEditOh(oh)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"><Pencil size={14} /></button>
                                            <button onClick={() => handleOhDelete(oh.id)} disabled={deletingId === oh.id} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                                                {deletingId === oh.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Activity costs tab */}
            {tab === "activity" && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    {activityCosts.length === 0 ? (
                        <div className="p-16 text-center">
                            <p className="text-4xl mb-4">🌱</p>
                            <p className="text-slate-900 font-medium mb-1">No activity costs yet</p>
                            <p className="text-slate-400 text-sm">Log activities with labour and inputs to see costs here</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-5 gap-0 px-5 py-3 border-b border-slate-100 bg-slate-50">
                                {["Crop", "Field / Season", "Area", "Cost", "Cost/ha"].map((h) => (
                                    <p key={h} className="text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</p>
                                ))}
                            </div>
                            <div className="flex flex-col divide-y divide-slate-50">
                                {activityCosts.sort((a: any, b: any) => b.total - a.total).map((c: any, i: number) => (
                                    <div key={`${c.id}-${i}`} className="grid grid-cols-5 gap-0 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{c.cropName}</p>
                                            <p className="text-xs text-slate-400">{c.variety}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-900">{c.fieldName}</p>
                                            <p className="text-xs text-slate-400">{c.season}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-900">{c.areaPlanted} ha</p>
                                            <p className="text-xs text-slate-400">{c.activityCount} activities</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-red-600">MWK {fmt(c.total)}</p>
                                            <p className="text-xs text-slate-400">L:{fmt(c.labour)} I:{fmt(c.inputs)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">MWK {fmt(c.costPerHectare)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Transaction form */}
            {showTxForm && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/20" onClick={closeTxForm} />
                    <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-xl flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h2 className="text-base font-medium text-slate-900">{editingTx ? "Edit transaction" : "Add transaction"}</h2>
                            <button onClick={closeTxForm} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleTxSubmit} className="flex-1 p-6 flex flex-col gap-5">
                            <div>
                                <label className="text-sm text-slate-500 mb-1.5 block">Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {["Income", "Expense"].map((t) => (
                                        <button key={t} type="button"
                                                onClick={() => { setTx("type", t); setTx("category", t === "Income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]); }}
                                                className={`h-12 rounded-xl text-sm font-medium transition-colors border ${txForm.type === t ? t === "Income" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                                        >
                                            {t === "Income" ? "↑ Income" : "↓ Expense"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-slate-500 mb-1.5 block">Category</label>
                                <select value={txForm.category} onChange={(e) => setTx("category", e.target.value)} className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400">
                                    {(txForm.type === "Income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-slate-500 mb-1.5 block">Description</label>
                                <input value={txForm.description} onChange={(e) => setTx("description", e.target.value)} placeholder="e.g. Sold 50 bags of maize" required className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-slate-500 mb-1.5 block">Amount (MWK)</label>
                                    <input type="number" step="1" min="0" value={txForm.amount} onChange={(e) => setTx("amount", e.target.value)} placeholder="0" required className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400" />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-500 mb-1.5 block">Date</label>
                                    <input type="date" value={txForm.date} onChange={(e) => setTx("date", e.target.value)} required className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400" />
                                </div>
                            </div>
                            {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
                            <div className="flex gap-3 mt-auto pt-4">
                                <button type="button" onClick={closeTxForm} className="flex-1 h-12 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" disabled={saving} className="flex-1 h-12 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                    {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Check size={15} /> {editingTx ? "Update" : "Save"}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Overhead form */}
            {showOhForm && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/20" onClick={closeOhForm} />
                    <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-xl flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h2 className="text-base font-medium text-slate-900">{editingOh ? "Edit overhead" : "Add overhead expense"}</h2>
                            <button onClick={closeOhForm} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleOhSubmit} className="flex-1 p-6 flex flex-col gap-5">
                            <div>
                                <label className="text-sm text-slate-500 mb-1.5 block">Category</label>
                                <select value={ohForm.category} onChange={(e) => setOh("category", e.target.value)} className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400">
                                    {OVERHEAD_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-slate-500 mb-1.5 block">Description</label>
                                <input value={ohForm.description} onChange={(e) => setOh("description", e.target.value)} placeholder="e.g. John Banda monthly salary" required className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-slate-500 mb-1.5 block">Amount (MWK)</label>
                                    <input type="number" step="1" min="0" value={ohForm.amount} onChange={(e) => setOh("amount", e.target.value)} placeholder="0" required className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400" />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-500 mb-1.5 block">Date</label>
                                    <input type="date" value={ohForm.date} onChange={(e) => setOh("date", e.target.value)} required className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-slate-500 mb-1.5 block">Notes <span className="text-slate-300">(optional)</span></label>
                                <input value={ohForm.notes} onChange={(e) => setOh("notes", e.target.value)} placeholder="Any notes..." className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400" />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Recurring expense</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Mark if this repeats monthly</p>
                                </div>
                                <button type="button" onClick={() => setOh("recurring", !ohForm.recurring)}
                                        className={`w-11 h-6 rounded-full transition-colors relative ${ohForm.recurring ? "bg-slate-900" : "bg-slate-200"}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${ohForm.recurring ? "translate-x-6" : "translate-x-1"}`} />
                                </button>
                            </div>
                            {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
                            <div className="flex gap-3 mt-auto pt-4">
                                <button type="button" onClick={closeOhForm} className="flex-1 h-12 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" disabled={saving} className="flex-1 h-12 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
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
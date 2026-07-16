"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, Plus, X, Check } from "lucide-react";

function fmt(n: number) { return new Intl.NumberFormat("en-MW").format(Math.round(n)); }
function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]     = useState("");
    const [showForm, setShowForm] = useState(false);
    const [form, setForm]         = useState({ userId: "", subscriptionId: "", amount: "", currency: "MWK", method: "Cash", reference: "", notes: "" });
    const [users, setUsers]       = useState<any[]>([]);
    const [saving, setSaving]     = useState(false);
    const [error, setError]       = useState("");

    const load = () => {
        setLoading(true);
        fetch("/api/admin/payments")
            .then(async (r) => {
                const text = await r.text();
                if (!text) return;
                try {
                    const d = JSON.parse(text);
                    if (Array.isArray(d)) {
                        setPayments(d);
                    } else {
                        setPayments(d.payments ?? []);
                        setTotalRevenue(d.totalRevenue ?? 0);
                        setMonthlyRevenue(d.monthlyRevenue ?? 0);
                    }
                } catch { /* ignore */ }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const [totalRevenue, setTotalRevenue] = useState(0);
    const [monthlyRevenue, setMonthlyRevenue] = useState(0);

    const filtered = payments.filter((p) => {
        const q = search.toLowerCase();
        return !q || p.userName?.toLowerCase().includes(q) || p.reference?.toLowerCase().includes(q);
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true); setError("");
        const res = await fetch("/api/admin/payments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, amount: parseFloat(form.amount), status: "success", paidAt: new Date() }),
        });
        const d = await res.json();
        if (!res.ok) { setError(d.error); setSaving(false); }
        else { setShowForm(false); load(); }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white">Payments</h1>
                    <p className="text-sm mt-1" style={{ color: "#4a7a50" }}>{payments.length} total</p>
                </div>
                <button onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold text-white transition-all"
                        style={{ background: "linear-gradient(135deg, #1a3d1f, #2d6a35)", boxShadow: "0 2px 8px rgba(26,61,31,0.4)" }}>
                    <Plus size={15} /> Record payment
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: "Total revenue",   value: `MWK ${fmt(totalRevenue)}`,                                    color: "#16A34A" },
                    { label: "Payments",        value: String(payments.filter((p) => p.status === "success").length),  color: "#3d8c47" },
                    { label: "This month",      value: `MWK ${fmt(payments.filter((p) => { const d = new Date(p.paidAt); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear() && p.status === "success"; }).reduce((s, p) => s + p.amount, 0))}`, color: "#2563EB" },
                ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-2xl p-5"
                         style={{ background: "#162518", border: "1px solid #2d5c35" }}>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "#4a7a50" }}>{label}</p>
                        <p className="text-xl font-black" style={{ color }}>{value}</p>
                    </div>
                ))}
            </div>

            <div className="relative mb-5">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#4a7a50" }} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search payments..."
                       className="w-full max-w-sm h-10 pl-9 pr-4 text-sm rounded-xl outline-none"
                       style={{ background: "#162518", border: "1px solid #2d5c35", color: "white" }} />
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={24} className="animate-spin" style={{ color: "#3d8c47" }} />
                </div>
            ) : (
                <div className="rounded-2xl overflow-hidden" style={{ background: "#162518", border: "1px solid #2d5c35" }}>
                    <table className="w-full text-sm">
                        <thead>
                        <tr style={{ borderBottom: "1px solid #2d5c35", background: "#0f1a10" }}>
                            {["User", "Amount", "Method", "Reference", "Date", "Status"].map((h) => (
                                <th key={h} className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest"
                                    style={{ color: "#4a7a50" }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.map((p) => (
                            <tr key={p.id} className="transition-colors" style={{ borderBottom: "1px solid #1a3d1f" }}
                                onMouseOver={(e) => (e.currentTarget.style.background = "rgba(61,140,71,0.05)")}
                                onMouseOut={(e)  => (e.currentTarget.style.background = "transparent")}>
                                <td className="px-5 py-4">
                                    <p className="font-bold text-white">{p.userName}</p>
                                    <p className="text-xs" style={{ color: "#4a7a50" }}>{p.tierName}</p>
                                </td>
                                <td className="px-5 py-4 font-extrabold" style={{ color: "#7dd68a" }}>MWK {fmt(p.amount)}</td>
                                <td className="px-5 py-4 text-xs" style={{ color: "#4a7a50" }}>{p.method ?? "—"}</td>
                                <td className="px-5 py-4 text-xs font-mono" style={{ color: "#4a7a50" }}>{p.reference ?? "—"}</td>
                                <td className="px-5 py-4 text-xs" style={{ color: "#4a7a50" }}>{p.paidAt ? fmtDate(p.paidAt) : "—"}</td>
                                <td className="px-5 py-4">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                        p.status === "success" ? "bg-green-900/40 text-green-400" :
                            p.status === "failed"  ? "bg-red-900/40 text-red-400" :
                                "bg-sky-900/40 text-sky-400"
                    }`}>
                      {p.status}
                    </span>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && (
                        <div className="py-12 text-center">
                            <p className="text-sm" style={{ color: "#4a7a50" }}>No payments found</p>
                        </div>
                    )}
                </div>
            )}

            {/* Record payment form */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/50" onClick={() => setShowForm(false)} />
                    <div className="w-full max-w-md h-full overflow-y-auto flex flex-col shadow-2xl"
                         style={{ background: "#162518", borderLeft: "1px solid #2d5c35" }}>
                        <div className="flex items-center justify-between p-6"
                             style={{ borderBottom: "1px solid #2d5c35" }}>
                            <h2 className="text-base font-black text-white">Record payment</h2>
                            <button onClick={() => setShowForm(false)}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                                    style={{ background: "rgba(61,140,71,0.1)", color: "#4a7a50" }}>
                                <X size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="flex-1 p-6 flex flex-col gap-4">
                            {[
                                { key: "userId",   label: "User", type: "select" },
                                { key: "amount",   label: "Amount (MWK)", type: "number" },
                                { key: "method",   label: "Payment method", type: "select-method" },
                                { key: "reference", label: "Reference / receipt #", type: "text" },
                                { key: "notes",    label: "Notes", type: "text" },
                            ].map(({ key, label, type }) => (
                                <div key={key}>
                                    <label className="block text-xs font-black uppercase tracking-widest mb-1.5"
                                           style={{ color: "#4a7a50" }}>
                                        {label}
                                    </label>
                                    {type === "select" ? (
                                        <select value={form[key as keyof typeof form] as string}
                                                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                                                required
                                                className="w-full h-11 px-4 text-sm rounded-xl outline-none"
                                                style={{ background: "#0f1a10", border: "1px solid #2d5c35", color: "white" }}>
                                            <option value="">Select user...</option>
                                            {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                                        </select>
                                    ) : type === "select-method" ? (
                                        <select value={form.method}
                                                onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
                                                className="w-full h-11 px-4 text-sm rounded-xl outline-none"
                                                style={{ background: "#0f1a10", border: "1px solid #2d5c35", color: "white" }}>
                                            {["Cash", "Mobile Money", "Bank Transfer", "Card", "Other"].map((m) => (
                                                <option key={m}>{m}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type={type}
                                            value={form[key as keyof typeof form] as string}
                                            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                                            required={key === "amount"}
                                            className="w-full h-11 px-4 text-sm rounded-xl outline-none"
                                            style={{ background: "#0f1a10", border: "1px solid #2d5c35", color: "white" }}
                                        />
                                    )}
                                </div>
                            ))}

                            {error && (
                                <p className="text-sm font-semibold px-4 py-3 rounded-xl"
                                   style={{ background: "rgba(220,38,38,0.15)", color: "#F87171" }}>
                                    {error}
                                </p>
                            )}

                            <div className="flex gap-3 mt-auto pt-4">
                                <button type="button" onClick={() => setShowForm(false)}
                                        className="flex-1 h-12 rounded-xl font-bold text-sm transition-all"
                                        style={{ border: "1px solid #2d5c35", color: "#4a7a50" }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                        className="flex-1 h-12 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2"
                                        style={{ background: "linear-gradient(135deg, #1a3d1f, #2d6a35)" }}>
                                    {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Check size={15} /> Record</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

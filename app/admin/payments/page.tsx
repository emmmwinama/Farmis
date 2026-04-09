"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, X, Check } from "lucide-react";

const METHODS = ["mobile_money", "cash", "bank_transfer", "card"];

function fmt(n: number) {
    return new Intl.NumberFormat("en-MW").format(Math.round(n));
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_COLORS: Record<string, string> = {
    paid: "bg-green-900/30 text-green-400",
    pending: "bg-yellow-900/30 text-yellow-400",
    failed: "bg-red-900/30 text-red-400",
    refunded: "bg-slate-800 text-slate-400",
};

export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        subscriptionId: "", amount: "", method: "mobile_money",
        reference: "", notes: "", paidAt: new Date().toISOString().split("T")[0],
    });

    const load = () => {
        setLoading(true);
        Promise.all([
            fetch("/api/admin/payments").then((r) => r.json()),
            fetch("/api/admin/subscriptions").then((r) => r.json()),
        ]).then(([p, s]) => { setPayments(p); setSubscriptions(s); setLoading(false); });
    };

    useEffect(() => { load(); }, []);

    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

    const totalRevenue = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true); setError("");
        const res = await fetch("/api/admin/payments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); setSaving(false); }
        else { setShowForm(false); load(); }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-medium text-white">Payments</h1>
                    <p className="text-[#4a7a50] text-sm mt-1">
                        {payments.length} records &mdash; MWK {fmt(totalRevenue)} total revenue
                    </p>
                </div>
                <button onClick={() => { setShowForm(true); setError(""); setForm({ subscriptionId: subscriptions[0]?.id ?? "", amount: "", method: "mobile_money", reference: "", notes: "", paidAt: new Date().toISOString().split("T")[0] }); }}
                        className="flex items-center gap-2 h-10 px-4 bg-[#1a3d1f] text-white text-sm font-medium rounded-xl hover:bg-[#2d5c35] transition-colors">
                    <Plus size={16} /> Log payment
                </button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Total revenue", value: `MWK ${fmt(totalRevenue)}` },
                    { label: "Paid", value: payments.filter((p) => p.status === "paid").length },
                    { label: "Pending", value: payments.filter((p) => p.status === "pending").length },
                    { label: "Failed", value: payments.filter((p) => p.status === "failed").length },
                ].map(({ label, value }) => (
                    <div key={label} className="bg-[#1a2d1c] border border-[#2d5c35] rounded-2xl p-5">
                        <p className="text-xs text-[#4a7a50] uppercase tracking-wide font-medium mb-2">{label}</p>
                        <p className="text-xl font-medium text-white">{value}</p>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[#3d8c47]" /></div>
            ) : (
                <div className="bg-[#1a2d1c] border border-[#2d5c35] rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="border-b border-[#2d5c35]">
                            {["User", "Plan", "Amount", "Method", "Reference", "Status", "Date"].map((h) => (
                                <th key={h} className="text-left text-xs text-[#4a7a50] font-medium px-5 py-4">{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1a3d1f]">
                        {payments.map((p) => (
                            <tr key={p.id} className="hover:bg-[#1a3d1f]/30 transition-colors">
                                <td className="px-5 py-4">
                                    <p className="text-white font-medium">{p.userName}</p>
                                    <p className="text-xs text-[#4a7a50]">{p.userEmail}</p>
                                </td>
                                <td className="px-5 py-4">
                                    <span className="text-xs bg-[#1a3d1f] text-[#7dd68a] px-2 py-0.5 rounded-lg">{p.tierName}</span>
                                </td>
                                <td className="px-5 py-4 text-[#7dd68a] font-medium">MWK {fmt(p.amount)}</td>
                                <td className="px-5 py-4 text-[#4a7a50] capitalize">{p.method.replace("_", " ")}</td>
                                <td className="px-5 py-4 text-[#4a7a50] text-xs">{p.reference ?? "—"}</td>
                                <td className="px-5 py-4">
                                    <span className={`text-xs px-2 py-0.5 rounded-lg ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                                </td>
                                <td className="px-5 py-4 text-[#4a7a50] text-xs">{p.paidAt ? formatDate(p.paidAt) : "—"}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/50" onClick={() => setShowForm(false)} />
                    <div className="w-full max-w-md bg-[#1a2d1c] border-l border-[#2d5c35] h-full overflow-y-auto flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-[#2d5c35]">
                            <h2 className="text-base font-medium text-white">Log payment</h2>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-[#1a3d1f] rounded-lg text-[#4a7a50]"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="flex-1 p-6 flex flex-col gap-5">
                            <div>
                                <label className="text-xs text-[#4a7a50] mb-1.5 block">User / Subscription</label>
                                <select value={form.subscriptionId} onChange={(e) => set("subscriptionId", e.target.value)} required
                                        className="w-full h-12 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white">
                                    <option value="">Select user...</option>
                                    {subscriptions.map((s) => <option key={s.id} value={s.id}>{s.userName} — {s.tierName}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-[#4a7a50] mb-1.5 block">Amount (MWK)</label>
                                    <input type="number" step="1" min="0" value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder="0" required
                                           className="w-full h-12 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white" />
                                </div>
                                <div>
                                    <label className="text-xs text-[#4a7a50] mb-1.5 block">Payment method</label>
                                    <select value={form.method} onChange={(e) => set("method", e.target.value)}
                                            className="w-full h-12 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white capitalize">
                                        {METHODS.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-[#4a7a50] mb-1.5 block">Reference / Receipt no.</label>
                                <input value={form.reference} onChange={(e) => set("reference", e.target.value)} placeholder="e.g. MPesa TX123456"
                                       className="w-full h-12 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white placeholder-[#2d5c35]" />
                            </div>

                            <div>
                                <label className="text-xs text-[#4a7a50] mb-1.5 block">Payment date</label>
                                <input type="date" value={form.paidAt} onChange={(e) => set("paidAt", e.target.value)} required
                                       className="w-full h-12 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white" />
                            </div>

                            <div>
                                <label className="text-xs text-[#4a7a50] mb-1.5 block">Notes (optional)</label>
                                <input value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Any notes..."
                                       className="w-full h-12 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white placeholder-[#2d5c35]" />
                            </div>

                            <p className="text-xs text-[#4a7a50] bg-[#111d13] px-4 py-3 rounded-xl">
                                Logging a payment will automatically extend the subscription by one billing cycle.
                            </p>

                            {error && <p className="text-sm text-red-400 bg-red-900/20 px-4 py-3 rounded-xl">{error}</p>}

                            <div className="flex gap-3 mt-auto pt-4">
                                <button type="button" onClick={() => setShowForm(false)}
                                        className="flex-1 h-12 border border-[#2d5c35] text-[#4a7a50] text-sm font-medium rounded-xl hover:bg-[#1a3d1f] transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                        className="flex-1 h-12 bg-[#1a3d1f] text-white text-sm font-medium rounded-xl hover:bg-[#2d5c35] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                    {saving ? <><Loader2 size={15} className="animate-spin" /> Logging...</> : <><Check size={15} /> Log payment</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
"use client";

import { useEffect, useState } from "react";
import { Loader2, X, Check, Pencil, RefreshCw } from "lucide-react";

function fmt(n: number) {
    return new Intl.NumberFormat("en-MW").format(Math.round(n));
}
function fmtDate(d: string | null | undefined) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function daysLeft(d: string | null | undefined): { label: string; color: string } {
    if (!d) return { label: "No expiry", color: "#94A3B8" };
    const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
    if (diff < 0)   return { label: `Expired ${Math.abs(diff)}d ago`, color: "#DC2626" };
    if (diff === 0) return { label: "Expires today",                   color: "#D97706" };
    if (diff <= 7)  return { label: `${diff}d left`,                   color: "#D97706" };
    if (diff <= 30) return { label: `${diff}d left`,                   color: "#2563EB" };
    return               { label: `${diff}d left`,                     color: "#16A34A" };
}

const STATUS_CFG: Record<string, { bg: string; color: string }> = {
    active:    { bg: "#ECFDF5", color: "#059669" },
    trial:     { bg: "#EFF6FF", color: "#2563EB" },
    suspended: { bg: "#FFF7ED", color: "#D97706" },
    expired:   { bg: "#FEF2F2", color: "#DC2626" },
};

type SubForm = {
    tierId: string;
    status: string;
    billingCycle: string;
    endDate: string;
    notes: string;
};

export default function AdminSubscriptionsPage() {
    const [subs,         setSubs]         = useState<any[]>([]);
    const [tiers,        setTiers]        = useState<any[]>([]);
    const [loading,      setLoading]      = useState(true);
    const [search,       setSearch]       = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [editingSub,   setEditingSub]   = useState<any>(null);
    const [editForm,     setEditForm]     = useState<SubForm>({ tierId: "", status: "active", billingCycle: "monthly", endDate: "", notes: "" });
    const [saving,       setSaving]       = useState(false);
    const [saveError,    setSaveError]    = useState("");

    const load = () => {
        setLoading(true);
        Promise.all([
            fetch("/api/admin/subscriptions").then(async (r) => {
                const t = await r.text();
                if (!t) return [];
                try { return JSON.parse(t); } catch { return []; }
            }),
            fetch("/api/admin/tiers").then(async (r) => {
                const t = await r.text();
                if (!t) return [];
                try { return JSON.parse(t); } catch { return []; }
            }),
        ]).then(([s, t]) => {
            setSubs(Array.isArray(s) ? s : []);
            setTiers(Array.isArray(t) ? t : []);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    // Auto-expire past-endDate subscriptions
    useEffect(() => {
        const toExpire = subs.filter((s) =>
            s.status !== "expired" && s.endDate && new Date(s.endDate) < new Date()
        );
        if (toExpire.length === 0) return;
        Promise.all(
            toExpire.map((s) =>
                fetch(`/api/admin/subscriptions/${s.id}`, {
                    method:  "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body:    JSON.stringify({ status: "expired" }),
                })
            )
        ).then(load);
    }, [subs.length]);

    const filtered = subs.filter((s) => {
        const q = search.toLowerCase();
        const matchSearch = !q || s.userName?.toLowerCase().includes(q) || s.userEmail?.toLowerCase().includes(q) || s.tierName?.toLowerCase().includes(q);
        const matchStatus = statusFilter === "All" || s.status === statusFilter.toLowerCase();
        return matchSearch && matchStatus;
    });

    const openEdit = (sub: any) => {
        setEditingSub(sub);
        setEditForm({
            tierId:       sub.tierId       ?? "",
            status:       sub.status       ?? "active",
            billingCycle: sub.billingCycle ?? "monthly",
            endDate:      sub.endDate ? new Date(sub.endDate).toISOString().split("T")[0] : "",
            notes:        sub.notes ?? "",
        });
        setSaveError("");
    };

    const setExpiry = (days: number) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        setEditForm((f) => ({ ...f, endDate: d.toISOString().split("T")[0] }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSaveError("");
        try {
            const res = await fetch(`/api/admin/subscriptions/${editingSub.id}`, {
                method:  "PATCH",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                    tierId:       editForm.tierId       || undefined,
                    status:       editForm.status,
                    billingCycle: editForm.billingCycle,
                    endDate:      editForm.endDate || null,
                    notes:        editForm.notes   || null,
                }),
            });
            const text = await res.text();
            const d    = text ? JSON.parse(text) : {};
            if (!res.ok) { setSaveError(d.error ?? "Failed"); setSaving(false); return; }
            setEditingSub(null);
            load();
        } catch (err: any) {
            setSaveError(err.message);
            setSaving(false);
        }
    };

    const totalActive    = subs.filter((s) => s.status === "active").length;
    const totalTrial     = subs.filter((s) => s.status === "trial").length;
    const totalSuspended = subs.filter((s) => s.status === "suspended").length;
    const totalExpired   = subs.filter((s) => s.status === "expired").length;
    const expiringSoon   = subs.filter((s) => {
        if (!s.endDate) return false;
        const diff = Math.ceil((new Date(s.endDate).getTime() - Date.now()) / 86400000);
        return diff >= 0 && diff <= 7;
    }).length;

    return (
        <div className="p-8 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black" style={{ color: "#0F172A", letterSpacing: "-0.04em" }}>
                        Subscriptions
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>
                        {subs.length} total · {totalActive} active
                        {expiringSoon > 0 && ` · ${expiringSoon} expiring within 7 days`}
                    </p>
                </div>
                <button onClick={load}
                        className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-bold"
                        style={{ background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0" }}>
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-5 gap-4 mb-8">
                {[
                    { label: "Active",        value: totalActive,    color: "#059669" },
                    { label: "Trial",         value: totalTrial,     color: "#2563EB" },
                    { label: "Suspended",     value: totalSuspended, color: "#D97706" },
                    { label: "Expired",       value: totalExpired,   color: "#DC2626" },
                    { label: "Expiring (7d)", value: expiringSoon,   color: expiringSoon > 0 ? "#D97706" : "#94A3B8" },
                ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-2xl p-5"
                         style={{ background: "white", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "#94A3B8" }}>{label}</p>
                        <p className="text-3xl font-black" style={{ color }}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                       placeholder="Search user or plan..."
                       className="h-10 px-4 text-sm rounded-xl outline-none flex-1 min-w-[200px] max-w-sm"
                       style={{ border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#0F172A" }} />
                <div className="flex gap-2">
                    {["All", "Active", "Trial", "Suspended", "Expired"].map((s) => (
                        <button key={s} onClick={() => setStatusFilter(s)}
                                className="h-10 px-4 rounded-xl text-xs font-bold"
                                style={{
                                    background: statusFilter === s ? "#0F172A" : "white",
                                    color:      statusFilter === s ? "white"   : "#64748B",
                                    border:     "1px solid #E2E8F0",
                                }}>
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={24} className="animate-spin" style={{ color: "#0F766E" }} />
                </div>
            ) : (
                <div className="rounded-2xl overflow-hidden"
                     style={{ background: "white", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
                    <table className="w-full text-sm">
                        <thead>
                        <tr style={{ borderBottom: "1px solid #F1F5F9", background: "#F8FAFC" }}>
                            {["User", "Plan", "Billing", "Started", "Expires", "Status", ""].map((h) => (
                                <th key={h} className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest"
                                    style={{ color: "#94A3B8" }}>{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-5 py-12 text-center text-sm" style={{ color: "#94A3B8" }}>
                                    No subscriptions found
                                </td>
                            </tr>
                        ) : filtered.map((sub) => {
                            const cfg    = STATUS_CFG[sub.status] ?? STATUS_CFG.active;
                            const expiry = daysLeft(sub.endDate);
                            return (
                                <tr key={sub.id}
                                    style={{ borderBottom: "1px solid #F8FAFC" }}
                                    onMouseOver={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                                    onMouseOut={(e)  => (e.currentTarget.style.background = "transparent")}>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                                                 style={{ background: "#1E293B" }}>
                                                {(sub.userName || sub.userEmail || "?").slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-xs" style={{ color: "#0F172A" }}>{sub.userName || "—"}</p>
                                                <p className="text-[10px]" style={{ color: "#94A3B8" }}>{sub.userEmail}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="font-bold text-xs" style={{ color: "#0F172A" }}>{sub.tierName ?? "—"}</p>
                                        <p className="text-[10px]" style={{ color: "#94A3B8" }}>
                                            {sub.tierPrice > 0 ? `MWK ${fmt(sub.tierPrice)}/mo` : "Free"}
                                        </p>
                                    </td>
                                    <td className="px-5 py-4 text-xs capitalize" style={{ color: "#475569" }}>
                                        {sub.billingCycle ?? "monthly"}
                                    </td>
                                    <td className="px-5 py-4 text-xs" style={{ color: "#94A3B8" }}>
                                        {fmtDate(sub.startDate)}
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="text-xs font-semibold" style={{ color: expiry.color }}>{expiry.label}</p>
                                        {sub.endDate && (
                                            <p className="text-[10px]" style={{ color: "#94A3B8" }}>{fmtDate(sub.endDate)}</p>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                            <span className="text-[10px] font-black px-2.5 py-1 rounded-full"
                                                  style={{ background: cfg.bg, color: cfg.color }}>
                                                {sub.status}
                                            </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <button onClick={() => openEdit(sub)}
                                                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl"
                                                style={{ background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0" }}>
                                            <Pencil size={11} /> Edit
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                    <div className="px-5 py-3" style={{ borderTop: "1px solid #F1F5F9", background: "#F8FAFC" }}>
                        <p className="text-xs" style={{ color: "#94A3B8" }}>
                            Showing {filtered.length} of {subs.length} subscriptions
                        </p>
                    </div>
                </div>
            )}

            {/* Edit modal */}
            {editingSub && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setEditingSub(null)} />
                    <div className="relative rounded-2xl p-6 w-full max-w-md shadow-2xl z-10"
                         style={{ background: "white", border: "1px solid #E2E8F0" }}>
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-base font-black" style={{ color: "#0F172A" }}>Edit subscription</h2>
                            <button onClick={() => setEditingSub(null)}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                                    style={{ background: "#F1F5F9", color: "#64748B" }}>
                                <X size={15} />
                            </button>
                        </div>
                        <p className="text-sm mb-5" style={{ color: "#94A3B8" }}>
                            {editingSub.userName || editingSub.userEmail}
                        </p>
                        <form onSubmit={handleSave} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: "#94A3B8" }}>Plan</label>
                                <select value={editForm.tierId} onChange={(e) => setEditForm((f) => ({ ...f, tierId: e.target.value }))}
                                        className="w-full h-11 px-3 rounded-xl text-sm outline-none"
                                        style={{ border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#0F172A" }}>
                                    <option value="">Select tier...</option>
                                    {tiers.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} — {t.priceMonthly === 0 ? "Free" : `MWK ${fmt(t.priceMonthly)}/mo`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: "#94A3B8" }}>Status</label>
                                <select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                                        className="w-full h-11 px-3 rounded-xl text-sm outline-none"
                                        style={{ border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#0F172A" }}>
                                    <option value="active">Active</option>
                                    <option value="trial">Trial</option>
                                    <option value="suspended">Suspended</option>
                                    <option value="expired">Expired</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: "#94A3B8" }}>Billing cycle</label>
                                <select value={editForm.billingCycle} onChange={(e) => setEditForm((f) => ({ ...f, billingCycle: e.target.value }))}
                                        className="w-full h-11 px-3 rounded-xl text-sm outline-none"
                                        style={{ border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#0F172A" }}>
                                    <option value="monthly">Monthly</option>
                                    <option value="annual">Annual</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: "#94A3B8" }}>
                                    Expiry date <span className="font-normal normal-case" style={{ color: "#CBD5E1" }}>(blank = no expiry)</span>
                                </label>
                                <input type="date" value={editForm.endDate}
                                       onChange={(e) => setEditForm((f) => ({ ...f, endDate: e.target.value }))}
                                       className="w-full h-11 px-3 rounded-xl text-sm outline-none"
                                       style={{ border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#0F172A" }} />
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    {[{ label: "+7d", days: 7 }, { label: "+1mo", days: 30 }, { label: "+3mo", days: 90 }, { label: "+6mo", days: 180 }, { label: "+1yr", days: 365 }].map(({ label, days }) => (
                                        <button key={label} type="button" onClick={() => setExpiry(days)}
                                                className="text-[10px] font-bold px-2.5 py-1 rounded-lg"
                                                style={{ background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0" }}>
                                            {label}
                                        </button>
                                    ))}
                                    <button type="button" onClick={() => setEditForm((f) => ({ ...f, endDate: "" }))}
                                            className="text-[10px] font-bold px-2.5 py-1 rounded-lg"
                                            style={{ background: "#FFF1F2", color: "#E11D48", border: "1px solid #FFE4E6" }}>
                                        Clear
                                    </button>
                                </div>
                                {editForm.endDate && (
                                    <p className="text-xs mt-1.5 font-semibold" style={{ color: daysLeft(editForm.endDate).color }}>
                                        {daysLeft(editForm.endDate).label} · expires {fmtDate(editForm.endDate)}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: "#94A3B8" }}>Internal notes</label>
                                <textarea value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                                          rows={2} placeholder="e.g. Paid via Airtel Money on 01 Jun 2025"
                                          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                                          style={{ border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#0F172A" }} />
                            </div>
                            {saveError && (
                                <p className="text-sm px-3 py-2 rounded-xl" style={{ background: "#FFF1F2", color: "#E11D48" }}>
                                    {saveError}
                                </p>
                            )}
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={() => setEditingSub(null)}
                                        className="flex-1 h-11 rounded-xl text-sm font-bold"
                                        style={{ border: "1.5px solid #E2E8F0", color: "#64748B" }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                        className="flex-1 h-11 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                                        style={{ background: saving ? "#94A3B8" : "#0F766E" }}>
                                    {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Check size={14} /> Save changes</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
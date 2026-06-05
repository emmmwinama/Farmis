"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Trash2, X, Check, Plus, Users, ShieldCheck, ShieldOff } from "lucide-react";

function fmt(n: number) { return new Intl.NumberFormat("en-MW").format(Math.round(n)); }
function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_COLORS: Record<string, string> = {
    active:    "bg-emerald-50 text-emerald-700 border-emerald-200",
    trial:     "bg-blue-50 text-blue-700 border-blue-200",
    suspended: "bg-amber-50 text-amber-700 border-amber-200",
    expired:   "bg-red-50 text-red-700 border-red-200",
};

export default function AdminUsersPage() {
    const [users,         setUsers]         = useState<any[]>([]);
    const [tiers,         setTiers]         = useState<any[]>([]);
    const [loading,       setLoading]       = useState(true);
    const [search,        setSearch]        = useState("");
    const [statusFilter,  setStatusFilter]  = useState("All");
    const [deletingId,    setDeletingId]    = useState<string | null>(null);

    // Edit user modal
    const [editingUser,   setEditingUser]   = useState<any>(null);
    const [editForm,      setEditForm]      = useState({ name: "", email: "", role: "", isActive: true });
    const [editSaving,    setEditSaving]    = useState(false);
    const [editError,     setEditError]     = useState("");

    // Assign plan modal
    const [assigningUser, setAssigningUser] = useState<any>(null);
    const [assignForm,    setAssignForm]    = useState({ tierId: "", billingCycle: "monthly", status: "active" });
    const [assigning,     setAssigning]     = useState(false);
    const [assignError,   setAssignError]   = useState("");

    const load = () => {
        setLoading(true);
        Promise.all([
            fetch("/api/admin/users").then(async (r) => {
                const text = await r.text();
                if (!text) return [];
                try { return JSON.parse(text); } catch { return []; }
            }),
            fetch("/api/admin/tiers").then(async (r) => {
                const text = await r.text();
                if (!text) return [];
                try { return JSON.parse(text); } catch { return []; }
            }),
        ]).then(([u, t]) => {
            setUsers(Array.isArray(u) ? u : []);
            setTiers(Array.isArray(t) ? t : []);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    // ── Filtering ──────────────────────────────────────────────────────────────
    const filtered = users.filter((u) => {
        const q = search.toLowerCase();
        const matchSearch =
            !q ||
            u.name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.farms?.some((f: any) => f.name?.toLowerCase().includes(q));
        const matchStatus =
            statusFilter === "All" ||
            (statusFilter === "Active"   && u.isActive) ||
            (statusFilter === "Inactive" && !u.isActive) ||
            (statusFilter === "No plan"  && !u.subscription);
        return matchSearch && matchStatus;
    });

    // ── Edit user ──────────────────────────────────────────────────────────────
    const openEdit = (u: any) => {
        setEditingUser(u);
        setEditForm({ name: u.name ?? "", email: u.email, role: u.role, isActive: u.isActive });
        setEditError("");
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        setEditSaving(true);
        setEditError("");
        try {
            const res  = await fetch(`/api/admin/users/${editingUser.id}`, {
                method:  "PATCH",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify(editForm),
            });
            const text = await res.text();
            const d    = text ? JSON.parse(text) : {};
            if (!res.ok) { setEditError(d.error ?? "Failed to save"); setEditSaving(false); return; }
            setEditingUser(null);
            load();
        } catch (err: any) {
            setEditError(err.message);
        } finally {
            setEditSaving(false);
        }
    };

    // ── Delete user ────────────────────────────────────────────────────────────
    const handleDelete = async (id: string) => {
        if (!confirm("Permanently delete this user and all their farm data? This cannot be undone.")) return;
        setDeletingId(id);
        await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
        setDeletingId(null);
        load();
    };

    // ── Toggle active ──────────────────────────────────────────────────────────
    const toggleActive = async (u: any) => {
        await fetch(`/api/admin/users/${u.id}`, {
            method:  "PATCH",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ isActive: !u.isActive }),
        });
        load();
    };

    // ── Assign plan ────────────────────────────────────────────────────────────
    const openAssign = (u: any) => {
        setAssigningUser(u);
        setAssignForm({
            tierId:       u.subscription?.tier?.id ?? tiers[0]?.id ?? "",
            billingCycle: u.subscription?.billingCycle ?? "monthly",
            status:       u.subscription?.status ?? "active",
        });
        setAssignError("");
    };

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        setAssigning(true);
        setAssignError("");
        try {
            const res  = await fetch("/api/admin/subscriptions", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                    userId:       assigningUser.id,
                    tierId:       assignForm.tierId,
                    billingCycle: assignForm.billingCycle,
                    status:       assignForm.status,
                }),
            });
            const text = await res.text();
            const d    = text ? JSON.parse(text) : {};
            if (!res.ok) { setAssignError(d.error ?? "Failed to assign"); setAssigning(false); return; }
            setAssigningUser(null);
            load();
        } catch (err: any) {
            setAssignError(err.message);
        } finally {
            setAssigning(false);
        }
    };

    // ── Summary stats ──────────────────────────────────────────────────────────
    const totalUsers    = users.length;
    const activeUsers   = users.filter((u) => u.isActive).length;
    const onPaidPlan    = users.filter((u) => u.subscription?.tier?.priceMonthly > 0).length;
    const noplan        = users.filter((u) => !u.subscription).length;

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="p-8 max-w-7xl mx-auto">

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-black" style={{ color: "#0F172A", letterSpacing: "-0.04em" }}>
                    Users
                </h1>
                <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>
                    {totalUsers} total · {activeUsers} active · {onPaidPlan} on paid plan · {noplan} without plan
                </p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Total users",    value: totalUsers,  color: "#0F766E" },
                    { label: "Active",         value: activeUsers, color: "#16A34A" },
                    { label: "On paid plan",   value: onPaidPlan,  color: "#2563EB" },
                    { label: "No plan",        value: noplan,      color: "#DC2626" },
                ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-2xl p-5"
                         style={{ background: "white", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "#94A3B8" }}>
                            {label}
                        </p>
                        <p className="text-3xl font-black" style={{ color }}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, email or farm..."
                    className="h-10 px-4 text-sm rounded-xl outline-none flex-1 min-w-[200px] max-w-sm"
                    style={{ border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#0F172A" }}
                />
                <div className="flex gap-2">
                    {["All", "Active", "Inactive", "No plan"].map((s) => (
                        <button key={s} onClick={() => setStatusFilter(s)}
                                className="h-10 px-4 rounded-xl text-xs font-bold transition-all"
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
                            {["User", "Farms", "Plan", "Joined", "Status", "Actions"].map((h) => (
                                <th key={h} className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest"
                                    style={{ color: "#94A3B8" }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: "#94A3B8" }}>
                                    No users found
                                </td>
                            </tr>
                        ) : filtered.map((u) => (
                            <tr key={u.id}
                                className="transition-colors"
                                style={{ borderBottom: "1px solid #F8FAFC" }}
                                onMouseOver={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                                onMouseOut={(e)  => (e.currentTarget.style.background = "transparent")}>

                                {/* User */}
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                                             style={{ background: u.isActive ? "#0F766E" : "#94A3B8" }}>
                                            {(u.name || u.email).slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold" style={{ color: "#0F172A" }}>
                                                {u.name || "—"}
                                            </p>
                                            <p className="text-xs" style={{ color: "#94A3B8" }}>{u.email}</p>
                                        </div>
                                    </div>
                                </td>

                                {/* Farms */}
                                <td className="px-5 py-4">
                                    <p className="font-semibold" style={{ color: "#0F172A" }}>
                                        {u.farmCount ?? u.farms?.length ?? 0}
                                    </p>
                                    {u.farms?.[0] && (
                                        <p className="text-xs" style={{ color: "#94A3B8" }}>{u.farms[0].name}</p>
                                    )}
                                </td>

                                {/* Plan */}
                                <td className="px-5 py-4">
                                    {u.subscription ? (
                                        <div>
                                            <p className="font-bold text-xs" style={{ color: "#0F172A" }}>
                                                {u.subscription.tier?.name ?? "Unknown tier"}
                                            </p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block mt-0.5 ${STATUS_COLORS[u.subscription.status] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>
                                                    {u.subscription.status}
                                                </span>
                                        </div>
                                    ) : (
                                        <span className="text-xs font-bold px-2 py-1 rounded-full"
                                              style={{ background: "#FEF2F2", color: "#DC2626" }}>
                                                No plan
                                            </span>
                                    )}
                                </td>

                                {/* Joined */}
                                <td className="px-5 py-4 text-xs" style={{ color: "#94A3B8" }}>
                                    {fmtDate(u.createdAt)}
                                </td>

                                {/* Active status */}
                                <td className="px-5 py-4">
                                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                                            u.isActive
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-slate-100 text-slate-500"
                                        }`}>
                                            {u.isActive ? "Active" : "Inactive"}
                                        </span>
                                </td>

                                {/* Actions */}
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {/* Assign / Change plan */}
                                        <button
                                            onClick={() => openAssign(u)}
                                            className="text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                                            style={{
                                                background: "#EFF6FF",
                                                color:      "#2563EB",
                                                border:     "1px solid #BFDBFE",
                                            }}>
                                            {u.subscription ? "Change plan" : "Assign plan"}
                                        </button>

                                        {/* Edit */}
                                        <button
                                            onClick={() => openEdit(u)}
                                            className="p-1.5 rounded-lg transition-all"
                                            style={{ background: "#F1F5F9", color: "#475569" }}
                                            title="Edit user">
                                            <Pencil size={13} />
                                        </button>

                                        {/* Toggle active */}
                                        <button
                                            onClick={() => toggleActive(u)}
                                            className="p-1.5 rounded-lg transition-all"
                                            style={{
                                                background: u.isActive ? "#FFF7ED" : "#F0FDF4",
                                                color:      u.isActive ? "#EA580C" : "#16A34A",
                                            }}
                                            title={u.isActive ? "Deactivate" : "Activate"}>
                                            {u.isActive ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
                                        </button>

                                        {/* Delete */}
                                        <button
                                            onClick={() => handleDelete(u.id)}
                                            disabled={deletingId === u.id}
                                            className="p-1.5 rounded-lg transition-all"
                                            style={{ background: "#FFF1F2", color: "#E11D48" }}
                                            title="Delete user">
                                            {deletingId === u.id
                                                ? <Loader2 size={13} className="animate-spin" />
                                                : <Trash2 size={13} />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    {/* Table footer */}
                    <div className="px-5 py-3 flex items-center justify-between"
                         style={{ borderTop: "1px solid #F1F5F9", background: "#F8FAFC" }}>
                        <p className="text-xs" style={{ color: "#94A3B8" }}>
                            Showing {filtered.length} of {totalUsers} users
                        </p>
                    </div>
                </div>
            )}

            {/* ── Edit user modal ─────────────────────────────────────────────── */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                         onClick={() => setEditingUser(null)} />
                    <div className="relative rounded-2xl p-6 w-full max-w-md shadow-2xl z-10"
                         style={{ background: "white", border: "1px solid #E2E8F0" }}>

                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-base font-black" style={{ color: "#0F172A" }}>Edit user</h2>
                            <button onClick={() => setEditingUser(null)}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                                    style={{ background: "#F1F5F9", color: "#64748B" }}>
                                <X size={15} />
                            </button>
                        </div>

                        <form onSubmit={handleEdit} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                       style={{ color: "#94A3B8" }}>Full name</label>
                                <input
                                    value={editForm.name}
                                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                                    placeholder="Full name"
                                    className="w-full h-11 px-3 rounded-xl text-sm outline-none"
                                    style={{ border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#0F172A" }}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                       style={{ color: "#94A3B8" }}>Email</label>
                                <input
                                    value={editForm.email}
                                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                                    required
                                    className="w-full h-11 px-3 rounded-xl text-sm outline-none"
                                    style={{ border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#0F172A" }}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                       style={{ color: "#94A3B8" }}>Role</label>
                                <select
                                    value={editForm.role}
                                    onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                                    className="w-full h-11 px-3 rounded-xl text-sm outline-none"
                                    style={{ border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#0F172A" }}>
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between p-3.5 rounded-xl"
                                 style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                                <div>
                                    <p className="text-sm font-bold" style={{ color: "#0F172A" }}>Active account</p>
                                    <p className="text-xs" style={{ color: "#94A3B8" }}>Inactive users cannot log in</p>
                                </div>
                                <button type="button"
                                        onClick={() => setEditForm((f) => ({ ...f, isActive: !f.isActive }))}
                                        className="w-11 h-6 rounded-full relative transition-colors flex-shrink-0"
                                        style={{ background: editForm.isActive ? "#0F766E" : "#CBD5E1" }}>
                                    <div className="w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all"
                                         style={{ left: editForm.isActive ? "calc(100% - 20px)" : "4px" }} />
                                </button>
                            </div>

                            {editError && (
                                <p className="text-sm px-3 py-2 rounded-xl"
                                   style={{ background: "#FFF1F2", color: "#E11D48" }}>
                                    {editError}
                                </p>
                            )}

                            <div className="flex gap-3">
                                <button type="button" onClick={() => setEditingUser(null)}
                                        className="flex-1 h-11 rounded-xl text-sm font-bold"
                                        style={{ border: "1.5px solid #E2E8F0", color: "#64748B" }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={editSaving}
                                        className="flex-1 h-11 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                                        style={{ background: editSaving ? "#94A3B8" : "#0F766E" }}>
                                    {editSaving
                                        ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
                                        : <><Check size={14} /> Save changes</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Assign plan modal ───────────────────────────────────────────── */}
            {assigningUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                         onClick={() => setAssigningUser(null)} />
                    <div className="relative rounded-2xl p-6 w-full max-w-md shadow-2xl z-10"
                         style={{ background: "white", border: "1px solid #E2E8F0" }}>

                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-base font-black" style={{ color: "#0F172A" }}>
                                {assigningUser.subscription ? "Change plan" : "Assign plan"}
                            </h2>
                            <button onClick={() => setAssigningUser(null)}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                                    style={{ background: "#F1F5F9", color: "#64748B" }}>
                                <X size={15} />
                            </button>
                        </div>
                        <p className="text-sm mb-5" style={{ color: "#94A3B8" }}>
                            {assigningUser.name || assigningUser.email}
                        </p>

                        <form onSubmit={handleAssign} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                       style={{ color: "#94A3B8" }}>Subscription tier</label>
                                <select
                                    value={assignForm.tierId}
                                    onChange={(e) => setAssignForm((f) => ({ ...f, tierId: e.target.value }))}
                                    required
                                    className="w-full h-11 px-3 rounded-xl text-sm outline-none"
                                    style={{ border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#0F172A" }}>
                                    <option value="">Select tier...</option>
                                    {tiers.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} — {t.priceMonthly === 0 ? "Free" : `MWK ${new Intl.NumberFormat("en-MW").format(t.priceMonthly)}/mo`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                       style={{ color: "#94A3B8" }}>Billing cycle</label>
                                <select
                                    value={assignForm.billingCycle}
                                    onChange={(e) => setAssignForm((f) => ({ ...f, billingCycle: e.target.value }))}
                                    className="w-full h-11 px-3 rounded-xl text-sm outline-none"
                                    style={{ border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#0F172A" }}>
                                    <option value="monthly">Monthly</option>
                                    <option value="annual">Annual</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                       style={{ color: "#94A3B8" }}>Status</label>
                                <select
                                    value={assignForm.status}
                                    onChange={(e) => setAssignForm((f) => ({ ...f, status: e.target.value }))}
                                    className="w-full h-11 px-3 rounded-xl text-sm outline-none"
                                    style={{ border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#0F172A" }}>
                                    <option value="active">Active</option>
                                    <option value="trial">Trial</option>
                                    <option value="suspended">Suspended</option>
                                    <option value="expired">Expired</option>
                                </select>
                            </div>

                            {assignError && (
                                <p className="text-sm px-3 py-2 rounded-xl"
                                   style={{ background: "#FFF1F2", color: "#E11D48" }}>
                                    {assignError}
                                </p>
                            )}

                            <div className="flex gap-3">
                                <button type="button" onClick={() => setAssigningUser(null)}
                                        className="flex-1 h-11 rounded-xl text-sm font-bold"
                                        style={{ border: "1.5px solid #E2E8F0", color: "#64748B" }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={assigning || !assignForm.tierId}
                                        className="flex-1 h-11 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                                        style={{ background: assigning || !assignForm.tierId ? "#94A3B8" : "#0F766E" }}>
                                    {assigning
                                        ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
                                        : <><Check size={14} /> {assigningUser.subscription ? "Update plan" : "Assign plan"}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
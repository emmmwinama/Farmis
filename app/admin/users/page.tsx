"use client";

import { useEffect, useState } from "react";
import { Plus, Copy, Check, Pencil, Trash2, Loader2, X, RefreshCw } from "lucide-react";

function fmt(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_COLORS: Record<string, string> = {
    active: "bg-green-900/30 text-green-400",
    expired: "bg-red-900/30 text-red-400",
    suspended: "bg-orange-900/30 text-orange-400",
    trial: "bg-blue-900/30 text-blue-400",
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [tiers, setTiers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [copiedLink, setCopiedLink] = useState<string | null>(null);
    const [activationLink, setActivationLink] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: "", email: "", tierId: "", billingCycle: "monthly", endDate: "",
    });

    const load = () => {
        setLoading(true);
        Promise.all([
            fetch("/api/admin/users").then((r) => r.json()),
            fetch("/api/admin/tiers").then((r) => r.json()),
        ]).then(([u, t]) => { setUsers(u); setTiers(t); setLoading(false); });
    };

    useEffect(() => { load(); }, []);

    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true); setError("");
        const res = await fetch("/api/admin/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); setSaving(false); }
        else {
            setActivationLink(data.activationLink);
            setSaving(false);
            load();
        }
    };

    const handleUpdate = async (userId: string, updates: any) => {
        await fetch(`/api/admin/users/${userId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
        });
        load();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Permanently delete this user and all their data?")) return;
        setDeletingId(id);
        await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
        setDeletingId(null); load();
    };

    const generateActivationLink = async (userId: string) => {
        const res = await fetch(`/api/admin/users/${userId}/activation`, { method: "POST" });
        const data = await res.json();
        setActivationLink(data.activationLink);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedLink(text);
        setTimeout(() => setCopiedLink(null), 2000);
    };

    const filtered = users.filter((u) =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-medium text-white">Users</h1>
                    <p className="text-[#4a7a50] text-sm mt-1">{users.length} total users</p>
                </div>
                <button onClick={() => { setShowForm(true); setActivationLink(null); setError(""); setForm({ name: "", email: "", tierId: tiers[0]?.id ?? "", billingCycle: "monthly", endDate: "" }); }}
                        className="flex items-center gap-2 h-10 px-4 bg-[#1a3d1f] text-white text-sm font-medium rounded-xl hover:bg-[#2d5c35] transition-colors">
                    <Plus size={16} /> Create user
                </button>
            </div>

            {activationLink && (
                <div className="bg-[#1a3d1f] border border-[#3d8c47] rounded-2xl p-5 mb-6">
                    <p className="text-sm font-medium text-white mb-2">Activation link generated</p>
                    <p className="text-xs text-[#7dd68a] mb-3">Share this link with the user to activate their account:</p>
                    <div className="flex items-center gap-3 bg-[#111d13] rounded-xl px-4 py-3">
                        <code className="text-xs text-[#7dd68a] flex-1 truncate">{activationLink}</code>
                        <button onClick={() => copyToClipboard(activationLink)}
                                className="flex-shrink-0 p-1.5 hover:bg-[#1a3d1f] rounded-lg transition-colors">
                            {copiedLink === activationLink ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-[#4a7a50]" />}
                        </button>
                    </div>
                </div>
            )}

            <div className="mb-6">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..."
                       className="h-10 px-4 text-sm bg-[#1a2d1c] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white placeholder-[#4a7a50] w-72" />
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[#3d8c47]" /></div>
            ) : (
                <div className="bg-[#1a2d1c] border border-[#2d5c35] rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="border-b border-[#2d5c35]">
                            {["User", "Plan", "Status", "Expires", "Last payment", "Actions"].map((h) => (
                                <th key={h} className="text-left text-xs text-[#4a7a50] font-medium px-5 py-4">{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1a3d1f]">
                        {filtered.map((user) => (
                            <tr key={user.id} className="hover:bg-[#1a3d1f]/30 transition-colors">
                                <td className="px-5 py-4">
                                    <p className="text-white font-medium">{user.name}</p>
                                    <p className="text-xs text-[#4a7a50]">{user.email}</p>
                                    {!user.isActive && <span className="text-xs text-orange-400">Not activated</span>}
                                </td>
                                <td className="px-5 py-4">
                                    <select
                                        value={user.subscription?.tierId ?? ""}
                                        onChange={(e) => handleUpdate(user.id, { tierId: e.target.value })}
                                        className="h-7 px-2 text-xs bg-[#111d13] border border-[#2d5c35] rounded-lg text-white outline-none"
                                    >
                                        <option value="">No plan</option>
                                        {tiers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </td>
                                <td className="px-5 py-4">
                                    <select
                                        value={user.subscription?.status ?? ""}
                                        onChange={(e) => handleUpdate(user.id, { subscriptionStatus: e.target.value })}
                                        className={`h-7 px-2 text-xs border rounded-lg outline-none ${STATUS_COLORS[user.subscription?.status ?? ""] ?? "bg-[#111d13] border-[#2d5c35] text-white"} bg-transparent border-transparent`}
                                    >
                                        {["active", "expired", "suspended", "trial"].map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </td>
                                <td className="px-5 py-4 text-[#4a7a50] text-xs">
                                    {user.subscription?.endDate ? fmt(user.subscription.endDate) : "—"}
                                </td>
                                <td className="px-5 py-4 text-[#4a7a50] text-xs">
                                    {user.subscription?.lastPayment
                                        ? `MWK ${new Intl.NumberFormat("en-MW").format(user.subscription.lastPayment.amount)}`
                                        : "—"}
                                </td>
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-1.5">
                                        <button onClick={() => generateActivationLink(user.id)} title="Generate activation link"
                                                className="p-1.5 hover:bg-[#1a3d1f] rounded-lg text-[#4a7a50] hover:text-[#7dd68a] transition-colors">
                                            <RefreshCw size={13} />
                                        </button>
                                        <button
                                            onClick={() => handleUpdate(user.id, { isActive: !user.isActive })}
                                            title={user.isActive ? "Deactivate" : "Activate"}
                                            className="p-1.5 hover:bg-[#1a3d1f] rounded-lg text-[#4a7a50] hover:text-white transition-colors text-xs font-medium"
                                        >
                                            {user.isActive ? "🟢" : "🔴"}
                                        </button>
                                        <button onClick={() => handleDelete(user.id)} disabled={deletingId === user.id}
                                                className="p-1.5 hover:bg-red-900/30 rounded-lg text-[#4a7a50] hover:text-red-400 transition-colors">
                                            {deletingId === user.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                        </button>
                                    </div>
                                </td>
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
                            <h2 className="text-base font-medium text-white">Create user</h2>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-[#1a3d1f] rounded-lg text-[#4a7a50] transition-colors"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreate} className="flex-1 p-6 flex flex-col gap-5">
                            {[
                                { key: "name", label: "Full name", placeholder: "John Banda" },
                                { key: "email", label: "Email address", placeholder: "john@farm.com", type: "email" },
                            ].map(({ key, label, placeholder, type }) => (
                                <div key={key}>
                                    <label className="text-xs text-[#4a7a50] mb-1.5 block">{label}</label>
                                    <input type={type ?? "text"} value={form[key as keyof typeof form]} onChange={(e) => set(key, e.target.value)}
                                           placeholder={placeholder} required
                                           className="w-full h-12 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white placeholder-[#2d5c35]" />
                                </div>
                            ))}

                            <div>
                                <label className="text-xs text-[#4a7a50] mb-1.5 block">Subscription tier</label>
                                <select value={form.tierId} onChange={(e) => set("tierId", e.target.value)}
                                        className="w-full h-12 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white">
                                    <option value="">No subscription</option>
                                    {tiers.map((t) => <option key={t.id} value={t.id}>{t.name} — MWK {new Intl.NumberFormat("en-MW").format(t.priceMonthly)}/mo</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-[#4a7a50] mb-1.5 block">Billing cycle</label>
                                    <select value={form.billingCycle} onChange={(e) => set("billingCycle", e.target.value)}
                                            className="w-full h-12 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white">
                                        <option value="monthly">Monthly</option>
                                        <option value="annual">Annual</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-[#4a7a50] mb-1.5 block">Expiry date</label>
                                    <input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)}
                                           className="w-full h-12 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white" />
                                </div>
                            </div>

                            {error && <p className="text-sm text-red-400 bg-red-900/20 px-4 py-3 rounded-xl">{error}</p>}

                            <div className="flex gap-3 mt-auto pt-4">
                                <button type="button" onClick={() => setShowForm(false)}
                                        className="flex-1 h-12 border border-[#2d5c35] text-[#4a7a50] text-sm font-medium rounded-xl hover:bg-[#1a3d1f] transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                        className="flex-1 h-12 bg-[#1a3d1f] text-white text-sm font-medium rounded-xl hover:bg-[#2d5c35] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                    {saving ? <><Loader2 size={15} className="animate-spin" /> Creating...</> : "Create & get link"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
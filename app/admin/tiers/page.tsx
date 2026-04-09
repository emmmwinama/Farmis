"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, X, Check } from "lucide-react";

const FEATURES = [
    { key: "seasonAnalytics",       label: "Season analytics" },
    { key: "yieldSuggestions",      label: "Yield & price suggestions" },
    { key: "costPerHectare",        label: "Cost per hectare reports" },
    { key: "payrollTracking",       label: "Payroll tracking" },
    { key: "multipleFarms",         label: "Multiple farms" },
    { key: "teamAccounts",          label: "Team accounts" },
    { key: "customReports",         label: "Custom reports & exports" },
    { key: "apiAccess",             label: "API access" },
    { key: "dataRetentionLifetime", label: "Lifetime data retention" },
];

const LIMITS = [
    { key: "maxFields",      label: "Max fields" },
    { key: "maxCrops",       label: "Max crops" },
    { key: "maxActivities",  label: "Max activities" },
    { key: "maxTransactions",label: "Max transactions" },
    { key: "maxEmployees",   label: "Max employees" },
    { key: "maxFarms",       label: "Max farms" },
    { key: "maxTeamMembers", label: "Max team members" },
];

const emptyForm: any = {
    name: "", description: "", priceMonthly: 0, priceAnnual: null,
    isActive: true, isPublic: true, isFeatured: false, sortOrder: 1,
    maxFields: 1, maxCrops: 1, maxActivities: 10, maxTransactions: 5,
    maxEmployees: 1, maxFarms: 1, maxTeamMembers: 1,
    seasonAnalytics: false, yieldSuggestions: false, costPerHectare: false,
    payrollTracking: false, multipleFarms: false, teamAccounts: false,
    customReports: false, apiAccess: false, dataRetentionLifetime: true,
};

function fmt(n: number) {
    return new Intl.NumberFormat("en-MW").format(Math.round(n));
}

export default function AdminTiersPage() {
    const [tiers, setTiers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingTier, setEditingTier] = useState<any>(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        fetch("/api/admin/tiers")
            .then((r) => r.json())
            .then((t) => { setTiers(t); setLoading(false); });
    };

    useEffect(() => { load(); }, []);

    const openAdd = () => {
        setEditingTier(null);
        setForm({ ...emptyForm, sortOrder: tiers.length + 1 });
        setError("");
        setShowForm(true);
    };

    const openEdit = (tier: any) => {
        setEditingTier(tier);
        setForm({ ...tier });
        setError("");
        setShowForm(true);
    };

    const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        const url = editingTier
            ? `/api/admin/tiers/${editingTier.id}`
            : "/api/admin/tiers";
        const method = editingTier ? "PATCH" : "POST";

        const { id, createdAt, _count, subscriptions, ...cleanForm } = form;

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...cleanForm,
                priceMonthly: parseFloat(cleanForm.priceMonthly) || 0,
                priceAnnual: cleanForm.priceAnnual ? parseFloat(cleanForm.priceAnnual) : null,
                maxFields: parseInt(cleanForm.maxFields),
                maxCrops: parseInt(cleanForm.maxCrops),
                maxActivities: parseInt(cleanForm.maxActivities),
                maxTransactions: parseInt(cleanForm.maxTransactions),
                maxEmployees: parseInt(cleanForm.maxEmployees),
                maxFarms: parseInt(cleanForm.maxFarms),
                maxTeamMembers: parseInt(cleanForm.maxTeamMembers),
                sortOrder: parseInt(cleanForm.sortOrder) || 1,
            }),
        });

        const data = await res.json();
        if (!res.ok) {
            setError(data.error);
            setSaving(false);
        } else {
            setShowForm(false);
            load();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this tier?")) return;
        setDeletingId(id);
        const res = await fetch(`/api/admin/tiers/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) alert(data.error);
        setDeletingId(null);
        load();
    };

    const sorted = [...tiers].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-medium text-white">Subscription tiers</h1>
                    <p className="text-[#4a7a50] text-sm mt-1">{tiers.length} tiers configured</p>
                </div>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 h-10 px-4 bg-[#1a3d1f] text-white text-sm font-medium rounded-xl hover:bg-[#2d5c35] transition-colors"
                >
                    <Plus size={16} /> New tier
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={24} className="animate-spin text-[#3d8c47]" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {sorted.map((tier) => (
                        <div key={tier.id} className="bg-[#1a2d1c] border border-[#2d5c35] rounded-2xl p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-medium text-white text-base">{tier.name}</h3>
                                    <p className="text-xs text-[#4a7a50] mt-0.5">{tier.description}</p>
                                </div>
                                <div className="flex gap-1.5">
                                    <button
                                        onClick={() => openEdit(tier)}
                                        className="p-1.5 hover:bg-[#1a3d1f] rounded-lg text-[#4a7a50] hover:text-white transition-colors"
                                    >
                                        <Pencil size={13} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(tier.id)}
                                        disabled={deletingId === tier.id}
                                        className="p-1.5 hover:bg-red-900/30 rounded-lg text-[#4a7a50] hover:text-red-400 transition-colors"
                                    >
                                        {deletingId === tier.id
                                            ? <Loader2 size={13} className="animate-spin" />
                                            : <Trash2 size={13} />}
                                    </button>
                                </div>
                            </div>

                            <div className="mb-4">
                                <p className="text-2xl font-medium text-[#7dd68a]">
                                    {tier.priceMonthly === 0 ? "Free" : `MWK ${fmt(tier.priceMonthly)}`}
                                </p>
                                {tier.priceAnnual && (
                                    <p className="text-xs text-[#4a7a50]">MWK {fmt(tier.priceAnnual)} / year</p>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                <span className={`text-xs px-2 py-0.5 rounded-lg ${tier.isActive ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
                  {tier.isActive ? "Active" : "Inactive"}
                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-lg ${tier.isPublic ? "bg-blue-900/30 text-blue-400" : "bg-slate-800 text-slate-400"}`}>
                  {tier.isPublic ? "Public" : "Private"}
                </span>
                                {tier.isFeatured && (
                                    <span className="text-xs px-2 py-0.5 rounded-lg bg-amber-900/30 text-amber-400">
                    ⭐ Featured
                  </span>
                                )}
                                <span className="text-xs bg-[#111d13] text-[#4a7a50] px-2 py-0.5 rounded-lg">
                  #{tier.sortOrder ?? "—"}
                </span>
                                <span className="text-xs bg-[#1a3d1f] text-[#7dd68a] px-2 py-0.5 rounded-lg">
                  {tier._count?.subscriptions ?? 0} users
                </span>
                            </div>

                            <div className="border-t border-[#2d5c35] pt-4 mb-4">
                                <p className="text-xs text-[#4a7a50] font-medium mb-2 uppercase tracking-wide">Limits</p>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {LIMITS.map(({ key, label }) => (
                                        <div key={key} className="flex justify-between">
                                            <span className="text-xs text-[#4a7a50]">{label}</span>
                                            <span className="text-xs text-white font-medium">
                        {tier[key] === -1 ? "∞" : tier[key]}
                      </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-[#2d5c35] pt-4">
                                <p className="text-xs text-[#4a7a50] font-medium mb-2 uppercase tracking-wide">Features</p>
                                <div className="flex flex-col gap-1.5">
                                    {FEATURES.map(({ key, label }) => (
                                        <div key={key} className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-sm flex-shrink-0 ${tier[key] ? "bg-[#3d8c47]" : "bg-[#2d5c35]"}`} />
                                            <span className={`text-xs ${tier[key] ? "text-[#7dd68a]" : "text-[#2d5c35]"}`}>
                        {label}
                      </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/50" onClick={() => setShowForm(false)} />
                    <div className="w-full max-w-lg bg-[#1a2d1c] border-l border-[#2d5c35] h-full overflow-y-auto flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-[#2d5c35]">
                            <h2 className="text-base font-medium text-white">
                                {editingTier ? "Edit tier" : "New tier"}
                            </h2>
                            <button
                                onClick={() => setShowForm(false)}
                                className="p-2 hover:bg-[#1a3d1f] rounded-lg text-[#4a7a50]"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 p-6 flex flex-col gap-5">

                            <div>
                                <label className="text-xs text-[#4a7a50] mb-1.5 block">Tier name</label>
                                <input
                                    value={form.name}
                                    onChange={(e) => set("name", e.target.value)}
                                    placeholder="e.g. Professional"
                                    required
                                    className="w-full h-12 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-[#4a7a50] mb-1.5 block">Description</label>
                                <input
                                    value={form.description}
                                    onChange={(e) => set("description", e.target.value)}
                                    placeholder="Short description"
                                    className="w-full h-12 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-[#4a7a50] mb-1.5 block">Monthly price (MWK)</label>
                                    <input
                                        type="number" step="1" min="0"
                                        value={form.priceMonthly}
                                        onChange={(e) => set("priceMonthly", e.target.value)}
                                        className="w-full h-12 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-[#4a7a50] mb-1.5 block">Annual price (MWK)</label>
                                    <input
                                        type="number" step="1" min="0"
                                        value={form.priceAnnual ?? ""}
                                        onChange={(e) => set("priceAnnual", e.target.value)}
                                        placeholder="Optional"
                                        className="w-full h-12 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white placeholder-[#2d5c35]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-[#4a7a50] mb-1.5 block">Sort order</label>
                                    <input
                                        type="number" min="1"
                                        value={form.sortOrder ?? 1}
                                        onChange={(e) => set("sortOrder", e.target.value)}
                                        className="w-full h-12 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white"
                                    />
                                </div>
                                <div className="flex flex-col justify-center gap-3 pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <button
                                            type="button"
                                            onClick={() => set("isFeatured", !form.isFeatured)}
                                            className={`w-9 h-5 rounded-full transition-colors relative ${form.isFeatured ? "bg-amber-500" : "bg-[#2d5c35]"}`}
                                        >
                                            <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${form.isFeatured ? "translate-x-4" : "translate-x-0.5"}`} />
                                        </button>
                                        <span className="text-xs text-[#7dd68a]">Featured (most popular)</span>
                                    </label>
                                </div>
                            </div>

                            <div className="border-t border-[#2d5c35] pt-4">
                                <p className="text-xs text-[#4a7a50] font-medium mb-3 uppercase tracking-wide">
                                    Limits (-1 = unlimited)
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    {LIMITS.map(({ key, label }) => (
                                        <div key={key}>
                                            <label className="text-xs text-[#4a7a50] mb-1 block">{label}</label>
                                            <input
                                                type="number" min="-1"
                                                value={form[key]}
                                                onChange={(e) => set(key, e.target.value)}
                                                className="w-full h-10 px-3 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-[#2d5c35] pt-4">
                                <p className="text-xs text-[#4a7a50] font-medium mb-3 uppercase tracking-wide">Features</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {FEATURES.map(({ key, label }) => (
                                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                                            <button
                                                type="button"
                                                onClick={() => set(key, !form[key])}
                                                className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${form[key] ? "bg-[#3d8c47]" : "bg-[#2d5c35]"}`}
                                            >
                                                <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${form[key] ? "translate-x-4" : "translate-x-0.5"}`} />
                                            </button>
                                            <span className="text-xs text-[#7dd68a]">{label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-[#2d5c35] pt-4 flex flex-wrap gap-4">
                                {[
                                    { key: "isActive", label: "Active" },
                                    { key: "isPublic", label: "Public (visible on pricing page)" },
                                ].map(({ key, label }) => (
                                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                                        <button
                                            type="button"
                                            onClick={() => set(key, !form[key])}
                                            className={`w-9 h-5 rounded-full transition-colors relative ${form[key] ? "bg-[#3d8c47]" : "bg-[#2d5c35]"}`}
                                        >
                                            <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${form[key] ? "translate-x-4" : "translate-x-0.5"}`} />
                                        </button>
                                        <span className="text-xs text-[#7dd68a]">{label}</span>
                                    </label>
                                ))}
                            </div>

                            {error && (
                                <p className="text-sm text-red-400 bg-red-900/20 px-4 py-3 rounded-xl">{error}</p>
                            )}

                            <div className="flex gap-3 mt-auto pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 h-12 border border-[#2d5c35] text-[#4a7a50] text-sm font-medium rounded-xl hover:bg-[#1a3d1f] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 h-12 bg-[#1a3d1f] text-white text-sm font-medium rounded-xl hover:bg-[#2d5c35] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving
                                        ? <><Loader2 size={15} className="animate-spin" /> Saving...</>
                                        : <><Check size={15} /> {editingTier ? "Update tier" : "Create tier"}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
"use client";

import { useEffect, useState } from "react";
import {
    Plus, Loader2, Pencil, Trash2, X, Check, Star, Users,
} from "lucide-react";

function fmt(n: number) {
    return new Intl.NumberFormat("en-MW").format(Math.round(n));
}

const FEATURES = [
    { key: "seasonAnalytics"       as const, label: "Season analytics",       icon: "Trend" },
    { key: "yieldSuggestions"      as const, label: "Yield suggestions",       icon: "Harvest" },
    { key: "costPerHectare"        as const, label: "Cost per hectare",        icon: "Cost" },
    { key: "payrollTracking"       as const, label: "Payroll tracking",        icon: "Payroll" },
    { key: "multipleFarms"         as const, label: "Multiple farms",          icon: "Farms" },
    { key: "teamAccounts"          as const, label: "Team accounts",           icon: "Team" },
    { key: "customReports"         as const, label: "Custom reports",          icon: "Record" },
    { key: "apiAccess"             as const, label: "API access",              icon: "API" },
    { key: "dataRetentionLifetime" as const, label: "Lifetime data retention", icon: "Life" },
];

const LIMITS = [
    { key: "maxFields"       as const, label: "Fields"       },
    { key: "maxCrops"        as const, label: "Crops"        },
    { key: "maxActivities"   as const, label: "Activities"   },
    { key: "maxTransactions" as const, label: "Transactions" },
    { key: "maxEmployees"    as const, label: "Employees"    },
    { key: "maxFarms"        as const, label: "Farms"        },
];

const BOOL_TOGGLES = [
    { key: "isActive"   as const, label: "Active",   sub: "Visible on the platform" },
    { key: "isPublic"   as const, label: "Public",   sub: "Shown on landing page pricing" },
    { key: "isFeatured" as const, label: "Featured", sub: "Shows 'Most Popular' badge" },
];

type TierForm = {
    name:                  string;
    description:           string;
    priceMonthly:          string;
    priceAnnual:           string;
    maxFields:             string;
    maxCrops:              string;
    maxActivities:         string;
    maxTransactions:       string;
    maxEmployees:          string;
    maxFarms:              string;
    maxTeamMembers:        string;
    seasonAnalytics:       boolean;
    yieldSuggestions:      boolean;
    costPerHectare:        boolean;
    payrollTracking:       boolean;
    multipleFarms:         boolean;
    teamAccounts:          boolean;
    customReports:         boolean;
    apiAccess:             boolean;
    dataRetentionLifetime: boolean;
    isActive:              boolean;
    isPublic:              boolean;
    isFeatured:            boolean;
    sortOrder:             string;
};

const EMPTY: TierForm = {
    name: "", description: "",
    priceMonthly: "0", priceAnnual: "",
    maxFields: "-1", maxCrops: "-1", maxActivities: "-1",
    maxTransactions: "-1", maxEmployees: "-1", maxFarms: "1", maxTeamMembers: "0",
    seasonAnalytics: false, yieldSuggestions: false, costPerHectare: false,
    payrollTracking: false, multipleFarms: false, teamAccounts: false,
    customReports: false, apiAccess: false, dataRetentionLifetime: false,
    isActive: true, isPublic: true, isFeatured: false, sortOrder: "0",
};

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
    return (
        <button type="button" onClick={() => onChange(!on)}
                className="w-11 h-6 rounded-full relative flex-shrink-0 transition-colors"
                style={{ background: on ? "#0F766E" : "#CBD5E1" }}>
            <div className="w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all"
                 style={{ left: on ? "calc(100% - 20px)" : "4px" }} />
        </button>
    );
}

const INP: React.CSSProperties = {
    width: "100%", height: "40px", padding: "0 12px",
    borderRadius: "10px", border: "1px solid #E2E8F0",
    background: "#F8FAFC", color: "#0F172A",
    fontSize: "13px", outline: "none",
};

export default function AdminTiersPage() {
    const [tiers,       setTiers]       = useState<any[]>([]);
    const [loading,     setLoading]     = useState(true);
    const [showForm,    setShowForm]    = useState(false);
    const [editingTier, setEditingTier] = useState<any>(null);
    const [form,        setForm]        = useState<TierForm>({ ...EMPTY });
    const [saving,      setSaving]      = useState(false);
    const [error,       setError]       = useState("");
    const [deletingId,  setDeletingId]  = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const res  = await fetch("/api/admin/tiers");
            const text = await res.text();
            const data = text ? JSON.parse(text) : [];
            setTiers(Array.isArray(data) ? data : []);
        } catch { setTiers([]); }
        finally  { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const setF = <K extends keyof TierForm>(k: K, v: TierForm[K]) =>
        setForm((p) => ({ ...p, [k]: v }));

    const openAdd = () => {
        setEditingTier(null);
        setForm({ ...EMPTY, sortOrder: String(tiers.length) });
        setError("");
        setShowForm(true);
    };

    const openEdit = (t: any) => {
        setEditingTier(t);
        setForm({
            name:                  t.name                ?? "",
            description:           t.description         ?? "",
            priceMonthly:          String(t.priceMonthly  ?? 0),
            priceAnnual:           t.priceAnnual != null  ? String(t.priceAnnual) : "",
            maxFields:             String(t.maxFields      ?? -1),
            maxCrops:              String(t.maxCrops       ?? -1),
            maxActivities:         String(t.maxActivities  ?? -1),
            maxTransactions:       String(t.maxTransactions ?? -1),
            maxEmployees:          String(t.maxEmployees   ?? -1),
            maxFarms:              String(t.maxFarms        ?? 1),
            maxTeamMembers:        String(t.maxTeamMembers  ?? 0),
            seasonAnalytics:       Boolean(t.seasonAnalytics),
            yieldSuggestions:      Boolean(t.yieldSuggestions),
            costPerHectare:        Boolean(t.costPerHectare),
            payrollTracking:       Boolean(t.payrollTracking),
            multipleFarms:         Boolean(t.multipleFarms),
            teamAccounts:          Boolean(t.teamAccounts),
            customReports:         Boolean(t.customReports),
            apiAccess:             Boolean(t.apiAccess),
            dataRetentionLifetime: Boolean(t.dataRetentionLifetime),
            isActive:              t.isActive   ?? true,
            isPublic:              t.isPublic   ?? true,
            isFeatured:            t.isFeatured ?? false,
            sortOrder:             String(t.sortOrder ?? 0),
        });
        setError("");
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        const url    = editingTier ? `/api/admin/tiers/${editingTier.id}` : "/api/admin/tiers";
        const method = editingTier ? "PATCH" : "POST";

        const payload = {
            name:                  form.name,
            description:           form.description || null,
            priceMonthly:          parseFloat(form.priceMonthly)  || 0,
            priceAnnual:           form.priceAnnual !== "" ? parseFloat(form.priceAnnual) : null,
            maxFields:             parseInt(form.maxFields),
            maxCrops:              parseInt(form.maxCrops),
            maxActivities:         parseInt(form.maxActivities),
            maxTransactions:       parseInt(form.maxTransactions),
            maxEmployees:          parseInt(form.maxEmployees),
            maxFarms:              parseInt(form.maxFarms),
            maxTeamMembers:        parseInt(form.maxTeamMembers),
            seasonAnalytics:       form.seasonAnalytics,
            yieldSuggestions:      form.yieldSuggestions,
            costPerHectare:        form.costPerHectare,
            payrollTracking:       form.payrollTracking,
            multipleFarms:         form.multipleFarms,
            teamAccounts:          form.teamAccounts,
            customReports:         form.customReports,
            apiAccess:             form.apiAccess,
            dataRetentionLifetime: form.dataRetentionLifetime,
            isActive:              form.isActive,
            isPublic:              form.isPublic,
            isFeatured:            form.isFeatured,
            sortOrder:             parseInt(form.sortOrder) || 0,
        };

        try {
            const res  = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify(payload),
            });
            const text = await res.text();
            let d: any = {};
            if (text.trim()) { try { d = JSON.parse(text); } catch {} }
            if (!res.ok) { setError(d.error ?? `Failed (${res.status})`); setSaving(false); return; }
            setShowForm(false);
            load();
        } catch (err: any) {
            setError(err.message ?? "Unexpected error");
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this tier? This cannot be undone.")) return;
        setDeletingId(id);
        try { await fetch(`/api/admin/tiers/${id}`, { method: "DELETE" }); }
        finally { setDeletingId(null); load(); }
    };

    const totalSubs = tiers.reduce((s, t) => s + (t._count?.subscriptions ?? 0), 0);
    const liveTiers = tiers.filter((t) => t.isActive && t.isPublic).length;

    return (
        <div className="p-8 max-w-6xl mx-auto">

            {/* Page header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black" style={{ color: "#0F172A", letterSpacing: "-0.04em" }}>
                        Subscription Tiers
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>
                        {tiers.length} tier{tiers.length !== 1 ? "s" : ""} · {liveTiers} live on landing page · {totalSubs} subscribers
                    </p>
                </div>
                <button onClick={openAdd}
                        className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold text-white"
                        style={{ background: "#0F766E", boxShadow: "0 4px 12px rgba(15,118,110,0.25)" }}>
                    <Plus size={15} /> Add tier
                </button>
            </div>

            {/* Tier cards */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={24} className="animate-spin" style={{ color: "#0F766E" }} />
                </div>
            ) : tiers.length === 0 ? (
                <div className="rounded-2xl p-16 text-center"
                     style={{ background: "white", border: "1.5px dashed #E2E8F0" }}>
                    <p className="text-5xl mb-4">Stock</p>
                    <p className="font-bold mb-1" style={{ color: "#0F172A" }}>No tiers yet</p>
                    <p className="text-sm mb-6" style={{ color: "#94A3B8" }}>Create your first subscription tier</p>
                    <button onClick={openAdd}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                            style={{ background: "#0F766E" }}>
                        Create first tier
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {tiers.map((tier) => {
                        const price  = tier.priceMonthly ?? 0;
                        const subs   = tier._count?.subscriptions ?? 0;
                        const active = FEATURES.filter((f) => tier[f.key]);

                        return (
                            <div key={tier.id}
                                 className="rounded-2xl flex flex-col overflow-hidden"
                                 style={{
                                     background: "white",
                                     border:     `2px solid ${tier.isFeatured ? "#0F766E" : "#E2E8F0"}`,
                                     boxShadow:  tier.isFeatured
                                         ? "0 0 24px rgba(15,118,110,0.1)"
                                         : "0 1px 4px rgba(15,23,42,0.06)",
                                 }}>

                                {/* Featured banner */}
                                {tier.isFeatured && (
                                    <div className="flex items-center justify-center gap-1.5 py-2.5"
                                         style={{ background: "linear-gradient(90deg,#0F766E,#14B8A6)" }}>
                                        <Star size={11} fill="white" className="text-white" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                <div className="p-5 flex-1 flex flex-col gap-4">
                                    {/* Name + status */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-lg font-black" style={{ color: "#0F172A" }}>
                                                {tier.name}
                                            </h3>
                                            {tier.description && (
                                                <p className="text-xs mt-0.5 leading-snug" style={{ color: "#94A3B8" }}>
                                                    {tier.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1 items-end flex-shrink-0 ml-3">
                                            <span className="text-[10px] font-black px-2.5 py-1 rounded-full"
                                                  style={{
                                                      background: tier.isActive ? "#ECFDF5" : "#F1F5F9",
                                                      color:      tier.isActive ? "#059669" : "#64748B",
                                                  }}>
                                                {tier.isActive ? "Live" : "Hidden"}
                                            </span>
                                            {!tier.isPublic && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                      style={{ background: "#F1F5F9", color: "#64748B" }}>
                                                    Private
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div>
                                        <p className="text-3xl font-black" style={{ color: "#0F172A" }}>
                                            {price === 0 ? "Free" : `MWK ${fmt(price)}`}
                                            {price > 0 && (
                                                <span className="text-sm font-semibold ml-1" style={{ color: "#94A3B8" }}>/mo</span>
                                            )}
                                        </p>
                                        {tier.priceAnnual != null && tier.priceAnnual > 0 && (
                                            <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                                                MWK {fmt(tier.priceAnnual)}/yr
                                            </p>
                                        )}
                                    </div>

                                    {/* Limits */}
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {LIMITS.map(({ key, label }) => (
                                            <div key={key} className="rounded-lg p-2 text-center"
                                                 style={{ background: "#F8FAFC", border: "1px solid #F1F5F9" }}>
                                                <p className="text-[8px] font-black uppercase tracking-wide"
                                                   style={{ color: "#94A3B8" }}>
                                                    {label}
                                                </p>
                                                <p className="text-sm font-black mt-0.5" style={{ color: "#0F766E" }}>
                                                    {(tier[key] ?? -1) === -1 ? "∞" : tier[key]}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Features */}
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", minHeight: "24px" }}>
                                        {active.length > 0
                                            ? active.map((f) => (
                                                <span key={f.key}
                                                      style={{
                                                          display:    "inline-flex",
                                                          alignItems: "center",
                                                          gap:        "3px",
                                                          fontSize:   "10px",
                                                          fontWeight: 700,
                                                          padding:    "2px 8px",
                                                          borderRadius: "999px",
                                                          background: "rgba(15,118,110,0.08)",
                                                          color:      "#0F766E",
                                                          border:     "1px solid rgba(15,118,110,0.15)",
                                                          lineHeight: "1.6",
                                                          whiteSpace: "nowrap",
                                                      }}>
                                                    {f.label}
                                                </span>
                                            ))
                                            : <span style={{ fontSize: "10px", color: "#CBD5E1" }}>No premium features</span>}
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-3"
                                         style={{ borderTop: "1px solid #F1F5F9" }}>
                                        <div className="flex items-center gap-1.5">
                                            <Users size={12} style={{ color: "#94A3B8" }} />
                                            <span className="text-xs" style={{ color: "#94A3B8" }}>
                                                {subs} sub{subs !== 1 ? "s" : ""}
                                            </span>
                                        </div>
                                        <div className="flex gap-1.5">
                                            <button onClick={() => openEdit(tier)}
                                                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl"
                                                    style={{ background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0" }}>
                                                <Pencil size={11} /> Edit
                                            </button>
                                            <button onClick={() => handleDelete(tier.id)}
                                                    disabled={deletingId === tier.id}
                                                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl"
                                                    style={{ background: "#FFF1F2", color: "#E11D48", border: "1px solid #FFE4E6" }}>
                                                {deletingId === tier.id
                                                    ? <Loader2 size={11} className="animate-spin" />
                                                    : <Trash2 size={11} />}
                                            </button>
                                        </div>
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
                    {/* Backdrop */}
                    <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setShowForm(false)} />

                    {/* Panel — full height, scrollable body */}
                    <div className="w-full max-w-lg flex flex-col shadow-2xl"
                         style={{ background: "white", borderLeft: "1px solid #E2E8F0", height: "100vh" }}>

                        {/* Panel header — fixed */}
                        <div className="flex items-center justify-between px-6 py-5 flex-shrink-0"
                             style={{ borderBottom: "1px solid #F1F5F9", background: "#FAFAFA" }}>
                            <div>
                                <h2 className="text-base font-black" style={{ color: "#0F172A" }}>
                                    {editingTier ? `Edit — ${editingTier.name}` : "New subscription tier"}
                                </h2>
                                <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                                    Changes sync live to the landing page
                                </p>
                            </div>
                            <button onClick={() => setShowForm(false)}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: "#F1F5F9", color: "#64748B" }}>
                                <X size={15} />
                            </button>
                        </div>

                        {/* Scrollable form body */}
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

                                {/* ── Basic info ── */}
                                <Section title="Basic info">
                                    <div>
                                        <Label>Name *</Label>
                                        <input value={form.name}
                                               onChange={(e) => setF("name", e.target.value)}
                                               placeholder="e.g. Starter, Standard, Enterprise"
                                               required style={INP} />
                                    </div>
                                    <div>
                                        <Label>Description</Label>
                                        <input value={form.description}
                                               onChange={(e) => setF("description", e.target.value)}
                                               placeholder="Short tagline shown under the plan name"
                                               style={INP} />
                                    </div>
                                </Section>

                                {/* ── Pricing ── */}
                                <Section title="Pricing (whole MWK — not cents)">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label>Monthly (MWK)</Label>
                                            <input type="number" min="0" step="1"
                                                   value={form.priceMonthly}
                                                   onChange={(e) => setF("priceMonthly", e.target.value)}
                                                   placeholder="0 = Free" style={INP} />
                                            <p className="text-[10px] mt-1" style={{ color: "#94A3B8" }}>
                                                Preview: {parseFloat(form.priceMonthly) > 0
                                                ? `MWK ${fmt(parseFloat(form.priceMonthly))}/mo`
                                                : "Free"}
                                            </p>
                                        </div>
                                        <div>
                                            <Label>Annual (MWK)</Label>
                                            <input type="number" min="0" step="1"
                                                   value={form.priceAnnual}
                                                   onChange={(e) => setF("priceAnnual", e.target.value)}
                                                   placeholder="Leave blank to hide" style={INP} />
                                            {form.priceAnnual && parseFloat(form.priceAnnual) > 0 && (
                                                <p className="text-[10px] mt-1" style={{ color: "#94A3B8" }}>
                                                    MWK {fmt(parseFloat(form.priceAnnual))}/yr
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Section>

                                {/* ── Limits ── */}
                                <Section title="Usage limits (-1 = unlimited, 0 = disabled)">
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { key: "maxFields"       as const, label: "Fields"       },
                                            { key: "maxCrops"        as const, label: "Crops"        },
                                            { key: "maxActivities"   as const, label: "Activities"   },
                                            { key: "maxTransactions" as const, label: "Transactions" },
                                            { key: "maxEmployees"    as const, label: "Employees"    },
                                            { key: "maxFarms"        as const, label: "Farms"        },
                                        ].map(({ key, label }) => (
                                            <div key={key}>
                                                <Label>{label}</Label>
                                                <input type="number" step="1"
                                                       value={form[key]}
                                                       onChange={(e) => setF(key, e.target.value)}
                                                       style={{ ...INP, textAlign: "center" }} />
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <Label>Team members</Label>
                                        <input type="number" step="1"
                                               value={form.maxTeamMembers}
                                               onChange={(e) => setF("maxTeamMembers", e.target.value)}
                                               style={{ ...INP, maxWidth: "120px", textAlign: "center" }} />
                                    </div>
                                </Section>

                                {/* ── Features ── */}
                                <Section title="Premium features">
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                                        {FEATURES.map(({ key, label }) => (
                                            <button key={key} type="button"
                                                    onClick={() => setF(key, !form[key])}
                                                    style={{
                                                        display:        "flex",
                                                        alignItems:     "center",
                                                        gap:            "8px",
                                                        padding:        "10px 12px",
                                                        borderRadius:   "10px",
                                                        border:         `1.5px solid ${form[key] ? "#0F766E" : "#E2E8F0"}`,
                                                        background:     form[key] ? "rgba(15,118,110,0.08)" : "#F8FAFC",
                                                        cursor:         "pointer",
                                                        textAlign:      "left",
                                                    }}>
                                                <div style={{
                                                    width: "16px", height: "16px", borderRadius: "4px",
                                                    flexShrink: 0,
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    background: form[key] ? "#0F766E" : "white",
                                                    border:     form[key] ? "none" : "1.5px solid #CBD5E1",
                                                }}>
                                                    {form[key] && (
                                                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                                            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                        </svg>
                                                    )}
                                                </div>
                                                <span style={{ fontSize: "12px", fontWeight: 600, color: form[key] ? "#0F766E" : "#475569" }}>
                                                    {label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </Section>

                                {/* ── Visibility ── */}
                                <Section title="Visibility & display">
                                    {BOOL_TOGGLES.map(({ key, label, sub }) => (
                                        <div key={key}
                                             className="flex items-center justify-between p-3.5 rounded-xl"
                                             style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                                            <div>
                                                <p className="text-sm font-bold" style={{ color: "#0F172A" }}>{label}</p>
                                                <p className="text-xs" style={{ color: "#94A3B8" }}>{sub}</p>
                                            </div>
                                            <Toggle on={form[key] as boolean} onChange={(v) => setF(key, v)} />
                                        </div>
                                    ))}
                                </Section>

                                {/* ── Sort order ── */}
                                <Section title="Display order">
                                    <div>
                                        <Label>Sort order (lower = first)</Label>
                                        <input type="number" min="0" step="1"
                                               value={form.sortOrder}
                                               onChange={(e) => setF("sortOrder", e.target.value)}
                                               style={{ ...INP, maxWidth: "100px", textAlign: "center" }} />
                                    </div>
                                </Section>

                                {/* Error */}
                                {error && (
                                    <div className="rounded-xl px-4 py-3 flex items-start gap-2"
                                         style={{ background: "#FFF1F2", border: "1px solid #FFE4E6" }}>
                                        <X size={13} className="flex-shrink-0 mt-0.5" style={{ color: "#E11D48" }} />
                                        <p className="text-sm font-semibold" style={{ color: "#9F1239" }}>{error}</p>
                                    </div>
                                )}
                            </div>

                            {/* Sticky footer */}
                            <div className="flex gap-3 px-6 py-5 flex-shrink-0"
                                 style={{ borderTop: "1px solid #F1F5F9", background: "white" }}>
                                <button type="button" onClick={() => setShowForm(false)}
                                        className="flex-1 h-11 rounded-xl font-bold text-sm"
                                        style={{ border: "1.5px solid #E2E8F0", color: "#64748B" }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                        className="flex-1 h-11 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
                                        style={{ background: saving ? "#94A3B8" : "#0F766E" }}>
                                    {saving
                                        ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
                                        : <><Check size={14} /> {editingTier ? "Save changes" : "Create tier"}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ border: "1px solid #E2E8F0", borderRadius: "12px" }}>
            <div style={{ padding: "10px 16px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", borderRadius: "12px 12px 0 0" }}>
                <p style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748B", margin: 0 }}>
                    {title}
                </p>
            </div>
            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {children}
            </div>
        </div>
    );
}

function Label({ children }: { children: React.ReactNode }) {
    return (
        <label style={{ display: "block", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px", color: "#94A3B8" }}>
            {children}
        </label>
    );
}
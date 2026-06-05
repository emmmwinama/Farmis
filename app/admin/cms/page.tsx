"use client";

import { useEffect, useState } from "react";
import {
    Save, Plus, Trash2, Loader2, X, Check,
    FileText, Star, Zap, BarChart2, Tag,
    Edit3, Eye, RefreshCw, ChevronDown, ChevronUp,
} from "lucide-react";

function fmt(n: number) { return new Intl.NumberFormat().format(n); }
function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

type CmsTab = "content" | "features" | "testimonials" | "impact" | "pitch" | "tiers";

const TABS: { key: CmsTab; label: string; icon: any }[] = [
    { key: "content",      label: "Site content",  icon: FileText },
    { key: "features",     label: "Features",      icon: Zap },
    { key: "testimonials", label: "Testimonials",  icon: Star },
    { key: "impact",       label: "Impact stats",  icon: BarChart2 },
    { key: "pitch",        label: "Pitch content", icon: Tag },
    { key: "tiers",        label: "Tiers",         icon: Tag },
];

// ── Shared input style ─────────────────────────────────────────────────────
const inp = {
    width: "100%", padding: "10px 14px", borderRadius: "10px",
    border: "1px solid #E2E8F0", background: "#F8FAFC",
    color: "#0F172A", fontSize: "14px", outline: "none",
};

// ── Site content section ────────────────────────────────────────────────────
function SiteContentSection() {
    const [content, setContent] = useState<Record<string, string>>({});
    const [saving,  setSaving]  = useState<string | null>(null);
    const [saved,   setSaved]   = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/cms")
            .then((r) => r.json())
            .then((d) => { setContent(d.content ?? {}); setLoading(false); });
    }, []);

    const save = async (key: string) => {
        setSaving(key);
        await fetch("/api/admin/cms", {
            method:  "PATCH",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ key, value: content[key] }),
        });
        setSaving(null);
        setSaved(key);
        setTimeout(() => setSaved(null), 2000);
    };

    const GROUPS = [
        {
            label: "Hero section",
            keys:  ["hero_headline", "hero_subheadline", "hero_cta_primary", "hero_cta_secondary"],
        },
        {
            label: "Problem section",
            keys:  ["problem_headline", "problem_sub"],
        },
        {
            label: "Features section",
            keys:  ["features_headline", "features_sub"],
        },
        {
            label: "Impact section",
            keys:  ["impact_headline"],
        },
        {
            label: "Testimonials section",
            keys:  ["testimonials_headline"],
        },
        {
            label: "Pricing section",
            keys:  ["pricing_headline", "pricing_sub"],
        },
        {
            label: "Funders section",
            keys:  ["funders_headline", "funders_sub"],
        },
        {
            label: "Final CTA section",
            keys:  ["cta_headline", "cta_sub"],
        },
        {
            label: "Contact info",
            keys:  ["contact_email", "invest_email", "contact_phone"],
        },
    ];

    const labelFor = (key: string) =>
        key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 size={20} className="animate-spin" style={{ color: "#0F766E" }} />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {GROUPS.map((group) => (
                <div key={group.label} className="rounded-2xl overflow-hidden"
                     style={{ background: "white", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
                    <div className="px-5 py-3.5 border-b"
                         style={{ background: "#F8FAFC", borderColor: "#E2E8F0" }}>
                        <p className="text-sm font-black" style={{ color: "#0F172A" }}>{group.label}</p>
                    </div>
                    <div className="p-5 flex flex-col gap-4">
                        {group.keys.map((key) => (
                            <div key={key}>
                                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide"
                                       style={{ color: "#94A3B8" }}>
                                    {labelFor(key)}
                                </label>
                                <div className="flex gap-2">
                                    {key.includes("sub") || key.includes("headline") ? (
                                        <textarea
                                            value={content[key] ?? ""}
                                            onChange={(e) => setContent((c) => ({ ...c, [key]: e.target.value }))}
                                            rows={2}
                                            style={{ ...inp, resize: "none" }}
                                        />
                                    ) : (
                                        <input
                                            value={content[key] ?? ""}
                                            onChange={(e) => setContent((c) => ({ ...c, [key]: e.target.value }))}
                                            style={inp}
                                        />
                                    )}
                                    <button onClick={() => save(key)} disabled={saving === key}
                                            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                                            style={{
                                                background: saved === key ? "#ECFDF5" : "#0F766E",
                                                color:      saved === key ? "#059669" : "white",
                                                border:     saved === key ? "1px solid #6EE7B7" : "none",
                                            }}>
                                        {saving === key
                                            ? <Loader2 size={14} className="animate-spin" />
                                            : saved === key
                                                ? <Check size={14} />
                                                : <Save size={14} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Features section ────────────────────────────────────────────────────────
function FeaturesSection() {
    const [features, setFeatures] = useState<any[]>([]);
    const [loading,  setLoading]  = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing,  setEditing]  = useState<any>(null);
    const [form, setForm] = useState({ icon: "⭐", title: "", description: "", sortOrder: "0", isActive: true });
    const [saving,   setSaving]   = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        fetch("/api/admin/cms/features").then((r) => r.json()).then((d) => { setFeatures(d); setLoading(false); });
    };
    useEffect(() => { load(); }, []);

    const openAdd = () => {
        setEditing(null);
        setForm({ icon: "⭐", title: "", description: "", sortOrder: String(features.length), isActive: true });
        setShowForm(true);
    };
    const openEdit = (f: any) => {
        setEditing(f);
        setForm({ icon: f.icon, title: f.title, description: f.description, sortOrder: String(f.sortOrder), isActive: f.isActive });
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true);
        const url    = editing ? `/api/admin/cms/features/${editing.id}` : "/api/admin/cms/features";
        const method = editing ? "PATCH" : "POST";
        await fetch(url, {
            method, headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, sortOrder: parseInt(form.sortOrder) }),
        });
        setSaving(false); setShowForm(false); load();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this feature?")) return;
        setDeletingId(id);
        await fetch(`/api/admin/cms/features/${id}`, { method: "DELETE" });
        setDeletingId(null); load();
    };

    return (
        <div>
            <div className="flex justify-end mb-5">
                <button onClick={openAdd}
                        className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-bold text-white"
                        style={{ background: "#0F766E" }}>
                    <Plus size={14} /> Add feature
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin" style={{ color: "#0F766E" }} /></div>
            ) : (
                <div className="flex flex-col gap-3">
                    {features.map((f) => (
                        <div key={f.id} className="flex items-center gap-4 rounded-2xl px-5 py-4"
                             style={{ background: "white", border: "1px solid #E2E8F0" }}>
                            <span className="text-2xl flex-shrink-0">{f.icon}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold" style={{ color: "#0F172A" }}>{f.title}</p>
                                <p className="text-xs truncate" style={{ color: "#64748B" }}>{f.description}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${f.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {f.isActive ? "Live" : "Hidden"}
                </span>
                                <button onClick={() => openEdit(f)}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{ background: "#F1F5F9", color: "#64748B" }}>
                                    <Edit3 size={13} />
                                </button>
                                <button onClick={() => handleDelete(f.id)} disabled={deletingId === f.id}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{ background: "#FFF1F2", color: "#E11D48" }}>
                                    {deletingId === f.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <Modal title={editing ? "Edit feature" : "Add feature"} onClose={() => setShowForm(false)}>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="grid grid-cols-4 gap-3">
                            <div>
                                <label className="block text-xs font-bold mb-1" style={{ color: "#94A3B8" }}>Icon</label>
                                <input value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                                       style={{ ...inp, textAlign: "center", fontSize: "20px" }} maxLength={2} />
                            </div>
                            <div className="col-span-3">
                                <label className="block text-xs font-bold mb-1" style={{ color: "#94A3B8" }}>Title *</label>
                                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                       required style={inp} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1" style={{ color: "#94A3B8" }}>Description *</label>
                            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                      required rows={3} style={{ ...inp, resize: "none" }} />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                            <p className="text-sm font-semibold" style={{ color: "#0F172A" }}>Active (visible on landing page)</p>
                            <Toggle value={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
                        </div>
                        <ModalActions onCancel={() => setShowForm(false)} saving={saving} label={editing ? "Update" : "Add feature"} />
                    </form>
                </Modal>
            )}
        </div>
    );
}

// ── Testimonials section ────────────────────────────────────────────────────
function TestimonialsSection() {
    const [items,    setItems]    = useState<any[]>([]);
    const [loading,  setLoading]  = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing,  setEditing]  = useState<any>(null);
    const [form, setForm] = useState({ name: "", role: "", company: "", content: "", rating: "5", avatar: "👨🏿‍🌾", isActive: true });
    const [saving,   setSaving]   = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        fetch("/api/admin/testimonials").then((r) => r.json()).then((d) => { setItems(d); setLoading(false); });
    };
    useEffect(() => { load(); }, []);

    const openAdd = () => {
        setEditing(null);
        setForm({ name: "", role: "", company: "", content: "", rating: "5", avatar: "👨🏿‍🌾", isActive: true });
        setShowForm(true);
    };
    const openEdit = (t: any) => {
        setEditing(t);
        setForm({ name: t.name, role: t.role ?? "", company: t.company ?? "", content: t.content, rating: String(t.rating ?? 5), avatar: t.avatar ?? "👨🏿‍🌾", isActive: t.isActive });
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true);
        const url    = editing ? `/api/admin/testimonials/${editing.id}` : "/api/admin/testimonials";
        const method = editing ? "PATCH" : "POST";
        await fetch(url, {
            method, headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, rating: parseInt(form.rating) }),
        });
        setSaving(false); setShowForm(false); load();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this testimonial?")) return;
        setDeletingId(id);
        await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
        setDeletingId(null); load();
    };

    const AVATARS = ["👨🏿‍🌾", "👩🏾‍🌾", "🧑🏾‍🌾", "👨🏾‍🌾", "👩🏿‍🌾", "🧑🏿‍🌾"];

    return (
        <div>
            <div className="flex justify-end mb-5">
                <button onClick={openAdd}
                        className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-bold text-white"
                        style={{ background: "#0F766E" }}>
                    <Plus size={14} /> Add testimonial
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin" style={{ color: "#0F766E" }} /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((t) => (
                        <div key={t.id} className="rounded-2xl p-5"
                             style={{ background: "white", border: "1px solid #E2E8F0" }}>
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{t.avatar ?? "👨🏿‍🌾"}</span>
                                    <div>
                                        <p className="text-sm font-bold" style={{ color: "#0F172A" }}>{t.name}</p>
                                        <p className="text-xs" style={{ color: "#64748B" }}>{t.role}{t.company ? ` · ${t.company}` : ""}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1.5">
                                    <button onClick={() => openEdit(t)}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                                            style={{ background: "#F1F5F9", color: "#64748B" }}>
                                        <Edit3 size={12} />
                                    </button>
                                    <button onClick={() => handleDelete(t.id)} disabled={deletingId === t.id}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                                            style={{ background: "#FFF1F2", color: "#E11D48" }}>
                                        {deletingId === t.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm italic leading-relaxed mb-3" style={{ color: "#475569" }}>
                                &ldquo;{t.content}&rdquo;
                            </p>
                            <div className="flex items-center justify-between">
                                <div className="flex gap-0.5">
                                    {Array.from({ length: t.rating ?? 5 }).map((_, i) => (
                                        <Star key={i} size={12} fill="#F59E0B" style={{ color: "#F59E0B" }} />
                                    ))}
                                </div>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${t.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {t.isActive ? "Live" : "Hidden"}
                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <Modal title={editing ? "Edit testimonial" : "Add testimonial"} onClose={() => setShowForm(false)}>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-bold mb-1.5" style={{ color: "#94A3B8" }}>Avatar</label>
                            <div className="flex gap-2 flex-wrap">
                                {AVATARS.map((a) => (
                                    <button key={a} type="button" onClick={() => setForm((f) => ({ ...f, avatar: a }))}
                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all"
                                            style={{
                                                background: form.avatar === a ? "#ECFDF5" : "#F8FAFC",
                                                border:     `1.5px solid ${form.avatar === a ? "#34D399" : "#E2E8F0"}`,
                                            }}>
                                        {a}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold mb-1" style={{ color: "#94A3B8" }}>Name *</label>
                                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required style={inp} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1" style={{ color: "#94A3B8" }}>Role *</label>
                                <input value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} required style={inp} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1" style={{ color: "#94A3B8" }}>Location / company</label>
                            <input value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} style={inp} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1" style={{ color: "#94A3B8" }}>Quote *</label>
                            <textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                                      required rows={4} style={{ ...inp, resize: "none" }} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1.5" style={{ color: "#94A3B8" }}>Rating</label>
                            <div className="flex gap-2">
                                {[1,2,3,4,5].map((n) => (
                                    <button key={n} type="button" onClick={() => setForm((f) => ({ ...f, rating: String(n) }))}
                                            className="w-9 h-9 rounded-xl text-sm font-black transition-all"
                                            style={{
                                                background: parseInt(form.rating) >= n ? "#FEF3C7" : "#F8FAFC",
                                                border:     `1.5px solid ${parseInt(form.rating) >= n ? "#FCD34D" : "#E2E8F0"}`,
                                                color:      parseInt(form.rating) >= n ? "#D97706" : "#94A3B8",
                                            }}>
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                            <p className="text-sm font-semibold" style={{ color: "#0F172A" }}>Active (visible on landing page)</p>
                            <Toggle value={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
                        </div>
                        <ModalActions onCancel={() => setShowForm(false)} saving={saving} label={editing ? "Update" : "Add"} />
                    </form>
                </Modal>
            )}
        </div>
    );
}

// ── Impact stats section ────────────────────────────────────────────────────
function ImpactStatsSection() {
    const [stats,    setStats]    = useState<any[]>([]);
    const [loading,  setLoading]  = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing,  setEditing]  = useState<any>(null);
    const [form, setForm] = useState({ icon: "📊", value: "", label: "", source: "", color: "#1a3d1f", sortOrder: "0", isActive: true });
    const [saving,   setSaving]   = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        fetch("/api/admin/cms/impact").then((r) => r.json()).then((d) => { setStats(d); setLoading(false); });
    };
    useEffect(() => { load(); }, []);

    const openAdd = () => {
        setEditing(null);
        setForm({ icon: "📊", value: "", label: "", source: "", color: "#1a3d1f", sortOrder: String(stats.length), isActive: true });
        setShowForm(true);
    };
    const openEdit = (s: any) => {
        setEditing(s);
        setForm({ icon: s.icon, value: s.value, label: s.label, source: s.source ?? "", color: s.color ?? "#1a3d1f", sortOrder: String(s.sortOrder), isActive: s.isActive });
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true);
        const url    = editing ? `/api/admin/cms/impact/${editing.id}` : "/api/admin/cms/impact";
        const method = editing ? "PATCH" : "POST";
        await fetch(url, {
            method, headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, sortOrder: parseInt(form.sortOrder) }),
        });
        setSaving(false); setShowForm(false); load();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this stat?")) return;
        setDeletingId(id);
        await fetch(`/api/admin/cms/impact/${id}`, { method: "DELETE" });
        setDeletingId(null); load();
    };

    const ACCENT_COLORS = ["#DC2626", "#D97706", "#16A34A", "#2563EB", "#9333EA", "#0891B2", "#EA580C", "#1a3d1f"];

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <p className="text-sm" style={{ color: "#64748B" }}>
                    These stats appear on the landing page problem section and investor pitch
                </p>
                <button onClick={openAdd}
                        className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-bold text-white"
                        style={{ background: "#0F766E" }}>
                    <Plus size={14} /> Add stat
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin" style={{ color: "#0F766E" }} /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stats.map((s) => (
                        <div key={s.id} className="rounded-2xl p-5 flex items-start gap-4"
                             style={{ background: "white", border: "1px solid #E2E8F0" }}>
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                                 style={{ background: `${s.color}15` }}>
                                {s.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xl font-black mb-0.5" style={{ color: s.color }}>{s.value}</p>
                                <p className="text-sm font-semibold leading-snug mb-1" style={{ color: "#0F172A" }}>{s.label}</p>
                                {s.source && <p className="text-[10px]" style={{ color: "#94A3B8" }}>Source: {s.source}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <button onClick={() => openEdit(s)}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                                        style={{ background: "#F1F5F9", color: "#64748B" }}>
                                    <Edit3 size={12} />
                                </button>
                                <button onClick={() => handleDelete(s.id)} disabled={deletingId === s.id}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                                        style={{ background: "#FFF1F2", color: "#E11D48" }}>
                                    {deletingId === s.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <Modal title={editing ? "Edit impact stat" : "Add impact stat"} onClose={() => setShowForm(false)}>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="grid grid-cols-4 gap-3">
                            <div>
                                <label className="block text-xs font-bold mb-1" style={{ color: "#94A3B8" }}>Icon</label>
                                <input value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                                       style={{ ...inp, textAlign: "center", fontSize: "20px" }} maxLength={2} />
                            </div>
                            <div className="col-span-3">
                                <label className="block text-xs font-bold mb-1" style={{ color: "#94A3B8" }}>Value (e.g. 67%, MWK 2.1T) *</label>
                                <input value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                                       required placeholder="67%" style={inp} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1" style={{ color: "#94A3B8" }}>Label (description) *</label>
                            <textarea value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                                      required rows={2} style={{ ...inp, resize: "none" }}
                                      placeholder="of smallholder farmers in Malawi keep no formal financial records" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1" style={{ color: "#94A3B8" }}>Source</label>
                            <input value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                                   placeholder="World Bank, 2023" style={inp} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1.5" style={{ color: "#94A3B8" }}>Accent colour</label>
                            <div className="flex gap-2 flex-wrap">
                                {ACCENT_COLORS.map((c) => (
                                    <button key={c} type="button" onClick={() => setForm((f) => ({ ...f, color: c }))}
                                            className="w-8 h-8 rounded-lg transition-all"
                                            style={{
                                                background:   c,
                                                outline:      form.color === c ? `3px solid ${c}` : "none",
                                                outlineOffset: "2px",
                                                transform:    form.color === c ? "scale(1.15)" : "scale(1)",
                                            }} />
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                            <p className="text-sm font-semibold" style={{ color: "#0F172A" }}>Active (visible on landing page)</p>
                            <Toggle value={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
                        </div>
                        <ModalActions onCancel={() => setShowForm(false)} saving={saving} label={editing ? "Update" : "Add stat"} />
                    </form>
                </Modal>
            )}
        </div>
    );
}

// ── Pitch content section ───────────────────────────────────────────────────
function PitchContentSection() {
    const [sections, setSections] = useState<any[]>([]);
    const [loading,  setLoading]  = useState(true);
    const [expanded, setExpanded] = useState<string | null>("hook");
    const [saving,   setSaving]   = useState<string | null>(null);
    const [saved,    setSaved]    = useState<string | null>(null);
    const [localContent, setLocalContent] = useState<Record<string, any>>({});

    const load = () => {
        setLoading(true);
        fetch("/api/admin/cms/pitch").then((r) => r.json()).then((d) => {
            setSections(Array.isArray(d) ? d : []);
            const map: Record<string, any> = {};
            if (Array.isArray(d)) d.forEach((s: any) => { map[s.key] = s.content; });
            setLocalContent(map);
            setLoading(false);
        });
    };
    useEffect(() => { load(); }, []);

    const saveSection = async (key: string, title: string) => {
        setSaving(key);
        await fetch("/api/admin/cms/pitch", {
            method:  "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key, title, content: localContent[key] }),
        });
        setSaving(null); setSaved(key);
        setTimeout(() => setSaved(null), 2000);
    };

    const SECTION_KEYS = [
        { key: "hook",     label: "The Hook",               desc: "Opening statement that captures attention" },
        { key: "problem",  label: "The Problem",             desc: "Data-backed pain points" },
        { key: "solution", label: "The Solution",            desc: "What Farmio does" },
        { key: "market",   label: "Market Opportunity",      desc: "TAM/SAM/SOM and market drivers" },
        { key: "model",    label: "Business Model",          desc: "Revenue streams and unit economics" },
        { key: "traction", label: "Traction & Validation",   desc: "Current metrics and milestones" },
        { key: "ask",      label: "The Ask",                 desc: "Funding amount and use of funds" },
    ];

    if (loading) {
        return <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin" style={{ color: "#0F766E" }} /></div>;
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="rounded-xl p-4 mb-2" style={{ background: "#ECFDF5", border: "1px solid #6EE7B7" }}>
                <p className="text-sm font-semibold" style={{ color: "#065F46" }}>
                    💡 These sections power the <strong>/pitch</strong> investor page. Edit the JSON content carefully —
                    it drives all the text, stats and data on the pitch page.
                </p>
            </div>

            {SECTION_KEYS.map(({ key, label, desc }) => {
                const section = sections.find((s) => s.key === key);
                const isOpen  = expanded === key;

                return (
                    <div key={key} className="rounded-2xl overflow-hidden"
                         style={{ background: "white", border: "1px solid #E2E8F0" }}>
                        <button
                            className="w-full flex items-center justify-between px-5 py-4"
                            onClick={() => setExpanded(isOpen ? null : key)}>
                            <div className="flex items-center gap-3 text-left">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white"
                                     style={{ background: "#0F766E" }}>
                                    {key.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-bold" style={{ color: "#0F172A" }}>{label}</p>
                                    <p className="text-xs" style={{ color: "#94A3B8" }}>{desc}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {saved === key && <span className="text-xs font-bold" style={{ color: "#059669" }}>✓ Saved</span>}
                                {isOpen ? <ChevronUp size={16} style={{ color: "#94A3B8" }} /> : <ChevronDown size={16} style={{ color: "#94A3B8" }} />}
                            </div>
                        </button>

                        {isOpen && (
                            <div className="px-5 pb-5 border-t" style={{ borderColor: "#F1F5F9" }}>
                                <div className="mt-4">
                                    <label className="block text-xs font-bold mb-2" style={{ color: "#94A3B8" }}>
                                        Content (JSON) — edit carefully
                                    </label>
                                    <textarea
                                        value={typeof localContent[key] === "string"
                                            ? localContent[key]
                                            : JSON.stringify(localContent[key] ?? {}, null, 2)}
                                        onChange={(e) => {
                                            try {
                                                const parsed = JSON.parse(e.target.value);
                                                setLocalContent((prev) => ({ ...prev, [key]: parsed }));
                                            } catch {
                                                // Allow invalid JSON while typing
                                            }
                                        }}
                                        rows={14}
                                        className="w-full font-mono text-xs rounded-xl p-4"
                                        style={{
                                            background:  "#0F172A",
                                            color:       "#E2E8F0",
                                            border:      "1px solid #1E293B",
                                            resize:      "vertical",
                                            outline:     "none",
                                        }}
                                    />
                                    <p className="text-[10px] mt-1" style={{ color: "#94A3B8" }}>
                                        Valid JSON required. Changes auto-parse as you type.
                                    </p>
                                </div>
                                <div className="flex justify-end mt-4">
                                    <button
                                        onClick={() => saveSection(key, section?.title ?? label)}
                                        disabled={saving === key}
                                        className="flex items-center gap-2 h-9 px-5 rounded-xl text-sm font-bold"
                                        style={{
                                            background: saved === key ? "#ECFDF5" : "#0F766E",
                                            color:      saved === key ? "#059669" : "white",
                                        }}>
                                        {saving === key
                                            ? <><Loader2 size={13} className="animate-spin" /> Saving...</>
                                            : saved === key
                                                ? <><Check size={13} /> Saved</>
                                                : <><Save size={13} /> Save section</>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── Tiers quick view ────────────────────────────────────────────────────────
function TiersSection() {
    const [tiers,   setTiers]   = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/tiers").then((r) => r.json()).then((d) => { setTiers(d); setLoading(false); });
    }, []);

    return (
        <div>
            <div className="rounded-xl p-4 mb-5" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                <p className="text-sm font-semibold" style={{ color: "#1E40AF" }}>
                    ℹ️ Subscription tiers are managed in{" "}
                    <a href="/admin/tiers" className="font-black underline">Admin → Tiers</a>.
                    They display on the landing page pricing section automatically.
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin" style={{ color: "#0F766E" }} /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {tiers.map((tier) => (
                        <div key={tier.id} className="rounded-2xl p-5"
                             style={{ background: "white", border: `1.5px solid ${tier.isFeatured ? "#0F766E" : "#E2E8F0"}` }}>
                            {tier.isFeatured && (
                                <div className="text-[10px] font-black px-2.5 py-1 rounded-full mb-3 inline-block"
                                     style={{ background: "#ECFDF5", color: "#059669", border: "1px solid #6EE7B7" }}>
                                    ⭐ Featured
                                </div>
                            )}
                            <p className="text-lg font-black mb-1" style={{ color: "#0F172A" }}>{tier.name}</p>
                            <p className="text-2xl font-black mb-1" style={{ color: "#0F766E" }}>
                                {tier.monthlyPrice === 0 ? "Free" : `MWK ${(tier.monthlyPrice / 100).toLocaleString()}/mo`}
                            </p>
                            <p className="text-xs mb-3" style={{ color: "#94A3B8" }}>{tier.description}</p>
                            <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${tier.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {tier.isActive ? "Live" : "Hidden"}
                </span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${tier.isPublic ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                  {tier.isPublic ? "Public" : "Private"}
                </span>
                            </div>
                            <a href="/admin/tiers"
                               className="flex items-center gap-1 text-xs font-bold mt-3"
                               style={{ color: "#0F766E" }}>
                                Edit in Tiers →
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Shared modal + helpers ──────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className="w-full max-w-lg h-full overflow-y-auto flex flex-col shadow-2xl"
                 style={{ background: "white" }}>
                <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "#E2E8F0" }}>
                    <h2 className="text-base font-black" style={{ color: "#0F172A" }}>{title}</h2>
                    <button onClick={onClose}
                            className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: "#F1F5F9", color: "#64748B" }}>
                        <X size={16} />
                    </button>
                </div>
                <div className="flex-1 p-6">{children}</div>
            </div>
        </div>
    );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
        <button type="button" onClick={() => onChange(!value)}
                className="w-11 h-6 rounded-full transition-all relative flex-shrink-0"
                style={{ background: value ? "#0F766E" : "#CBD5E1" }}>
            <div className="w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm"
                 style={{ left: value ? "calc(100% - 20px)" : "4px" }} />
        </button>
    );
}

function ModalActions({ onCancel, saving, label }: { onCancel: () => void; saving: boolean; label: string }) {
    return (
        <div className="flex gap-3 pt-4">
            <button type="button" onClick={onCancel}
                    className="flex-1 h-12 rounded-xl text-sm font-bold"
                    style={{ border: "1.5px solid #E2E8F0", color: "#64748B" }}>
                Cancel
            </button>
            <button type="submit" disabled={saving}
                    className="flex-1 h-12 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                    style={{ background: "#0F766E" }}>
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Check size={14} /> {label}</>}
            </button>
        </div>
    );
}

// ── Main CMS page ────────────────────────────────────────────────────────────
export default function AdminCMSPage() {
    const [tab, setTab] = useState<CmsTab>("content");

    return (
        <div className="p-8 max-w-5xl mx-auto">

            <div className="mb-8 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-black" style={{ color: "#0F172A", letterSpacing: "-0.04em" }}>
                        Site Content Management
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>
                        All changes appear live on the landing page and pitch deck
                    </p>
                </div>
                <a href="/landing" target="_blank"
                   className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-bold"
                   style={{ background: "#F1F5F9", border: "1px solid #E2E8F0", color: "#475569" }}>
                    <Eye size={14} /> Preview landing page
                </a>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 p-1 rounded-2xl mb-8 overflow-x-auto"
                 style={{ background: "#F1F5F9", border: "1px solid #E2E8F0" }}>
                {TABS.map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => setTab(key)}
                            className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0"
                            style={{
                                background: tab === key ? "white" : "transparent",
                                color:      tab === key ? "#0F172A" : "#94A3B8",
                                boxShadow:  tab === key ? "0 1px 3px rgba(15,23,42,0.08)" : "none",
                            }}>
                        <Icon size={14} />
                        {label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {tab === "content"      && <SiteContentSection />}
            {tab === "features"     && <FeaturesSection />}
            {tab === "testimonials" && <TestimonialsSection />}
            {tab === "impact"       && <ImpactStatsSection />}
            {tab === "pitch"        && <PitchContentSection />}
            {tab === "tiers"        && <TiersSection />}
        </div>
    );
}
"use client";

import { useEffect, useState } from "react";
import { Loader2, Check, Plus, Trash2, Pencil, X } from "lucide-react";

const GROUPS = ["hero", "stats", "contact", "footer", "social"];

const GROUP_LABELS: Record<string, string> = {
    hero: "Hero section",
    stats: "Statistics bar",
    contact: "Contact information",
    footer: "Footer",
    social: "Social proof",
};

export default function AdminCmsPage() {
    const [content, setContent] = useState<any[]>([]);
    const [testimonials, setTestimonials] = useState<any[]>([]);
    const [features, setFeatures] = useState<any[]>([]);
    const [cmsMedia, setCmsMedia] = useState<any[]>([]);
    const [pages, setPages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [edits, setEdits] = useState<Record<string, string>>({});
    const [activeGroup, setActiveGroup] = useState("hero");

    const [showTestimonialForm, setShowTestimonialForm] = useState(false);
    const [editingTestimonial, setEditingTestimonial] = useState<any>(null);
    const [tForm, setTForm] = useState({ quote: "", name: "", role: "", initials: "", isActive: true, sortOrder: 0 });
    const [tSaving, setTSaving] = useState(false);

    const [showFeatureForm, setShowFeatureForm] = useState(false);
    const [editingFeature, setEditingFeature] = useState<any>(null);
    const [featureForm, setFeatureForm] = useState({ icon: "", title: "", description: "", sortOrder: 1, isActive: true });

    const [editingPage, setEditingPage] = useState<any>(null);
    const [pageContent, setPageContent] = useState("");
    const [pageTitle, setPageTitle] = useState("");
    const [pageSaving, setPageSaving] = useState(false);

    const [deletingId, setDeletingId] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        Promise.all([
            fetch("/api/admin/cms").then((r) => r.json()),
            fetch("/api/admin/testimonials").then((r) => r.json()),
            fetch("/api/admin/cms/features").then((r) => r.json()),
            fetch("/api/admin/cms/media").then((r) => r.json()),
            fetch("/api/admin/cms/pages").then((r) => r.json()),
        ]).then(([c, t, f, m, p]) => {
            setContent(c);
            const initial: Record<string, string> = {};
            c.forEach((item: any) => { initial[item.key] = item.value; });
            setEdits(initial);
            setTestimonials(t);
            setFeatures(f);
            setCmsMedia(m);
            setPages(p);
            setLoading(false);
        });
    };

    useEffect(() => { load(); }, []);

    const handleSave = async () => {
        setSaving(true);
        const updates = Object.entries(edits).map(([key, value]) => ({ key, value }));
        await fetch("/api/admin/cms", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ updates }),
        });
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleTestimonialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTSaving(true);
        const url = editingTestimonial
            ? `/api/admin/testimonials/${editingTestimonial.id}`
            : "/api/admin/testimonials";
        const method = editingTestimonial ? "PATCH" : "POST";
        await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tForm),
        });
        setTSaving(false);
        setShowTestimonialForm(false);
        setEditingTestimonial(null);
        load();
    };

    const handleDeleteTestimonial = async (id: string) => {
        if (!confirm("Delete this testimonial?")) return;
        setDeletingId(id);
        await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
        setDeletingId(null);
        load();
    };

    const groupContent = content.filter((c) => c.group === activeGroup);
    const allTabs = [...GROUPS, "testimonials", "features", "media", "pages"];
    const isTextTab = !["testimonials", "features", "media", "pages"].includes(activeGroup);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 size={24} className="animate-spin text-[#3d8c47]" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-medium text-white">Site content</h1>
                    <p className="text-[#4a7a50] text-sm mt-1">Manage what appears on the public landing page</p>
                </div>
                {isTextTab && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 h-10 px-5 bg-[#1a3d1f] text-white text-sm font-medium rounded-xl hover:bg-[#2d5c35] transition-colors disabled:opacity-50"
                    >
                        {saving
                            ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
                            : saved
                                ? <><Check size={14} /> Saved!</>
                                : "Save changes"}
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {allTabs.map((g) => (
                    <button
                        key={g}
                        onClick={() => { setActiveGroup(g); setEditingPage(null); }}
                        className={`h-8 px-4 rounded-xl text-xs font-medium transition-colors capitalize ${
                            activeGroup === g
                                ? "bg-[#1a3d1f] text-white"
                                : "bg-[#1a2d1c] border border-[#2d5c35] text-[#4a7a50] hover:text-white"
                        }`}
                    >
                        {GROUP_LABELS[g] ?? g}
                    </button>
                ))}
            </div>

            {/* ── TEXT CONTENT ─────────────────────────────────────────────────────── */}
            {isTextTab && (
                <div className="bg-[#1a2d1c] border border-[#2d5c35] rounded-2xl p-6 flex flex-col gap-5">
                    {groupContent.length === 0 ? (
                        <p className="text-[#4a7a50] text-sm">No content items in this group.</p>
                    ) : groupContent.map((item) => (
                        <div key={item.key}>
                            <label className="text-xs text-[#4a7a50] mb-1.5 block font-medium">
                                {item.label}
                                <span className="ml-2 text-[#2d5c35] font-normal font-mono">{item.key}</span>
                            </label>
                            {(edits[item.key] ?? item.value).length > 80 ? (
                                <textarea
                                    value={edits[item.key] ?? item.value}
                                    onChange={(e) => setEdits((prev) => ({ ...prev, [item.key]: e.target.value }))}
                                    rows={3}
                                    className="w-full px-4 py-3 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white resize-none"
                                />
                            ) : (
                                <input
                                    value={edits[item.key] ?? item.value}
                                    onChange={(e) => setEdits((prev) => ({ ...prev, [item.key]: e.target.value }))}
                                    className="w-full h-11 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white"
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ── TESTIMONIALS ─────────────────────────────────────────────────────── */}
            {activeGroup === "testimonials" && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-[#4a7a50]">{testimonials.length} testimonials</p>
                        <button
                            onClick={() => {
                                setEditingTestimonial(null);
                                setTForm({ quote: "", name: "", role: "", initials: "", isActive: true, sortOrder: testimonials.length + 1 });
                                setShowTestimonialForm(true);
                            }}
                            className="flex items-center gap-2 h-9 px-4 bg-[#1a3d1f] text-white text-xs font-medium rounded-xl hover:bg-[#2d5c35] transition-colors"
                        >
                            <Plus size={14} /> Add testimonial
                        </button>
                    </div>

                    <div className="flex flex-col gap-4">
                        {testimonials.map((t) => (
                            <div key={t.id} className="bg-[#1a2d1c] border border-[#2d5c35] rounded-2xl p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-[#1a3d1f] flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
                                            {t.initials}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{t.name}</p>
                                            <p className="text-xs text-[#4a7a50]">{t.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-lg ${t.isActive ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
                      {t.isActive ? "Visible" : "Hidden"}
                    </span>
                                        <button
                                            onClick={() => {
                                                setEditingTestimonial(t);
                                                setTForm({ quote: t.quote, name: t.name, role: t.role, initials: t.initials, isActive: t.isActive, sortOrder: t.sortOrder });
                                                setShowTestimonialForm(true);
                                            }}
                                            className="p-1.5 hover:bg-[#1a3d1f] rounded-lg text-[#4a7a50] hover:text-white transition-colors"
                                        >
                                            <Pencil size={13} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTestimonial(t.id)}
                                            disabled={deletingId === t.id}
                                            className="p-1.5 hover:bg-red-900/30 rounded-lg text-[#4a7a50] hover:text-red-400 transition-colors"
                                        >
                                            {deletingId === t.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-[#7dd68a] italic">&ldquo;{t.quote}&rdquo;</p>
                            </div>
                        ))}
                    </div>

                    {showTestimonialForm && (
                        <div className="fixed inset-0 z-50 flex">
                            <div className="flex-1 bg-black/50" onClick={() => setShowTestimonialForm(false)} />
                            <div className="w-full max-w-md bg-[#1a2d1c] border-l border-[#2d5c35] h-full overflow-y-auto flex flex-col">
                                <div className="flex items-center justify-between p-6 border-b border-[#2d5c35]">
                                    <h2 className="text-base font-medium text-white">
                                        {editingTestimonial ? "Edit testimonial" : "Add testimonial"}
                                    </h2>
                                    <button onClick={() => setShowTestimonialForm(false)} className="p-2 hover:bg-[#1a3d1f] rounded-lg text-[#4a7a50]">
                                        <X size={18} />
                                    </button>
                                </div>
                                <form onSubmit={handleTestimonialSubmit} className="flex-1 p-6 flex flex-col gap-4">
                                    <div>
                                        <label className="text-xs text-[#4a7a50] mb-1.5 block">Quote</label>
                                        <textarea
                                            value={tForm.quote}
                                            onChange={(e) => setTForm((f) => ({ ...f, quote: e.target.value }))}
                                            rows={4} required
                                            className="w-full px-4 py-3 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white resize-none"
                                        />
                                    </div>
                                    {[
                                        { key: "name", label: "Full name", placeholder: "John Banda" },
                                        { key: "role", label: "Role & organisation", placeholder: "Farm Manager, Sunrise Estates" },
                                        { key: "initials", label: "Initials (2 letters)", placeholder: "JB", max: 2 },
                                    ].map(({ key, label, placeholder, max }) => (
                                        <div key={key}>
                                            <label className="text-xs text-[#4a7a50] mb-1.5 block">{label}</label>
                                            <input
                                                value={tForm[key as keyof typeof tForm] as string}
                                                onChange={(e) => setTForm((f) => ({ ...f, [key]: e.target.value }))}
                                                placeholder={placeholder} required maxLength={max}
                                                className="w-full h-11 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white placeholder-[#2d5c35]"
                                            />
                                        </div>
                                    ))}
                                    <div>
                                        <label className="text-xs text-[#4a7a50] mb-1.5 block">Sort order</label>
                                        <input
                                            type="number" min="1"
                                            value={tForm.sortOrder}
                                            onChange={(e) => setTForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                                            className="w-full h-11 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-[#111d13] rounded-xl">
                                        <p className="text-sm text-[#7dd68a]">Visible on landing page</p>
                                        <button
                                            type="button"
                                            onClick={() => setTForm((f) => ({ ...f, isActive: !f.isActive }))}
                                            className={`w-10 h-5 rounded-full transition-colors relative ${tForm.isActive ? "bg-[#3d8c47]" : "bg-[#2d5c35]"}`}
                                        >
                                            <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${tForm.isActive ? "translate-x-5" : "translate-x-0.5"}`} />
                                        </button>
                                    </div>
                                    <div className="flex gap-3 mt-auto pt-4">
                                        <button type="button" onClick={() => setShowTestimonialForm(false)}
                                                className="flex-1 h-12 border border-[#2d5c35] text-[#4a7a50] text-sm font-medium rounded-xl hover:bg-[#1a3d1f] transition-colors">
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={tSaving}
                                                className="flex-1 h-12 bg-[#1a3d1f] text-white text-sm font-medium rounded-xl hover:bg-[#2d5c35] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                            {tSaving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Check size={15} /> Save</>}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
            {activeGroup === "features" && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-[#4a7a50]">{features.length} features on landing page</p>
                        <button
                            onClick={() => {
                                setEditingFeature(null);
                                setFeatureForm({ icon: "", title: "", description: "", sortOrder: features.length + 1, isActive: true });
                                setShowFeatureForm(true);
                            }}
                            className="flex items-center gap-2 h-9 px-4 bg-[#1a3d1f] text-white text-xs font-medium rounded-xl hover:bg-[#2d5c35] transition-colors"
                        >
                            <Plus size={14} /> Add feature
                        </button>
                    </div>

                    <div className="flex flex-col gap-3">
                        {[...features].sort((a, b) => a.sortOrder - b.sortOrder).map((f) => (
                            <div key={f.id} className="bg-[#1a2d1c] border border-[#2d5c35] rounded-2xl p-5 flex items-start gap-4">
                                <div className="text-2xl flex-shrink-0">{f.icon}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-medium text-white">{f.title}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-lg ${f.isActive ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
                      {f.isActive ? "Visible" : "Hidden"}
                    </span>
                                        <span className="text-xs text-[#4a7a50]">#{f.sortOrder}</span>
                                    </div>
                                    <p className="text-xs text-[#4a7a50] leading-relaxed">{f.description}</p>
                                </div>
                                <div className="flex gap-1.5 flex-shrink-0">
                                    <button
                                        onClick={() => {
                                            setEditingFeature(f);
                                            setFeatureForm({ icon: f.icon, title: f.title, description: f.description, sortOrder: f.sortOrder, isActive: f.isActive });
                                            setShowFeatureForm(true);
                                        }}
                                        className="p-1.5 hover:bg-[#1a3d1f] rounded-lg text-[#4a7a50] hover:text-white transition-colors"
                                    >
                                        <Pencil size={13} />
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!confirm("Delete this feature?")) return;
                                            await fetch(`/api/admin/cms/features/${f.id}`, { method: "DELETE" });
                                            load();
                                        }}
                                        className="p-1.5 hover:bg-red-900/30 rounded-lg text-[#4a7a50] hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {showFeatureForm && (
                        <div className="fixed inset-0 z-50 flex">
                            <div className="flex-1 bg-black/50" onClick={() => setShowFeatureForm(false)} />
                            <div className="w-full max-w-md bg-[#1a2d1c] border-l border-[#2d5c35] h-full overflow-y-auto flex flex-col">
                                <div className="flex items-center justify-between p-6 border-b border-[#2d5c35]">
                                    <h2 className="text-base font-medium text-white">
                                        {editingFeature ? "Edit feature" : "Add feature"}
                                    </h2>
                                    <button onClick={() => setShowFeatureForm(false)} className="p-2 hover:bg-[#1a3d1f] rounded-lg text-[#4a7a50]">
                                        <X size={18} />
                                    </button>
                                </div>
                                <form
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        const url = editingFeature ? `/api/admin/cms/features/${editingFeature.id}` : "/api/admin/cms/features";
                                        const method = editingFeature ? "PATCH" : "POST";
                                        await fetch(url, {
                                            method,
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify(featureForm),
                                        });
                                        setShowFeatureForm(false);
                                        load();
                                    }}
                                    className="flex-1 p-6 flex flex-col gap-4"
                                >
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-xs text-[#4a7a50] mb-1.5 block">Icon (emoji)</label>
                                            <input
                                                value={featureForm.icon}
                                                onChange={(e) => setFeatureForm((f) => ({ ...f, icon: e.target.value }))}
                                                placeholder="🌱" required
                                                className="w-full h-11 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white text-center text-xl"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-[#4a7a50] mb-1.5 block">Sort order</label>
                                            <input
                                                type="number" min="1"
                                                value={featureForm.sortOrder}
                                                onChange={(e) => setFeatureForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 1 }))}
                                                className="w-full h-11 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white"
                                            />
                                        </div>
                                        <div className="flex items-end pb-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <button
                                                    type="button"
                                                    onClick={() => setFeatureForm((f) => ({ ...f, isActive: !f.isActive }))}
                                                    className={`w-9 h-5 rounded-full transition-colors relative ${featureForm.isActive ? "bg-[#3d8c47]" : "bg-[#2d5c35]"}`}
                                                >
                                                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${featureForm.isActive ? "translate-x-4" : "translate-x-0.5"}`} />
                                                </button>
                                                <span className="text-xs text-[#7dd68a]">Visible</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-[#4a7a50] mb-1.5 block">Title</label>
                                        <input
                                            value={featureForm.title}
                                            onChange={(e) => setFeatureForm((f) => ({ ...f, title: e.target.value }))}
                                            placeholder="Feature title" required
                                            className="w-full h-11 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-[#4a7a50] mb-1.5 block">Description</label>
                                        <textarea
                                            value={featureForm.description}
                                            onChange={(e) => setFeatureForm((f) => ({ ...f, description: e.target.value }))}
                                            rows={4} required
                                            className="w-full px-4 py-3 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white resize-none"
                                        />
                                    </div>
                                    <div className="flex gap-3 mt-auto pt-4">
                                        <button type="button" onClick={() => setShowFeatureForm(false)}
                                                className="flex-1 h-12 border border-[#2d5c35] text-[#4a7a50] text-sm font-medium rounded-xl hover:bg-[#1a3d1f] transition-colors">
                                            Cancel
                                        </button>
                                        <button type="submit"
                                                className="flex-1 h-12 bg-[#1a3d1f] text-white text-sm font-medium rounded-xl hover:bg-[#2d5c35] transition-colors flex items-center justify-center gap-2">
                                            <Check size={15} /> Save feature
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── MEDIA ────────────────────────────────────────────────────────────── */}
            {activeGroup === "media" && (
                <div className="bg-[#1a2d1c] border border-[#2d5c35] rounded-2xl p-6 flex flex-col gap-6">
                    <p className="text-xs text-[#4a7a50]">
                        Paste image or video URLs. For images use Unsplash, Cloudinary, etc.
                        For video, paste a direct .mp4 URL. The video overrides the image if both are set.
                        Leave blank to use the default background color.
                    </p>
                    {cmsMedia.map((m) => (
                        <div key={m.key}>
                            <label className="text-xs text-[#4a7a50] font-medium mb-2 block">{m.label}</label>
                            <div className="flex gap-3 items-start">
                                <input
                                    key={`${m.key}-${m.url}`}
                                    defaultValue={m.url}
                                    onBlur={async (e) => {
                                        await fetch("/api/admin/cms/media", {
                                            method: "PATCH",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ key: m.key, url: e.target.value, type: m.type }),
                                        });
                                        load();
                                    }}
                                    placeholder={m.type === "video" ? "https://example.com/video.mp4" : "https://example.com/image.jpg"}
                                    className="flex-1 h-11 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white placeholder-[#2d5c35]"
                                />
                                {m.url && m.type === "image" && (
                                    <img
                                        src={m.url} alt=""
                                        className="w-20 h-11 object-cover rounded-xl border border-[#2d5c35] flex-shrink-0"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                    />
                                )}
                                {m.url && m.type === "video" && (
                                    <video src={m.url} className="w-20 h-11 object-cover rounded-xl border border-[#2d5c35] flex-shrink-0" muted />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── PAGES ────────────────────────────────────────────────────────────── */}
            {activeGroup === "pages" && (
                <div>
                    {editingPage ? (
                        <div className="bg-[#1a2d1c] border border-[#2d5c35] rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-base font-medium text-white">{editingPage.title}</h3>
                                <button
                                    onClick={() => setEditingPage(null)}
                                    className="text-xs text-[#4a7a50] hover:text-white transition-colors"
                                >
                                    ← Back to pages
                                </button>
                            </div>
                            <div className="flex flex-col gap-4 mb-5">
                                <div>
                                    <label className="text-xs text-[#4a7a50] mb-1.5 block">Page title</label>
                                    <input
                                        value={pageTitle}
                                        onChange={(e) => setPageTitle(e.target.value)}
                                        className="w-full h-11 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-[#4a7a50] mb-1.5 block">
                                        Content <span className="text-[#2d5c35]">(Markdown supported)</span>
                                    </label>
                                    <textarea
                                        value={pageContent}
                                        onChange={(e) => setPageContent(e.target.value)}
                                        rows={22}
                                        className="w-full px-4 py-3 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white resize-none font-mono leading-relaxed"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={async () => {
                                    setPageSaving(true);
                                    await fetch(`/api/admin/cms/pages/${editingPage.slug}`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ title: pageTitle, content: pageContent }),
                                    });
                                    setPageSaving(false);
                                    setEditingPage(null);
                                    load();
                                }}
                                disabled={pageSaving}
                                className="h-10 px-6 bg-[#1a3d1f] text-white text-sm font-medium rounded-xl hover:bg-[#2d5c35] transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {pageSaving
                                    ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
                                    : <><Check size={14} /> Save page</>}
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pages.map((page) => (
                                <button
                                    key={page.slug}
                                    onClick={() => {
                                        setEditingPage(page);
                                        setPageContent(page.content);
                                        setPageTitle(page.title);
                                    }}
                                    className="bg-[#1a2d1c] border border-[#2d5c35] rounded-2xl p-5 text-left hover:border-[#3d8c47] transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-white">{page.title}</p>
                                        <span className="text-xs text-[#4a7a50] bg-[#111d13] px-2 py-0.5 rounded-lg font-mono">
                      /{page.slug}
                    </span>
                                    </div>
                                    <p className="text-xs text-[#4a7a50] leading-relaxed">
                                        {page.content.split("\n")[0].replace(/^#+\s*/, "").slice(0, 80)}...
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
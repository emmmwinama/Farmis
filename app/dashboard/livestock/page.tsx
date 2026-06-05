"use client";

import { useEffect, useState } from "react";
import {
    Plus, Loader2, X, Check, Pencil, Trash2,
    Heart, TrendingUp, ShoppingCart, AlertTriangle,
    Filter, ChevronDown, ChevronRight,
} from "lucide-react";
import Link from "next/link";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    Active:      { label: "Active",      bg: "#F0FDF4", text: "#14532D", dot: "#22C55E" },
    Sold:        { label: "Sold",        bg: "#EFF6FF", text: "#1E3A8A", dot: "#3B82F6" },
    Deceased:    { label: "Deceased",    bg: "#FFF1F2", text: "#9F1239", dot: "#E11D48" },
    Slaughtered: { label: "Slaughtered", bg: "#FFFBEB", text: "#78350F", dot: "#F59E0B" },
};

const SEX_ICONS: Record<string, string> = { Male: "♂", Female: "♀", Unknown: "?" };

const ACQ_TYPES = ["Born on farm", "Purchased", "Donated", "Gifted"];
const STATUSES  = ["Active", "Sold", "Deceased", "Slaughtered"];
const CATEGORIES = ["Large livestock", "Small livestock", "Poultry", "Aquaculture", "Other"];
const DEFAULT_TYPES = [
    { name: "Cattle",   category: "Large livestock", icon: "🐄" },
    { name: "Goats",    category: "Small livestock", icon: "🐐" },
    { name: "Sheep",    category: "Small livestock", icon: "🐑" },
    { name: "Pigs",     category: "Small livestock", icon: "🐖" },
    { name: "Chickens", category: "Poultry",         icon: "🐔" },
    { name: "Ducks",    category: "Poultry",         icon: "🦆" },
    { name: "Rabbits",  category: "Small livestock", icon: "🐇" },
    { name: "Fish",     category: "Aquaculture",     icon: "🐟" },
];

function fmt(n: number) { return new Intl.NumberFormat("en-MW").format(Math.round(n)); }
function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const emptyAnimalForm = {
    livestockTypeId: "", tag: "", name: "", group: "", sex: "Unknown",
    breed: "", colour: "", birthDate: "", acquisitionDate: new Date().toISOString().split("T")[0],
    acquisitionType: "Born on farm", acquisitionCost: "", weight: "", notes: "",
};

const emptyTypeForm = { name: "", category: "Large livestock", icon: "🐄" };

export default function LivestockPage() {
    const [data, setData]             = useState<any>(null);
    const [stats, setStats]           = useState<any>(null);
    const [loading, setLoading]       = useState(true);
    const [typeFilter, setTypeFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("Active");
    const [groupFilter, setGroupFilter]   = useState("All");

    const [showAnimalForm, setShowAnimalForm]   = useState(false);
    const [showTypeForm, setShowTypeForm]       = useState(false);
    const [editingAnimal, setEditingAnimal]     = useState<any>(null);
    const [animalForm, setAnimalForm]           = useState({ ...emptyAnimalForm });
    const [typeForm, setTypeForm]               = useState({ ...emptyTypeForm });
    const [saving, setSaving]     = useState(false);
    const [error, setError]       = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        Promise.all([
            fetch("/api/livestock/animals").then((r) => r.json()),
            fetch("/api/livestock/stats").then((r) => r.json()),
        ]).then(([d, s]) => { setData(d); setStats(s); setLoading(false); });
    };

    useEffect(() => { load(); }, []);

    const setA = (k: string, v: string) => setAnimalForm((f) => ({ ...f, [k]: v }));

    const filtered = (data?.animals ?? []).filter((a: any) => {
        if (typeFilter !== "All" && a.typeName !== typeFilter) return false;
        if (statusFilter !== "All" && a.status !== statusFilter) return false;
        if (groupFilter !== "All" && a.group !== groupFilter) return false;
        return true;
    });

    const openAdd = () => {
        setEditingAnimal(null);
        setAnimalForm({ ...emptyAnimalForm });
        setError("");
        setShowAnimalForm(true);
    };

    const openEdit = (animal: any) => {
        setEditingAnimal(animal);
        setAnimalForm({
            livestockTypeId: animal.livestockTypeId,
            tag:             animal.tag ?? "",
            name:            animal.name ?? "",
            group:           animal.group ?? "",
            sex:             animal.sex,
            breed:           animal.breed ?? "",
            colour:          animal.colour ?? "",
            birthDate:       animal.birthDate ? new Date(animal.birthDate).toISOString().split("T")[0] : "",
            acquisitionDate: animal.acquisitionDate ? new Date(animal.acquisitionDate).toISOString().split("T")[0] : "",
            acquisitionType: animal.acquisitionType,
            acquisitionCost: animal.acquisitionCost?.toString() ?? "",
            weight:          animal.weight?.toString() ?? "",
            notes:           animal.notes ?? "",
        });
        setError("");
        setShowAnimalForm(true);
    };

    const handleAnimalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        const url    = editingAnimal ? `/api/livestock/animals/${editingAnimal.id}` : "/api/livestock/animals";
        const method = editingAnimal ? "PATCH" : "POST";
        const res    = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(animalForm),
        });
        const d = await res.json();
        if (!res.ok) { setError(d.error); setSaving(false); }
        else { setShowAnimalForm(false); load(); }
    };

    const handleTypeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const res = await fetch("/api/livestock/types", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(typeForm),
        });
        const d = await res.json();
        if (!res.ok) { setError(d.error); setSaving(false); }
        else { setShowTypeForm(false); setTypeForm({ ...emptyTypeForm }); load(); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this animal record? This cannot be undone.")) return;
        setDeletingId(id);
        await fetch(`/api/livestock/animals/${id}`, { method: "DELETE" });
        setDeletingId(null);
        load();
    };

    const allTypes  = data?.allTypes  ?? [];
    const groups    = data?.groups    ?? [];
    const groupings = (data?.byType   ?? []) as any[];

    // @ts-ignore
    // @ts-ignore
    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in">

            {/* Header */}
            <div className="page-header flex items-start justify-between">
                <div>
                    <h1 className="page-title">Animal Husbandry</h1>
                    <p className="page-subtitle">
                        {stats?.totals?.total ?? 0} animals total ·
                        {" "}{stats?.totals?.active ?? 0} active
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { setTypeForm({ ...emptyTypeForm }); setShowTypeForm(true); }}
                            className="btn-secondary text-xs">
                        <Plus size={14} /> Livestock type
                    </button>
                    <button onClick={openAdd} className="btn-primary">
                        <Plus size={15} /> Add animal
                    </button>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: "Total animals",    value: String(stats?.totals?.total    ?? 0), color: "#1a3d1f" },
                    { label: "Active",           value: String(stats?.totals?.active   ?? 0), color: "#16A34A" },
                    { label: "Total expenses",   value: `MWK ${fmt(stats?.financial?.totalExpenses   ?? 0)}`, color: "#DC2626" },
                    { label: "Total revenue",    value: `MWK ${fmt(stats?.financial?.totalRevenue + stats?.financial?.totalProduction ?? 0)}`, color: "#2563EB" },
                ].map(({ label, value, color }) => (
                    <div key={label} className="stat-card">
                        <p className="metric-label">{label}</p>
                        <p className="metric-value" style={{ color }}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Upcoming health alerts */}
            {(stats?.upcomingHealthCount ?? 0) > 0 && (
                <div className="rounded-2xl p-4 mb-6 flex items-center gap-3"
                     style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A" }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                         style={{ background: "#FEF3C7" }}>
                        <AlertTriangle size={16} style={{ color: "#D97706" }} />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold" style={{ color: "#92400E" }}>
                            {stats.upcomingHealthCount} health procedure{stats.upcomingHealthCount !== 1 ? "s" : ""} due in the next 30 days
                        </p>
                        <p className="text-xs" style={{ color: "#A16207" }}>
                            {stats.upcomingHealth.slice(0, 2).map((h: any) => `${h.type} due ${fmtDate(h.nextDueDate)}`).join(" · ")}
                        </p>
                    </div>
                    <Link href="/dashboard/livestock/health" className="btn-secondary text-xs">
                        View schedule
                    </Link>
                </div>
            )}

            {/* By type summary */}
            {groupings.length > 0 && (
                <div className="flex gap-3 mb-6 flex-wrap">
                    <button
                        onClick={() => setTypeFilter("All")}
                        className={`flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-bold transition-all ${typeFilter === "All" ? "text-white" : "btn-secondary"}`}
                        style={typeFilter === "All" ? { background: "linear-gradient(135deg, #1a3d1f, #2d6a35)", color: "white" } : {}}>
                        All types
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{ background: typeFilter === "All" ? "rgba(255,255,255,0.2)" : "var(--bg-muted)" }}>
              {stats?.totals?.active ?? 0}
            </span>
                    </button>
                    {groupings.map((t: any) => (
                        <button key={t.name}
                                onClick={() => setTypeFilter(typeFilter === t.name ? "All" : t.name)}
                                className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-bold transition-all"
                                style={{
                                    background: typeFilter === t.name ? "linear-gradient(135deg, #1a3d1f, #2d6a35)" : "var(--bg-card)",
                                    color:      typeFilter === t.name ? "white" : "var(--text-secondary)",
                                    border:     `1.5px solid ${typeFilter === t.name ? "transparent" : "var(--border)"}`,
                                }}>
                            <span>{t.icon}</span>
                            {t.name}
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                  style={{ background: typeFilter === t.name ? "rgba(255,255,255,0.2)" : "var(--bg-muted)" }}>
                {t.active}
              </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex gap-2">
                    {["All", ...STATUSES].map((s) => (
                        <button key={s} onClick={() => setStatusFilter(s)}
                                className="h-9 px-4 rounded-xl text-sm font-bold transition-all"
                                style={{
                                    background: statusFilter === s ? "var(--text-primary)" : "var(--bg-card)",
                                    color:      statusFilter === s ? "var(--bg-page)"    : "var(--text-secondary)",
                                    border:     `1.5px solid ${statusFilter === s ? "var(--text-primary)" : "var(--border)"}`,
                                }}>
                            {s}
                        </button>
                    ))}
                </div>

                {groups.length > 0 && (
                    <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} className="input h-9 w-auto px-3 text-sm">
                        <option value="All">All groups</option>
                        {groups.map((g: string) => <option key={g}>{g}</option>)}
                    </select>
                )}
            </div>

            {/* Animals grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={24} className="animate-spin" style={{ color: "var(--farm-green)" }} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="rounded-3xl p-16 text-center"
                     style={{ background: "var(--bg-card)", border: "1.5px dashed var(--border)" }}>
                    <div className="empty-state">
                        <div className="empty-icon">
                            <span className="text-3xl">🐄</span>
                        </div>
                        <p className="section-title mb-2">No animals found</p>
                        <p className="section-subtitle mb-6">
                            {allTypes.length === 0
                                ? "Add a livestock type first, then register your animals"
                                : "Add your first animal or adjust the filters"}
                        </p>
                        {allTypes.length === 0 ? (
                            <button onClick={() => setShowTypeForm(true)} className="btn-primary">
                                <Plus size={15} /> Add livestock type
                            </button>
                        ) : (
                            <button onClick={openAdd} className="btn-primary">
                                <Plus size={15} /> Add animal
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map((animal: any) => {
                        const sc = STATUS_CONFIG[animal.status] ?? STATUS_CONFIG.Active;
                        const hasHealthAlert = animal.lastHealth?.nextDueDate &&
                            new Date(animal.lastHealth.nextDueDate) <= new Date(Date.now() + 30 * 86400000);

                        return (
                            <div key={animal.id}
                                 className="card card-hover group relative overflow-hidden cursor-pointer"
                                 onClick={() => window.location.href = `/dashboard/livestock/${animal.id}`}>

                                {/* Type color strip */}
                                <div className="h-1.5 w-full"
                                     style={{ background: "linear-gradient(90deg, var(--farm-green), var(--farm-light))" }} />

                                <div className="p-4">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{animal.typeIcon}</span>
                                            <div>
                                                <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                                                    {animal.name || animal.tag || `${animal.typeName} #${animal.id.slice(-4)}`}
                                                </p>
                                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                    {animal.typeName}
                                                    {animal.breed ? ` · ${animal.breed}` : ""}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1"
                                             onClick={(e) => { e.stopPropagation(); }}>
                                            {hasHealthAlert && (
                                                <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                                                     style={{ background: "#FEF3C7" }}>
                                                    <Heart size={11} style={{ color: "#D97706" }} />
                                                </div>
                                            )}
                                            <button onClick={(e) => { e.stopPropagation(); openEdit(animal); }}
                                                    className="w-6 h-6 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                                                    style={{ background: "var(--bg-subtle)", color: "var(--text-muted)" }}>
                                                <Pencil size={11} />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(animal.id); }}
                                                    disabled={deletingId === animal.id}
                                                    className="w-6 h-6 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                                                    style={{ background: "var(--bg-subtle)", color: "var(--text-muted)" }}>
                                                {deletingId === animal.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Details grid */}
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        {[
                                            { label: "Tag",    value: animal.tag   || "—" },
                                            { label: "Sex",    value: `${SEX_ICONS[animal.sex] ?? "?"} ${animal.sex}` },
                                            { label: "Group",  value: animal.group || "—" },
                                            { label: "Weight", value: animal.lastWeight ? `${animal.lastWeight.weight} kg` : animal.weight ? `${animal.weight} kg` : "—" },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="rounded-xl p-2.5"
                                                 style={{ background: "var(--bg-subtle)" }}>
                                                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</p>
                                                <p className="text-xs font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>{value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Status + acquisition */}
                                    <div className="flex items-center justify-between">
                    <span className="badge"
                          style={{ background: sc.bg, color: sc.text }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sc.dot }} />
                        {sc.label}
                    </span>
                                        {animal.offspringCount > 0 && (
                                            <span className="badge badge-warm">
                        {animal.offspringCount} offspring
                      </span>
                                        )}
                                    </div>

                                    {/* Production indicator */}
                                    {animal.recentProduction?.length > 0 && (
                                        <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                                            <div className="flex items-center gap-1.5">
                                                <TrendingUp size={11} style={{ color: "#16A34A" }} />
                                                <p className="text-xs font-semibold" style={{ color: "#16A34A" }}>
                                                    {animal.recentProduction[0].type}: {animal.recentProduction[0].quantity} {animal.recentProduction[0].unit}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add/Edit Animal Form */}
            {showAnimalForm && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setShowAnimalForm(false)} />
                    <div className="w-full max-w-lg panel h-full overflow-y-auto flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between p-6" style={{ borderBottom: "1px solid var(--border)" }}>
                            <h2 className="section-title">{editingAnimal ? "Edit animal" : "Register animal"}</h2>
                            <button onClick={() => setShowAnimalForm(false)}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                                    style={{ background: "var(--bg-subtle)", color: "var(--text-muted)" }}>
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleAnimalSubmit} className="flex-1 p-6 flex flex-col gap-4">
                            {/* Livestock type */}
                            <div>
                                <label className="form-label">Livestock type *</label>
                                <select value={animalForm.livestockTypeId} onChange={(e) => setA("livestockTypeId", e.target.value)}
                                        required className="input">
                                    <option value="">Select type...</option>
                                    {allTypes.map((t: any) => (
                                        <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Tag & name */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="form-label">Tag / ID number</label>
                                    <input value={animalForm.tag} onChange={(e) => setA("tag", e.target.value)}
                                           placeholder="e.g. A-001" className="input" />
                                </div>
                                <div>
                                    <label className="form-label">Name (optional)</label>
                                    <input value={animalForm.name} onChange={(e) => setA("name", e.target.value)}
                                           placeholder="e.g. Bessie" className="input" />
                                </div>
                            </div>

                            {/* Group & sex */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="form-label">Herd/flock group</label>
                                    <input value={animalForm.group} onChange={(e) => setA("group", e.target.value)}
                                           placeholder="e.g. Dairy herd A" className="input" />
                                </div>
                                <div>
                                    <label className="form-label">Sex</label>
                                    <select value={animalForm.sex} onChange={(e) => setA("sex", e.target.value)} className="input">
                                        {["Male", "Female", "Unknown"].map((s) => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Breed & colour */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="form-label">Breed</label>
                                    <input value={animalForm.breed} onChange={(e) => setA("breed", e.target.value)}
                                           placeholder="e.g. Friesian" className="input" />
                                </div>
                                <div>
                                    <label className="form-label">Colour / markings</label>
                                    <input value={animalForm.colour} onChange={(e) => setA("colour", e.target.value)}
                                           placeholder="e.g. Black & white" className="input" />
                                </div>
                            </div>

                            {/* Birth & acquisition */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="form-label">Date of birth</label>
                                    <input type="date" value={animalForm.birthDate} onChange={(e) => setA("birthDate", e.target.value)}
                                           className="input" />
                                </div>
                                <div>
                                    <label className="form-label">Acquisition date</label>
                                    <input type="date" value={animalForm.acquisitionDate} onChange={(e) => setA("acquisitionDate", e.target.value)}
                                           className="input" />
                                </div>
                            </div>

                            {/* Acquisition type & cost */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="form-label">How acquired</label>
                                    <select value={animalForm.acquisitionType} onChange={(e) => setA("acquisitionType", e.target.value)}
                                            className="input">
                                        {ACQ_TYPES.map((t) => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Purchase cost (MWK)</label>
                                    <input type="number" min="0" step="1" value={animalForm.acquisitionCost}
                                           onChange={(e) => setA("acquisitionCost", e.target.value)}
                                           placeholder="0" className="input"
                                           disabled={animalForm.acquisitionType !== "Purchased"} />
                                </div>
                            </div>

                            {/* Weight */}
                            <div>
                                <label className="form-label">Weight at acquisition (kg)</label>
                                <input type="number" min="0" step="0.1" value={animalForm.weight}
                                       onChange={(e) => setA("weight", e.target.value)} placeholder="e.g. 250" className="input" />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="form-label">Notes (optional)</label>
                                <textarea value={animalForm.notes} onChange={(e) => setA("notes", e.target.value)}
                                          rows={2} placeholder="Any notes about this animal..."
                                          className="input h-auto py-3 resize-none" />
                            </div>

                            {/* Status (edit only) */}
                            {editingAnimal && (
                                <div>
                                    <label className="form-label">Status</label>
                                    <select value={animalForm.sex} onChange={(e) => setA("sex", e.target.value)} className="input">
                                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                            )}

                            {error && (
                                <p className="text-sm font-semibold px-4 py-3 rounded-xl"
                                   style={{ background: "var(--error-bg)", color: "var(--error-text)" }}>
                                    {error}
                                </p>
                            )}

                            <div className="flex gap-3 mt-auto pt-4">
                                <button type="button" onClick={() => setShowAnimalForm(false)} className="btn-secondary flex-1 h-12">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="btn-primary flex-1 h-12">
                                    {saving
                                        ? <><Loader2 size={15} className="animate-spin" /> Saving...</>
                                        : <><Check size={15} /> {editingAnimal ? "Update" : "Register animal"}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add livestock type form */}
            {showTypeForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="flex-1 absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowTypeForm(false)} />
                    <div className="relative w-full max-w-sm rounded-3xl shadow-2xl z-10 p-6"
                         style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                        <h2 className="section-title mb-5">Add livestock type</h2>

                        <form onSubmit={handleTypeSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="form-label">Name *</label>
                                <div className="flex gap-2">
                                    <input value={typeForm.icon} onChange={(e) => setTypeForm((f) => ({ ...f, icon: e.target.value }))}
                                           className="input w-16 text-center text-xl" placeholder="🐄" maxLength={2} />
                                    <input value={typeForm.name} onChange={(e) => setTypeForm((f) => ({ ...f, name: e.target.value }))}
                                           placeholder="e.g. Donkeys" required className="input flex-1" />
                                </div>
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    {DEFAULT_TYPES.map((t) => (
                                        <button key={t.name} type="button"
                                                onClick={() => setTypeForm({ name: t.name, category: t.category, icon: t.icon })}
                                                className="text-xs px-2.5 py-1.5 rounded-xl font-bold transition-all"
                                                style={{ background: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                                            {t.icon} {t.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Category *</label>
                                <select value={typeForm.category} onChange={(e) => setTypeForm((f) => ({ ...f, category: e.target.value }))}
                                        required className="input">
                                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                                </select>
                            </div>

                            <div className="flex gap-3 mt-2">
                                <button type="button" onClick={() => setShowTypeForm(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" disabled={saving} className="btn-primary flex-1">
                                    {saving ? <Loader2 size={14} className="animate-spin" /> : "Add type"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
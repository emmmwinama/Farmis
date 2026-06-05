"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, Map, Pencil, Trash2, X, Check, Leaf } from "lucide-react";
import Link from "next/link";

function fmtHa(n: number) {
    return `${n.toFixed(2)} ha`;
}
function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const SOIL_TYPES = ["Clay", "Sandy", "Loam", "Silty", "Peaty", "Chalky", "Mixed"];

type FieldForm = {
    name:            string;
    totalArea:       string;
    cultivatableArea: string;
    soilType:        string;
    notes:           string;
};

const EMPTY_FORM: FieldForm = {
    name:             "",
    totalArea:        "",
    cultivatableArea: "",
    soilType:         "Loam",
    notes:            "",
};

export default function FieldsPage() {
    const [fields,      setFields]      = useState<any[]>([]);
    const [loading,     setLoading]     = useState(true);
    const [showForm,    setShowForm]    = useState(false);
    const [editingField, setEditingField] = useState<any>(null);
    const [form,        setForm]        = useState<FieldForm>({ ...EMPTY_FORM });
    const [saving,      setSaving]      = useState(false);
    const [error,       setError]       = useState("");
    const [deletingId,  setDeletingId]  = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const res  = await fetch("/api/fields");
            const data = await res.json();
            setFields(Array.isArray(data) ? data : []);
        } catch {
            setFields([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const setF = <K extends keyof FieldForm>(k: K, v: FieldForm[K]) =>
        setForm((p) => ({ ...p, [k]: v }));

    const openAdd = () => {
        setEditingField(null);
        setForm({ ...EMPTY_FORM });
        setError("");
        setShowForm(true);
    };

    const openEdit = (field: any) => {
        setEditingField(field);
        setForm({
            name:             field.name             ?? "",
            totalArea:        String(field.totalArea  ?? ""),
            cultivatableArea: String(field.cultivatableArea ?? ""),
            soilType:         field.soilType          ?? "Loam",
            notes:            field.notes             ?? "",
        });
        setError("");
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        const url    = editingField ? `/api/fields/${editingField.id}` : "/api/fields";
        const method = editingField ? "PATCH" : "POST";

        const payload = {
            name:             form.name,
            totalArea:        parseFloat(form.totalArea)        || 0,
            cultivatableArea: parseFloat(form.cultivatableArea) || parseFloat(form.totalArea) || 0,
            soilType:         form.soilType,
            notes:            form.notes || null,
        };

        try {
            const res  = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify(payload),
            });
            const text = await res.text();
            const d    = text ? JSON.parse(text) : {};
            if (!res.ok) { setError(d.error ?? `Failed (${res.status})`); setSaving(false); return; }
            setShowForm(false);
            load();
        } catch (err: any) {
            setError(err.message ?? "Unexpected error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this field and all its data? This cannot be undone.")) return;
        setDeletingId(id);
        try {
            await fetch(`/api/fields/${id}`, { method: "DELETE" });
        } finally {
            setDeletingId(null);
            load();
        }
    };

    const totalHa     = fields.reduce((s, f) => s + (f.totalArea ?? 0), 0);
    const mappedCount = fields.filter((f) => f.boundary).length;

    return (
        <div className="p-8 max-w-6xl mx-auto">

            {/* Header */}
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)", letterSpacing: "-0.04em" }}>
                        Fields
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                        {fields.length} field{fields.length !== 1 ? "s" : ""} ·{" "}
                        {fmtHa(totalHa)} total ·{" "}
                        {mappedCount} mapped
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/map"
                          className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-bold transition-all"
                          style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                        <Map size={15} /> Farm map
                    </Link>
                    <button onClick={openAdd}
                            className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                            style={{ background: "var(--farm-green)", boxShadow: "0 4px 12px rgba(26,61,31,0.3)" }}>
                        <Plus size={15} /> Add field
                    </button>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                    { label: "Total fields",  value: String(fields.length),  color: "var(--farm-green)" },
                    { label: "Total area",    value: fmtHa(totalHa),         color: "#2563EB" },
                    { label: "GPS mapped",    value: `${mappedCount} / ${fields.length}`, color: "#D97706" },
                ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-2xl p-5"
                         style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                            {label}
                        </p>
                        <p className="text-3xl font-black" style={{ color }}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Fields grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={24} className="animate-spin" style={{ color: "var(--farm-green)" }} />
                </div>
            ) : fields.length === 0 ? (
                <div className="rounded-2xl p-16 text-center"
                     style={{ background: "var(--bg-card)", border: "1.5px dashed var(--border)" }}>
                    <p className="text-5xl mb-4">🌾</p>
                    <p className="text-base font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                        No fields yet
                    </p>
                    <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                        Add your first field to start tracking crops and activities.
                    </p>
                    <button onClick={openAdd}
                            className="px-6 py-3 rounded-xl text-sm font-bold text-white"
                            style={{ background: "var(--farm-green)" }}>
                        Add first field
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {fields.map((field) => (
                        <div key={field.id} className="rounded-2xl overflow-hidden flex flex-col"
                             style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>

                            {/* Card header */}
                            <div className="p-5 flex-1">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                             style={{ background: "var(--farm-pale)" }}>
                                            <Leaf size={16} style={{ color: "var(--farm-green)" }} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black" style={{ color: "var(--text-primary)" }}>
                                                {field.name}
                                            </h3>
                                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                {field.soilType} soil
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full"
                                          style={{
                                              background: field.boundary ? "#ECFDF5" : "var(--bg-subtle)",
                                              color:      field.boundary ? "#059669" : "var(--text-muted)",
                                          }}>
                                        {field.boundary ? "Mapped" : "No boundary"}
                                    </span>
                                </div>

                                {/* Area stats */}
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div className="rounded-xl p-2.5"
                                         style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                                        <p className="text-[9px] font-black uppercase tracking-wide mb-0.5"
                                           style={{ color: "var(--text-muted)" }}>Total area</p>
                                        <p className="text-sm font-black" style={{ color: "var(--farm-green)" }}>
                                            {fmtHa(field.totalArea)}
                                        </p>
                                    </div>
                                    <div className="rounded-xl p-2.5"
                                         style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                                        <p className="text-[9px] font-black uppercase tracking-wide mb-0.5"
                                           style={{ color: "var(--text-muted)" }}>Cultivatable</p>
                                        <p className="text-sm font-black" style={{ color: "var(--text-primary)" }}>
                                            {fmtHa(field.cultivatableArea)}
                                        </p>
                                    </div>
                                </div>

                                {/* Active crops */}
                                {field.cropFields?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {field.cropFields.slice(0, 3).map((cf: any) => (
                                            <span key={cf.id}
                                                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                  style={{ background: "var(--farm-pale)", color: "var(--farm-green)" }}>
                                                {cf.cropType?.name ?? cf.cropTypeName}
                                            </span>
                                        ))}
                                        {field.cropFields.length > 3 && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                  style={{ background: "var(--bg-subtle)", color: "var(--text-muted)" }}>
                                                +{field.cropFields.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                )}

                                {field.notes && (
                                    <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>
                                        {field.notes}
                                    </p>
                                )}
                            </div>

                            {/* Card footer */}
                            <div className="flex items-center justify-between px-5 py-3"
                                 style={{ borderTop: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                    Added {fmtDate(field.createdAt)}
                                </p>
                                <div className="flex items-center gap-1.5">
                                    {/* Map button */}
                                    <Link href={`/dashboard/fields/${field.id}/map`}
                                          className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all"
                                          style={{ background: "var(--farm-pale)", color: "var(--farm-green)" }}>
                                        <Map size={11} />
                                        {field.boundary ? "Map" : "Draw"}
                                    </Link>
                                    {/* Edit */}
                                    <button onClick={() => openEdit(field)}
                                            className="p-1.5 rounded-lg transition-all"
                                            style={{ background: "var(--bg-subtle)", color: "var(--text-muted)" }}
                                            onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--border)"; }}
                                            onMouseOut={(e)  => { (e.currentTarget as HTMLElement).style.background = "var(--bg-subtle)"; }}>
                                        <Pencil size={13} />
                                    </button>
                                    {/* Delete */}
                                    <button onClick={() => handleDelete(field.id)}
                                            disabled={deletingId === field.id}
                                            className="p-1.5 rounded-lg transition-all"
                                            style={{ background: "#FFF1F2", color: "#E11D48" }}>
                                        {deletingId === field.id
                                            ? <Loader2 size={13} className="animate-spin" />
                                            : <Trash2 size={13} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Add / Edit form slide-over ──────────────────────────────────── */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setShowForm(false)} />
                    <div className="w-full max-w-md h-full flex flex-col shadow-2xl"
                         style={{ background: "var(--bg-card)", borderLeft: "1px solid var(--border)" }}>

                        {/* Panel header */}
                        <div className="flex items-center justify-between px-6 py-5 flex-shrink-0"
                             style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                            <div>
                                <h2 className="text-base font-black" style={{ color: "var(--text-primary)" }}>
                                    {editingField ? "Edit field" : "Add new field"}
                                </h2>
                                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                                    {editingField ? "Update field details" : "Fill in the field details below"}
                                </p>
                            </div>
                            <button onClick={() => setShowForm(false)}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                                    style={{ background: "var(--bg-subtle)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                                <X size={15} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                           style={{ color: "var(--text-muted)" }}>
                                        Field name *
                                    </label>
                                    <input
                                        value={form.name}
                                        onChange={(e) => setF("name", e.target.value)}
                                        placeholder="e.g. North field, Block A"
                                        required
                                        className="w-full h-11 px-3 rounded-xl text-sm outline-none"
                                        style={{ border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-primary)" }}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                               style={{ color: "var(--text-muted)" }}>
                                            Total area (ha) *
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={form.totalArea}
                                            onChange={(e) => setF("totalArea", e.target.value)}
                                            placeholder="e.g. 2.5"
                                            required
                                            className="w-full h-11 px-3 rounded-xl text-sm outline-none"
                                            style={{ border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-primary)" }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                               style={{ color: "var(--text-muted)" }}>
                                            Cultivatable (ha)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={form.cultivatableArea}
                                            onChange={(e) => setF("cultivatableArea", e.target.value)}
                                            placeholder="Same as total"
                                            className="w-full h-11 px-3 rounded-xl text-sm outline-none"
                                            style={{ border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-primary)" }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                           style={{ color: "var(--text-muted)" }}>
                                        Soil type
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {SOIL_TYPES.map((s) => (
                                            <button key={s} type="button"
                                                    onClick={() => setF("soilType", s)}
                                                    className="py-2 rounded-xl text-xs font-bold transition-all"
                                                    style={{
                                                        background: form.soilType === s ? "var(--farm-pale)"   : "var(--bg-subtle)",
                                                        color:      form.soilType === s ? "var(--farm-green)"  : "var(--text-muted)",
                                                        border:     `1.5px solid ${form.soilType === s ? "var(--farm-green)" : "var(--border)"}`,
                                                    }}>
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                           style={{ color: "var(--text-muted)" }}>
                                        Notes (optional)
                                    </label>
                                    <textarea
                                        value={form.notes}
                                        onChange={(e) => setF("notes", e.target.value)}
                                        rows={3}
                                        placeholder="Any additional details about this field..."
                                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                                        style={{ border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-primary)" }}
                                    />
                                </div>

                                {error && (
                                    <div className="rounded-xl px-4 py-3 flex items-start gap-2"
                                         style={{ background: "#FFF1F2", border: "1px solid #FFE4E6" }}>
                                        <X size={13} className="flex-shrink-0 mt-0.5" style={{ color: "#E11D48" }} />
                                        <p className="text-sm font-semibold" style={{ color: "#9F1239" }}>{error}</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex gap-3 p-6 flex-shrink-0"
                                 style={{ borderTop: "1px solid var(--border)", background: "var(--bg-card)" }}>
                                <button type="button" onClick={() => setShowForm(false)}
                                        className="flex-1 h-11 rounded-xl font-bold text-sm"
                                        style={{ border: "1.5px solid var(--border)", color: "var(--text-muted)" }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                        className="flex-1 h-11 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
                                        style={{ background: saving ? "#94A3B8" : "var(--farm-green)" }}>
                                    {saving
                                        ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
                                        : <><Check size={14} /> {editingField ? "Save changes" : "Add field"}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
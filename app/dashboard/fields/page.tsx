"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, X, Check, MapPin, Layers } from "lucide-react";

const SOIL_TYPES = ["Clay", "Sandy", "Loam", "Silty", "Sandy loam", "Clay loam", "Silt loam", "Peaty", "Chalky"];

const emptyForm = {
    name: "", totalArea: "", cultivatableArea: "", soilType: "Loam",
    locationLat: "", locationLng: "", notes: "",
};

function fmt(n: number) { return new Intl.NumberFormat("en-MW").format(Math.round(n)); }

export default function FieldsPage() {
    const [fields, setFields] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingField, setEditingField] = useState<any>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        fetch("/api/fields").then((r) => r.json()).then((d) => { setFields(d); setLoading(false); });
    };

    useEffect(() => { load(); }, []);

    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

    const openAdd = () => { setEditingField(null); setForm(emptyForm); setError(""); setShowForm(true); };
    const openEdit = (field: any) => {
        setEditingField(field);
        setForm({
            name: field.name, totalArea: field.totalArea.toString(),
            cultivatableArea: field.cultivatableArea.toString(),
            soilType: field.soilType ?? "Loam",
            locationLat: field.locationLat?.toString() ?? "",
            locationLng: field.locationLng?.toString() ?? "",
            notes: field.notes ?? "",
        });
        setError(""); setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true); setError("");
        const url = editingField ? `/api/fields/${editingField.id}` : "/api/fields";
        const method = editingField ? "PATCH" : "POST";
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        const d = await res.json();
        if (!res.ok) { setError(d.error); setSaving(false); } else { setShowForm(false); load(); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this field and all its records?")) return;
        setDeletingId(id);
        await fetch(`/api/fields/${id}`, { method: "DELETE" });
        setDeletingId(null); load();
    };

    const totalArea = fields.reduce((s, f) => s + f.totalArea, 0);
    const totalAllocated = fields.reduce((s, f) => s + f.allocatedArea, 0);

    return (
        <div className="p-8 max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Fields</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {fields.length} fields · {totalArea.toFixed(1)} ha total · {totalAllocated.toFixed(1)} ha planted
                    </p>
                </div>
                <button onClick={openAdd}
                        className="flex items-center gap-2 h-10 px-5 bg-[#1a3d1f] text-white text-sm font-bold rounded-xl hover:bg-[#2d5c35] transition-colors hover:shadow-lg hover:shadow-[#1a3d1f]/20">
                    <Plus size={16} /> Add field
                </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                    { label: "Total land", value: `${totalArea.toFixed(1)} ha` },
                    { label: "Planted area", value: `${totalAllocated.toFixed(1)} ha` },
                    { label: "Available", value: `${(fields.reduce((s, f) => s + f.cultivatableArea, 0) - totalAllocated).toFixed(1)} ha` },
                ].map(({ label, value }) => (
                    <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                        <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">{label}</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
                    </div>
                ))}
            </div>

            {/* Fields grid */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-slate-400" /></div>
            ) : fields.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                        <MapPin size={28} className="text-slate-400" />
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white text-lg mb-2">No fields yet</p>
                    <p className="text-slate-400 text-sm mb-6">Add your first field to start tracking crops and activities</p>
                    <button onClick={openAdd} className="inline-flex items-center gap-2 h-11 px-6 bg-[#1a3d1f] text-white text-sm font-bold rounded-xl hover:bg-[#2d5c35] transition-colors">
                        <Plus size={16} /> Add your first field
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {fields.map((field) => {
                        const pct = field.cultivatableArea > 0 ? Math.min((field.allocatedArea / field.cultivatableArea) * 100, 100) : 0;
                        return (
                            <div key={field.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a3d1f] to-[#3d8c47] flex items-center justify-center flex-shrink-0">
                                            <MapPin size={16} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white">{field.name}</h3>
                                            <p className="text-xs text-slate-400">{field.soilType} soil</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(field)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(field.id)} disabled={deletingId === field.id} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 transition-colors">
                                            {deletingId === field.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                                        <p className="text-xs text-slate-400 mb-0.5">Total area</p>
                                        <p className="font-bold text-slate-900 dark:text-white">{field.totalArea} ha</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                                        <p className="text-xs text-slate-400 mb-0.5">Cultivatable</p>
                                        <p className="font-bold text-slate-900 dark:text-white">{field.cultivatableArea} ha</p>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="text-slate-400">Land utilisation</span>
                                        <span className={`font-bold ${pct > 90 ? "text-red-500" : pct > 60 ? "text-amber-600" : "text-[#1a3d1f] dark:text-[#7dd68a]"}`}>
                      {pct.toFixed(0)}%
                    </span>
                                    </div>
                                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${pct > 90 ? "bg-red-500" : pct > 60 ? "bg-amber-500" : "bg-gradient-to-r from-[#1a3d1f] to-[#3d8c47]"}`}
                                             style={{ width: `${pct}%` }} />
                                    </div>
                                    <div className="flex justify-between text-xs mt-1">
                                        <span className="text-slate-400">{field.allocatedArea.toFixed(1)} ha planted</span>
                                        <span className="text-slate-400">{(field.cultivatableArea - field.allocatedArea).toFixed(1)} ha free</span>
                                    </div>
                                </div>

                                {field.cropCount > 0 && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex flex-wrap gap-1">
                                            {field.crops.slice(0, 3).map((c: string) => (
                                                <span key={c} className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-2 py-0.5 rounded-lg font-medium">{c}</span>
                                            ))}
                                            {field.crops.length > 3 && <span className="text-xs text-slate-400">+{field.crops.length - 3}</span>}
                                        </div>
                                    </div>
                                )}

                                {field.locationLat && field.locationLng && (
                                    <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                                        <MapPin size={10} /> {parseFloat(field.locationLat).toFixed(4)}, {parseFloat(field.locationLng).toFixed(4)}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Form */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setShowForm(false)} />
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full overflow-y-auto shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">{editingField ? "Edit field" : "Add new field"}</h2>
                            <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="flex-1 p-6 flex flex-col gap-5">
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Field name</label>
                                <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. North Block, River Field" required
                                       className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] transition-colors text-slate-900 dark:text-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { key: "totalArea", label: "Total area (ha)" },
                                    { key: "cultivatableArea", label: "Cultivatable (ha)" },
                                ].map(({ key, label }) => (
                                    <div key={key}>
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">{label}</label>
                                        <input type="number" step="0.01" min="0" value={form[key as keyof typeof form]} onChange={(e) => set(key, e.target.value)} placeholder="0.00" required
                                               className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] transition-colors text-slate-900 dark:text-white" />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Soil type</label>
                                <select value={form.soilType} onChange={(e) => set("soilType", e.target.value)} required
                                        className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] transition-colors text-slate-900 dark:text-white">
                                    {SOIL_TYPES.map((s) => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { key: "locationLat", label: "Latitude (optional)" },
                                    { key: "locationLng", label: "Longitude (optional)" },
                                ].map(({ key, label }) => (
                                    <div key={key}>
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">{label}</label>
                                        <input type="number" step="any" value={form[key as keyof typeof form]} onChange={(e) => set(key, e.target.value)} placeholder="-13.9626"
                                               className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] transition-colors text-slate-900 dark:text-white" />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Notes (optional)</label>
                                <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} placeholder="Any notes about this field..."
                                          className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] transition-colors text-slate-900 dark:text-white resize-none" />
                            </div>
                            {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">{error}</p>}
                            <div className="flex gap-3 mt-auto pt-4">
                                <button type="button" onClick={() => setShowForm(false)}
                                        className="flex-1 h-12 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                        className="flex-1 h-12 bg-[#1a3d1f] text-white text-sm font-bold rounded-xl hover:bg-[#2d5c35] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                    {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Check size={15} /> {editingField ? "Update" : "Add field"}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
"use client";

import { useEffect, useState } from "react";
import {
    Plus, MapPin, Pencil, Trash2, ChevronRight,
    Sprout, ArrowUpRight, X, Check, Loader2
} from "lucide-react";

const SOIL_TYPES = [
    "Clay", "Sandy", "Loam", "Silt", "Peaty", "Chalky", "Clay-Loam", "Sandy-Loam", "Mixed",
];

const soilColors: Record<string, string> = {
    Clay: "bg-amber-50 text-amber-800",
    Sandy: "bg-yellow-50 text-yellow-800",
    Loam: "bg-green-50 text-green-800",
    Silt: "bg-slate-100 text-slate-700",
    Peaty: "bg-stone-100 text-stone-700",
    Chalky: "bg-gray-50 text-gray-700",
    "Clay-Loam": "bg-orange-50 text-orange-800",
    "Sandy-Loam": "bg-lime-50 text-lime-800",
    Mixed: "bg-teal-50 text-teal-800",
};

const emptyForm = {
    name: "", totalArea: "", cultivatableArea: "",
    soilType: "Loam", locationLat: "", locationLng: "", notes: "",
};

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
        fetch("/api/fields")
            .then((r) => r.json())
            .then((d) => { setFields(d); setLoading(false); });
    };

    useEffect(() => { load(); }, []);

    const openAdd = () => {
        setEditingField(null);
        setForm(emptyForm);
        setError("");
        setShowForm(true);
    };

    const openEdit = (field: any) => {
        setEditingField(field);
        setForm({
            name: field.name,
            totalArea: field.totalArea.toString(),
            cultivatableArea: field.cultivatableArea.toString(),
            soilType: field.soilType,
            locationLat: field.locationLat?.toString() ?? "",
            locationLng: field.locationLng?.toString() ?? "",
            notes: field.notes ?? "",
        });
        setError("");
        setShowForm(true);
    };

    const closeForm = () => { setShowForm(false); setEditingField(null); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        const url = editingField ? `/api/fields/${editingField.id}` : "/api/fields";
        const method = editingField ? "PATCH" : "POST";

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });

        const data = await res.json();
        if (!res.ok) {
            setError(data.error);
            setSaving(false);
        } else {
            closeForm();
            load();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this field? All crops and activities linked to it will also be deleted.")) return;
        setDeletingId(id);
        await fetch(`/api/fields/${id}`, { method: "DELETE" });
        setDeletingId(null);
        load();
    };

    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

    const totalHa = fields.reduce((s, f) => s + f.totalArea, 0);
    const cultivatableHa = fields.reduce((s, f) => s + f.cultivatableArea, 0);
    const allocatedHa = fields.reduce((s, f) => s + f.allocatedArea, 0);

    return (
        <div className="p-8 max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-medium text-slate-900">Fields</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {fields.length} field{fields.length !== 1 ? "s" : ""} &mdash; {totalHa.toFixed(1)} ha total
                    </p>
                </div>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 h-10 px-4 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
                >
                    <Plus size={16} /> Add field
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                    { label: "Total area", value: `${totalHa.toFixed(1)} ha` },
                    { label: "Cultivatable", value: `${cultivatableHa.toFixed(1)} ha` },
                    { label: "Allocated to crops", value: `${allocatedHa.toFixed(1)} ha` },
                ].map(({ label, value }) => (
                    <div key={label} className="bg-white border border-slate-200 rounded-2xl p-5">
                        <p className="text-xs uppercase tracking-wide text-slate-400 font-medium mb-2">{label}</p>
                        <p className="text-2xl font-medium text-slate-900">{value}</p>
                    </div>
                ))}
            </div>

            {/* Fields list */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={24} className="animate-spin text-slate-400" />
                </div>
            ) : fields.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
                    <p className="text-4xl mb-4">🗺</p>
                    <p className="text-slate-900 font-medium mb-1">No fields yet</p>
                    <p className="text-slate-400 text-sm mb-6">Add your first field to start tracking crops and activities</p>
                    <button
                        onClick={openAdd}
                        className="inline-flex items-center gap-2 h-10 px-5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
                    >
                        <Plus size={16} /> Add field
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {fields.map((field) => {
                        const pct = field.cultivatableArea > 0
                            ? Math.min((field.allocatedArea / field.cultivatableArea) * 100, 100)
                            : 0;
                        const remaining = field.cultivatableArea - field.allocatedArea;

                        return (
                            <div
                                key={field.id}
                                className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-300 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg flex-shrink-0">
                                            🗺
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-slate-900 text-base">{field.name}</h3>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${soilColors[field.soilType] ?? "bg-slate-100 text-slate-600"}`}>
                          {field.soilType}
                        </span>
                                                {field.locationLat && (
                                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                            <MapPin size={11} /> Location pinned
                          </span>
                                                )}
                                                {field.cropCount > 0 && (
                                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Sprout size={11} /> {field.cropCount} crop{field.cropCount !== 1 ? "s" : ""}
                          </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openEdit(field)}
                                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                                        >
                                            <Pencil size={15} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(field.id)}
                                            disabled={deletingId === field.id}
                                            className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                                        >
                                            {deletingId === field.id
                                                ? <Loader2 size={15} className="animate-spin" />
                                                : <Trash2 size={15} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Area stats */}
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    {[
                                        { label: "Total area", value: `${field.totalArea} ha` },
                                        { label: "Cultivatable", value: `${field.cultivatableArea} ha` },
                                        { label: "Remaining", value: `${remaining.toFixed(2)} ha`, warn: remaining < field.cultivatableArea * 0.1 },
                                    ].map(({ label, value, warn }) => (
                                        <div key={label}>
                                            <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                                            <p className={`text-sm font-medium ${warn ? "text-amber-600" : "text-slate-900"}`}>{value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Land use bar */}
                                <div>
                                    <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                                        <span>Land use</span>
                                        <span>{pct.toFixed(0)}% allocated</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{
                                                width: `${pct}%`,
                                                background: pct > 90 ? "#dc2626" : pct > 70 ? "#d97706" : "#16a34a",
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Crops */}
                                {field.crops.length > 0 && (
                                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                                        {field.crops.map((crop: string, i: number) => (
                                            <span
                                                key={`${crop}-${i}`}
                                                className="text-xs bg-green-50 text-green-800 px-2 py-0.5 rounded-lg font-medium"
                                            >
        {crop}
      </span>
                                        ))}
                                    </div>
                                )}

                                {field.notes && (
                                    <p className="text-xs text-slate-400 mt-3 border-t border-slate-100 pt-3">{field.notes}</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Slide-over form */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/20" onClick={closeForm} />
                    <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-xl flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h2 className="text-base font-medium text-slate-900">
                                {editingField ? "Edit field" : "Add field"}
                            </h2>
                            <button onClick={closeForm} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 p-6 flex flex-col gap-5">

                            <div>
                                <label className="text-sm text-slate-500 mb-1.5 block">Field name</label>
                                <input
                                    value={form.name}
                                    onChange={(e) => set("name", e.target.value)}
                                    placeholder="e.g. North Field A"
                                    required
                                    className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 transition-colors"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-slate-500 mb-1.5 block">Total area (ha)</label>
                                    <input
                                        type="number" step="0.01" min="0"
                                        value={form.totalArea}
                                        onChange={(e) => set("totalArea", e.target.value)}
                                        placeholder="0.00"
                                        required
                                        className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-500 mb-1.5 block">Cultivatable (ha)</label>
                                    <input
                                        type="number" step="0.01" min="0"
                                        value={form.cultivatableArea}
                                        onChange={(e) => set("cultivatableArea", e.target.value)}
                                        placeholder="0.00"
                                        required
                                        className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-slate-500 mb-1.5 block">Soil type</label>
                                <select
                                    value={form.soilType}
                                    onChange={(e) => set("soilType", e.target.value)}
                                    className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 transition-colors"
                                >
                                    {SOIL_TYPES.map((s) => <option key={s}>{s}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm text-slate-500 mb-1.5 block">
                                    GPS location <span className="text-slate-300">(optional)</span>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="number" step="any"
                                        value={form.locationLat}
                                        onChange={(e) => set("locationLat", e.target.value)}
                                        placeholder="Latitude"
                                        className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 transition-colors"
                                    />
                                    <input
                                        type="number" step="any"
                                        value={form.locationLng}
                                        onChange={(e) => set("locationLng", e.target.value)}
                                        placeholder="Longitude"
                                        className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-slate-500 mb-1.5 block">
                                    Notes <span className="text-slate-300">(optional)</span>
                                </label>
                                <textarea
                                    value={form.notes}
                                    onChange={(e) => set("notes", e.target.value)}
                                    placeholder="Any notes about this field..."
                                    rows={3}
                                    className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 transition-colors resize-none"
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
                            )}

                            <div className="flex gap-3 mt-auto pt-4">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="flex-1 h-12 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 h-12 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving
                                        ? <><Loader2 size={15} className="animate-spin" /> Saving...</>
                                        : <><Check size={15} /> {editingField ? "Update field" : "Save field"}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
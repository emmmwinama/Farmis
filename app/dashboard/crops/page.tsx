"use client";

import { useEffect, useState } from "react";
import {
    Plus, Pencil, Trash2, Loader2, X, Check,
    ChevronDown, ChevronUp, Sprout, BarChart2,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
    Active: "bg-green-50 text-green-800",
    Harvested: "bg-blue-50 text-blue-800",
    Failed: "bg-red-50 text-red-800",
};

const STATUSES = ["Active", "Harvested", "Failed"];

const emptyForm = {
    fieldId: "", cropTypeId: "", variety: "", areaPlanted: "",
    season: "", plantingDate: "", expectedHarvestDate: "", status: "Active",
};

function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmt(n: number) {
    return new Intl.NumberFormat("en-MW").format(Math.round(n));
}

export default function CropsPage() {
    const [crops, setCrops] = useState<any[]>([]);
    const [fields, setFields] = useState<any[]>([]);
    const [cropTypes, setCropTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCrop, setEditingCrop] = useState<any>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [seasonFilter, setSeasonFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [fieldFilter, setFieldFilter] = useState("All");
    const [showCustomCrop, setShowCustomCrop] = useState(false);
    const [customCropName, setCustomCropName] = useState("");
    const [addingCropType, setAddingCropType] = useState(false);
    const [groupBySeason, setGroupBySeason] = useState(true);

    const load = () => {
        setLoading(true);
        Promise.all([
            fetch("/api/crops").then((r) => r.json()),
            fetch("/api/fields").then((r) => r.json()),
            fetch("/api/crop-types").then((r) => r.json()),
        ]).then(([c, f, ct]) => {
            setCrops(c); setFields(f); setCropTypes(ct); setLoading(false);
        });
    };

    useEffect(() => { load(); }, []);

    const allSeasons = [...new Set(crops.map((c) => c.season))].sort((a, b) => b.localeCompare(a));

    const filtered = crops.filter((c) => {
        if (seasonFilter !== "All" && c.season !== seasonFilter) return false;
        if (statusFilter !== "All" && c.status !== statusFilter) return false;
        if (fieldFilter !== "All" && c.fieldId !== fieldFilter) return false;
        return true;
    });

    // Group by season
    const grouped: Record<string, any[]> = {};
    for (const c of filtered) {
        if (!grouped[c.season]) grouped[c.season] = [];
        grouped[c.season].push(c);
    }
    const sortedSeasons = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    const openAdd = () => { setEditingCrop(null); setForm(emptyForm); setError(""); setShowForm(true); };
    const openEdit = (crop: any) => {
        setEditingCrop(crop);
        setForm({
            fieldId: crop.fieldId, cropTypeId: crop.cropTypeId, variety: crop.variety,
            areaPlanted: crop.areaPlanted.toString(), season: crop.season,
            plantingDate: crop.plantingDate.split("T")[0],
            expectedHarvestDate: crop.expectedHarvestDate.split("T")[0], status: crop.status,
        });
        setError(""); setShowForm(true);
    };
    const closeForm = () => { setShowForm(false); setEditingCrop(null); };
    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

    const selectedField = fields.find((f) => f.id === form.fieldId);
    const remaining = selectedField ? selectedField.cultivatableArea - (selectedField.allocatedArea ?? 0) : null;

    const handleAddCropType = async () => {
        if (!customCropName.trim()) return;
        setAddingCropType(true);
        const res = await fetch("/api/crop-types", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: customCropName.trim() }),
        });
        const data = await res.json();
        if (res.ok) {
            setCropTypes((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
            set("cropTypeId", data.id);
            setCustomCropName(""); setShowCustomCrop(false);
        }
        setAddingCropType(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true); setError("");
        const url = editingCrop ? `/api/crops/${editingCrop.id}` : "/api/crops";
        const method = editingCrop ? "PATCH" : "POST";
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        const data = await res.json();
        if (!res.ok) { setError(data.error); setSaving(false); } else { closeForm(); load(); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this crop record?")) return;
        setDeletingId(id);
        await fetch(`/api/crops/${id}`, { method: "DELETE" });
        setDeletingId(null); load();
    };

    const activeCrops = crops.filter((c) => c.status === "Active");
    const totalAreaPlanted = activeCrops.reduce((s, c) => s + c.areaPlanted, 0);

    return (
        <div className="p-8 max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-medium text-slate-900">Crops</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {activeCrops.length} active &mdash; {totalAreaPlanted.toFixed(1)} ha planted
                    </p>
                </div>
                <button onClick={openAdd}
                        className="flex items-center gap-2 h-10 px-4 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors">
                    <Plus size={16} /> Add crop
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Active", value: crops.filter((c) => c.status === "Active").length },
                    { label: "Harvested", value: crops.filter((c) => c.status === "Harvested").length },
                    { label: "Failed", value: crops.filter((c) => c.status === "Failed").length },
                    { label: "Seasons", value: allSeasons.length },
                ].map(({ label, value }) => (
                    <div key={label} className="bg-white border border-slate-200 rounded-2xl p-5">
                        <p className="text-xs uppercase tracking-wide text-slate-400 font-medium mb-2">{label}</p>
                        <p className="text-2xl font-medium text-slate-900">{value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                {/* Season filter */}
                <div>
                    <label className="text-xs text-slate-400 mr-2">Season</label>
                    <select value={seasonFilter} onChange={(e) => setSeasonFilter(e.target.value)}
                            className="h-8 px-3 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-slate-400">
                        <option value="All">All seasons</option>
                        {allSeasons.map((s) => <option key={s}>{s}</option>)}
                    </select>
                </div>

                {/* Status filter */}
                <div className="flex gap-2">
                    {["All", ...STATUSES].map((s) => (
                        <button key={s} onClick={() => setStatusFilter(s)}
                                className={`h-8 px-3 rounded-xl text-xs font-medium transition-colors ${
                                    statusFilter === s ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"
                                }`}>
                            {s}
                        </button>
                    ))}
                </div>

                {/* Field filter */}
                <div>
                    <label className="text-xs text-slate-400 mr-2">Field</label>
                    <select value={fieldFilter} onChange={(e) => setFieldFilter(e.target.value)}
                            className="h-8 px-3 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-slate-400">
                        <option value="All">All fields</option>
                        {fields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                </div>

                {/* Group toggle */}
                <button onClick={() => setGroupBySeason(!groupBySeason)}
                        className={`flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium border transition-colors ${
                            groupBySeason ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-500"
                        }`}>
                    <BarChart2 size={12} /> Group by season
                </button>
            </div>

            {/* Crops list */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-slate-400" /></div>
            ) : filtered.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
                    <p className="text-4xl mb-4">🌱</p>
                    <p className="text-slate-900 font-medium mb-1">No crops found</p>
                    <p className="text-slate-400 text-sm mb-6">
                        {fields.length === 0 ? "Add a field first" : "Add crops or adjust your filters"}
                    </p>
                    {fields.length > 0 && (
                        <button onClick={openAdd} className="inline-flex items-center gap-2 h-10 px-5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors">
                            <Plus size={16} /> Add crop
                        </button>
                    )}
                </div>
            ) : groupBySeason ? (
                // Grouped by season
                <div className="flex flex-col gap-6">
                    {sortedSeasons.map((season) => (
                        <div key={season}>
                            <div className="flex items-center gap-3 mb-3">
                                <h2 className="text-base font-medium text-slate-900">{season}</h2>
                                <span className="text-xs bg-amber-50 text-amber-800 px-2 py-0.5 rounded-lg font-medium">
                  {grouped[season].length} crop{grouped[season].length !== 1 ? "s" : ""}
                </span>
                                <span className="text-xs text-slate-400">
                  {grouped[season].reduce((s, c) => s + c.areaPlanted, 0).toFixed(1)} ha
                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {grouped[season].map((crop) => (
                                    <CropCard
                                        key={crop.id}
                                        crop={crop}
                                        onEdit={() => openEdit(crop)}
                                        onDelete={() => handleDelete(crop.id)}
                                        deleting={deletingId === crop.id}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                // Flat list
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((crop) => (
                        <CropCard
                            key={crop.id}
                            crop={crop}
                            onEdit={() => openEdit(crop)}
                            onDelete={() => handleDelete(crop.id)}
                            deleting={deletingId === crop.id}
                        />
                    ))}
                </div>
            )}

            {/* Slide-over form */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/20" onClick={closeForm} />
                    <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-xl flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h2 className="text-base font-medium text-slate-900">{editingCrop ? "Edit crop" : "Add crop"}</h2>
                            <button onClick={closeForm} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="flex-1 p-6 flex flex-col gap-5">

                            <div>
                                <label className="text-sm text-slate-500 mb-1.5 block">Field</label>
                                <select value={form.fieldId} onChange={(e) => set("fieldId", e.target.value)} required
                                        className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400">
                                    <option value="">Select a field...</option>
                                    {fields.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.name} ({(f.cultivatableArea - (f.allocatedArea ?? 0)).toFixed(2)} ha remaining)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm text-slate-500 mb-1.5 block">Crop type</label>
                                <select value={form.cropTypeId}
                                        onChange={(e) => { if (e.target.value === "__custom__") { setShowCustomCrop(true); } else { set("cropTypeId", e.target.value); } }}
                                        required className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400">
                                    <option value="">Select crop type...</option>
                                    {cropTypes.map((ct) => <option key={ct.id} value={ct.id}>{ct.name}{ct.isCustom ? " (custom)" : ""}</option>)}
                                    <option value="__custom__">+ Add custom crop type</option>
                                </select>
                                {showCustomCrop && (
                                    <div className="flex gap-2 mt-2">
                                        <input value={customCropName} onChange={(e) => setCustomCropName(e.target.value)} placeholder="Custom crop name"
                                               className="flex-1 h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400" />
                                        <button type="button" onClick={handleAddCropType} disabled={addingCropType}
                                                className="h-10 px-4 bg-slate-900 text-white text-sm rounded-xl hover:bg-slate-800 transition-colors">
                                            {addingCropType ? <Loader2 size={14} className="animate-spin" /> : "Add"}
                                        </button>
                                        <button type="button" onClick={() => setShowCustomCrop(false)}
                                                className="h-10 px-3 border border-slate-200 text-slate-500 text-sm rounded-xl hover:bg-slate-50">
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-sm text-slate-500 mb-1.5 block">Variety</label>
                                <input value={form.variety} onChange={(e) => set("variety", e.target.value)} placeholder="e.g. SC403, DK8031" required
                                       className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400" />
                            </div>

                            <div>
                                <label className="text-sm text-slate-500 mb-1.5 block">
                                    Area planted (ha)
                                    {remaining !== null && <span className="text-slate-400 ml-2">— {remaining.toFixed(2)} ha remaining</span>}
                                </label>
                                <input type="number" step="0.01" min="0" value={form.areaPlanted} onChange={(e) => set("areaPlanted", e.target.value)} placeholder="0.00" required
                                       className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400" />
                            </div>

                            <div>
                                <label className="text-sm text-slate-500 mb-1.5 block">Season</label>
                                <input value={form.season} onChange={(e) => set("season", e.target.value)} placeholder="e.g. 2024/25 Rain Season" required
                                       className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-slate-500 mb-1.5 block">Planting date</label>
                                    <input type="date" value={form.plantingDate} onChange={(e) => set("plantingDate", e.target.value)} required
                                           className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400" />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-500 mb-1.5 block">Expected harvest</label>
                                    <input type="date" value={form.expectedHarvestDate} onChange={(e) => set("expectedHarvestDate", e.target.value)} required
                                           className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400" />
                                </div>
                            </div>

                            {editingCrop && (
                                <div>
                                    <label className="text-sm text-slate-500 mb-1.5 block">Status</label>
                                    <select value={form.status} onChange={(e) => set("status", e.target.value)}
                                            className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400">
                                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                            )}

                            {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

                            <div className="flex gap-3 mt-auto pt-4">
                                <button type="button" onClick={closeForm}
                                        className="flex-1 h-12 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                        className="flex-1 h-12 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                    {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Check size={15} /> {editingCrop ? "Update crop" : "Save crop"}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function CropCard({ crop, onEdit, onDelete, deleting }: {
    crop: any; onEdit: () => void; onDelete: () => void; deleting: boolean;
}) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-colors">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-lg flex-shrink-0">🌱</div>
                    <div>
                        <h3 className="font-medium text-slate-900">{crop.cropTypeName}</h3>
                        <p className="text-xs text-slate-400">{crop.variety}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
          <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
              crop.status === "Active" ? "bg-green-50 text-green-800" :
                  crop.status === "Harvested" ? "bg-blue-50 text-blue-800" : "bg-red-50 text-red-800"
          }`}>{crop.status}</span>
                    <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"><Pencil size={14} /></button>
                    <button onClick={onDelete} disabled={deleting} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                        {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">Field</p>
                    <p className="text-sm font-medium text-slate-900">{crop.fieldName}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">Area planted</p>
                    <p className="text-sm font-medium text-slate-900">{crop.areaPlanted} ha</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">Planted</p>
                    <p className="text-sm font-medium text-slate-900">{formatDate(crop.plantingDate)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">Expected harvest</p>
                    <p className="text-sm font-medium text-slate-900">{formatDate(crop.expectedHarvestDate)}</p>
                </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-400">Season: <span className="text-slate-600 font-medium">{crop.season}</span></p>
                {crop.status === "Active" && (
                    <a href={`/dashboard/yields?cropFieldId=${crop.id}`}
                       className="text-xs text-green-700 font-medium hover:underline">
                        Record yield →
                    </a>
                )}
            </div>
        </div>
    );
}
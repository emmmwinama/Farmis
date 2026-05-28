"use client";

import { useEffect, useState } from "react";
import {
    Plus, Pencil, Trash2, Loader2, X, Check,
    Sprout, BarChart2, Filter,
} from "lucide-react";
import Link from "next/link";

const STATUSES = ["Active", "Harvested", "Failed"];

const STATUS_CONFIG: Record<string, { bg: string; dot: string; text: string }> = {
    Active:    { bg: "bg-green-100 dark:bg-green-900/30",  dot: "bg-green-500",  text: "text-green-800 dark:text-green-400" },
    Harvested: { bg: "bg-blue-100 dark:bg-blue-900/30",    dot: "bg-blue-500",   text: "text-blue-800 dark:text-blue-400" },
    Failed:    { bg: "bg-red-100 dark:bg-red-900/30",      dot: "bg-red-500",    text: "text-red-800 dark:text-red-400" },
};

const emptyForm = {
    fieldId: "", cropTypeId: "", variety: "", areaPlanted: "",
    season: "", plantingDate: "", expectedHarvestDate: "", status: "Active",
};

function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(d: string) {
    const diff = new Date(d).getTime() - Date.now();
    const days = Math.ceil(diff / 86400000);
    if (days < 0) return { label: `${Math.abs(days)}d overdue`, color: "text-red-500" };
    if (days === 0) return { label: "Today", color: "text-amber-500" };
    if (days <= 14) return { label: `${days}d`, color: "text-amber-600 dark:text-amber-400" };
    return { label: `${days}d`, color: "text-slate-400" };
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
    const [groupBySeason, setGroupBySeason] = useState(true);
    const [showCustomCrop, setShowCustomCrop] = useState(false);
    const [customCropName, setCustomCropName] = useState("");
    const [addingCropType, setAddingCropType] = useState(false);

    const load = () => {
        setLoading(true);
        Promise.all([
            fetch("/api/crops").then((r) => r.json()),
            fetch("/api/fields").then((r) => r.json()),
            fetch("/api/crop-types").then((r) => r.json()),
        ]).then(([c, f, ct]) => { setCrops(c); setFields(f); setCropTypes(ct); setLoading(false); });
    };

    useEffect(() => { load(); }, []);

    const allSeasons = [...new Set(crops.map((c) => c.season))].sort((a, b) => b.localeCompare(a));

    const filtered = crops.filter((c) => {
        if (seasonFilter !== "All" && c.season !== seasonFilter) return false;
        if (statusFilter !== "All" && c.status !== statusFilter) return false;
        if (fieldFilter !== "All" && c.fieldId !== fieldFilter) return false;
        return true;
    });

    const grouped: Record<string, any[]> = {};
    for (const c of filtered) {
        if (!grouped[c.season]) grouped[c.season] = [];
        grouped[c.season].push(c);
    }
    const sortedSeasons = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

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
        if (!res.ok) { setError(data.error); setSaving(false); } else { setShowForm(false); load(); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this crop record?")) return;
        setDeletingId(id);
        await fetch(`/api/crops/${id}`, { method: "DELETE" });
        setDeletingId(null); load();
    };

    const selectedField = fields.find((f) => f.id === form.fieldId);
    const remaining = selectedField ? selectedField.cultivatableArea - (selectedField.allocatedArea ?? 0) : null;
    const activeCrops = crops.filter((c) => c.status === "Active");
    const totalArea = activeCrops.reduce((s, c) => s + c.areaPlanted, 0);

    return (
        <div className="p-8 max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Crops</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {activeCrops.length} active · {crops.filter((c) => c.status === "Harvested").length} harvested · {totalArea.toFixed(1)} ha planted
                    </p>
                </div>
                <button onClick={openAdd}
                        className="flex items-center gap-2 h-10 px-5 bg-[#1a3d1f] text-white text-sm font-bold rounded-xl hover:bg-[#2d5c35] transition-colors hover:shadow-lg hover:shadow-[#1a3d1f]/20">
                    <Plus size={16} /> Add crop
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Active", value: crops.filter((c) => c.status === "Active").length, color: "text-green-600 dark:text-green-400" },
                    { label: "Harvested", value: crops.filter((c) => c.status === "Harvested").length, color: "text-blue-600 dark:text-blue-400" },
                    { label: "Failed", value: crops.filter((c) => c.status === "Failed").length, color: "text-red-500" },
                    { label: "Seasons", value: allSeasons.length, color: "text-slate-700 dark:text-slate-300" },
                ].map(({ label, value, color }) => (
                    <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-sm transition-all">
                        <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-2">{label}</p>
                        <p className={`text-3xl font-black ${color}`}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <select value={seasonFilter} onChange={(e) => setSeasonFilter(e.target.value)}
                        className="h-9 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-700 dark:text-slate-300">
                    <option value="All">All seasons</option>
                    {allSeasons.map((s) => <option key={s}>{s}</option>)}
                </select>

                <select value={fieldFilter} onChange={(e) => setFieldFilter(e.target.value)}
                        className="h-9 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-700 dark:text-slate-300">
                    <option value="All">All fields</option>
                    {fields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>

                <div className="flex gap-2">
                    {["All", ...STATUSES].map((s) => (
                        <button key={s} onClick={() => setStatusFilter(s)}
                                className={`h-9 px-4 rounded-xl text-sm font-semibold transition-colors ${
                                    statusFilter === s
                                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                                        : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300"
                                }`}>
                            {s}
                        </button>
                    ))}
                </div>

                <button onClick={() => setGroupBySeason(!groupBySeason)}
                        className={`flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold border transition-colors ${
                            groupBySeason
                                ? "bg-[#1a3d1f] text-white border-[#1a3d1f]"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500"
                        }`}>
                    <BarChart2 size={13} /> Group by season
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-slate-400" /></div>
            ) : filtered.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                        <Sprout size={28} className="text-slate-400" />
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white text-lg mb-2">No crops found</p>
                    <p className="text-slate-400 text-sm mb-6">{fields.length === 0 ? "Add a field first, then assign crops to it" : "Add crops or adjust your filters"}</p>
                    {fields.length > 0 && (
                        <button onClick={openAdd} className="inline-flex items-center gap-2 h-11 px-6 bg-[#1a3d1f] text-white text-sm font-bold rounded-xl hover:bg-[#2d5c35] transition-colors">
                            <Plus size={16} /> Add crop
                        </button>
                    )}
                </div>
            ) : groupBySeason ? (
                <div className="flex flex-col gap-8">
                    {sortedSeasons.map((season) => (
                        <div key={season}>
                            <div className="flex items-center gap-3 mb-4">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{season}</h2>
                                <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 px-3 py-1 rounded-full font-bold">
                  {grouped[season].length} crop{grouped[season].length !== 1 ? "s" : ""}
                </span>
                                <span className="text-sm text-slate-400">
                  {grouped[season].reduce((s, c) => s + c.areaPlanted, 0).toFixed(1)} ha
                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {grouped[season].map((crop) => <CropCard key={crop.id} crop={crop} onEdit={() => openEdit(crop)} onDelete={() => handleDelete(crop.id)} deleting={deletingId === crop.id} />)}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((crop) => <CropCard key={crop.id} crop={crop} onEdit={() => openEdit(crop)} onDelete={() => handleDelete(crop.id)} deleting={deletingId === crop.id} />)}
                </div>
            )}

            {/* Form */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setShowForm(false)} />
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full overflow-y-auto shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">{editingCrop ? "Edit crop" : "Add crop"}</h2>
                            <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="flex-1 p-6 flex flex-col gap-4">
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Field</label>
                                <select value={form.fieldId} onChange={(e) => set("fieldId", e.target.value)} required
                                        className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white">
                                    <option value="">Select a field...</option>
                                    {fields.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.name} ({((f.cultivatableArea ?? 0) - (f.allocatedArea ?? 0)).toFixed(2)} ha remaining)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Crop type</label>
                                <select value={form.cropTypeId}
                                        onChange={(e) => e.target.value === "__custom__" ? setShowCustomCrop(true) : set("cropTypeId", e.target.value)}
                                        required
                                        className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white">
                                    <option value="">Select crop type...</option>
                                    {cropTypes.map((ct) => <option key={ct.id} value={ct.id}>{ct.name}{ct.isCustom ? " (custom)" : ""}</option>)}
                                    <option value="__custom__">+ Add custom crop type</option>
                                </select>
                                {showCustomCrop && (
                                    <div className="flex gap-2 mt-2">
                                        <input value={customCropName} onChange={(e) => setCustomCropName(e.target.value)} placeholder="Custom crop name"
                                               className="flex-1 h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white" />
                                        <button type="button" onClick={handleAddCropType} disabled={addingCropType}
                                                className="h-10 px-4 bg-[#1a3d1f] text-white text-sm font-bold rounded-xl hover:bg-[#2d5c35]">
                                            {addingCropType ? <Loader2 size={14} className="animate-spin" /> : "Add"}
                                        </button>
                                        <button type="button" onClick={() => setShowCustomCrop(false)}
                                                className="h-10 px-3 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800">
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {[
                                { key: "variety", label: "Variety", placeholder: "e.g. SC403, DK8031", type: "text" },
                            ].map(({ key, label, placeholder, type }) => (
                                <div key={key}>
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">{label}</label>
                                    <input type={type} value={form[key as keyof typeof form]} onChange={(e) => set(key, e.target.value)} placeholder={placeholder} required
                                           className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white" />
                                </div>
                            ))}

                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                                    Area planted (ha)
                                    {remaining !== null && <span className="text-slate-400 font-normal ml-2">— {remaining.toFixed(2)} ha available</span>}
                                </label>
                                <input type="number" step="0.01" min="0" value={form.areaPlanted} onChange={(e) => set("areaPlanted", e.target.value)} placeholder="0.00" required
                                       className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white" />
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Season</label>
                                <input value={form.season} onChange={(e) => set("season", e.target.value)} placeholder="e.g. 2024/25 Rain Season" required
                                       className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Planting date</label>
                                    <input type="date" value={form.plantingDate} onChange={(e) => set("plantingDate", e.target.value)} required
                                           className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white" />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Expected harvest</label>
                                    <input type="date" value={form.expectedHarvestDate} onChange={(e) => set("expectedHarvestDate", e.target.value)} required
                                           className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white" />
                                </div>
                            </div>

                            {editingCrop && (
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Status</label>
                                    <select value={form.status} onChange={(e) => set("status", e.target.value)}
                                            className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white">
                                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                            )}

                            {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">{error}</p>}

                            <div className="flex gap-3 mt-auto pt-4">
                                <button type="button" onClick={() => setShowForm(false)}
                                        className="flex-1 h-12 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                                <button type="submit" disabled={saving}
                                        className="flex-1 h-12 bg-[#1a3d1f] text-white text-sm font-bold rounded-xl hover:bg-[#2d5c35] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                    {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Check size={15} /> {editingCrop ? "Update" : "Save crop"}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function CropCard({ crop, onEdit, onDelete, deleting }: { crop: any; onEdit: () => void; onDelete: () => void; deleting: boolean }) {
    const s = STATUS_CONFIG[crop.status] ?? STATUS_CONFIG.Active;
    const harvest = daysUntil(crop.expectedHarvestDate);

    return (
        <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a3d1f] to-[#3d8c47] flex items-center justify-center text-xl flex-shrink-0">
                        🌱
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{crop.cropTypeName}</h3>
                        <p className="text-xs text-slate-400">{crop.variety}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
          <span className={`text-xs px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 ${s.bg} ${s.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {crop.status}
          </span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition-colors"><Pencil size={13} /></button>
                        <button onClick={onDelete} disabled={deleting} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 transition-colors">
                            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                    { label: "Field", value: crop.fieldName },
                    { label: "Area", value: `${crop.areaPlanted} ha` },
                    { label: "Planted", value: formatDate(crop.plantingDate) },
                    { label: "Harvest", value: formatDate(crop.expectedHarvestDate) },
                ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5">
                        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{value}</p>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-400">{crop.season}</p>
                <div className="flex items-center gap-2">
                    {crop.status === "Active" && (
                        <span className={`text-xs font-bold ${harvest.color}`}>
              Harvest in {harvest.label}
            </span>
                    )}
                    {crop.status === "Active" && (
                        <Link href={`/dashboard/yields?cropFieldId=${crop.id}`}
                              className="text-xs text-[#1a3d1f] dark:text-[#7dd68a] font-bold hover:underline">
                            Record yield →
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
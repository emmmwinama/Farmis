"use client";

import { useEffect, useState } from "react";
import {
    Plus, Loader2, X, Check, Pencil, Trash2,
    Archive, RotateCcw, Leaf, Calendar, MapPin,
} from "lucide-react";
import { submitWithOfflineQueue } from "@/lib/offlineQueue";

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtHa(n: number) { return `${n.toFixed(2)} ha`; }

const STATUSES      = ["Active", "Harvested", "Failed", "Resting"];
const ARCHIVE_REASONS = [
    "Harvest complete",
    "Season ended",
    "Crop failed",
    "Field rested (fallow)",
    "Replanted with new variety",
    "Other",
];

type CropForm = {
    fieldId:            string;
    cropTypeId:         string;
    variety:            string;
    areaPlanted:        string;
    season:             string;
    plantingDate:       string;
    expectedHarvestDate: string;
    status:             string;
};

const EMPTY_FORM: CropForm = {
    fieldId:             "",
    cropTypeId:          "",
    variety:             "",
    areaPlanted:         "",
    season:              "",
    plantingDate:        "",
    expectedHarvestDate: "",
    status:              "Active",
};

export default function CropsPage() {
    const [crops,        setCrops]        = useState<any[]>([]);
    const [fields,       setFields]       = useState<any[]>([]);
    const [cropTypes,    setCropTypes]    = useState<any[]>([]);
    const [seasons,      setSeasons]      = useState<string[]>([]);
    const [loading,      setLoading]      = useState(true);
    const [showArchived, setShowArchived] = useState(false);
    const [search,       setSearch]       = useState("");

    // Add/edit form
    const [showForm,      setShowForm]      = useState(false);
    const [editingCrop,   setEditingCrop]   = useState<any>(null);
    const [form,          setForm]          = useState<CropForm>({ ...EMPTY_FORM });
    const [saving,        setSaving]        = useState(false);
    const [formError,     setFormError]     = useState("");

    // Archive modal
    const [archiveModal,  setArchiveModal]  = useState<any>(null);
    const [archiveReason, setArchiveReason] = useState("");
    const [archiving,     setArchiving]     = useState(false);

    // Delete
    const [deletingId,    setDeletingId]    = useState<string | null>(null);

    // New crop type
    const [newTypeName,   setNewTypeName]   = useState("");
    const [addingType,    setAddingType]    = useState(false);
    const [seasonMode,    setSeasonMode]     = useState<"existing" | "manual">("existing");

    const load = async () => {
        setLoading(true);
        try {
            const [cropsRes, fieldsRes, typesRes, seasonsRes] = await Promise.all([
                fetch(`/api/crops?archived=${showArchived}`).then(async (r) => {
                    const t = await r.text(); return t ? JSON.parse(t) : [];
                }),
                fetch("/api/fields").then(async (r) => {
                    const t = await r.text(); return t ? JSON.parse(t) : [];
                }),
                fetch("/api/crop-types").then(async (r) => {
                    const t = await r.text(); return t ? JSON.parse(t) : [];
                }),
                fetch("/api/seasons").then(async (r) => {
                    const t = await r.text(); return t ? JSON.parse(t) : { allSeasons: [] };
                }).catch(() => ({ allSeasons: [] })),
            ]);
            setCrops(Array.isArray(cropsRes) ? cropsRes : []);
            setFields(Array.isArray(fieldsRes) ? fieldsRes : []);
            setCropTypes(Array.isArray(typesRes) ? typesRes : []);
            setSeasons(Array.isArray(seasonsRes?.allSeasons) ? seasonsRes.allSeasons : []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [showArchived]);

    const setF = <K extends keyof CropForm>(k: K, v: CropForm[K]) =>
        setForm((p) => ({ ...p, [k]: v }));

    const openAdd = () => {
        setEditingCrop(null);
        setForm({ ...EMPTY_FORM });
        setSeasonMode(seasons.length > 0 ? "existing" : "manual");
        setFormError("");
        setShowForm(true);
    };

    const openEdit = (crop: any) => {
        setEditingCrop(crop);
        setForm({
            fieldId:             crop.fieldId             ?? "",
            cropTypeId:          crop.cropTypeId          ?? "",
            variety:             crop.variety             ?? "",
            areaPlanted:         String(crop.areaPlanted  ?? ""),
            season:              crop.season              ?? "",
            plantingDate:        crop.plantingDate ? new Date(crop.plantingDate).toISOString().split("T")[0] : "",
            expectedHarvestDate: crop.expectedHarvestDate ? new Date(crop.expectedHarvestDate).toISOString().split("T")[0] : "",
            status:              crop.status              ?? "Active",
        });
        setSeasonMode("manual");
        setFormError("");
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setFormError("");
        const url    = editingCrop ? `/api/crops/${editingCrop.id}` : "/api/crops";
        const method = editingCrop ? "PATCH" : "POST";
        try {
            const result = await submitWithOfflineQueue(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                    ...form,
                    areaPlanted: parseFloat(form.areaPlanted) || 0,
                }),
            }, `${editingCrop ? "Crop update" : "New crop"}: ${form.season || "season"}`);
            if (result.queued) {
                setShowForm(false);
                setFormError("");
                alert("Saved offline. AgriVault will sync this crop record when the connection returns.");
                return;
            }
            if (!result.response?.ok) { setFormError(result.data?.error ?? "Failed"); setSaving(false); return; }
            setShowForm(false);
            load();
        } catch (err: any) {
            setFormError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this crop record? All linked activities and yields will be affected.")) return;
        setDeletingId(id);
        await fetch(`/api/crops/${id}`, { method: "DELETE" });
        setDeletingId(null);
        load();
    };

    const handleArchive = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!archiveModal) return;
        setArchiving(true);
        await fetch(`/api/crops/${archiveModal.id}/archive`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ reason: archiveReason }),
        });
        setArchiveModal(null);
        setArchiveReason("");
        setArchiving(false);
        load();
    };

    const handleUnarchive = async (id: string) => {
        await fetch(`/api/crops/${id}/archive`, { method: "DELETE" });
        load();
    };

    const handleAddType = async () => {
        if (!newTypeName.trim()) return;
        setAddingType(true);
        await fetch("/api/crop-types", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ name: newTypeName.trim() }),
        });
        setNewTypeName("");
        setAddingType(false);
        const res  = await fetch("/api/crop-types");
        const data = await res.json();
        setCropTypes(Array.isArray(data) ? data : []);
    };

    const filtered = crops.filter((c) => {
        const q = search.toLowerCase();
        return !q ||
            c.cropTypeName?.toLowerCase().includes(q) ||
            c.variety?.toLowerCase().includes(q) ||
            c.fieldName?.toLowerCase().includes(q) ||
            c.season?.toLowerCase().includes(q);
    });
    const selectedField = fields.find((f) => f.id === form.fieldId);
    const selectedFieldRemaining = selectedField
        ? Math.max(0, Number(selectedField.cultivatableArea ?? selectedField.totalArea ?? 0) - Number(selectedField.allocatedArea ?? 0) + (editingCrop?.fieldId === selectedField.id ? Number(editingCrop.areaPlanted ?? 0) : 0))
        : null;

    const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
        Active:   { bg: "#ECFDF5", color: "#059669" },
        Harvested:{ bg: "#EFF6FF", color: "#2563EB" },
        Failed:   { bg: "#FEF2F2", color: "#DC2626" },
        Resting:  { bg: "#F5F3FF", color: "#7C3AED" },
        Archived: { bg: "#F1F5F9", color: "#64748B" },
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">

            {/* Header */}
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)", letterSpacing: "-0.04em" }}>
                        {showArchived ? "Archived Crops" : "Crops"}
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                        {filtered.length} crop record{filtered.length !== 1 ? "s" : ""}
                        {showArchived ? " archived" : " active"}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowArchived((p) => !p)}
                        className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-bold transition-all"
                        style={{
                            background: showArchived ? "#F5F3FF" : "var(--bg-subtle)",
                            color:      showArchived ? "#7C3AED"  : "var(--text-secondary)",
                            border:     `1.5px solid ${showArchived ? "#7C3AED" : "var(--border)"}`,
                        }}>
                        <Archive size={15} />
                        {showArchived ? "View active" : "View archived"}
                    </button>
                    {!showArchived && (
                        <button onClick={openAdd}
                                className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold text-white"
                                style={{ background: "var(--farm-green)", boxShadow: "0 4px 12px rgba(26,61,31,0.3)" }}>
                            <Plus size={15} /> Add crop
                        </button>
                    )}
                </div>
            </div>

            {/* Search */}
            <div className="mb-5">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by crop, variety, field or season..."
                    className="h-10 px-4 text-sm rounded-xl outline-none w-full max-w-md"
                    style={{ border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-primary)" }}
                />
            </div>

            {/* Crops grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={24} className="animate-spin" style={{ color: "var(--farm-green)" }} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="rounded-2xl p-16 text-center"
                     style={{ background: "var(--bg-card)", border: "1.5px dashed var(--border)" }}>
                    <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                         style={{ background: "var(--bg-subtle)", color: "var(--farm-green)" }}>
                        <Leaf size={28} />
                    </div>
                    <p className="text-base font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                        {showArchived ? "No archived crops" : "No crops yet"}
                    </p>
                    <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                        {showArchived
                            ? "Archive a crop season to see it here"
                            : "Add your first crop record to start tracking"}
                    </p>
                    {!showArchived && (
                        <button onClick={openAdd}
                                className="px-6 py-3 rounded-xl text-sm font-bold text-white"
                                style={{ background: "var(--farm-green)" }}>
                            Add first crop
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((crop) => {
                        const statusCfg = STATUS_CONFIG(crop, STATUS_COLORS);
                        const daysToHarvest = crop.expectedHarvestDate
                            ? Math.ceil((new Date(crop.expectedHarvestDate).getTime() - Date.now()) / 86400000)
                            : null;

                        return (
                            <div key={crop.id}
                                 className="rounded-2xl overflow-hidden flex flex-col"
                                 style={{
                                     background: "var(--bg-card)",
                                     border:     `1.5px solid ${crop.isArchived ? "#E2E8F0" : "var(--border)"}`,
                                     opacity:    crop.isArchived ? 0.85 : 1,
                                     boxShadow:  "0 1px 3px rgba(15,23,42,0.06)",
                                 }}>

                                {/* Archive banner */}
                                {crop.isArchived && (
                                    <div className="flex items-center gap-2 px-4 py-2"
                                         style={{ background: "#F5F3FF", borderBottom: "1px solid #DDD6FE" }}>
                                        <Archive size={12} style={{ color: "#7C3AED" }} />
                                        <span className="text-[10px] font-black uppercase tracking-widest"
                                              style={{ color: "#7C3AED" }}>
                                            Archived
                                        </span>
                                        {crop.archivedReason && (
                                            <span className="text-[10px]" style={{ color: "#9333EA" }}>
                                                · {crop.archivedReason}
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div className="p-5 flex-1">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                                 style={{ background: "var(--farm-pale)" }}>
                                                <Leaf size={16} style={{ color: "var(--farm-green)" }} />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black" style={{ color: "var(--text-primary)" }}>
                                                    {crop.cropTypeName}
                                                </h3>
                                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                    {crop.variety}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full"
                                              style={{
                                                  background: statusCfg.bg,
                                                  color:      statusCfg.color,
                                              }}>
                                            {crop.status}
                                        </span>
                                    </div>

                                    {/* Details */}
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        {[
                                            { icon: MapPin,   label: "Field",   value: crop.fieldName ?? "—" },
                                            { icon: Calendar, label: "Season",  value: crop.season ?? "—" },
                                            { icon: Leaf,     label: "Area",    value: fmtHa(crop.areaPlanted) },
                                            { icon: Calendar, label: "Planted", value: crop.plantingDate ? fmtDate(crop.plantingDate) : "—" },
                                        ].map(({ icon: Icon, label, value }) => (
                                            <div key={label} className="rounded-xl p-2.5"
                                                 style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                                                <p className="text-[9px] font-black uppercase tracking-wide mb-0.5"
                                                   style={{ color: "var(--text-muted)" }}>
                                                    {label}
                                                </p>
                                                <p className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>
                                                    {value}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Harvest countdown */}
                                    {daysToHarvest !== null && !crop.isArchived && (
                                        <div className="rounded-xl px-3 py-2 mb-3"
                                             style={{
                                                 background: daysToHarvest < 0 ? "#FEF2F2" : daysToHarvest < 14 ? "#F0F9FF" : "var(--farm-pale)",
                                                 border:     `1px solid ${daysToHarvest < 0 ? "#FEE2E2" : daysToHarvest < 14 ? "#BAE6FD" : "#86EFAC"}`,
                                             }}>
                                            <p className="text-xs font-bold"
                                               style={{ color: daysToHarvest < 0 ? "#DC2626" : daysToHarvest < 14 ? "#0284C7" : "var(--farm-green)" }}>
                                                {daysToHarvest < 0
                                                    ? `Harvest overdue by ${Math.abs(daysToHarvest)} days`
                                                    : daysToHarvest === 0
                                                        ? "Harvest due today"
                                                        : `Harvest in ${daysToHarvest} days - ${fmtDate(crop.expectedHarvestDate)}`}
                                            </p>
                                        </div>
                                    )}

                                    {/* Archive date */}
                                    {crop.isArchived && crop.archivedAt && (
                                        <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                                            Archived {fmtDate(crop.archivedAt)}
                                        </p>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between px-5 py-3"
                                     style={{ borderTop: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                        {crop.plantingDate ? fmtDate(crop.plantingDate) : "—"}
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                        {!crop.isArchived && (
                                            <>
                                                {/* Archive */}
                                                <button
                                                    onClick={() => { setArchiveModal(crop); setArchiveReason(""); }}
                                                    className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg"
                                                    style={{ background: "#F5F3FF", color: "#7C3AED", border: "1px solid #DDD6FE" }}
                                                    title="Archive this season">
                                                    <Archive size={11} /> Archive
                                                </button>
                                                {/* Edit */}
                                                <button onClick={() => openEdit(crop)}
                                                        className="p-1.5 rounded-lg"
                                                        style={{ background: "var(--bg-subtle)", color: "var(--text-muted)" }}>
                                                    <Pencil size={13} />
                                                </button>
                                            </>
                                        )}
                                        {crop.isArchived && (
                                            <button
                                                onClick={() => handleUnarchive(crop.id)}
                                                className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg"
                                                style={{ background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0" }}>
                                                <RotateCcw size={11} /> Restore
                                            </button>
                                        )}
                                        {/* Delete */}
                                        <button
                                            onClick={() => handleDelete(crop.id)}
                                            disabled={deletingId === crop.id}
                                            className="p-1.5 rounded-lg"
                                            style={{ background: "#FFF1F2", color: "#E11D48" }}>
                                            {deletingId === crop.id
                                                ? <Loader2 size={13} className="animate-spin" />
                                                : <Trash2 size={13} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Add/Edit slide-over ────────────────────────────────────────── */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setShowForm(false)} />
                    <div className="w-full max-w-md h-full flex flex-col shadow-2xl"
                         style={{ background: "var(--bg-card)", borderLeft: "1px solid var(--border)" }}>

                        <div className="flex items-center justify-between px-6 py-5 flex-shrink-0"
                             style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                            <h2 className="text-base font-black" style={{ color: "var(--text-primary)" }}>
                                {editingCrop ? "Edit crop" : "Add new crop"}
                            </h2>
                            <button onClick={() => setShowForm(false)}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                                    style={{ background: "var(--bg-subtle)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                                <X size={15} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">

                                {/* Crop type */}
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                           style={{ color: "var(--text-muted)" }}>Crop type *</label>
                                    <div className="flex gap-2">
                                        <select value={form.cropTypeId}
                                                onChange={(e) => setF("cropTypeId", e.target.value)}
                                                required
                                                className="flex-1 h-11 px-3 rounded-xl text-sm outline-none"
                                                style={{ border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-primary)" }}>
                                            <option value="">Select crop...</option>
                                            {cropTypes.map((t) => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* Quick add type */}
                                    <div className="flex gap-2 mt-2">
                                        <input
                                            value={newTypeName}
                                            onChange={(e) => setNewTypeName(e.target.value)}
                                            placeholder="Add new crop type..."
                                            className="flex-1 h-9 px-3 rounded-xl text-xs outline-none"
                                            style={{ border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-primary)" }}
                                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddType(); } }}
                                        />
                                        <button type="button" onClick={handleAddType} disabled={addingType}
                                                className="h-9 px-3 rounded-xl text-xs font-bold"
                                                style={{ background: "var(--farm-pale)", color: "var(--farm-green)" }}>
                                            {addingType ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Field */}
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                           style={{ color: "var(--text-muted)" }}>Field *</label>
                                    <select value={form.fieldId}
                                            onChange={(e) => setF("fieldId", e.target.value)}
                                            required
                                            className="w-full h-11 px-3 rounded-xl text-sm outline-none"
                                            style={{ border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-primary)" }}>
                                        <option value="">Select field...</option>
                                        {fields.map((f) => {
                                            const remaining = Math.max(0, Number(f.cultivatableArea ?? f.totalArea ?? 0) - Number(f.allocatedArea ?? 0) + (editingCrop?.fieldId === f.id ? Number(editingCrop.areaPlanted ?? 0) : 0));
                                            return (
                                                <option key={f.id} value={f.id}>
                                                    {f.name} - {remaining.toFixed(2)} ha remaining
                                                </option>
                                            );
                                        })}
                                    </select>
                                    {selectedFieldRemaining !== null && (
                                        <p className="text-[11px] mt-1.5 font-bold" style={{ color: "var(--text-muted)" }}>
                                            Available for this crop: {selectedFieldRemaining.toFixed(2)} ha of {selectedField?.cultivatableArea ?? selectedField?.totalArea} ha cultivatable
                                        </p>
                                    )}
                                </div>

                                {/* Variety & area */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                               style={{ color: "var(--text-muted)" }}>Variety *</label>
                                        <input value={form.variety}
                                               onChange={(e) => setF("variety", e.target.value)}
                                               placeholder="e.g. SC403, DK8031"
                                               required
                                               className="w-full h-11 px-3 rounded-xl text-sm outline-none"
                                               style={{ border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-primary)" }} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                               style={{ color: "var(--text-muted)" }}>Area planted (ha)</label>
                                        <input type="number" min="0" step="0.01"
                                               value={form.areaPlanted}
                                               onChange={(e) => setF("areaPlanted", e.target.value)}
                                               placeholder="e.g. 1.5"
                                               className="w-full h-11 px-3 rounded-xl text-sm outline-none"
                                               style={{ border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-primary)" }} />
                                    </div>
                                </div>

                                {/* Season */}
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                           style={{ color: "var(--text-muted)" }}>Season *</label>
                                    {seasons.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                            {[
                                                { key: "existing", label: "Select existing" },
                                                { key: "manual", label: "Manual entry" },
                                            ].map((option) => (
                                                <button key={option.key} type="button"
                                                        onClick={() => { setSeasonMode(option.key as any); if (option.key === "existing") setF("season", seasons[0] ?? ""); }}
                                                        className="h-9 rounded-xl text-xs font-bold"
                                                        style={{
                                                            background: seasonMode === option.key ? "var(--farm-pale)" : "var(--bg-subtle)",
                                                            color: seasonMode === option.key ? "var(--farm-green)" : "var(--text-muted)",
                                                            border: `1.5px solid ${seasonMode === option.key ? "var(--farm-green)" : "var(--border)"}`,
                                                        }}>
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {seasonMode === "existing" && seasons.length > 0 ? (
                                        <select value={form.season}
                                                onChange={(e) => setF("season", e.target.value)}
                                                required
                                                className="w-full h-11 px-3 rounded-xl text-sm outline-none"
                                                style={{ border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-primary)" }}>
                                            <option value="">Select season...</option>
                                            {seasons.map((season) => <option key={season} value={season}>{season}</option>)}
                                        </select>
                                    ) : (
                                        <input value={form.season}
                                               onChange={(e) => setF("season", e.target.value)}
                                               placeholder="e.g. 2026 dry season"
                                               required
                                               className="w-full h-11 px-3 rounded-xl text-sm outline-none"
                                               style={{ border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-primary)" }} />
                                    )}
                                </div>

                                {editingCrop && (
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                               style={{ color: "var(--text-muted)" }}>Expected harvest</label>
                                        <input type="date"
                                               value={form.expectedHarvestDate}
                                               onChange={(e) => setF("expectedHarvestDate", e.target.value)}
                                               className="w-full h-11 px-3 rounded-xl text-sm outline-none"
                                               style={{ border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-primary)" }} />
                                    </div>
                                )}

                                {/* Status */}
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                           style={{ color: "var(--text-muted)" }}>Status</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {STATUSES.map((s) => (
                                            <button key={s} type="button"
                                                    onClick={() => setF("status", s)}
                                                    className="py-2 rounded-xl text-xs font-bold transition-all"
                                                    style={{
                                                        background: form.status === s ? "var(--farm-pale)"  : "var(--bg-subtle)",
                                                        color:      form.status === s ? "var(--farm-green)" : "var(--text-muted)",
                                                        border:     `1.5px solid ${form.status === s ? "var(--farm-green)" : "var(--border)"}`,
                                                    }}>
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {formError && (
                                    <div className="rounded-xl px-4 py-3"
                                         style={{ background: "#FFF1F2", border: "1px solid #FFE4E6" }}>
                                        <p className="text-sm font-semibold" style={{ color: "#E11D48" }}>{formError}</p>
                                    </div>
                                )}
                            </div>

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
                                        : <><Check size={14} /> {editingCrop ? "Save changes" : "Add crop"}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Archive modal ──────────────────────────────────────────────── */}
            {archiveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                         onClick={() => setArchiveModal(null)} />
                    <div className="relative rounded-2xl p-6 w-full max-w-md shadow-2xl z-10"
                         style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>

                        <h2 className="text-base font-black mb-1" style={{ color: "var(--text-primary)" }}>
                            Archive this crop season?
                        </h2>
                        <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
                            <strong>{archiveModal.cropTypeName}</strong> — {archiveModal.variety} ({archiveModal.season})
                            <br />
                            All activities, yields and records are preserved and available in reports.
                            This crop will no longer appear in the active dashboard.
                        </p>

                        <form onSubmit={handleArchive} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                       style={{ color: "var(--text-muted)" }}>Reason (optional)</label>
                                <select value={archiveReason}
                                        onChange={(e) => setArchiveReason(e.target.value)}
                                        className="w-full h-11 px-3 rounded-xl text-sm outline-none"
                                        style={{ border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-primary)" }}>
                                    <option value="">Select reason...</option>
                                    {ARCHIVE_REASONS.map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="rounded-xl p-3"
                                 style={{ background: "#F5F3FF", border: "1px solid #DDD6FE" }}>
                                <p className="text-xs font-semibold" style={{ color: "#6D28D9" }}>
                                    ℹ️ You can restore an archived crop at any time from the "View archived" section.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button type="button" onClick={() => setArchiveModal(null)}
                                        className="flex-1 h-11 rounded-xl font-bold text-sm"
                                        style={{ border: "1.5px solid var(--border)", color: "var(--text-muted)" }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={archiving}
                                        className="flex-1 h-11 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
                                        style={{ background: archiving ? "#94A3B8" : "#7C3AED" }}>
                                    {archiving
                                        ? <><Loader2 size={14} className="animate-spin" /> Archiving...</>
                                        : <><Archive size={14} /> Archive season</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper to get status config
function STATUS_CONFIG(crop: any, map: Record<string, { bg: string; color: string }>) {
    const key = crop.isArchived ? "Archived" : (crop.status ?? "Active");
    return map[key] ?? map["Active"];
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Check, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { submitWithOfflineQueue } from "@/lib/offlineQueue";
import { getCropTimeline } from "@/lib/cropTimelines";

const ACTIVITY_TYPES = [
    "Land preparation", "Soil Preparation", "Nursery and land preparation", "Planting", "Transplanting", "Gap filling and thinning",
    "Seed selection and treatment", "Seed inoculation and treatment", "Irrigation", "Water management",
    "Spraying", "Pest Control", "Pest and disease scouting", "Pest and disease control", "Weeding", "First weeding", "Second weeding",
    "Top dressing", "Fertilizing", "Topping and suckering", "Harvesting", "Drying and storage",
    "Drying, grading, and storage", "Curing and storage", "Sorting and storage", "Grading and storage",
    "Cutting and loading", "Other",
];

const INPUT_CATEGORIES = [
    "Seed", "Fertilizer", "Chemical / Pesticide", "Fuel", "Feed", "Other",
];

const emptyLabour = { employeeId: "", hoursWorked: "", daysWorked: "", totalCost: "" };
const emptyInput = { inventoryItemId: "", inputName: "", category: "Seed", quantity: "", unit: "kg", unitCost: "" };
const emptyOtherCost = { description: "", amount: "" };

function fmt(n: number) {
    return new Intl.NumberFormat("en-MW").format(Math.round(n));
}

function inventoryCategoryToInputCategory(category: string) {
    const normalized = category.toLowerCase();
    if (normalized.includes("seed")) return "Seed";
    if (normalized.includes("fertil")) return "Fertilizer";
    if (normalized.includes("chemical") || normalized.includes("pesticide")) return "Chemical / Pesticide";
    if (normalized.includes("feed")) return "Feed";
    if (normalized.includes("fuel")) return "Fuel";
    return "Other";
}

function calculateInventoryUnitCost(item: any, activityDate: string) {
    const baseCost = Number(item.acquisitionUnitCost ?? 0);
    if (!baseCost) return 0;
    if (!item.acquiredAt) return baseCost;
    const acquiredAt = new Date(item.acquiredAt).getTime();
    const usedAt = new Date(activityDate).getTime();
    const daysHeld = Math.max(0, Math.ceil((usedAt - acquiredAt) / 86_400_000));
    return baseCost + baseCost * 0.12 * (daysHeld / 365);
}

export default function NewActivityPage() {
    const router = useRouter();
    const [fields, setFields] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [cropFields, setCropFields] = useState<any[]>([]);
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [fieldId, setFieldId] = useState("");
    const [cropFieldId, setCropFieldId] = useState("");
    const [activityType, setActivityType] = useState(ACTIVITY_TYPES[0]);
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [notes, setNotes] = useState("");
    const [responsibleEmployeeId, setResponsibleEmployeeId] = useState("");
    const [responsibleMode, setResponsibleMode] = useState<"employee" | "custom">("employee");
    const [responsiblePersonName, setResponsiblePersonName] = useState("");
    const [labourRecords, setLabourRecords] = useState([{ ...emptyLabour }]);
    const [inputs, setInputs] = useState([{ ...emptyInput }]);
    const [otherCosts, setOtherCosts] = useState([{ ...emptyOtherCost }]);

    useEffect(() => {
        Promise.all([
            fetch("/api/fields").then((r) => r.json()),
            fetch("/api/employees").then((r) => r.json()),
            fetch("/api/crops").then((r) => r.json()),
            fetch("/api/inventory").then((r) => r.ok ? r.json() : { items: [] }).catch(() => ({ items: [] })),
        ]).then(([f, e, c, inv]) => {
            setFields(f);
            setEmployees(e);
            setCropFields(c);
            setInventoryItems((inv?.items ?? []).filter((item: any) => item.quantity > 0 && item.category !== "crop_harvest"));
            const params = new URLSearchParams(window.location.search);
            const requestedCropId = params.get("cropFieldId");
            const requestedActivity = params.get("activityType");
            const requestedCrop = Array.isArray(c) ? c.find((crop) => crop.id === requestedCropId) : null;
            if (requestedCrop) {
                setFieldId(requestedCrop.fieldId);
                setCropFieldId(requestedCrop.id);
            }
            if (requestedActivity) setActivityType(requestedActivity);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        setInputs((current) => current.map((input) => {
            if (!input.inventoryItemId) return input;
            const item = inventoryItems.find((inventory) => inventory.id === input.inventoryItemId);
            return item ? { ...input, unitCost: calculateInventoryUnitCost(item, date).toFixed(2) } : input;
        }));
    }, [date, inventoryItems]);

    const filteredCrops = cropFields.filter((c) => c.fieldId === fieldId && c.status === "Active");
    const selectedCrop = cropFields.find((crop) => crop.id === cropFieldId);
    const cropTimeline = getCropTimeline(selectedCrop?.cropTypeName);
    const activityOptions = cropTimeline
        ? [...cropTimeline.steps.map((step) => step.title), "Other"]
        : ACTIVITY_TYPES;

    const totalLabour = labourRecords.reduce((s, l) => s + (parseFloat(l.totalCost) || 0), 0);
    const totalInput = inputs.reduce((s, i) => s + ((parseFloat(i.quantity) || 0) * (parseFloat(i.unitCost) || 0)), 0);
    const totalOther = otherCosts.reduce((s, o) => s + (parseFloat(o.amount) || 0), 0);
    const grandTotal = totalLabour + totalInput + totalOther;

    const updateLabour = (i: number, k: string, v: string) => {
        const updated = [...labourRecords];
        updated[i] = { ...updated[i], [k]: v };
        // Auto-calculate cost from employee pay rate
        if (k === "employeeId" || k === "daysWorked" || k === "hoursWorked") {
            const emp = employees.find((e) => e.id === (k === "employeeId" ? v : updated[i].employeeId));
            if (emp) {
                const days = parseFloat(k === "daysWorked" ? v : updated[i].daysWorked) || 0;
                const hours = parseFloat(k === "hoursWorked" ? v : updated[i].hoursWorked) || 0;
                const cost = emp.payRateUnit === "Per Day" ? days * emp.payRate : hours * emp.payRate;
                updated[i].totalCost = cost > 0 ? cost.toFixed(2) : updated[i].totalCost;
            }
        }
        setLabourRecords(updated);
    };

    const updateInput = (i: number, k: string, v: string) => {
        const updated = [...inputs];
        updated[i] = { ...updated[i], [k]: v };
        if (k === "inventoryItemId") {
            const item = inventoryItems.find((inventory) => inventory.id === v);
            updated[i] = item
                ? {
                    ...updated[i],
                    inventoryItemId: item.id,
                    inputName: item.name,
                    category: inventoryCategoryToInputCategory(item.category),
                    unit: item.unit,
                    unitCost: calculateInventoryUnitCost(item, date).toFixed(2),
                }
                : { ...updated[i], inventoryItemId: "", inputName: "", unitCost: "" };
        }
        if (k === "quantity" && updated[i].inventoryItemId) {
            const item = inventoryItems.find((inventory) => inventory.id === updated[i].inventoryItemId);
            if (item) updated[i].unitCost = calculateInventoryUnitCost(item, date).toFixed(2);
        }
        setInputs(updated);
    };

    const updateOther = (i: number, k: string, v: string) => {
        const updated = [...otherCosts];
        updated[i] = { ...updated[i], [k]: v };
        setOtherCosts(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        const validLabour = labourRecords.filter((l) => l.employeeId);
        const validInputs = inputs.filter((i) => i.inputName.trim() || i.inventoryItemId);
        const validOther = otherCosts.filter((o) => o.description.trim());

        const result = await submitWithOfflineQueue("/api/activities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fieldId,
                cropFieldId: cropFieldId || null,
                activityType,
                date,
                notes,
                responsibleEmployeeId: responsibleMode === "employee" ? responsibleEmployeeId || null : null,
                responsiblePersonName: responsibleMode === "custom" ? responsiblePersonName : null,
                labourRecords: validLabour,
                inputs: validInputs,
                otherCosts: validOther,
            }),
        }, `${activityType} activity`);

        if (result.queued) {
            setSaving(false);
            alert("Saved offline. AgriVault will sync this activity when the connection returns.");
            router.push("/dashboard/activities");
            return;
        }

        if (!result.response?.ok) {
            setError(result.data?.error ?? "Failed to save activity");
            setSaving(false);
        } else {
            router.push("/dashboard/activities");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 size={24} className="animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/activities" className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 className="text-2xl font-medium text-slate-900">Log activity</h1>
                    <p className="text-slate-400 text-sm mt-1">Record a farm activity with labour, inputs and costs</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                {/* Basic info */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <h2 className="text-base font-medium text-slate-900 mb-5">Basic information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <div>
                            <label className="text-sm text-slate-500 mb-1.5 block">Field <span className="text-red-400">*</span></label>
                            <select
                                value={fieldId}
                                onChange={(e) => { setFieldId(e.target.value); setCropFieldId(""); }}
                                required
                                className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 transition-colors"
                            >
                                <option value="">Select field...</option>
                                {fields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm text-slate-500 mb-1.5 block">
                                Specific crop <span className="text-slate-300">(optional)</span>
                            </label>
                            <select
                                value={cropFieldId}
                                onChange={(e) => {
                                    const nextCropId = e.target.value;
                                    setCropFieldId(nextCropId);
                                    const nextCrop = cropFields.find((crop) => crop.id === nextCropId);
                                    const nextTimeline = getCropTimeline(nextCrop?.cropTypeName);
                                    if (nextTimeline && !nextTimeline.steps.some((step) => step.title === activityType)) {
                                        setActivityType(nextTimeline.steps[0]?.title ?? "Other");
                                    }
                                }}
                                disabled={!fieldId}
                                className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 transition-colors disabled:opacity-50"
                            >
                                <option value="">Whole field</option>
                                {filteredCrops.map((c) => (
                                    <option key={c.id} value={c.id}>{c.cropTypeName} — {c.variety} ({c.areaPlanted} ha)</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm text-slate-500 mb-1.5 block">Activity type <span className="text-red-400">*</span></label>
                            <select
                                value={activityType}
                                onChange={(e) => setActivityType(e.target.value)}
                                required
                                className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 transition-colors"
                            >
                                {activityOptions.map((t) => <option key={t}>{t}</option>)}
                            </select>
                            {cropTimeline && (
                                <p className="text-xs text-slate-400 mt-1.5">
                                    Activity options are guided by the {selectedCrop?.cropTypeName} timeline.
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm text-slate-500 mb-1.5 block">Date <span className="text-red-400">*</span></label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                                className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-slate-500 mb-1.5 block">
                                Responsible person <span className="text-slate-300">(optional)</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                {[
                                    { key: "employee", label: "Employee" },
                                    { key: "custom", label: "Piece worker" },
                                ].map((option) => (
                                    <button
                                        key={option.key}
                                        type="button"
                                        onClick={() => {
                                            setResponsibleMode(option.key as "employee" | "custom");
                                            setResponsibleEmployeeId("");
                                            setResponsiblePersonName("");
                                        }}
                                        className="h-10 rounded-xl text-xs font-bold border"
                                        style={{
                                            background: responsibleMode === option.key ? "#EFF6FF" : "#F8FAFC",
                                            borderColor: responsibleMode === option.key ? "#BFDBFE" : "#E2E8F0",
                                            color: responsibleMode === option.key ? "#1E3A8A" : "#64748B",
                                        }}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                            {responsibleMode === "employee" ? (
                                <select
                                    value={responsibleEmployeeId}
                                    onChange={(e) => setResponsibleEmployeeId(e.target.value)}
                                    className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 transition-colors"
                                >
                                    <option value="">Select employee...</option>
                                    {employees.filter((e) => e.isActive).map((e) => (
                                        <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    value={responsiblePersonName}
                                    onChange={(e) => setResponsiblePersonName(e.target.value)}
                                    placeholder="e.g. Banda piece-work crew"
                                    className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 transition-colors"
                                />
                            )}
                        </div>

                        <div>
                            <label className="text-sm text-slate-500 mb-1.5 block">Notes <span className="text-slate-300">(optional)</span></label>
                            <input
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any notes about this activity..."
                                className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Labour */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-base font-medium text-slate-900">Labour</h2>
                            <p className="text-xs text-slate-400 mt-0.5">MWK {fmt(totalLabour)} total</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setLabourRecords([...labourRecords, { ...emptyLabour }])}
                            className="flex items-center gap-1.5 h-8 px-3 border border-slate-200 text-slate-600 text-xs font-medium rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            <Plus size={13} /> Add worker
                        </button>
                    </div>
                    <div className="flex flex-col gap-3">
                        {labourRecords.map((l, i) => (
                            <div key={i} className="grid grid-cols-12 gap-3 items-end">
                                <div className="col-span-4">
                                    {i === 0 && <label className="text-xs text-slate-400 mb-1.5 block">Employee</label>}
                                    <select
                                        value={l.employeeId}
                                        onChange={(e) => updateLabour(i, "employeeId", e.target.value)}
                                        className="w-full h-11 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400"
                                    >
                                        <option value="">Select...</option>
                                        {employees.filter((e) => e.isActive).map((e) => (
                                            <option key={e.id} value={e.id}>{e.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    {i === 0 && <label className="text-xs text-slate-400 mb-1.5 block">Days</label>}
                                    <input
                                        type="number" step="0.5" min="0"
                                        value={l.daysWorked}
                                        onChange={(e) => updateLabour(i, "daysWorked", e.target.value)}
                                        placeholder="0"
                                        className="w-full h-11 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400"
                                    />
                                </div>
                                <div className="col-span-2">
                                    {i === 0 && <label className="text-xs text-slate-400 mb-1.5 block">Hours</label>}
                                    <input
                                        type="number" step="0.5" min="0"
                                        value={l.hoursWorked}
                                        onChange={(e) => updateLabour(i, "hoursWorked", e.target.value)}
                                        placeholder="0"
                                        className="w-full h-11 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400"
                                    />
                                </div>
                                <div className="col-span-3">
                                    {i === 0 && <label className="text-xs text-slate-400 mb-1.5 block">Cost (MWK)</label>}
                                    <input
                                        type="number" step="1" min="0"
                                        value={l.totalCost}
                                        onChange={(e) => updateLabour(i, "totalCost", e.target.value)}
                                        placeholder="0"
                                        className="w-full h-11 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400"
                                    />
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    {labourRecords.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => setLabourRecords(labourRecords.filter((_, idx) => idx !== i))}
                                            className="h-11 w-11 flex items-center justify-center rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Inputs */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-base font-medium text-slate-900">Inputs used</h2>
                            <p className="text-xs text-slate-400 mt-0.5">MWK {fmt(totalInput)} total</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setInputs([...inputs, { ...emptyInput }])}
                            className="flex items-center gap-1.5 h-8 px-3 border border-slate-200 text-slate-600 text-xs font-medium rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            <Plus size={13} /> Add input
                        </button>
                    </div>
                    <div className="flex flex-col gap-3">
                        {inputs.map((inp, i) => (
                            <div key={i} className="grid grid-cols-12 gap-3 items-end rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                                <div className="col-span-12 md:col-span-5">
                                    {i === 0 && <label className="text-xs text-slate-400 mb-1.5 block">Inventory stock</label>}
                                    <select
                                        value={inp.inventoryItemId}
                                        onChange={(e) => updateInput(i, "inventoryItemId", e.target.value)}
                                        className="w-full h-11 px-3 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-slate-400"
                                    >
                                        <option value="">Manual input</option>
                                        {inventoryItems.map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.name} - {item.quantity} {item.unit} available
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-12 md:col-span-4">
                                    {i === 0 && <label className="text-xs text-slate-400 mb-1.5 block">Input name</label>}
                                    <input
                                        value={inp.inputName}
                                        onChange={(e) => updateInput(i, "inputName", e.target.value)}
                                        placeholder="e.g. Urea"
                                        readOnly={Boolean(inp.inventoryItemId)}
                                        className="w-full h-11 px-3 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-slate-400 read-only:bg-slate-100"
                                    />
                                </div>
                                <div className="col-span-12 md:col-span-3">
                                    {i === 0 && <label className="text-xs text-slate-400 mb-1.5 block">Category</label>}
                                    <select
                                        value={inp.category}
                                        onChange={(e) => updateInput(i, "category", e.target.value)}
                                        disabled={Boolean(inp.inventoryItemId)}
                                        className="w-full h-11 px-3 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-slate-400 disabled:bg-slate-100"
                                    >
                                        {INPUT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    {i === 0 && <label className="text-xs text-slate-400 mb-1.5 block">Qty</label>}
                                    <input
                                        type="number" step="0.01" min="0"
                                        value={inp.quantity}
                                        onChange={(e) => updateInput(i, "quantity", e.target.value)}
                                        placeholder="0"
                                        className="w-full h-11 px-3 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-slate-400"
                                    />
                                </div>
                                <div className="col-span-3 md:col-span-2">
                                    {i === 0 && <label className="text-xs text-slate-400 mb-1.5 block">Unit</label>}
                                    <input
                                        value={inp.unit}
                                        onChange={(e) => updateInput(i, "unit", e.target.value)}
                                        placeholder="kg"
                                        readOnly={Boolean(inp.inventoryItemId)}
                                        className="w-full h-11 px-3 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-slate-400 read-only:bg-slate-100"
                                    />
                                </div>
                                <div className="col-span-4 md:col-span-3">
                                    {i === 0 && <label className="text-xs text-slate-400 mb-1.5 block">Unit cost at use</label>}
                                    <input
                                        type="number" step="1" min="0"
                                        value={inp.unitCost}
                                        onChange={(e) => updateInput(i, "unitCost", e.target.value)}
                                        placeholder="0"
                                        readOnly={Boolean(inp.inventoryItemId)}
                                        className="w-full h-11 px-3 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-slate-400 read-only:bg-slate-100"
                                    />
                                </div>
                                <div className="col-span-3 md:col-span-2 flex items-end">
                                    <div className="h-11 flex items-center">
                                        <span className="text-xs text-slate-500 font-bold">
                                            MWK {fmt((parseFloat(inp.quantity) || 0) * (parseFloat(inp.unitCost) || 0))}
                                        </span>
                                    </div>
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    {inputs.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => setInputs(inputs.filter((_, idx) => idx !== i))}
                                            className="h-11 w-11 flex items-center justify-center rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                                {inp.inventoryItemId && (
                                    <p className="col-span-12 text-[11px] text-slate-500">
                                        Cost uses acquisition cost plus 12% annual carrying cost up to the activity date. Stock will be deducted when saved.
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Other costs */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-base font-medium text-slate-900">Other costs</h2>
                            <p className="text-xs text-slate-400 mt-0.5">MWK {fmt(totalOther)} total</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setOtherCosts([...otherCosts, { ...emptyOtherCost }])}
                            className="flex items-center gap-1.5 h-8 px-3 border border-slate-200 text-slate-600 text-xs font-medium rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            <Plus size={13} /> Add cost
                        </button>
                    </div>
                    <div className="flex flex-col gap-3">
                        {otherCosts.map((o, i) => (
                            <div key={i} className="grid grid-cols-12 gap-3 items-end">
                                <div className="col-span-8">
                                    {i === 0 && <label className="text-xs text-slate-400 mb-1.5 block">Description</label>}
                                    <input
                                        value={o.description}
                                        onChange={(e) => updateOther(i, "description", e.target.value)}
                                        placeholder="e.g. Tractor hire, Transport..."
                                        className="w-full h-11 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400"
                                    />
                                </div>
                                <div className="col-span-3">
                                    {i === 0 && <label className="text-xs text-slate-400 mb-1.5 block">Amount (MWK)</label>}
                                    <input
                                        type="number" step="1" min="0"
                                        value={o.amount}
                                        onChange={(e) => updateOther(i, "amount", e.target.value)}
                                        placeholder="0"
                                        className="w-full h-11 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400"
                                    />
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    {otherCosts.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => setOtherCosts(otherCosts.filter((_, idx) => idx !== i))}
                                            className="h-11 w-11 flex items-center justify-center rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cost summary */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Labour</span>
                            <span className="text-slate-900">MWK {fmt(totalLabour)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Inputs</span>
                            <span className="text-slate-900">MWK {fmt(totalInput)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Other costs</span>
                            <span className="text-slate-900">MWK {fmt(totalOther)}</span>
                        </div>
                        <div className="border-t border-slate-200 pt-2 flex justify-between">
                            <span className="text-sm font-medium text-slate-900">Grand total</span>
                            <span className="text-base font-medium text-slate-900">MWK {fmt(grandTotal)}</span>
                        </div>
                    </div>
                </div>

                {error && (
                    <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
                )}

                {/* Submit */}
                <div className="flex gap-3">
                    <Link
                        href="/dashboard/activities"
                        className="flex-1 h-12 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 h-12 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving
                            ? <><Loader2 size={15} className="animate-spin" /> Saving...</>
                            : <><Check size={15} /> Save activity</>}
                    </button>
                </div>
            </form>
        </div>
    );
}

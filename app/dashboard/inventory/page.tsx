"use client";

import { useEffect, useState } from "react";
import {
    Plus, Loader2, X, Check, Pencil, Trash2,
    Package, TrendingUp, ShoppingCart,
} from "lucide-react";

const CATEGORIES = [
    { value: "crop_harvest", label: "Crop harvest" },
    { value: "seed",         label: "Seeds" },
    { value: "fertiliser",  label: "Fertilisers" },
    { value: "chemical",    label: "Chemicals & pesticides" },
    { value: "equipment",   label: "Equipment" },
    { value: "other",       label: "Other" },
];

const UNITS = ["kg", "bags", "tonnes", "litres", "units", "crates", "buckets"];

const CATEGORY_COLORS: Record<string, string> = {
    crop_harvest: "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    seed:         "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    fertiliser:   "bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    chemical:     "bg-orange-50 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    equipment:    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
    other:        "bg-purple-50 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

function fmt(n: number) {
    return new Intl.NumberFormat("en-MW").format(Math.round(n));
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
    });
}

const emptyForm = {
    name: "", category: "crop_harvest", unit: "kg",
    quantity: "", unitWeight: "", season: "", cropFieldId: "", notes: "",
};

const emptySaleForm = {
    inventoryItemId: "", quantitySold: "", unit: "kg",
    pricePerUnit: "", buyerName: "", saleDate: new Date().toISOString().split("T")[0],
    notes: "", createTransaction: true,
};

export default function InventoryPage() {
    const [data, setData] = useState<any>(null);
    const [cropFields, setCropFields] = useState<any[]>([]);
    const [allSeasons, setAllSeasons] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [seasonFilter, setSeasonFilter] = useState("All");
    const [showSaleForm, setShowSaleForm] = useState(false);
    const [saleForm, setSaleForm] = useState({ ...emptySaleForm });
    const [saleSaving, setSaleSaving] = useState(false);
    const [saleError, setSaleError] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        Promise.all([
            fetch("/api/inventory").then((r) => r.json()),
            fetch("/api/finance").then((r) => r.json()),
        ]).then(([inv, fin]) => {
            setData(inv);
            setCropFields(fin.allCropFields ?? []);
            setAllSeasons(inv.allSeasons ?? []);
            setLoading(false);
        });
    };

    useEffect(() => { load(); }, []);

    const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
    const setSale = (k: string, v: any) => setSaleForm((f) => ({ ...f, [k]: v }));

    const openAdd = () => {
        setEditingItem(null);
        setForm({ ...emptyForm });
        setError("");
        setShowForm(true);
    };

    const openEdit = (item: any) => {
        setEditingItem(item);
        setForm({
            name: item.name,
            category: item.category,
            unit: item.unit,
            quantity: item.quantity.toString(),
            unitWeight: item.unitWeight?.toString() ?? "",
            season: item.season ?? "",
            cropFieldId: item.cropFieldId ?? "",
            notes: item.notes ?? "",
        });
        setError("");
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        const url = editingItem ? `/api/inventory/${editingItem.id}` : "/api/inventory";
        const method = editingItem ? "PATCH" : "POST";
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        const d = await res.json();
        if (!res.ok) { setError(d.error); setSaving(false); }
        else { setShowForm(false); load(); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this inventory item?")) return;
        setDeletingId(id);
        await fetch(`/api/inventory/${id}`, { method: "DELETE" });
        setDeletingId(null);
        load();
    };

    const openSale = (item: any) => {
        setSaleForm({ ...emptySaleForm, inventoryItemId: item.id, unit: item.unit });
        setSaleError("");
        setShowSaleForm(true);
    };

    const handleSaleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaleSaving(true);
        setSaleError("");
        const res = await fetch("/api/inventory/sales", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(saleForm),
        });
        const d = await res.json();
        if (!res.ok) { setSaleError(d.error); setSaleSaving(false); }
        else { setShowSaleForm(false); load(); }
    };

    const items = (data?.items ?? []).filter((i: any) => {
        if (categoryFilter !== "All" && i.category !== categoryFilter) return false;
        if (seasonFilter !== "All" && i.season !== seasonFilter) return false;
        return true;
    });

    return (
        <div className="p-8 max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Inventory</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {data?.totals?.items ?? 0} items &mdash; MWK {fmt(data?.totals?.totalRevenue ?? 0)} in sales
                    </p>
                </div>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 h-10 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                >
                    <Plus size={16} /> Add item
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {(data?.byCategory ?? []).slice(0, 4).map((cat: any) => (
                    <div key={cat.category} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                        <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-2 capitalize">
                            {CATEGORIES.find((c) => c.value === cat.category)?.label ?? cat.category}
                        </p>
                        <p className="text-2xl font-semibold text-slate-900 dark:text-white">{cat.count}</p>
                        {cat.totalRevenue > 0 && (
                            <p className="text-xs text-slate-400 mt-1">MWK {fmt(cat.totalRevenue)} revenue</p>
                        )}
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex gap-2 flex-wrap">
                    {["All", ...CATEGORIES.map((c) => c.value)].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`h-8 px-3 rounded-xl text-xs font-medium transition-colors capitalize ${
                                categoryFilter === cat
                                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300"
                            }`}
                        >
                            {cat === "All" ? "All" : CATEGORIES.find((c) => c.value === cat)?.label ?? cat}
                        </button>
                    ))}
                </div>

                {allSeasons.length > 0 && (
                    <select
                        value={seasonFilter}
                        onChange={(e) => setSeasonFilter(e.target.value)}
                        className="h-8 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-600 dark:text-slate-400"
                    >
                        <option value="All">All seasons</option>
                        {allSeasons.map((s) => <option key={s}>{s}</option>)}
                    </select>
                )}
            </div>

            {/* Items list */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={24} className="animate-spin text-slate-400" />
                </div>
            ) : items.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center">
                    <p className="text-4xl mb-4">📦</p>
                    <p className="text-slate-900 dark:text-white font-semibold mb-1">No inventory items yet</p>
                    <p className="text-slate-400 text-sm mb-6">
                        Items are added automatically when you record a harvest, or add them manually here.
                    </p>
                    <button
                        onClick={openAdd}
                        className="inline-flex items-center gap-2 h-10 px-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                    >
                        <Plus size={16} /> Add item
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {items.map((item: any) => (
                        <div
                            key={item.id}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden"
                        >
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xl flex-shrink-0">
                                            {item.category === "crop_harvest" ? "🌾" :
                                                item.category === "seed" ? "🌱" :
                                                    item.category === "fertiliser" ? "🧪" :
                                                        item.category === "chemical" ? "⚗️" :
                                                            item.category === "equipment" ? "🔧" : "📦"}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 dark:text-white">{item.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${CATEGORY_COLORS[item.category]}`}>
                          {CATEGORIES.find((c) => c.value === item.category)?.label ?? item.category}
                        </span>
                                                {item.season && (
                                                    <span className="text-xs text-slate-400">{item.season}</span>
                                                )}
                                                {item.fieldName && (
                                                    <span className="text-xs text-slate-400">{item.fieldName}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => openSale(item)}
                                            className="flex items-center gap-1.5 h-8 px-3 bg-[#eaf3de] dark:bg-[#1a3d1f] text-[#27500a] dark:text-[#7dd68a] text-xs font-semibold rounded-xl hover:bg-[#d4e8c2] dark:hover:bg-[#2d5c35] transition-colors"
                                            title="Record sale"
                                        >
                                            <ShoppingCart size={12} /> Record sale
                                        </button>
                                        <button
                                            onClick={() => openEdit(item)}
                                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            disabled={deletingId === item.id}
                                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                        >
                                            {deletingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                                        <p className="text-xs text-slate-400 mb-1">Available</p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {item.quantity} {item.unit}
                                        </p>
                                        {item.unitWeight && (
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                ≈ {fmt(item.quantityKg)} kg
                                            </p>
                                        )}
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                                        <p className="text-xs text-slate-400 mb-1">Total sold</p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {item.totalSold > 0 ? `${item.totalSold} ${item.unit}` : "—"}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                                        <p className="text-xs text-slate-400 mb-1">Revenue</p>
                                        <p className="text-sm font-semibold text-[#1a3d1f] dark:text-[#7dd68a]">
                                            {item.totalRevenue > 0 ? `MWK ${fmt(item.totalRevenue)}` : "—"}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                                        <p className="text-xs text-slate-400 mb-1">Sales records</p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {item.sales.length}
                                        </p>
                                    </div>
                                </div>

                                {/* Sales history toggle */}
                                {item.sales.length > 0 && (
                                    <div className="mt-4">
                                        <button
                                            onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                                        >
                                            {expandedId === item.id ? "Hide" : "Show"} sale history ({item.sales.length})
                                        </button>

                                        {expandedId === item.id && (
                                            <div className="mt-3 flex flex-col gap-2">
                                                {item.sales.map((sale: any, i: number) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3"
                                                    >
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                                {sale.quantitySold} {sale.unit} @ MWK {fmt(sale.pricePerUnit)} / {sale.unit}
                                                            </p>
                                                            <p className="text-xs text-slate-400">
                                                                {formatDate(sale.saleDate)}
                                                                {sale.buyerName && ` · ${sale.buyerName}`}
                                                                {sale.notes && ` · ${sale.notes}`}
                                                            </p>
                                                        </div>
                                                        <p className="text-sm font-semibold text-[#1a3d1f] dark:text-[#7dd68a]">
                                                            MWK {fmt(sale.totalAmount)}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Item Form */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/20" onClick={() => setShowForm(false)} />
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full overflow-y-auto shadow-xl flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                                {editingItem ? "Edit item" : "Add inventory item"}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="flex-1 p-6 flex flex-col gap-4">

                            <div>
                                <label className="text-sm text-slate-500 dark:text-slate-400 mb-1.5 block">Name</label>
                                <input
                                    value={form.name}
                                    onChange={(e) => set("name", e.target.value)}
                                    placeholder="e.g. Maize — SC403"
                                    required
                                    className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-slate-400 text-slate-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-slate-500 dark:text-slate-400 mb-1.5 block">Category</label>
                                <select
                                    value={form.category}
                                    onChange={(e) => set("category", e.target.value)}
                                    className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-slate-400 text-slate-900 dark:text-white"
                                >
                                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-slate-500 dark:text-slate-400 mb-1.5 block">Quantity</label>
                                    <input
                                        type="number" step="0.01" min="0"
                                        value={form.quantity}
                                        onChange={(e) => set("quantity", e.target.value)}
                                        placeholder="0"
                                        required
                                        className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-slate-400 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-500 dark:text-slate-400 mb-1.5 block">Unit</label>
                                    <select
                                        value={form.unit}
                                        onChange={(e) => set("unit", e.target.value)}
                                        className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-slate-400 text-slate-900 dark:text-white"
                                    >
                                        {UNITS.map((u) => <option key={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>

                            {form.unit !== "kg" && form.unit !== "tonnes" && form.unit !== "litres" && (
                                <div>
                                    <label className="text-sm text-slate-500 dark:text-slate-400 mb-1.5 block">
                                        Weight per {form.unit} (kg) — for kg conversion
                                    </label>
                                    <input
                                        type="number" step="0.1" min="0"
                                        value={form.unitWeight}
                                        onChange={(e) => set("unitWeight", e.target.value)}
                                        placeholder="e.g. 50 for 50kg bags"
                                        className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-slate-400 text-slate-900 dark:text-white"
                                    />
                                </div>
                            )}

                            {form.category === "crop_harvest" && (
                                <div>
                                    <label className="text-sm text-slate-500 dark:text-slate-400 mb-1.5 block">Linked crop record</label>
                                    <select
                                        value={form.cropFieldId}
                                        onChange={(e) => set("cropFieldId", e.target.value)}
                                        className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-slate-400 text-slate-900 dark:text-white"
                                    >
                                        <option value="">None — general harvest</option>
                                        {cropFields.map((c) => (
                                            <option key={c.id} value={c.id}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="text-sm text-slate-500 dark:text-slate-400 mb-1.5 block">Season (optional)</label>
                                <input
                                    value={form.season}
                                    onChange={(e) => set("season", e.target.value)}
                                    placeholder="e.g. 2024/25 Rain Season"
                                    className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-slate-400 text-slate-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-slate-500 dark:text-slate-400 mb-1.5 block">Notes (optional)</label>
                                <input
                                    value={form.notes}
                                    onChange={(e) => set("notes", e.target.value)}
                                    placeholder="Any notes..."
                                    className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-slate-400 text-slate-900 dark:text-white"
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">{error}</p>
                            )}

                            <div className="flex gap-3 mt-auto pt-4">
                                <button
                                    type="button" onClick={() => setShowForm(false)}
                                    className="flex-1 h-12 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit" disabled={saving}
                                    className="flex-1 h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Check size={15} /> {editingItem ? "Update" : "Save item"}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Sale form */}
            {showSaleForm && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/20" onClick={() => setShowSaleForm(false)} />
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full overflow-y-auto shadow-xl flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Record sale</h2>
                            <button onClick={() => setShowSaleForm(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSaleSubmit} className="flex-1 p-6 flex flex-col gap-4">

                            <div>
                                <label className="text-sm text-slate-500 dark:text-slate-400 mb-1.5 block">Inventory item</label>
                                <select
                                    value={saleForm.inventoryItemId}
                                    onChange={(e) => setSale("inventoryItemId", e.target.value)}
                                    required
                                    className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-slate-400 text-slate-900 dark:text-white"
                                >
                                    <option value="">Select item...</option>
                                    {(data?.items ?? []).filter((i: any) => i.quantity > 0).map((i: any) => (
                                        <option key={i.id} value={i.id}>
                                            {i.name} — {i.quantity} {i.unit} available
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-slate-500 dark:text-slate-400 mb-1.5 block">Quantity sold</label>
                                    <input
                                        type="number" step="0.01" min="0"
                                        value={saleForm.quantitySold}
                                        onChange={(e) => setSale("quantitySold", e.target.value)}
                                        placeholder="0" required
                                        className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-slate-400 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-500 dark:text-slate-400 mb-1.5 block">Unit</label>
                                    <select
                                        value={saleForm.unit}
                                        onChange={(e) => setSale("unit", e.target.value)}
                                        className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-slate-400 text-slate-900 dark:text-white"
                                    >
                                        {UNITS.map((u) => <option key={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-slate-500 dark:text-slate-400 mb-1.5 block">Price per {saleForm.unit} (MWK)</label>
                                <input
                                    type="number" step="1" min="0"
                                    value={saleForm.pricePerUnit}
                                    onChange={(e) => setSale("pricePerUnit", e.target.value)}
                                    placeholder="0" required
                                    className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-slate-400 text-slate-900 dark:text-white"
                                />
                                {saleForm.quantitySold && saleForm.pricePerUnit && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Total: MWK {fmt(parseFloat(saleForm.quantitySold) * parseFloat(saleForm.pricePerUnit))}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="text-sm text-slate-500 dark:text-slate-400 mb-1.5 block">Buyer name (optional)</label>
                                <input
                                    value={saleForm.buyerName}
                                    onChange={(e) => setSale("buyerName", e.target.value)}
                                    placeholder="e.g. ADMARC, local trader"
                                    className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-slate-400 text-slate-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-slate-500 dark:text-slate-400 mb-1.5 block">Sale date</label>
                                <input
                                    type="date"
                                    value={saleForm.saleDate}
                                    onChange={(e) => setSale("saleDate", e.target.value)}
                                    required
                                    className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-slate-400 text-slate-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-slate-500 dark:text-slate-400 mb-1.5 block">Notes (optional)</label>
                                <input
                                    value={saleForm.notes}
                                    onChange={(e) => setSale("notes", e.target.value)}
                                    placeholder="Any notes about this sale..."
                                    className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-slate-400 text-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">Auto-create finance record</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Creates an income transaction linked to this sale</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSale("createTransaction", !saleForm.createTransaction)}
                                    className={`w-10 h-5 rounded-full transition-colors relative ${saleForm.createTransaction ? "bg-slate-900 dark:bg-white" : "bg-slate-200 dark:bg-slate-700"}`}
                                >
                                    <div className={`w-3.5 h-3.5 bg-white dark:bg-slate-900 rounded-full absolute top-0.5 transition-transform ${saleForm.createTransaction ? "translate-x-5" : "translate-x-0.5"}`} />
                                </button>
                            </div>

                            {saleError && (
                                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">{saleError}</p>
                            )}

                            <div className="flex gap-3 mt-auto pt-4">
                                <button
                                    type="button" onClick={() => setShowSaleForm(false)}
                                    className="flex-1 h-12 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit" disabled={saleSaving}
                                    className="flex-1 h-12 bg-[#1a3d1f] text-white text-sm font-semibold rounded-xl hover:bg-[#2d5c35] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saleSaving ? <><Loader2 size={15} className="animate-spin" /> Recording...</> : <><Check size={15} /> Record sale</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
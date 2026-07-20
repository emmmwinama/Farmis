"use client";

import { useEffect, useState } from "react";
import {
    Plus, Loader2, X, Check, Pencil, Trash2,
    ShoppingCart, Wheat, Sprout, Beaker, FlaskConical, Wrench, Package, FileText,
} from "lucide-react";

const CATEGORIES = [
    { value: "crop_harvest", label: "Crop harvest" },
    { value: "seed",         label: "Seeds"                    },
    { value: "fertiliser",   label: "Fertilisers"              },
    { value: "chemical",     label: "Chemicals & pesticides"   },
    { value: "equipment",    label: "Equipment"                },
    { value: "other",        label: "Other"                    },
];

const UNITS = ["kg", "bags", "tonnes", "litres", "units", "crates", "buckets"];

const CAT_ICONS: Record<string, any> = {
    crop_harvest: Wheat,
    seed:         Sprout,
    fertiliser:   Beaker,
    chemical:     FlaskConical,
    equipment:    Wrench,
    other:        Package,
};

const CAT_BADGE: Record<string, { bg: string; color: string }> = {
    crop_harvest: { bg: "#ECFDF5", color: "#166534" },
    seed:         { bg: "#F0F9FF", color: "#075985" },
    fertiliser:   { bg: "#EFF6FF", color: "#1E3A8A" },
    chemical:     { bg: "#F0F9FF", color: "#9A3412" },
    equipment:    { bg: "#F8FAFC", color: "#475569" },
    other:        { bg: "#F5F3FF", color: "#3C3489" },
};

function fmt(n: number) {
    return new Intl.NumberFormat("en-MW").format(Math.round(n));
}
function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const emptyForm = {
    name: "", category: "crop_harvest", unit: "kg",
    quantity: "", acquisitionUnitCost: "", acquiredAt: new Date().toISOString().split("T")[0],
    unitWeight: "", season: "", cropFieldId: "", notes: "",
};
const emptySaleForm = {
    inventoryItemId: "", quantitySold: "", unit: "kg",
    pricePerUnit: "", buyerName: "", saleDate: new Date().toISOString().split("T")[0],
    notes: "", createTransaction: true,
};

const INP: React.CSSProperties = {
    width: "100%", height: "44px", padding: "0 14px",
    fontSize: "13px", outline: "none", borderRadius: "10px",
    border: "1px solid var(--border)",
    background: "var(--bg-subtle)",
    color: "var(--text-primary)",
};

function Label({ children }: { children: React.ReactNode }) {
    return (
        <label style={{
            display: "block", fontSize: "10px", fontWeight: 900,
            textTransform: "uppercase", letterSpacing: "0.08em",
            marginBottom: "6px", color: "var(--text-muted)",
        }}>
            {children}
        </label>
    );
}

export default function InventoryPage() {
    const [data,           setData]           = useState<any>(null);
    const [cropFields,     setCropFields]     = useState<any[]>([]);
    const [allSeasons,     setAllSeasons]     = useState<string[]>([]);
    const [loading,        setLoading]        = useState(true);
    const [showForm,       setShowForm]       = useState(false);
    const [editingItem,    setEditingItem]    = useState<any>(null);
    const [form,           setForm]           = useState({ ...emptyForm });
    const [saving,         setSaving]         = useState(false);
    const [error,          setError]          = useState("");
    const [deletingId,     setDeletingId]     = useState<string | null>(null);
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [seasonFilter,   setSeasonFilter]   = useState("All");
    const [showSaleForm,   setShowSaleForm]   = useState(false);
    const [saleForm,       setSaleForm]       = useState({ ...emptySaleForm });
    const [saleSaving,     setSaleSaving]     = useState(false);
    const [saleError,      setSaleError]      = useState("");
    const [expandedId,     setExpandedId]     = useState<string | null>(null);

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

    const setF    = (k: string, v: any) => setForm((f)     => ({ ...f, [k]: v }));
    const setSale = (k: string, v: any) => setSaleForm((f) => ({ ...f, [k]: v }));
    const readJson = async (response: Response) => {
        const text = await response.text();
        if (!text.trim()) return null;
        return JSON.parse(text);
    };

    const openAdd = () => {
        setEditingItem(null);
        setForm({ ...emptyForm });
        setSaving(false);
        setError(""); setShowForm(true);
    };

    const openEdit = (item: any) => {
        setEditingItem(item);
        setForm({
            name:        item.name,
            category:    item.category,
            unit:        item.unit,
            quantity:    item.quantity.toString(),
            acquisitionUnitCost: item.acquisitionUnitCost?.toString() ?? "",
            acquiredAt: item.acquiredAt ? new Date(item.acquiredAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            unitWeight:  item.unitWeight?.toString() ?? "",
            season:      item.season ?? "",
            cropFieldId: item.cropFieldId ?? "",
            notes:       item.notes ?? "",
        });
        setSaving(false);
        setError(""); setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true); setError("");
        const url    = editingItem ? `/api/inventory/${editingItem.id}` : "/api/inventory";
        const method = editingItem ? "PATCH" : "POST";
        try {
            const res = await fetch(url, {
                method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
            });
            const d = await readJson(res);
            if (!res.ok) {
                setError(d?.error ?? "Failed to save inventory item");
                return;
            }
            setShowForm(false);
            load();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save inventory item");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this inventory item?")) return;
        setDeletingId(id);
        await fetch(`/api/inventory/${id}`, { method: "DELETE" });
        setDeletingId(null); load();
    };

    const openSale = (item: any) => {
        setSaleForm({ ...emptySaleForm, inventoryItemId: item.id, unit: item.unit });
        setSaleSaving(false);
        setSaleError(""); setShowSaleForm(true);
    };

    const handleSaleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaleSaving(true); setSaleError("");
        try {
            const res = await fetch("/api/inventory/sales", {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(saleForm),
            });
            const d = await readJson(res);
            if (!res.ok) {
                setSaleError(d?.error ?? "Failed to record sale");
                return;
            }
            setShowSaleForm(false);
            load();
        } catch (err) {
            setSaleError(err instanceof Error ? err.message : "Failed to record sale");
        } finally {
            setSaleSaving(false);
        }
    };

    const items = (data?.items ?? []).filter((i: any) => {
        if (categoryFilter !== "All" && i.category !== categoryFilter) return false;
        if (seasonFilter   !== "All" && i.season   !== seasonFilter)   return false;
        return true;
    });
    const monthlyStock = Object.values(items.reduce((acc: Record<string, any>, item: any) => {
        const key = item.acquiredAt
            ? new Date(item.acquiredAt).toLocaleDateString("en-GB", { month: "short", year: "2-digit" })
            : "Unknown";
        if (!acc[key]) acc[key] = { month: key, quantity: 0, value: 0 };
        acc[key].quantity += Number(item.quantity ?? 0);
        acc[key].value += Number(item.quantity ?? 0) * Number(item.acquisitionUnitCost ?? 0);
        return acc;
    }, {})) as any[];
    const maxStockValue = Math.max(1, ...monthlyStock.map((row) => row.value));

    return (
        <div className="p-8 max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)", letterSpacing: "-0.04em" }}>
                        Inventory
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                        {data?.totals?.items ?? 0} items &mdash; MWK {fmt(data?.totals?.totalRevenue ?? 0)} in sales
                    </p>
                </div>
                <button onClick={openAdd}
                        className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold text-white"
                        style={{ background: "var(--farm-green)", boxShadow: "0 4px 12px rgba(26,61,31,0.25)" }}>
                    <Plus size={15} /> Add item
                </button>
            </div>

            {/* Category summary cards */}
            {(data?.byCategory ?? []).length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {(data.byCategory ?? []).slice(0, 4).map((cat: any) => {
                        const badge = CAT_BADGE[cat.category] ?? CAT_BADGE["other"];
                        return (
                            <div key={cat.category} className="rounded-2xl p-5"
                                 style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                                <p className="text-[10px] font-black uppercase tracking-widest mb-2"
                                   style={{ color: "var(--text-muted)" }}>
                                    {CATEGORIES.find((c) => c.value === cat.category)?.label ?? cat.category}
                                </p>
                                <p className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
                                    {cat.count}
                                </p>
                                {cat.totalRevenue > 0 && (
                                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                                        MWK {fmt(cat.totalRevenue)} revenue
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex gap-2 flex-wrap">
                    {["All", ...CATEGORIES.map((c) => c.value)].map((cat) => (
                        <button key={cat} onClick={() => setCategoryFilter(cat)}
                                className="h-9 px-4 rounded-xl text-sm font-bold transition-all"
                                style={{
                                    background: categoryFilter === cat ? "var(--farm-green)" : "var(--bg-card)",
                                    color:      categoryFilter === cat ? "white"             : "var(--text-secondary)",
                                    border:     `1.5px solid ${categoryFilter === cat ? "transparent" : "var(--border)"}`,
                                }}>
                            {cat === "All" ? "All" : CATEGORIES.find((c) => c.value === cat)?.label ?? cat}
                        </button>
                    ))}
                </div>

                {allSeasons.length > 0 && (
                    <select value={seasonFilter} onChange={(e) => setSeasonFilter(e.target.value)}
                            style={{ ...INP, width: "auto", height: "36px" }}>
                        <option value="All">All seasons</option>
                        {allSeasons.map((s) => <option key={s}>{s}</option>)}
                    </select>
                )}
                <a href="/api/export/records?type=inventory&format=pdf&section=inventory"
                   className="h-9 px-4 rounded-xl text-sm font-bold inline-flex items-center gap-2"
                   style={{ background: "var(--bg-card)", color: "var(--text-secondary)", border: "1.5px solid var(--border)" }}>
                    <FileText size={14} /> Inventory report
                </a>
            </div>

            {monthlyStock.length > 0 && (
                <div className="card p-5 mb-6">
                    <p className="text-sm font-black mb-4" style={{ color: "var(--text-primary)" }}>Inventory levels by acquisition month</p>
                    <div className="flex items-end gap-3 min-h-40 overflow-x-auto pb-1">
                        {monthlyStock.map((row) => (
                            <div key={row.month} className="min-w-20 flex flex-col items-center gap-2">
                                <div className="w-full rounded-t-xl" style={{ height: `${Math.max(8, (row.value / maxStockValue) * 120)}px`, background: "linear-gradient(180deg, #06B6D4, #0F766E)" }} />
                                <p className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>{row.month}</p>
                                <p className="text-[10px] font-black" style={{ color: "var(--text-primary)" }}>MWK {fmt(row.value)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Items */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={24} className="animate-spin" style={{ color: "var(--farm-green)" }} />
                </div>
            ) : items.length === 0 ? (
                <div className="rounded-2xl p-16 text-center"
                     style={{ background: "var(--bg-card)", border: "1.5px dashed var(--border)" }}>
                    <Package size={34} className="mx-auto mb-4" style={{ color: "var(--text-hint)" }} />
                    <p className="text-base font-black mb-1" style={{ color: "var(--text-primary)" }}>
                        No inventory items yet
                    </p>
                    <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                        Items are added automatically when you record a harvest, or add them manually here.
                    </p>
                    <button onClick={openAdd}
                            className="inline-flex items-center gap-2 min-h-11 px-5 rounded-xl text-sm font-bold text-white"
                            style={{ background: "var(--farm-green)" }}>
                        <Plus size={15} /> Add item
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {items.map((item: any) => {
                        const badge = CAT_BADGE[item.category] ?? CAT_BADGE["other"];
                        const isExpanded = expandedId === item.id;
                        return (
                            <div key={item.id} className="rounded-2xl overflow-hidden"
                                 style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>

                                {/* Item header */}
                                <div className="flex items-start justify-between px-5 py-5 min-h-20"
                                     style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                                             style={{ background: badge.bg }}>
                                            {(() => { const Icon = CAT_ICONS[item.category] ?? Package; return <Icon size={18} style={{ color: badge.color }} />; })()}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                                                {item.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full"
                                                      style={{ background: badge.bg, color: badge.color }}>
                                                    {CATEGORIES.find((c) => c.value === item.category)?.label ?? item.category}
                                                </span>
                                                {item.season && (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                          style={{ background: "#F0F9FF", color: "#075985" }}>
                                                        {item.season}
                                                    </span>
                                                )}
                                                {item.fieldName && (
                                                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                        {item.fieldName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <button onClick={() => openSale(item)}
                                                className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-bold transition-all"
                                                style={{ background: "var(--farm-pale)", color: "var(--farm-green)", border: "1px solid #86efac" }}>
                                            <ShoppingCart size={12} /> Record sale
                                        </button>
                                        <button onClick={() => openEdit(item)}
                                                className="p-1.5 rounded-lg transition-colors"
                                                style={{ color: "var(--text-muted)", background: "var(--bg-card)" }}>
                                            <Pencil size={13} />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)}
                                                disabled={deletingId === item.id}
                                                className="p-1.5 rounded-lg transition-colors"
                                                style={{ background: "#FFF1F2", color: "#E11D48" }}>
                                            {deletingId === item.id
                                                ? <Loader2 size={13} className="animate-spin" />
                                                : <Trash2 size={13} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="p-5 flex flex-col gap-4">
                                    {/* Metrics */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {[
                                            {
                                                label: "Available",
                                                value: `${item.quantity} ${item.unit}`,
                                                sub:   item.unitWeight ? `~ ${fmt(item.quantityKg)} kg` : null,
                                                color: "var(--text-primary)",
                                            },
                                            {
                                                label: "Total sold",
                                                value: item.totalSold > 0 ? `${item.totalSold} ${item.unit}` : "-",
                                                sub:   null,
                                                color: "var(--text-primary)",
                                            },
                                            {
                                                label: "Revenue",
                                                value: item.totalRevenue > 0 ? `MWK ${fmt(item.totalRevenue)}` : "-",
                                                sub:   null,
                                                color: item.totalRevenue > 0 ? "#16A34A" : "var(--text-muted)",
                                            },
                                            {
                                                label: "Sales records",
                                                value: String(item.sales.length),
                                                sub:   null,
                                                color: "var(--text-primary)",
                                            },
                                        ].map(({ label, value, sub, color }) => (
                                            <div key={label} className="rounded-xl p-3"
                                                 style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                                                <p className="text-[10px] font-black uppercase tracking-wide mb-1"
                                                   style={{ color: "var(--text-muted)" }}>
                                                    {label}
                                                </p>
                                                <p className="text-sm font-extrabold" style={{ color }}>{value}</p>
                                                {sub && (
                                                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Sale history */}
                                    {item.sales.length > 0 && (
                                        <div>
                                            <button onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                                    className="text-xs font-bold transition-colors"
                                                    style={{ color: "var(--farm-green)" }}>
                                                {isExpanded ? "Hide" : "Show"} sale history ({item.sales.length})
                                            </button>

                                            {isExpanded && (
                                                <div className="mt-3 flex flex-col gap-2">
                                                    {item.sales.map((sale: any, i: number) => (
                                                        <div key={i}
                                                             className="flex items-center justify-between rounded-xl px-4 py-3"
                                                             style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                                                            <div>
                                                                <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                                                                    {sale.quantitySold} {sale.unit} @ MWK {fmt(sale.pricePerUnit)} / {sale.unit}
                                                                </p>
                                                                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                                                                    {formatDate(sale.saleDate)}
                                                                    {sale.buyerName && `  -  ${sale.buyerName}`}
                                                                    {sale.notes && `  -  ${sale.notes}`}
                                                                </p>
                                                            </div>
                                                            <p className="text-sm font-extrabold" style={{ color: "#16A34A" }}>
                                                                MWK {fmt(sale.totalAmount)}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className="rounded-xl px-4 py-3" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                                        <p className="text-xs font-black mb-1" style={{ color: "var(--text-primary)" }}>Inventory history</p>
                                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                            Acquired {item.acquiredAt ? formatDate(item.acquiredAt) : "date not recorded"}.
                                            {item.updatedAt ? ` Last updated ${formatDate(item.updatedAt)}.` : ""}
                                            Quantity movements are tracked through acquisitions, sales, disposals, and activity consumption.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* -- Add/Edit item slide-over ------------------------------------ */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setShowForm(false)} />
                    <div className="w-full max-w-md flex flex-col shadow-2xl"
                         style={{ background: "var(--bg-card)", borderLeft: "1px solid var(--border)", height: "100vh" }}>

                        <div className="flex items-center justify-between px-6 py-5 flex-shrink-0"
                             style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                            <h2 className="text-base font-black" style={{ color: "var(--text-primary)" }}>
                                {editingItem ? "Edit item" : "Add inventory item"}
                            </h2>
                            <button onClick={() => setShowForm(false)}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                                    style={{ background: "var(--bg-subtle)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                                <X size={15} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

                                <div>
                                    <Label>Name *</Label>
                                    <input value={form.name} onChange={(e) => setF("name", e.target.value)}
                                           placeholder="e.g. Maize - SC403" required style={INP} />
                                </div>

                                <div>
                                    <Label>Category</Label>
                                    <select value={form.category} onChange={(e) => setF("category", e.target.value)} style={INP}>
                                        {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label>Quantity *</Label>
                                        <input type="number" step="0.01" min="0"
                                               value={form.quantity} onChange={(e) => setF("quantity", e.target.value)}
                                               placeholder="0" required disabled={Boolean(editingItem)}
                                               style={{ ...INP, opacity: editingItem ? 0.65 : 1 }} />
                                        {editingItem && (
                                            <p className="text-[10px] mt-1.5" style={{ color: "var(--text-muted)" }}>
                                                Quantity changes must be recorded as an acquisition, sale, disposal, or activity use.
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <Label>Unit</Label>
                                        <select value={form.unit} onChange={(e) => setF("unit", e.target.value)} style={INP}>
                                            {UNITS.map((u) => <option key={u}>{u}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label>Acquisition cost / {form.unit}</Label>
                                        <input type="number" step="1" min="0"
                                               value={form.acquisitionUnitCost}
                                               onChange={(e) => setF("acquisitionUnitCost", e.target.value)}
                                               placeholder="0" style={INP} />
                                    </div>
                                    <div>
                                        <Label>Acquisition date</Label>
                                        <input type="date"
                                               value={form.acquiredAt}
                                               onChange={(e) => setF("acquiredAt", e.target.value)}
                                               style={INP} />
                                    </div>
                                </div>

                                {!["kg", "tonnes", "litres"].includes(form.unit) && (
                                    <div>
                                        <Label>Weight per {form.unit} (kg)</Label>
                                        <input type="number" step="0.1" min="0"
                                               value={form.unitWeight} onChange={(e) => setF("unitWeight", e.target.value)}
                                               placeholder="e.g. 50 for 50 kg bags" style={INP} />
                                        {form.quantity && form.unitWeight && (
                                            <p className="text-[10px] mt-1.5 font-bold" style={{ color: "var(--farm-green)" }}>
                                                = {fmt(parseFloat(form.quantity) * parseFloat(form.unitWeight))} kg total
                                            </p>
                                        )}
                                    </div>
                                )}

                                {form.category === "crop_harvest" && (
                                    <div>
                                        <Label>Linked crop record</Label>
                                        <select value={form.cropFieldId} onChange={(e) => setF("cropFieldId", e.target.value)} style={INP}>
                                            <option value="">None - general harvest</option>
                                            {cropFields.map((c) => (
                                                <option key={c.id} value={c.id}>{c.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <Label>Season (optional)</Label>
                                    <input value={form.season} onChange={(e) => setF("season", e.target.value)}
                                           placeholder="e.g. 2024/25 Rain Season" style={INP} />
                                </div>

                                <div>
                                    <Label>Notes (optional)</Label>
                                    <input value={form.notes} onChange={(e) => setF("notes", e.target.value)}
                                           placeholder="Any notes..." style={INP} />
                                </div>

                                {error && (
                                    <div className="rounded-xl px-4 py-3"
                                         style={{ background: "#FFF1F2", border: "1px solid #FFE4E6" }}>
                                        <p className="text-sm font-semibold" style={{ color: "#9F1239" }}>{error}</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 px-6 py-5 flex-shrink-0"
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
                                        : <><Check size={14} /> {editingItem ? "Update" : "Save item"}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* -- Record sale slide-over -------------------------------------- */}
            {showSaleForm && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setShowSaleForm(false)} />
                    <div className="w-full max-w-md flex flex-col shadow-2xl"
                         style={{ background: "var(--bg-card)", borderLeft: "1px solid var(--border)", height: "100vh" }}>

                        <div className="flex items-center justify-between px-6 py-5 flex-shrink-0"
                             style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                            <h2 className="text-base font-black" style={{ color: "var(--text-primary)" }}>
                                Record sale
                            </h2>
                            <button onClick={() => setShowSaleForm(false)}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                                    style={{ background: "var(--bg-subtle)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                                <X size={15} />
                            </button>
                        </div>

                        <form onSubmit={handleSaleSubmit} className="flex-1 flex flex-col min-h-0">
                            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

                                <div>
                                    <Label>Inventory item *</Label>
                                    <select value={saleForm.inventoryItemId}
                                            onChange={(e) => setSale("inventoryItemId", e.target.value)}
                                            required style={INP}>
                                        <option value="">Select item...</option>
                                        {(data?.items ?? []).filter((i: any) => i.quantity > 0).map((i: any) => (
                                            <option key={i.id} value={i.id}>
                                                {i.name} - {i.quantity} {i.unit} available
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label>Quantity sold *</Label>
                                        <input type="number" step="0.01" min="0"
                                               value={saleForm.quantitySold}
                                               onChange={(e) => setSale("quantitySold", e.target.value)}
                                               placeholder="0" required style={INP} />
                                    </div>
                                    <div>
                                        <Label>Unit</Label>
                                        <select value={saleForm.unit}
                                                onChange={(e) => setSale("unit", e.target.value)}
                                                style={INP}>
                                            {UNITS.map((u) => <option key={u}>{u}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <Label>Price per {saleForm.unit} (MWK) *</Label>
                                    <input type="number" step="1" min="0"
                                           value={saleForm.pricePerUnit}
                                           onChange={(e) => setSale("pricePerUnit", e.target.value)}
                                           placeholder="0" required style={INP} />
                                    {saleForm.quantitySold && saleForm.pricePerUnit && (
                                        <p className="text-[10px] mt-1.5 font-bold" style={{ color: "var(--farm-green)" }}>
                                            Total: MWK {fmt(parseFloat(saleForm.quantitySold) * parseFloat(saleForm.pricePerUnit))}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label>Buyer name (optional)</Label>
                                    <input value={saleForm.buyerName}
                                           onChange={(e) => setSale("buyerName", e.target.value)}
                                           placeholder="e.g. buyer name, local trader" style={INP} />
                                </div>

                                <div>
                                    <Label>Sale date *</Label>
                                    <input type="date" value={saleForm.saleDate}
                                           onChange={(e) => setSale("saleDate", e.target.value)}
                                           required style={INP} />
                                </div>

                                <div>
                                    <Label>Notes (optional)</Label>
                                    <input value={saleForm.notes}
                                           onChange={(e) => setSale("notes", e.target.value)}
                                           placeholder="Any notes about this sale..." style={INP} />
                                </div>

                                {/* Auto-create transaction toggle */}
                                <div className="rounded-xl p-4 flex items-center justify-between"
                                     style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                                    <div>
                                        <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                                            Auto-create finance record
                                        </p>
                                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                                            Creates an income transaction linked to this sale
                                        </p>
                                    </div>
                                    <button type="button"
                                            onClick={() => setSale("createTransaction", !saleForm.createTransaction)}
                                            className="w-11 h-6 rounded-full relative flex-shrink-0 transition-colors"
                                            style={{ background: saleForm.createTransaction ? "var(--farm-green)" : "#CBD5E1" }}>
                                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all"
                                             style={{ left: saleForm.createTransaction ? "calc(100% - 20px)" : "4px" }} />
                                    </button>
                                </div>

                                {saleError && (
                                    <div className="rounded-xl px-4 py-3"
                                         style={{ background: "#FFF1F2", border: "1px solid #FFE4E6" }}>
                                        <p className="text-sm font-semibold" style={{ color: "#9F1239" }}>{saleError}</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 px-6 py-5 flex-shrink-0"
                                 style={{ borderTop: "1px solid var(--border)", background: "var(--bg-card)" }}>
                                <button type="button" onClick={() => setShowSaleForm(false)}
                                        className="flex-1 h-11 rounded-xl font-bold text-sm"
                                        style={{ border: "1.5px solid var(--border)", color: "var(--text-muted)" }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={saleSaving}
                                        className="flex-1 h-11 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
                                        style={{ background: saleSaving ? "#94A3B8" : "var(--farm-green)" }}>
                                    {saleSaving
                                        ? <><Loader2 size={14} className="animate-spin" /> Recording...</>
                                        : <><Check size={14} /> Record sale</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}


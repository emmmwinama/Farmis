"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft, Plus, Loader2, X, Check, Trash2,
    Heart, Milk, Weight, DollarSign, Activity,
    AlertTriangle, TrendingUp, ShoppingCart,
} from "lucide-react";

const HEALTH_TYPES = ["Vaccination", "Deworming", "Treatment", "Dipping", "Vet visit", "Dental", "Hoof trimming", "Other"];
const PRODUCTION_TYPES = [
    { type: "Milk",  unit: "litres",  icon: "Milk" },
    { type: "Eggs",  unit: "dozen",   icon: "Eggs" },
    { type: "Wool",  unit: "kg",      icon: "Wool" },
    { type: "Honey", unit: "kg",      icon: "Honey" },
    { type: "Meat",  unit: "kg",      icon: "Meat" },
    { type: "Other", unit: "units",   icon: "Stock" },
];
const EXPENSE_CATEGORIES = ["Feed", "Medicine", "Equipment", "Labour", "Bedding", "Transport", "Veterinary", "Purchase", "Other"];

function fmt(n: number) { return new Intl.NumberFormat("en-MW").format(Math.round(n)); }
function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const emptyHealth = {
    type: "Vaccination", description: "", veterinarian: "",
    cost: "", date: new Date().toISOString().split("T")[0], nextDueDate: "", notes: "",
};

const emptyProduction = {
    type: "Milk", quantity: "", unit: "litres",
    date: new Date().toISOString().split("T")[0], pricePerUnit: "", notes: "",
};

const emptyExpense = {
    category: "Feed", description: "", amount: "",
    date: new Date().toISOString().split("T")[0], notes: "",
};

const emptyWeight = {
    weight: "", date: new Date().toISOString().split("T")[0], notes: "",
};

const emptySale = {
    saleDate: new Date().toISOString().split("T")[0], quantity: "1",
    weightAtSale: "", pricePerKg: "", totalAmount: "", buyer: "", notes: "",
};

type Tab = "overview" | "health" | "production" | "expenses" | "sales";

export default function AnimalDetailPage() {
    const { id }  = useParams<{ id: string }>();
    const router  = useRouter();
    const [data,    setData]    = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [tab,     setTab]     = useState<Tab>("overview");

    const [showHealthForm,     setShowHealthForm]     = useState(false);
    const [showProductionForm, setShowProductionForm] = useState(false);
    const [showExpenseForm,    setShowExpenseForm]     = useState(false);
    const [showWeightForm,     setShowWeightForm]      = useState(false);
    const [showSaleForm,       setShowSaleForm]        = useState(false);

    const [healthForm,     setHealthForm]     = useState({ ...emptyHealth });
    const [productionForm, setProductionForm] = useState({ ...emptyProduction });
    const [expenseForm,    setExpenseForm]    = useState({ ...emptyExpense });
    const [weightForm,     setWeightForm]     = useState({ ...emptyWeight });
    const [saleForm,       setSaleForm]       = useState({ ...emptySale });

    const [saving,     setSaving]     = useState(false);
    const [error,      setError]      = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        fetch(`/api/livestock/animals/${id}`).then((r) => r.json()).then((d) => { setData(d); setLoading(false); });
    };

    useEffect(() => { load(); }, [id]);

    const setH = (k: string, v: string) => setHealthForm((f) => ({ ...f, [k]: v }));
    const setP = (k: string, v: string) => setProductionForm((f) => ({ ...f, [k]: v }));
    const setE = (k: string, v: string) => setExpenseForm((f) => ({ ...f, [k]: v }));
    const setW = (k: string, v: string) => setWeightForm((f) => ({ ...f, [k]: v }));
    const setS = (k: string, v: string) => setSaleForm((f) => ({ ...f, [k]: v }));

    const submit = async (url: string, method: string, body: any, onDone: () => void) => {
        setSaving(true); setError("");
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...body, animalId: id }),
        });
        const d = await res.json();
        if (!res.ok) { setError(d.error); setSaving(false); }
        else { onDone(); load(); setSaving(false); }
    };

    const deleteRecord = async (url: string) => {
        setDeletingId(url);
        await fetch(url, { method: "DELETE" });
        setDeletingId(null); load();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 size={24} className="animate-spin" style={{ color: "var(--farm-green)" }} />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-8 text-center">
                <p style={{ color: "var(--text-muted)" }}>Animal not found</p>
                <button onClick={() => router.push("/dashboard/livestock")} className="btn-primary mt-4">
                    Back to livestock
                </button>
            </div>
        );
    }

    const now = new Date();
    const upcomingHealth = data.healthRecords?.filter((h: any) =>
        h.nextDueDate && new Date(h.nextDueDate) >= now &&
        new Date(h.nextDueDate) <= new Date(now.getTime() + 30 * 86400000)
    ) ?? [];

    const TABS: { key: Tab; label: string; icon: any; count?: number }[] = [
        { key: "overview",   label: "Overview",   icon: Activity },
        { key: "health",     label: "Health",     icon: Heart,       count: data.healthRecords?.length },
        { key: "production", label: "Production", icon: TrendingUp,  count: data.productions?.length },
        { key: "expenses",   label: "Expenses",   icon: DollarSign,  count: data.expenses?.length },
        { key: "sales",      label: "Sales",      icon: ShoppingCart, count: data.sales?.length },
    ];

    return (
        <div className="p-8 max-w-5xl mx-auto animate-fade-in">

            {/* Back + header */}
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => router.push("/dashboard/livestock")}
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                    <ArrowLeft size={16} />
                </button>
                <div className="flex items-center gap-3">
                    <span className="text-3xl">{data.livestockType?.icon ?? "Cattle"}</span>
                    <div>
                        <h1 className="page-title" style={{ fontSize: "1.5rem" }}>
                            {data.name || data.tag || `${data.livestockType?.name} #${id.slice(-4)}`}
                        </h1>
                        <p className="page-subtitle">
                            {data.livestockType?.name}
                            {data.breed ? ` · ${data.breed}` : ""}
                            {data.group ? ` · ${data.group}` : ""}
                        </p>
                    </div>
                </div>
            </div>

            {/* Financial summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: "Total invested",   value: `MWK ${fmt(data.totalExpenses ?? 0)}`,   color: "#DC2626" },
                    { label: "Revenue generated", value: `MWK ${fmt((data.totalRevenue ?? 0) + (data.totalProduction ?? 0))}`, color: "#16A34A" },
                    { label: "Net value",         value: `MWK ${fmt(Math.abs(data.netValue ?? 0))}`,
                        color: (data.netValue ?? 0) >= 0 ? "#2563EB" : "#DC2626" },
                ].map(({ label, value, color }) => (
                    <div key={label} className="stat-card">
                        <p className="metric-label">{label}</p>
                        <p className="metric-value" style={{ color }}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Alert */}
            {upcomingHealth.length > 0 && (
                <div className="rounded-xl p-4 mb-5 flex items-center gap-3"
                     style={{ background: "#F0F9FF", border: "1.5px solid #BAE6FD" }}>
                    <AlertTriangle size={16} style={{ color: "#0284C7" }} />
                    <p className="text-sm font-semibold" style={{ color: "#075985" }}>
                        {upcomingHealth.length} health procedure{upcomingHealth.length !== 1 ? "s" : ""} due soon:{" "}
                        {upcomingHealth.map((h: any) => `${h.type} due ${fmtDate(h.nextDueDate)}`).join(", ")}
                    </p>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {TABS.map(({ key, label, icon: Icon, count }) => (
                    <button key={key} onClick={() => setTab(key)}
                            className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0"
                            style={{
                                background: tab === key ? "linear-gradient(135deg, #1a3d1f, #2d6a35)" : "var(--bg-card)",
                                color:      tab === key ? "white" : "var(--text-secondary)",
                                border:     `1.5px solid ${tab === key ? "transparent" : "var(--border)"}`,
                            }}>
                        <Icon size={14} />
                        {label}
                        {count !== undefined && count > 0 && (
                            <span className="text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center"
                                  style={{ background: tab === key ? "rgba(255,255,255,0.25)" : "var(--bg-muted)", color: tab === key ? "white" : "var(--text-muted)" }}>
                {count}
              </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Overview ──────────────────────────────────────────────────────── */}
            {tab === "overview" && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="card p-5">
                        <p className="text-xs font-extrabold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>Animal details</p>
                        <div className="flex flex-col gap-3">
                            {[
                                { label: "Tag / ID",       value: data.tag || "—" },
                                { label: "Name",           value: data.name || "—" },
                                { label: "Type",           value: `${data.livestockType?.icon} ${data.livestockType?.name}` },
                                { label: "Sex",            value: data.sex },
                                { label: "Breed",          value: data.breed || "—" },
                                { label: "Colour",         value: data.colour || "—" },
                                { label: "Group",          value: data.group || "—" },
                                { label: "Status",         value: data.status },
                                { label: "Date of birth",  value: data.birthDate  ? fmtDate(data.birthDate)       : "Unknown" },
                                { label: "Acquired",       value: data.acquisitionDate ? fmtDate(data.acquisitionDate) : "—" },
                                { label: "How acquired",   value: data.acquisitionType },
                                { label: "Purchase cost",  value: data.acquisitionCost ? `MWK ${fmt(data.acquisitionCost)}` : "—" },
                                { label: "Offspring",      value: data.offsprings?.length > 0 ? `${data.offsprings.length} recorded` : "None" },
                                { label: "Parent",         value: data.parent ? (data.parent.name ?? data.parent.tag ?? "Tagged") : "Unknown" },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex items-center justify-between py-1.5"
                                     style={{ borderBottom: "1px solid var(--border)" }}>
                                    <p className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>{label}</p>
                                    <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        {/* Weight history */}
                        <div className="card p-5">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-xs font-extrabold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                                    Weight history
                                </p>
                                <button onClick={() => setShowWeightForm(true)}
                                        className="flex items-center gap-1 text-xs font-bold"
                                        style={{ color: "var(--farm-green)" }}>
                                    <Plus size={12} /> Log weight
                                </button>
                            </div>
                            {data.weightRecords?.length === 0 ? (
                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>No weight records yet</p>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {data.weightRecords?.slice(0, 5).map((w: any) => (
                                        <div key={w.id} className="flex items-center justify-between py-2"
                                             style={{ borderBottom: "1px solid var(--border)" }}>
                                            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                                                {w.weight} kg
                                            </p>
                                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{fmtDate(w.date)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        {data.notes && (
                            <div className="card p-5">
                                <p className="text-xs font-extrabold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Notes</p>
                                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{data.notes}</p>
                            </div>
                        )}

                        {/* Offspring */}
                        {data.offsprings?.length > 0 && (
                            <div className="card p-5">
                                <p className="text-xs font-extrabold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                                    Offspring ({data.offsprings.length})
                                </p>
                                <div className="flex flex-col gap-2">
                                    {data.offsprings.map((o: any) => (
                                        <a key={o.id} href={`/dashboard/livestock/${o.id}`}
                                           className="flex items-center gap-2 text-xs py-2 hover:opacity-80"
                                           style={{ borderBottom: "1px solid var(--border)" }}>
                                            <span>{o.livestockType?.icon}</span>
                                            <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                        {o.name || o.tag || o.id.slice(-4)}
                      </span>
                                            <span style={{ color: "var(--text-muted)" }}>{o.sex}</span>
                                            <span className="ml-auto" style={{ color: "var(--text-hint)" }}>
                        {o.birthDate ? fmtDate(o.birthDate) : "—"}
                      </span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Health ─────────────────────────────────────────────────────────── */}
            {tab === "health" && (
                <div>
                    <div className="flex justify-end mb-4">
                        <button onClick={() => { setHealthForm({ ...emptyHealth }); setShowHealthForm(true); }} className="btn-primary text-sm">
                            <Plus size={15} /> Add health record
                        </button>
                    </div>
                    {data.healthRecords?.length === 0 ? (
                        <div className="card p-12 text-center">
                            <Heart size={32} className="mx-auto mb-3" style={{ color: "var(--text-hint)" }} />
                            <p className="section-title mb-1">No health records yet</p>
                            <p className="section-subtitle">Track vaccinations, treatments and vet visits</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {data.healthRecords.map((h: any) => {
                                const isDue = h.nextDueDate && new Date(h.nextDueDate) <= new Date(now.getTime() + 30 * 86400000);
                                return (
                                    <div key={h.id} className="card p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="badge badge-green text-xs">{h.type}</span>
                                                    {isDue && h.nextDueDate && (
                                                        <span className="badge badge-sky text-xs">
                              Due {fmtDate(h.nextDueDate)}
                            </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{h.description}</p>
                                                {h.veterinarian && (
                                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Dr. {h.veterinarian}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-extrabold" style={{ color: "#DC2626" }}>
                                                    MWK {fmt(h.cost)}
                                                </p>
                                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{fmtDate(h.date)}</p>
                                                <button onClick={() => deleteRecord(`/api/livestock/health/${h.id}`)}
                                                        className="mt-2 text-xs font-semibold"
                                                        style={{ color: "var(--text-muted)" }}>
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                        {h.notes && <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>{h.notes}</p>}
                                        {h.nextDueDate && !isDue && (
                                            <p className="text-xs mt-2 font-semibold" style={{ color: "var(--text-muted)" }}>
                                                Next due: {fmtDate(h.nextDueDate)}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── Production ─────────────────────────────────────────────────────── */}
            {tab === "production" && (
                <div>
                    <div className="flex justify-end mb-4">
                        <button onClick={() => { setProductionForm({ ...emptyProduction }); setShowProductionForm(true); }} className="btn-primary text-sm">
                            <Plus size={15} /> Record production
                        </button>
                    </div>

                    {/* Total */}
                    {data.productions?.length > 0 && (
                        <div className="grid grid-cols-3 gap-4 mb-5">
                            {(() => {
                                const byType: Record<string, { qty: number; val: number; unit: string }> = {};
                                for (const p of data.productions) {
                                    if (!byType[p.type]) byType[p.type] = { qty: 0, val: 0, unit: p.unit };
                                    byType[p.type].qty += p.quantity;
                                    byType[p.type].val += p.totalValue ?? 0;
                                }
                                return Object.entries(byType).map(([type, { qty, val, unit }]) => (
                                    <div key={type} className="stat-card">
                                        <p className="metric-label">{type}</p>
                                        <p className="metric-value text-lg">{fmt(qty)} {unit}</p>
                                        {val > 0 && <p className="text-xs mt-1" style={{ color: "#16A34A" }}>MWK {fmt(val)}</p>}
                                    </div>
                                ));
                            })()}
                        </div>
                    )}

                    {data.productions?.length === 0 ? (
                        <div className="card p-12 text-center">
                            <TrendingUp size={32} className="mx-auto mb-3" style={{ color: "var(--text-hint)" }} />
                            <p className="section-title mb-1">No production records yet</p>
                            <p className="section-subtitle">Track milk, eggs, wool and other outputs</p>
                        </div>
                    ) : (
                        <div className="card overflow-hidden">
                            <table className="data-table">
                                <thead>
                                <tr>
                                    <th>Date</th><th>Type</th><th>Quantity</th><th>Price/unit</th><th>Total value</th><th>Notes</th><th></th>
                                </tr>
                                </thead>
                                <tbody>
                                {data.productions.map((p: any) => (
                                    <tr key={p.id}>
                                        <td>{fmtDate(p.date)}</td>
                                        <td className="font-bold" style={{ color: "var(--text-primary)" }}>{p.type}</td>
                                        <td>{p.quantity} {p.unit}</td>
                                        <td>{p.pricePerUnit ? `MWK ${fmt(p.pricePerUnit)}` : "—"}</td>
                                        <td className="font-bold" style={{ color: "#16A34A" }}>
                                            {p.totalValue ? `MWK ${fmt(p.totalValue)}` : "—"}
                                        </td>
                                        <td>{p.notes || "—"}</td>
                                        <td>
                                            <button onClick={() => deleteRecord(`/api/livestock/production/${p.id}`)}
                                                    className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Expenses ─────────────────────────────────────────────────────────── */}
            {tab === "expenses" && (
                <div>
                    <div className="flex justify-end mb-4">
                        <button onClick={() => { setExpenseForm({ ...emptyExpense }); setShowExpenseForm(true); }} className="btn-primary text-sm">
                            <Plus size={15} /> Add expense
                        </button>
                    </div>

                    {data.expenses?.length > 0 && (
                        <div className="rounded-xl p-4 mb-4 flex items-center justify-between"
                             style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                            <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                                Total expenses for this animal
                            </p>
                            <p className="text-xl font-extrabold" style={{ color: "#DC2626" }}>
                                MWK {fmt(data.expenses.reduce((s: number, e: any) => s + e.amount, 0))}
                            </p>
                        </div>
                    )}

                    {data.expenses?.length === 0 ? (
                        <div className="card p-12 text-center">
                            <DollarSign size={32} className="mx-auto mb-3" style={{ color: "var(--text-hint)" }} />
                            <p className="section-title mb-1">No expenses yet</p>
                            <p className="section-subtitle">Track feed, medicine and other costs for this animal</p>
                        </div>
                    ) : (
                        <div className="card overflow-hidden">
                            <table className="data-table">
                                <thead>
                                <tr>
                                    <th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th></th>
                                </tr>
                                </thead>
                                <tbody>
                                {data.expenses.map((e: any) => (
                                    <tr key={e.id}>
                                        <td>{fmtDate(e.date)}</td>
                                        <td><span className="badge badge-warm">{e.category}</span></td>
                                        <td className="font-semibold" style={{ color: "var(--text-primary)" }}>{e.description}</td>
                                        <td className="font-bold" style={{ color: "#DC2626" }}>MWK {fmt(e.amount)}</td>
                                        <td>
                                            <button onClick={() => deleteRecord(`/api/livestock/expenses/${e.id}`)}
                                                    className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Sales ─────────────────────────────────────────────────────────── */}
            {tab === "sales" && (
                <div>
                    {data.status === "Active" && (
                        <div className="flex justify-end mb-4">
                            <button onClick={() => { setSaleForm({ ...emptySale }); setShowSaleForm(true); }} className="btn-primary text-sm">
                                <Plus size={15} /> Record sale
                            </button>
                        </div>
                    )}

                    {data.sales?.length === 0 ? (
                        <div className="card p-12 text-center">
                            <ShoppingCart size={32} className="mx-auto mb-3" style={{ color: "var(--text-hint)" }} />
                            <p className="section-title mb-1">No sales yet</p>
                            {data.status === "Active" && (
                                <p className="section-subtitle">When you sell this animal, record it here</p>
                            )}
                        </div>
                    ) : (
                        <div className="card overflow-hidden">
                            <table className="data-table">
                                <thead>
                                <tr>
                                    <th>Date</th><th>Qty</th><th>Weight</th><th>Price/kg</th><th>Total</th><th>Buyer</th>
                                </tr>
                                </thead>
                                <tbody>
                                {data.sales.map((s: any) => (
                                    <tr key={s.id}>
                                        <td>{fmtDate(s.saleDate)}</td>
                                        <td>{s.quantity}</td>
                                        <td>{s.weightAtSale ? `${s.weightAtSale} kg` : "—"}</td>
                                        <td>{s.pricePerKg ? `MWK ${fmt(s.pricePerKg)}` : "—"}</td>
                                        <td className="font-extrabold" style={{ color: "#16A34A" }}>MWK {fmt(s.totalAmount)}</td>
                                        <td>{s.buyer || "—"}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── FORMS ─────────────────────────────────────────────────────────── */}

            {/* Health form */}
            {showHealthForm && (
                <SlideOver title="Add health record" onClose={() => setShowHealthForm(false)}>
                    <form onSubmit={(e) => { e.preventDefault(); submit("/api/livestock/health", "POST", healthForm, () => setShowHealthForm(false)); }}
                          className="flex flex-col gap-4">
                        <FormField label="Type">
                            <select value={healthForm.type} onChange={(e) => setH("type", e.target.value)} className="input">
                                {HEALTH_TYPES.map((t) => <option key={t}>{t}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Description *">
                            <input value={healthForm.description} onChange={(e) => setH("description", e.target.value)}
                                   placeholder="e.g. FMD Vaccine batch #A32" required className="input" />
                        </FormField>
                        <FormField label="Veterinarian">
                            <input value={healthForm.veterinarian} onChange={(e) => setH("veterinarian", e.target.value)}
                                   placeholder="Dr. name" className="input" />
                        </FormField>
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Date *">
                                <input type="date" value={healthForm.date} onChange={(e) => setH("date", e.target.value)} required className="input" />
                            </FormField>
                            <FormField label="Cost (MWK)">
                                <input type="number" min="0" step="1" value={healthForm.cost} onChange={(e) => setH("cost", e.target.value)} placeholder="0" className="input" />
                            </FormField>
                        </div>
                        <FormField label="Next due date">
                            <input type="date" value={healthForm.nextDueDate} onChange={(e) => setH("nextDueDate", e.target.value)} className="input" />
                        </FormField>
                        <FormField label="Notes">
                            <input value={healthForm.notes} onChange={(e) => setH("notes", e.target.value)} placeholder="Any notes..." className="input" />
                        </FormField>
                        <FormError error={error} />
                        <FormActions onCancel={() => setShowHealthForm(false)} saving={saving} label="Save health record" />
                    </form>
                </SlideOver>
            )}

            {/* Production form */}
            {showProductionForm && (
                <SlideOver title="Record production" onClose={() => setShowProductionForm(false)}>
                    <form onSubmit={(e) => { e.preventDefault(); submit("/api/livestock/production", "POST", productionForm, () => setShowProductionForm(false)); }}
                          className="flex flex-col gap-4">
                        <FormField label="Production type">
                            <div className="grid grid-cols-3 gap-2 mb-2">
                                {PRODUCTION_TYPES.map((pt) => (
                                    <button key={pt.type} type="button"
                                            onClick={() => setProductionForm((f) => ({ ...f, type: pt.type, unit: pt.unit }))}
                                            className="flex flex-col items-center gap-1 p-3 rounded-xl text-sm font-bold transition-all"
                                            style={{
                                                background: productionForm.type === pt.type ? "var(--farm-pale)" : "var(--bg-subtle)",
                                                border: `1.5px solid ${productionForm.type === pt.type ? "var(--farm-green)" : "var(--border)"}`,
                                                color: productionForm.type === pt.type ? "var(--farm-green)" : "var(--text-secondary)",
                                            }}>
                                        <span className="text-xl">{pt.icon}</span>
                                        <span className="text-xs">{pt.type}</span>
                                    </button>
                                ))}
                            </div>
                        </FormField>
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Quantity *">
                                <input type="number" min="0" step="0.01" value={productionForm.quantity}
                                       onChange={(e) => setP("quantity", e.target.value)} placeholder="0" required className="input" />
                            </FormField>
                            <FormField label="Unit">
                                <input value={productionForm.unit} onChange={(e) => setP("unit", e.target.value)} className="input" />
                            </FormField>
                        </div>
                        <FormField label="Date *">
                            <input type="date" value={productionForm.date} onChange={(e) => setP("date", e.target.value)} required className="input" />
                        </FormField>
                        <FormField label="Price per unit (MWK)">
                            <input type="number" min="0" step="1" value={productionForm.pricePerUnit}
                                   onChange={(e) => setP("pricePerUnit", e.target.value)} placeholder="Leave blank if not selling" className="input" />
                        </FormField>
                        {productionForm.quantity && productionForm.pricePerUnit && (
                            <p className="text-sm font-bold" style={{ color: "#16A34A" }}>
                                Total value: MWK {fmt(parseFloat(productionForm.quantity) * parseFloat(productionForm.pricePerUnit))}
                            </p>
                        )}
                        <FormField label="Notes">
                            <input value={productionForm.notes} onChange={(e) => setP("notes", e.target.value)} placeholder="Any notes..." className="input" />
                        </FormField>
                        <FormError error={error} />
                        <FormActions onCancel={() => setShowProductionForm(false)} saving={saving} label="Record production" />
                    </form>
                </SlideOver>
            )}

            {/* Expense form */}
            {showExpenseForm && (
                <SlideOver title="Add expense" onClose={() => setShowExpenseForm(false)}>
                    <form onSubmit={(e) => { e.preventDefault(); submit("/api/livestock/expenses", "POST", expenseForm, () => setShowExpenseForm(false)); }}
                          className="flex flex-col gap-4">
                        <FormField label="Category">
                            <select value={expenseForm.category} onChange={(e) => setE("category", e.target.value)} className="input">
                                {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Description *">
                            <input value={expenseForm.description} onChange={(e) => setE("description", e.target.value)}
                                   placeholder="e.g. Dairy Meal 50kg bag" required className="input" />
                        </FormField>
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Amount (MWK) *">
                                <input type="number" min="0" step="1" value={expenseForm.amount}
                                       onChange={(e) => setE("amount", e.target.value)} placeholder="0" required className="input" />
                            </FormField>
                            <FormField label="Date *">
                                <input type="date" value={expenseForm.date} onChange={(e) => setE("date", e.target.value)} required className="input" />
                            </FormField>
                        </div>
                        <FormField label="Notes">
                            <input value={expenseForm.notes} onChange={(e) => setE("notes", e.target.value)} placeholder="Any notes..." className="input" />
                        </FormField>
                        <FormError error={error} />
                        <FormActions onCancel={() => setShowExpenseForm(false)} saving={saving} label="Save expense" />
                    </form>
                </SlideOver>
            )}

            {/* Weight form */}
            {showWeightForm && (
                <SlideOver title="Log weight" onClose={() => setShowWeightForm(false)}>
                    <form onSubmit={async (e) => {
                        e.preventDefault(); setSaving(true); setError("");
                        const res = await fetch("/api/livestock/weight", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ ...weightForm, animalId: id }),
                        });
                        const d = await res.json();
                        if (!res.ok) { setError(d.error); setSaving(false); }
                        else { setShowWeightForm(false); load(); setSaving(false); }
                    }} className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Weight (kg) *">
                                <input type="number" min="0" step="0.1" value={weightForm.weight}
                                       onChange={(e) => setW("weight", e.target.value)} placeholder="e.g. 320" required className="input" />
                            </FormField>
                            <FormField label="Date *">
                                <input type="date" value={weightForm.date} onChange={(e) => setW("date", e.target.value)} required className="input" />
                            </FormField>
                        </div>
                        <FormField label="Notes">
                            <input value={weightForm.notes} onChange={(e) => setW("notes", e.target.value)} placeholder="Any notes..." className="input" />
                        </FormField>
                        <FormError error={error} />
                        <FormActions onCancel={() => setShowWeightForm(false)} saving={saving} label="Log weight" />
                    </form>
                </SlideOver>
            )}

            {/* Sale form */}
            {showSaleForm && (
                <SlideOver title="Record sale" onClose={() => setShowSaleForm(false)}>
                    <form onSubmit={async (e) => {
                        e.preventDefault(); setSaving(true); setError("");
                        const res = await fetch("/api/livestock/sales", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ ...saleForm, animalId: id }),
                        });
                        const d = await res.json();
                        if (!res.ok) { setError(d.error); setSaving(false); }
                        else { setShowSaleForm(false); router.push("/dashboard/livestock"); setSaving(false); }
                    }} className="flex flex-col gap-4">
                        <div className="rounded-xl p-4 mb-2"
                             style={{ background: "#F0F9FF", border: "1.5px solid #BAE6FD" }}>
                            <p className="text-sm font-bold" style={{ color: "#075985" }}>
                                Warning Recording a sale will mark this animal as Sold
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Sale date *">
                                <input type="date" value={saleForm.saleDate} onChange={(e) => setS("saleDate", e.target.value)} required className="input" />
                            </FormField>
                            <FormField label="Quantity">
                                <input type="number" min="1" step="1" value={saleForm.quantity} onChange={(e) => setS("quantity", e.target.value)} className="input" />
                            </FormField>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Weight at sale (kg)">
                                <input type="number" min="0" step="0.1" value={saleForm.weightAtSale}
                                       onChange={(e) => { setS("weightAtSale", e.target.value); if (saleForm.pricePerKg && e.target.value) setS("totalAmount", String(parseFloat(e.target.value) * parseFloat(saleForm.pricePerKg))); }}
                                       placeholder="e.g. 350" className="input" />
                            </FormField>
                            <FormField label="Price per kg (MWK)">
                                <input type="number" min="0" step="1" value={saleForm.pricePerKg}
                                       onChange={(e) => { setS("pricePerKg", e.target.value); if (saleForm.weightAtSale && e.target.value) setS("totalAmount", String(parseFloat(saleForm.weightAtSale) * parseFloat(e.target.value))); }}
                                       placeholder="e.g. 3500" className="input" />
                            </FormField>
                        </div>
                        <FormField label="Total amount (MWK) *">
                            <input type="number" min="0" step="1" value={saleForm.totalAmount}
                                   onChange={(e) => setS("totalAmount", e.target.value)} placeholder="0" required className="input" />
                            {saleForm.weightAtSale && saleForm.pricePerKg && (
                                <p className="text-xs mt-1 font-semibold" style={{ color: "#16A34A" }}>
                                    Auto-calculated: MWK {fmt(parseFloat(saleForm.weightAtSale) * parseFloat(saleForm.pricePerKg))}
                                </p>
                            )}
                        </FormField>
                        <FormField label="Buyer name">
                            <input value={saleForm.buyer} onChange={(e) => setS("buyer", e.target.value)} placeholder="e.g. John Phiri" className="input" />
                        </FormField>
                        <FormField label="Notes">
                            <input value={saleForm.notes} onChange={(e) => setS("notes", e.target.value)} placeholder="Any notes..." className="input" />
                        </FormField>
                        <FormError error={error} />
                        <FormActions onCancel={() => setShowSaleForm(false)} saving={saving} label="Record sale" />
                    </form>
                </SlideOver>
            )}
        </div>
    );
}

// ── Shared form components ────────────────────────────────────────────────────

function SlideOver({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className="w-full max-w-md panel h-full overflow-y-auto flex flex-col shadow-2xl">
                <div className="flex items-center justify-between p-6" style={{ borderBottom: "1px solid var(--border)" }}>
                    <h2 className="section-title">{title}</h2>
                    <button onClick={onClose}
                            className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: "var(--bg-subtle)", color: "var(--text-muted)" }}>
                        <X size={16} />
                    </button>
                </div>
                <div className="flex-1 p-6">{children}</div>
            </div>
        </div>
    );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="form-label">{label}</label>
            {children}
        </div>
    );
}

function FormError({ error }: { error: string }) {
    if (!error) return null;
    return (
        <p className="text-sm font-semibold px-4 py-3 rounded-xl"
           style={{ background: "var(--error-bg)", color: "var(--error-text)" }}>
            {error}
        </p>
    );
}

function FormActions({ onCancel, saving, label }: { onCancel: () => void; saving: boolean; label: string }) {
    return (
        <div className="flex gap-3 mt-auto pt-4">
            <button type="button" onClick={onCancel} className="btn-secondary flex-1 h-12">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 h-12">
                {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Check size={15} /> {label}</>}
            </button>
        </div>
    );
}

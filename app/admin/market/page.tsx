"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, X, Check } from "lucide-react";

const UNITS = ["kg", "bag50", "bag90", "tonne"];
const MARKETS = ["ADMARC", "Lilongwe Market", "Blantyre Market", "Mzuzu Market", "Auction Floors", "Export"];
const REGIONS = ["National", "Central", "Southern", "Northern"];

function fmt(n: number) { return new Intl.NumberFormat("en-MW").format(Math.round(n)); }

const emptyForm = {
    cropName: "", variety: "", unit: "kg", priceMin: "", priceMax: "", priceAvg: "",
    market: "ADMARC", region: "National", season: "2024/25", source: "ADMARC", isActive: true,
};

export default function AdminMarketPage() {
    const [prices, setPrices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingPrice, setEditingPrice] = useState<any>(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const load = () => {
        setLoading(true);
        fetch("/api/admin/market").then((r) => r.json()).then((d) => { setPrices(d); setLoading(false); });
    };

    useEffect(() => { load(); }, []);

    const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

    const openAdd = () => { setEditingPrice(null); setForm({ ...emptyForm }); setError(""); setShowForm(true); };
    const openEdit = (p: any) => {
        setEditingPrice(p);
        setForm({ cropName: p.cropName, variety: p.variety ?? "", unit: p.unit, priceMin: p.priceMin.toString(), priceMax: p.priceMax.toString(), priceAvg: p.priceAvg.toString(), market: p.market, region: p.region, season: p.season ?? "2024/25", source: p.source, isActive: p.isActive });
        setError(""); setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true); setError("");
        const url = editingPrice ? `/api/admin/market/${editingPrice.id}` : "/api/admin/market";
        const method = editingPrice ? "PATCH" : "POST";
        const res = await fetch(url, {
            method, headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, priceMin: parseFloat(form.priceMin), priceMax: parseFloat(form.priceMax), priceAvg: parseFloat(form.priceAvg) }),
        });
        const d = await res.json();
        if (!res.ok) { setError(d.error); setSaving(false); } else { setShowForm(false); load(); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this price record?")) return;
        setDeletingId(id);
        await fetch(`/api/admin/market/${id}`, { method: "DELETE" });
        setDeletingId(null); load();
    };

    const filtered = prices.filter((p) =>
        p.cropName?.toLowerCase().includes(search.toLowerCase()) ||
        p.market?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-medium text-white">Market Prices</h1>
                    <p className="text-[#4a7a50] text-sm mt-1">Manage ADMARC farm gate prices shown to farmers</p>
                </div>
                <button onClick={openAdd} className="flex items-center gap-2 h-10 px-4 bg-[#1a3d1f] text-white text-sm font-medium rounded-xl hover:bg-[#2d5c35] transition-colors">
                    <Plus size={16} /> Add price
                </button>
            </div>

            <div className="mb-6">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by crop or market..."
                       className="h-10 px-4 text-sm bg-[#1a2d1c] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white placeholder-[#4a7a50] w-80" />
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[#3d8c47]" /></div>
            ) : (
                <div className="bg-[#1a2d1c] border border-[#2d5c35] rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="border-b border-[#2d5c35]">
                            {["Crop", "Variety", "Unit", "Min", "Avg", "Max", "Market", "Region", "Season", "Status", ""].map((h) => (
                                <th key={h} className="text-left text-xs text-[#4a7a50] font-medium px-4 py-3">{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1a3d1f]">
                        {filtered.map((p) => (
                            <tr key={p.id} className="hover:bg-[#1a3d1f]/20 transition-colors">
                                <td className="px-4 py-3 font-medium text-white">{p.cropName}</td>
                                <td className="px-4 py-3 text-[#4a7a50]">{p.variety ?? "—"}</td>
                                <td className="px-4 py-3 text-[#4a7a50]">{p.unit}</td>
                                <td className="px-4 py-3 text-[#4a7a50]">MWK {fmt(p.priceMin)}</td>
                                <td className="px-4 py-3 font-bold text-[#7dd68a]">MWK {fmt(p.priceAvg)}</td>
                                <td className="px-4 py-3 text-[#4a7a50]">MWK {fmt(p.priceMax)}</td>
                                <td className="px-4 py-3 text-white">{p.market}</td>
                                <td className="px-4 py-3 text-[#4a7a50]">{p.region}</td>
                                <td className="px-4 py-3 text-[#4a7a50]">{p.season}</td>
                                <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-lg ${p.isActive ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
                      {p.isActive ? "Active" : "Hidden"}
                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-1.5">
                                        <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-[#1a3d1f] rounded-lg text-[#4a7a50] hover:text-white transition-colors"><Pencil size={13} /></button>
                                        <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id} className="p-1.5 hover:bg-red-900/30 rounded-lg text-[#4a7a50] hover:text-red-400 transition-colors">
                                            {deletingId === p.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/50" onClick={() => setShowForm(false)} />
                    <div className="w-full max-w-lg bg-[#1a2d1c] border-l border-[#2d5c35] h-full overflow-y-auto flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-[#2d5c35]">
                            <h2 className="text-base font-medium text-white">{editingPrice ? "Edit price" : "Add market price"}</h2>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-[#1a3d1f] rounded-lg text-[#4a7a50]"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="flex-1 p-6 flex flex-col gap-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-[#4a7a50] mb-1.5 block">Crop name</label>
                                    <input value={form.cropName} onChange={(e) => set("cropName", e.target.value)} placeholder="Maize" required
                                           className="w-full h-11 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white" />
                                </div>
                                <div>
                                    <label className="text-xs text-[#4a7a50] mb-1.5 block">Variety</label>
                                    <input value={form.variety} onChange={(e) => set("variety", e.target.value)} placeholder="White, CG7, etc."
                                           className="w-full h-11 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-[#4a7a50] mb-1.5 block">Unit</label>
                                    <select value={form.unit} onChange={(e) => set("unit", e.target.value)}
                                            className="w-full h-11 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none text-white">
                                        {UNITS.map((u) => <option key={u}>{u}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-[#4a7a50] mb-1.5 block">Season</label>
                                    <input value={form.season} onChange={(e) => set("season", e.target.value)} placeholder="2024/25"
                                           className="w-full h-11 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { key: "priceMin", label: "Min price (MWK)" },
                                    { key: "priceAvg", label: "Average (MWK)" },
                                    { key: "priceMax", label: "Max price (MWK)" },
                                ].map(({ key, label }) => (
                                    <div key={key}>
                                        <label className="text-xs text-[#4a7a50] mb-1.5 block">{label}</label>
                                        <input type="number" step="1" min="0" value={form[key as keyof typeof form] as string} onChange={(e) => set(key, e.target.value)} placeholder="0" required
                                               className="w-full h-11 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white" />
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-[#4a7a50] mb-1.5 block">Market</label>
                                    <select value={form.market} onChange={(e) => set("market", e.target.value)}
                                            className="w-full h-11 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none text-white">
                                        {MARKETS.map((m) => <option key={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-[#4a7a50] mb-1.5 block">Region</label>
                                    <select value={form.region} onChange={(e) => set("region", e.target.value)}
                                            className="w-full h-11 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none text-white">
                                        {REGIONS.map((r) => <option key={r}>{r}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-[#111d13] rounded-xl">
                                <p className="text-sm text-[#7dd68a]">Active (visible to farmers)</p>
                                <button type="button" onClick={() => set("isActive", !form.isActive)}
                                        className={`w-10 h-5 rounded-full transition-colors relative ${form.isActive ? "bg-[#3d8c47]" : "bg-[#2d5c35]"}`}>
                                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${form.isActive ? "translate-x-5" : "translate-x-0.5"}`} />
                                </button>
                            </div>
                            {error && <p className="text-sm text-red-400 bg-red-900/20 px-4 py-3 rounded-xl">{error}</p>}
                            <div className="flex gap-3 mt-auto pt-4">
                                <button type="button" onClick={() => setShowForm(false)}
                                        className="flex-1 h-12 border border-[#2d5c35] text-[#4a7a50] text-sm font-medium rounded-xl hover:bg-[#1a3d1f] transition-colors">Cancel</button>
                                <button type="submit" disabled={saving}
                                        className="flex-1 h-12 bg-[#1a3d1f] text-white text-sm font-medium rounded-xl hover:bg-[#2d5c35] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                    {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Check size={15} /> {editingPrice ? "Update" : "Add price"}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
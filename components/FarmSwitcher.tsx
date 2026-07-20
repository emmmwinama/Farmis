"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, Plus, Loader2, Building2 } from "lucide-react";

interface Farm {
    id: string;
    name: string;
    location: string;
    role: string;
    isOwned: boolean;
    counts?: {
        fields: number;
        crops: number;
        activities: number;
        records: number;
    };
}

interface Props {
    collapsed: boolean;
    userId: string;
}

const ROLE_COLORS: Record<string, string> = {
    owner:      "text-sky-200",
    manager:    "text-blue-200",
    agronomist: "text-cyan-200",
    accountant: "text-sky-200",
    viewer:     "text-slate-300",
};

export default function FarmSwitcher({ collapsed, userId }: Props) {
    const [farms, setFarms] = useState<Farm[]>([]);
    const [activeFarmId, setActiveFarmId] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [showAddFarm, setShowAddFarm] = useState(false);
    const [newFarmName, setNewFarmName] = useState("");
    const [newFarmLocation, setNewFarmLocation] = useState("");
    const [creating, setCreating] = useState(false);
    const [switching, setSwitching] = useState(false);
    const [error, setError] = useState("");

    const load = () => {
        fetch("/api/farm-context")
            .then((r) => r.json())
            .then((d) => {
                setFarms(d.farms ?? []);
                setActiveFarmId(d.activeFarmId);
            });
    };

    useEffect(() => { load(); }, []);

    const activeFarm = farms.find((f) => f.id === activeFarmId) ?? farms[0];

    const switchFarm = async (farmId: string) => {
        setSwitching(true);
        await fetch("/api/farm-context", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ farmId }),
        });
        setActiveFarmId(farmId);
        setSwitching(false);
        setOpen(false);
        window.location.reload();
    };

    const createFarm = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true); setError("");
        const res = await fetch("/api/farms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newFarmName, location: newFarmLocation }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); setCreating(false); return; }
        setShowAddFarm(false);
        setNewFarmName(""); setNewFarmLocation("");
        setCreating(false);
        load();
        await switchFarm(data.id);
    };

    if (!activeFarm) return null;

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className={`w-full min-h-14 flex items-center gap-3 px-3 rounded-2xl transition-colors ${collapsed ? "justify-center" : "justify-between"}`}
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)", color: "white" }}
                title={collapsed ? activeFarm.name : undefined}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-sky-500/20 flex items-center justify-center text-sky-100 text-sm font-black flex-shrink-0 ring-1 ring-sky-300/20">
                        {collapsed ? <Building2 size={17} /> : activeFarm.name[0].toUpperCase()}
                    </div>
                    {!collapsed && (
                        <div className="min-w-0">
                            <p className="text-sm font-black text-white truncate leading-tight">{activeFarm.name}</p>
                            <p className="text-[11px] text-slate-300 truncate">{activeFarm.location || "Location not set"}</p>
                            <p className={`text-xs capitalize ${ROLE_COLORS[activeFarm.role]}`}>
                                {activeFarm.role}
                                {activeFarm.counts ? ` - ${activeFarm.counts.records} records` : ""}
                            </p>
                        </div>
                    )}
                </div>
                {!collapsed && <ChevronDown size={16} className="text-white/55 flex-shrink-0" />}
            </button>

            {open && !collapsed && (
                <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl shadow-2xl overflow-hidden"
                     style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.12)" }}>
                    <div className="p-2">
                        {farms.map((farm) => (
                            <button
                                key={farm.id}
                                onClick={() => switchFarm(farm.id)}
                                className="w-full min-h-12 flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-left"
                            >
                                <div className="w-9 h-9 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-100 text-xs font-black flex-shrink-0">
                                    {farm.name[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{farm.name}</p>
                                    <p className="text-[11px] text-slate-300 truncate">{farm.location || "Location not set"}</p>
                                    <p className={`text-xs capitalize ${ROLE_COLORS[farm.role]}`}>
                                        {farm.role}
                                        {farm.counts ? ` - ${farm.counts.fields} fields, ${farm.counts.crops} crops, ${farm.counts.activities} activities` : ""}
                                    </p>
                                </div>
                                {farm.id === activeFarmId && <Check size={15} className="text-sky-300 flex-shrink-0" />}
                            </button>
                        ))}
                    </div>

                    {farms.some((f) => f.isOwned) && (
                        <div className="p-2" style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}>
                            {showAddFarm ? (
                                <form onSubmit={createFarm} className="p-2 flex flex-col gap-2">
                                    <input
                                        value={newFarmName}
                                        onChange={(e) => setNewFarmName(e.target.value)}
                                        placeholder="Farm name"
                                        required
                                        className="h-8 px-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none w-full text-slate-900 dark:text-white"
                                    />
                                    <input
                                        value={newFarmLocation}
                                        onChange={(e) => setNewFarmLocation(e.target.value)}
                                        placeholder="Location (optional)"
                                        className="h-8 px-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none w-full text-slate-900 dark:text-white"
                                    />
                                    {error && <p className="text-xs text-red-500">{error}</p>}
                                    <div className="flex gap-1.5">
                                        <button type="button" onClick={() => setShowAddFarm(false)}
                                                className="flex-1 min-h-9 text-xs border border-slate-600 rounded-lg text-slate-200 hover:bg-white/10">
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={creating}
                                                className="flex-1 min-h-9 text-xs bg-sky-600 text-white rounded-lg hover:bg-sky-500 disabled:opacity-50 flex items-center justify-center">
                                            {creating ? <Loader2 size={10} className="animate-spin" /> : "Create"}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <button
                                    onClick={() => setShowAddFarm(true)}
                                    className="w-full min-h-11 flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-left"
                                >
                                    <Plus size={14} className="text-sky-200" />
                                    <span className="text-xs font-bold text-sky-100">Add farm</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

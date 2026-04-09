"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, Plus, Loader2 } from "lucide-react";

interface Farm {
    id: string;
    name: string;
    location: string;
    role: string;
    isOwned: boolean;
}

interface Props {
    collapsed: boolean;
    userId: string;
}

const ROLE_COLORS: Record<string, string> = {
    owner:      "text-purple-600",
    manager:    "text-blue-600",
    agronomist: "text-green-600",
    accountant: "text-amber-600",
    viewer:     "text-slate-400",
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
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${collapsed ? "justify-center" : "justify-between"}`}
                title={collapsed ? activeFarm.name : undefined}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-[#1a3d1f] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                        {activeFarm.name[0].toUpperCase()}
                    </div>
                    {!collapsed && (
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{activeFarm.name}</p>
                            <p className={`text-xs capitalize ${ROLE_COLORS[activeFarm.role]}`}>{activeFarm.role}</p>
                        </div>
                    )}
                </div>
                {!collapsed && <ChevronDown size={12} className="text-slate-400 flex-shrink-0" />}
            </button>

            {open && !collapsed && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-1">
                        {farms.map((farm) => (
                            <button
                                key={farm.id}
                                onClick={() => switchFarm(farm.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                            >
                                <div className="w-6 h-6 rounded-lg bg-[#1a3d1f] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                                    {farm.name[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{farm.name}</p>
                                    <p className={`text-xs capitalize ${ROLE_COLORS[farm.role]}`}>{farm.role}</p>
                                </div>
                                {farm.id === activeFarmId && <Check size={12} className="text-green-600 flex-shrink-0" />}
                            </button>
                        ))}
                    </div>

                    {farms.some((f) => f.isOwned) && (
                        <div className="border-t border-slate-100 dark:border-slate-800 p-1">
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
                                                className="flex-1 h-7 text-xs border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50">
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={creating}
                                                className="flex-1 h-7 text-xs bg-[#1a3d1f] text-white rounded-lg hover:bg-[#2d5c35] disabled:opacity-50 flex items-center justify-center">
                                            {creating ? <Loader2 size={10} className="animate-spin" /> : "Create"}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <button
                                    onClick={() => setShowAddFarm(true)}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                                >
                                    <Plus size={12} className="text-slate-400" />
                                    <span className="text-xs text-slate-500">Add farm</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
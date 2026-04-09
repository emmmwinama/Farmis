"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

function fmt(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_COLORS: Record<string, string> = {
    active: "bg-green-900/30 text-green-400",
    expired: "bg-red-900/30 text-red-400",
    suspended: "bg-orange-900/30 text-orange-400",
    trial: "bg-blue-900/30 text-blue-400",
};

export default function AdminSubscriptionsPage() {
    const [subs, setSubs] = useState<any[]>([]);
    const [tiers, setTiers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const load = () => {
        setLoading(true);
        Promise.all([
            fetch("/api/admin/subscriptions").then((r) => r.json()),
            fetch("/api/admin/tiers").then((r) => r.json()),
        ]).then(([s, t]) => { setSubs(s); setTiers(t); setLoading(false); });
    };

    useEffect(() => { load(); }, []);

    const update = async (id: string, data: any) => {
        await fetch(`/api/admin/subscriptions/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        load();
    };

    const filtered = subs.filter((s) =>
        s.userName?.toLowerCase().includes(search.toLowerCase()) ||
        s.userEmail?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-medium text-white">Subscriptions</h1>
                    <p className="text-[#4a7a50] text-sm mt-1">{subs.length} total subscriptions</p>
                </div>
            </div>

            <div className="mb-6">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by user..."
                       className="h-10 px-4 text-sm bg-[#1a2d1c] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white placeholder-[#4a7a50] w-72" />
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[#3d8c47]" /></div>
            ) : (
                <div className="bg-[#1a2d1c] border border-[#2d5c35] rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="border-b border-[#2d5c35]">
                            {["User", "Plan", "Billing", "Status", "Started", "Expires", "Notes"].map((h) => (
                                <th key={h} className="text-left text-xs text-[#4a7a50] font-medium px-5 py-4">{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1a3d1f]">
                        {filtered.map((sub) => (
                            <tr key={sub.id} className="hover:bg-[#1a3d1f]/30 transition-colors">
                                <td className="px-5 py-4">
                                    <p className="text-white font-medium">{sub.userName}</p>
                                    <p className="text-xs text-[#4a7a50]">{sub.userEmail}</p>
                                </td>
                                <td className="px-5 py-4">
                                    <select value={sub.tierId} onChange={(e) => update(sub.id, { tierId: e.target.value })}
                                            className="h-7 px-2 text-xs bg-[#111d13] border border-[#2d5c35] rounded-lg text-white outline-none">
                                        {tiers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </td>
                                <td className="px-5 py-4">
                                    <select value={sub.billingCycle} onChange={(e) => update(sub.id, { billingCycle: e.target.value })}
                                            className="h-7 px-2 text-xs bg-[#111d13] border border-[#2d5c35] rounded-lg text-white outline-none">
                                        <option value="monthly">Monthly</option>
                                        <option value="annual">Annual</option>
                                    </select>
                                </td>
                                <td className="px-5 py-4">
                                    <select value={sub.status} onChange={(e) => update(sub.id, { status: e.target.value })}
                                            className={`h-7 px-2 text-xs rounded-lg outline-none border-0 ${STATUS_COLORS[sub.status] ?? "bg-[#111d13] text-white"}`}>
                                        {["active", "expired", "suspended", "trial"].map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </td>
                                <td className="px-5 py-4 text-xs text-[#4a7a50]">{fmt(sub.startDate)}</td>
                                <td className="px-5 py-4">
                                    <input type="date" value={sub.endDate ? new Date(sub.endDate).toISOString().split("T")[0] : ""}
                                           onChange={(e) => update(sub.id, { endDate: e.target.value })}
                                           className="h-7 px-2 text-xs bg-[#111d13] border border-[#2d5c35] rounded-lg text-white outline-none w-32" />
                                </td>
                                <td className="px-5 py-4">
                                    <input value={sub.notes ?? ""} placeholder="Add notes..."
                                           onBlur={(e) => update(sub.id, { notes: e.target.value })}
                                           onChange={() => {}}
                                           className="h-7 px-2 text-xs bg-transparent border border-transparent hover:border-[#2d5c35] focus:border-[#3d8c47] rounded-lg text-[#4a7a50] outline-none w-32" />
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
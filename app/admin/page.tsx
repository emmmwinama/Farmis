"use client";

import { useEffect, useState } from "react";
import { Users, CreditCard, TrendingUp, Activity } from "lucide-react";

function fmt(n: number) {
    return new Intl.NumberFormat("en-MW").format(Math.round(n));
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminOverviewPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/overview")
            .then((r) => r.json())
            .then((d) => { setData(d); setLoading(false); });
    }, []);

    if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-[#3d8c47] border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-medium text-white">Overview</h1>
                <p className="text-[#4a7a50] text-sm mt-1">Platform-wide metrics and recent activity</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Total users", value: data.totalUsers, icon: Users },
                    { label: "Active subscriptions", value: data.activeSubscriptions, icon: CreditCard },
                    { label: "Total revenue", value: `MWK ${fmt(data.totalRevenue)}`, icon: TrendingUp },
                    { label: "Tiers", value: data.subsByTier.length, icon: Activity },
                ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="bg-[#1a2d1c] border border-[#2d5c35] rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs text-[#4a7a50] uppercase tracking-wide font-medium">{label}</span>
                            <Icon size={15} className="text-[#3d8c47]" />
                        </div>
                        <p className="text-2xl font-medium text-white">{value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-[#1a2d1c] border border-[#2d5c35] rounded-2xl p-6">
                    <h2 className="text-base font-medium text-white mb-5">Subscriptions by tier</h2>
                    <div className="flex flex-col gap-3">
                        {data.subsByTier.map((t: any, i: number) => (
                            <div key={`${t.tierName}-${i}`} className="flex items-center justify-between">
                                <span className="text-sm text-[#7dd68a]">{t.tierName}</span>
                                <div className="flex items-center gap-3">
                                    <div className="w-24 h-1.5 bg-[#111d13] rounded-full overflow-hidden">
                                        <div className="h-full bg-[#3d8c47] rounded-full"
                                             style={{ width: `${Math.min((t.count / data.totalUsers) * 100, 100)}%` }} />
                                    </div>
                                    <span className="text-sm text-white font-medium w-6 text-right">{t.count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-[#1a2d1c] border border-[#2d5c35] rounded-2xl p-6">
                    <h2 className="text-base font-medium text-white mb-5">Recent payments</h2>
                    <div className="flex flex-col divide-y divide-[#2d5c35]">
                        {data.recentPayments.length === 0 ? (
                            <p className="text-sm text-[#4a7a50]">No payments yet</p>
                        ) : data.recentPayments.map((p: any) => (
                            <div key={p.id} className="flex items-center justify-between py-3">
                                <div>
                                    <p className="text-sm text-white">{p.userName}</p>
                                    <p className="text-xs text-[#4a7a50]">{p.tierName} &middot; {p.paidAt ? formatDate(p.paidAt) : "—"}</p>
                                </div>
                                <p className="text-sm font-medium text-[#7dd68a]">MWK {fmt(p.amount)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-[#1a2d1c] border border-[#2d5c35] rounded-2xl p-6">
                <h2 className="text-base font-medium text-white mb-5">Recent users</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="border-b border-[#2d5c35]">
                            {["Name", "Email", "Plan", "Status", "Joined"].map((h) => (
                                <th key={h} className="text-left text-xs text-[#4a7a50] font-medium pb-3 pr-4">{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1a3d1f]">
                        {data.recentUsers.map((u: any) => (
                            <tr key={u.id}>
                                <td className="py-3 pr-4 text-white font-medium">{u.name}</td>
                                <td className="py-3 pr-4 text-[#4a7a50]">{u.email}</td>
                                <td className="py-3 pr-4">
                                    <span className="text-xs bg-[#1a3d1f] text-[#7dd68a] px-2 py-0.5 rounded-lg">{u.tierName}</span>
                                </td>
                                <td className="py-3 pr-4">
                    <span className={`text-xs px-2 py-0.5 rounded-lg ${
                        u.subscriptionStatus === "active" ? "bg-green-900/30 text-green-400" :
                            u.subscriptionStatus === "expired" ? "bg-red-900/30 text-red-400" :
                                "bg-slate-800 text-slate-400"
                    }`}>{u.subscriptionStatus ?? "—"}</span>
                                </td>
                                <td className="py-3 text-[#4a7a50]">{formatDate(u.createdAt)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
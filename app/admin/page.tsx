"use client";

import { useEffect, useState } from "react";
import { Users, CreditCard, TrendingUp, Activity, ArrowRight } from "lucide-react";
import Link from "next/link";

function fmt(n: number) { return new Intl.NumberFormat("en-MW").format(Math.round(n)); }
function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const CARD_ACCENTS = ["#0F766E", "#2563EB", "#0284C7", "#7C3AED"];

function StatCard({ label, value, sub, icon: Icon, accent, href }: {
    label: string; value: string; sub?: string; icon: any; accent: string; href?: string;
}) {
    const inner = (
        <div className="rounded-2xl p-6 group cursor-pointer transition-all hover:-translate-y-0.5"
             style={{ background: "white", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
            <div className="flex items-start justify-between mb-5">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                     style={{ background: accent + "12" }}>
                    <Icon size={20} style={{ color: accent }} />
                </div>
                {href && <ArrowRight size={16} style={{ color: "#CBD5E1" }} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
            </div>
            <p className="text-3xl font-black mb-1.5" style={{ color: "#0F172A" }}>{value}</p>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>{label}</p>
            {sub && <p className="text-xs mt-0.5" style={{ color: "#CBD5E1" }}>{sub}</p>}
        </div>
    );
    return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function AdminOverviewPage() {
    const [data, setData]     = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/overview")
            .then(async (r) => {
                const text = await r.text();
                if (!text) return null;
                try { return JSON.parse(text); } catch { return null; }
            })
            .then((d) => { if (d) setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                         style={{ background: "#F0FDF4" }}>
                        <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                             style={{ borderColor: "#0F766E", borderTopColor: "transparent" }} />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: "#94A3B8" }}>Loading overview...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">

            <div className="mb-8">
                <h1 className="text-2xl font-black" style={{ color: "#0F172A", letterSpacing: "-0.04em" }}>
                    Platform Overview
                </h1>
                <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>
                    {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="Total users"          value={String(data?.totalUsers ?? 0)}              icon={Users}      accent={CARD_ACCENTS[0]} href="/admin/users" />
                <StatCard label="Active subscriptions" value={String(data?.activeSubscriptions ?? 0)}     icon={CreditCard} accent={CARD_ACCENTS[1]} href="/admin/subscriptions" />
                <StatCard label="Total revenue"        value={`MWK ${fmt(data?.totalRevenue ?? 0)}`}      icon={TrendingUp}  accent={CARD_ACCENTS[2]} href="/admin/payments" />
                <StatCard label="Tier plans"           value={String(data?.subsByTier?.length ?? 0)}      icon={Activity}   accent={CARD_ACCENTS[3]} href="/admin/tiers" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                {/* Tier breakdown */}
                <div className="rounded-2xl p-6"
                     style={{ background: "white", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
                    <h2 className="text-sm font-extrabold mb-5" style={{ color: "#0F172A" }}>Subscriptions by tier</h2>
                    {(data.subsByTier ?? []).length === 0 ? (
                        <p className="text-sm" style={{ color: "#94A3B8" }}>No subscriptions yet</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {data.subsByTier.map((t: any, i: number) => {
                                const pct = data.totalUsers > 0 ? Math.min((t.count / data.totalUsers) * 100, 100) : 0;
                                const color = CARD_ACCENTS[i % CARD_ACCENTS.length];
                                return (
                                    <div key={`${t.tierName}-${i}`}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-sm font-bold" style={{ color: "#0F172A" }}>{t.tierName}</span>
                                            <span className="text-sm font-extrabold" style={{ color }}>{t.count}</span>
                                        </div>
                                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                                            <div className="h-full rounded-full transition-all"
                                                 style={{ width: `${pct}%`, background: color }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Recent payments */}
                <div className="rounded-2xl p-6"
                     style={{ background: "white", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-sm font-extrabold" style={{ color: "#0F172A" }}>Recent payments</h2>
                        <Link href="/admin/payments" className="text-xs font-bold" style={{ color: "#0F766E" }}>View all →</Link>
                    </div>
                    {(data.recentPayments ?? []).length === 0 ? (
                        <p className="text-sm" style={{ color: "#94A3B8" }}>No payments yet</p>
                    ) : (
                        <div className="flex flex-col gap-0">
                            {data.recentPayments.map((p: any) => (
                                <div key={p.id} className="flex items-center justify-between py-3"
                                     style={{ borderBottom: "1px solid #F1F5F9" }}>
                                    <div>
                                        <p className="text-sm font-bold" style={{ color: "#0F172A" }}>{p.userName}</p>
                                        <p className="text-xs" style={{ color: "#94A3B8" }}>
                                            {p.tierName} · {fmtDate(p.paidAt)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-extrabold" style={{ color: "#0F766E" }}>
                                            MWK {fmt(p.amount)}
                                        </p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                                            p.status === "success" ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700"
                                        }`}>
                      {p.status}
                    </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent users table */}
            <div className="rounded-2xl overflow-hidden"
                 style={{ background: "white", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
                <div className="flex items-center justify-between px-6 py-4"
                     style={{ borderBottom: "1px solid #F1F5F9", background: "#F8FAFC" }}>
                    <h2 className="text-sm font-extrabold" style={{ color: "#0F172A" }}>Recent registrations</h2>
                    <Link href="/admin/users" className="text-xs font-bold" style={{ color: "#0F766E" }}>View all →</Link>
                </div>
                <table className="w-full text-sm">
                    <thead>
                    <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                        {["User", "Email", "Farm", "Joined", "Status"].map((h) => (
                            <th key={h} className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest"
                                style={{ color: "#94A3B8" }}>
                                {h}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {(data.recentUsers ?? []).map((u: any) => (
                        <tr key={u.id} className="transition-colors"
                            style={{ borderBottom: "1px solid #F8FAFC" }}
                            onMouseOver={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                            onMouseOut={(e)  => (e.currentTarget.style.background = "transparent")}>
                            <td className="px-6 py-3.5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                                         style={{ background: "#1E293B" }}>
                                        {u.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                                    </div>
                                    <span className="font-bold" style={{ color: "#0F172A" }}>{u.name}</span>
                                </div>
                            </td>
                            <td className="px-6 py-3.5 text-sm" style={{ color: "#64748B" }}>{u.email}</td>
                            <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: "#0F766E" }}>{u.farmName ?? "—"}</td>
                            <td className="px-6 py-3.5 text-sm" style={{ color: "#94A3B8" }}>{fmtDate(u.createdAt)}</td>
                            <td className="px-6 py-3.5">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                      u.isActive ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700"
                  }`}>
                    {u.isActive ? "Active" : "Pending"}
                  </span>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

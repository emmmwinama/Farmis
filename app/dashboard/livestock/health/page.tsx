"use client";

import { useEffect, useState } from "react";
import { Loader2, Heart, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmt(n: number) { return new Intl.NumberFormat("en-MW").format(Math.round(n)); }

function daysUntil(d: string) {
    return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

export default function LivestockHealthPage() {
    const [data, setData]     = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab]       = useState<"upcoming" | "all">("upcoming");

    useEffect(() => {
        Promise.all([
            fetch("/api/livestock/health?upcoming=true").then((r) => r.json()),
            fetch("/api/livestock/health").then((r) => r.json()),
        ]).then(([upcoming, all]) => {
            setData({ upcoming: upcoming.records, all: all.records, totalCost: all.totalCost });
            setLoading(false);
        });
    }, []);

    const records = tab === "upcoming" ? (data?.upcoming ?? []) : (data?.all ?? []);

    return (
        <div className="p-8 max-w-5xl mx-auto animate-fade-in">

            <div className="page-header flex items-start justify-between">
                <div>
                    <h1 className="page-title">Health & Vaccination Schedule</h1>
                    <p className="page-subtitle">Track treatments, vaccinations and upcoming health procedures</p>
                </div>
                <Link href="/dashboard/livestock" className="btn-secondary text-xs">
                    ← Back to livestock
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="stat-card">
                    <p className="metric-label">Upcoming procedures</p>
                    <p className="metric-value" style={{ color: "#0284C7" }}>{data?.upcoming?.length ?? 0}</p>
                </div>
                <div className="stat-card">
                    <p className="metric-label">Total records</p>
                    <p className="metric-value">{data?.all?.length ?? 0}</p>
                </div>
                <div className="stat-card">
                    <p className="metric-label">Total health costs</p>
                    <p className="metric-value text-lg" style={{ color: "#DC2626" }}>
                        MWK {fmt(data?.totalCost ?? 0)}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                {[
                    { key: "upcoming", label: `Due soon (${data?.upcoming?.length ?? 0})` },
                    { key: "all",      label: `All records (${data?.all?.length ?? 0})` },
                ].map(({ key, label }) => (
                    <button key={key} onClick={() => setTab(key as any)}
                            className="h-9 px-5 rounded-xl text-sm font-bold transition-all"
                            style={{
                                background: tab === key ? "linear-gradient(135deg, #1a3d1f, #2d6a35)" : "var(--bg-card)",
                                color:      tab === key ? "white" : "var(--text-secondary)",
                                border:     `1.5px solid ${tab === key ? "transparent" : "var(--border)"}`,
                            }}>
                        {label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={24} className="animate-spin" style={{ color: "var(--farm-green)" }} />
                </div>
            ) : records.length === 0 ? (
                <div className="rounded-3xl p-16 text-center"
                     style={{ background: "var(--bg-card)", border: "1.5px dashed var(--border)" }}>
                    <div className="empty-state">
                        <div className="empty-icon">
                            <Heart size={28} style={{ color: "var(--text-muted)" }} />
                        </div>
                        <p className="section-title mb-2">
                            {tab === "upcoming" ? "No upcoming procedures" : "No health records yet"}
                        </p>
                        <p className="section-subtitle">
                            {tab === "upcoming"
                                ? "All health procedures are up to date"
                                : "Add health records from individual animal pages"}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {records.map((h: any) => {
                        const days = h.nextDueDate ? daysUntil(h.nextDueDate) : null;
                        const isOverdue = days !== null && days < 0;
                        const isDueSoon = days !== null && days >= 0 && days <= 7;

                        return (
                            <div key={h.id} className="card p-5 flex items-start gap-4 card-hover">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                     style={{
                                         background: isOverdue ? "var(--error-bg)" : isDueSoon ? "#E0F2FE" : "var(--success-bg)",
                                         color:      isOverdue ? "var(--error-text)" : isDueSoon ? "#0284C7" : "#166534",
                                     }}>
                                    {isOverdue ? <AlertTriangle size={18} /> : isDueSoon ? <Clock size={18} /> : <CheckCircle size={18} />}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="badge badge-green">{h.type}</span>
                                        {h.nextDueDate && (
                                            <span className={`badge ${isOverdue ? "badge-red" : isDueSoon ? "badge-sky" : "badge-warm"}`}>
                        {isOverdue
                            ? `Overdue by ${Math.abs(days!)} days`
                            : days === 0
                                ? "Due today"
                                : `Due in ${days} days — ${fmtDate(h.nextDueDate)}`}
                      </span>
                                        )}
                                    </div>
                                    <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{h.description}</p>
                                    <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                                        <span>{h.animal?.livestockType?.icon} {h.animal?.name ?? h.animal?.tag ?? "Animal"}</span>
                                        {h.veterinarian && <span>· Dr. {h.veterinarian}</span>}
                                        <span>· {fmtDate(h.date)}</span>
                                    </div>
                                </div>

                                <div className="text-right flex-shrink-0">
                                    <p className="text-sm font-extrabold" style={{ color: "#DC2626" }}>
                                        MWK {fmt(h.cost)}
                                    </p>
                                    <Link href={`/dashboard/livestock/${h.animalId}`}
                                          className="text-xs font-bold mt-1 block"
                                          style={{ color: "var(--farm-green)" }}>
                                        View animal →
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

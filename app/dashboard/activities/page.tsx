"use client";

import { useEffect, useState } from "react";
import {
    Plus, Loader2, ChevronDown, ChevronUp,
    ClipboardList, TrendingUp,
} from "lucide-react";
import Link from "next/link";

const ACTIVITY_ICONS: Record<string, string> = {
    Planting: "🌱", Spraying: "🧪", Weeding: "🌿", Irrigation: "💧",
    Fertilising: "🌾", Harvesting: "🏃", "Land preparation": "🚜",
    Pruning: "✂️", Scouting: "🔍", Other: "📋",
};

function fmt(n: number) { return new Intl.NumberFormat("en-MW").format(Math.round(n)); }
function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function ActivitiesPage() {
    const [data,          setData]          = useState<any>(null);
    const [loading,       setLoading]       = useState(true);
    const [typeFilter,    setTypeFilter]    = useState("All");
    const [seasonFilter,  setSeasonFilter]  = useState("All");
    const [fieldFilter,   setFieldFilter]   = useState("All");
    const [expandedId,    setExpandedId]    = useState<string | null>(null);
    const [showAnalytics, setShowAnalytics] = useState(true);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (typeFilter   !== "All") params.set("type",     typeFilter);
        if (seasonFilter !== "All") params.set("season",   seasonFilter);
        if (fieldFilter  !== "All") params.set("fieldId",  fieldFilter);
        fetch(`/api/activities?${params.toString()}`)
            .then((r) => r.json())
            .then((d) => { setData(d); setLoading(false); });
    }, [typeFilter, seasonFilter, fieldFilter]);

    const activities = data?.activities ?? [];
    const totalCost  = activities.reduce((s: number, a: any) => s + a.totalCost, 0);

    const SEL: React.CSSProperties = {
        height: "40px", padding: "0 12px",
        fontSize: "13px", outline: "none",
        borderRadius: "10px",
        border:      "1px solid var(--border)",
        background:  "var(--bg-card)",
        color:       "var(--text-primary)",
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)", letterSpacing: "-0.04em" }}>
                        Activities
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                        {activities.length} activities · MWK {fmt(totalCost)} total cost
                    </p>
                </div>
                <Link href="/dashboard/activities/new"
                      className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold text-white"
                      style={{ background: "var(--farm-green)", boxShadow: "0 4px 12px rgba(26,61,31,0.25)" }}>
                    <Plus size={15} /> Log activity
                </Link>
            </div>

            {/* Analytics */}
            {data?.byType?.length > 0 && (
                <div className="mb-6">
                    <button
                        onClick={() => setShowAnalytics(!showAnalytics)}
                        className="flex items-center gap-2 text-sm font-extrabold mb-3 transition-colors"
                        style={{ color: "var(--text-secondary)" }}>
                        <TrendingUp size={15} />
                        Analytics
                        {showAnalytics ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {showAnalytics && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            {/* By type */}
                            <div className="rounded-2xl p-5"
                                 style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                                <p className="text-[10px] font-black uppercase tracking-widest mb-3"
                                   style={{ color: "var(--text-muted)" }}>
                                    By type
                                </p>
                                <div className="flex flex-col gap-2">
                                    {(data?.byType ?? []).slice(0, 5).map((t: any) => (
                                        <div key={t.type} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">{ACTIVITY_ICONS[t.type] ?? "📋"}</span>
                                                <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                                                    {t.type}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-extrabold" style={{ color: "var(--text-primary)" }}>
                                                    {t.count}
                                                </p>
                                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                    MWK {fmt(t.totalCost)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* By field */}
                            <div className="rounded-2xl p-5"
                                 style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                                <p className="text-[10px] font-black uppercase tracking-widest mb-3"
                                   style={{ color: "var(--text-muted)" }}>
                                    By field
                                </p>
                                <div className="flex flex-col gap-2">
                                    {(data?.byField ?? []).slice(0, 5).map((f: any) => (
                                        <div key={f.name} className="flex items-center justify-between">
                                            <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                                                {f.name}
                                            </span>
                                            <div className="text-right">
                                                <p className="text-xs font-extrabold" style={{ color: "var(--text-primary)" }}>
                                                    {f.count} activities
                                                </p>
                                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                    MWK {fmt(f.totalCost)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* By season */}
                            <div className="rounded-2xl p-5"
                                 style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                                <p className="text-[10px] font-black uppercase tracking-widest mb-3"
                                   style={{ color: "var(--text-muted)" }}>
                                    By season
                                </p>
                                <div className="flex flex-col gap-2">
                                    {(data?.bySeason ?? []).slice(0, 5).map((s: any) => (
                                        <div key={s.season} className="flex items-center justify-between">
                                            <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                                                {s.season}
                                            </span>
                                            <div className="text-right">
                                                <p className="text-xs font-extrabold" style={{ color: "var(--text-primary)" }}>
                                                    {s.count}
                                                </p>
                                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                    MWK {fmt(s.totalCost)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={SEL}>
                    <option value="All">All types</option>
                    {Object.keys(ACTIVITY_ICONS).map((t) => <option key={t}>{t}</option>)}
                </select>

                <select value={seasonFilter} onChange={(e) => setSeasonFilter(e.target.value)} style={SEL}>
                    <option value="All">All seasons</option>
                    {(data?.allSeasons ?? []).map((s: string) => <option key={s}>{s}</option>)}
                </select>

                <select value={fieldFilter} onChange={(e) => setFieldFilter(e.target.value)} style={SEL}>
                    <option value="All">All fields</option>
                    {(data?.allFields ?? []).map((f: any) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                </select>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={24} className="animate-spin" style={{ color: "var(--farm-green)" }} />
                </div>
            ) : activities.length === 0 ? (
                <div className="rounded-2xl p-16 text-center"
                     style={{ background: "var(--bg-card)", border: "1.5px dashed var(--border)" }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                         style={{ background: "var(--bg-subtle)" }}>
                        <ClipboardList size={24} style={{ color: "var(--text-muted)" }} />
                    </div>
                    <p className="text-lg font-black mb-1" style={{ color: "var(--text-primary)" }}>
                        No activities yet
                    </p>
                    <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                        Log your first farm activity to start tracking costs
                    </p>
                    <Link href="/dashboard/activities/new"
                          className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-bold text-white"
                          style={{ background: "var(--farm-green)" }}>
                        <Plus size={15} /> Log activity
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {activities.map((activity: any) => (
                        <div key={activity.id}
                             className="rounded-2xl overflow-hidden transition-all"
                             style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>

                            {/* Row header — clickable */}
                            <div className="flex items-center gap-4 p-4 cursor-pointer"
                                 onClick={() => setExpandedId(expandedId === activity.id ? null : activity.id)}>

                                {/* Icon */}
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                                     style={{ background: "var(--bg-subtle)" }}>
                                    {ACTIVITY_ICONS[activity.activityType] ?? "📋"}
                                </div>

                                {/* Main info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                        <p className="font-extrabold" style={{ color: "var(--text-primary)" }}>
                                            {activity.activityType}
                                        </p>
                                        {activity.season && (
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                                                  style={{ background: "#FFFBEB", color: "#854F0B" }}>
                                                {activity.season}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                        {activity.fieldName}
                                        {activity.cropName
                                            ? ` · ${activity.cropName} (${activity.cropVariety})`
                                            : ""}
                                    </p>
                                </div>

                                {/* Cost + date */}
                                <div className="text-right flex-shrink-0">
                                    <p className="font-extrabold" style={{ color: "var(--text-primary)" }}>
                                        MWK {fmt(activity.totalCost)}
                                    </p>
                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                        {formatDate(activity.date)}
                                    </p>
                                </div>

                                {/* Chevron */}
                                <div className="ml-1 flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                                    {expandedId === activity.id
                                        ? <ChevronUp size={15} />
                                        : <ChevronDown size={15} />}
                                </div>
                            </div>

                            {/* Expanded detail */}
                            {expandedId === activity.id && (
                                <div className="px-4 pb-4 pt-3"
                                     style={{ borderTop: "1px solid var(--border)" }}>

                                    {/* Cost breakdown cards */}
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        {[
                                            { label: "Labour cost",  value: `MWK ${fmt(activity.totalLabourCost)}` },
                                            { label: "Input cost",   value: `MWK ${fmt(activity.totalInputCost)}`  },
                                            { label: "Other costs",  value: `MWK ${fmt(activity.totalOtherCost)}`  },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="rounded-xl p-3"
                                                 style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                                                <p className="text-[10px] font-black uppercase tracking-wide mb-1"
                                                   style={{ color: "var(--text-muted)" }}>
                                                    {label}
                                                </p>
                                                <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                                                    {value}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Labour records */}
                                    {activity.labourRecords?.length > 0 && (
                                        <div className="mb-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest mb-2"
                                               style={{ color: "var(--text-muted)" }}>
                                                Labour
                                            </p>
                                            <div className="flex flex-col gap-1.5">
                                                {activity.labourRecords.map((l: any) => (
                                                    <div key={l.id}
                                                         className="flex items-center justify-between text-xs rounded-xl px-3 py-2"
                                                         style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                                                        <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                                                            {l.employeeName}
                                                        </span>
                                                        <span style={{ color: "var(--text-muted)" }}>
                                                            {l.daysWorked}d / {l.hoursWorked}h
                                                        </span>
                                                        <span className="font-extrabold" style={{ color: "var(--text-primary)" }}>
                                                            MWK {fmt(l.totalCost)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Inputs used */}
                                    {activity.inputs?.length > 0 && (
                                        <div className="mb-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest mb-2"
                                               style={{ color: "var(--text-muted)" }}>
                                                Inputs used
                                            </p>
                                            <div className="flex flex-col gap-1.5">
                                                {activity.inputs.map((inp: any) => (
                                                    <div key={inp.id}
                                                         className="flex items-center justify-between text-xs rounded-xl px-3 py-2"
                                                         style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                                                        <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                                                            {inp.inputName}
                                                        </span>
                                                        <span style={{ color: "var(--text-muted)" }}>
                                                            {inp.quantity} {inp.unit} @ MWK {fmt(inp.unitCost)}
                                                        </span>
                                                        <span className="font-extrabold" style={{ color: "var(--text-primary)" }}>
                                                            MWK {fmt(inp.totalCost)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Other costs */}
                                    {activity.otherCosts?.length > 0 && (
                                        <div className="mb-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest mb-2"
                                               style={{ color: "var(--text-muted)" }}>
                                                Other costs
                                            </p>
                                            <div className="flex flex-col gap-1.5">
                                                {activity.otherCosts.map((o: any) => (
                                                    <div key={o.id}
                                                         className="flex items-center justify-between text-xs rounded-xl px-3 py-2"
                                                         style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                                                        <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                                                            {o.description}
                                                        </span>
                                                        <span className="font-extrabold" style={{ color: "var(--text-primary)" }}>
                                                            MWK {fmt(o.amount)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Notes */}
                                    {activity.notes && (
                                        <p className="text-xs italic mt-1" style={{ color: "var(--text-muted)" }}>
                                            {activity.notes}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
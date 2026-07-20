"use client";

import { useEffect, useState } from "react";
import {
    Plus, Loader2, ChevronDown, ChevronUp,
    ClipboardList, TrendingUp, Sprout, Beaker,
    Droplets, Leaf, Wheat, Package, Tractor, Scissors, Search,
    Archive, CircleDot, Layers3,
} from "lucide-react";
import Link from "next/link";

const ACTIVITY_ICONS: Record<string, any> = {
    Planting: Sprout,
    Spraying: Beaker,
    Weeding: Leaf,
    Irrigation: Droplets,
    Fertilising: Wheat,
    Harvesting: Package,
    "Land preparation": Tractor,
    Pruning: Scissors,
    Scouting: Search,
    Other: ClipboardList,
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
    const [cropState,     setCropState]     = useState<"active" | "archived" | "all">("active");
    const [expandedId,    setExpandedId]    = useState<string | null>(null);
    const [showAnalytics, setShowAnalytics] = useState(true);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (typeFilter   !== "All") params.set("type",     typeFilter);
        if (seasonFilter !== "All") params.set("season",   seasonFilter);
        if (fieldFilter  !== "All") params.set("fieldId",  fieldFilter);
        params.set("cropState", cropState);
        fetch(`/api/activities?${params.toString()}`)
            .then((r) => r.json())
            .then((d) => { setData(d); setLoading(false); });
    }, [typeFilter, seasonFilter, fieldFilter, cropState]);

    const activities = data?.activities ?? [];
    const totalCost  = activities.reduce((s: number, a: any) => s + a.totalCost, 0);
    const activeCount = activities.filter((a: any) => !a.cropArchived && a.cropStatus !== "Harvested").length;
    const archivedCount = activities.length - activeCount;
    const avgCost = activities.length ? totalCost / activities.length : 0;
    const topType = data?.byType?.[0]?.type ?? "No activity";
    const groupedByCrop = activities.reduce((map: Record<string, any[]>, activity: any) => {
        const key = activity.cropName
            ? `${activity.cropName}${activity.cropVariety ? ` - ${activity.cropVariety}` : ""}`
            : "General field work";
        if (!map[key]) map[key] = [];
        map[key].push(activity);
        return map;
    }, {});

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
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)", letterSpacing: "-0.04em" }}>
                        Activities
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                        {activities.length} activities  -  MWK {fmt(totalCost)} total cost
                    </p>
                </div>
                <Link href="/dashboard/activities/new"
                      className="flex items-center gap-2 min-h-11 px-5 rounded-xl text-sm font-bold text-white"
                      style={{ background: "#0284C7", boxShadow: "0 4px 12px rgba(2,132,199,0.25)" }}>
                    <Plus size={15} /> Log activity
                </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {[
                    { label: "Shown records", value: String(activities.length), icon: ClipboardList, color: "#0284C7" },
                    { label: "Active crop work", value: String(activeCount), icon: CircleDot, color: "#0D9488" },
                    { label: "Archived history", value: String(archivedCount), icon: Archive, color: "#64748B" },
                    { label: "Average cost", value: `MWK ${fmt(avgCost)}`, icon: TrendingUp, color: "#2563EB" },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="rounded-2xl p-4"
                         style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{label}</p>
                                <p className="text-xl font-black mt-1" style={{ color }}>{value}</p>
                            </div>
                            <span className="w-11 h-11 rounded-2xl flex items-center justify-center"
                                  style={{ background: "var(--bg-subtle)", color }}>
                                <Icon size={18} />
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                {([
                    { key: "active", label: "Active crops", icon: CircleDot },
                    { key: "archived", label: "Harvested / archived", icon: Archive },
                    { key: "all", label: "All activity history", icon: Layers3 },
                ] as const).map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => setCropState(key)}
                            className="min-h-11 px-4 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all"
                            style={{
                                background: cropState === key ? "#0F172A" : "var(--bg-card)",
                                color: cropState === key ? "white" : "var(--text-secondary)",
                                border: "1px solid var(--border)",
                            }}>
                        <Icon size={16} />
                        {label}
                    </button>
                ))}
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
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                                                <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--bg-subtle)", color: "var(--text-secondary)" }}>{(() => { const Icon = ACTIVITY_ICONS[t.type] ?? ClipboardList; return <Icon size={15} />; })()}</span>
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

                            <div className="rounded-2xl p-5"
                                 style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                                <p className="text-[10px] font-black uppercase tracking-widest mb-3"
                                   style={{ color: "var(--text-muted)" }}>
                                    Cost shape
                                </p>
                                <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                                    Top work type: <span className="font-black" style={{ color: "var(--text-primary)" }}>{topType}</span>
                                </p>
                                <div className="flex flex-col gap-2">
                                    {(data?.byType ?? []).slice(0, 4).map((t: any) => {
                                        const pct = totalCost > 0 ? Math.round((t.totalCost / totalCost) * 100) : 0;
                                        return (
                                            <div key={t.type}>
                                                <div className="flex justify-between text-[10px] font-bold mb-1" style={{ color: "var(--text-muted)" }}>
                                                    <span>{t.type}</span>
                                                    <span>{pct}%</span>
                                                </div>
                                                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                                                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#0284C7" }} />
                                                </div>
                                            </div>
                                        );
                                    })}
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

            {cropState === "all" && activities.length > 0 && (
                <div className="rounded-2xl p-4 mb-6"
                     style={{ background: "#F0F9FF", border: "1px solid #BAE6FD" }}>
                    <p className="text-sm font-bold" style={{ color: "#075985" }}>
                        Showing active work and historical records together. Use the crop groups below to separate current work from audit history.
                    </p>
                </div>
            )}

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
                <div className="flex flex-col gap-5">
                    {Object.entries(groupedByCrop).map(([cropLabel, cropActivities]) => (
                        <div key={cropLabel} className="rounded-3xl p-3"
                             style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                            <div className="flex items-center justify-between px-2 py-2">
                                <div>
                                    <p className="text-sm font-black" style={{ color: "var(--text-primary)" }}>{cropLabel}</p>
                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                        {(cropActivities as any[]).length} records - MWK {fmt((cropActivities as any[]).reduce((s, a) => s + a.totalCost, 0))}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                    {(cropActivities as any[]).map((activity: any) => (
                        <div key={activity.id}
                             className="rounded-2xl overflow-hidden transition-all"
                             style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>

                            {/* Row header - clickable */}
                            <div className="flex items-center gap-4 p-5 cursor-pointer min-h-20"
                                 onClick={() => setExpandedId(expandedId === activity.id ? null : activity.id)}>

                                {/* Icon */}
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                                     style={{ background: "var(--bg-subtle)" }}>
                                    {(() => { const Icon = ACTIVITY_ICONS[activity.activityType] ?? ClipboardList; return <Icon size={18} style={{ color: "var(--text-secondary)" }} />; })()}
                                </div>

                                {/* Main info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                        <p className="font-extrabold" style={{ color: "var(--text-primary)" }}>
                                            {activity.activityType}
                                        </p>
                                        {activity.season && (
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                                                  style={{ background: "#F0F9FF", color: "#075985" }}>
                                                {activity.season}
                                            </span>
                                        )}
                                        {(activity.cropArchived || activity.cropStatus === "Harvested") && (
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                                                  style={{ background: "#E2E8F0", color: "#475569" }}>
                                                Historical
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                        {activity.fieldName}
                                        {activity.cropName
                                            ? `  -  ${activity.cropName} (${activity.cropVariety})`
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

                                    {(activity.responsibleEmployee || activity.responsiblePersonName) && (
                                        <div className="rounded-xl px-3 py-2 mb-3 text-xs flex items-center justify-between"
                                             style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                                            <span className="font-black uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                                                Responsible
                                            </span>
                                            <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                                                {activity.responsibleEmployee?.name ?? activity.responsiblePersonName}
                                            </span>
                                        </div>
                                    )}

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
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}


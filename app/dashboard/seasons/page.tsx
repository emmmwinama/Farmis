"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, CalendarDays, ArrowLeftRight, Leaf, Sprout, FlaskConical, Droplets, Shovel, PackageCheck, ClipboardList } from "lucide-react";

function fmt(n: number) { return new Intl.NumberFormat("en-MW").format(Math.round(n)); }
function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const ACTIVITY_ICONS: Record<string, any> = {
    Planting: Sprout, Spraying: FlaskConical, Weeding: Shovel, Irrigation: Droplets,
    Fertilising: Leaf, Harvesting: PackageCheck, "Land preparation": Shovel, Other: ClipboardList,
};

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
    Active:    { bg: "#ECFDF5", color: "#166534" },
    Harvested: { bg: "#EFF6FF", color: "#1E3A8A" },
    Failed:    { bg: "#FEF2F2", color: "#7F1D1D" },
    Resting:   { bg: "#F5F3FF", color: "#3C3489" },
};

export default function SeasonsPage() {
    const [data,           setData]           = useState<any>(null);
    const [loading,        setLoading]        = useState(true);
    const [selectedSeason, setSelectedSeason] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        const url = selectedSeason
            ? `/api/seasons?season=${encodeURIComponent(selectedSeason)}`
            : "/api/seasons";
        fetch(url).then((r) => r.json()).then((d) => {
            setData(d);
            if (!selectedSeason && d.allSeasons?.length > 0) setSelectedSeason(d.allSeasons[0]);
            setLoading(false);
        });
    }, [selectedSeason]);

    const seasons = data?.allSeasons ?? [];

    return (
        <div className="p-8 max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)", letterSpacing: "-0.04em" }}>
                        Seasons
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                        View crops, activities and performance by growing season
                    </p>
                </div>
                <Link href="/dashboard/seasons/compare"
                      className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-bold transition-all"
                      style={{
                          background: "var(--bg-card)",
                          color:      "var(--text-secondary)",
                          border:     "1px solid var(--border)",
                      }}>
                    <ArrowLeftRight size={14} /> Compare seasons
                </Link>
            </div>

            {/* Season selector pills */}
            <div className="flex gap-2 mb-8 flex-wrap">
                {seasons.map((s: string) => (
                    <button key={s} onClick={() => setSelectedSeason(s)}
                            className="h-10 px-5 rounded-xl text-sm font-bold transition-all"
                            style={{
                                background: selectedSeason === s ? "var(--farm-green)" : "var(--bg-card)",
                                color:      selectedSeason === s ? "white"             : "var(--text-secondary)",
                                border:     `1.5px solid ${selectedSeason === s ? "transparent" : "var(--border)"}`,
                            }}>
                        {s}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={24} className="animate-spin" style={{ color: "var(--farm-green)" }} />
                </div>
            ) : !selectedSeason ? (
                <div className="rounded-2xl p-16 text-center"
                     style={{ background: "var(--bg-card)", border: "1.5px dashed var(--border)" }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                         style={{ background: "var(--bg-subtle)" }}>
                        <CalendarDays size={24} style={{ color: "var(--text-muted)" }} />
                    </div>
                    <p className="text-lg font-black mb-1" style={{ color: "var(--text-primary)" }}>No seasons yet</p>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                        Add crops with a season name to start tracking seasons
                    </p>
                </div>
            ) : (
                <>
                    {/* Summary cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {[
                            { label: "Crops planted",  value: String(data?.totals?.crops      ?? 0),                         color: "var(--farm-green)"  },
                            { label: "Total area",     value: `${(data?.totals?.area ?? 0).toFixed(1)} ha`,                  color: "#2563EB"            },
                            { label: "Activities",     value: String(data?.totals?.activities ?? 0),                         color: "var(--text-primary)" },
                            { label: "Activity cost",  value: `MWK ${fmt(data?.totals?.cost   ?? 0)}`,                       color: "#DC2626"            },
                        ].map(({ label, value, color }) => (
                            <div key={label} className="rounded-2xl p-5"
                                 style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
                                <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                                    {label}
                                </p>
                                <p className="text-2xl font-black" style={{ color }}>{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Crop type breakdown */}
                    {(data?.byType ?? []).length > 0 && (
                        <div className="rounded-2xl p-6 mb-6"
                             style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                            <p className="text-[10px] font-black uppercase tracking-widest mb-4"
                               style={{ color: "var(--text-muted)" }}>
                                Crops this season
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {data.byType.map((t: any) => {
                                    const activeCount    = (t.statuses ?? []).filter((s: string) => s === "Active").length;
                                    const harvestedCount = (t.statuses ?? []).filter((s: string) => s === "Harvested").length;
                                    return (
                                        <div key={t.name} className="rounded-xl p-4"
                                             style={{ background: "var(--farm-pale)", border: "1px solid #86efac" }}>
                                            <div className="flex items-center gap-2 mb-3">
                                                <Leaf size={17} style={{ color: "var(--farm-green)" }} />
                                                <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                                                    {t.name}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 mb-2">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-wide mb-0.5"
                                                       style={{ color: "var(--text-muted)" }}>
                                                        Area
                                                    </p>
                                                    <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                                                        {t.totalArea.toFixed(1)} ha
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-wide mb-0.5"
                                                       style={{ color: "var(--text-muted)" }}>
                                                        Cost
                                                    </p>
                                                    <p className="text-sm font-extrabold" style={{ color: "#DC2626" }}>
                                                        MWK {fmt(t.totalCost)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 flex-wrap">
                                                {activeCount > 0 && (
                                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                                                          style={{ background: "#ECFDF5", color: "#166534" }}>
                                                        {activeCount} active
                                                    </span>
                                                )}
                                                {harvestedCount > 0 && (
                                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                                                          style={{ background: "#EFF6FF", color: "#1E3A8A" }}>
                                                        {harvestedCount} harvested
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Crop records */}
                    {(data?.cropFields ?? []).length > 0 && (
                        <div className="rounded-2xl overflow-hidden mb-6"
                             style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                            <div className="px-5 py-4"
                                 style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                                <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                                    Crop records
                                </p>
                            </div>
                            <div>
                                {data.cropFields.map((cf: any) => {
                                    const badge = STATUS_BADGE[cf.status] ?? STATUS_BADGE["Active"];
                                    return (
                                        <div key={cf.id}
                                             className="flex items-center justify-between px-5 py-3.5 transition-colors"
                                             style={{ borderBottom: "1px solid var(--border)" }}
                                             onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
                                             onMouseOut={(e)  => (e.currentTarget.style.background = "transparent")}>
                                            <div className="flex items-center gap-3">
                                                <Leaf size={17} style={{ color: "var(--farm-green)" }} />
                                                <div>
                                                    <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                                                        {cf.cropTypeName}
                                                    </p>
                                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                        {cf.variety} · {cf.fieldName} · {cf.areaPlanted} ha
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full"
                                                      style={{ background: badge.bg, color: badge.color }}>
                                                    {cf.status}
                                                </span>
                                                <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                                                    MWK {fmt(cf.totalCost)}
                                                </p>
                                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                    {cf.activityCount} activities
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Season activities */}
                    {(data?.activities ?? []).length > 0 && (
                        <div className="rounded-2xl overflow-hidden"
                             style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                            <div className="px-5 py-4"
                                 style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                                <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                                    Season activities
                                </p>
                            </div>
                            <div>
                                {data.activities.slice(0, 10).map((a: any) => {
                                    const ActivityIcon = ACTIVITY_ICONS[a.activityType] ?? ClipboardList;
                                    return (
                                    <div key={a.id}
                                         className="flex items-center justify-between px-5 py-3 transition-colors"
                                         style={{ borderBottom: "1px solid var(--border)" }}
                                         onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
                                         onMouseOut={(e)  => (e.currentTarget.style.background = "transparent")}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                                                 style={{ background: "var(--bg-subtle)" }}>
                                                <ActivityIcon size={16} style={{ color: "var(--farm-green)" }} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                                                    {a.activityType}
                                                </p>
                                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                    {a.fieldName}{a.cropName ? ` · ${a.cropName}` : ""}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                                                MWK {fmt(a.totalCost)}
                                            </p>
                                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                {formatDate(a.date)}
                                            </p>
                                        </div>
                                    </div>
                                );})}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

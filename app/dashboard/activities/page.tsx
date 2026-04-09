"use client";

import { useEffect, useState } from "react";
import {
    Plus, Loader2, Trash2, ChevronDown, ChevronUp,
    Filter, X, BarChart2,
} from "lucide-react";
import Link from "next/link";

const activityIcons: Record<string, string> = {
    Planting: "🌱", Irrigation: "💧", Spraying: "🧴", Weeding: "🌿",
    Harvesting: "🌾", Fertilizing: "🪣", "Soil Preparation": "🚜",
    "Pest Control": "🐛", Other: "📋",
};

const ACTIVITY_TYPES = [
    "Planting", "Irrigation", "Spraying", "Weeding",
    "Harvesting", "Fertilizing", "Soil Preparation", "Pest Control", "Other",
];

function fmt(n: number) {
    return new Intl.NumberFormat("en-MW").format(Math.round(n));
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
    });
}

export default function ActivitiesPage() {
    const [data, setData] = useState<any>(null);
    const [fields, setFields] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [showStats, setShowStats] = useState(false);

    // Filters
    const [typeFilter, setTypeFilter] = useState("All");
    const [fieldFilter, setFieldFilter] = useState("All");
    const [seasonFilter, setSeasonFilter] = useState("All");

    const load = () => {
        setLoading(true);
        Promise.all([
            fetch("/api/activities").then((r) => r.json()),
            fetch("/api/fields").then((r) => r.json()),
        ]).then(([a, f]) => {
            setData(a);
            setFields(f);
            setLoading(false);
        });
    };

    useEffect(() => { load(); }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this activity and all its records?")) return;
        setDeletingId(id);
        await fetch(`/api/activities/${id}`, { method: "DELETE" });
        setDeletingId(null);
        load();
    };

    const clearFilters = () => {
        setTypeFilter("All");
        setFieldFilter("All");
        setSeasonFilter("All");
    };

    const activeFilterCount = [typeFilter, fieldFilter, seasonFilter].filter((f) => f !== "All").length;

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 size={24} className="animate-spin text-slate-400" />
            </div>
        );
    }

    const activities: any[] = data?.activities ?? [];
    const allSeasons: string[] = data?.allSeasons ?? [];

    const filtered = activities.filter((a) => {
        if (typeFilter !== "All" && a.activityType !== typeFilter) return false;
        if (fieldFilter !== "All" && a.fieldId !== fieldFilter) return false;
        if (seasonFilter !== "All" && a.season !== seasonFilter) return false;
        return true;
    });

    const totalCost = filtered.reduce((s, a) => s + a.totalCost, 0);
    const totalLabour = filtered.reduce((s, a) => s + a.totalLabourCost, 0);
    const totalInputs = filtered.reduce((s, a) => s + a.totalInputCost, 0);
    const totalOther = filtered.reduce((s, a) => s + a.totalOtherCost, 0);

    return (
        <div className="p-8 max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-medium text-slate-900">Activities</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {filtered.length} activit{filtered.length !== 1 ? "ies" : "y"}
                        {activeFilterCount > 0 ? " (filtered)" : ""} &mdash; MWK {fmt(totalCost)} total
                    </p>
                </div>
                <Link
                    href="/dashboard/activities/new"
                    className="flex items-center gap-2 h-10 px-4 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
                >
                    <Plus size={16} /> Log activity
                </Link>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Total cost", value: `MWK ${fmt(totalCost)}` },
                    { label: "Labour cost", value: `MWK ${fmt(totalLabour)}` },
                    { label: "Input cost", value: `MWK ${fmt(totalInputs)}` },
                    { label: "Other costs", value: `MWK ${fmt(totalOther)}` },
                ].map(({ label, value }) => (
                    <div key={label} className="bg-white border border-slate-200 rounded-2xl p-5">
                        <p className="text-xs uppercase tracking-wide text-slate-400 font-medium mb-2">{label}</p>
                        <p className="text-xl font-medium text-slate-900">{value}</p>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium border transition-colors ${
                        showFilters || activeFilterCount > 0
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                >
                    <Filter size={14} /> Filters
                    {activeFilterCount > 0 && (
                        <span className="w-4 h-4 bg-white text-slate-900 rounded-full text-xs flex items-center justify-center font-medium">
              {activeFilterCount}
            </span>
                    )}
                </button>

                <button
                    onClick={() => setShowStats(!showStats)}
                    className={`flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium border transition-colors ${
                        showStats
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                >
                    <BarChart2 size={14} /> Analytics
                </button>

                {activeFilterCount > 0 && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors"
                    >
                        <X size={12} /> Clear filters
                    </button>
                )}
            </div>

            {/* Filters panel */}
            {showFilters && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-5 grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                        <label className="text-xs text-slate-400 font-medium mb-2 block uppercase tracking-wide">Activity type</label>
                        <div className="flex flex-wrap gap-2">
                            {["All", ...ACTIVITY_TYPES].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTypeFilter(t)}
                                    className={`h-7 px-3 rounded-lg text-xs font-medium transition-colors ${
                                        typeFilter === t
                                            ? "bg-slate-900 text-white"
                                            : "border border-slate-200 text-slate-500 hover:border-slate-300"
                                    }`}
                                >
                                    {t === "All" ? t : `${activityIcons[t] ?? ""} ${t}`}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-slate-400 font-medium mb-2 block uppercase tracking-wide">Field</label>
                        <div className="flex flex-wrap gap-2">
                            {[{ id: "All", name: "All" }, ...fields].map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => setFieldFilter(f.id)}
                                    className={`h-7 px-3 rounded-lg text-xs font-medium transition-colors ${
                                        fieldFilter === f.id
                                            ? "bg-slate-900 text-white"
                                            : "border border-slate-200 text-slate-500 hover:border-slate-300"
                                    }`}
                                >
                                    {f.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-slate-400 font-medium mb-2 block uppercase tracking-wide">Season</label>
                        <div className="flex flex-wrap gap-2">
                            {["All", ...allSeasons].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setSeasonFilter(s)}
                                    className={`h-7 px-3 rounded-lg text-xs font-medium transition-colors ${
                                        seasonFilter === s
                                            ? "bg-slate-900 text-white"
                                            : "border border-slate-200 text-slate-500 hover:border-slate-300"
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Analytics panel */}
            {showStats && data && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">

                    {/* By type */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                        <h3 className="text-sm font-medium text-slate-900 mb-4">By activity type</h3>
                        <div className="flex flex-col gap-3">
                            {data.byType.map((t: any) => (
                                <div key={t.type}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-600">{activityIcons[t.type]} {t.type}</span>
                                        <span className="text-slate-400">{t.count}x &mdash; MWK {fmt(t.totalCost)}</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-slate-900 rounded-full"
                                            style={{ width: `${(t.count / data.byType[0].count) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* By field */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                        <h3 className="text-sm font-medium text-slate-900 mb-4">By field</h3>
                        <div className="flex flex-col gap-3">
                            {data.byField.map((f: any) => (
                                <div key={f.name}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-600">{f.name}</span>
                                        <span className="text-slate-400">{f.count}x &mdash; MWK {fmt(f.totalCost)}</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 rounded-full"
                                            style={{ width: `${(f.count / data.byField[0].count) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* By season */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                        <h3 className="text-sm font-medium text-slate-900 mb-4">By season</h3>
                        {data.bySeason.length === 0 ? (
                            <p className="text-xs text-slate-400">No season data yet</p>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {data.bySeason.map((s: any, i: number) => (
                                    <div key={`${s.season}-${i}`}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-600">{s.season}</span>
                                            <span className="text-slate-400">{s.count}x &mdash; MWK {fmt(s.totalCost)}</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-amber-500 rounded-full"
                                                style={{ width: `${(s.count / data.bySeason[0].count) * 100}%` }}
                                            />
                                        </div>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {s.types.map((t: string) => (
                                                <span key={t} className="text-xs text-slate-400">{activityIcons[t]}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Activities list */}
            {filtered.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
                    <p className="text-4xl mb-4">📋</p>
                    <p className="text-slate-900 font-medium mb-1">
                        {activeFilterCount > 0 ? "No activities match these filters" : "No activities yet"}
                    </p>
                    <p className="text-slate-400 text-sm mb-6">
                        {activeFilterCount > 0
                            ? "Try adjusting or clearing your filters"
                            : "Log farm activities to track labour, inputs and costs"}
                    </p>
                    {activeFilterCount > 0 ? (
                        <button
                            onClick={clearFilters}
                            className="inline-flex items-center gap-2 h-10 px-5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            Clear filters
                        </button>
                    ) : (
                        <Link
                            href="/dashboard/activities/new"
                            className="inline-flex items-center gap-2 h-10 px-5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
                        >
                            <Plus size={16} /> Log activity
                        </Link>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {filtered.map((activity) => {
                        const expanded = expandedId === activity.id;
                        return (
                            <div key={activity.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-300 transition-colors">
                                <div
                                    className="flex items-center gap-4 p-5 cursor-pointer"
                                    onClick={() => setExpandedId(expanded ? null : activity.id)}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg flex-shrink-0">
                                        {activityIcons[activity.activityType] ?? "📋"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-medium text-slate-900">
                                                {activity.activityType} &mdash; {activity.fieldName}
                                            </p>
                                            {activity.cropName && (
                                                <span className="text-xs bg-green-50 text-green-800 px-2 py-0.5 rounded-lg font-medium">
                          {activity.cropName} {activity.cropVariety ? `(${activity.cropVariety})` : ""}
                        </span>
                                            )}
                                            {activity.season && (
                                                <span className="text-xs bg-amber-50 text-amber-800 px-2 py-0.5 rounded-lg font-medium">
                          {activity.season}
                        </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                                            <p className="text-xs text-slate-400">{formatDate(activity.date)}</p>
                                            {activity.responsibleEmployee && (
                                                <p className="text-xs text-slate-400">👤 {activity.responsibleEmployee.name}</p>
                                            )}
                                            {activity.labourRecords.length > 0 && (
                                                <p className="text-xs text-slate-400">👷 {activity.labourRecords.length} worker{activity.labourRecords.length !== 1 ? "s" : ""}</p>
                                            )}
                                            {activity.inputs.length > 0 && (
                                                <p className="text-xs text-slate-400">📦 {activity.inputs.length} input{activity.inputs.length !== 1 ? "s" : ""}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        {activity.totalCost > 0 && (
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-slate-900">MWK {fmt(activity.totalCost)}</p>
                                                <p className="text-xs text-slate-400">total cost</p>
                                            </div>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(activity.id); }}
                                            disabled={deletingId === activity.id}
                                            className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                                        >
                                            {deletingId === activity.id
                                                ? <Loader2 size={15} className="animate-spin" />
                                                : <Trash2 size={15} />}
                                        </button>
                                        {expanded
                                            ? <ChevronUp size={15} className="text-slate-400" />
                                            : <ChevronDown size={15} className="text-slate-400" />}
                                    </div>
                                </div>

                                {/* Expanded detail */}
                                {expanded && (
                                    <div className="border-t border-slate-100 p-5 bg-slate-50">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                            {/* Labour */}
                                            <div>
                                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
                                                    Labour &mdash; MWK {fmt(activity.totalLabourCost)}
                                                </p>
                                                {activity.labourRecords.length === 0 ? (
                                                    <p className="text-xs text-slate-400">No labour recorded</p>
                                                ) : (
                                                    <div className="flex flex-col gap-2">
                                                        {activity.labourRecords.map((l: any) => (
                                                            <div key={l.id} className="bg-white rounded-xl p-3 border border-slate-100">
                                                                <p className="text-sm font-medium text-slate-900">{l.employeeName}</p>
                                                                <p className="text-xs text-slate-400 mt-0.5">
                                                                    {l.daysWorked > 0 && `${l.daysWorked} days`}
                                                                    {l.hoursWorked > 0 && ` ${l.hoursWorked} hrs`}
                                                                </p>
                                                                <p className="text-xs font-medium text-slate-700 mt-1">MWK {fmt(l.totalCost)}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Inputs */}
                                            <div>
                                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
                                                    Inputs &mdash; MWK {fmt(activity.totalInputCost)}
                                                </p>
                                                {activity.inputs.length === 0 ? (
                                                    <p className="text-xs text-slate-400">No inputs recorded</p>
                                                ) : (
                                                    <div className="flex flex-col gap-2">
                                                        {activity.inputs.map((i: any) => (
                                                            <div key={i.id} className="bg-white rounded-xl p-3 border border-slate-100">
                                                                <p className="text-sm font-medium text-slate-900">{i.inputName}</p>
                                                                <p className="text-xs text-slate-400 mt-0.5">{i.quantity} {i.unit} @ MWK {fmt(i.unitCost)}</p>
                                                                <p className="text-xs font-medium text-slate-700 mt-1">MWK {fmt(i.totalCost)}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Other costs */}
                                            <div>
                                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
                                                    Other &mdash; MWK {fmt(activity.totalOtherCost)}
                                                </p>
                                                {activity.otherCosts.length === 0 ? (
                                                    <p className="text-xs text-slate-400">No other costs recorded</p>
                                                ) : (
                                                    <div className="flex flex-col gap-2">
                                                        {activity.otherCosts.map((o: any) => (
                                                            <div key={o.id} className="bg-white rounded-xl p-3 border border-slate-100">
                                                                <p className="text-sm font-medium text-slate-900">{o.description}</p>
                                                                <p className="text-xs font-medium text-slate-700 mt-1">MWK {fmt(o.amount)}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {activity.notes && (
                                            <div className="mt-4 pt-4 border-t border-slate-200">
                                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Notes</p>
                                                <p className="text-sm text-slate-600">{activity.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
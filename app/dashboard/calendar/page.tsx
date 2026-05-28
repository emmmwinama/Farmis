"use client";

import { useEffect, useState } from "react";
import {
    Loader2,
    ChevronLeft,
    ChevronRight,
    CalendarRange,
} from "lucide-react";
import Link from "next/link";

const CROP_COLORS = [
    { bg: "#EBF5EC", border: "#86EFAC", text: "#14532D", dot: "#16A34A" },
    { bg: "#FEF3C7", border: "#FCD34D", text: "#78350F", dot: "#D97706" },
    { bg: "#EFF6FF", border: "#BFDBFE", text: "#1E3A8A", dot: "#2563EB" },
    { bg: "#FAF5FF", border: "#E9D5FF", text: "#581C87", dot: "#9333EA" },
    { bg: "#FFF1F2", border: "#FECDD3", text: "#9F1239", dot: "#E11D48" },
    { bg: "#F0FDFA", border: "#99F6E4", text: "#134E4A", dot: "#0D9488" },
];

function fmt(d: string) {
    return new Date(d).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
    });
}

function daysIn(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function firstDayOf(year: number, month: number) {
    return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
    const [crops, setCrops] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth());
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<"month" | "timeline">("month");

    useEffect(() => {
        fetch("/api/crops")
            .then((r) => r.json())
            .then((d) => {
                setCrops(d);
                setLoading(false);
            });
    }, []);

    // Assign colors to unique crop types
    const cropTypeColors: Record<string, (typeof CROP_COLORS)[0]> = {};
    const uniqueCropTypes = [
        ...new Set(crops.map((c) => c.cropTypeName)),
    ] as string[];

    uniqueCropTypes.forEach((name, i) => {
        cropTypeColors[name] = CROP_COLORS[i % CROP_COLORS.length];
    });

    const prevMonth = () => {
        if (month === 0) {
            setMonth(11);
            setYear((y) => y - 1);
        } else {
            setMonth((m) => m - 1);
        }
    };

    const nextMonth = () => {
        if (month === 11) {
            setMonth(0);
            setYear((y) => y + 1);
        } else {
            setMonth((m) => m + 1);
        }
    };

    const monthName = new Date(year, month).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
    });

    // Get crops active/overlapping a given day
    const getCropsForDay = (day: number) => {
        const date = new Date(year, month, day);

        return crops.filter((c) => {
            const plant = new Date(c.plantingDate);
            const harvest = new Date(c.expectedHarvestDate);

            return date >= plant && date <= harvest;
        });
    };

    // Events for a day
    const getEventsForDay = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(
            2,
            "0"
        )}-${String(day).padStart(2, "0")}`;

        return crops
            .filter((c) => {
                const plantStr = c.plantingDate.split("T")[0];
                const harvestStr = c.expectedHarvestDate.split("T")[0];

                return plantStr === dateStr || harvestStr === dateStr;
            })
            .map((c) => ({
                crop: c,
                type:
                    c.plantingDate.split("T")[0] === dateStr
                        ? "planting"
                        : "harvest",
            }));
    };

    const days = daysIn(year, month);
    const firstDay = firstDayOf(year, month);

    const today = new Date();

    const isCurrentMonth =
        today.getFullYear() === year && today.getMonth() === month;

    const selectedCrops = selectedDay
        ? getCropsForDay(selectedDay)
        : [];

    const selectedEvents = selectedDay
        ? getEventsForDay(selectedDay)
        : [];

    const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Timeline: sort crops by planting date
    const sortedCrops = [...crops].sort(
        (a, b) =>
            new Date(a.plantingDate).getTime() -
            new Date(b.plantingDate).getTime()
    );

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in">
            <div className="page-header flex items-start justify-between">
                <div>
                    <h1 className="page-title">Planting Calendar</h1>
                    <p className="page-subtitle">
                        Visual overview of all crop planting and harvest schedules
                    </p>
                </div>

                <div className="flex gap-2">
                    {[
                        { key: "month", label: "Month view" },
                        { key: "timeline", label: "Timeline" },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() =>
                                setViewMode(key as "month" | "timeline")
                            }
                            className={`btn-secondary h-9 px-4 text-xs ${
                                viewMode === key ? "ring-2" : ""
                            }`}
                            style={
                                viewMode === key
                                    ? { borderColor: "var(--farm-green)" }
                                    : {}
                            }
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2
                        size={24}
                        className="animate-spin"
                        style={{ color: "var(--farm-green)" }}
                    />
                </div>
            ) : crops.length === 0 ? (
                <div
                    className="rounded-3xl p-16 text-center"
                    style={{
                        background: "var(--bg-card)",
                        border: "1.5px dashed var(--border)",
                    }}
                >
                    <div className="empty-state">
                        <div className="empty-icon">
                            <CalendarRange
                                size={28}
                                style={{ color: "var(--text-muted)" }}
                            />
                        </div>

                        <p className="section-title mb-2">
                            No crops to display
                        </p>

                        <p className="section-subtitle mb-6">
                            Add crops to see them on the calendar
                        </p>

                        <Link
                            href="/dashboard/crops"
                            className="btn-primary"
                        >
                            Add crops
                        </Link>
                    </div>
                </div>
            ) : viewMode === "month" ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Calendar */}
                    <div
                        className="lg:col-span-2 rounded-2xl overflow-hidden"
                        style={{
                            background: "var(--bg-card)",
                            border: "1px solid var(--border)",
                            boxShadow: "0 1px 3px rgba(28,25,23,0.06)",
                        }}
                    >
                        {/* Nav */}
                        <div
                            className="flex items-center justify-between px-5 py-4 border-b"
                            style={{
                                borderColor: "var(--border)",
                                background: "var(--bg-subtle)",
                            }}
                        >
                            <button
                                onClick={prevMonth}
                                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                                style={{
                                    color: "var(--text-secondary)",
                                    background: "var(--bg-card)",
                                    border: "1px solid var(--border)",
                                }}
                            >
                                <ChevronLeft size={15} />
                            </button>

                            <p
                                className="text-base font-extrabold"
                                style={{ color: "var(--text-primary)" }}
                            >
                                {monthName}
                            </p>

                            <button
                                onClick={nextMonth}
                                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                                style={{
                                    color: "var(--text-secondary)",
                                    background: "var(--bg-card)",
                                    border: "1px solid var(--border)",
                                }}
                            >
                                <ChevronRight size={15} />
                            </button>
                        </div>

                        {/* Day headers */}
                        <div
                            className="grid grid-cols-7 border-b"
                            style={{ borderColor: "var(--border)" }}
                        >
                            {DAYS.map((d) => (
                                <div
                                    key={d}
                                    className="py-2.5 text-center"
                                >
                                    <p
                                        className="text-[10px] font-extrabold uppercase tracking-widest"
                                        style={{ color: "var(--text-muted)" }}
                                    >
                                        {d}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7">
                            {Array.from({ length: firstDay }).map((_, i) => (
                                <div
                                    key={`empty-${i}`}
                                    className="h-20 border-r border-b"
                                    style={{
                                        borderColor: "var(--border)",
                                        background: "var(--bg-subtle)",
                                    }}
                                />
                            ))}

                            {Array.from({ length: days }).map((_, i) => {
                                const day = i + 1;

                                const isToday =
                                    isCurrentMonth &&
                                    day === today.getDate();

                                const dayEvents = getEventsForDay(day);
                                const dayActiveCrops = getCropsForDay(day);

                                const isSelected = selectedDay === day;

                                return (
                                    <div
                                        key={day}
                                        onClick={() =>
                                            setSelectedDay(
                                                isSelected ? null : day
                                            )
                                        }
                                        className="h-20 border-r border-b p-1.5 cursor-pointer transition-all"
                                        style={{
                                            borderColor: "var(--border)",
                                            background: isSelected
                                                ? "var(--farm-pale)"
                                                : isToday
                                                    ? "#F0FDF4"
                                                    : "var(--bg-card)",
                                        }}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                      <span
                          className="text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full"
                          style={{
                              background: isToday
                                  ? "var(--farm-green)"
                                  : "transparent",
                              color: isToday
                                  ? "white"
                                  : isSelected
                                      ? "var(--farm-green)"
                                      : "var(--text-secondary)",
                          }}
                      >
                        {day}
                      </span>

                                            {dayEvents.length > 0 && (
                                                <span
                                                    className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                                                    style={{
                                                        background:
                                                            dayEvents[0].type ===
                                                            "planting"
                                                                ? "#EBF5EC"
                                                                : "#FEF3C7",
                                                        color:
                                                            dayEvents[0].type ===
                                                            "planting"
                                                                ? "#14532D"
                                                                : "#78350F",
                                                    }}
                                                >
                          {dayEvents[0].type ===
                          "planting"
                              ? "🌱"
                              : "🌾"}
                        </span>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-0.5">
                                            {dayActiveCrops
                                                .slice(0, 2)
                                                .map((c) => {
                                                    const col =
                                                        cropTypeColors[
                                                            c.cropTypeName
                                                            ];

                                                    return (
                                                        <div
                                                            key={c.id}
                                                            className="rounded px-1 py-0.5 text-[9px] font-bold truncate"
                                                            style={{
                                                                background: col.bg,
                                                                color: col.text,
                                                                border: `1px solid ${col.border}`,
                                                            }}
                                                        >
                                                            {c.cropTypeName}
                                                        </div>
                                                    );
                                                })}

                                            {dayActiveCrops.length > 2 && (
                                                <p
                                                    className="text-[9px] font-bold px-1"
                                                    style={{
                                                        color: "var(--text-muted)",
                                                    }}
                                                >
                                                    +{dayActiveCrops.length - 2} more
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="flex flex-col gap-4">
                        {/* Legend */}
                        <div
                            className="rounded-2xl p-5"
                            style={{
                                background: "var(--bg-card)",
                                border: "1px solid var(--border)",
                            }}
                        >
                            <p
                                className="text-xs font-extrabold uppercase tracking-widest mb-3"
                                style={{ color: "var(--text-muted)" }}
                            >
                                Crop legend
                            </p>

                            <div className="flex flex-col gap-2">
                                {uniqueCropTypes.map((name) => {
                                    const col = cropTypeColors[name];

                                    return (
                                        <div
                                            key={name}
                                            className="flex items-center gap-2"
                                        >
                                            <div
                                                className="w-3 h-3 rounded-full flex-shrink-0"
                                                style={{ background: col.dot }}
                                            />

                                            <span
                                                className="text-xs font-semibold"
                                                style={{
                                                    color:
                                                        "var(--text-secondary)",
                                                }}
                                            >
                        {name}
                      </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Selected day */}
                        {selectedDay && (
                            <div
                                className="rounded-2xl p-5 animate-slide-up"
                                style={{
                                    background: "var(--bg-card)",
                                    border: "1px solid var(--border)",
                                }}
                            >
                                <p
                                    className="text-xs font-extrabold uppercase tracking-widest mb-3"
                                    style={{ color: "var(--text-muted)" }}
                                >
                                    {new Date(
                                        year,
                                        month,
                                        selectedDay
                                    ).toLocaleDateString("en-GB", {
                                        day: "numeric",
                                        month: "long",
                                    })}
                                </p>

                                {selectedEvents.length > 0 && (
                                    <div className="mb-4">
                                        <p
                                            className="text-xs font-bold mb-2"
                                            style={{
                                                color:
                                                    "var(--text-secondary)",
                                            }}
                                        >
                                            Events
                                        </p>

                                        {selectedEvents.map((e, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-2 py-2 text-xs rounded-xl px-3 mb-2"
                                                style={{
                                                    background:
                                                        e.type === "planting"
                                                            ? "#EBF5EC"
                                                            : "#FEF3C7",
                                                }}
                                            >
                        <span>
                          {e.type === "planting"
                              ? "🌱"
                              : "🌾"}
                        </span>

                                                <span
                                                    className="font-bold"
                                                    style={{
                                                        color:
                                                            e.type === "planting"
                                                                ? "#14532D"
                                                                : "#78350F",
                                                    }}
                                                >
                          {e.type === "planting"
                              ? "Planting"
                              : "Expected harvest"}
                                                    : {e.crop.cropTypeName}
                        </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {selectedCrops.length > 0 ? (
                                    <div>
                                        <p
                                            className="text-xs font-bold mb-2"
                                            style={{
                                                color:
                                                    "var(--text-secondary)",
                                            }}
                                        >
                                            Active crops (
                                            {selectedCrops.length})
                                        </p>

                                        {selectedCrops.map((c) => {
                                            const col =
                                                cropTypeColors[c.cropTypeName];

                                            const harvestDate = new Date(
                                                c.expectedHarvestDate
                                            );

                                            const daysLeft = Math.ceil(
                                                (harvestDate.getTime() -
                                                    new Date(
                                                        year,
                                                        month,
                                                        selectedDay
                                                    ).getTime()) /
                                                86400000
                                            );

                                            return (
                                                <Link
                                                    key={c.id}
                                                    href={`/dashboard/yields?cropFieldId=${c.id}`}
                                                    className="block rounded-xl p-3 mb-2 transition-all hover:shadow-sm"
                                                    style={{
                                                        background: col.bg,
                                                        border: `1px solid ${col.border}`,
                                                    }}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p
                                                            className="text-xs font-extrabold"
                                                            style={{
                                                                color: col.text,
                                                            }}
                                                        >
                                                            {c.cropTypeName}
                                                        </p>

                                                        <span
                                                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                            style={{
                                                                background:
                                                                    "rgba(255,255,255,0.7)",
                                                                color: col.text,
                                                            }}
                                                        >
                              {c.status}
                            </span>
                                                    </div>

                                                    <p
                                                        className="text-[10px]"
                                                        style={{
                                                            color: col.text,
                                                            opacity: 0.7,
                                                        }}
                                                    >
                                                        {c.variety} · {c.fieldName}
                                                    </p>

                                                    <p
                                                        className="text-[10px] font-semibold mt-1"
                                                        style={{
                                                            color: col.text,
                                                            opacity: 0.8,
                                                        }}
                                                    >
                                                        Harvest{" "}
                                                        {daysLeft > 0
                                                            ? `in ${daysLeft} days`
                                                            : daysLeft === 0
                                                                ? "today"
                                                                : `${Math.abs(
                                                                    daysLeft
                                                                )} days ago`}
                                                    </p>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p
                                        className="text-xs"
                                        style={{
                                            color: "var(--text-muted)",
                                        }}
                                    >
                                        No active crops on this day
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Upcoming events */}
                        <div
                            className="rounded-2xl p-5"
                            style={{
                                background: "var(--bg-card)",
                                border: "1px solid var(--border)",
                            }}
                        >
                            <p
                                className="text-xs font-extrabold uppercase tracking-widest mb-3"
                                style={{ color: "var(--text-muted)" }}
                            >
                                Upcoming events
                            </p>

                            {crops
                                .flatMap((c) => [
                                    {
                                        date: new Date(c.plantingDate),
                                        type: "planting",
                                        crop: c,
                                    },
                                    {
                                        date: new Date(
                                            c.expectedHarvestDate
                                        ),
                                        type: "harvest",
                                        crop: c,
                                    },
                                ])
                                .filter((e) => e.date >= today)
                                .sort(
                                    (a, b) =>
                                        a.date.getTime() -
                                        b.date.getTime()
                                )
                                .slice(0, 5)
                                .map((event, i) => {
                                    const daysUntil = Math.ceil(
                                        (event.date.getTime() -
                                            today.getTime()) /
                                        86400000
                                    );

                                    return (
                                        <div
                                            key={i}
                                            className="flex items-center gap-3 py-2.5 border-b last:border-b-0"
                                            style={{
                                                borderColor: "var(--border)",
                                            }}
                                        >
                      <span className="text-base">
                        {event.type === "planting"
                            ? "🌱"
                            : "🌾"}
                      </span>

                                            <div className="flex-1 min-w-0">
                                                <p
                                                    className="text-xs font-bold truncate"
                                                    style={{
                                                        color:
                                                            "var(--text-primary)",
                                                    }}
                                                >
                                                    {event.type === "planting"
                                                        ? "Plant"
                                                        : "Harvest"}
                                                    : {event.crop.cropTypeName}
                                                </p>

                                                <p
                                                    className="text-[10px]"
                                                    style={{
                                                        color:
                                                            "var(--text-muted)",
                                                    }}
                                                >
                                                    {event.crop.fieldName} ·{" "}
                                                    {fmt(
                                                        event.date.toISOString()
                                                    )}
                                                </p>
                                            </div>

                                            <span
                                                className={`badge ${
                                                    daysUntil <= 7
                                                        ? "badge-amber"
                                                        : "badge-warm"
                                                }`}
                                            >
                        {daysUntil === 0
                            ? "Today"
                            : `${daysUntil}d`}
                      </span>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>
            ) : (
                /* Timeline view */
                <div
                    className="rounded-2xl overflow-hidden"
                    style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        boxShadow: "0 1px 3px rgba(28,25,23,0.06)",
                    }}
                >
                    <div
                        className="px-5 py-4 border-b"
                        style={{
                            borderColor: "var(--border)",
                            background: "var(--bg-subtle)",
                        }}
                    >
                        <p
                            className="text-sm font-extrabold"
                            style={{ color: "var(--text-primary)" }}
                        >
                            Season Timeline
                        </p>

                        <p
                            className="text-xs"
                            style={{ color: "var(--text-muted)" }}
                        >
                            All crops sorted by planting date
                        </p>
                    </div>

                    {/* FIXED divideColor issue */}
                    <div
                        className="divide-y"
                        style={{
                            borderColor: "var(--border)",
                        }}
                    >
                        {sortedCrops.map((crop) => {
                            const plant = new Date(
                                crop.plantingDate
                            );

                            const harvest = new Date(
                                crop.expectedHarvestDate
                            );

                            const durationDays = Math.ceil(
                                (harvest.getTime() -
                                    plant.getTime()) /
                                86400000
                            );

                            const col =
                                cropTypeColors[crop.cropTypeName];

                            const now = new Date();

                            const daysFromPlant = Math.ceil(
                                (now.getTime() - plant.getTime()) /
                                86400000
                            );

                            const progress = Math.max(
                                0,
                                Math.min(
                                    100,
                                    (daysFromPlant / durationDays) *
                                    100
                                )
                            );

                            return (
                                <div
                                    key={crop.id}
                                    className="px-5 py-4 hover:bg-slate-50 transition-all border-b last:border-b-0"
                                    style={{
                                        borderColor: "var(--border)",
                                    }}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-3 h-3 rounded-full flex-shrink-0"
                                                style={{
                                                    background: col.dot,
                                                }}
                                            />

                                            <div>
                                                <p
                                                    className="text-sm font-bold"
                                                    style={{
                                                        color:
                                                            "var(--text-primary)",
                                                    }}
                                                >
                                                    {crop.cropTypeName}

                                                    <span
                                                        className="ml-2 text-xs font-semibold"
                                                        style={{
                                                            color:
                                                                "var(--text-muted)",
                                                        }}
                                                    >
                            {crop.variety}
                          </span>
                                                </p>

                                                <p
                                                    className="text-xs"
                                                    style={{
                                                        color:
                                                            "var(--text-muted)",
                                                    }}
                                                >
                                                    {crop.fieldName} ·{" "}
                                                    {crop.season}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                      <span
                          className={`badge ${
                              crop.status === "Active"
                                  ? "badge-green"
                                  : crop.status ===
                                  "Harvested"
                                      ? "badge-blue"
                                      : "badge-red"
                          }`}
                      >
                        {crop.status}
                      </span>

                                            <p
                                                className="text-[10px] mt-1"
                                                style={{
                                                    color:
                                                        "var(--text-hint)",
                                                }}
                                            >
                                                {durationDays} days
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <p
                                            className="text-[10px] font-bold w-20"
                                            style={{
                                                color: "var(--text-muted)",
                                            }}
                                        >
                                            🌱 {fmt(crop.plantingDate)}
                                        </p>

                                        <div className="flex-1 relative">
                                            <div
                                                className="h-2.5 rounded-full"
                                                style={{
                                                    background:
                                                        "var(--bg-muted)",
                                                }}
                                            >
                                                <div
                                                    className="h-full rounded-full transition-all"
                                                    style={{
                                                        width: `${progress}%`,
                                                        background: `linear-gradient(90deg, ${col.dot}, ${col.border})`,
                                                    }}
                                                />

                                                {crop.status === "Active" &&
                                                    progress > 5 &&
                                                    progress < 95 && (
                                                        <div
                                                            className="absolute top-1/2 w-3 h-3 rounded-full border-2 border-white shadow-sm"
                                                            style={{
                                                                left: `${progress}%`,
                                                                transform:
                                                                    "translate(-50%, -50%)",
                                                                background:
                                                                col.dot,
                                                            }}
                                                        />
                                                    )}
                                            </div>
                                        </div>

                                        <p
                                            className="text-[10px] font-bold w-20 text-right"
                                            style={{
                                                color: "var(--text-muted)",
                                            }}
                                        >
                                            🌾{" "}
                                            {fmt(
                                                crop.expectedHarvestDate
                                            )}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
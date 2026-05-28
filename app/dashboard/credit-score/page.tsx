"use client";

import { useEffect, useState } from "react";
import { RefreshCw, FileText, Download } from "lucide-react";

function fmt(n: number) {
    return new Intl.NumberFormat("en-MW").format(Math.round(n));
}

type Factor = {
    label: string;
    score: number;
    max: number;
    detail: string;
};

type Summary = {
    totalArea: number;
    seasons: number;
    totalRevenue: number;
    profitMargin: number;
};

type HistoryItem = {
    score: number;
    grade: string;
};

type CreditScoreData = {
    score: number;
    grade: keyof typeof GRADE_CONFIG;
    gradeLabel: string;
    factors: Record<string, Factor>;
    summary: Summary;
    recommendations: string[];
    history: HistoryItem[];
};

const GRADE_CONFIG: Record<
    string,
    {
        color: string;
        bg: string;
        ring: string;
        label: string;
    }
> = {
    A: {
        color: "text-green-700 dark:text-green-400",
        bg: "bg-green-50 dark:bg-green-900/30",
        ring: "ring-green-500",
        label: "Excellent",
    },
    B: {
        color: "text-blue-700 dark:text-blue-400",
        bg: "bg-blue-50 dark:bg-blue-900/30",
        ring: "ring-blue-500",
        label: "Good",
    },
    C: {
        color: "text-amber-700 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-900/30",
        ring: "ring-amber-500",
        label: "Fair",
    },
    D: {
        color: "text-orange-700 dark:text-orange-400",
        bg: "bg-orange-50 dark:bg-orange-900/30",
        ring: "ring-orange-500",
        label: "Developing",
    },
    F: {
        color: "text-red-700 dark:text-red-400",
        bg: "bg-red-50 dark:bg-red-900/30",
        ring: "ring-red-500",
        label: "Early Stage",
    },
};

export default function CreditScorePage() {
    const [data, setData] = useState<CreditScoreData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = async (refresh = false) => {
        try {
            if (refresh) setRefreshing(true);
            else setLoading(true);

            const res = await fetch("/api/credit-score");

            if (!res.ok) {
                throw new Error("Failed to fetch credit score");
            }

            const d = await res.json();
            setData(d);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-[#1a3d1f] border-t-transparent animate-spin" />
                    <p className="text-sm text-slate-400">
                        Calculating your credit score...
                    </p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-slate-500">
                    Failed to load credit score data.
                </p>
            </div>
        );
    }

    const grade = data.grade ?? "F";
    const config = GRADE_CONFIG[grade] ?? GRADE_CONFIG.F;

    return (
        <div className="p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Farm Credit Score
                    </h1>

                    <p className="text-slate-400 text-sm mt-1">
                        Based on your farm records — use this to approach banks and
                        MFIs
                    </p>
                </div>

                <button
                    onClick={() => load(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 h-10 px-4 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                    <RefreshCw
                        size={14}
                        className={refreshing ? "animate-spin" : ""}
                    />
                    Recalculate
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Score card */}
                <div
                    className={`${config.bg} border-2 ${config.ring.replace(
                        "ring",
                        "border"
                    )} rounded-3xl p-8 flex flex-col items-center text-center`}
                >
                    <div
                        className={`w-32 h-32 rounded-full ring-8 ${config.ring} ring-opacity-30 ${config.bg} flex items-center justify-center mb-4`}
                    >
                        <div>
                            <p className={`text-6xl font-black ${config.color}`}>
                                {data.score}
                            </p>

                            <p className="text-xs text-slate-400">/ 100</p>
                        </div>
                    </div>

                    <div className={`text-5xl font-black ${config.color} mb-2`}>
                        {grade}
                    </div>

                    <p className={`text-lg font-bold ${config.color}`}>
                        {config.label}
                    </p>

                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                        {data.gradeLabel}
                    </p>
                </div>

                {/* Factor breakdown */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white mb-5">
                        Score breakdown
                    </h2>

                    <div className="flex flex-col gap-4">
                        {Object.entries(data.factors ?? {}).map(
                            ([key, factor]: [string, Factor]) => {
                                const pct = factor.max
                                    ? (factor.score / factor.max) * 100
                                    : 0;

                                return (
                                    <div key={key}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                {factor.label}
                                            </p>

                                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                {factor.score}/{factor.max}
                                            </p>
                                        </div>

                                        <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${
                                                    pct >= 75
                                                        ? "bg-green-500"
                                                        : pct >= 50
                                                            ? "bg-blue-500"
                                                            : pct >= 25
                                                                ? "bg-amber-500"
                                                                : "bg-red-400"
                                                }`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>

                                        <p className="text-xs text-slate-400 mt-1">
                                            {factor.detail}
                                        </p>
                                    </div>
                                );
                            }
                        )}
                    </div>
                </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    {
                        label: "Total area farmed",
                        value: `${data.summary?.totalArea?.toFixed(1) ?? 0} ha`,
                    },
                    {
                        label: "Seasons completed",
                        value: String(data.summary?.seasons ?? 0),
                    },
                    {
                        label: "Total revenue",
                        value: `MWK ${fmt(data.summary?.totalRevenue ?? 0)}`,
                    },
                    {
                        label: "Profit margin",
                        value: `${data.summary?.profitMargin ?? 0}%`,
                    },
                ].map(({ label, value }) => (
                    <div
                        key={label}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5"
                    >
                        <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-2">
                            {label}
                        </p>

                        <p className="text-xl font-bold text-slate-900 dark:text-white">
                            {value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Recommendations */}
            {data.recommendations?.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 mb-8">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                        How to improve your score
                    </h2>

                    <div className="flex flex-col gap-3">
                        {data.recommendations.map((rec: string, i: number) => (
                            <div
                                key={i}
                                className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl"
                            >
                                <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0 text-xs font-bold text-amber-700 dark:text-amber-400">
                                    {i + 1}
                                </div>

                                <p className="text-sm text-amber-900 dark:text-amber-300">
                                    {rec}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Score history */}
            {data.history?.length > 1 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 mb-8">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                        Score history
                    </h2>

                    <div className="flex items-end gap-3 h-20">
                        {[...data.history].reverse().map((h: HistoryItem, i: number) => (
                            <div
                                key={i}
                                className="flex flex-col items-center gap-1 flex-1"
                            >
                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                    {h.score}
                                </p>

                                <div
                                    className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden"
                                    style={{ height: "48px" }}
                                >
                                    <div
                                        className="w-full bg-gradient-to-t from-[#1a3d1f] to-[#3d8c47] rounded-lg transition-all"
                                        style={{ height: `${h.score}%` }}
                                    />
                                </div>

                                <p className="text-xs text-slate-400">{h.grade}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Loan readiness banner */}
            <div className="bg-gradient-to-r from-[#1a3d1f] to-[#2d5c35] rounded-3xl p-6">
                <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <FileText size={18} className="text-[#7dd68a]" />

                            <h2 className="text-base font-bold text-white">
                                Loan Readiness Report
                            </h2>
                        </div>

                        <p className="text-sm text-[#7dd68a] leading-relaxed max-w-md">
                            Download a professional PDF report showing your farm&apos;s
                            financial health, credit score and yield history. Take it
                            to banks, MFIs or investors.
                        </p>
                    </div>

                    <a
                        href="/dashboard/credit-score/report"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 h-11 px-6 bg-white text-[#1a3d1f] text-sm font-bold rounded-xl hover:bg-slate-100 transition-colors flex-shrink-0"
                    >
                        <Download size={15} />
                        Download PDF
                    </a>
                </div>
            </div>
        </div>
    );
}
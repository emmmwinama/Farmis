"use client";

import { useEffect, useState } from "react";
import { Loader2, Wind, Droplets, Eye, Thermometer, RefreshCw } from "lucide-react";

function getWeatherEmoji(code: number): string {
    if (code === 0) return "☀️";
    if (code <= 2) return "⛅";
    if (code === 3) return "☁️";
    if (code <= 49) return "🌫️";
    if (code <= 59) return "🌦️";
    if (code <= 69) return "🌧️";
    if (code <= 79) return "❄️";
    if (code <= 82) return "🌧️";
    if (code <= 84) return "🌨️";
    if (code <= 99) return "⛈️";
    return "🌤️";
}

function getWeatherLabel(code: number): string {
    if (code === 0) return "Clear sky";
    if (code <= 2) return "Partly cloudy";
    if (code === 3) return "Overcast";
    if (code <= 49) return "Foggy";
    if (code <= 59) return "Drizzle";
    if (code <= 69) return "Rainy";
    if (code <= 79) return "Snowy";
    if (code <= 82) return "Rain showers";
    if (code <= 84) return "Snow showers";
    if (code <= 99) return "Thunderstorm";
    return "Partly cloudy";
}

function getWindDirection(degrees: number): string {
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return dirs[Math.round(degrees / 45) % 8];
}

function getFarmingAdvice(weather: any): { advice: string; color: string; bg: string }[] {
    const advices = [];
    const { current, daily } = weather;

    if (daily?.[0]?.precipitation > 5) {
        advices.push({ advice: "Heavy rain expected — avoid spraying activities today", color: "#1E40AF", bg: "#EFF6FF" });
    } else if (daily?.[0]?.precipProbability < 20 && current.windSpeed < 15) {
        advices.push({ advice: "Good conditions for spraying — low wind and no rain forecast", color: "#166534", bg: "#F0FDF4" });
    }

    if (current.temp > 35) {
        advices.push({ advice: "High heat alert — water crops and protect young plants", color: "#92400E", bg: "#FFFBEB" });
    }

    if (daily?.slice(0, 3).every((d: any) => d.precipitation < 1)) {
        advices.push({ advice: "Dry spell ahead — consider irrigation in the next 3 days", color: "#D97706", bg: "#FFFBEB" });
    }

    if (daily?.slice(0, 3).some((d: any) => d.precipitation > 10)) {
        advices.push({ advice: "Rain expected this week — good time to plant or top-dress", color: "#166534", bg: "#F0FDF4" });
    }

    return advices.slice(0, 3);
}

export default function WeatherPage() {
    const [weather, setWeather] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const load = async (force = false) => {
        if (force) setRefreshing(true);
        else setLoading(true);
        try {
            const res = await fetch("/api/weather");
            if (!res.ok) throw new Error("Failed");
            const d = await res.json();
            setWeather(d);
        } catch {
            setError("Unable to load weather data. Check your connection.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { load(); }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="text-5xl">🌤️</div>
                    <Loader2 size={20} className="animate-spin" style={{ color: "var(--farm-green)" }} />
                    <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                        Fetching weather for your farm...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !weather) {
        return (
            <div className="p-8 max-w-2xl mx-auto">
                <div className="rounded-2xl p-10 text-center"
                     style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                    <p className="text-4xl mb-4">🌩️</p>
                    <p className="font-bold mb-2" style={{ color: "var(--text-primary)" }}>Weather unavailable</p>
                    <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                        {error || "Unable to load weather data."}
                    </p>
                    <button onClick={() => load(true)} className="btn-primary">Try again</button>
                </div>
            </div>
        );
    }

    const advices = getFarmingAdvice(weather);
    const today = weather.daily?.[0];

    return (
        <div className="p-8 max-w-5xl mx-auto animate-fade-in">

            <div className="page-header flex items-start justify-between">
                <div>
                    <h1 className="page-title">Weather</h1>
                    <p className="page-subtitle">Real-time conditions for {weather.farmName}</p>
                </div>
                <button onClick={() => load(true)} disabled={refreshing}
                        className="btn-secondary text-xs disabled:opacity-50">
                    <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
                    {refreshing ? "Updating..." : "Refresh"}
                </button>
            </div>

            {/* Current conditions hero */}
            <div className="rounded-3xl p-8 mb-6 relative overflow-hidden"
                 style={{ background: "linear-gradient(135deg, #1a3d1f 0%, #2d6a35 50%, #1a3d1f 100%)" }}>
                <div className="absolute inset-0 opacity-10">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="absolute rounded-full border border-white"
                             style={{ width: `${(i + 1) * 150}px`, height: `${(i + 1) * 150}px`, top: "50%", right: "-75px", transform: "translateY(-50%)", opacity: 0.3 - i * 0.05 }} />
                    ))}
                </div>

                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <div className="text-7xl mb-4">{getWeatherEmoji(weather.current.code)}</div>
                        <div className="flex items-end gap-3 mb-2">
                            <p className="text-7xl font-black text-white leading-none">{weather.current.temp}°</p>
                            <div className="mb-3">
                                <p className="text-white/80 font-bold text-lg">C</p>
                            </div>
                        </div>
                        <p className="text-white/80 text-lg font-semibold">{getWeatherLabel(weather.current.code)}</p>
                        <p className="text-white/50 text-sm mt-1">Feels like {weather.current.feelsLike}°C</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { icon: Droplets, label: "Humidity", value: `${weather.current.humidity}%` },
                            { icon: Wind, label: "Wind", value: `${weather.current.windSpeed} km/h ${getWindDirection(weather.current.windDirection)}` },
                            { icon: Thermometer, label: "High/Low", value: today ? `${today.tempMax}° / ${today.tempMin}°` : "—" },
                            { icon: Droplets, label: "Rain today", value: today ? `${today.precipitation} mm` : "0 mm" },
                        ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="rounded-2xl px-4 py-3 text-center"
                                 style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}>
                                <Icon size={16} className="text-white/60 mx-auto mb-1" />
                                <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-0.5">{label}</p>
                                <p className="text-sm font-extrabold text-white">{value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Farming advice */}
            {advices.length > 0 && (
                <div className="mb-6">
                    <p className="text-xs font-extrabold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                        🌾 Farming advice based on today's forecast
                    </p>
                    <div className="flex flex-col gap-2">
                        {advices.map((a, i) => (
                            <div key={i} className="rounded-xl px-4 py-3 text-sm font-semibold"
                                 style={{ background: a.bg, color: a.color, border: `1.5px solid ${a.color}20` }}>
                                {a.advice}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 7-day forecast */}
            <div className="rounded-2xl overflow-hidden"
                 style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(28,25,23,0.06)" }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}>
                    <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>7-Day Forecast</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Source: Open-Meteo · Updated every 3 hours</p>
                </div>
                <div className="divide-y" style={{ divideColor: "var(--border)" }}>
                    {(weather.daily ?? []).map((day: any, i: number) => {
                        const date = new Date(day.date);
                        const isToday = i === 0;
                        const dayName = isToday ? "Today" : date.toLocaleDateString("en-GB", { weekday: "short" });
                        const dateStr = date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

                        return (
                            <div key={day.date} className="flex items-center justify-between px-5 py-4 transition-all"
                                 style={{
                                     borderBottom: "1px solid var(--border)",
                                     background: isToday ? "var(--farm-pale)" : "transparent",
                                 }}>
                                <div className="w-24">
                                    <p className="text-sm font-bold" style={{ color: isToday ? "var(--farm-green)" : "var(--text-primary)" }}>
                                        {dayName}
                                    </p>
                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{dateStr}</p>
                                </div>

                                <div className="text-2xl">{getWeatherEmoji(day.code)}</div>
                                <p className="text-xs font-semibold w-28 text-center" style={{ color: "var(--text-secondary)" }}>
                                    {getWeatherLabel(day.code)}
                                </p>

                                <div className="flex items-center gap-2">
                                    <Droplets size={12} style={{ color: "#2563EB" }} />
                                    <p className="text-xs font-bold" style={{ color: day.precipProbability > 50 ? "#2563EB" : "var(--text-muted)" }}>
                                        {day.precipProbability}%
                                    </p>
                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{day.precipitation}mm</p>
                                </div>

                                <div className="flex items-center gap-2 text-sm font-bold">
                                    <span style={{ color: "#DC2626" }}>{day.tempMax}°</span>
                                    <span style={{ color: "var(--text-hint)" }}>/</span>
                                    <span style={{ color: "#2563EB" }}>{day.tempMin}°</span>
                                </div>

                                <div className="flex items-center gap-1.5 text-xs w-20">
                                    <Wind size={11} style={{ color: "var(--text-muted)" }} />
                                    <span style={{ color: "var(--text-muted)" }}>{day.windMax} km/h</span>
                                </div>

                                {isToday && (
                                    <span className="badge badge-green">Now</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <p className="text-xs text-center mt-4" style={{ color: "var(--text-hint)" }}>
                Weather data provided by Open-Meteo (open-meteo.com) · Free & open source
            </p>
        </div>
    );
}
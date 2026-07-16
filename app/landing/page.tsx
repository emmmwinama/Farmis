"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
    ArrowRight, Check, Star, Menu, X, ChevronDown,
    ChevronRight, Play, ShieldCheck,
} from "lucide-react";

// ── Hooks ─────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 2000, start = false) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!start) return;
        let startTime: number | null = null;
        const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [target, duration, start]);
    return count;
}

function useInView(threshold = 0.2) {
    const ref = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setInView(true); },
            { threshold }
        );
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [threshold]);
    return { ref, inView };
}

function AnimatedCounter({ value, suffix = "", prefix = "" }: {
    value: number;
    suffix?: string;
    prefix?: string;
}) {
    const { ref, inView } = useInView();
    const count = useCountUp(value, 2000, inView);
    return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// ── NavBar ────────────────────────────────────────────────────────────────
// FIX: removed unused `menuOpen` prop — it was accepted but never used

function NavBar({ scrolled }: { scrolled: boolean }) {
    const [open, setOpen] = useState(false);

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "shadow-lg" : ""}`}
            style={{
                background:     scrolled ? "rgba(247,246,242,0.95)" : "transparent",
                backdropFilter: scrolled ? "blur(16px)" : "none",
                borderBottom:   scrolled ? "1px solid #E2E8F0" : "none",
            }}
        >
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

                {/* Logo */}
                <Link href="/landing" className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                         style={{ background: "linear-gradient(135deg, #1a3d1f, #3d8c47)" }}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <polygon points="9,2 16,14 2,14" fill="#2d6a35" />
                            <polygon points="9,5 14,14 4,14" fill="#52b85e" />
                            <polygon points="9,8 12,14 6,14" fill="#86efac" />
                            <rect x="7.5" y="11" width="3" height="5" rx="1" fill="#1a3d1f" />
                        </svg>
                    </div>
                    <span className="font-black text-xl tracking-tight" style={{ color: "#0F172A" }}>
                        agrivault
                    </span>
                </Link>

                {/* Desktop nav */}
                <div className="hidden md:flex items-center gap-8">
                    {[
                        { label: "Features",       href: "#features" },
                        { label: "How it works",   href: "#how" },
                        { label: "Pricing",        href: "#pricing" },
                        { label: "Partners",       href: "#partners" },
                    ].map(({ label, href }) => (
                        <a key={href} href={href}
                           className="text-sm font-semibold transition-colors hover:opacity-70"
                           style={{ color: "#475569" }}>
                            {label}
                        </a>
                    ))}
                </div>

                {/* Desktop CTA */}
                <div className="hidden md:flex items-center gap-3">
                    <Link href="/login"
                          className="text-sm font-bold px-4 py-2 rounded-xl transition-all"
                          style={{ color: "#1a3d1f" }}>
                        Sign in
                    </Link>
                    <Link href="/register"
                          className="text-sm font-bold px-5 py-2.5 rounded-xl text-white transition-all hover:-translate-y-0.5"
                          style={{
                              background: "linear-gradient(135deg, #1a3d1f, #2d6a35)",
                              boxShadow:  "0 4px 14px rgba(26,61,31,0.35)",
                          }}>
                        Start trial
                    </Link>
                </div>

                {/* Mobile menu button */}
                <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-xl"
                        style={{ color: "#0F172A" }}>
                    {open ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>

            {/* Mobile menu */}
            {open && (
                <div className="md:hidden px-6 pb-6 pt-2 flex flex-col gap-3"
                     style={{ background: "rgba(247,246,242,0.98)", borderBottom: "1px solid #E2E8F0" }}>
                    {[
                        { label: "Features",       href: "#features" },
                        { label: "How it works",   href: "#how" },
                        { label: "Pricing",        href: "#pricing" },
                        { label: "Partners",       href: "#partners" },
                    ].map(({ label, href }) => (
                        <a key={href} href={href} onClick={() => setOpen(false)}
                           className="text-sm font-bold py-2" style={{ color: "#475569" }}>
                            {label}
                        </a>
                    ))}
                    <div className="flex gap-3 pt-2">
                        <Link href="/login" className="flex-1 text-center text-sm font-bold py-3 rounded-xl"
                              style={{ border: "1.5px solid #E2E8F0", color: "#1a3d1f" }}>
                            Sign in
                        </Link>
                        <Link href="/register"
                              className="flex-1 text-center text-sm font-bold py-3 rounded-xl text-white"
                              style={{ background: "linear-gradient(135deg, #1a3d1f, #2d6a35)" }}>
                            Start trial
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}

// ── HeroSection ───────────────────────────────────────────────────────────
// FIX: inner map loop variable renamed from `c` to `col` — was shadowing the `c` prop

function HeroSection({ c }: { c: Record<string, string> }) {
    return (
        <section className="relative min-h-screen flex items-center overflow-hidden pt-16"
                 style={{ background: "linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 62%, #F1F5F9 100%)" }}>

            {/* Background pattern */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-20"
                     style={{ background: "radial-gradient(circle, #3d8c47 0%, transparent 70%)" }} />
                <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-15"
                     style={{ background: "radial-gradient(circle, #0284C7 0%, transparent 70%)" }} />
                {/* FIX: renamed inner loop var from `c` → `col` to avoid shadowing `c` prop */}
                {Array.from({ length: 10 }).map((_, r) =>
                    Array.from({ length: 15 }).map((_, col) => (
                        <div key={`${r}-${col}`} className="absolute w-1 h-1 rounded-full"
                             style={{
                                 left:       `${col * 7}%`,
                                 top:        `${r * 11}%`,
                                 background: "#1a3d1f",
                                 opacity:    0.06,
                             }} />
                    ))
                )}
            </div>

            <div className="relative max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                {/* Left — copy */}
                <div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                         style={{ background: "#EBF5EC", border: "1.5px solid #86EFAC" }}>
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-widest" style={{ color: "#14532D" }}>
                            Built for African agriculture
                        </span>
                    </div>

                    <h1 className="font-black leading-[1.08] mb-6"
                        style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", color: "#0F172A", letterSpacing: "-0.04em" }}>
                        {c.hero_headline ?? "Manage your farm"}{" "}
                        <span className="relative">
                            <span style={{
                                background:           "linear-gradient(135deg, #1a3d1f, #3d8c47)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor:  "transparent",
                                backgroundClip:       "text",
                            }}>
                                like a business.
                            </span>
                        </span>
                    </h1>

                    <p className="text-lg leading-relaxed mb-8 max-w-lg" style={{ color: "#475569" }}>
                        {c.hero_subheadline ?? "AgriVault replaces paper records with a powerful digital system — track fields, crops, costs and yields. Get AI-powered insights. Know your profit before you sell."}
                    </p>

                    {/* Trust signals */}
                    <div className="flex flex-wrap gap-3 mb-8">
                        {["Free to start", "ADMARC market prices", "Works on any device", "Malawi-built"].map((t) => (
                            <div key={t} className="flex items-center gap-1.5 text-sm font-semibold"
                                 style={{ color: "#475569" }}>
                                <Check size={14} style={{ color: "#16A34A" }} />
                                {t}
                            </div>
                        ))}
                    </div>

                    {/* CTAs */}
                    <div className="flex flex-wrap gap-4 mb-10">
                        <Link href="/register"
                              className="flex items-center gap-2 px-7 py-4 rounded-2xl text-base font-black text-white transition-all hover:-translate-y-1"
                              style={{
                                  background: "linear-gradient(135deg, #1a3d1f 0%, #2d6a35 100%)",
                                  boxShadow:  "0 8px 30px rgba(26,61,31,0.35)",
                              }}>
                            {c.hero_cta_primary ?? "Start 7-day trial"}
                            <ArrowRight size={18} />
                        </Link>
                        <a href="#how"
                           className="flex items-center gap-2 px-7 py-4 rounded-2xl text-base font-bold transition-all hover:-translate-y-0.5"
                           style={{
                               background: "white",
                               border:     "1.5px solid #E2E8F0",
                               color:      "#0F172A",
                               boxShadow:  "0 2px 8px rgba(28,25,23,0.06)",
                           }}>
                            <Play size={16} style={{ color: "#1a3d1f" }} />
                            {c.hero_cta_secondary ?? "See how it works"}
                        </a>
                    </div>

                    {/* Social proof */}
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                            {["U1", "U2", "U3", "U4"].map((emoji, i) => (
                                <div key={i}
                                     className="w-9 h-9 rounded-full flex items-center justify-center text-base border-2 border-white"
                                     style={{ background: i % 2 === 0 ? "#EBF5EC" : "#E0F2FE" }}>
                                    {emoji}
                                </div>
                            ))}
                        </div>
                        <div>
                            <div className="flex items-center gap-1 mb-0.5">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Star key={i} size={12} fill="#06B6D4" style={{ color: "#06B6D4" }} />
                                ))}
                            </div>
                            <p className="text-xs font-semibold" style={{ color: "#64748B" }}>
                                Trusted by farmers across Malawi
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right — dashboard mockup */}
                <div className="relative">
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl"
                         style={{
                             background: "white",
                             border:     "1px solid #E2E8F0",
                             boxShadow:  "0 40px 80px rgba(26,61,31,0.2), 0 8px 24px rgba(0,0,0,0.08)",
                             transform:  "perspective(1000px) rotateY(-5deg) rotateX(2deg)",
                         }}>

                        {/* Mock dashboard header */}
                        <div className="flex items-center gap-3 px-5 py-3.5"
                             style={{ background: "#1a3d1f", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                            <div className="flex gap-1.5">
                                {["#FF5F57", "#FFBD2E", "#28CA41"].map((clr) => (
                                    <div key={clr} className="w-3 h-3 rounded-full" style={{ background: clr }} />
                                ))}
                            </div>
                            <div className="flex-1 h-6 rounded-lg" style={{ background: "rgba(255,255,255,0.1)" }} />
                        </div>

                        {/* Mock stats row */}
                        <div className="grid grid-cols-4 gap-3 p-5 pb-3">
                            {[
                                { label: "Fields",      value: "4",        color: "#EBF5EC" },
                                { label: "Active crops", value: "7",       color: "#EBF5EC" },
                                { label: "Yield",       value: "12.4t",    color: "#E0F2FE" },
                                { label: "Net income",  value: "MWK 840K", color: "#EFF6FF" },
                            ].map(({ label, value, color }) => (
                                <div key={label} className="rounded-xl p-3"
                                     style={{ background: color, border: "1px solid #E2E8F0" }}>
                                    <p className="text-[10px] font-black uppercase tracking-wide mb-1"
                                       style={{ color: "#64748B" }}>
                                        {label}
                                    </p>
                                    <p className="text-base font-black" style={{ color: "#0F172A" }}>{value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Mock chart area */}
                        <div className="mx-5 mb-3 rounded-xl p-4"
                             style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-black" style={{ color: "#0F172A" }}>Season performance</p>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                      style={{ background: "#EBF5EC", color: "#14532D" }}>
                                    2024/25
                                </span>
                            </div>
                            <div className="flex items-end gap-2 h-16">
                                {[40, 65, 55, 80, 70, 90, 75].map((h, i) => (
                                    <div key={i} className="flex-1 rounded-t-lg transition-all"
                                         style={{
                                             height:     `${h}%`,
                                             background: i === 5
                                                 ? "linear-gradient(180deg, #3d8c47, #1a3d1f)"
                                                 : i % 2 === 0 ? "#EBF5EC" : "#D1FAE5",
                                         }} />
                                ))}
                            </div>
                        </div>

                        {/* Mock AI insight */}
                        <div className="mx-5 mb-5 rounded-xl p-3 flex items-start gap-3"
                             style={{ background: "linear-gradient(135deg, #EBF5EC, #F0FDF4)", border: "1px solid #BBF7D0" }}>
                            <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                                 style={{ background: "linear-gradient(135deg, #1a3d1f, #3d8c47)" }}>
                                <span className="text-white text-xs">AI</span>
                            </div>
                            <div>
                                <p className="text-xs font-black mb-0.5" style={{ color: "#14532D" }}>AI Insight</p>
                                <p className="text-[10px]" style={{ color: "#166534" }}>
                                    Your maize yield is 23% above last season average. Best market: Lilongwe — MWK 450/kg
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Floating badges */}
                    <div className="absolute -left-6 top-1/4 rounded-2xl p-3 shadow-lg"
                         style={{ background: "white", border: "1px solid #E2E8F0" }}>
                        <p className="text-[10px] font-black" style={{ color: "#64748B" }}>ADMARC Price</p>
                        <p className="text-base font-black" style={{ color: "#16A34A" }}>MWK 450/kg</p>
                        <p className="text-[10px]" style={{ color: "#64748B" }}>↑ 29% vs 2023/24</p>
                    </div>

                    <div className="absolute -right-4 bottom-1/4 rounded-2xl p-3 shadow-lg"
                         style={{ background: "white", border: "1px solid #E2E8F0" }}>
                        <p className="text-[10px] font-black" style={{ color: "#64748B" }}>Credit Score</p>
                        <p className="text-2xl font-black" style={{ color: "#2563EB" }}>74</p>
                        <p className="text-[10px]" style={{ color: "#16A34A" }}>Grade B · Good</p>
                    </div>
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
                <p className="text-xs font-semibold" style={{ color: "#64748B" }}>Scroll to explore</p>
                <ChevronDown size={18} style={{ color: "#64748B" }} />
            </div>
        </section>
    );
}

// ── ProblemSection ────────────────────────────────────────────────────────
// FIX 1: removed `let inView` (was undefined, never assigned)
// FIX 2: removed bare `ref` usage (ref was never declared)
// FIX 3: added proper useInView() call — ref now attached to the section element

function ProblemSection({ c }: { c: any }) {
    const { ref, inView } = useInView(0.2);
    const problems = [
        { stat: "67%",      label: "of smallholder farmers in Malawi keep no formal financial records",    source: "World Bank, 2023" },
        { stat: "MWK 2.1T", label: "lost annually by Malawian farmers selling below optimal market prices", source: "USAID AgriMarket Study" },
        { stat: "89%",      label: "of farmer loan applications rejected - no financial history",            source: "RBM Report" },
    ];

    return (
        <section ref={ref} className="py-24" style={{ background: "#0F172A" }}>
            <div className="max-w-7xl mx-auto px-6">

                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                         style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <span className="text-xs font-black uppercase tracking-widest text-white/60">
                            The problem we&apos;re solving
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-4"
                        style={{ letterSpacing: "-0.04em" }}>
                        {c.problem_headline ?? "African farmers work hard."}<br />
                        <span style={{ color: "#0284C7" }}>The system is working against them.</span>
                    </h2>
                    <p className="text-lg max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.6)" }}>
                        {c.problem_sub ?? "Without digital records, farmers can't access credit, don't know their true costs, and sell at the wrong time. AgriVault fixes this."}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {problems.map(({ stat, label, source }, i) => (
                        <div key={i} className="rounded-3xl p-8"
                             style={{
                                 background:     "rgba(255,255,255,0.04)",
                                 border:         "1px solid rgba(255,255,255,0.08)",
                                 backdropFilter: "blur(8px)",
                             }}>
                            <p className="text-5xl font-black mb-4" style={{ color: "#0284C7" }}>
                                {inView ? stat : "—"}
                            </p>
                            <p className="text-base font-semibold mb-4 leading-relaxed"
                               style={{ color: "rgba(255,255,255,0.8)" }}>
                                {label}
                            </p>
                            <p className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>
                                Source: {source}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-12 rounded-3xl p-8 text-center"
                     style={{
                         background: "linear-gradient(135deg, rgba(26,61,31,0.4), rgba(45,106,53,0.2))",
                         border:     "1px solid rgba(61,140,71,0.3)",
                     }}>
                    <p className="text-2xl font-black text-white mb-2">
                        AgriVault gives every farmer a{" "}
                        <span style={{ color: "#4ade80" }}>digital farm office</span>
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.6)" }}>
                        Professional records. Real-time market prices. Credit score. All from a smartphone.
                    </p>
                </div>
            </div>
        </section>
    );
}

// ── FeaturesSection ───────────────────────────────────────────────────────

function FeaturesSection({ c, features }: { c: any; features: any[] }) {
    const displayFeatures =
        features.length > 0
            ? features.map((f) => ({
                icon:   f.icon,
                title:  f.title,
                desc:   f.description,
                color:  "#EBF5EC",
                accent: "#16A34A",
            }))
            : [
                { icon: "Map", title: "Field & crop mapping",      desc: "Draw GPS field boundaries, section zones by crop, measure acreage accurately. Know exactly what you have.",                                             color: "#EBF5EC", accent: "#16A34A" },
                { icon: "Chart", title: "ADMARC market intelligence", desc: "Live farm gate prices from ADMARC and regional markets. Know the best time and place to sell before you load the truck.",                             color: "#E0F2FE", accent: "#0284C7" },
                { icon: "Score", title: "Farm credit score",          desc: "Your complete farm history becomes a loan readiness report. Walk into any bank or MFI with a score and a PDF.",                                       color: "#EFF6FF", accent: "#2563EB" },
                { icon: "Weather", title: "Weather integration",        desc: "7-day forecast with farming advice. Know when to spray, plant, irrigate — before you spend money.",                                                   color: "#FAF5FF", accent: "#9333EA" },
                { icon: "Cattle", title: "Animal husbandry",           desc: "Track livestock health, production, weight gain and sales. Calculate true cost per animal automatically.",                                            color: "#F0F9FF", accent: "#EA580C" },
                { icon: "AI", title: "AI-powered insights",        desc: "Your data works for you. Anomaly alerts, season comparisons, cost benchmarking — all explained in plain language.",                                   color: "#F0FDF4", accent: "#16A34A" },
            ];

    return (
        <section id="features" className="py-24" style={{ background: "#F8FAFC" }}>
            <div className="max-w-7xl mx-auto px-6">

                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                         style={{ background: "#EBF5EC", border: "1.5px solid #86EFAC" }}>
                        <span className="text-xs font-black uppercase tracking-widest" style={{ color: "#14532D" }}>
                            Everything in one place
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black mb-4"
                        style={{ color: "#0F172A", letterSpacing: "-0.04em" }}>
                        {c.features_headline ?? "Built for the realities of"}<br />
                        <span style={{
                            background:           "linear-gradient(135deg, #1a3d1f, #3d8c47)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor:  "transparent",
                            backgroundClip:       "text",
                        }}>
                            African farming
                        </span>
                    </h2>
                    <p className="text-lg max-w-2xl mx-auto" style={{ color: "#475569" }}>
                        {c.features_sub ?? "Not a generic tool retrofitted for Africa. Built from scratch for Malawian conditions, crops, currencies and challenges."}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {displayFeatures.map(({ icon, title, desc, color, accent }) => (
                        <div key={title}
                             className="rounded-3xl p-7 transition-all hover:-translate-y-1 group cursor-default"
                             style={{
                                 background: "white",
                                 border:     "1px solid #E2E8F0",
                                 boxShadow:  "0 1px 3px rgba(28,25,23,0.06)",
                             }}>
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5 transition-transform group-hover:scale-110"
                                 style={{ background: color }}>
                                {icon}
                            </div>
                            <h3 className="text-lg font-extrabold mb-2" style={{ color: "#0F172A" }}>{title}</h3>
                            <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>{desc}</p>
                            <div className="mt-5 flex items-center gap-2 text-xs font-bold" style={{ color: accent }}>
                                <span>Learn more</span>
                                <ChevronRight size={14} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ── HowItWorksSection ─────────────────────────────────────────────────────

function HowItWorksSection({ c }: { c?: any }) {
    const steps = [
        { number: "01", icon: "Mobile", title: "Register in 2 minutes", desc: "Create your farm profile, add your fields and get started immediately. No training required. Works on any smartphone — even on 2G.", color: "#EBF5EC" },
        { number: "02", icon: "Record", title: "Record your farm",       desc: "Log activities, costs, yields and animals as they happen. Draw field boundaries on the map. Connect with your team members.",       color: "#E0F2FE" },
        { number: "03", icon: "Cost", title: "Make better decisions",  desc: "See your real profitability. Know your credit score. Sell at the right price to the right market. Access funding with proof.",      color: "#EFF6FF" },
    ];

    return (
        <section id="how" className="py-24" style={{ background: "white" }}>
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                         style={{ background: "#EBF5EC", border: "1.5px solid #86EFAC" }}>
                        <span className="text-xs font-black uppercase tracking-widest" style={{ color: "#14532D" }}>
                            Simple to get started
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black mb-4"
                        style={{ color: "#0F172A", letterSpacing: "-0.04em" }}>
                        From zero to{" "}
                        <span style={{
                            background:           "linear-gradient(135deg, #1a3d1f, #3d8c47)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor:  "transparent",
                            backgroundClip:       "text",
                        }}>
                            fully digital
                        </span>
                        {" "}in a day
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-0.5"
                         style={{ background: "linear-gradient(90deg, #86EFAC, #86EFAC)", opacity: 0.5 }} />

                    {steps.map(({ number, icon, title, desc, color }, i) => (
                        <div key={i} className="relative text-center">
                            <div className="relative inline-block mb-6">
                                <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-3xl"
                                     style={{ background: color }}>
                                    {icon}
                                </div>
                                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white"
                                     style={{ background: "linear-gradient(135deg, #1a3d1f, #3d8c47)" }}>
                                    {number}
                                </div>
                            </div>
                            <h3 className="text-xl font-extrabold mb-3" style={{ color: "#0F172A" }}>{title}</h3>
                            <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>{desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ── TestimonialsSection ────────────────────────────────────────────────────
// FIX: useInView returns a HTMLDivElement ref — moved ref to the inner div
// since <section> is not a div. The ref is now on the max-w wrapper div.

function TestimonialsSection({ c, testimonials }: { c: any; testimonials: any[] }) {
    const displayTestimonials =
        testimonials.length > 0
            ? testimonials.map((t) => ({
                quote:   t.quote,
                name:    t.name,
                role:    t.role ?? "",
                rating:  5,
                emoji:   t.avatar ?? "U3‍Harvest",
            }))
            : [
                { quote: "Before AgriVault, I had no idea which of my fields was profitable. Now I know my maize costs MWK 180 per kg to produce and I can sell for MWK 450 at Lilongwe market. That knowledge changed everything.", name: "James Phiri",      role: "Maize & soya farmer, Lilongwe",        emoji: "U3‍Harvest", rating: 5 },
                { quote: "I went to NBS Bank with my AgriVault credit score report. They approved my loan in two weeks. Without those records I would have been turned away like before.",                                              name: "Grace Banda",      role: "Commercial farmer, Kasungu",           emoji: "U4‍Harvest", rating: 5 },
                { quote: "The field mapping is incredible. I drew all four of my fields on the phone and now I know exactly how many hectares I have. I used to just guess.",                                                       name: "Edward Mkandawire", role: "Tobacco & groundnut farmer, Mzuzu",   emoji: "U1‍Harvest", rating: 5 },
            ];

    return (
        <section className="py-24" style={{ background: "#F8FAFC" }}>
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                         style={{ background: "#EBF5EC", border: "1.5px solid #86EFAC" }}>
                        <span className="text-xs font-black uppercase tracking-widest" style={{ color: "#14532D" }}>
                            Farmer stories
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black mb-4"
                        style={{ color: "#0F172A", letterSpacing: "-0.04em" }}>
                        {c.testimonials_headline ?? "What farmers are saying"}
                    </h2>
                </div>

                {/* FIX: iterate displayTestimonials — NOT the raw testimonials prop */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {displayTestimonials.map(({ quote, name, role, emoji, rating }) => (
                        <div key={name} className="rounded-3xl p-7"
                             style={{
                                 background: "white",
                                 border:     "1px solid #E2E8F0",
                                 boxShadow:  "0 1px 3px rgba(28,25,23,0.06)",
                             }}>
                            <div className="flex items-center gap-1 mb-5">
                                {Array.from({ length: rating }).map((_, i) => (
                                    <Star key={i} size={14} fill="#06B6D4" style={{ color: "#06B6D4" }} />
                                ))}
                            </div>
                            <p className="text-base leading-relaxed mb-6 italic" style={{ color: "#475569" }}>
                                &ldquo;{quote}&rdquo;
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl"
                                     style={{ background: "#EBF5EC" }}>
                                    {emoji}
                                </div>
                                <div>
                                    <p className="text-sm font-extrabold" style={{ color: "#0F172A" }}>{name}</p>
                                    <p className="text-xs" style={{ color: "#64748B" }}>{role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ── PricingSection ────────────────────────────────────────────────────────
// FIX: prices are stored as whole MWK (e.g. 9900), NOT cents.
// Removed the incorrect `/ 100` — display price directly with toLocaleString().

function PricingSection({ c, tiers }: { c: any; tiers: any[] }) {
    // Default tiers if none loaded from DB
    const defaultTiers = [
        {
            name:         "Trial",
            description:  "Try AgriVault for 7 days",
            priceMonthly: 0,
            features:     ["7-day access", "Single farm", "All regular features", "No team members"],
            isFeatured:   false,
            cta:          "Start trial",
        },
        {
            name:         "Regular",
            description:  "For one farm owner managing a single-user account",
            priceMonthly: 9900,
            features:     ["Unlimited fields", "Unlimited crops", "Finance tracking", "Employees", "Reports", "Single user"],
            isFeatured:   true,
            cta:          "Get regular",
        },
        {
            name:         "Enterprise",
            description:  "For cooperatives and large operations",
            priceMonthly: 49900,
            features:     ["Everything in Regular", "Multiple farms", "Team management", "API access", "Custom reports"],
            isFeatured:   false,
            cta:          "Contact us",
        },
    ];

    const displayTiers = tiers.length > 0 ? tiers : defaultTiers;

    return (
        <section id="pricing" className="py-24" style={{ background: "white" }}>
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                         style={{ background: "#EBF5EC", border: "1.5px solid #86EFAC" }}>
                        <span className="text-xs font-black uppercase tracking-widest" style={{ color: "#14532D" }}>
                            Simple pricing
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black mb-4"
                        style={{ color: "#0F172A", letterSpacing: "-0.04em" }}>
                        {c.pricing_headline ?? "Start with a 7-day trial."}<br />Scale when you grow.
                    </h2>
                    <p className="text-lg max-w-xl mx-auto" style={{ color: "#475569" }}>
                        {c.pricing_sub ?? "No hidden fees. No contracts. Pay monthly and cancel anytime. All prices in Malawian Kwacha."}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {displayTiers.map((tier: any, i: number) => {
                        const featured = tier.isFeatured || (tiers.length === 0 && i === 1);
                        // Use priceMonthly (real schema field name)
                        const price    = tier.priceMonthly ?? 0;

                        // Build feature list from DB flags or fallback array
                        const featureList: string[] = tier.features ?? [
                            ...(tier.seasonAnalytics       ? ["Season analytics"]       : []),
                            ...(tier.yieldSuggestions      ? ["Yield suggestions"]      : []),
                            ...(tier.costPerHectare        ? ["Cost per hectare"]        : []),
                            ...(tier.payrollTracking       ? ["Payroll tracking"]        : []),
                            ...(tier.multipleFarms         ? ["Multiple farms"]          : []),
                            ...(tier.teamAccounts          ? ["Team accounts"]           : []),
                            ...(tier.customReports         ? ["Custom reports"]          : []),
                            ...(tier.apiAccess             ? ["API access"]              : []),
                            ...(tier.dataRetentionLifetime ? ["Lifetime data retention"] : []),
                        ];

                        return (
                            <div key={tier.id ?? tier.name}
                                 className="rounded-3xl overflow-hidden transition-all hover:-translate-y-1"
                                 style={{
                                     background: featured ? "linear-gradient(160deg, #1a3d1f 0%, #0f2411 100%)" : "white",
                                     border:     featured ? "none" : "1px solid #E2E8F0",
                                     boxShadow:  featured
                                         ? "0 20px 60px rgba(26,61,31,0.35)"
                                         : "0 1px 3px rgba(28,25,23,0.06)",
                                     transform:  featured ? "scale(1.04)" : "scale(1)",
                                 }}>

                                {featured && (
                                    <div className="flex items-center justify-center gap-1.5 py-3"
                                         style={{ background: "#0284C7" }}>
                                        <Star size={12} fill="white" className="text-white" />
                                        <span className="text-xs font-black text-white uppercase tracking-widest">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                <div className="p-7">
                                    <h3 className="text-xl font-black mb-1"
                                        style={{ color: featured ? "white" : "#0F172A" }}>
                                        {tier.name}
                                    </h3>
                                    <p className="text-sm mb-6"
                                       style={{ color: featured ? "rgba(255,255,255,0.6)" : "#64748B" }}>
                                        {tier.description}
                                    </p>

                                    <div className="mb-6">
                                        {/* Prices are whole MWK — display directly */}
                                        <span className="text-5xl font-black"
                                              style={{ color: featured ? "white" : "#0F172A" }}>
                                            {price === 0
                                                ? "Free"
                                                : `MWK ${new Intl.NumberFormat("en-MW").format(price)}`}
                                        </span>
                                        {price > 0 && (
                                            <span className="text-sm font-semibold ml-2"
                                                  style={{ color: featured ? "rgba(255,255,255,0.5)" : "#64748B" }}>
                                                / month
                                            </span>
                                        )}
                                    </div>

                                    <Link href="/register"
                                          className="block text-center py-3.5 rounded-2xl text-sm font-extrabold mb-7 transition-all"
                                          style={{
                                              background: featured
                                                  ? "linear-gradient(135deg, #0284C7, #06B6D4)"
                                                  : "linear-gradient(135deg, #1a3d1f, #2d6a35)",
                                              color:     "white",
                                              boxShadow: featured
                                                  ? "0 4px 14px rgba(217,119,6,0.4)"
                                                  : "0 4px 14px rgba(26,61,31,0.25)",
                                          }}>
                                        {tier.cta ?? (price === 0 ? "Start trial" : "Get started")}
                                    </Link>

                                    <div className="flex flex-col gap-2.5">
                                        {featureList.slice(0, 8).map((feat: string) => (
                                            <div key={feat} className="flex items-center gap-2.5">
                                                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                                     style={{ background: featured ? "rgba(255,255,255,0.12)" : "#EBF5EC" }}>
                                                    <Check size={11}
                                                           style={{ color: featured ? "white" : "#16A34A" }} />
                                                </div>
                                                <span className="text-sm"
                                                      style={{ color: featured ? "rgba(255,255,255,0.8)" : "#475569" }}>
                                                    {feat}
                                                </span>
                                            </div>
                                        ))}
                                        {featureList.length === 0 && (
                                            <p className="text-sm" style={{ color: featured ? "rgba(255,255,255,0.4)" : "#64748B" }}>
                                                Basic farm tracking included
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

// ── MarketReadinessSection ────────────────────────────────────────────────

function MarketReadinessSection() {
    const additions = [
        {
            title: "Customer adoption",
            desc: "Guided onboarding, seasonal templates, reminders, and offline-first mobile capture for field teams.",
        },
        {
            title: "Revenue expansion",
            desc: "Paid add-ons for inventory sales, payroll, credit-score reports, and buyer-ready farm records.",
        },
        {
            title: "Partner reporting",
            desc: "Programme dashboards, cohort reporting, and exportable evidence packs for lenders and institutions.",
        },
    ];

    return (
        <section id="partners" className="py-24" style={{ background: "#FFFFFF" }}>
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-12 items-start">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                             style={{ background: "#F1F5F9", border: "1px solid #CBD5E1" }}>
                            <ShieldCheck size={13} style={{ color: "#0F766E" }} />
                            <span className="text-xs font-black uppercase tracking-widest" style={{ color: "#334155" }}>
                                Built to scale
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black mb-5"
                            style={{ color: "#0F172A", letterSpacing: "-0.03em" }}>
                            Practical tools farmers will pay for. Data partners can trust.
                        </h2>
                        <p className="text-lg leading-relaxed" style={{ color: "#475569" }}>
                            AgriVault becomes more marketable when daily farm records turn into decisions, proof, and repeatable workflows for farmers, agribusinesses, lenders, and programmes.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {additions.map(({ title, desc }) => (
                            <div key={title} className="rounded-2xl p-5"
                                 style={{
                                     background: "#F8FAFC",
                                     border: "1px solid #E2E8F0",
                                     boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
                                 }}>
                                <p className="text-sm font-black mb-2" style={{ color: "#0F172A" }}>{title}</p>
                                <p className="text-sm leading-relaxed" style={{ color: "#64748B" }}>{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function FinalCTASection({ c }: { c?: any }) {
    return (
        <section className="py-24 relative overflow-hidden"
                 style={{ background: "linear-gradient(135deg, #1a3d1f 0%, #2d6a35 50%, #1a3d1f 100%)" }}>

            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
                     style={{ background: "radial-gradient(circle, #4ade80, transparent)" }} />
                <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-10"
                     style={{ background: "radial-gradient(circle, #0284C7, transparent)" }} />
            </div>

            <div className="relative max-w-4xl mx-auto px-6 text-center">
                <div className="text-6xl mb-6">Harvest</div>
                <h2 className="text-4xl md:text-5xl font-black text-white mb-6"
                    style={{ letterSpacing: "-0.04em" }}>
                    {c?.cta_headline ?? "Your farm deserves"}<br />better than paper.
                </h2>
                <p className="text-xl mb-10 max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.75)" }}>
                    {c?.cta_sub ?? "Join hundreds of Malawian farmers already using AgriVault to make smarter decisions, access credit and build profitable farms."}
                </p>
                <div className="flex flex-wrap gap-4 justify-center mb-8">
                    <Link href="/register"
                          className="flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-black transition-all hover:-translate-y-1"
                          style={{
                              background: "linear-gradient(135deg, #0284C7, #06B6D4)",
                              color:      "white",
                              boxShadow:  "0 8px 30px rgba(217,119,6,0.4)",
                          }}>
                        Start for free today
                        <ArrowRight size={20} />
                    </Link>
                    <a href={`mailto:${c?.contact_email ?? "hello@agrivault.app"}`}
                       className="flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-bold transition-all"
                       style={{
                           background: "rgba(255,255,255,0.12)",
                           border:     "1.5px solid rgba(255,255,255,0.2)",
                           color:      "white",
                       }}>
                        Talk to our team
                    </a>
                </div>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                    7-day trial · No credit card required · Cancel anytime
                </p>
            </div>
        </section>
    );
}

// ── Footer ────────────────────────────────────────────────────────────────

function Footer({ c }: { c?: any }) {
    return (
        <footer style={{ background: "#0f1a0f", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">

                    {/* Brand */}
                    <div className="col-span-2">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                 style={{ background: "rgba(255,255,255,0.08)" }}>
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                    <polygon points="9,2 16,14 2,14" fill="#2d6a35" />
                                    <polygon points="9,5 14,14 4,14" fill="#52b85e" />
                                    <polygon points="9,8 12,14 6,14" fill="#86efac" />
                                    <rect x="7.5" y="11" width="3" height="5" rx="1" fill="#1a3d1f" />
                                </svg>
                            </div>
                            <span className="font-black text-xl text-white">agrivault</span>
                        </div>
                        <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
                            Farm management software built for African agriculture.
                            Digitizing farms, one record at a time.
                        </p>
                        <p className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.2)" }}>
                            🇲🇼 Made in Malawi · Serving southern Africa
                        </p>
                    </div>

                    {/* Links */}
                    {[
                        {
                            title: "Product",
                            links: [
                                { label: "Features",     href: "#features" },
                                { label: "Pricing",      href: "#pricing" },
                                { label: "How it works", href: "#how" },
                                { label: "Partners",     href: "#partners" },
                            ],
                        },
                        {
                            title: "Company",
                            links: [
                                { label: "About",   href: "/about" },
                                { label: "Blog",    href: "/blog" },
                                { label: "Careers", href: "/careers" },
                                { label: "Press",   href: "/press" },
                            ],
                        },
                        {
                            title: "Legal",
                            links: [
                                { label: "Privacy policy", href: "/privacy" },
                                { label: "Terms of use",   href: "/terms" },
                                { label: "Security",       href: "/security" },
                                { label: "Contact",        href: `mailto:${c?.contact_email ?? "hello@agrivault.app"}` },
                            ],
                        },
                    ].map(({ title, links }) => (
                        <div key={title}>
                            <p className="text-xs font-black uppercase tracking-widest mb-4"
                               style={{ color: "rgba(255,255,255,0.3)" }}>
                                {title}
                            </p>
                            <div className="flex flex-col gap-2.5">
                                {links.map(({ label, href }) => (
                                    <Link key={label} href={href}
                                          className="text-sm font-semibold transition-colors hover:opacity-100"
                                          style={{ color: "rgba(255,255,255,0.5)" }}>
                                        {label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between pt-8 gap-4"
                     style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                        © {new Date().getFullYear()} AgriVault. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        {["Privacy", "Terms", "Contact"].map((item) => (
                            <Link key={item} href={`/${item.toLowerCase()}`}
                                  className="text-xs font-semibold"
                                  style={{ color: "rgba(255,255,255,0.3)" }}>
                                {item}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function LandingPage() {
    const [scrolled, setScrolled] = useState(false);
    const [cmsData,  setCmsData]  = useState<any>({
        content:      {},
        features:     [],
        testimonials: [],
    });
    const [tiers, setTiers] = useState<any[]>([]);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        Promise.all([
            fetch("/api/public/content").then((r) => r.json()),
            fetch("/api/public/tiers").then((r)   => r.json()),
        ])
            .then(([content, tiersData]) => {
                setCmsData(content ?? { content: {}, features: [], testimonials: [], media: [] });
                setTiers(Array.isArray(tiersData) ? tiersData : []);
            })
            .catch(() => {});
    }, []);

    const c = cmsData.content ?? {};

    return (
        <div style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif" }}>
            <NavBar scrolled={scrolled} />
            <HeroSection c={c} />
            <ProblemSection c={c} />
            <FeaturesSection c={c} features={cmsData.features ?? []} />
            <HowItWorksSection c={c} />
            <TestimonialsSection c={c} testimonials={cmsData.testimonials ?? []} />
            <PricingSection c={c} tiers={tiers} />
            <MarketReadinessSection />
            <FinalCTASection c={c} />
            <Footer c={c} />
        </div>
    );
}




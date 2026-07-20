"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
    ArrowRight, Check, Star, Menu, X, ChevronDown,
    ChevronRight, Play, ShieldCheck, Smartphone, ClipboardList, Calculator,
    Map, BarChart3, FileCheck2, CloudSun, Beef, Activity, Sprout, UsersRound,
    PackageCheck, WalletCards,
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

function landingIconFor(icon: string | undefined, title = "") {
    const key = `${icon ?? ""} ${title}`.toLowerCase();
    if (key.includes("mobile") || key.includes("phone")) return Smartphone;
    if (key.includes("record") || key.includes("activity")) return ClipboardList;
    if (key.includes("cost") || key.includes("profit") || key.includes("finance")) return Calculator;
    if (key.includes("map") || key.includes("field")) return Map;
    if (key.includes("chart") || key.includes("report") || key.includes("analytics")) return BarChart3;
    if (key.includes("score") || key.includes("readiness") || key.includes("credit")) return FileCheck2;
    if (key.includes("weather")) return CloudSun;
    if (key.includes("cattle") || key.includes("animal") || key.includes("livestock")) return Beef;
    if (key.includes("inventory") || key.includes("stock")) return PackageCheck;
    if (key.includes("crop") || key.includes("plant")) return Sprout;
    if (key.includes("payroll") || key.includes("team")) return UsersRound;
    if (key.includes("cash") || key.includes("sales")) return WalletCards;
    return Activity;
}

function SeoJsonLd({ tiers }: { tiers: any[] }) {
    const pricingOffers = (tiers.length ? tiers : [
        { name: "Trial", priceMonthly: 0, description: "7-day trial" },
        { name: "Regular", priceMonthly: 20000, description: "Single-user farm management" },
        { name: "Enterprise", priceMonthly: 85000, description: "Team and multi-farm management" },
    ]).map((tier) => ({
        "@type": "Offer",
        name: tier.name,
        description: tier.description,
        price: Number(tier.priceMonthly ?? 0),
        priceCurrency: "MWK",
        availability: "https://schema.org/InStock",
        url: `/register?tier=${encodeURIComponent(tier.id ?? tier.name ?? "")}`,
    }));

    const data = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Organization",
                "@id": "/#organization",
                name: "AgriVault",
                url: "/landing",
                logo: "/agrivault-mark.svg",
                sameAs: [],
            },
            {
                "@type": "SoftwareApplication",
                "@id": "/landing#software",
                name: "AgriVault",
                applicationCategory: "BusinessApplication",
                operatingSystem: "Web, Android, iOS",
                description: "Offline-ready farm management software for crops, livestock, inventory, finance, team records, analytics and professional exports.",
                offers: pricingOffers,
                publisher: {
                    "@id": "/#organization",
                },
                featureList: [
                    "Offline-ready farm data capture",
                    "Crop and seasonal activity tracking",
                    "Livestock records and health costs",
                    "Inventory stock automation",
                    "Farm finance and cashflow reports",
                    "Professional PDF exports",
                    "Team roles and permissions",
                    "Traceability and compliance records",
                ],
            },
            {
                "@type": "WebSite",
                "@id": "/#website",
                name: "AgriVault",
                url: "/landing",
                publisher: {
                    "@id": "/#organization",
                },
            },
        ],
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
}

// ── NavBar ────────────────────────────────────────────────────────────────

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
                        {c.hero_subheadline ?? "AgriVault replaces paper records with a powerful digital system - track fields, crops, livestock, costs, inventory and yields. Know your profit before you sell."}
                    </p>

                    {/* Trust signals */}
                    <div className="flex flex-wrap gap-3 mb-8">
                        {["Free to start", "Offline field records", "Works on any device", "Built for field teams"].map((t) => (
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
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center border-2 border-white"
                             style={{ background: "#E0F2FE", color: "#0369A1" }}>
                            <UsersRound size={19} />
                        </div>
                        <div>
                            <div className="flex items-center gap-1 mb-0.5">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Star key={i} size={12} fill="#06B6D4" style={{ color: "#06B6D4" }} />
                                ))}
                            </div>
                            <p className="text-xs font-semibold" style={{ color: "#64748B" }}>
                                Trusted by practical farm teams
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

                        {/* Mock operational alert */}
                        <div className="mx-5 mb-5 rounded-xl p-3 flex items-start gap-3"
                             style={{ background: "linear-gradient(135deg, #EBF5EC, #F0FDF4)", border: "1px solid #BBF7D0" }}>
                            <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                                 style={{ background: "linear-gradient(135deg, #1a3d1f, #3d8c47)" }}>
                                <ClipboardList size={14} className="text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-black mb-0.5" style={{ color: "#14532D" }}>Field alert</p>
                                <p className="text-[10px]" style={{ color: "#166534" }}>
                                    Maize top dressing is due this week. Inventory has 8 bags of fertiliser available.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Floating badges */}
                    <div className="absolute -left-6 top-1/4 rounded-2xl p-3 shadow-lg"
                         style={{ background: "white", border: "1px solid #E2E8F0" }}>
                        <p className="text-[10px] font-black" style={{ color: "#64748B" }}>Stock value</p>
                        <p className="text-base font-black" style={{ color: "#16A34A" }}>MWK 2.4M</p>
                        <p className="text-[10px]" style={{ color: "#64748B" }}>Inventory ready for sale</p>
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
        { stat: "67%",      label: "of smallholder farmers keep no formal financial records",    source: "World Bank, 2023" },
        { stat: "2.1T", label: "in annual value lost when farms sell below optimal market prices", source: "Agricultural market studies" },
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
                        {c.problem_headline ?? "Farm teams work hard."}<br />
                        <span style={{ color: "#0284C7" }}>Their records should work just as hard.</span>
                    </h2>
                    <p className="text-lg max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.6)" }}>
                        {c.problem_sub ?? "Without digital records, farms lose visibility on costs, production, team activity, and sales timing. AgriVault fixes this."}
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
                        Professional records. Profitability analytics. Credit-ready reports. All from a smartphone.
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
                { icon: "Inventory", title: "Inventory automation", desc: "Track acquisitions, sales, disposals, stock levels and input consumption from actual purchase costs.",                                                color: "#E0F2FE", accent: "#0284C7" },
                { icon: "Score", title: "Readiness reports",       desc: "Turn farm history into professional evidence reports for buyers, audits, insurance and finance reviews.",                                             color: "#EFF6FF", accent: "#2563EB" },
                { icon: "Weather", title: "Weather planning",      desc: "Use weather-aware planning to decide when to spray, plant, irrigate or protect crops before spending money.",                                         color: "#FAF5FF", accent: "#9333EA" },
                { icon: "Cattle", title: "Animal husbandry",       desc: "Track livestock health, production, weight gain, general costs and sales alongside crop records.",                                                     color: "#F0F9FF", accent: "#EA580C" },
                { icon: "Chart", title: "Farm analytics",          desc: "Compare profitability, cashflow, yields, input efficiency, inventory levels and season performance in one place.",                                     color: "#F0FDF4", accent: "#16A34A" },
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
                        {c.features_sub ?? "A practical farm records system built for real field conditions, seasonal workflows, teams, and commercial reporting."}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {displayFeatures.map(({ icon, title, desc, color, accent }) => {
                        const Icon = landingIconFor(icon, title);
                        return (
                        <div key={title}
                             className="rounded-3xl p-7 transition-all hover:-translate-y-1 group cursor-default"
                             style={{
                                 background: "white",
                                 border:     "1px solid #E2E8F0",
                                 boxShadow:  "0 1px 3px rgba(28,25,23,0.06)",
                             }}>
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                                 style={{ background: color, color: accent }}>
                                <Icon size={24} />
                            </div>
                            <h3 className="text-lg font-extrabold mb-2" style={{ color: "#0F172A" }}>{title}</h3>
                            <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>{desc}</p>
                            <div className="mt-5 flex items-center gap-2 text-xs font-bold" style={{ color: accent }}>
                                <span>Learn more</span>
                                <ChevronRight size={14} />
                            </div>
                        </div>
                    );})}
                </div>
            </div>
        </section>
    );
}

// ── HowItWorksSection ─────────────────────────────────────────────────────

function HowItWorksSection({ c }: { c?: any }) {
    const steps = [
        { number: "01", icon: "Mobile", title: "Register in 2 minutes", desc: "Create your farm profile, add your fields and get started immediately. No training required. Works on any smartphone.", color: "#EBF5EC" },
        { number: "02", icon: "Record", title: "Record your farm",       desc: "Log activities, costs, yields and animals as they happen. Draw field boundaries on the map. Connect with your team members.",       color: "#E0F2FE" },
        { number: "03", icon: "Cost", title: "Make better decisions",  desc: "See real profitability, stock movement, cashflow and season performance. Share professional records when proof is needed.",      color: "#EFF6FF" },
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

                    {steps.map(({ number, icon, title, desc, color }, i) => {
                        const Icon = landingIconFor(icon, title);
                        return (
                        <div key={i} className="relative text-center">
                            <div className="relative inline-block mb-6">
                                <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center"
                                     style={{ background: color, color: "#14532D" }}>
                                    <Icon size={30} />
                                </div>
                                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white"
                                     style={{ background: "linear-gradient(135deg, #1a3d1f, #3d8c47)" }}>
                                    {number}
                                </div>
                            </div>
                            <h3 className="text-xl font-extrabold mb-3" style={{ color: "#0F172A" }}>{title}</h3>
                            <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>{desc}</p>
                        </div>
                    );})}
                </div>
            </div>
        </section>
    );
}

// ── TestimonialsSection ────────────────────────────────────────────────────
// since <section> is not a div. The ref is now on the max-w wrapper div.

function TestimonialsSection({ c, testimonials }: { c: any; testimonials: any[] }) {
    const initialsFor = (name: string) =>
        name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2) || "AV";
    const displayTestimonials =
        testimonials.length > 0
            ? testimonials.map((t) => ({
                quote:   t.quote,
                name:    t.name,
                role:    t.role ?? "",
                rating:  5,
                avatar:  t.avatar ?? initialsFor(t.name ?? ""),
            }))
            : [
                { quote: "Before AgriVault, I had no idea which of my fields was profitable. Now I know my maize costs MWK 180 per kg to produce and I can sell for MWK 450 at Lilongwe market. That knowledge changed everything.", name: "James Phiri",      role: "Maize & soya farmer, Lilongwe",      avatar: "JP", rating: 5 },
                { quote: "I went to NBS Bank with my AgriVault credit score report. They approved my loan in two weeks. Without those records I would have been turned away like before.",                                            name: "Grace Banda",      role: "Commercial farmer, Kasungu",         avatar: "GB", rating: 5 },
                { quote: "The field mapping is incredible. I drew all four of my fields on the phone and now I know exactly how many hectares I have. I used to just guess.",                                                     name: "Edward Mkandawire", role: "Tobacco & groundnut farmer, Mzuzu", avatar: "EM", rating: 5 },
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {displayTestimonials.map(({ quote, name, role, avatar, rating }) => (
                        <div key={name} className="rounded-3xl p-7"
                             style={{ background: "white", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
                            <div className="flex gap-0.5 mb-4">
                                {Array.from({ length: rating }).map((_, i) => (
                                    <Star key={i} size={14} fill="#F59E0B" style={{ color: "#F59E0B" }} />
                                ))}
                            </div>
                            <p className="text-base leading-relaxed mb-6 italic" style={{ color: "#475569" }}>
                                &ldquo;{quote}&rdquo;
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xs font-black"
                                     style={{ background: "#E0F2FE", color: "#075985" }}>
                                    {avatar}
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

function PricingSection({ c, tiers }: { c: any; tiers: any[] }) {
    const defaultTiers = [
        {
            id: "trial",
            name: "Trial",
            description: "Try AgriVault for 7 days.",
            priceMonthly: 0,
            audience: "New users evaluating digital farm records",
            offerItems: ["7-day access", "Single farm setup", "Core crop, activity and inventory records", "No credit card required"],
            ctaLabel: "Start trial",
        },
        {
            id: "regular",
            name: "Regular",
            description: "For one farm owner managing a single-user account.",
            priceMonthly: 20000,
            audience: "Single-user farms",
            offerItems: ["Offline-ready field records", "Crops, activities, inventory and finance", "Professional PDF reports", "Profitability analytics"],
            isFeatured: true,
            ctaLabel: "Get regular",
        },
        {
            id: "enterprise",
            name: "Enterprise",
            description: "For teams, estates and multi-farm operations.",
            priceMonthly: 85000,
            audience: "Teams and multi-user farms",
            offerItems: ["Everything in Regular", "Team roles and approvals", "Multiple farms", "Custom reports"],
            ctaLabel: "Start enterprise",
        },
        {
            id: "large-enterprise",
            name: "Large Enterprise",
            description: "For cooperatives, buyers, funders and large estates.",
            priceMonthly: 300000,
            audience: "Portfolio and partner dashboards",
            offerItems: ["Aggregate dashboards", "Custom onboarding", "Audit-ready reporting", "API and data support"],
            ctaLabel: "Discuss package",
        },
    ];

    const displayTiers = tiers.length > 0 ? tiers : defaultTiers;

    return (
        <section id="pricing" className="py-20 sm:py-24" style={{ background: "linear-gradient(180deg,#F8FAFC 0%,#FFFFFF 100%)" }}>
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-12 sm:mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                         style={{ background: "#E0F2FE", border: "1.5px solid #BAE6FD" }}>
                        <span className="text-xs font-black uppercase tracking-widest" style={{ color: "#0369A1" }}>
                            Flexible packages
                        </span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4"
                        style={{ color: "#0F172A" }}>
                        {c.pricing_headline ?? "Start with a 7-day trial. Scale when you grow."}
                    </h2>
                    <p className="text-base sm:text-lg max-w-2xl mx-auto leading-7" style={{ color: "#475569" }}>
                        {c.pricing_sub ?? "Choose the package that matches your farm, team, or partner network."}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                    {displayTiers.map((tier: any, i: number) => {
                        const featured = tier.isFeatured || (tiers.length === 0 && i === 1);
                        const price = tier.priceMonthly ?? 0;
                        const featureList: string[] = Array.isArray(tier.offerItems) && tier.offerItems.length > 0
                            ? tier.offerItems
                            : [
                                ...(tier.seasonAnalytics ? ["Season analytics"] : []),
                                ...(tier.yieldSuggestions ? ["Yield suggestions"] : []),
                                ...(tier.costPerHectare ? ["Cost per hectare"] : []),
                                ...(tier.payrollTracking ? ["Payroll tracking"] : []),
                                ...(tier.multipleFarms ? ["Multiple farms"] : []),
                                ...(tier.teamAccounts ? ["Team accounts"] : []),
                                ...(tier.customReports ? ["Custom reports"] : []),
                                ...(tier.apiAccess ? ["API access"] : []),
                                ...(tier.dataRetentionLifetime ? ["Lifetime data retention"] : []),
                            ];
                        const href = tier.ctaHref || ("/register?tier=" + encodeURIComponent(tier.id ?? ""));

                        return (
                            <div key={tier.id ?? tier.name}
                                 className="rounded-3xl overflow-hidden transition-all hover:-translate-y-1 flex flex-col"
                                 style={{
                                     background: featured ? "linear-gradient(160deg, #075985 0%, #0F172A 100%)" : "white",
                                     border: featured ? "1px solid #0284C7" : "1px solid #E2E8F0",
                                     boxShadow: featured
                                         ? "0 24px 70px rgba(2,132,199,0.25)"
                                         : "0 1px 3px rgba(15,23,42,0.06)",
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

                                <div className="p-6 sm:p-7 flex flex-col flex-1">
                                    <h3 className="text-xl font-black mb-1"
                                        style={{ color: featured ? "white" : "#0F172A" }}>
                                        {tier.name}
                                    </h3>
                                    <p className="text-sm leading-6 mb-2"
                                       style={{ color: featured ? "rgba(255,255,255,0.68)" : "#64748B" }}>
                                        {tier.description}
                                    </p>
                                    {tier.audience && (
                                        <p className="text-xs font-bold mb-5" style={{ color: featured ? "#67E8F9" : "#0284C7" }}>
                                            {tier.audience}
                                        </p>
                                    )}

                                    <div className="mb-6">
                                        <span className="text-3xl sm:text-4xl font-black"
                                              style={{ color: featured ? "white" : "#0F172A" }}>
                                            {price === 0 ? "Free" : "MWK " + new Intl.NumberFormat("en-MW").format(price)}
                                        </span>
                                        {price > 0 && (
                                            <span className="text-sm font-semibold ml-2"
                                                  style={{ color: featured ? "rgba(255,255,255,0.55)" : "#64748B" }}>
                                                / month
                                            </span>
                                        )}
                                    </div>

                                    <Link href={href}
                                          className="block text-center py-3.5 rounded-2xl text-sm font-extrabold mb-7 transition-all"
                                          style={{
                                              background: featured
                                                  ? "linear-gradient(135deg, #0284C7, #06B6D4)"
                                                  : "linear-gradient(135deg, #0369A1, #0891B2)",
                                              color: "white",
                                              boxShadow: featured
                                                  ? "0 4px 14px rgba(2,132,199,0.35)"
                                                  : "0 4px 14px rgba(3,105,161,0.20)",
                                          }}>
                                        {tier.ctaLabel ?? (price === 0 ? "Start trial" : "Get started")}
                                    </Link>

                                    <div className="flex flex-col gap-2.5 flex-1">
                                        {featureList.slice(0, 10).map((feat: string) => (
                                            <div key={feat} className="flex items-center gap-2.5">
                                                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                                     style={{ background: featured ? "rgba(255,255,255,0.12)" : "#E0F2FE" }}>
                                                    <Check size={11}
                                                           style={{ color: featured ? "white" : "#0284C7" }} />
                                                </div>
                                                <span className="text-sm leading-5"
                                                      style={{ color: featured ? "rgba(255,255,255,0.84)" : "#475569" }}>
                                                    {feat}
                                                </span>
                                            </div>
                                        ))}
                                        {featureList.length === 0 && (
                                            <p className="text-sm" style={{ color: featured ? "rgba(255,255,255,0.45)" : "#64748B" }}>
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
                <div className="w-16 h-16 rounded-3xl mx-auto mb-6 flex items-center justify-center bg-white/10 text-cyan-100"><ShieldCheck size={30} /></div>
                <h2 className="text-4xl md:text-5xl font-black text-white mb-6"
                    style={{ letterSpacing: "-0.04em" }}>
                    {c?.cta_headline ?? "Your farm deserves"}<br />better than paper.
                </h2>
                <p className="text-xl mb-10 max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.75)" }}>
                    {c?.cta_sub ?? "Join farm teams using AgriVault to make smarter decisions, keep stronger records, and build profitable farms."}
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
                            Farm management software for practical operations.
                            Turn daily records into trusted reports.
                        </p>
                        <p className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.2)" }}>
                            Built for practical farm operations
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
        <div className="font-nunito">
            <SeoJsonLd tiers={tiers} />
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





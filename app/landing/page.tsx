"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DarkModeToggle from "@/components/DarkModeToggle";

const NAV_LINKS = ["Features", "Pricing", "Demo", "Support"];

const DEFAULT_FEATURES = [
    { id: "1", icon: "🗺", title: "Field management", description: "Map your fields, track soil types, monitor cultivatable area and land allocation in real time." },
    { id: "2", icon: "🌱", title: "Crop tracking", description: "Assign crops to fields by season, track varieties, and monitor status from planting to harvest." },
    { id: "3", icon: "📋", title: "Farm activities", description: "Log every activity with full labour, input and cost records linked to crops and seasons." },
    { id: "4", icon: "🌾", title: "Yield recording", description: "Record harvests and get automated selling price suggestions based on your actual costs." },
    { id: "5", icon: "💰", title: "Finance & reports", description: "Track income, expenses and overhead. Get detailed profitability reports per crop and season." },
    { id: "6", icon: "👷", title: "Team management", description: "Manage employees, assign them to activities, track labour days and monitor payroll costs." },
];

const FAQS = [
    { q: "Do I need any technical knowledge to use Farmio?", a: "No. Farmio is designed to be simple and intuitive. If you can use a smartphone or basic computer, you can use Farmio." },
    { q: "Can I use Farmio offline?", a: "The web app requires an internet connection. We are building an offline-capable mobile app — contact us to join the beta." },
    { q: "How is my data stored?", a: "All data is stored securely on encrypted servers. You own your data and can export it at any time." },
    { q: "Can multiple people use the same account?", a: "Professional and Enterprise plans support team accounts with role-based access." },
    { q: "What currencies does Farmio support?", a: "Farmio currently uses Malawian Kwacha (MWK). Multi-currency support is on our roadmap." },
];

function fmt(n: number) {
    return new Intl.NumberFormat("en-MW").format(Math.round(n));
}

export default function LandingPage() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [cms, setCms] = useState<Record<string, string>>({});
    const [testimonials, setTestimonials] = useState<any[]>([]);
    const [features, setFeatures] = useState<any[]>(DEFAULT_FEATURES);
    const [tiers, setTiers] = useState<any[]>([]);
    const [mediaData, setMediaData] = useState<Record<string, any>>({});
    const [loadingData, setLoadingData] = useState(true);
    const [demoForm, setDemoForm] = useState({ name: "", email: "", farm: "", message: "" });
    const [demoSent, setDemoSent] = useState(false);
    const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
    const [contactSent, setContactSent] = useState(false);

    useEffect(() => {
        Promise.all([
            fetch("/api/public/content").then((r) => r.json()),
            fetch("/api/public/tiers").then((r) => r.json()),
        ]).then(([{ content, testimonials: t, features: f, media: m }, tiers]) => {
            setCms(content ?? {});
            setTestimonials(t ?? []);
            if (f && f.length > 0) setFeatures(f);
            setTiers(tiers ?? []);
            setMediaData(m ?? {});
            setLoadingData(false);
        }).catch(() => setLoadingData(false));
    }, []);

    const c = (key: string, fallback = "") => cms[key] ?? fallback;

    const hasHeroMedia = !!(mediaData.hero_video?.url || mediaData.hero_image?.url);

    const handleDemoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch("/api/demo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(demoForm),
        });
        setDemoSent(true);
    };

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(contactForm),
        });
        setContactSent(true);
    };

    const stats = [
        { value: c("stats_users", "500+"), label: "Farms managed" },
        { value: c("stats_hectares", "12,000+"), label: "Hectares tracked" },
        { value: c("stats_uptime", "98%"), label: "Uptime guarantee" },
        { value: c("stats_rating", "4.9/5"), label: "Customer rating" },
    ];
    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white" style={{ fontFamily: "'Nunito', sans-serif" }}>

            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-100 dark:border-slate-800">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-[#1a3d1f] rounded-lg flex items-center justify-center">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <polygon points="9,2 16,14 2,14" fill="#2d6a35"/>
                                <polygon points="9,5 14,14 4,14" fill="#3d8c47"/>
                                <polygon points="9,8 12,14 6,14" fill="#52b85e"/>
                                <rect x="7.5" y="11" width="3" height="5" rx="1" fill="#1a3d1f"/>
                            </svg>
                        </div>
                        <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">farmio</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        {NAV_LINKS.map((l) => (
                            <a key={l} href={`#${l.toLowerCase()}`} className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium">{l}</a>
                        ))}
                    </div>
                    <div className="hidden md:flex items-center gap-3">
                        <DarkModeToggle variant="navbar" />
                        <Link href="/login" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors px-3 py-2 font-medium">Sign in</Link>
                        <Link href="/register" className="h-9 px-5 bg-[#1a3d1f] text-white text-sm font-bold rounded-xl hover:bg-[#2d5c35] transition-colors flex items-center">Get started</Link>
                    </div>
                    <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
                        <div className="w-5 h-0.5 bg-slate-700 dark:bg-slate-300 mb-1" />
                        <div className="w-5 h-0.5 bg-slate-700 dark:bg-slate-300 mb-1" />
                        <div className="w-5 h-0.5 bg-slate-700 dark:bg-slate-300" />
                    </button>
                </div>
                {menuOpen && (
                    <div className="md:hidden border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex flex-col gap-4 bg-white dark:bg-slate-900">
                        {NAV_LINKS.map((l) => <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMenuOpen(false)} className="text-sm text-slate-600 dark:text-slate-400 font-medium">{l}</a>)}
                        <Link href="/login" className="text-sm text-slate-600 dark:text-slate-400 font-medium">Sign in</Link>
                        <Link href="/register" className="h-10 bg-[#1a3d1f] text-white text-sm font-bold rounded-xl flex items-center justify-center">Get started free</Link>
                    </div>
                )}
            </nav>

            {/* Hero */}
            <section className="border-b border-slate-100 dark:border-slate-800 py-24 px-6 text-center relative overflow-hidden min-h-[520px] flex items-center"
                     style={!mediaData.hero_video?.url && mediaData.hero_image?.url
                         ? { backgroundImage: `url(${mediaData.hero_image.url})`, backgroundSize: "cover", backgroundPosition: "center" }
                         : {}}>
                {mediaData.hero_video?.url && (
                    <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover"
                           src={mediaData.hero_video.url} />
                )}
                {hasHeroMedia && <div className="absolute inset-0 bg-black/55" />}
                {!hasHeroMedia && <div className="absolute inset-0 bg-[#fafaf9] dark:bg-slate-900" />}

                <div className="max-w-3xl mx-auto relative z-10 w-full">
          <span className={`inline-block text-xs font-bold px-4 py-1.5 rounded-full mb-6 tracking-widest uppercase ${
              hasHeroMedia ? "bg-white/20 text-white backdrop-blur-sm" : "bg-[#eaf3de] text-[#27500a]"
          }`}>
            {c("hero_badge", "Enterprise farm management")}
          </span>
                    <h1 className={`text-5xl font-extrabold leading-tight tracking-tight mb-6 whitespace-pre-line ${
                        hasHeroMedia ? "text-white" : "text-slate-900 dark:text-white"
                    }`}>
                        {c("hero_title", "Run your farm like\na business")}
                    </h1>
                    <p className={`text-lg leading-relaxed mb-10 max-w-xl mx-auto font-medium ${
                        hasHeroMedia ? "text-white/80" : "text-slate-500 dark:text-slate-400"
                    }`}>
                        {c("hero_subtitle", "Track fields, crops, activities, yields and finances — all in one platform built for modern agriculture in Africa.")}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/register" className="h-13 px-8 bg-[#1a3d1f] text-white text-sm font-bold rounded-xl hover:bg-[#2d5c35] transition-colors flex items-center justify-center shadow-lg">
                            {c("hero_cta_primary", "Start free trial")}
                        </Link>
                        <a href="#demo" className={`h-13 px-8 text-sm font-bold rounded-xl flex items-center justify-center transition-colors ${
                            hasHeroMedia ? "border border-white/50 text-white hover:bg-white/10" : "border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}>
                            {c("hero_cta_secondary", "Book a demo")}
                        </a>
                    </div>
                    <p className={`text-xs mt-5 font-medium ${hasHeroMedia ? "text-white/50" : "text-slate-400"}`}>
                        No credit card required &middot; 14-day free trial &middot; Cancel anytime
                    </p>
                </div>
            </section>

            {/* Stats */}
            <section className="border-b border-slate-100 dark:border-slate-800 py-12 px-6 bg-white dark:bg-slate-950">
                <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {stats.map(({ value, label }) => (
                        <div key={label}>
                            <p className="text-3xl font-extrabold text-[#1a3d1f] dark:text-[#52b85e] mb-1">{value}</p>
                            <p className="text-sm text-slate-400 font-medium">{label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section id="features" className="py-24 px-6 border-b border-slate-100 dark:border-slate-800 bg-[#fafaf9] dark:bg-slate-900">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">Everything your farm needs</p>
                        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            {c("features_heading", "One platform, complete visibility")}
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {features.map(({ id, icon, title, description }: any) => (
                            <div key={id ?? title} className="p-6 border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                                <div className="text-2xl mb-4">{icon}</div>
                                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            {testimonials.length > 0 && (
                <section className="py-24 px-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-16">
                            <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">What farmers say</p>
                            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Trusted by farmers across Africa</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {testimonials.map((t) => (
                                <div key={t.id} className="p-6 border border-slate-100 dark:border-slate-800 rounded-2xl bg-[#fafaf9] dark:bg-slate-900">
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6 italic font-medium">&ldquo;{t.quote}&rdquo;</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-[#1a3d1f] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">{t.initials}</div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</p>
                                            <p className="text-xs text-slate-400">{t.role}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Pricing */}
            <section id="pricing" className="py-24 px-6 border-b border-slate-100 dark:border-slate-800 bg-[#fafaf9] dark:bg-slate-900">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">Pricing</p>
                        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">Simple, transparent pricing</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Start free, upgrade when you need more. No hidden fees.</p>
                    </div>
                    {loadingData ? (
                        <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-[#1a3d1f] border-t-transparent rounded-full animate-spin" /></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {tiers.map((tier) => (
                                <div key={tier.id} className={`bg-white dark:bg-slate-950 rounded-2xl p-7 ${
                                    tier.isFeatured ? "border-2 border-[#1a3d1f] dark:border-[#3d8c47]" : "border border-slate-200 dark:border-slate-800"
                                }`}>
                                    {tier.isFeatured && (
                                        <span className="inline-block text-xs font-bold bg-[#eaf3de] text-[#27500a] px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
                      Most popular
                    </span>
                                    )}
                                    <p className="font-bold text-slate-900 dark:text-white mb-1">{tier.name}</p>
                                    <p className="text-2xl font-extrabold text-[#1a3d1f] dark:text-[#52b85e] mb-0.5">
                                        {tier.priceMonthly === 0 ? "Free" : `MWK ${fmt(tier.priceMonthly)}`}
                                    </p>
                                    <p className="text-xs text-slate-400 mb-2 font-medium">{tier.priceMonthly === 0 ? "forever" : "per month"}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">{tier.description}</p>
                                    <div className="flex flex-col gap-2.5 mb-7">
                                        {[
                                            { key: "seasonAnalytics", label: "Season analytics" },
                                            { key: "yieldSuggestions", label: "Yield & price suggestions" },
                                            { key: "costPerHectare", label: "Cost per hectare reports" },
                                            { key: "payrollTracking", label: "Payroll tracking" },
                                            { key: "multipleFarms", label: "Multiple farms" },
                                            { key: "teamAccounts", label: "Team accounts" },
                                            { key: "customReports", label: "Custom reports & exports" },
                                            { key: "apiAccess", label: "API access" },
                                        ].filter((f) => tier[f.key]).map(({ label }) => (
                                            <div key={label} className="flex items-center gap-2.5">
                                                <div className="w-4 h-4 bg-[#eaf3de] dark:bg-green-900/30 rounded flex items-center justify-center flex-shrink-0">
                                                    <div className="w-1.5 h-1.5 bg-[#3d8c47] rounded-sm" />
                                                </div>
                                                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{label}</span>
                                            </div>
                                        ))}
                                        {tier.maxFields !== -1 && (
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-4 h-4 bg-[#eaf3de] dark:bg-green-900/30 rounded flex items-center justify-center flex-shrink-0">
                                                    <div className="w-1.5 h-1.5 bg-[#3d8c47] rounded-sm" />
                                                </div>
                                                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                          {tier.maxFields} field{tier.maxFields !== 1 ? "s" : ""}, {tier.maxCrops} crop{tier.maxCrops !== 1 ? "s" : ""}
                        </span>
                                            </div>
                                        )}
                                        {tier.dataRetentionLifetime && (
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-4 h-4 bg-[#eaf3de] dark:bg-green-900/30 rounded flex items-center justify-center flex-shrink-0">
                                                    <div className="w-1.5 h-1.5 bg-[#3d8c47] rounded-sm" />
                                                </div>
                                                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Lifetime data retention</span>
                                            </div>
                                        )}
                                    </div>
                                    <Link href={tier.priceMonthly === 0 ? "/register" : "/register"}
                                          className={`block w-full h-11 rounded-xl text-sm font-bold flex items-center justify-center transition-colors ${
                                              tier.isFeatured
                                                  ? "bg-[#1a3d1f] text-white hover:bg-[#2d5c35]"
                                                  : "border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                          }`}>
                                        {tier.priceMonthly === 0 ? "Get started free" : tier.priceMonthly > 0 ? "Start 14-day trial" : "Contact sales"}
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Demo */}
            <section id="demo" className="py-24 px-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
                    <div>
                        <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">Live demo</p>
                        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-5 leading-tight">See Farmio in action</h2>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-8 text-sm font-medium">
                            Book a personalised 30-minute demo. We&apos;ll walk you through the platform using your own farm&apos;s context.
                        </p>
                        <div className="flex flex-col gap-4">
                            {[
                                { icon: "🕐", title: "30-minute session", sub: "Live walkthrough with a product specialist" },
                                { icon: "🌍", title: "Remote or in person", sub: "We cover Lilongwe, Blantyre and Mzuzu" },
                                { icon: "🎯", title: "Tailored to your farm", sub: "We configure a demo around your crops and fields" },
                            ].map(({ icon, title, sub }) => (
                                <div key={title} className="flex items-start gap-3">
                                    <div className="w-9 h-9 bg-[#eaf3de] dark:bg-green-900/30 rounded-xl flex items-center justify-center text-base flex-shrink-0">{icon}</div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p>
                                        <p className="text-xs text-slate-400 mt-0.5 font-medium">{sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-[#fafaf9] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-7">
                        {demoSent ? (
                            <div className="text-center py-8">
                                <div className="text-4xl mb-4">✅</div>
                                <p className="font-bold text-slate-900 dark:text-white mb-2">Demo request received!</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Our team will contact you within 24 hours.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleDemoSubmit} className="flex flex-col gap-4">
                                <p className="font-bold text-slate-900 dark:text-white mb-1">Book your demo</p>
                                {[
                                    { key: "name", label: "Full name", placeholder: "John Banda" },
                                    { key: "email", label: "Email address", placeholder: "john@farm.com", type: "email" },
                                    { key: "farm", label: "Farm or organisation name", placeholder: "Sunrise Estates" },
                                ].map(({ key, label, placeholder, type }) => (
                                    <div key={key}>
                                        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-semibold">{label}</label>
                                        <input type={type ?? "text"} placeholder={placeholder} value={demoForm[key as keyof typeof demoForm]}
                                               onChange={(e) => setDemoForm((f) => ({ ...f, [key]: e.target.value }))} required
                                               className="w-full h-11 px-4 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-slate-400 dark:text-white transition-colors" />
                                    </div>
                                ))}
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-semibold">Tell us about your farm (optional)</label>
                                    <textarea rows={3} placeholder="Crops you grow, hectares, number of employees..."
                                              value={demoForm.message} onChange={(e) => setDemoForm((f) => ({ ...f, message: e.target.value }))}
                                              className="w-full px-4 py-3 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-slate-400 dark:text-white transition-colors resize-none" />
                                </div>
                                <button type="submit" className="h-11 bg-[#1a3d1f] text-white text-sm font-bold rounded-xl hover:bg-[#2d5c35] transition-colors">
                                    Request demo
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-24 px-6 border-b border-slate-100 dark:border-slate-800 bg-[#fafaf9] dark:bg-slate-900">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">FAQ</p>
                        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Common questions</h2>
                    </div>
                    <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
                        {FAQS.map(({ q, a }, i) => (
                            <div key={q} className="py-5">
                                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between text-left">
                                    <span className="text-sm font-bold text-slate-900 dark:text-white pr-4">{q}</span>
                                    <span className="text-slate-400 flex-shrink-0 text-lg leading-none">{openFaq === i ? "−" : "+"}</span>
                                </button>
                                {openFaq === i && <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-3 font-medium">{a}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Support */}
            <section id="support" className="py-24 px-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">Support</p>
                        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">We&apos;re here to help</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                        {[
                            { icon: "📧", title: "Email support", sub: c("contact_email", "support@farmio.app"), cta: "Send email", href: `mailto:${c("contact_email", "support@farmio.app")}` },
                            { icon: "📞", title: "Phone support", sub: c("contact_phone", "+265 999 000 001"), cta: "Call us", href: `tel:${c("contact_phone", "+265999000001").replace(/\s/g, "")}` },
                            { icon: "💬", title: "WhatsApp", sub: c("contact_whatsapp", "+265 999 000 002"), cta: "Message us", href: `https://wa.me/${c("contact_whatsapp", "+265999000002").replace(/[\s+]/g, "")}` },
                        ].map(({ icon, title, sub, cta, href }) => (
                            <div key={title} className="p-6 border border-slate-100 dark:border-slate-800 rounded-2xl bg-[#fafaf9] dark:bg-slate-900 text-center">
                                <div className="text-3xl mb-4">{icon}</div>
                                <p className="font-bold text-slate-900 dark:text-white mb-1">{title}</p>
                                <p className="text-sm text-[#1a3d1f] dark:text-[#52b85e] font-bold mb-5">{sub}</p>
                                <a href={href} className="inline-flex items-center h-9 px-5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors">{cta}</a>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
                        <div>
                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-4">Send us a message</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 font-medium">
                                For sales inquiries, enterprise pricing or partnerships — fill in the form and we&apos;ll get back to you within one business day.
                            </p>
                            <div className="flex flex-col gap-3">
                                {[
                                    { icon: "🏢", text: c("contact_address", "Farmio Ltd, Lilongwe, Malawi") },
                                    { icon: "🌐", text: c("contact_website", "www.farmio.app") },
                                    { icon: "📧", text: c("contact_email", "hello@farmio.app") },
                                ].map(({ icon, text }) => (
                                    <div key={text} className="flex items-center gap-3">
                                        <span className="text-base">{icon}</span>
                                        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-[#fafaf9] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-7">
                            {contactSent ? (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-4">✅</div>
                                    <p className="font-bold text-slate-900 dark:text-white mb-2">Message sent!</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">We&apos;ll get back to you within one business day.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleContactSubmit} className="flex flex-col gap-4">
                                    {[
                                        { key: "name", label: "Full name", placeholder: "Your name" },
                                        { key: "email", label: "Email", placeholder: "you@example.com", type: "email" },
                                    ].map(({ key, label, placeholder, type }) => (
                                        <div key={key}>
                                            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-semibold">{label}</label>
                                            <input type={type ?? "text"} placeholder={placeholder} value={contactForm[key as keyof typeof contactForm]}
                                                   onChange={(e) => setContactForm((f) => ({ ...f, [key]: e.target.value }))} required
                                                   className="w-full h-11 px-4 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-slate-400 dark:text-white transition-colors" />
                                        </div>
                                    ))}
                                    <div>
                                        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-semibold">Message</label>
                                        <textarea rows={4} placeholder="How can we help?" value={contactForm.message}
                                                  onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))} required
                                                  className="w-full px-4 py-3 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-slate-400 dark:text-white transition-colors resize-none" />
                                    </div>
                                    <button type="submit" className="h-11 bg-[#1a3d1f] text-white text-sm font-bold rounded-xl hover:bg-[#2d5c35] transition-colors">
                                        Send message
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-[#1a3d1f] py-20 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl font-extrabold text-white tracking-tight mb-4">Ready to modernise your farm?</h2>
                    <p className="text-[#7dd68a] mb-10 text-sm leading-relaxed font-medium">
                        Join hundreds of farms already using Farmio to track costs, improve yields and make better decisions every season.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/register" className="h-12 px-8 bg-white text-[#1a3d1f] text-sm font-extrabold rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center">
                            Start your free trial
                        </Link>
                        <a href="#demo" className="h-12 px-8 border border-white/30 text-white text-sm font-bold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center">
                            Book a demo
                        </a>
                    </div>
                    <p className="text-[#4a7a50] text-xs mt-6 font-medium">No credit card required &middot; 14-day free trial &middot; Cancel anytime</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#111d13] py-12 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
                        <div className="col-span-2 md:col-span-1">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-7 h-7 bg-[#1a3d1f] border border-[#2d5c35] rounded-lg flex items-center justify-center">
                                    <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                                        <polygon points="9,2 16,14 2,14" fill="#2d6a35"/>
                                        <polygon points="9,5 14,14 4,14" fill="#3d8c47"/>
                                        <polygon points="9,8 12,14 6,14" fill="#52b85e"/>
                                        <rect x="7.5" y="11" width="3" height="5" rx="1" fill="#1a3d1f"/>
                                    </svg>
                                </div>
                                <span className="font-extrabold text-white">farmio</span>
                            </div>
                            <p className="text-xs text-[#4a7a50] leading-relaxed font-medium">
                                {c("footer_tagline", "Modern farm management for African agriculture. Built in Malawi.")}
                            </p>
                        </div>
                        {[
                            { heading: "Product", links: [
                                    { label: "Features", href: "#features" },
                                    { label: "Pricing", href: "#pricing" },
                                    { label: "Changelog", href: "/changelog" },
                                    { label: "Roadmap", href: "/roadmap" },
                                ]},
                            { heading: "Company", links: [
                                    { label: "About", href: "/about" },
                                    { label: "Blog", href: "/blog" },
                                    { label: "Careers", href: "/careers" },
                                    { label: "Press", href: "/press" },
                                ]},
                            { heading: "Legal", links: [
                                    { label: "Privacy policy", href: "/privacy" },
                                    { label: "Terms of service", href: "/terms" },
                                    { label: "Security", href: "/security" },
                                    { label: "Support", href: "/support" },
                                ]},
                        ].map(({ heading, links }) => (
                            <div key={heading}>
                                <p className="text-xs font-extrabold text-white mb-4">{heading}</p>
                                <div className="flex flex-col gap-2.5">
                                    {links.map(({ label, href }) => (
                                        <Link key={label} href={href} className="text-xs text-[#4a7a50] hover:text-[#7dd68a] transition-colors font-medium">{label}</Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-[#1a3d1f] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-xs text-[#4a7a50] font-medium">© 2025 Farmio Ltd. All rights reserved.</p>
                        <div className="flex items-center gap-6">
                            {[
                                { label: "Privacy", href: "/privacy" },
                                { label: "Terms", href: "/terms" },
                                { label: "Security", href: "/security" },
                                { label: "Support", href: "/support" },
                            ].map(({ label, href }) => (
                                <Link key={label} href={href} className="text-xs text-[#4a7a50] hover:text-[#7dd68a] transition-colors font-medium">{label}</Link>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
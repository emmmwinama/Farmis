"use client";

import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useEffect, useState} from "react";
import Link from "next/link";

export default function PitchPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/public/pitch")
            .then((r) => r.json())
            .then((d) => {
                setData(d);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen" style={{background: "#F7F6F2"}}>
                <div className="flex flex-col items-center gap-3">
                    <div className="text-4xl">🌾</div>
                    <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                         style={{borderColor: "#1a3d1f", borderTopColor: "transparent"}}/>
                </div>
            </div>
        );
    }

    const sections = data?.sections ?? {};
    const tiers = data?.tiers ?? [];
    const impactStats = data?.impactStats ?? [];
    const testimonials = data?.testimonials ?? [];
    const features = data?.features ?? [];

    // Helper to safely get section content
    const get = (key: string) => sections[key]?.content ?? {};

    const hook = get("hook");
    const problem = get("problem");
    const solution = get("solution");
    const market = get("market");
    const model = get("model");
    const traction = get("traction");
    const ask = get("ask");

    return (
        <div style={{fontFamily: "var(--font-nunito), system-ui, sans-serif", background: "#F7F6F2"}}>

            {/* Nav */}
            <nav className="sticky top-0 z-50 px-8 h-14 flex items-center justify-between"
                 style={{
                     background: "rgba(247,246,242,0.95)",
                     backdropFilter: "blur(12px)",
                     borderBottom: "1px solid #E8E4DC"
                 }}>
                <Link href="/landing" className="text-sm font-bold" style={{color: "#1a3d1f"}}>← Back to Farmio</Link>
                <a href={`mailto:${ask.contact?.email ?? "invest@farmio.app"}`}
                   className="px-5 py-2 rounded-xl text-sm font-black text-white"
                   style={{background: "linear-gradient(135deg, #1a3d1f, #2d6a35)"}}>
                    Request full deck
                </a>
            </nav>

            <div className="max-w-4xl mx-auto px-6 py-16">

                {/* Cover */}
                <div className="rounded-3xl p-12 mb-8 text-center relative overflow-hidden"
                     style={{background: "linear-gradient(135deg, #1a3d1f 0%, #0f2411 100%)"}}>
                    <div className="relative">
                        <div className="text-6xl mb-4">🌾</div>
                        <h1 className="text-5xl font-black text-white mb-4"
                            style={{letterSpacing: "-0.04em"}}>Farmio</h1>
                        <p className="text-xl text-white/70 mb-2">The Farm Management Operating System for Africa</p>
                        <p className="text-sm text-white/40">Lilongwe, Malawi · {new Date().getFullYear()} ·
                            farmio.app</p>
                    </div>
                </div>

                {/* Hook */}
                <PSection number="01" title={sections.hook?.title ?? "The Hook"} accent="#D97706">
                    <div className="rounded-2xl p-7 border-l-4"
                         style={{background: "#F7F6F2", borderLeftColor: "#1a3d1f"}}>
                        <p className="text-xl font-semibold leading-relaxed" style={{color: "#1C1917"}}>
                            {hook.headline ?? "Every year, Malawian farmers collectively lose over MWK 2.1 trillion in potential income"}
                        </p>
                    </div>
                    <p className="text-lg leading-relaxed" style={{color: "#57534E"}}>
                        {hook.subline ?? "Not from bad weather — but from not knowing their numbers."}
                    </p>
                    <p className="text-lg font-bold" style={{color: "#1C1917"}}>
                        {hook.solution ?? "Farmio solves all of this. In one app. For any smartphone."}
                    </p>
                </PSection>

                {/* Problem */}
                <PSection number="02" title={sections.problem?.title ?? "The Problem"} accent="#DC2626">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {(problem.points ?? impactStats.slice(0, 3).map((s: any) => ({
                            stat: s.value,
                            desc: s.label,
                            source: s.source
                        }))).map((p: any, i: number) => (
                            <div key={i} className="rounded-2xl p-5"
                                 style={{
                                     background: i === 0 ? "#FFF1F2" : i === 1 ? "#FFFBEB" : "#EFF6FF",
                                     border: "1px solid #E8E4DC"
                                 }}>
                                <p className="text-4xl font-black mb-2" style={{color: "#DC2626"}}>{p.stat}</p>
                                <p className="text-sm font-semibold leading-snug mb-2"
                                   style={{color: "#1C1917"}}>{p.desc}</p>
                                {p.source &&
                                    <p className="text-[10px]" style={{color: "#A8A29E"}}>Source: {p.source}</p>}
                            </div>
                        ))}
                    </div>
                </PSection>

                {/* Solution */}
                <PSection number="03" title={sections.solution?.title ?? "The Solution"} accent="#16A34A">
                    <div className="rounded-2xl p-7 border-l-4"
                         style={{background: "#F7F6F2", borderLeftColor: "#1a3d1f"}}>
                        <p className="text-xl font-semibold leading-relaxed" style={{color: "#1C1917"}}>
                            {solution.headline ?? "Farmio is a farm management operating system built for African agriculture"}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {(solution.features ?? features.map((f: any) => f.title)).map((feat: string) => (
                            <div key={feat} className="rounded-xl p-4 flex items-start gap-3"
                                 style={{background: "#EBF5EC", border: "1px solid #BBF7D0"}}>
                                <span className="text-green-600 font-black">✓</span>
                                <p className="text-sm font-semibold" style={{color: "#14532D"}}>{feat}</p>
                            </div>
                        ))}
                    </div>
                </PSection>

                {/* Market */}
                <PSection number="04" title={sections.market?.title ?? "Market Opportunity"} accent="#2563EB">
                    <div className="grid grid-cols-3 gap-5">
                        {[
                            market.tam ?? {
                                value: "$2.4B",
                                label: "Total Addressable Market",
                                desc: "Agricultural SaaS in sub-Saharan Africa by 2027"
                            },
                            market.sam ?? {
                                value: "$180M",
                                label: "Serviceable Market",
                                desc: "Malawi, Zambia, Zimbabwe, Tanzania"
                            },
                            market.som ?? {
                                value: "$4.2M",
                                label: "Obtainable (Year 1–3)",
                                desc: "12,000 paying farms in Malawi"
                            },
                        ].map((m: any, i: number) => (
                            <div key={i} className="rounded-2xl p-6 text-center"
                                 style={{
                                     background: i === 0 ? "#EFF6FF" : i === 1 ? "#F0FDF4" : "#FFFBEB",
                                     border: "1px solid #E8E4DC"
                                 }}>
                                <p className="text-xs font-black uppercase tracking-widest mb-1"
                                   style={{color: i === 0 ? "#2563EB" : i === 1 ? "#16A34A" : "#D97706"}}>
                                    {i === 0 ? "TAM" : i === 1 ? "SAM" : "SOM"}
                                </p>
                                <p className="text-xs mb-2" style={{color: "#A8A29E"}}>{m.label}</p>
                                <p className="text-4xl font-black mb-2" style={{color: "#1C1917"}}>{m.value}</p>
                                <p className="text-xs" style={{color: "#57534E"}}>{m.desc}</p>
                            </div>
                        ))}
                    </div>
                </PSection>

                {/* Business model */}
                <PSection number="05" title={sections.model?.title ?? "Business Model"} accent="#9333EA">
                    <div className="grid grid-cols-2 gap-4">
                        {(model.streams ?? [
                            {
                                name: "SaaS Subscriptions",
                                icon: "💳",
                                status: "Live",
                                desc: "Monthly/annual subscriptions across three tiers"
                            },
                            {
                                name: "Credit Score API",
                                icon: "🏦",
                                status: "2025",
                                desc: "License to banks and MFIs as underwriting tool"
                            },
                            {
                                name: "Market Data",
                                icon: "📊",
                                status: "2025",
                                desc: "Anonymised data to traders and government"
                            },
                            {
                                name: "Input Marketplace",
                                icon: "🛒",
                                status: "2026",
                                desc: "Commission marketplace for farm inputs"
                            },
                        ]).map((s: any) => (
                            <div key={s.name} className="rounded-2xl p-5"
                                 style={{background: "#EBF5EC", border: "1px solid #E8E4DC"}}>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">{s.icon}</span>
                                    <p className="text-sm font-extrabold" style={{color: "#1C1917"}}>{s.name}</p>
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full ml-auto"
                                          style={{
                                              background: s.status === "Live" ? "#1a3d1f" : "#E8E4DC",
                                              color: s.status === "Live" ? "white" : "#57534E"
                                          }}>
                    {s.status}
                  </span>
                                </div>
                                <p className="text-sm" style={{color: "#57534E"}}>{s.desc}</p>
                            </div>
                        ))}
                    </div>

                    {model.unitEconomics && (
                        <div className="rounded-2xl p-6" style={{background: "#1C1917"}}>
                            <p className="text-sm font-black text-white mb-4">Unit Economics</p>
                            <div className="grid grid-cols-4 gap-4">
                                {[
                                    {label: "ARPU/month", value: model.unitEconomics.arpu ?? "MWK 8,400"},
                                    {label: "CAC", value: model.unitEconomics.cac ?? "MWK 15,000"},
                                    {label: "LTV", value: model.unitEconomics.ltv ?? "MWK 302,400"},
                                    {label: "LTV/CAC", value: model.unitEconomics.ltvCac ?? "20x"},
                                ].map(({label, value}) => (
                                    <div key={label} className="text-center">
                                        <p className="text-xs mb-1" style={{color: "rgba(255,255,255,0.4)"}}>{label}</p>
                                        <p className="text-xl font-black" style={{color: "#4ade80"}}>{value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </PSection>

                {/* Traction */}
                <PSection number="06" title={sections.traction?.title ?? "Traction & Validation"} accent="#D97706">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(traction.metrics ?? [
                            {metric: "500+", label: "Farms registered"},
                            {metric: "12,000+", label: "Hectares tracked"},
                            {metric: "94%", label: "30-day retention"},
                            {metric: "4.8/5", label: "User satisfaction"},
                        ]).map((m: any) => (
                            <div key={m.label} className="rounded-2xl p-5 text-center"
                                 style={{background: "#FEF3C7", border: "1px solid #FDE68A"}}>
                                <p className="text-3xl font-black mb-1" style={{color: "#D97706"}}>{m.metric}</p>
                                <p className="text-xs font-semibold" style={{color: "#92400E"}}>{m.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="rounded-2xl p-6" style={{background: "white", border: "1px solid #E8E4DC"}}>
                        <p className="text-sm font-black mb-4" style={{color: "#1C1917"}}>Key milestones</p>
                        <div className="flex flex-col gap-3">
                            {(traction.milestones ?? []).map((m: any) => (
                                <div key={m.date} className="flex items-start gap-3">
                  <span className="text-xs font-black px-2.5 py-1 rounded-lg flex-shrink-0"
                        style={{
                            background: m.date === "Now" ? "#1a3d1f" : "#EBF5EC",
                            color: m.date === "Now" ? "white" : "#14532D",
                        }}>
                    {m.date}
                  </span>
                                    <p className="text-sm" style={{color: "#57534E"}}>{m.event}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Testimonials in pitch */}
                    {testimonials.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {testimonials.slice(0, 2).map((t: any) => (
                                <div key={t.id} className="rounded-2xl p-5"
                                     style={{background: "#F7F6F2", border: "1px solid #E8E4DC"}}>
                                    <p className="text-sm italic leading-relaxed mb-3" style={{color: "#57534E"}}>
                                        &ldquo;{t.content}&rdquo;
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{t.avatar ?? "👨🏿‍🌾"}</span>
                                        <div>
                                            <p className="text-xs font-bold" style={{color: "#1C1917"}}>{t.name}</p>
                                            <p className="text-[10px]"
                                               style={{color: "#A8A29E"}}>{t.role}{t.company ? ` · ${t.company}` : ""}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </PSection>

                {/* Pricing tiers in pitch */}
                {tiers.length > 0 && (
                    <PSection number="07" title="Pricing" accent="#16A34A">
                        <div className="grid grid-cols-3 gap-4">
                            {tiers.map((tier: { id: Key | null | undefined; isFeatured: any; name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; monthlyPrice: number; description: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }) => (
                                <div key={tier.id} className="rounded-2xl p-5"
                                     style={{
                                         background: tier.isFeatured ? "#1C1917" : "white",
                                         border:     `1.5px solid ${tier.isFeatured ? "#3d8c47" : "#E8E4DC"}`,
                                     }}>
                                    <p className="text-base font-black mb-1" style={{ color: tier.isFeatured ? "white" : "#1C1917" }}>
                                        {tier.name}
                                    </p>
                                    <p className="text-2xl font-black mb-3" style={{ color: tier.isFeatured ? "#4ade80" : "#1a3d1f" }}>
                                        {tier.monthlyPrice === 0 ? "Free" : `MWK ${(tier.monthlyPrice / 100).toLocaleString()}/mo`}
                                    </p>
                                    <p className="text-xs" style={{ color: tier.isFeatured ? "rgba(255,255,255,0.6)" : "#57534E" }}>
                                        {tier.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </PSection>
                )}

                {/* The Ask */}
                <PSection number="08" title={sections.ask?.title ?? "The Ask"} accent="#1a3d1f">
                    <div className="rounded-3xl p-10"
                         style={{ background: "linear-gradient(135deg, #1a3d1f 0%, #0f2411 100%)" }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
                                    We are raising
                                </p>
                                <p className="text-5xl font-black text-white mb-2">{ask.amount ?? "$250,000"}</p>
                                <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
                                    {ask.type ?? "Seed round · Convertible note or equity"} · {ask.runway ?? "18-month runway"}
                                </p>

                                <div className="flex flex-col gap-3">
                                    {(ask.useOfFunds ?? []).map((u: any) => (
                                        <div key={u.use}>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span style={{ color: "rgba(255,255,255,0.7)" }}>{u.use}</span>
                                                <span className="font-black" style={{ color: "#4ade80" }}>{u.amount} ({u.pct}%)</span>
                                            </div>
                                            <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
                                                <div className="h-full rounded-full"
                                                     style={{ width: `${u.pct}%`, background: "linear-gradient(90deg, #4ade80, #16a34a)" }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
                                    This unlocks
                                </p>
                                <div className="flex flex-col gap-2.5 mb-8">
                                    {(ask.unlocks ?? []).map((item: string) => (
                                        <div key={item} className="flex items-center gap-2.5">
                                            <span className="text-green-400 text-xs">✓</span>
                                            <p className="text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>{item}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <a href={`mailto:${ask.contact?.email ?? "invest@farmio.app"}`}
                                       className="flex items-center justify-center py-4 rounded-2xl text-sm font-black"
                                       style={{ background: "linear-gradient(135deg, #D97706, #F59E0B)", color: "white" }}>
                                        📧 {ask.contact?.email ?? "invest@farmio.app"}
                                    </a>
                                    <a href={`tel:${ask.contact?.phone ?? "+265999000000"}`}
                                       className="flex items-center justify-center py-3 rounded-2xl text-sm font-bold"
                                       style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "white" }}>
                                        📞 {ask.contact?.phone ?? "+265 999 000 000"}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </PSection>

                {/* Footer */}
                <div className="rounded-3xl p-10 text-center"
                     style={{ background: "#EBF5EC", border: "1.5px solid #BBF7D0" }}>
                    <p className="text-3xl font-black mb-3" style={{ color: "#1a3d1f" }}>
                        Let&apos;s build the future of African farming together.
                    </p>
                    <p className="text-base mb-8" style={{ color: "#166534" }}>
                        We&apos;re looking for investors and partners who believe Africa&apos;s agricultural
                        transformation starts with data.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        {[
                            { label: `📧 ${ask.contact?.email ?? "invest@farmio.app"}`, href: `mailto:${ask.contact?.email ?? "invest@farmio.app"}` },
                            { label: `📞 ${ask.contact?.phone ?? "+265 999 000 000"}`, href: `tel:${ask.contact?.phone ?? "+265999000000"}` },
                            { label: "🌐 farmio.app", href: "https://farmio.app" },
                        ].map(({ label, href }) => (
                            <a key={label} href={href}
                               className="px-6 py-3 rounded-2xl text-sm font-bold"
                               style={{ background: "white", border: "1.5px solid #BBF7D0", color: "#1a3d1f" }}>
                                {label}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function PSection({ number, title, accent, children }: {
    number: string; title: string; accent: string; children: React.ReactNode;
}) {
    return (
        <div className="mb-10">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                     style={{ background: accent }}>
                    {number}
                </div>
                <h2 className="text-2xl font-black" style={{ color: "#1C1917", letterSpacing: "-0.03em" }}>{title}</h2>
                <div className="flex-1 h-px" style={{ background: "#E8E4DC" }} />
            </div>
            <div className="flex flex-col gap-5">{children}</div>
        </div>
    );
}
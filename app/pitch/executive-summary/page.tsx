"use client";

export default function ExecutiveSummaryPage() {
    return (
        <div className="min-h-screen p-8 max-w-4xl mx-auto"
             style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif", background: "#F7F6F2" }}>

            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-black" style={{ color: "#1C1917" }}>Executive Summary</h1>
                <button onClick={() => window.print()}
                        className="px-5 py-2.5 rounded-xl text-sm font-black text-white"
                        style={{ background: "linear-gradient(135deg, #1a3d1f, #2d6a35)" }}>
                    Download PDF
                </button>
            </div>

            <div className="rounded-3xl overflow-hidden shadow-lg"
                 style={{ background: "white", border: "1px solid #E8E4DC" }}>

                {/* Header */}
                <div className="p-8 text-center"
                     style={{ background: "linear-gradient(135deg, #1a3d1f, #0f2411)" }}>
                    <div className="text-4xl mb-3">🌾</div>
                    <h1 className="text-3xl font-black text-white mb-1">Farmio</h1>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                        Executive Summary · Seed Round · {new Date().getFullYear()}
                    </p>
                </div>

                <div className="p-8 grid grid-cols-1 gap-8">

                    {/* Core proposition */}
                    <div className="rounded-2xl p-6"
                         style={{ background: "#EBF5EC", border: "1.5px solid #BBF7D0" }}>
                        <p className="text-sm font-black mb-2" style={{ color: "#14532D" }}>What we do</p>
                        <p className="text-lg font-semibold leading-relaxed" style={{ color: "#1C1917" }}>
                            Farmio is a farm management SaaS platform built for African agriculture. We replace paper records
                            with a digital system that tracks crops, costs, yields and livestock — and turns farm data into
                            credit scores, market intelligence and funding access.
                        </p>
                    </div>

                    {/* Key numbers grid */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: "Market (Malawi SAM)", value: "$180M", sub: "Farm management software" },
                            { label: "Current ARR",          value: "MWK 69M",  sub: "Growing 40% MoM" },
                            { label: "Raising",              value: "$250K",    sub: "Seed round" },
                        ].map(({ label, value, sub }) => (
                            <div key={label} className="rounded-xl p-5 text-center"
                                 style={{ background: "#F7F6F2", border: "1px solid #E8E4DC" }}>
                                <p className="text-3xl font-black mb-1" style={{ color: "#1a3d1f" }}>{value}</p>
                                <p className="text-xs font-black" style={{ color: "#1C1917" }}>{label}</p>
                                <p className="text-[10px]" style={{ color: "#A8A29E" }}>{sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* Problem + solution in 2 cols */}
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <p className="text-sm font-black mb-3" style={{ color: "#DC2626" }}>❌ The problem</p>
                            <ul className="flex flex-col gap-2 text-sm" style={{ color: "#57534E" }}>
                                {[
                                    "67% of Malawian farmers have no financial records",
                                    "89% of farmer loan applications are rejected",
                                    "No locally-built, locally-priced solution exists",
                                    "MWK 2.1T in income lost to poor market timing",
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-2">
                                        <span style={{ color: "#DC2626" }}>•</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <p className="text-sm font-black mb-3" style={{ color: "#16A34A" }}>✓ Our solution</p>
                            <ul className="flex flex-col gap-2 text-sm" style={{ color: "#57534E" }}>
                                {[
                                    "Complete digital farm management in one app",
                                    "ADMARC market prices + sell timing recommendations",
                                    "Farm credit score & bank-ready loan reports",
                                    "GPS field mapping + AI-powered insights",
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-2">
                                        <span style={{ color: "#16A34A" }}>✓</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Traction */}
                    <div>
                        <p className="text-sm font-black mb-3" style={{ color: "#1C1917" }}>Traction</p>
                        <div className="grid grid-cols-4 gap-3">
                            {[
                                { value: "500+",  label: "Farms" },
                                { value: "12K+",  label: "Ha tracked" },
                                { value: "94%",   label: "Retention" },
                                { value: "4.8★",  label: "Rating" },
                            ].map(({ value, label }) => (
                                <div key={label} className="rounded-xl p-4 text-center"
                                     style={{ background: "#FEF3C7", border: "1px solid #FDE68A" }}>
                                    <p className="text-2xl font-black" style={{ color: "#D97706" }}>{value}</p>
                                    <p className="text-xs" style={{ color: "#92400E" }}>{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Business model */}
                    <div className="rounded-2xl p-5" style={{ background: "#1C1917" }}>
                        <p className="text-sm font-black text-white mb-3">Revenue model</p>
                        <div className="grid grid-cols-3 gap-3 text-xs">
                            {[
                                { stream: "SaaS subscriptions", status: "Live", color: "#4ade80" },
                                { stream: "Credit score API licensing", status: "2025", color: "#FCD34D" },
                                { stream: "Input marketplace", status: "2026", color: "#93C5FD" },
                            ].map(({ stream, status, color }) => (
                                <div key={stream} className="rounded-xl p-3"
                                     style={{ background: "rgba(255,255,255,0.06)" }}>
                                    <p className="font-bold text-white mb-1">{stream}</p>
                                    <span className="font-black px-2 py-0.5 rounded-full text-[10px]"
                                          style={{ background: `${color}20`, color }}>
                    {status}
                  </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="text-center py-4">
                        <p className="font-black text-lg mb-2" style={{ color: "#1C1917" }}>
                            Contact us
                        </p>
                        <p style={{ color: "#57534E" }}>
                            invest@farmio.app · +265 999 000 000 · farmio.app
                        </p>
                        <p className="text-xs mt-2" style={{ color: "#A8A29E" }}>
                            Farmio · Lilongwe, Malawi · Incorporated under Malawi Companies Act
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
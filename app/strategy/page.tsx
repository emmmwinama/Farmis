import Link from "next/link";

export default function StrategyPage() {
    return (
        <div style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif", background: "#F7F6F2", minHeight: "100vh" }}>

            <nav className="sticky top-0 z-50 px-8 h-14 flex items-center justify-between"
                 style={{ background: "rgba(247,246,242,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E8E4DC" }}>
                <Link href="/landing" className="text-sm font-bold" style={{ color: "#1a3d1f" }}>← Back to Farmio</Link>
                <div className="flex gap-3">
                    <Link href="/pitch" className="px-4 py-2 rounded-xl text-sm font-bold"
                          style={{ background: "#EBF5EC", color: "#1a3d1f", border: "1px solid #BBF7D0" }}>
                        Investor pitch
                    </Link>
                    <a href="mailto:invest@farmio.app"
                       className="px-5 py-2 rounded-xl text-sm font-black text-white"
                       style={{ background: "linear-gradient(135deg, #1a3d1f, #2d6a35)" }}>
                        Get in touch
                    </a>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-6 py-16">

                {/* Header */}
                <div className="rounded-3xl p-12 mb-10 text-center relative overflow-hidden"
                     style={{ background: "linear-gradient(135deg, #1a3d1f 0%, #0f2411 100%)" }}>
                    <div className="relative">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
                             style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <span className="text-xs font-black uppercase tracking-widest text-white/60">
                Commercial Strategy · {new Date().getFullYear()}
              </span>
                        </div>
                        <h1 className="text-4xl font-black text-white mb-3" style={{ letterSpacing: "-0.04em" }}>
                            The Farmio Go-to-Market Playbook
                        </h1>
                        <p className="text-lg text-white/60 max-w-2xl mx-auto">
                            A complete commercial and funding strategy for scaling Farmio from Malawi to southern Africa
                        </p>
                    </div>
                </div>

                {/* Executive summary */}
                <StratSection title="Executive Summary" number="00" accent="#1a3d1f">
                    <div className="rounded-2xl p-7" style={{ background: "#EBF5EC", border: "1.5px solid #BBF7D0" }}>
                        <p className="text-lg font-semibold leading-relaxed" style={{ color: "#14532D" }}>
                            Farmio is a SaaS farm management platform targeting Malawi&apos;s 1.8 million smallholder farming
                            households and 45,000+ commercial farms. We will reach 10,000 paying farms within 18 months of
                            seed funding through a district-by-district expansion model, agricultural extension officer
                            partnerships and financial institution integrations. We are simultaneously pursuing development
                            funding from international funders to subsidize access for the smallest farmers while building
                            a profitable commercial business on top.
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { metric: "MWK 9,900/mo", label: "Standard plan price" },
                            { metric: "18 months",    label: "To 10,000 paying farms" },
                            { metric: "$250K",        label: "Seed ask" },
                        ].map(({ metric, label }) => (
                            <div key={label} className="rounded-2xl p-5 text-center"
                                 style={{ background: "white", border: "1px solid #E8E4DC" }}>
                                <p className="text-2xl font-black mb-1" style={{ color: "#1a3d1f" }}>{metric}</p>
                                <p className="text-xs font-semibold" style={{ color: "#A8A29E" }}>{label}</p>
                            </div>
                        ))}
                    </div>
                </StratSection>

                {/* Phase 0 */}
                <StratSection title="Phase 0 — Foundation (Months 1–3)" number="01" accent="#1a3d1f">
                    <PhaseCard
                        goal="Prove the model. Achieve zero churn. Build the impact case."
                        color="#EBF5EC"
                        border="#BBF7D0"
                        items={[
                            {
                                title:  "50 anchor farms — white-glove onboarding",
                                detail: "Personally onboard 50 medium-to-large farms (5–50 ha) in Lilongwe district. These are the highest-value early adopters who can pay Standard tier immediately and have the complexity to showcase all features. Daily WhatsApp support. Weekly farm visits.",
                            },
                            {
                                title:  "Document every outcome",
                                detail: "Track before/after for every farm: cost per hectare, income, credit score change, market timing. This data becomes our funder pitch, our sales case and our product validation. Aim for at least 3 farms with measurable loan access improvement.",
                            },
                            {
                                title:  "Zero churn target",
                                detail: "No cancellations in Month 1–3. Every churning farm is a product failure signal. Respond to every issue within 2 hours. Monthly business reviews with each anchor farm.",
                            },
                            {
                                title:  "Hire 2 Field Customer Success Officers",
                                detail: "Based in Lilongwe and Kasungu. These are agricultural graduates who visit farms, train farmers, troubleshoot and gather testimonials. They are the difference between 60% and 94% retention.",
                            },
                        ]}
                    />
                    <MetricTarget label="End of Phase 0 target" metrics={[
                        { label: "Farms",       value: "50" },
                        { label: "Paying",      value: "40+" },
                        { label: "Churn",       value: "0%" },
                        { label: "NPS",         value: "60+" },
                    ]} />
                </StratSection>

                {/* Phase 1 */}
                <StratSection title="Phase 1 — Local scale (Months 4–12)" number="02" accent="#16A34A">
                    <PhaseCard
                        goal="District-by-district expansion. First 1,000 paying farms."
                        color="#F0FDF4"
                        border="#BBF7D0"
                        items={[
                            {
                                title:  "Farmers Union of Malawi partnership",
                                detail: "FUM has 400,000+ members across all 28 districts. Negotiate a bulk licensing agreement: FUM endorses Farmio to members, we provide 30% discount on Standard tier for FUM members, and a revenue share to FUM of MWK 500/active member/month. Target: 2,000 FUM member farms within 6 months.",
                            },
                            {
                                title:  "Agricultural Extension Officer programme",
                                detail: "Malawi has 1,800+ government agricultural extension officers (AEOs). Train 100 AEOs in 3 districts as certified Farmio trainers. AEOs earn MWK 500 commission per farm they onboard that stays active for 3 months. This is the most cost-effective distribution channel for rural reach.",
                            },
                            {
                                title:  "WhatsApp community farming channel",
                                detail: "Create district-level WhatsApp groups moderated by Field CSOs. Share crop tips, market prices, weather alerts and success stories. Each group becomes a referral engine. Target 500 active members per group within 6 months.",
                            },
                            {
                                title:  "Input supplier channel partnerships",
                                detail: "Partner with Rab Processors, Monsanto and NASFAM to bundle Farmio Standard tier with seed and fertilizer purchases. Supplier pays MWK 4,000 of the MWK 9,900 monthly fee as a marketing cost — farmer pays MWK 5,900. Lower barrier to entry for smallholders.",
                            },
                            {
                                title:  "District-by-district rollout",
                                detail: "Month 4: Kasungu. Month 5: Mchinji. Month 6: Dedza. Month 7: Ntchisi. Month 8: Dowa. Month 9: Nkhotakota. Month 10: Salima. Month 11: Balaka. Month 12: Machinga. Each new district gets a launch event and 2 weeks of daily AEO training.",
                            },
                        ]}
                    />
                    <MetricTarget label="End of Phase 1 target" metrics={[
                        { label: "Registered", value: "3,500" },
                        { label: "Paying",     value: "1,200" },
                        { label: "ARR",        value: "MWK 143M" },
                        { label: "Districts",  value: "12" },
                    ]} />
                </StratSection>

                {/* Phase 2 */}
                <StratSection title="Phase 2 — Financial services (Months 12–24)" number="03" accent="#2563EB">
                    <PhaseCard
                        goal="Launch the credit score API. Diversify revenue. Achieve positive unit economics."
                        color="#EFF6FF"
                        border="#BFDBFE"
                        items={[
                            {
                                title:  "Bank & MFI credit score API",
                                detail: "The Farmio credit score is the most defensible moat in the business. A farmer with 12 months of Farmio data is bankable. License the credit score API to OIBM, NBS Bank, FDH Bank and Opportunity International. Pricing: MWK 15,000/month flat fee + MWK 2,000 per credit check. Target: 3 bank integrations, 500 credit checks/month by Month 18.",
                            },
                            {
                                title:  "OIBM AgriLoan product",
                                detail: "Co-design a Farmio-powered micro-loan product with Opportunity International Bank of Malawi. Farmers with a Farmio credit score of 65+ pre-qualify for loans up to MWK 5 million. Farmio earns 1.5% origination fee. Target: 200 loans facilitated in Year 2, MWK 500M in loan volume.",
                            },
                            {
                                title:  "Aggregated market data product",
                                detail: "Anonymised, aggregated crop production data from 3,500+ farms is extraordinarily valuable to commodity traders, NGOs, government and development finance institutions. Package this as a quarterly report (MWK 500,000/report) and an API subscription (MWK 2M/year). Target: 5 paying data customers by Month 20.",
                            },
                            {
                                title:  "NGO and development programme integration",
                                detail: "USAID, World Food Programme, CARE and Catholic Relief Services all run agricultural programmes in Malawi. Farmio becomes the digital record-keeping tool for their beneficiaries — funded by the programme, not the farmer. Each NGO programme: MWK 3,500/beneficiary/month. Target: 2 programmes, 500 beneficiaries each by Month 24.",
                            },
                        ]}
                    />
                    <MetricTarget label="End of Phase 2 target" metrics={[
                        { label: "Registered", value: "12,000" },
                        { label: "Paying",     value: "5,000" },
                        { label: "ARR",        value: "MWK 600M" },
                        { label: "Rev streams", value: "4" },
                    ]} />
                </StratSection>

                {/* Phase 3 */}
                <StratSection title="Phase 3 — Regional expansion (Months 24–36)" number="04" accent="#9333EA">
                    <PhaseCard
                        goal="Expand to Zambia, Zimbabwe and Tanzania. Series A ready."
                        color="#FAF5FF"
                        border="#E9D5FF"
                        items={[
                            {
                                title:  "Zambia first — same playbook, different market",
                                detail: "Zambia has 1.5 million smallholder farming households, similar regulatory environment, English-speaking, and no dominant local AgriTech player. Adapt Farmio for ZMW currency and Zambian crop calendar. Partner with Zambia National Farmers Union (ZNFU). Target: 1,000 farms in Zambia within 6 months of launch.",
                            },
                            {
                                title:  "Zimbabwe second — large commercial farming sector",
                                detail: "Zimbabwe has a sophisticated commercial farming sector (tobacco, horticulture, beef) that can pay premium pricing. Target commercial farms (50+ ha) first. ZWL currency complexity requires local payment partner integration. Partner with Commercial Farmers Union of Zimbabwe (CFU). Target: 500 commercial farms in Year 3.",
                            },
                            {
                                title:  "Government procurement — FISP integration",
                                detail: "The Malawi Farm Input Subsidy Programme (FISP) distributes inputs to 900,000+ farming households annually. Lobby to become the official digital record-keeping platform for FISP beneficiaries. Government contract: MWK 1,200/beneficiary/year = MWK 1.08B ARR from a single contract.",
                            },
                            {
                                title:  "Telco partnerships — Airtel Money & TNM Mpamba",
                                detail: "Partner with Airtel and TNM to bundle Farmio with agricultural data packages. Farmer buys a MWK 500 Farmio bundle via mobile money. Telco handles billing and distribution. Farmio becomes accessible to 2G feature phone users via USSD. This unlocks the sub-MWK 500,000 farm segment — 60% of the market.",
                            },
                            {
                                title:  "Series A readiness",
                                detail: "By Month 30: $2M ARR, 4 countries, 2 government contracts, 3 bank API integrations. This is a clear Series A story. Target raise: $5M led by a pan-African VC (TLcom Capital, Novastar Ventures, or Flourish Ventures) with development finance institution participation (IFC or UNCDF).",
                            },
                        ]}
                    />
                    <MetricTarget label="End of Phase 3 target" metrics={[
                        { label: "Registered", value: "50,000" },
                        { label: "Countries",  value: "4" },
                        { label: "ARR",        value: "$2M+" },
                        { label: "Round",      value: "Series A" },
                    ]} />
                </StratSection>

                {/* Funder strategy */}
                <StratSection title="Funder Strategy" number="05" accent="#D97706">
                    <p className="text-lg leading-relaxed" style={{ color: "#57534E" }}>
                        Farmio pursues a dual-track funding strategy: commercial venture capital for equity,
                        and development grants/concessional debt for impact programming. These are not in conflict —
                        they are complementary and each makes the other more credible.
                    </p>

                    <div className="flex flex-col gap-5">
                        {[
                            {
                                category: "Venture capital — equity round",
                                color:    "#EFF6FF",
                                border:   "#BFDBFE",
                                accent:   "#2563EB",
                                funders: [
                                    { name: "Novastar Ventures",   thesis: "East & Southern Africa impact ventures", ticket: "$250K–$2M", angle: "Proven traction + financial inclusion angle" },
                                    { name: "TLcom Capital",        thesis: "Pan-African tech companies",              ticket: "$1M–$5M",  angle: "Series A lead once at $2M ARR" },
                                    { name: "Flourish Ventures",    thesis: "Financial health & inclusion fintech",    ticket: "$500K–$3M", angle: "Credit score API + farmer financial inclusion" },
                                    { name: "Antler Africa",        thesis: "Early-stage African founders",            ticket: "$200K–$500K", angle: "Seed stage, founder-first" },
                                ],
                            },
                            {
                                category: "Development finance — grants & concessional debt",
                                color:    "#FFFBEB",
                                border:   "#FDE68A",
                                accent:   "#D97706",
                                funders: [
                                    { name: "USAID Feed the Future",   thesis: "Food security & agricultural development", ticket: "$200K–$2M grant", angle: "Smallholder productivity + market linkage" },
                                    { name: "Gates Foundation",         thesis: "Smallholder farmer productivity",          ticket: "$500K–$5M grant", angle: "Yield improvement data + food security" },
                                    { name: "Mastercard Foundation",    thesis: "Youth employment & economic inclusion",    ticket: "$1M–$10M grant",  angle: "Young farmer employment tracking" },
                                    { name: "African Development Bank", thesis: "Digital agriculture & fintech",            ticket: "$1M–$5M",         angle: "AFDB Digital Agriculture Strategy alignment" },
                                    { name: "UNCDF",                    thesis: "Digital financial services",               ticket: "$300K–$1M",       angle: "Farmer financial inclusion + digital payments" },
                                    { name: "IFC / World Bank",         thesis: "Private sector development in IDA countries", ticket: "$1M–$10M",    angle: "Malawi is an IDA country — priority market" },
                                ],
                            },
                            {
                                category: "Local funding & government",
                                color:    "#EBF5EC",
                                border:   "#BBF7D0",
                                accent:   "#16A34A",
                                funders: [
                                    { name: "MITC Innovation Fund",  thesis: "Malawi technology innovation",        ticket: "MWK 20M–100M grant", angle: "Locally-built tech, ICT4D alignment" },
                                    { name: "MCCCI AgriFinance",      thesis: "Agricultural finance in Malawi",     ticket: "MWK 50M–200M",       angle: "Financial sector development" },
                                    { name: "NBS Bank AgriLoan",      thesis: "Agricultural lending",               ticket: "Debt facility",      angle: "Collateral-free lending backed by Farmio data" },
                                    { name: "GoM FISP Programme",     thesis: "Farm input subsidy administration",  ticket: "Government contract", angle: "Digital records for 900,000 FISP beneficiaries" },
                                ],
                            },
                        ].map(({ category, color, border, accent, funders }) => (
                            <div key={category} className="rounded-2xl overflow-hidden"
                                 style={{ background: color, border: `1.5px solid ${border}` }}>
                                <div className="px-5 py-3.5 border-b" style={{ borderColor: border }}>
                                    <p className="text-sm font-black" style={{ color: accent }}>{category}</p>
                                </div>
                                <div className="p-5">
                                    <table className="w-full text-sm">
                                        <thead>
                                        <tr>
                                            {["Funder", "Ticket size", "Our angle"].map((h) => (
                                                <th key={h} className="text-left text-[10px] font-black uppercase tracking-widest pb-3 pr-4"
                                                    style={{ color: "#A8A29E" }}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {funders.map(({ name, thesis, ticket, angle }) => (
                                            <tr key={name} className="border-t" style={{ borderColor: `${border}80` }}>
                                                <td className="py-2.5 pr-4">
                                                    <p className="font-bold" style={{ color: "#1C1917" }}>{name}</p>
                                                    <p className="text-[10px]" style={{ color: "#A8A29E" }}>{thesis}</p>
                                                </td>
                                                <td className="py-2.5 pr-4 font-bold text-xs whitespace-nowrap" style={{ color: accent }}>{ticket}</td>
                                                <td className="py-2.5 text-xs" style={{ color: "#57534E" }}>{angle}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                </StratSection>

                {/* Competitive moats */}
                <StratSection title="Competitive Moats" number="06" accent="#DC2626">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            {
                                title: "Local data network effect",
                                icon:  "🌐",
                                desc:  "Every farm that joins Farmio improves the ADMARC price benchmarks, the regional yield averages and the credit scoring model for every other farm. This gets better with scale in a way no outsider can replicate quickly.",
                            },
                            {
                                title: "Credit score switching cost",
                                icon:  "🏆",
                                desc:  "A farmer with 18 months of Farmio data has a credit score that can get them a loan. Switching to a competitor resets that score to zero. This is the strongest retention mechanism in the business.",
                            },
                            {
                                title: "ADMARC integration",
                                icon:  "📊",
                                desc:  "We are the only platform with a live integration to official Malawi ADMARC farm gate prices. This took months to negotiate and is not easily replicated by a foreign competitor entering the market.",
                            },
                            {
                                title: "Extension officer network",
                                icon:  "👥",
                                desc:  "Once 200+ government AEOs are trained on Farmio and earn commission from it, they become an impossible-to-replicate distribution and retention channel. No foreign competitor has the on-the-ground relationships to do this.",
                            },
                            {
                                title: "Local-first pricing",
                                icon:  "💰",
                                desc:  "MWK 9,900/month is approximately $5.80 USD — unbeatable for what the platform offers. Foreign competitors must price in USD and face currency risk. We are structurally cheaper.",
                            },
                            {
                                title: "GPS mapping data",
                                icon:  "🗺️",
                                desc:  "Every field boundary drawn on Farmio is proprietary geospatial data. After 10,000 fields, we will have the most accurate small-farm parcel dataset in Malawi — valuable for carbon markets, satellite analytics and government planning.",
                            },
                        ].map(({ title, icon, desc }) => (
                            <div key={title} className="rounded-2xl p-5"
                                 style={{ background: "white", border: "1px solid #E8E4DC" }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">{icon}</span>
                                    <p className="text-sm font-black" style={{ color: "#1C1917" }}>{title}</p>
                                </div>
                                <p className="text-sm leading-relaxed" style={{ color: "#57534E" }}>{desc}</p>
                            </div>
                        ))}
                    </div>
                </StratSection>

                {/* Risks and mitigations */}
                <StratSection title="Risks & Mitigations" number="07" accent="#475569">
                    <div className="flex flex-col gap-3">
                        {[
                            {
                                risk:       "Low smartphone penetration in rural areas",
                                likelihood: "Medium",
                                mitigation: "USSD and WhatsApp-based entry points for feature phones. Telco partnership for subsidised data. Offline-first mobile app roadmap.",
                            },
                            {
                                risk:       "MWK currency devaluation reduces USD revenue",
                                likelihood: "High",
                                mitigation: "Grant revenue in USD provides a natural hedge. NGO and bank API contracts partially in USD. Long-term: price in USD for enterprise tier.",
                            },
                            {
                                risk:       "Government regulatory changes to agricultural data",
                                likelihood: "Low",
                                mitigation: "Proactive engagement with Ministry of Agriculture and MITC. Data sovereignty by design — all data stored in Malawi. Government contract strategy reduces adversarial relationship risk.",
                            },
                            {
                                risk:       "Large foreign competitor enters market (e.g. Hello Tractor, DigiFarm)",
                                likelihood: "Medium",
                                mitigation: "Local data network effects, ADMARC integration and AEO network are 18-month leads. Speed of local district rollout. Credit score switching cost locks in active users.",
                            },
                            {
                                risk:       "Farmer churn due to subsistence-level income constraints",
                                likelihood: "Medium",
                                mitigation: "Free tier retains farmers who cannot pay. Input supplier channel subsidises the subscription. NGO programme covers cost for programme beneficiaries. FISP contract makes Farmio effectively free for 900K farms.",
                            },
                        ].map(({ risk, likelihood, mitigation }) => (
                            <div key={risk} className="rounded-2xl p-5"
                                 style={{ background: "white", border: "1px solid #E8E4DC" }}>
                                <div className="flex items-start justify-between mb-2">
                                    <p className="text-sm font-black" style={{ color: "#1C1917" }}>{risk}</p>
                                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full flex-shrink-0 ml-4"
                                          style={{
                                              background: likelihood === "High" ? "#FFF1F2" : likelihood === "Medium" ? "#FFFBEB" : "#F0FDF4",
                                              color:      likelihood === "High" ? "#DC2626" : likelihood === "Medium" ? "#D97706" : "#16A34A",
                                          }}>
                    {likelihood} likelihood
                  </span>
                                </div>
                                <p className="text-sm leading-relaxed" style={{ color: "#57534E" }}>
                                    <span className="font-bold">Mitigation: </span>{mitigation}
                                </p>
                            </div>
                        ))}
                    </div>
                </StratSection>

                {/* Immediate next steps */}
                <StratSection title="Immediate Next Steps" number="08" accent="#0891B2">
                    <div className="rounded-2xl overflow-hidden"
                         style={{ background: "white", border: "1px solid #E8E4DC" }}>
                        {[
                            { week: "Week 1–2", action: "Close seed round — target $250K from 3–5 angels or a single seed fund",  owner: "Founder" },
                            { week: "Week 2–3", action: "Hire Field Customer Success Officer #1 (Lilongwe) and #2 (Kasungu)",       owner: "Founder" },
                            { week: "Week 3–4", action: "Sign partnership MOU with Farmers Union of Malawi",                        owner: "Founder" },
                            { week: "Week 4",   action: "Submit USAID Feed the Future Innovation Lab application",                  owner: "Founder" },
                            { week: "Week 4–6", action: "Train first 20 Agricultural Extension Officers in Lilongwe district",     owner: "CSO #1" },
                            { week: "Week 5–8", action: "Onboard 50 anchor farms — daily WhatsApp support",                        owner: "Both CSOs" },
                            { week: "Week 6",   action: "Launch Kasungu district with FUM partnership activation event",           owner: "Founder + CSO #2" },
                            { week: "Week 8",   action: "First NPS survey — target 60+",                                           owner: "CSO #1" },
                            { week: "Month 2",  action: "Begin credit score API conversations with OIBM and NBS Bank",             owner: "Founder" },
                            { week: "Month 3",  action: "Submit Gates Foundation Agricultural Development grant (due Q2)",         owner: "Founder" },
                        ].map(({ week, action, owner }, i) => (
                            <div key={i} className="flex items-start gap-4 px-5 py-4"
                                 style={{ borderBottom: i < 9 ? "1px solid #F8FAFC" : "none" }}>
                <span className="text-xs font-black px-3 py-1.5 rounded-xl flex-shrink-0 w-24 text-center"
                      style={{ background: "#EBF5EC", color: "#1a3d1f" }}>
                  {week}
                </span>
                                <p className="text-sm flex-1" style={{ color: "#1C1917" }}>{action}</p>
                                <span className="text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0"
                                      style={{ background: "#F1F5F9", color: "#64748B" }}>
                  {owner}
                </span>
                            </div>
                        ))}
                    </div>
                </StratSection>

                {/* Footer CTA */}
                <div className="rounded-3xl p-10 text-center"
                     style={{ background: "linear-gradient(135deg, #1a3d1f 0%, #0f2411 100%)" }}>
                    <div className="text-5xl mb-4">🌾</div>
                    <h2 className="text-3xl font-black text-white mb-4" style={{ letterSpacing: "-0.04em" }}>
                        Ready to build this together?
                    </h2>
                    <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.65)" }}>
                        We are raising $250,000 to execute Phase 0 and Phase 1 of this strategy.
                        The opportunity is clear. The market is ready. The platform is built.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <a href="mailto:invest@farmio.app"
                           className="px-8 py-4 rounded-2xl text-base font-black"
                           style={{ background: "linear-gradient(135deg, #D97706, #F59E0B)", color: "white" }}>
                            📧 invest@farmio.app
                        </a>
                        <Link href="/pitch"
                              className="px-8 py-4 rounded-2xl text-base font-bold"
                              style={{ background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.2)", color: "white" }}>
                            View investor pitch →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Strategy page components ──────────────────────────────────────────────

function StratSection({ number, title, accent, children }: {
    number: string; title: string; accent: string; children: React.ReactNode;
}) {
    return (
        <div className="mb-12">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                     style={{ background: accent }}>
                    {number}
                </div>
                <h2 className="text-2xl font-black" style={{ color: "#1C1917", letterSpacing: "-0.03em" }}>
                    {title}
                </h2>
                <div className="flex-1 h-px" style={{ background: "#E8E4DC" }} />
            </div>
            <div className="flex flex-col gap-5">{children}</div>
        </div>
    );
}

function PhaseCard({ goal, color, border, items }: {
    goal: string; color: string; border: string; items: { title: string; detail: string }[];
}) {
    return (
        <div className="rounded-2xl overflow-hidden"
             style={{ background: color, border: `1.5px solid ${border}` }}>
            <div className="px-6 py-4 border-b" style={{ borderColor: border }}>
                <p className="text-sm font-black italic" style={{ color: "#1C1917" }}>
                    🎯 Goal: {goal}
                </p>
            </div>
            <div className="p-6 flex flex-col gap-5">
                {items.map(({ title, detail }) => (
                    <div key={title}>
                        <p className="text-sm font-black mb-1.5" style={{ color: "#1C1917" }}>{title}</p>
                        <p className="text-sm leading-relaxed" style={{ color: "#57534E" }}>{detail}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function MetricTarget({ label, metrics }: { label: string; metrics: { label: string; value: string }[] }) {
    return (
        <div className="rounded-2xl p-5" style={{ background: "#1C1917" }}>
            <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
                {label}
            </p>
            <div className="grid grid-cols-4 gap-4">
                {metrics.map(({ label, value }) => (
                    <div key={label} className="text-center">
                        <p className="text-xl font-black text-white">{value}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
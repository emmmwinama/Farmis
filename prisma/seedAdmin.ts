import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding...");

    // ── Admin user ─────────────────────────────────────────────────────────────
    const existingAdmin = await prisma.adminUser.findFirst({ where: { email: "admin@farmio.app" } });
    if (!existingAdmin) {
        await prisma.adminUser.create({
            data: {
                email:    "admin@farmio.app",
                password: await bcrypt.hash("admin123", 10),
                name:     "Farmio Admin",
            },
        });
        console.log("Admin user created: admin@farmio.app / admin123");
    } else {
        console.log("Admin user already exists.");
    }

    // ── Subscription tiers ─────────────────────────────────────────────────────
    // Schema fields: id, name, description, priceMonthly, priceAnnual, isActive,
    // isPublic, createdAt, isFeatured, sortOrder, maxFields, maxCrops,
    // maxActivities, maxTransactions, maxEmployees, maxFarms, maxTeamMembers,
    // seasonAnalytics, yieldSuggestions, costPerHectare, payrollTracking,
    // multipleFarms, teamAccounts, customReports, apiAccess, dataRetentionLifetime
    await prisma.subscriptionTier.deleteMany({});
    await prisma.subscriptionTier.createMany({
        data: [
            {
                name:                  "Free",
                description:           "For smallholder farmers getting started",
                priceMonthly:          0,
                priceAnnual:           null,
                isActive:              true,
                isPublic:              true,
                isFeatured:            false,
                sortOrder:             0,
                maxFields:             1,
                maxCrops:              1,
                maxActivities:         10,
                maxTransactions:       5,
                maxEmployees:          1,
                maxFarms:              1,
                maxTeamMembers:        0,
                seasonAnalytics:       false,
                yieldSuggestions:      false,
                costPerHectare:        false,
                payrollTracking:       false,
                multipleFarms:         false,
                teamAccounts:          false,
                customReports:         false,
                apiAccess:             false,
                dataRetentionLifetime: false,
            },
            {
                name:                  "Standard",
                description:           "For growing commercial farms",
                priceMonthly:          9900,
                priceAnnual:           99000,
                isActive:              true,
                isPublic:              true,
                isFeatured:            true,
                sortOrder:             1,
                maxFields:             -1,
                maxCrops:              -1,
                maxActivities:         -1,
                maxTransactions:       -1,
                maxEmployees:          -1,
                maxFarms:              1,
                maxTeamMembers:        5,
                seasonAnalytics:       true,
                yieldSuggestions:      true,
                costPerHectare:        true,
                payrollTracking:       true,
                multipleFarms:         false,
                teamAccounts:          true,
                customReports:         false,
                apiAccess:             false,
                dataRetentionLifetime: false,
            },
            {
                name:                  "Enterprise",
                description:           "For cooperatives and large operations",
                priceMonthly:          49900,
                priceAnnual:           499000,
                isActive:              true,
                isPublic:              true,
                isFeatured:            false,
                sortOrder:             2,
                maxFields:             -1,
                maxCrops:              -1,
                maxActivities:         -1,
                maxTransactions:       -1,
                maxEmployees:          -1,
                maxFarms:              -1,
                maxTeamMembers:        -1,
                seasonAnalytics:       true,
                yieldSuggestions:      true,
                costPerHectare:        true,
                payrollTracking:       true,
                multipleFarms:         true,
                teamAccounts:          true,
                customReports:         true,
                apiAccess:             true,
                dataRetentionLifetime: true,
            },
        ],
    });
    console.log("Tiers seeded.");

    // ── Testimonials ───────────────────────────────────────────────────────────
    // Schema fields: id, quote, name, role, initials, isActive, sortOrder, createdAt
    // NO: company, content, rating, avatar
    const testimonials = [
        {
            name:      "James Phiri",
            role:      "Maize & soya farmer, Lilongwe",
            quote:     "Before Farmio, I had no idea which of my fields was profitable. Now I know my maize costs MWK 180 per kg to produce and I can sell for MWK 450 at Lilongwe market. That knowledge changed everything.",
            initials:  "JP",
            isActive:  true,
            sortOrder: 1,
        },
        {
            name:      "Grace Banda",
            role:      "Commercial farmer, Kasungu",
            quote:     "I went to NBS Bank with my Farmio credit score report. They approved my loan in two weeks. Without those records I would have been turned away like before.",
            initials:  "GB",
            isActive:  true,
            sortOrder: 2,
        },
        {
            name:      "Edward Mkandawire",
            role:      "Tobacco & groundnut farmer, Mzuzu",
            quote:     "The field mapping is incredible. I drew all four of my fields on the phone and now I know exactly how many hectares I have. I used to just guess.",
            initials:  "EM",
            isActive:  true,
            sortOrder: 3,
        },
    ];
    for (const t of testimonials) {
        const exists = await prisma.testimonial.findFirst({ where: { name: t.name } });
        if (!exists) await prisma.testimonial.create({ data: t });
    }
    console.log("Testimonials seeded.");

    // ── Market prices ──────────────────────────────────────────────────────────
    // Schema fields: id, cropName, variety, unit, priceMin, priceMax, priceAvg,
    // market, region, currency, season, recordedAt, source, isActive
    const marketPrices = [
        { cropName: "Maize",       variety: "White",     unit: "kg",    priceMin: 350,    priceMax: 550,    priceAvg: 450,    market: "ADMARC",          region: "National", season: "2024/25" },
        { cropName: "Maize",       variety: "White",     unit: "bag50", priceMin: 17500,  priceMax: 27500,  priceAvg: 22500,  market: "ADMARC",          region: "National", season: "2024/25" },
        { cropName: "Maize",       variety: "White",     unit: "kg",    priceMin: 380,    priceMax: 580,    priceAvg: 480,    market: "Lilongwe Market", region: "Central",  season: "2024/25" },
        { cropName: "Maize",       variety: "White",     unit: "kg",    priceMin: 360,    priceMax: 560,    priceAvg: 460,    market: "Blantyre Market", region: "Southern", season: "2024/25" },
        { cropName: "Maize",       variety: "White",     unit: "kg",    priceMin: 370,    priceMax: 570,    priceAvg: 470,    market: "Mzuzu Market",    region: "Northern", season: "2024/25" },
        { cropName: "Tobacco",     variety: "Burley",    unit: "kg",    priceMin: 2800,   priceMax: 5500,   priceAvg: 4200,   market: "Auction Floors",  region: "National", season: "2024/25" },
        { cropName: "Tobacco",     variety: "NASCHO",    unit: "kg",    priceMin: 3200,   priceMax: 6000,   priceAvg: 4800,   market: "Auction Floors",  region: "National", season: "2024/25" },
        { cropName: "Soya",        variety: "Nasoko",    unit: "kg",    priceMin: 800,    priceMax: 1200,   priceAvg: 1000,   market: "ADMARC",          region: "National", season: "2024/25" },
        { cropName: "Soya",        variety: "Nasoko",    unit: "kg",    priceMin: 850,    priceMax: 1300,   priceAvg: 1050,   market: "Lilongwe Market", region: "Central",  season: "2024/25" },
        { cropName: "Groundnuts",  variety: "CG7",       unit: "kg",    priceMin: 1500,   priceMax: 2800,   priceAvg: 2100,   market: "ADMARC",          region: "National", season: "2024/25" },
        { cropName: "Groundnuts",  variety: "CG7",       unit: "kg",    priceMin: 1600,   priceMax: 3000,   priceAvg: 2200,   market: "Lilongwe Market", region: "Central",  season: "2024/25" },
        { cropName: "Rice",        variety: "Kilombero", unit: "kg",    priceMin: 900,    priceMax: 1500,   priceAvg: 1200,   market: "ADMARC",          region: "National", season: "2024/25" },
        { cropName: "Rice",        variety: "Kilombero", unit: "kg",    priceMin: 950,    priceMax: 1600,   priceAvg: 1250,   market: "Blantyre Market", region: "Southern", season: "2024/25" },
        { cropName: "Beans",       variety: "Napilira",  unit: "kg",    priceMin: 1200,   priceMax: 2000,   priceAvg: 1600,   market: "ADMARC",          region: "National", season: "2024/25" },
        { cropName: "Beans",       variety: "Napilira",  unit: "kg",    priceMin: 1300,   priceMax: 2200,   priceAvg: 1700,   market: "Lilongwe Market", region: "Central",  season: "2024/25" },
        { cropName: "Cotton",      variety: "Chureza",   unit: "kg",    priceMin: 850,    priceMax: 1400,   priceAvg: 1150,   market: "ADMARC",          region: "National", season: "2024/25" },
        { cropName: "Sweet Potato", variety: "Zondeni", unit: "kg",    priceMin: 250,    priceMax: 500,    priceAvg: 380,    market: "Lilongwe Market", region: "Central",  season: "2024/25" },
        { cropName: "Cassava",     variety: "Manyokola", unit: "kg",    priceMin: 180,    priceMax: 350,    priceAvg: 270,    market: "ADMARC",          region: "National", season: "2024/25" },
        { cropName: "Sunflower",   variety: "Local",     unit: "kg",    priceMin: 700,    priceMax: 1200,   priceAvg: 950,    market: "ADMARC",          region: "National", season: "2024/25" },
        // 2023/24 for comparison
        { cropName: "Maize",       variety: "White",     unit: "kg",    priceMin: 280,    priceMax: 420,    priceAvg: 350,    market: "ADMARC",          region: "National", season: "2023/24" },
        { cropName: "Soya",        variety: "Nasoko",    unit: "kg",    priceMin: 650,    priceMax: 950,    priceAvg: 800,    market: "ADMARC",          region: "National", season: "2023/24" },
        { cropName: "Groundnuts",  variety: "CG7",       unit: "kg",    priceMin: 1200,   priceMax: 2200,   priceAvg: 1700,   market: "ADMARC",          region: "National", season: "2023/24" },
        { cropName: "Tobacco",     variety: "Burley",    unit: "kg",    priceMin: 2200,   priceMax: 4500,   priceAvg: 3500,   market: "Auction Floors",  region: "National", season: "2023/24" },
        { cropName: "Beans",       variety: "Napilira",  unit: "kg",    priceMin: 950,    priceMax: 1600,   priceAvg: 1300,   market: "ADMARC",          region: "National", season: "2023/24" },
        { cropName: "Rice",        variety: "Kilombero", unit: "kg",    priceMin: 750,    priceMax: 1200,   priceAvg: 980,    market: "ADMARC",          region: "National", season: "2023/24" },
    ];
    for (const p of marketPrices) {
        const exists = await prisma.marketPrice.findFirst({
            where: { cropName: p.cropName, unit: p.unit, market: p.market, season: p.season },
        });
        if (!exists) await prisma.marketPrice.create({ data: { ...p, source: "ADMARC" } });
    }
    console.log("Market prices seeded.");

    // ── Impact stats ───────────────────────────────────────────────────────────
    // Schema fields: id, icon, value, label, source, color, sortOrder, isActive, createdAt
    const impactStats = [
        { icon: "👨‍🌾", value: "67%",      label: "of smallholder farmers in Malawi keep no formal financial records",     source: "World Bank, 2023",              color: "#DC2626", sortOrder: 0, isActive: true },
        { icon: "🏦",   value: "89%",      label: "of farmer loan applications rejected — no financial history",             source: "RBM Financial Inclusion Report", color: "#D97706", sortOrder: 1, isActive: true },
        { icon: "💸",   value: "MWK 2.1T", label: "lost annually by Malawian farmers selling below optimal market prices",  source: "USAID AgriMarket Study",         color: "#9333EA", sortOrder: 2, isActive: true },
        { icon: "📱",   value: "72%",      label: "of Malawians now have mobile phone access — up from 38% in 2018",        source: "GSMA Mobile Economy Africa 2023",color: "#2563EB", sortOrder: 3, isActive: true },
        { icon: "🌾",   value: "1.8M",     label: "smallholder farming households in Malawi needing digitization",          source: "National Statistical Office",    color: "#16A34A", sortOrder: 4, isActive: true },
        { icon: "📈",   value: "$2.4B",    label: "Agricultural SaaS market in sub-Saharan Africa by 2027",                 source: "AgriTech Investment Report 2023",color: "#0891B2", sortOrder: 5, isActive: true },
    ];
    for (const stat of impactStats) {
        const exists = await prisma.impactStat.findFirst({ where: { value: stat.value, label: stat.label } });
        if (!exists) await prisma.impactStat.create({ data: stat });
    }
    console.log("Impact stats seeded.");

    // ── Pitch sections ─────────────────────────────────────────────────────────
    // Schema fields: id, key, title, content (Json), isActive, updatedAt
    const pitchSections = [
        {
            key: "hook", title: "The Hook",
            content: {
                headline: "Every year, Malawian farmers collectively lose over MWK 2.1 trillion in potential income",
                subline:  "Not from bad weather or poor harvests — but from not knowing their numbers.",
                solution: "Farmio solves all of this. In one app. For any smartphone.",
            },
        },
        {
            key: "problem", title: "The Problem",
            content: {
                headline: "African farmers work hard. The system is working against them.",
                points: [
                    { stat: "67%",  desc: "of smallholder farmers in Malawi keep no formal financial records",        source: "World Bank, 2023" },
                    { stat: "89%",  desc: "of farmer loan applications are rejected due to lack of financial records", source: "RBM Report" },
                    { stat: "1.8M", desc: "smallholder farming households in Malawi needing digitization",             source: "NSO Malawi" },
                ],
            },
        },
        {
            key: "solution", title: "The Solution",
            content: {
                headline:    "Farmio is a farm management operating system built for African agriculture",
                description: "We replace paper records with a powerful, affordable, mobile-first platform.",
                features: [
                    "GPS field mapping & zone management",
                    "Real-time ADMARC market prices",
                    "Farm credit score & loan readiness",
                    "Full financial tracking & reporting",
                    "Weather integration & farming advice",
                    "Animal husbandry management",
                    "AI-powered insights & anomaly detection",
                    "Team management & role permissions",
                ],
            },
        },
        {
            key: "market", title: "Market Opportunity",
            content: {
                tam: { value: "$2.4B", label: "Total Addressable Market", desc: "Agricultural SaaS in sub-Saharan Africa by 2027" },
                sam: { value: "$180M", label: "Serviceable Market",       desc: "Farm management software across Malawi, Zambia, Zimbabwe, Tanzania" },
                som: { value: "$4.2M", label: "Obtainable (Year 1–3)",    desc: "12,000 paying farms across Malawi at MWK 9,900/month average" },
                drivers: [
                    { title: "Smartphone penetration",    desc: "72% of Malawians now have mobile phone access" },
                    { title: "Government digitalization", desc: "Malawi Digital Economy Policy 2023–2030" },
                    { title: "Funder momentum",           desc: "$2.8B committed to African AgriTech by DFIs 2024–2027" },
                    { title: "Market gap",                desc: "No locally-built, locally-priced platform exists in Malawi" },
                ],
            },
        },
        {
            key: "model", title: "Business Model",
            content: {
                streams: [
                    { name: "SaaS Subscriptions", icon: "💳", status: "Live",  desc: "Free, Standard (MWK 9,900/mo), Enterprise (MWK 49,900/mo)" },
                    { name: "Credit Score API",   icon: "🏦", status: "2025",  desc: "License credit score engine to banks and MFIs" },
                    { name: "Market Data",        icon: "📊", status: "2025",  desc: "Anonymised crop production data to commodity traders" },
                    { name: "Input Marketplace",  icon: "🛒", status: "2026",  desc: "Commission-based marketplace for input suppliers. 3–5% fee" },
                ],
                unitEconomics: { arpu: "MWK 8,400", cac: "MWK 15,000", ltv: "MWK 302,400", ltvCac: "20x" },
            },
        },
        {
            key: "traction", title: "Traction & Validation",
            content: {
                metrics: [
                    { metric: "500+",    label: "Farms registered" },
                    { metric: "12,000+", label: "Hectares tracked" },
                    { metric: "94%",     label: "30-day retention" },
                    { metric: "4.8/5",   label: "User satisfaction" },
                ],
                milestones: [
                    { date: "Q1 2024", event: "MVP launched with 50 beta farmers in Lilongwe and Kasungu" },
                    { date: "Q2 2024", event: "ADMARC price integration — first Malawian AgriTech with live official prices" },
                    { date: "Q3 2024", event: "First farmer accesses bank loan using Farmio credit score report" },
                    { date: "Q4 2024", event: "500 registered farms across 5 districts. 67% on paid plans" },
                    { date: "Q1 2025", event: "GPS field mapping launched. 12,000+ hectares mapped in first month" },
                    { date: "Now",     event: "Raising seed round to scale to 10,000 farms by end of 2025" },
                ],
            },
        },
        {
            key: "ask", title: "The Ask",
            content: {
                amount: "$250,000",
                type:   "Seed round · Convertible note or equity",
                runway: "18-month runway",
                useOfFunds: [
                    { use: "Product development & AI", pct: 40, amount: "$100,000" },
                    { use: "Sales & marketing",        pct: 30, amount: "$75,000" },
                    { use: "Team expansion",           pct: 20, amount: "$50,000" },
                    { use: "Operations & compliance",  pct: 10, amount: "$25,000" },
                ],
                unlocks: [
                    "10,000 registered farms by end of Year 1",
                    "Expansion into Zambia (Q3 2025)",
                    "Bank & MFI credit score API launch",
                    "WhatsApp and USSD channel (feature phones)",
                    "First $1M ARR milestone",
                    "Series A readiness by Month 18",
                ],
                contact: { email: "invest@farmio.app", phone: "+265 999 000 000", web: "farmio.app" },
            },
        },
    ];
    for (const section of pitchSections) {
        await prisma.pitchSection.upsert({
            where:  { key: section.key },
            update: { title: section.title, content: section.content },
            create: { key: section.key, title: section.title, content: section.content },
        });
    }
    console.log("Pitch sections seeded.");

    // ── CMS Features ───────────────────────────────────────────────────────────
    // Schema fields: id, icon, title, description, sortOrder, isActive
    const features = [
        { icon: "🗺️", title: "Field & crop mapping",      description: "Draw GPS field boundaries, section zones by crop, measure acreage accurately.",                            sortOrder: 0, isActive: true },
        { icon: "📊", title: "ADMARC market intelligence", description: "Live farm gate prices from ADMARC and regional markets. Know the best time and place to sell.",            sortOrder: 1, isActive: true },
        { icon: "🏆", title: "Farm credit score",          description: "Your complete farm history becomes a loan readiness report. Walk into any bank with a score and a PDF.",   sortOrder: 2, isActive: true },
        { icon: "🌤️", title: "Weather integration",        description: "7-day forecast with farming advice. Know when to spray, plant, irrigate — before you spend money.",        sortOrder: 3, isActive: true },
        { icon: "🐄", title: "Animal husbandry",           description: "Track livestock health, production, weight gain and sales. Calculate true cost per animal automatically.", sortOrder: 4, isActive: true },
        { icon: "✨", title: "AI-powered insights",        description: "Anomaly alerts, season comparisons, cost benchmarking — all explained in plain language.",                 sortOrder: 5, isActive: true },
    ];
    for (const f of features) {
        const exists = await prisma.cmsFeature.findFirst({ where: { title: f.title } });
        if (!exists) await prisma.cmsFeature.create({ data: f });
    }
    console.log("CMS features seeded.");

    // ── Site content ───────────────────────────────────────────────────────────
    // Schema fields: id, key, value, type, group, label, updatedAt, updatedBy
    const siteContent = [
        { key: "hero_headline",         value: "Manage your farm like a business.",                                                                                                                          type: "text", group: "hero",     label: "Hero headline" },
        { key: "hero_subheadline",      value: "Farmio replaces paper records with a powerful digital system — track fields, crops, costs and yields. Get AI-powered insights. Know your profit before you sell.", type: "text", group: "hero",     label: "Hero subheadline" },
        { key: "hero_cta_primary",      value: "Start free — no card needed",                                                                                                                               type: "text", group: "hero",     label: "Primary CTA button" },
        { key: "hero_cta_secondary",    value: "See how it works",                                                                                                                                          type: "text", group: "hero",     label: "Secondary CTA button" },
        { key: "problem_headline",      value: "African farmers work hard. The system is working against them.",                                                                                             type: "text", group: "hero",     label: "Problem headline" },
        { key: "problem_sub",           value: "Without digital records, farmers can't access credit, don't know their true costs, and sell at the wrong time. Farmio fixes this.",                         type: "text", group: "hero",     label: "Problem subheadline" },
        { key: "features_headline",     value: "Built for the realities of African farming",                                                                                                                type: "text", group: "hero",     label: "Features headline" },
        { key: "features_sub",          value: "Not a generic tool retrofitted for Africa. Built from scratch for Malawian conditions, crops, currencies and challenges.",                                  type: "text", group: "hero",     label: "Features subheadline" },
        { key: "impact_headline",       value: "Numbers that tell the real story",                                                                                                                          type: "text", group: "stats",    label: "Impact stats headline" },
        { key: "testimonials_headline", value: "What farmers are saying",                                                                                                                                   type: "text", group: "hero",     label: "Testimonials headline" },
        { key: "pricing_headline",      value: "Start free. Scale when you grow.",                                                                                                                          type: "text", group: "hero",     label: "Pricing headline" },
        { key: "pricing_sub",           value: "No hidden fees. No contracts. Pay monthly and cancel anytime. All prices in Malawian Kwacha.",                                                              type: "text", group: "hero",     label: "Pricing subheadline" },
        { key: "funders_headline",      value: "A platform that delivers on every funder's mandate",                                                                                                        type: "text", group: "hero",     label: "Funders headline" },
        { key: "funders_sub",           value: "Farmio sits at the intersection of agricultural development, financial inclusion, and digital transformation.",                                             type: "text", group: "hero",     label: "Funders subheadline" },
        { key: "cta_headline",          value: "Your farm deserves better than paper.",                                                                                                                     type: "text", group: "hero",     label: "CTA headline" },
        { key: "cta_sub",               value: "Join hundreds of Malawian farmers already using Farmio to make smarter decisions, access credit and build profitable farms.",                               type: "text", group: "hero",     label: "CTA subheadline" },
        { key: "contact_email",         value: "hello@farmio.app",                                                                                                                                         type: "text", group: "contact",  label: "Contact email" },
        { key: "invest_email",          value: "invest@farmio.app",                                                                                                                                        type: "text", group: "contact",  label: "Investor email" },
        { key: "contact_phone",         value: "+265 999 000 000",                                                                                                                                         type: "text", group: "contact",  label: "Contact phone" },
    ];
    for (const item of siteContent) {
        await prisma.siteContent.upsert({
            where:  { key: item.key },
            update: {},
            create: item,
        });
    }
    console.log("Site content seeded.");

    console.log("\n✅ Seed complete.");
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());

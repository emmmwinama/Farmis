import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding...");
    const adminEmail = process.env.SEED_ADMIN_EMAIL;
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword || adminPassword.length < 12) {
        throw new Error("Set SEED_ADMIN_EMAIL and a SEED_ADMIN_PASSWORD of at least 12 characters before seeding admin data.");
    }

    // ── Admin user ─────────────────────────────────────────────────────────────
    const normalizedAdminEmail = adminEmail.toLowerCase();
    const existingAdmin = await prisma.adminUser.findFirst({ where: { email: normalizedAdminEmail } });
    if (!existingAdmin) {
        await prisma.adminUser.create({
            data: {
                email:    normalizedAdminEmail,
                password: await bcrypt.hash(adminPassword, 12),
                name:     "AgriVault Admin",
            },
        });
        console.log(`Admin user created: ${normalizedAdminEmail}`);
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
                name:                  "Trial",
                description:           "7-day full trial for evaluating AgriVault",
                priceMonthly:          0,
                priceAnnual:           null,
                isActive:              true,
                isPublic:              true,
                isFeatured:            false,
                sortOrder:             0,
                maxFields:             -1,
                maxCrops:              -1,
                maxActivities:         -1,
                maxTransactions:       -1,
                maxEmployees:          -1,
                maxFarms:              1,
                maxTeamMembers:        0,
                seasonAnalytics:       true,
                yieldSuggestions:      true,
                costPerHectare:        true,
                payrollTracking:       true,
                multipleFarms:         false,
                teamAccounts:          false,
                customReports:         false,
                apiAccess:             false,
                dataRetentionLifetime: false,
            },
            {
                name:                  "Regular",
                description:           "For one farm owner managing a single-user account",
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
                maxTeamMembers:        0,
                seasonAnalytics:       true,
                yieldSuggestions:      true,
                costPerHectare:        true,
                payrollTracking:       true,
                multipleFarms:         false,
                teamAccounts:          false,
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
            quote:     "Before AgriVault, I had no idea which of my fields was profitable. Now I know my maize costs MWK 180 per kg to produce and I can sell for MWK 450 at Lilongwe market. That knowledge changed everything.",
            initials:  "JP",
            isActive:  true,
            sortOrder: 1,
        },
        {
            name:      "Grace Banda",
            role:      "Commercial farmer, Kasungu",
            quote:     "I went to NBS Bank with my AgriVault credit score report. They approved my loan in two weeks. Without those records I would have been turned away like before.",
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


    // ── CMS Features ───────────────────────────────────────────────────────────
    // Schema fields: id, icon, title, description, sortOrder, isActive
    const features = [
        { icon: "Map", title: "Field & crop mapping",      description: "Draw GPS field boundaries, section zones by crop, measure acreage accurately.",                            sortOrder: 0, isActive: true },
        { icon: "Chart", title: "Market intelligence",        description: "Track farm gate and regional market prices. Know the best time and place to sell.",                      sortOrder: 1, isActive: true },
        { icon: "Score", title: "Readiness reports",          description: "Your complete farm history becomes a professional evidence report for commercial and operational review.", sortOrder: 2, isActive: true },
        { icon: "Weather", title: "Weather integration",        description: "7-day forecast with farming advice. Know when to spray, plant, irrigate — before you spend money.",        sortOrder: 3, isActive: true },
        { icon: "Cattle", title: "Animal husbandry",           description: "Track livestock health, production, weight gain and sales. Calculate true cost per animal automatically.", sortOrder: 4, isActive: true },
        { icon: "AI", title: "AI-powered insights",        description: "Anomaly alerts, season comparisons, cost benchmarking — all explained in plain language.",                 sortOrder: 5, isActive: true },
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
        { key: "hero_subheadline",      value: "AgriVault replaces paper records with a powerful digital system — track fields, crops, costs and yields. Get AI-powered insights. Know your profit before you sell.", type: "text", group: "hero",     label: "Hero subheadline" },
        { key: "hero_cta_primary",      value: "Start free — no card needed",                                                                                                                               type: "text", group: "hero",     label: "Primary CTA button" },
        { key: "hero_cta_secondary",    value: "See how it works",                                                                                                                                          type: "text", group: "hero",     label: "Secondary CTA button" },
        { key: "problem_headline",      value: "Farm teams work hard. Their records should work just as hard.",                                                                                             type: "text", group: "hero",     label: "Problem headline" },
        { key: "problem_sub",           value: "Without digital records, farms lose visibility on costs, production, team activity, and sales timing. AgriVault fixes this.",                                type: "text", group: "hero",     label: "Problem subheadline" },
        { key: "features_headline",     value: "Built for real field operations",                                                                                                                           type: "text", group: "hero",     label: "Features headline" },
        { key: "features_sub",          value: "A practical farm records system built for real field conditions, seasonal workflows, teams, and commercial reporting.",                                      type: "text", group: "hero",     label: "Features subheadline" },
        { key: "testimonials_headline", value: "What farmers are saying",                                                                                                                                   type: "text", group: "hero",     label: "Testimonials headline" },
        { key: "pricing_headline",      value: "Start free. Scale when you grow.",                                                                                                                          type: "text", group: "hero",     label: "Pricing headline" },
        { key: "pricing_sub",           value: "No hidden fees. No contracts. Pay monthly and cancel anytime.",                                                                                             type: "text", group: "hero",     label: "Pricing subheadline" },
        { key: "cta_headline",          value: "Your farm deserves better than paper.",                                                                                                                     type: "text", group: "hero",     label: "CTA headline" },
        { key: "cta_sub",               value: "Join farm teams using AgriVault to make smarter decisions, keep stronger records, and build profitable farms.",                                              type: "text", group: "hero",     label: "CTA subheadline" },
        { key: "contact_email",         value: "hello@agrivault.app",                                                                                                                                         type: "text", group: "contact",  label: "Contact email" },
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

    console.log("\nOK Seed complete.");
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());

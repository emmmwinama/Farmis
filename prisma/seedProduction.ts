import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { FALLBACK_LEGAL_PAGES } from "../lib/legalPages";

function loadSeedEnv() {
    const envFile = process.env.SEED_ENV_FILE || ".env.production";
    const envPath = path.resolve(process.cwd(), envFile);

    if (!existsSync(envPath)) {
        throw new Error(`Production seed environment file not found: ${envPath}`);
    }

    const content = readFileSync(envPath, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#") || line.startsWith(";")) continue;

        const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
        if (!match) continue;

        const [, key, rawValue] = match;
        if (process.env[key]) continue;

        process.env[key] = rawValue.trim().replace(/^["']|["']$/g, "");
    }
}

loadSeedEnv();

const prisma = new PrismaClient();

const cropTypes = [
    "Maize",
    "Soybean",
    "Tobacco",
    "Groundnut",
    "Rice",
    "Sorghum",
    "Millet",
    "Cassava",
    "Sweet Potato",
    "Irish Potato",
    "Beans",
    "Cowpea",
    "Pigeon Pea",
    "Sunflower",
    "Cotton",
    "Sugarcane",
    "Banana",
    "Tomato",
    "Onion",
    "Cabbage",
    "Paprika",
    "Chilli",
    "Wheat",
    "Barley",
    "Sesame",
];

const tiers = [
    {
        name: "Trial",
        description: "7-day evaluation access for getting started with AgriVault.",
        priceMonthly: 0,
        priceAnnual: null,
        audience: "New farms evaluating digital records",
        ctaLabel: "Start trial",
        ctaHref: "/register?tier=Trial",
        offerItems: [
            "7-day write access",
            "View-only access for 14 days after trial expiry",
            "Farm setup, fields, crops and activities",
            "Inventory, finance and standard reports",
        ],
        isActive: true,
        isPublic: true,
        isFeatured: false,
        sortOrder: 0,
        maxFields: -1,
        maxCrops: -1,
        maxActivities: -1,
        maxTransactions: -1,
        maxEmployees: -1,
        maxFarms: 1,
        maxTeamMembers: 0,
        seasonAnalytics: true,
        yieldSuggestions: true,
        costPerHectare: true,
        payrollTracking: true,
        multipleFarms: false,
        teamAccounts: false,
        customReports: false,
        apiAccess: false,
        dataRetentionLifetime: false,
    },
    {
        name: "Regular",
        description: "For one farm owner or operator managing a single-user account.",
        priceMonthly: 20000,
        priceAnnual: 200000,
        audience: "Single-user farms",
        ctaLabel: "Get started",
        ctaHref: "/register?tier=Regular",
        offerItems: [
            "Single farm workspace",
            "Offline-ready records",
            "Crops, livestock, inventory and finance",
            "Professional PDF exports",
            "Profitability and cashflow analytics",
        ],
        isActive: true,
        isPublic: true,
        isFeatured: true,
        sortOrder: 1,
        maxFields: -1,
        maxCrops: -1,
        maxActivities: -1,
        maxTransactions: -1,
        maxEmployees: -1,
        maxFarms: 1,
        maxTeamMembers: 0,
        seasonAnalytics: true,
        yieldSuggestions: true,
        costPerHectare: true,
        payrollTracking: true,
        multipleFarms: false,
        teamAccounts: false,
        customReports: false,
        apiAccess: false,
        dataRetentionLifetime: false,
    },
    {
        name: "Enterprise",
        description: "For farm teams, estates and multi-user operations.",
        priceMonthly: 85000,
        priceAnnual: 850000,
        audience: "Teams, estates and multi-user farms",
        ctaLabel: "Get started",
        ctaHref: "/register?tier=Enterprise",
        offerItems: [
            "Multiple team members",
            "Role-based permissions",
            "Approvals and audit-ready records",
            "Custom report builder",
            "Multi-farm reporting",
            "Priority support",
        ],
        isActive: true,
        isPublic: true,
        isFeatured: false,
        sortOrder: 2,
        maxFields: -1,
        maxCrops: -1,
        maxActivities: -1,
        maxTransactions: -1,
        maxEmployees: -1,
        maxFarms: -1,
        maxTeamMembers: -1,
        seasonAnalytics: true,
        yieldSuggestions: true,
        costPerHectare: true,
        payrollTracking: true,
        multipleFarms: true,
        teamAccounts: true,
        customReports: true,
        apiAccess: true,
        dataRetentionLifetime: true,
    },
    // ── Mobile app (Flutter, PayPal checkout) tiers ─────────────────────────
    // Separate from the web-dashboard tiers above: USD-priced, and the free
    // one is a standing tier (data-entry limits, no time expiry) rather than
    // a 7-day trial — the product decision was "generous enough to be
    // genuinely useful, capped enough that real usage creates upgrade
    // pressure," not a time-boxed evaluation.
    {
        name: "Mobile Free",
        description: "Free, forever, with room to grow — upgrade when you outgrow the limits.",
        currency: "USD",
        priceMonthly: 0,
        priceAnnual: null,
        priceLifetime: null,
        audience: "Farmers trying the mobile app",
        ctaLabel: null,
        ctaHref: null,
        offerItems: [
            "Up to 2 fields",
            "Up to 3 crops per season",
            "Up to 30 activities and 30 transactions",
            "Up to 2 employees",
            "All reports and analytics",
            "Data stays on this device only",
        ],
        isActive: true,
        isPublic: true,
        isFeatured: false,
        sortOrder: 10,
        maxFields: 2,
        maxCrops: 3,
        maxActivities: 30,
        maxTransactions: 30,
        maxEmployees: 2,
        maxFarms: 1,
        maxTeamMembers: 0,
        seasonAnalytics: true,
        yieldSuggestions: true,
        costPerHectare: true,
        payrollTracking: true,
        multipleFarms: false,
        teamAccounts: false,
        customReports: false,
        apiAccess: false,
        dataRetentionLifetime: false,
        syncEnabled: false,
    },
    {
        name: "Mobile Monthly",
        description: "Unlimited farm records with cross-device backup and sync.",
        currency: "USD",
        priceMonthly: 5,
        priceAnnual: null,
        priceLifetime: null,
        audience: "Farmers who've outgrown the free limits",
        ctaLabel: "Subscribe",
        ctaHref: null,
        offerItems: [
            "Unlimited fields, crops, activities and transactions",
            "Unlimited employees",
            "Cloud backup — switch devices without losing data",
            "All reports and analytics",
            "Cancel anytime",
        ],
        isActive: true,
        isPublic: true,
        isFeatured: true,
        sortOrder: 11,
        maxFields: -1,
        maxCrops: -1,
        maxActivities: -1,
        maxTransactions: -1,
        maxEmployees: -1,
        maxFarms: 1,
        maxTeamMembers: 0,
        seasonAnalytics: true,
        yieldSuggestions: true,
        costPerHectare: true,
        payrollTracking: true,
        multipleFarms: false,
        teamAccounts: false,
        customReports: false,
        apiAccess: false,
        dataRetentionLifetime: true,
        syncEnabled: true,
    },
    {
        name: "Mobile Lifetime",
        description: "Pay once, keep unlimited records and sync for good.",
        currency: "USD",
        priceMonthly: 0,
        priceAnnual: null,
        priceLifetime: 30,
        audience: "Farmers who want to pay once and be done",
        ctaLabel: "Buy lifetime access",
        ctaHref: null,
        offerItems: [
            "Everything in Mobile Monthly",
            "One payment, no renewals, ever",
        ],
        isActive: true,
        isPublic: true,
        isFeatured: false,
        sortOrder: 12,
        maxFields: -1,
        maxCrops: -1,
        maxActivities: -1,
        maxTransactions: -1,
        maxEmployees: -1,
        maxFarms: 1,
        maxTeamMembers: 0,
        seasonAnalytics: true,
        yieldSuggestions: true,
        costPerHectare: true,
        payrollTracking: true,
        multipleFarms: false,
        teamAccounts: false,
        customReports: false,
        apiAccess: false,
        dataRetentionLifetime: true,
        syncEnabled: true,
    },
    {
        name: "Large Enterprise",
        description: "For groups that need onboarding, reporting support and custom commercial terms.",
        priceMonthly: 0,
        priceAnnual: null,
        audience: "Cooperatives, buyers, funders, NGOs and large estates",
        ctaLabel: "Talk to sales",
        ctaHref: "mailto:hello@agrivault.app",
        offerItems: [
            "Everything in Enterprise",
            "Custom onboarding",
            "Partner and aggregate dashboards",
            "Data export support",
            "Custom reporting package",
            "Commercial terms by agreement",
        ],
        isActive: true,
        isPublic: true,
        isFeatured: false,
        sortOrder: 3,
        maxFields: -1,
        maxCrops: -1,
        maxActivities: -1,
        maxTransactions: -1,
        maxEmployees: -1,
        maxFarms: -1,
        maxTeamMembers: -1,
        seasonAnalytics: true,
        yieldSuggestions: true,
        costPerHectare: true,
        payrollTracking: true,
        multipleFarms: true,
        teamAccounts: true,
        customReports: true,
        apiAccess: true,
        dataRetentionLifetime: true,
    },
];

const features = [
    {
        icon: "Map",
        title: "Field and crop mapping",
        description: "Draw field boundaries, allocate land by crop and track active or archived production records.",
        sortOrder: 0,
        isActive: true,
    },
    {
        icon: "Inventory",
        title: "Inventory automation",
        description: "Track purchases, consumption, sales, disposals, low-stock alerts and actual input costs.",
        sortOrder: 1,
        isActive: true,
    },
    {
        icon: "Report",
        title: "Professional reports",
        description: "Export farm records, finance reports, inventory history and traceability packs as polished PDFs.",
        sortOrder: 2,
        isActive: true,
    },
    {
        icon: "Livestock",
        title: "Livestock records",
        description: "Manage animal registers, health records, production, general livestock costs and sales.",
        sortOrder: 3,
        isActive: true,
    },
    {
        icon: "Team",
        title: "Team roles",
        description: "Give owners, managers, field workers and accountants the right level of access.",
        sortOrder: 4,
        isActive: true,
    },
    {
        icon: "Chart",
        title: "Farm analytics",
        description: "Compare cashflow, crop profitability, field performance, season trends and input efficiency.",
        sortOrder: 5,
        isActive: true,
    },
];

const siteContent = [
    {
        key: "hero_headline",
        value: "Farm records that prove what your farm can do.",
        type: "text",
        group: "hero",
        label: "Hero headline",
    },
    {
        key: "hero_subheadline",
        value: "AgriVault helps farms capture field records, manage crops, livestock, inventory and finance, then export trusted reports for buyers, audits, insurance and finance reviews.",
        type: "text",
        group: "hero",
        label: "Hero subheadline",
    },
    {
        key: "hero_cta_primary",
        value: "Start free trial",
        type: "text",
        group: "hero",
        label: "Primary CTA button",
    },
    {
        key: "hero_cta_secondary",
        value: "Book a demo",
        type: "text",
        group: "hero",
        label: "Secondary CTA button",
    },
    {
        key: "problem_headline",
        value: "Daily farm work should become useful business evidence.",
        type: "text",
        group: "landing",
        label: "Problem headline",
    },
    {
        key: "problem_sub",
        value: "AgriVault turns activities, costs, inventory, payroll, sales and livestock records into analytics and professional reports.",
        type: "text",
        group: "landing",
        label: "Problem subheadline",
    },
    {
        key: "features_headline",
        value: "Built for practical farm operations",
        type: "text",
        group: "landing",
        label: "Features headline",
    },
    {
        key: "features_sub",
        value: "A complete operating record for field teams, managers, accountants and owners.",
        type: "text",
        group: "landing",
        label: "Features subheadline",
    },
    {
        key: "pricing_headline",
        value: "Start free. Scale when you grow.",
        type: "text",
        group: "pricing",
        label: "Pricing headline",
    },
    {
        key: "pricing_sub",
        value: "Choose the package that matches your farm, team and reporting needs.",
        type: "text",
        group: "pricing",
        label: "Pricing subheadline",
    },
    {
        key: "cta_headline",
        value: "Give your farm records commercial weight.",
        type: "text",
        group: "landing",
        label: "CTA headline",
    },
    {
        key: "cta_sub",
        value: "Capture daily work once, then use it for decisions, exports, audits and finance conversations.",
        type: "text",
        group: "landing",
        label: "CTA subheadline",
    },
    {
        key: "contact_email",
        value: "hello@agrivault.app",
        type: "text",
        group: "contact",
        label: "Contact email",
    },
];

async function seedAdmin() {
    const adminEmail = process.env.SEED_ADMIN_EMAIL;
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;
    const adminName = process.env.SEED_ADMIN_NAME || "AgriVault Admin";

    if (!adminEmail && !adminPassword) {
        console.log("Skipped admin user. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to create one.");
        return;
    }

    if (!adminEmail || !adminPassword || adminPassword.length < 12) {
        throw new Error("Set SEED_ADMIN_EMAIL and a SEED_ADMIN_PASSWORD of at least 12 characters.");
    }

    const email = adminEmail.trim().toLowerCase();
    const existing = await prisma.adminUser.findUnique({ where: { email } });

    if (existing) {
        await prisma.adminUser.update({
            where: { email },
            data: { name: adminName, isSuperAdmin: true },
        });
        console.log(`Admin user already exists: ${email}`);
        return;
    }

    await prisma.adminUser.create({
        data: {
            email,
            name: adminName,
            password: await bcrypt.hash(adminPassword, 12),
            isSuperAdmin: true,
        },
    });
    console.log(`Admin user created: ${email}`);
}

async function seedCropTypes() {
    for (const name of cropTypes) {
        await prisma.cropType.upsert({
            where: { name },
            update: { isCustom: false },
            create: { name, isCustom: false },
        });
    }
    console.log(`Crop types ready: ${cropTypes.length}`);
}

async function seedTiers() {
    for (const tier of tiers) {
        const existing = await prisma.subscriptionTier.findFirst({
            where: { name: tier.name },
            orderBy: { createdAt: "asc" },
        });

        if (existing) {
            await prisma.subscriptionTier.update({
                where: { id: existing.id },
                data: tier,
            });
        } else {
            await prisma.subscriptionTier.create({ data: tier });
        }
    }
    console.log(`Subscription tiers ready: ${tiers.length}`);
}

async function seedCmsFeatures() {
    for (const feature of features) {
        const existing = await prisma.cmsFeature.findFirst({ where: { title: feature.title } });
        if (existing) {
            await prisma.cmsFeature.update({ where: { id: existing.id }, data: feature });
        } else {
            await prisma.cmsFeature.create({ data: feature });
        }
    }
    console.log(`CMS features ready: ${features.length}`);
}

async function seedSiteContent() {
    for (const item of siteContent) {
        await prisma.siteContent.upsert({
            where: { key: item.key },
            update: item,
            create: item,
        });
    }
    console.log(`Site content ready: ${siteContent.length}`);
}

async function seedLegalPages() {
    for (const [slug, page] of Object.entries(FALLBACK_LEGAL_PAGES)) {
        await prisma.cmsPage.upsert({
            where: { slug },
            update: {
                title: page.title,
                content: page.content,
                isPublic: true,
            },
            create: {
                slug,
                title: page.title,
                content: page.content,
                isPublic: true,
            },
        });
    }
    console.log(`Legal pages ready: ${Object.keys(FALLBACK_LEGAL_PAGES).length}`);
}

async function main() {
    console.log("Starting production seed...");

    await seedAdmin();
    await seedCropTypes();
    await seedTiers();
    await seedCmsFeatures();
    await seedSiteContent();
    await seedLegalPages();

    console.log("Production seed complete.");
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding admin user and subscription tiers...");

    // Admin user
    const hashed = await bcrypt.hash("admin123", 10);
    await prisma.adminUser.upsert({
        where: { email: "admin@farmio.app" },
        update: {},
        create: {
            email: "admin@farmio.app",
            password: hashed,
            name: "Super Admin",
            isSuperAdmin: true,
        },
    });

    // Free tier
    await prisma.subscriptionTier.upsert({
        where: { id: "tier_free" },
        update: {},
        create: {
            id: "tier_free",
            name: "Free",
            description: "For smallholder farmers getting started",
            priceMonthly: 0,
            isPublic: true,
            maxFields: 1,
            maxCrops: 1,
            maxActivities: 10,
            maxTransactions: 5,
            maxEmployees: 1,
            maxFarms: 1,
            maxTeamMembers: 1,
            seasonAnalytics: false,
            yieldSuggestions: false,
            costPerHectare: false,
            payrollTracking: false,
            multipleFarms: false,
            teamAccounts: false,
            customReports: false,
            apiAccess: false,
            dataRetentionLifetime: true,
        },
    });

    // Standard tier
    await prisma.subscriptionTier.upsert({
        where: { id: "tier_standard" },
        update: {},
        create: {
            id: "tier_standard",
            name: "Standard",
            description: "For established farms needing full insight",
            priceMonthly: 15000,
            priceAnnual: 150000,
            isPublic: true,
            maxFields: -1,
            maxCrops: -1,
            maxActivities: -1,
            maxTransactions: -1,
            maxEmployees: -1,
            maxFarms: 1,
            maxTeamMembers: 1,
            seasonAnalytics: true,
            yieldSuggestions: true,
            costPerHectare: true,
            payrollTracking: true,
            multipleFarms: false,
            teamAccounts: false,
            customReports: false,
            apiAccess: false,
            dataRetentionLifetime: true,
        },
    });

    // Enterprise tier
    await prisma.subscriptionTier.upsert({
        where: { id: "tier_enterprise" },
        update: {},
        create: {
            id: "tier_enterprise",
            name: "Enterprise",
            description: "For cooperatives and multi-farm operations",
            priceMonthly: 0,
            isPublic: false,
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
    });

    console.log("Done. Admin: admin@farmio.app / admin123");


    // CMS defaults
    const cmsDefaults = [
        { key: "hero_title", value: "Run your farm like\na business", type: "text", group: "hero", label: "Hero title" },
        { key: "hero_subtitle", value: "Track fields, crops, activities, yields and finances — all in one platform built for modern agriculture in Africa.", type: "text", group: "hero", label: "Hero subtitle" },
        { key: "hero_badge", value: "Enterprise farm management", type: "text", group: "hero", label: "Hero badge text" },
        { key: "hero_cta_primary", value: "Start free trial", type: "text", group: "hero", label: "Primary CTA button" },
        { key: "hero_cta_secondary", value: "Book a demo", type: "text", group: "hero", label: "Secondary CTA button" },
        { key: "features_heading", value: "One platform, complete visibility", type: "text", group: "features", label: "Features section heading" },
        { key: "stats_users", value: "500+", type: "text", group: "stats", label: "Stat: users" },
        { key: "stats_hectares", value: "12,000+", type: "text", group: "stats", label: "Stat: hectares" },
        { key: "stats_uptime", value: "98%", type: "text", group: "stats", label: "Stat: uptime" },
        { key: "stats_rating", value: "4.9/5", type: "text", group: "stats", label: "Stat: rating" },
        { key: "contact_email", value: "support@farmio.app", type: "text", group: "contact", label: "Support email" },
        { key: "contact_phone", value: "+265 999 000 001", type: "text", group: "contact", label: "Support phone" },
        { key: "contact_whatsapp", value: "+265 999 000 002", type: "text", group: "contact", label: "WhatsApp number" },
        { key: "contact_address", value: "Farmio Ltd, Lilongwe, Malawi", type: "text", group: "contact", label: "Physical address" },
        { key: "contact_website", value: "www.farmio.app", type: "text", group: "contact", label: "Website" },
        { key: "footer_tagline", value: "Modern farm management for African agriculture. Built in Malawi.", type: "text", group: "footer", label: "Footer tagline" },
        { key: "social_proof_text", value: "TRUSTED BY FARMS ACROSS MALAWI & SOUTHERN AFRICA", type: "text", group: "social", label: "Social proof banner text" },
    ];

    for (const item of cmsDefaults) {
        await prisma.siteContent.upsert({
            where: { key: item.key },
            update: {},
            create: item,
        });
    }

// Default testimonials
    const testimonials = [
        {
            quote: "Farmio transformed how we track our maize and soybean seasons. The cost per hectare reports alone saved us from two bad decisions.",
            name: "James Phiri",
            role: "Farm Manager, Shire Valley Estates",
            initials: "JP",
            sortOrder: 1,
        },
        {
            quote: "We manage 4 farms across Lilongwe district. Having everything in one place — fields, staff, costs, yields — is a game changer.",
            name: "Grace Banda",
            role: "Director, Sunrise Agricultural Co-op",
            initials: "GB",
            sortOrder: 2,
        },
        {
            quote: "The selling price suggestion tool is brilliant. It tells us exactly what we need to sell our tobacco for to hit our target margin.",
            name: "Charles Mwale",
            role: "Owner, Mzuzu Tobacco Growers",
            initials: "CM",
            sortOrder: 3,
        },
    ];

    for (const t of testimonials) {
        const existing = await prisma.testimonial.findFirst({ where: { name: t.name } });
        if (!existing) await prisma.testimonial.create({ data: t });
    }

    console.log("CMS defaults and testimonials seeded.");

    // Seed CMS features
    const features = [
        { icon: "🗺", title: "Field management", description: "Map your fields, track soil types, monitor cultivatable area and land allocation in real time. Pin GPS locations and draw field boundaries.", sortOrder: 1 },
        { icon: "🌱", title: "Crop tracking", description: "Assign crops to fields by season, track varieties, and monitor status from planting to harvest. Group by season for a full picture.", sortOrder: 2 },
        { icon: "📋", title: "Farm activities", description: "Log every activity — planting, irrigation, spraying, weeding — with full labour, input and cost records linked to crops and seasons.", sortOrder: 3 },
        { icon: "🌾", title: "Yield recording", description: "Record harvests and get automated selling price suggestions based on your actual production costs and target profit margins.", sortOrder: 4 },
        { icon: "💰", title: "Finance & reports", description: "Track income, expenses and overhead. Get detailed profitability reports per crop, field and season including cost per hectare.", sortOrder: 5 },
        { icon: "👷", title: "Team management", description: "Manage employees, assign them to activities, track labour days and hours, and monitor payroll costs across all farm operations.", sortOrder: 6 },
    ];

    for (const f of features) {
        const existing = await prisma.cmsFeature.findFirst({ where: { title: f.title } });
        if (!existing) await prisma.cmsFeature.create({ data: f });
    }

// Seed CMS media
    const media = [
        { key: "hero_image", url: "https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=1200&q=80", type: "image", label: "Hero background image" },
        { key: "hero_video", url: "", type: "video", label: "Hero background video (overrides image if set)" },
        { key: "demo_image", url: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=80", type: "image", label: "Demo section image" },
    ];

    for (const m of media) {
        await prisma.cmsMedia.upsert({ where: { key: m.key }, update: {}, create: m });
    }

// Seed CMS pages
    const pages = [
        { slug: "about", title: "About Farmio", content: "# About Farmio\n\nFarmio is a modern farm management platform built for African agriculture. Founded in Malawi, we help farmers track their fields, crops, activities, yields and finances in one place.\n\n## Our mission\n\nTo give every farmer — from smallholder to commercial — the tools to run their farm like a business.\n\n## Our story\n\nFarmio was born out of a simple observation: farmers in Malawi and across Africa were managing complex operations with notebooks and memory. We believed there was a better way.\n\n## Our team\n\nWe are a small, passionate team based in Lilongwe, Malawi." },
        { slug: "blog", title: "Blog", content: "# Farmio Blog\n\nInsights, tips and updates from the Farmio team.\n\n## Coming soon\n\nWe are working on our first articles. Check back soon!" },
        { slug: "careers", title: "Careers", content: "# Careers at Farmio\n\nWe are always looking for talented people who are passionate about agriculture and technology.\n\n## Open positions\n\nNo open positions at this time. Send your CV to careers@farmio.app and we will keep you in mind for future roles." },
        { slug: "press", title: "Press", content: "# Press & Media\n\nFor press inquiries, please contact press@farmio.app.\n\n## Brand assets\n\nDownload our logo and brand guidelines by emailing press@farmio.app." },
        { slug: "privacy", title: "Privacy Policy", content: "# Privacy Policy\n\nLast updated: January 2025\n\n## What we collect\n\nWe collect information you provide when registering, including your name, email address and farm details.\n\n## How we use it\n\nWe use your information to provide and improve our services. We do not sell your data to third parties.\n\n## Data retention\n\nFree plan users retain access to their data indefinitely. We never delete your historical records.\n\n## Contact\n\nFor privacy concerns, contact privacy@farmio.app." },
        { slug: "terms", title: "Terms of Service", content: "# Terms of Service\n\nLast updated: January 2025\n\nBy using Farmio, you agree to these terms.\n\n## Acceptable use\n\nYou may use Farmio for lawful farm management purposes only.\n\n## Subscription\n\nPaid subscriptions are billed monthly or annually. Cancellations take effect at the end of the billing period.\n\n## Limitation of liability\n\nFarmio is not liable for any loss of data or revenue arising from use of our platform.\n\n## Contact\n\nlegal@farmio.app" },
        { slug: "security", title: "Security", content: "# Security at Farmio\n\n## Data encryption\n\nAll data is encrypted in transit using TLS 1.3 and at rest using AES-256.\n\n## Authentication\n\nPasswords are hashed using bcrypt. We support secure session management.\n\n## Reporting vulnerabilities\n\nIf you discover a security vulnerability, please report it to security@farmio.app. We will respond within 48 hours.\n\n## Uptime\n\nWe target 99.9% uptime and publish our status at status.farmio.app." },
        { slug: "changelog", title: "Changelog", content: "# Changelog\n\n## Version 1.0.0 — January 2025\n\n- Initial release\n- Field management with GPS location\n- Crop tracking by season\n- Farm activity logging with labour and input costs\n- Yield recording with selling price suggestions\n- Finance tracking with profitability reports\n- Employee management\n- Season analytics\n- Admin panel with subscription management\n- Enterprise team accounts with role-based permissions" },
        { slug: "roadmap", title: "Roadmap", content: "# Product Roadmap\n\n## Coming soon\n\n### Mobile app (Q2 2025)\nOffline-capable Android and iOS app for field use.\n\n### Weather integration (Q2 2025)\nReal-time weather data and alerts linked to your field locations.\n\n### Market prices (Q3 2025)\nLive crop market prices to inform your selling decisions.\n\n### SMS notifications (Q3 2025)\nActivity reminders and alerts via SMS for areas with limited internet.\n\n### Multi-currency support (Q4 2025)\nSupport for ZMW, TZS, KES and other African currencies.\n\n## Completed\n\n- ✅ Field management\n- ✅ Crop & season tracking\n- ✅ Activity logging\n- ✅ Yield recording\n- ✅ Finance & reports\n- ✅ Enterprise team accounts" },
        { slug: "support", title: "Support", content: "# Support\n\n## Getting started\n\nNew to Farmio? Start by adding your first field, then assign crops to it. Log activities as they happen and record your harvest at the end of the season.\n\n## Contact us\n\n- **Email:** support@farmio.app\n- **Phone:** +265 999 000 001\n- **WhatsApp:** +265 999 000 002\n- **Hours:** Monday to Friday, 8am – 5pm CAT\n\n## FAQs\n\nVisit our [homepage](/) for answers to common questions." },
    ];

    for (const page of pages) {
        await prisma.cmsPage.upsert({ where: { slug: page.slug }, update: {}, create: page });
    }

// Update tiers with sortOrder and isFeatured
    await prisma.subscriptionTier.update({ where: { id: "tier_free" }, data: { sortOrder: 1, isFeatured: false } });
    await prisma.subscriptionTier.update({ where: { id: "tier_standard" }, data: { sortOrder: 2, isFeatured: true } });
    await prisma.subscriptionTier.update({ where: { id: "tier_enterprise" }, data: { sortOrder: 3, isFeatured: false } });

    console.log("CMS features, media, pages and tier updates seeded.");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
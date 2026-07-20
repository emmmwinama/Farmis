import type { Metadata } from "next";

export const SITE_NAME = "AgriVault";
export const DEFAULT_TITLE = "AgriVault | Farm Records, Analytics and Professional Reports";
export const DEFAULT_DESCRIPTION =
    "AgriVault helps farms capture offline-ready records, manage crops, livestock, inventory, finance and teams, then export professional reports for buyers, audits, insurance and finance reviews.";

export function getSiteUrl() {
    const raw =
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.NEXTAUTH_URL ||
        "http://localhost:3000";

    return raw.replace(/\/$/, "");
}

export function absoluteUrl(path = "/") {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${getSiteUrl()}${cleanPath}`;
}

export function buildMetadata({
    title = DEFAULT_TITLE,
    description = DEFAULT_DESCRIPTION,
    path = "/",
    image = "/agrivault-mark.svg",
    noIndex = false,
}: {
    title?: string;
    description?: string;
    path?: string;
    image?: string;
    noIndex?: boolean;
} = {}): Metadata {
    const canonical = absoluteUrl(path);
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

    return {
        title: fullTitle,
        description,
        alternates: {
            canonical,
        },
        openGraph: {
            type: "website",
            siteName: SITE_NAME,
            title: fullTitle,
            description,
            url: canonical,
            images: [
                {
                    url: absoluteUrl(image),
                    alt: `${SITE_NAME} logo`,
                },
            ],
        },
        twitter: {
            card: "summary",
            title: fullTitle,
            description,
            images: [absoluteUrl(image)],
        },
        robots: noIndex
            ? {
                index: false,
                follow: false,
                googleBot: {
                    index: false,
                    follow: false,
                },
            }
            : {
                index: true,
                follow: true,
            },
    };
}

export const PUBLIC_PAGE_SEO: Record<string, { title: string; description: string }> = {
    about: {
        title: "About AgriVault",
        description: "Learn about AgriVault and its mission to make farm records, reporting and analytics easier for modern farm teams.",
    },
    blog: {
        title: "AgriVault Blog",
        description: "Practical ideas for farm records, crop management, livestock tracking, finance reporting and agricultural operations.",
    },
    careers: {
        title: "Careers at AgriVault",
        description: "Explore opportunities to help build practical farm management software for field teams and commercial agriculture.",
    },
    press: {
        title: "AgriVault Press",
        description: "News, company information and media resources for AgriVault.",
    },
    privacy: {
        title: "Privacy Policy",
        description: "Read how AgriVault handles account, farm, team and operational data.",
    },
    terms: {
        title: "Terms of Use",
        description: "Review the terms that govern access to and use of AgriVault.",
    },
    security: {
        title: "Security",
        description: "Learn about AgriVault security practices for farm records, account access and operational data.",
    },
    changelog: {
        title: "AgriVault Changelog",
        description: "See recent product updates, improvements and fixes in AgriVault.",
    },
    roadmap: {
        title: "AgriVault Roadmap",
        description: "Explore planned improvements for AgriVault farm records, reporting, mobile capture and analytics.",
    },
    support: {
        title: "AgriVault Support",
        description: "Get help with AgriVault setup, farm records, exports, subscriptions and account access.",
    },
};

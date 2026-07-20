import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
    const host = getSiteUrl();

    return {
        rules: [
            {
                userAgent: "*",
                allow: [
                    "/",
                    "/landing",
                    "/register",
                    "/login",
                    "/about",
                    "/blog",
                    "/careers",
                    "/press",
                    "/privacy",
                    "/terms",
                    "/security",
                    "/changelog",
                    "/roadmap",
                    "/support",
                ],
                disallow: [
                    "/api/",
                    "/admin/",
                    "/dashboard/",
                    "/invite",
                    "/activate",
                ],
            },
        ],
        sitemap: `${host}/sitemap.xml`,
        host,
    };
}

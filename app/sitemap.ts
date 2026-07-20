import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

const publicRoutes = [
    { path: "/", priority: 1 },
    { path: "/landing", priority: 1 },
    { path: "/register", priority: 0.8 },
    { path: "/login", priority: 0.4 },
    { path: "/about", priority: 0.7 },
    { path: "/blog", priority: 0.6 },
    { path: "/careers", priority: 0.5 },
    { path: "/press", priority: 0.5 },
    { path: "/privacy", priority: 0.3 },
    { path: "/terms", priority: 0.3 },
    { path: "/security", priority: 0.5 },
    { path: "/changelog", priority: 0.4 },
    { path: "/roadmap", priority: 0.5 },
    { path: "/support", priority: 0.6 },
];

export default function sitemap(): MetadataRoute.Sitemap {
    const lastModified = new Date();

    return publicRoutes.map(({ path, priority }) => ({
        url: absoluteUrl(path),
        lastModified,
        changeFrequency: path === "/" || path === "/landing" ? "weekly" : "monthly",
        priority,
    }));
}

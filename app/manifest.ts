import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "AgriVault",
        short_name: "AgriVault",
        description: "Offline-ready farm records, analytics and professional reports.",
        start_url: "/landing",
        display: "standalone",
        background_color: "#F8FAFC",
        theme_color: "#075985",
        icons: [
            {
                src: "/agrivault-mark.svg",
                sizes: "any",
                type: "image/svg+xml",
            },
        ],
    };
}

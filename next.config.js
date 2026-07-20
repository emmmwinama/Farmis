/** @type {import('next').NextConfig} */
const nextConfig = {
    poweredByHeader: false,
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "*.tile.openstreetmap.org" },
            { protocol: "https", hostname: "server.arcgisonline.com" },
            { protocol: "https", hostname: "cdnjs.cloudflare.com" },
        ],
    },
    webpack: (config) => {
        // Allow leaflet-draw to work without canvas in SSR
        config.resolve.fallback = {
            ...config.resolve.fallback,
            canvas: false,
        };
        return config;
    },
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    { key: "X-DNS-Prefetch-Control", value: "on" },
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "X-Frame-Options", value: "DENY" },
                    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=(self), payment=()",
                    },
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=63072000; includeSubDomains; preload",
                    },
                ],
            },
            {
                source: "/api/:path*",
                headers: [
                    { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
                ],
            },
            {
                source: "/dashboard/:path*",
                headers: [
                    { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
                ],
            },
            {
                source: "/admin/:path*",
                headers: [
                    { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
                ],
            },
            {
                source: "/activate",
                headers: [
                    { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
                ],
            },
            {
                source: "/invite",
                headers: [
                    { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
                ],
            },
        ];
    },
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
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
};

module.exports = nextConfig;
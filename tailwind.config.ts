import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                nunito: ["var(--font-nunito)", "Nunito", "Segoe UI", "Arial", "sans-serif"],
                sans:   ["var(--font-nunito)", "Nunito", "Segoe UI", "Arial", "sans-serif"],
            },
            colors: {
                farm: {
                    50:  "#f0fdf4",
                    100: "#dcfce7",
                    200: "#bbf7d0",
                    300: "#86efac",
                    400: "#4ade80",
                    500: "#22c55e",
                    600: "#16a34a",
                    700: "#15803d",
                    800: "#1a3d1f",
                    900: "#14532d",
                    950: "#052e16",
                },
                warm: {
                    50:  "#FAFAF7",
                    100: "#F5F3EE",
                    200: "#EDE9E0",
                    300: "#DDD8CC",
                    400: "#C9C2B4",
                    500: "#A89E8C",
                    600: "#857969",
                    700: "#635A4C",
                    800: "#3D3730",
                    900: "#1C1917",
                },
                amber: {
                    50:  "#FFFBEB",
                    100: "#FEF3C7",
                    200: "#FDE68A",
                    300: "#FCD34D",
                    400: "#FBBF24",
                    500: "#F59E0B",
                    600: "#D97706",
                    700: "#B45309",
                    800: "#92400E",
                    900: "#78350F",
                },
            },
            boxShadow: {
                "warm-sm": "0 1px 3px 0 rgba(28,25,23,0.08), 0 1px 2px -1px rgba(28,25,23,0.06)",
                "warm-md": "0 4px 12px 0 rgba(28,25,23,0.10), 0 2px 4px -1px rgba(28,25,23,0.06)",
                "warm-lg": "0 10px 30px 0 rgba(28,25,23,0.12), 0 4px 8px -2px rgba(28,25,23,0.08)",
                "green-glow": "0 4px 20px 0 rgba(26,61,31,0.25)",
            },
            backgroundImage: {
                "warm-gradient": "linear-gradient(135deg, #F7F6F2 0%, #F0EDE4 100%)",
                "card-gradient": "linear-gradient(145deg, #FFFFFF 0%, #FAFAF7 100%)",
                "green-gradient": "linear-gradient(135deg, #1a3d1f 0%, #2d6a35 100%)",
                "amber-gradient": "linear-gradient(135deg, #D97706 0%, #F59E0B 100%)",
            },
            borderRadius: {
                "2xl": "1rem",
                "3xl": "1.5rem",
                "4xl": "2rem",
            },
            animation: {
                "fade-in": "fadeIn 0.3s ease-out",
                "slide-up": "slideUp 0.3s ease-out",
                "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                slideUp: {
                    "0%": { opacity: "0", transform: "translateY(8px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
            },
        },
    },
    plugins: [],
};

export default config;

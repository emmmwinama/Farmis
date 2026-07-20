import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { buildMetadata, getSiteUrl } from "@/lib/seo";

const nunito = Nunito({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800", "900"],
    variable: "--font-nunito",
    display: "swap",
});

export const metadata: Metadata = {
    metadataBase: new URL(getSiteUrl()),
    ...buildMetadata(),
    applicationName: "AgriVault",
    category: "Agriculture software",
    keywords: [
        "farm management software",
        "farm records",
        "crop management",
        "livestock management",
        "farm inventory",
        "farm reports",
        "agricultural finance records",
        "offline farm data capture",
        "farm analytics",
        "traceability reports",
    ],
    icons: {
        icon: "/agrivault-mark.svg",
        shortcut: "/agrivault-mark.svg",
        apple: "/agrivault-mark.svg",
    },
    manifest: "/manifest.webmanifest",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className={`${nunito.variable} font-nunito antialiased`}>
        <Providers>{children}</Providers>
        </body>
        </html>
    );
}

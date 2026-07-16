import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const nunito = Nunito({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-nunito",
});

export const metadata: Metadata = {
    title: "AgriVault - Farm Management System",
    description: "Secure farm records, analytics, exports, and finance-ready evidence.",
    icons: {
        icon: "/agrivault-mark.svg",
    },
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

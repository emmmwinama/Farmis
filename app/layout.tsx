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
    title: "Farmio - Farm Management System",
    description: "Manage your farm operations efficiently",
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
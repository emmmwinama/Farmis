import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
    title: "Sign in",
    description: "Sign in to AgriVault to manage farm records, reports, inventory, livestock, finance and team workflows.",
    path: "/login",
    noIndex: true,
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return children;
}

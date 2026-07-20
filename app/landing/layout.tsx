import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
    title: "AgriVault | Offline-Ready Farm Management Software",
    description:
        "Capture farm records in the field, manage crops, livestock, inventory, finance and teams, then export professional reports for buyers, audits, insurance and finance reviews.",
    path: "/landing",
});

export default function LandingLayout({ children }: { children: React.ReactNode }) {
    return children;
}

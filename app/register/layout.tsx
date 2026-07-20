import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
    title: "Start AgriVault",
    description:
        "Start an AgriVault trial or choose a farm management package for offline-ready records, analytics, reports and team workflows.",
    path: "/register",
});

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
    return children;
}

import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
    title: "Activate account",
    description: "Activate your AgriVault account.",
    path: "/activate",
    noIndex: true,
});

export default function ActivateLayout({ children }: { children: React.ReactNode }) {
    return children;
}

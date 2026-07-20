import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { buildMetadata, PUBLIC_PAGE_SEO } from "@/lib/seo";

const VALID_SLUGS = ["about", "blog", "careers", "press", "privacy", "terms", "security", "changelog", "roadmap", "support"];

export function generateStaticParams() {
    return VALID_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
    if (!VALID_SLUGS.includes(params.slug)) return buildMetadata({ noIndex: true });
    const seo = PUBLIC_PAGE_SEO[params.slug];

    return buildMetadata({
        title: seo?.title ?? "AgriVault",
        description: seo?.description ?? "AgriVault farm management information.",
        path: `/${params.slug}`,
    });
}

function renderMarkdown(content: string) {
    return content
        .split("\n")
        .map((line, i) => {
            if (line.startsWith("### ")) return <h3 key={i} className="text-xl font-medium text-slate-900 dark:text-white mt-8 mb-3">{line.slice(4)}</h3>;
            if (line.startsWith("## ")) return <h2 key={i} className="text-2xl font-medium text-slate-900 dark:text-white mt-10 mb-4">{line.slice(3)}</h2>;
            if (line.startsWith("# ")) return <h1 key={i} className="text-3xl font-medium text-slate-900 dark:text-white mt-12 mb-6">{line.slice(2)}</h1>;
            if (line.startsWith("- OK ")) return <div key={i} className="flex items-center gap-2 mb-2"><CheckCircle2 size={15} className="text-sky-600" /><span className="text-slate-600 dark:text-slate-400">{line.slice(5)}</span></div>;
            if (line.startsWith("- ")) return <li key={i} className="text-slate-600 dark:text-slate-400 mb-1 ml-4">{line.slice(2)}</li>;
            if (line.startsWith("**") && line.endsWith("**")) return <strong key={i} className="text-slate-900 dark:text-white">{line.slice(2, -2)}</strong>;
            if (line === "") return <div key={i} className="h-3" />;
            return <p key={i} className="text-slate-600 dark:text-slate-400 leading-relaxed mb-3">{line}</p>;
        });
}

export default async function CmsPageRoute({ params }: { params: { slug: string } }) {
    if (!VALID_SLUGS.includes(params.slug)) notFound();

    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/public/pages/${params.slug}`, { cache: "no-store" });
    if (!res.ok) notFound();
    const page = await res.json();

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            <nav className="border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900 sticky top-0 z-50 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-sky-100 text-sky-700 rounded-xl flex items-center justify-center">
                            <ShieldCheck size={17} />
                        </div>
                        <span className="font-black text-slate-900 dark:text-white">AgriVault</span>
                    </Link>
                    <Link href="/" className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Back to home</Link>
                </div>
            </nav>

            <div className="max-w-3xl mx-auto px-6 py-16">
                <div className="prose-agrivault">
                    {renderMarkdown(page.content)}
                </div>
            </div>

            <footer className="border-t border-slate-100 dark:border-slate-800 py-8 px-6 text-center">
                <p className="text-xs text-slate-400">(c) 2026 AgriVault. <Link href="/privacy" className="hover:text-slate-700 dark:hover:text-white">Privacy</Link> | <Link href="/terms" className="hover:text-slate-700 dark:hover:text-white">Terms</Link></p>
            </footer>
        </div>
    );
}

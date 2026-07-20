"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

type Tier = {
    id: string;
    name: string;
    description: string;
    priceMonthly: number;
    priceAnnual?: number | null;
    audience?: string | null;
    ctaLabel?: string | null;
    offerItems?: string[] | null;
    isFeatured?: boolean;
};

const FALLBACK_TIERS: Tier[] = [
    {
        id: "trial",
        name: "Trial",
        description: "Evaluate AgriVault for 7 days.",
        priceMonthly: 0,
        audience: "New farms testing digital records",
        offerItems: ["7-day access", "Farm setup", "Activities, crops, inventory and reports"],
    },
    {
        id: "regular",
        name: "Regular",
        description: "For a single farm owner or operator.",
        priceMonthly: 20000,
        audience: "Single-user farms",
        isFeatured: true,
        offerItems: ["Offline-ready records", "Professional reports", "Profitability analytics"],
    },
    {
        id: "enterprise",
        name: "Enterprise",
        description: "For teams, estates and multi-farm operations.",
        priceMonthly: 85000,
        audience: "Teams and multi-user farms",
        offerItems: ["Team roles", "Approvals", "Multi-farm reporting"],
    },
];

function formatMoney(value: number) {
    if (!value) return "Free";
    return `MWK ${new Intl.NumberFormat("en-MW").format(Math.round(value))}`;
}

const inputClass = "h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100 placeholder:text-slate-400";

export default function RegisterPage() {
    const router = useRouter();
    const [tiers, setTiers] = useState<Tier[]>([]);
    const [selectedTierId, setSelectedTierId] = useState("");
    const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
    const [form, setForm] = useState({
        name: "",
        email: "",
        farmName: "",
        organizationName: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const requestedTier = params.get("tier") ?? "";
        fetch("/api/public/tiers")
            .then((res) => res.ok ? res.json() : [])
            .then((data) => {
                const publicTiers = Array.isArray(data) && data.length > 0 ? data : FALLBACK_TIERS;
                setTiers(publicTiers);
                const match = publicTiers.find((tier: Tier) => tier.id === requestedTier);
                setSelectedTierId(match?.id ?? publicTiers[0]?.id ?? "");
            })
            .catch(() => {
                setTiers(FALLBACK_TIERS);
                setSelectedTierId(FALLBACK_TIERS[0].id);
            });
    }, []);

    const selectedTier = useMemo(
        () => tiers.find((tier) => tier.id === selectedTierId) ?? tiers[0],
        [tiers, selectedTierId],
    );
    const isTeamPlan = selectedTier
        ? selectedTier.name.toLowerCase().includes("enterprise") || (selectedTier.priceMonthly ?? 0) >= 80000
        : false;

    const set = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (form.password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    tierId: selectedTier?.id,
                    billingCycle,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? "Registration failed");
                return;
            }
            router.push(`/login?registered=1&tier=${encodeURIComponent(data.tierName ?? selectedTier?.name ?? "")}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-900">
            <div className="grid min-h-screen lg:grid-cols-[420px_1fr]">
                <aside className="hidden lg:flex flex-col justify-between border-r border-white/10 bg-[radial-gradient(circle_at_top_left,#0E7490_0,#0F172A_42%,#020617_100%)] px-10 py-10 text-white">
                    <Link href="/landing" className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/15 ring-1 ring-cyan-300/30">
                            <ShieldCheck size={20} className="text-cyan-200" />
                        </div>
                        <div>
                            <p className="text-xl font-black leading-none">AgriVault</p>
                            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-200/70">Farm records</p>
                        </div>
                    </Link>

                    <div>
                        <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-cyan-200/70">Selected package</p>
                        <div className="rounded-3xl border border-white/10 bg-white/8 p-6 shadow-2xl shadow-cyan-950/30">
                            <p className="text-2xl font-black">{selectedTier?.name ?? "AgriVault"}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-300">{selectedTier?.description ?? "Choose a package to get started."}</p>
                            <p className="mt-5 text-3xl font-black">
                                {formatMoney(selectedTier?.priceMonthly ?? 0)}
                                {(selectedTier?.priceMonthly ?? 0) > 0 && <span className="text-sm font-bold text-slate-400"> / month</span>}
                            </p>
                            <div className="mt-6 space-y-3">
                                {(selectedTier?.offerItems ?? []).slice(0, 5).map((item) => (
                                    <div key={item} className="flex gap-3 text-sm text-slate-200">
                                        <Check size={16} className="mt-0.5 flex-shrink-0 text-cyan-300" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <p className="text-xs leading-6 text-slate-400">
                        Choose a package that matches how your farm or organization works today. You can upgrade as your team grows.
                    </p>
                </aside>

                <main className="bg-slate-50 px-4 py-6 sm:px-6 lg:px-12">
                    <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col justify-center">
                        <div className="mb-8 flex items-center justify-between lg:hidden">
                            <Link href="/landing" className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                                    <ShieldCheck size={20} />
                                </div>
                                <span className="text-xl font-black text-slate-950">AgriVault</span>
                            </Link>
                            <Link href="/login" className="text-sm font-bold text-sky-700">Sign in</Link>
                        </div>

                        <div className="mb-8">
                            <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-700">Create account</p>
                            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                                Start with the package that fits your farm.
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                                Choose trial, single-user, enterprise, or large-enterprise access. Admin-configured limits and features are applied immediately.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1fr_420px]">
                            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                                <div className="mb-5 flex items-center justify-between gap-3">
                                    <div>
                                        <h2 className="text-base font-black text-slate-950">Account details</h2>
                                        <p className="text-sm text-slate-500">Used for login and farm ownership.</p>
                                    </div>
                                    <Link href="/login" className="hidden text-sm font-bold text-sky-700 sm:block">Sign in</Link>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="Full name">
                                        <input value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="John Banda" className={inputClass} />
                                    </Field>
                                    <Field label="Email address">
                                        <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required placeholder="john@farm.com" className={inputClass} />
                                    </Field>
                                    <Field label="Farm name">
                                        <input value={form.farmName} onChange={(e) => set("farmName", e.target.value)} required placeholder="Sunrise Farm" className={inputClass} />
                                    </Field>
                                    <Field label="Phone optional">
                                        <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+265..." className={inputClass} />
                                    </Field>
                                    {isTeamPlan && (
                                        <div className="sm:col-span-2">
                                            <Field label="Organization optional">
                                                <input value={form.organizationName} onChange={(e) => set("organizationName", e.target.value)} placeholder="Estate, cooperative, buyer, or funder name" className={inputClass} />
                                            </Field>
                                        </div>
                                    )}
                                    <Field label="Password">
                                        <div className="relative">
                                            <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => set("password", e.target.value)} required placeholder="Min 8 characters" className={`${inputClass} pr-12`} />
                                            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </Field>
                                    <Field label="Confirm password">
                                        <input type="password" value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} required placeholder="Confirm password" className={inputClass} />
                                    </Field>
                                </div>

                                {error && (
                                    <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                        {error}
                                    </div>
                                )}
                            </section>

                            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                                <h2 className="text-base font-black text-slate-950">Choose package</h2>
                                <p className="mt-1 text-sm text-slate-500">Pulled directly from admin tier configuration.</p>

                                <div className="mt-5 space-y-3">
                                    {tiers.map((tier) => (
                                        <button key={tier.id} type="button" onClick={() => setSelectedTierId(tier.id)}
                                                className="w-full rounded-2xl border p-4 text-left transition"
                                                style={{
                                                    borderColor: selectedTierId === tier.id ? "#0284C7" : "#E2E8F0",
                                                    background: selectedTierId === tier.id ? "#F0F9FF" : "#FFFFFF",
                                                }}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-black text-slate-950">{tier.name}</p>
                                                    <p className="mt-1 text-xs leading-5 text-slate-500">{tier.audience ?? tier.description}</p>
                                                </div>
                                                <p className="text-sm font-black text-sky-700">
                                                    {formatMoney(tier.priceMonthly)}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {(selectedTier?.priceAnnual ?? 0) > 0 && (
                                    <div className="mt-5 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
                                        {(["monthly", "annual"] as const).map((cycle) => (
                                            <button key={cycle} type="button" onClick={() => setBillingCycle(cycle)}
                                                    className={`h-10 rounded-xl text-sm font-black capitalize ${billingCycle === cycle ? "bg-white text-sky-700 shadow-sm" : "text-slate-500"}`}>
                                                {cycle}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <button type="submit" disabled={loading || !selectedTier}
                                        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-700 to-cyan-600 text-sm font-black text-white shadow-lg shadow-sky-900/20 disabled:opacity-60">
                                    {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : selectedTier?.ctaLabel ?? "Create account"}
                                </button>
                                <p className="mt-4 text-center text-xs leading-5 text-slate-500">
                                    By creating an account you agree to the <Link href="/terms" className="font-bold text-sky-700">Terms</Link> and <Link href="/privacy" className="font-bold text-sky-700">Privacy Policy</Link>.
                                </p>
                            </section>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
            {children}
        </label>
    );
}

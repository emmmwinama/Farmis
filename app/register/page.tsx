"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, Check } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        name: "", email: "", farmName: "", password: "", confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

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
        const res = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error);
            setLoading(false);
        } else {
            router.push("/login?registered=1");
        }
    };

    const BENEFITS = [
        "Track fields, crops and activities",
        "AI-powered farm insights",
        "Yield & selling price suggestions",
        "Profitability reports by season",
        "7-day trial - no credit card needed",
    ];

    return (
        <div className="min-h-screen flex">
            {/* Left — visual */}
            <div className="hidden lg:flex w-96 flex-col bg-gradient-to-b from-[#1a3d1f] to-[#111d13] px-10 py-12">
                <div className="flex items-center gap-2.5 mb-auto">
                    <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <polygon points="9,2 16,14 2,14" fill="#2d6a35"/>
                            <polygon points="9,5 14,14 4,14" fill="#3d8c47"/>
                            <polygon points="9,8 12,14 6,14" fill="#52b85e"/>
                            <rect x="7.5" y="11" width="3" height="5" rx="1" fill="#1a3d1f"/>
                        </svg>
                    </div>
                    <span className="font-bold text-xl text-white tracking-tight">agrivault</span>
                </div>

                <div className="py-12">
                    <p className="text-xs font-bold text-[#4a7a50] uppercase tracking-widest mb-3">Trial includes</p>
                    <div className="flex flex-col gap-3">
                        {BENEFITS.map((b) => (
                            <div key={b} className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-[#3d8c47]/30 flex items-center justify-center flex-shrink-0">
                                    <Check size={11} className="text-[#7dd68a]" />
                                </div>
                                <p className="text-sm text-[#7dd68a]">{b}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-auto">
                    <p className="text-xs text-[#4a7a50] leading-relaxed">
                        Join hundreds of farms across Malawi and southern Africa already using AgriVault to make better decisions every season.
                    </p>
                </div>
            </div>

            {/* Right — form */}
            <div className="flex-1 flex items-center justify-center px-8 bg-white dark:bg-slate-950">
                <div className="w-full max-w-sm">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Create your account</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Start managing your farm in minutes with a 7-day trial.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {[
                            { key: "name", label: "Your full name", placeholder: "John Banda", type: "text" },
                            { key: "email", label: "Email address", placeholder: "john@farm.com", type: "email" },
                            { key: "farmName", label: "Farm name", placeholder: "Sunrise Farm", type: "text" },
                        ].map(({ key, label, placeholder, type }) => (
                            <div key={key}>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">{label}</label>
                                <input
                                    type={type}
                                    value={form[key as keyof typeof form]}
                                    onChange={(e) => set(key, e.target.value)}
                                    placeholder={placeholder}
                                    required
                                    className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-[#3d8c47] focus:ring-2 focus:ring-[#3d8c47]/10 transition-all text-slate-900 dark:text-white placeholder-slate-400"
                                />
                            </div>
                        ))}

                        <div>
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={form.password}
                                    onChange={(e) => set("password", e.target.value)}
                                    placeholder="Min 8 characters"
                                    required
                                    className="w-full h-12 px-4 pr-12 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-[#3d8c47] focus:ring-2 focus:ring-[#3d8c47]/10 transition-all text-slate-900 dark:text-white"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Confirm password</label>
                            <input
                                type="password"
                                value={form.confirmPassword}
                                onChange={(e) => set("confirmPassword", e.target.value)}
                                placeholder="••••••••"
                                required
                                className={`w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-900 border rounded-xl outline-none focus:ring-2 transition-all text-slate-900 dark:text-white ${
                                    form.confirmPassword && form.confirmPassword !== form.password
                                        ? "border-red-300 focus:ring-red-100"
                                        : "border-slate-200 dark:border-slate-800 focus:border-[#3d8c47] focus:ring-[#3d8c47]/10"
                                }`}
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-[#1a3d1f] hover:bg-[#2d5c35] text-white text-sm font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-[#1a3d1f]/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : "Create free account"}
                        </button>

                        <p className="text-xs text-center text-slate-400 mt-1">
                            By creating an account you agree to our{" "}
                            <Link href="/terms" className="text-[#1a3d1f] dark:text-[#7dd68a] hover:underline">Terms</Link>
                            {" "}and{" "}
                            <Link href="/privacy" className="text-[#1a3d1f] dark:text-[#7dd68a] hover:underline">Privacy Policy</Link>
                        </p>
                    </form>

                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
                        Already have an account?{" "}
                        <Link href="/login" className="text-[#1a3d1f] dark:text-[#7dd68a] font-semibold hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

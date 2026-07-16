"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });
        if (result?.error) {
            setError("Invalid email or password");
            setLoading(false);
        } else {
            router.push("/dashboard");
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left - form */}
            <div className="flex-1 flex items-center justify-center px-8 bg-white dark:bg-slate-950">
                <div className="w-full max-w-sm">
                    {/* Logo */}
                    <div className="flex items-center gap-2.5 mb-10">
                        <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-sky-200"><ShieldCheck size={21} /></div><span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">AgriVault</span>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome back</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Sign in to manage your farm</p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                                Email address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@farm.com"
                                required
                                className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-[#3d8c47] focus:ring-2 focus:ring-[#3d8c47]/10 transition-all text-slate-900 dark:text-white placeholder-slate-400"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    required
                                    className="w-full h-12 px-4 pr-12 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-[#3d8c47] focus:ring-2 focus:ring-[#3d8c47]/10 transition-all text-slate-900 dark:text-white"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
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
                            {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : "Sign in"}
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="text-[#1a3d1f] dark:text-[#7dd68a] font-semibold hover:underline">
                            Create one free
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right - visual */}
            <div className="hidden lg:flex flex-1 relative bg-[#1a3d1f] items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    {Array.from({ length: 6 }).map((_, row) =>
                        Array.from({ length: 8 }).map((_, col) => (
                            <div
                                key={`${row}-${col}`}
                                className="absolute w-32 h-32 rounded-full border border-white/30"
                                style={{
                                    left: `${col * 14 - 5}%`,
                                    top: `${row * 18 - 5}%`,
                                }}
                            />
                        ))
                    )}
                </div>

                <div className="relative z-10 text-center px-12">
                    <div className="w-20 h-20 rounded-3xl bg-white/10 text-sky-100 flex items-center justify-center mx-auto mb-6"><ShieldCheck size={38} /></div><h2 className="text-3xl font-bold text-white mb-4 leading-tight">
                        Manage your farm<br />like a business
                    </h2>
                    <p className="text-[#7dd68a] leading-relaxed max-w-sm">
                        Track fields, crops, activities, yields and finances - all powered by AI insights built for African agriculture.
                    </p>

                    <div className="mt-10 grid grid-cols-3 gap-4">
                        {[
                            { value: "500+", label: "Farms" },
                            { value: "12K+", label: "Hectares" },
                            { value: "98%", label: "Uptime" },
                        ].map(({ value, label }) => (
                            <div key={label} className="bg-white/10 rounded-2xl p-4">
                                <p className="text-2xl font-bold text-white">{value}</p>
                                <p className="text-xs text-[#7dd68a] mt-1">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

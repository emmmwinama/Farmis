"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DarkModeToggle from "@/components/DarkModeToggle";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const res = await fetch("/api/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error);
            setLoading(false);
        } else {
            router.push("/admin");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#111d13] dark:bg-[#0a1209] px-4">
            <div className="w-full max-w-sm">
                <div className="flex justify-end mb-4">
                    <DarkModeToggle variant="navbar" />
                </div>

                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-[#1a3d1f] border border-[#2d5c35] rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg width="26" height="26" viewBox="0 0 18 18" fill="none">
                            <polygon points="9,2 16,14 2,14" fill="#2d6a35"/>
                            <polygon points="9,5 14,14 4,14" fill="#3d8c47"/>
                            <polygon points="9,8 12,14 6,14" fill="#52b85e"/>
                            <rect x="7.5" y="11" width="3" height="5" rx="1" fill="#1a3d1f"/>
                        </svg>
                    </div>
                    <h1 className="text-xl font-medium text-white">Farmio Admin</h1>
                    <p className="text-sm text-[#4a7a50] mt-1">Restricted access</p>
                </div>

                <div className="bg-[#1a2d1c] border border-[#2d5c35] rounded-2xl p-8">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="text-xs text-[#4a7a50] mb-1.5 block">Admin email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@farmio.app"
                                required
                                className="w-full h-12 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] transition-colors text-white placeholder-[#2d5c35]"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-[#4a7a50] mb-1.5 block">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full h-12 px-4 text-sm bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] transition-colors text-white"
                            />
                        </div>
                        {error && (
                            <p className="text-sm text-red-400 bg-red-900/20 px-4 py-3 rounded-xl">
                                {error}
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="h-12 bg-[#1a3d1f] text-white text-sm font-medium rounded-xl hover:bg-[#2d5c35] transition-colors disabled:opacity-50"
                        >
                            {loading ? "Signing in..." : "Sign in to admin"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
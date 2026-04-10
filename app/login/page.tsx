"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid email or password");
                setLoading(false);
            } else if (result?.ok) {
                // Add a small delay to ensure session is created
                setTimeout(() => {
                    router.push("/dashboard");
                }, 100);
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-10">

                <div className="mb-10">
                    <h1 className="text-3xl font-medium text-slate-900">🌾 Farmio</h1>
                    <p className="text-slate-500 mt-1 text-base">Sign in to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm text-slate-500" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full h-14 px-4 text-base bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-slate-500" htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full h-14 px-4 text-base bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 transition-colors"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 bg-slate-900 text-white text-base font-medium rounded-xl hover:bg-slate-800 active:bg-slate-950 transition-colors disabled:opacity-50"
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <p className="text-center text-sm text-slate-500 mt-8">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="text-slate-900 font-medium hover:underline">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
}
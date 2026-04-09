"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Check, X } from "lucide-react";

function ActivateContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [status, setStatus] = useState<"loading" | "form" | "success" | "error">("loading");
    const [error, setError] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [saving, setSaving] = useState(false);
    const [userName, setUserName] = useState("");

    useEffect(() => {
        if (!token) { setStatus("error"); setError("Invalid activation link."); return; }
        fetch(`/api/activate?token=${token}`)
            .then((r) => r.json())
            .then((d) => {
                if (d.error) { setStatus("error"); setError(d.error); }
                else { setUserName(d.name); setStatus("form"); }
            });
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) { setError("Passwords do not match"); return; }
        if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
        setSaving(true);
        const res = await fetch("/api/activate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, password }),
        });
        const d = await res.json();
        if (!res.ok) { setError(d.error); setSaving(false); }
        else { setStatus("success"); setTimeout(() => router.push("/login"), 3000); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-10">
                <div className="mb-8 text-center">
                    <div className="w-12 h-12 bg-[#1a3d1f] rounded-xl flex items-center justify-center mx-auto mb-4">
                        <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
                            <polygon points="9,2 16,14 2,14" fill="#2d6a35"/>
                            <polygon points="9,5 14,14 4,14" fill="#3d8c47"/>
                            <polygon points="9,8 12,14 6,14" fill="#52b85e"/>
                            <rect x="7.5" y="11" width="3" height="5" rx="1" fill="#1a3d1f"/>
                        </svg>
                    </div>
                    <h1 className="text-xl font-medium text-slate-900">🌾 Farmio</h1>
                </div>

                {status === "loading" && (
                    <div className="flex justify-center py-8">
                        <Loader2 size={24} className="animate-spin text-slate-400" />
                    </div>
                )}

                {status === "error" && (
                    <div className="text-center">
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <X size={20} className="text-red-500" />
                        </div>
                        <p className="font-medium text-slate-900 mb-2">Activation failed</p>
                        <p className="text-sm text-slate-500">{error}</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="text-center">
                        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check size={20} className="text-green-600" />
                        </div>
                        <p className="font-medium text-slate-900 mb-2">Account activated!</p>
                        <p className="text-sm text-slate-500">Redirecting you to sign in...</p>
                    </div>
                )}

                {status === "form" && (
                    <div>
                        <p className="text-base font-medium text-slate-900 mb-1">Welcome, {userName}</p>
                        <p className="text-sm text-slate-400 mb-6">Set your password to activate your account.</p>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="text-sm text-slate-500 mb-1.5 block">New password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-500 mb-1.5 block">Confirm password</label>
                                <input
                                    type="password"
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className={`w-full h-12 px-4 text-sm bg-slate-50 border rounded-xl outline-none focus:border-slate-400 transition-colors ${
                                        confirm && confirm !== password ? "border-red-300" : "border-slate-200"
                                    }`}
                                />
                            </div>
                            {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
                            <button
                                type="submit"
                                disabled={saving}
                                className="h-12 bg-[#1a3d1f] text-white text-sm font-medium rounded-xl hover:bg-[#2d5c35] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? <><Loader2 size={15} className="animate-spin" /> Activating...</> : "Activate account"}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ActivatePage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-slate-400" /></div>}>
            <ActivateContent />
        </Suspense>
    );
}
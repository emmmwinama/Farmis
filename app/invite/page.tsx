"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Check, X } from "lucide-react";

function InviteContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [error, setError] = useState("");

    useEffect(() => {
        if (!token) { setStatus("error"); setError("Invalid invite link."); return; }
        fetch("/api/team/accept", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
        })
            .then((r) => r.json())
            .then((d) => {
                if (d.error) { setStatus("error"); setError(d.error); }
                else { setStatus("success"); setTimeout(() => router.push("/dashboard"), 3000); }
            });
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-10 text-center">
                <div className="w-12 h-12 bg-[#1a3d1f] rounded-xl flex items-center justify-center mx-auto mb-6">
                    <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
                        <polygon points="9,2 16,14 2,14" fill="#2d6a35"/>
                        <polygon points="9,5 14,14 4,14" fill="#3d8c47"/>
                        <polygon points="9,8 12,14 6,14" fill="#52b85e"/>
                        <rect x="7.5" y="11" width="3" height="5" rx="1" fill="#1a3d1f"/>
                    </svg>
                </div>

                {status === "loading" && (
                    <>
                        <Loader2 size={24} className="animate-spin text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-600 text-sm">Accepting your invitation...</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check size={20} className="text-green-600" />
                        </div>
                        <p className="font-medium text-slate-900 mb-2">Invitation accepted!</p>
                        <p className="text-sm text-slate-500">You have been added to the farm. Redirecting to dashboard...</p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <X size={20} className="text-red-500" />
                        </div>
                        <p className="font-medium text-slate-900 mb-2">Invite failed</p>
                        <p className="text-sm text-slate-500">{error}</p>
                    </>
                )}
            </div>
        </div>
    );
}

export default function InvitePage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-400" /></div>}>
            <InviteContent />
        </Suspense>
    );
}
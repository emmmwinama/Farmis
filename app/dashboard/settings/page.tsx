"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
    Loader2, Check, LogOut, Trash2, Plus, Pencil, X, Building2,
} from "lucide-react";

function Section({
                     title,
                     description,
                     children,
                 }: {
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{description}</p>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

export default function SettingsPage() {
    const { data: session, update } = useSession();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [userName, setUserName] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [farmName, setFarmName] = useState("");
    const [farmLocation, setFarmLocation] = useState("");
    const [activeFarmId, setActiveFarmId] = useState<string | null>(null);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [farms, setFarms] = useState<any[]>([]);
    const [showAddFarm, setShowAddFarm] = useState(false);
    const [newFarmName, setNewFarmName] = useState("");
    const [newFarmLocation, setNewFarmLocation] = useState("");
    const [creatingFarm, setCreatingFarm] = useState(false);
    const [farmError, setFarmError] = useState("");

    const loadSettings = () => {
        fetch("/api/settings")
            .then((r) => r.json())
            .then((d) => {
                setUserName(d.user?.name ?? "");
                setUserEmail(d.user?.email ?? "");
                setFarmName(d.farm?.name ?? "");
                setFarmLocation(d.farm?.location ?? "");
                setLoading(false);
            });
    };

    const loadFarms = () => {
        Promise.all([
            fetch("/api/farms").then((r) => r.json()),
            fetch("/api/farm-context").then((r) => r.json()),
        ]).then(([farmsData, contextData]) => {
            setFarms(farmsData);
            setActiveFarmId(contextData.activeFarmId);
        });
    };

    useEffect(() => {
        loadSettings();
        loadFarms();
    }, []);

    const showSuccess = (key: string) => {
        setSuccess(key);
        setTimeout(() => setSuccess(null), 3000);
    };

    const showError = (msg: string) => {
        setError(msg);
        setTimeout(() => setError(null), 4000);
    };

    const handleProfileSave = async () => {
        setSaving("profile");
        const res = await fetch("/api/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userName, farmName, farmLocation }),
        });
        const data = await res.json();
        setSaving(null);
        if (res.ok) {
            await update({ name: userName });
            showSuccess("profile");
        } else {
            showError(data.error);
        }
    };

    const handlePasswordSave = async () => {
        if (newPassword !== confirmPassword) {
            showError("New passwords do not match");
            return;
        }
        setSaving("password");
        const res = await fetch("/api/settings/password", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentPassword, newPassword }),
        });
        const data = await res.json();
        setSaving(null);
        if (res.ok) {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            showSuccess("password");
        } else {
            showError(data.error);
        }
    };

    const handleSwitchFarm = async (farmId: string) => {
        await fetch("/api/farm-context", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ farmId }),
        });
        setActiveFarmId(farmId);
        loadSettings();
    };

    const handleAddFarm = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingFarm(true);
        setFarmError("");
        const res = await fetch("/api/farms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newFarmName, location: newFarmLocation }),
        });
        const data = await res.json();
        if (!res.ok) {
            setFarmError(data.error);
            setCreatingFarm(false);
        } else {
            setNewFarmName("");
            setNewFarmLocation("");
            setShowAddFarm(false);
            setCreatingFarm(false);
            loadFarms();
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 size={24} className="animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Settings</h1>
                <p className="text-slate-400 text-sm mt-1">Manage your account and farm details</p>
            </div>

            {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            <div className="flex flex-col gap-5">

                {/* Profile */}
                <Section title="Profile" description="Update your name and view your account email">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg font-semibold text-slate-700 dark:text-slate-300">
                                {userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900 dark:text-white">{userName}</p>
                                <p className="text-sm text-slate-400">{userEmail}</p>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm text-slate-500 dark:text-slate-400 mb-1.5 block">Full name</label>
                            <input
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors text-slate-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-slate-500 dark:text-slate-400 mb-1.5 block">Email</label>
                            <input
                                value={userEmail}
                                disabled
                                className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-400 cursor-not-allowed"
                            />
                            <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
                        </div>

                        <button
                            onClick={handleProfileSave}
                            disabled={saving === "profile"}
                            className="flex items-center justify-center gap-2 h-11 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50 w-fit"
                        >
                            {saving === "profile"
                                ? <><Loader2 size={15} className="animate-spin" /> Saving...</>
                                : success === "profile"
                                    ? <><Check size={15} /> Saved!</>
                                    : "Save profile"}
                        </button>
                    </div>
                </Section>

                {/* Active farm details */}
                <Section title="Active farm details" description="Update the currently active farm's name and location">
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="text-sm text-slate-500 dark:text-slate-400 mb-1.5 block">Farm name</label>
                            <input
                                value={farmName}
                                onChange={(e) => setFarmName(e.target.value)}
                                className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors text-slate-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-slate-500 dark:text-slate-400 mb-1.5 block">Location</label>
                            <input
                                value={farmLocation}
                                onChange={(e) => setFarmLocation(e.target.value)}
                                placeholder="e.g. Lilongwe, Malawi"
                                className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors text-slate-900 dark:text-white"
                            />
                        </div>

                        <button
                            onClick={handleProfileSave}
                            disabled={saving === "profile"}
                            className="flex items-center justify-center gap-2 h-11 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50 w-fit"
                        >
                            {saving === "profile"
                                ? <><Loader2 size={15} className="animate-spin" /> Saving...</>
                                : success === "profile"
                                    ? <><Check size={15} /> Saved!</>
                                    : "Save farm details"}
                        </button>
                    </div>
                </Section>

                {/* My farms */}
                <Section title="My farms" description="Switch between farms or add a new one">
                    <div className="flex flex-col gap-3">
                        {farms.map((farm) => (
                            <div
                                key={farm.id}
                                className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                                    farm.id === activeFarmId
                                        ? "border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800"
                                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-[#1a3d1f] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                        {farm.name[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{farm.name}</p>
                                        <p className="text-xs text-slate-400">{farm.location}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {farm.id === activeFarmId ? (
                                        <span className="text-xs bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-2.5 py-0.5 rounded-lg font-semibold">
                      Active
                    </span>
                                    ) : (
                                        <button
                                            onClick={() => handleSwitchFarm(farm.id)}
                                            className="text-xs border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
                                        >
                                            Switch to
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {showAddFarm ? (
                            <form onSubmit={handleAddFarm} className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Farm name</label>
                                        <input
                                            value={newFarmName}
                                            onChange={(e) => setNewFarmName(e.target.value)}
                                            placeholder="My new farm"
                                            required
                                            className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-slate-400 text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Location</label>
                                        <input
                                            value={newFarmLocation}
                                            onChange={(e) => setNewFarmLocation(e.target.value)}
                                            placeholder="e.g. Lilongwe"
                                            className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-slate-400 text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                                {farmError && <p className="text-xs text-red-500">{farmError}</p>}
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => { setShowAddFarm(false); setFarmError(""); }}
                                        className="flex-1 h-9 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creatingFarm}
                                        className="flex-1 h-9 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                                    >
                                        {creatingFarm ? <><Loader2 size={13} className="animate-spin" /> Creating...</> : <><Check size={13} /> Create farm</>}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <button
                                onClick={() => setShowAddFarm(true)}
                                className="flex items-center gap-2 h-10 px-4 border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm rounded-xl hover:border-slate-400 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-white transition-colors"
                            >
                                <Plus size={15} /> Add another farm
                            </button>
                        )}
                    </div>
                </Section>

                {/* Password */}
                <Section title="Password" description="Change your account password">
                    <div className="flex flex-col gap-4">
                        {[
                            { label: "Current password", value: currentPassword, set: setCurrentPassword },
                            { label: "New password", value: newPassword, set: setNewPassword },
                            { label: "Confirm new password", value: confirmPassword, set: setConfirmPassword },
                        ].map(({ label, value, set }) => (
                            <div key={label}>
                                <label className="text-sm text-slate-500 dark:text-slate-400 mb-1.5 block">{label}</label>
                                <input
                                    type="password"
                                    value={value}
                                    onChange={(e) => set(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors text-slate-900 dark:text-white"
                                />
                            </div>
                        ))}

                        {confirmPassword && confirmPassword !== newPassword && (
                            <p className="text-xs text-red-500">Passwords do not match</p>
                        )}

                        <button
                            onClick={handlePasswordSave}
                            disabled={
                                saving === "password" ||
                                !currentPassword ||
                                !newPassword ||
                                newPassword !== confirmPassword
                            }
                            className="flex items-center justify-center gap-2 h-11 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50 w-fit"
                        >
                            {saving === "password"
                                ? <><Loader2 size={15} className="animate-spin" /> Updating...</>
                                : success === "password"
                                    ? <><Check size={15} /> Updated!</>
                                    : "Update password"}
                        </button>
                    </div>
                </Section>

                {/* Account */}
                <Section title="Account" description="Manage your session">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">Sign out</p>
                                <p className="text-xs text-slate-400 mt-0.5">Sign out of your account on this device</p>
                            </div>
                            <button
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="flex items-center gap-2 h-9 px-4 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl hover:bg-white dark:hover:bg-slate-900 transition-colors"
                            >
                                <LogOut size={14} /> Sign out
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl">
                            <div>
                                <p className="text-sm font-semibold text-red-900 dark:text-red-400">Danger zone</p>
                                <p className="text-xs text-red-400 mt-0.5">Deleting your account is permanent and cannot be undone</p>
                            </div>
                            <button
                                onClick={() => alert("Please contact support to delete your account")}
                                className="flex items-center gap-2 h-9 px-4 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 text-sm font-medium rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                            >
                                <Trash2 size={14} /> Delete account
                            </button>
                        </div>
                    </div>
                </Section>

            </div>
        </div>
    );
}
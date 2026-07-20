"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Loader2, Check, LogOut, Trash2, Plus } from "lucide-react";

const INP: React.CSSProperties = {
    width: "100%", height: "44px", padding: "0 14px",
    fontSize: "13px", outline: "none", borderRadius: "10px",
    border: "1px solid var(--border)",
    background: "var(--bg-subtle)",
    color: "var(--text-primary)",
};

const INP_DISABLED: React.CSSProperties = {
    ...INP,
    color: "var(--text-muted)",
    cursor: "not-allowed",
    opacity: 0.6,
};

function Label({ children }: { children: React.ReactNode }) {
    return (
        <label style={{
            display: "block", fontSize: "10px", fontWeight: 900,
            textTransform: "uppercase", letterSpacing: "0.08em",
            marginBottom: "6px", color: "var(--text-muted)",
        }}>
            {children}
        </label>
    );
}

function Section({ title, description, children }: {
    title: string; description: string; children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl overflow-hidden"
             style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="px-6 py-5"
                 style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                <h2 className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>{title}</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{description}</p>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

function SaveButton({ savingKey, saving, success, label, onClick, disabled }: {
    savingKey: string; saving: string | null; success: string | null;
    label: string; onClick: () => void; disabled?: boolean;
}) {
    const isSaving  = saving  === savingKey;
    const isSuccess = success === savingKey;
    return (
        <button onClick={onClick}
                disabled={isSaving || disabled}
                className="flex items-center justify-center gap-2 h-10 px-5 rounded-xl text-sm font-bold text-white transition-all"
                style={{ background: isSaving || disabled ? "#94A3B8" : isSuccess ? "#16A34A" : "var(--farm-green)" }}>
            {isSaving
                ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
                : isSuccess
                    ? <><Check size={14} /> Saved!</>
                    : label}
        </button>
    );
}

export default function SettingsPage() {
    const { data: session, update } = useSession();
    const [loading,        setLoading]        = useState(true);
    const [saving,         setSaving]         = useState<string | null>(null);
    const [success,        setSuccess]        = useState<string | null>(null);
    const [error,          setError]          = useState<string | null>(null);

    const [userName,       setUserName]       = useState("");
    const [userEmail,      setUserEmail]      = useState("");
    const [farmName,       setFarmName]       = useState("");
    const [farmLocation,   setFarmLocation]   = useState("");
    const [activeFarmId,   setActiveFarmId]   = useState<string | null>(null);

    const [currentPassword,  setCurrentPassword]  = useState("");
    const [newPassword,      setNewPassword]      = useState("");
    const [confirmPassword,  setConfirmPassword]  = useState("");

    const [farms,          setFarms]          = useState<any[]>([]);
    const [showAddFarm,    setShowAddFarm]    = useState(false);
    const [newFarmName,    setNewFarmName]    = useState("");
    const [newFarmLocation, setNewFarmLocation] = useState("");
    const [creatingFarm,   setCreatingFarm]   = useState(false);
    const [farmError,      setFarmError]      = useState("");

    const loadSettings = () => {
        fetch("/api/settings").then((r) => r.json()).then((d) => {
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

    useEffect(() => { loadSettings(); loadFarms(); }, []);

    const showSuccessMsg = (key: string) => {
        setSuccess(key); setTimeout(() => setSuccess(null), 3000);
    };
    const showErrorMsg = (msg: string) => {
        setError(msg); setTimeout(() => setError(null), 4000);
    };

    const handleProfileSave = async () => {
        setSaving("profile");
        const res  = await fetch("/api/settings", {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userName, farmName, farmLocation }),
        });
        const data = await res.json();
        setSaving(null);
        if (res.ok) { await update({ name: userName }); showSuccessMsg("profile"); }
        else        { showErrorMsg(data.error); }
    };

    const handlePasswordSave = async () => {
        if (newPassword !== confirmPassword) { showErrorMsg("New passwords do not match"); return; }
        setSaving("password");
        const res  = await fetch("/api/settings/password", {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentPassword, newPassword }),
        });
        const data = await res.json();
        setSaving(null);
        if (res.ok) { setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); showSuccessMsg("password"); }
        else        { showErrorMsg(data.error); }
    };

    const handleSwitchFarm = async (farmId: string) => {
        await fetch("/api/farm-context", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ farmId }),
        });
        setActiveFarmId(farmId);
        loadSettings();
    };

    const handleAddFarm = async (e: React.FormEvent) => {
        e.preventDefault(); setCreatingFarm(true); setFarmError("");
        const res  = await fetch("/api/farms", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newFarmName, location: newFarmLocation }),
        });
        const data = await res.json();
        if (!res.ok) { setFarmError(data.error); setCreatingFarm(false); }
        else         { setNewFarmName(""); setNewFarmLocation(""); setShowAddFarm(false); setCreatingFarm(false); loadFarms(); }
    };

    const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

    if (loading) return (
        <div className="flex justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: "var(--farm-green)" }} />
        </div>
    );

    return (
        <div className="p-8 max-w-2xl mx-auto">

            <div className="mb-8">
                <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)", letterSpacing: "-0.04em" }}>
                    Settings
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                    Manage your account and farm details
                </p>
            </div>

            {/* Global error banner */}
            {error && (
                <div className="mb-5 px-4 py-3 rounded-xl text-sm font-semibold"
                     style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#7F1D1D" }}>
                    {error}
                </div>
            )}

            <div className="flex flex-col gap-5">

                {/* ── Profile ─────────────────────────────────────────────────── */}
                <Section title="Profile" description="Update your name and view your account email">
                    <div className="flex flex-col gap-4">
                        {/* Avatar + name preview */}
                        <div className="flex items-center gap-4 mb-1">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black flex-shrink-0"
                                 style={{ background: "var(--farm-green)", color: "#fff" }}>
                                {initials}
                            </div>
                            <div>
                                <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>{userName}</p>
                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{userEmail}</p>
                            </div>
                        </div>

                        <div>
                            <Label>Full name</Label>
                            <input value={userName} onChange={(e) => setUserName(e.target.value)} style={INP} />
                        </div>

                        <div>
                            <Label>Email</Label>
                            <input value={userEmail} disabled style={INP_DISABLED} />
                            <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                                Email cannot be changed
                            </p>
                        </div>

                        <SaveButton savingKey="profile" saving={saving} success={success}
                                    label="Save profile" onClick={handleProfileSave} />
                    </div>
                </Section>

                {/* ── Active farm ──────────────────────────────────────────────── */}
                <Section title="Active farm details" description="Update the currently active farm's name and location">
                    <div className="flex flex-col gap-4">
                        <div>
                            <Label>Farm name</Label>
                            <input value={farmName} onChange={(e) => setFarmName(e.target.value)} style={INP} />
                        </div>
                        <div>
                            <Label>Location</Label>
                            <input value={farmLocation} onChange={(e) => setFarmLocation(e.target.value)}
                                   placeholder="e.g. District, region, or nearest town" style={INP} />
                        </div>
                        <SaveButton savingKey="profile" saving={saving} success={success}
                                    label="Save farm details" onClick={handleProfileSave} />
                    </div>
                </Section>

                {/* ── My farms ─────────────────────────────────────────────────── */}
                <Section title="My farms" description="Switch between farms or add a new one">
                    <div className="flex flex-col gap-3">
                        {farms.map((farm) => {
                            const isActive = farm.id === activeFarmId;
                            return (
                                <div key={farm.id}
                                     className="flex items-center justify-between p-4 rounded-xl transition-all"
                                     style={{
                                         border: `1.5px solid ${isActive ? "var(--farm-green)" : "var(--border)"}`,
                                         background: isActive ? "var(--farm-pale)" : "var(--bg-subtle)",
                                     }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                                             style={{ background: "var(--farm-green)" }}>
                                            {farm.name[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                                                {farm.name}
                                            </p>
                                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                {farm.location}
                                            </p>
                                        </div>
                                    </div>
                                    {isActive ? (
                                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full"
                                              style={{ background: "var(--farm-green)", color: "#fff" }}>
                                            Active
                                        </span>
                                    ) : (
                                        <button onClick={() => handleSwitchFarm(farm.id)}
                                                className="text-xs font-bold h-8 px-4 rounded-xl transition-all"
                                                style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", background: "var(--bg-card)" }}>
                                            Switch to
                                        </button>
                                    )}
                                </div>
                            );
                        })}

                        {/* Add farm inline form */}
                        {showAddFarm ? (
                            <form onSubmit={handleAddFarm}
                                  className="rounded-xl p-4 flex flex-col gap-3"
                                  style={{ border: "1.5px dashed var(--border)", background: "var(--bg-subtle)" }}>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label>Farm name *</Label>
                                        <input value={newFarmName} onChange={(e) => setNewFarmName(e.target.value)}
                                               placeholder="My new farm" required
                                               style={{ ...INP, height: "36px", fontSize: "12px" }} />
                                    </div>
                                    <div>
                                        <Label>Location</Label>
                                        <input value={newFarmLocation} onChange={(e) => setNewFarmLocation(e.target.value)}
                                               placeholder="e.g. Lilongwe"
                                               style={{ ...INP, height: "36px", fontSize: "12px" }} />
                                    </div>
                                </div>
                                {farmError && (
                                    <p className="text-xs font-semibold" style={{ color: "#DC2626" }}>{farmError}</p>
                                )}
                                <div className="flex gap-2">
                                    <button type="button"
                                            onClick={() => { setShowAddFarm(false); setFarmError(""); }}
                                            className="flex-1 h-9 rounded-xl text-xs font-bold"
                                            style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={creatingFarm}
                                            className="flex-1 h-9 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5"
                                            style={{ background: creatingFarm ? "#94A3B8" : "var(--farm-green)" }}>
                                        {creatingFarm
                                            ? <><Loader2 size={12} className="animate-spin" /> Creating...</>
                                            : <><Check size={12} /> Create farm</>}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <button onClick={() => setShowAddFarm(true)}
                                    className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-bold transition-all"
                                    style={{ border: "1.5px dashed var(--border)", color: "var(--text-muted)" }}
                                    onMouseOver={(e) => {
                                        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--farm-green)";
                                        (e.currentTarget as HTMLButtonElement).style.color = "var(--farm-green)";
                                    }}
                                    onMouseOut={(e) => {
                                        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                                        (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
                                    }}>
                                <Plus size={14} /> Add another farm
                            </button>
                        )}
                    </div>
                </Section>

                {/* ── Password ─────────────────────────────────────────────────── */}
                <Section title="Password" description="Change your account password">
                    <div className="flex flex-col gap-4">
                        {[
                            { label: "Current password",      value: currentPassword,  set: setCurrentPassword  },
                            { label: "New password",          value: newPassword,      set: setNewPassword      },
                            { label: "Confirm new password",  value: confirmPassword,  set: setConfirmPassword  },
                        ].map(({ label, value, set }) => (
                            <div key={label}>
                                <Label>{label}</Label>
                                <input type="password" value={value} onChange={(e) => set(e.target.value)}
                                       placeholder="••••••••" style={INP} />
                            </div>
                        ))}

                        {confirmPassword && confirmPassword !== newPassword && (
                            <p className="text-xs font-bold" style={{ color: "#DC2626" }}>
                                Passwords do not match
                            </p>
                        )}

                        <SaveButton savingKey="password" saving={saving} success={success}
                                    label="Update password" onClick={handlePasswordSave}
                                    disabled={!currentPassword || !newPassword || newPassword !== confirmPassword} />
                    </div>
                </Section>

                {/* ── Account ──────────────────────────────────────────────────── */}
                <Section title="Account" description="Manage your session">
                    <div className="flex flex-col gap-3">
                        {/* Sign out */}
                        <div className="flex items-center justify-between p-4 rounded-xl"
                             style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                            <div>
                                <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                                    Sign out
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                                    Sign out of your account on this device
                                </p>
                            </div>
                            <button onClick={() => signOut({ callbackUrl: "/login" })}
                                    className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-bold transition-all"
                                    style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", background: "var(--bg-card)" }}>
                                <LogOut size={13} /> Sign out
                            </button>
                        </div>

                        {/* Danger zone */}
                        <div className="flex items-center justify-between p-4 rounded-xl"
                             style={{ background: "#FEF2F2", border: "1px solid #FCA5A5" }}>
                            <div>
                                <p className="text-sm font-extrabold" style={{ color: "#7F1D1D" }}>Danger zone</p>
                                <p className="text-xs mt-0.5" style={{ color: "#DC2626" }}>
                                    Deleting your account is permanent and cannot be undone
                                </p>
                            </div>
                            <button onClick={() => alert("Please contact support to delete your account")}
                                    className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-bold transition-all"
                                    style={{ border: "1px solid #FCA5A5", color: "#DC2626", background: "white" }}>
                                <Trash2 size={13} /> Delete account
                            </button>
                        </div>
                    </div>
                </Section>

            </div>
        </div>
    );
}

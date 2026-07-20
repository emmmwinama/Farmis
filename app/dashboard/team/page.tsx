"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, Trash2, Copy, Check, X, Pencil, Users2 } from "lucide-react";
import { ROLES, PERMISSIONS, ROLE_DEFAULTS, getDefaultPermissions } from "@/lib/permissions";

const ROLE_BADGE: Record<string, { bg: string; color: string }> = {
    owner:      { bg: "#F5F3FF", color: "#3C3489" },
    manager:    { bg: "#EFF6FF", color: "#1E3A8A" },
    agronomist: { bg: "#ECFDF5", color: "#166534" },
    accountant: { bg: "#F0F9FF", color: "#075985" },
    viewer:     { bg: "#F8FAFC", color: "#475569" },
};

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
    active:    { bg: "#ECFDF5", color: "#166534" },
    invited:   { bg: "#EFF6FF", color: "#1E3A8A" },
    suspended: { bg: "#FEF2F2", color: "#7F1D1D" },
};

const AVATAR_COLORS = [
    { bg: "#1a3d1f", text: "#fff" },
    { bg: "#0F766E", text: "#fff" },
    { bg: "#1E3A8A", text: "#fff" },
    { bg: "#3C3489", text: "#fff" },
    { bg: "#075985", text: "#fff" },
];

const INP: React.CSSProperties = {
    width: "100%", height: "44px", padding: "0 14px",
    fontSize: "13px", outline: "none", borderRadius: "10px",
    border: "1px solid var(--border)",
    background: "var(--bg-subtle)",
    color: "var(--text-primary)",
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

export default function TeamPage() {
    const [members,         setMembers]         = useState<any[]>([]);
    const [loading,         setLoading]         = useState(true);
    const [showInvite,      setShowInvite]      = useState(false);
    const [editingMember,   setEditingMember]   = useState<any>(null);
    const [inviteEmail,     setInviteEmail]     = useState("");
    const [inviteRole,      setInviteRole]      = useState("viewer");
    const [saving,          setSaving]          = useState(false);
    const [error,           setError]           = useState("");
    const [inviteLink,      setInviteLink]      = useState<string | null>(null);
    const [copiedLink,      setCopiedLink]      = useState(false);
    const [deletingId,      setDeletingId]      = useState<string | null>(null);
    const [customPerms,     setCustomPerms]     = useState<Record<string, boolean>>({});
    const [showCustomPerms, setShowCustomPerms] = useState(false);

    const load = () => {
        setLoading(true);
        fetch("/api/team").then((r) => r.json()).then((d) => { setMembers(d); setLoading(false); });
    };

    useEffect(() => { load(); }, []);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true); setError("");
        const res = await fetch("/api/team", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); setSaving(false); }
        else         { setInviteLink(data.inviteLink); setSaving(false); load(); }
    };

    const handleUpdateMember = async (id: string, updates: any) => {
        await fetch(`/api/team/${id}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
        });
        load();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Remove this team member?")) return;
        setDeletingId(id);
        await fetch(`/api/team/${id}`, { method: "DELETE" });
        setDeletingId(null); load();
    };

    const copyLink = () => {
        if (!inviteLink) return;
        navigator.clipboard.writeText(inviteLink);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    const openEdit = (member: any) => {
        setEditingMember(member);
        setCustomPerms(member.permissions ?? getDefaultPermissions(member.role));
        setShowCustomPerms(false);
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)", letterSpacing: "-0.04em" }}>
                        Team
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                        {members.length} team member{members.length !== 1 ? "s" : ""} · Enterprise feature
                    </p>
                </div>
                <button onClick={() => { setShowInvite(true); setInviteLink(null); setError(""); setInviteEmail(""); setInviteRole("viewer"); }}
                        className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold text-white"
                        style={{ background: "var(--farm-green)", boxShadow: "0 4px 12px rgba(26,61,31,0.25)" }}>
                    <Plus size={15} /> Invite member
                </button>
            </div>

            {/* Invite link banner */}
            {inviteLink && (
                <div className="rounded-2xl p-5 mb-6"
                     style={{ background: "#ECFDF5", border: "1.5px solid #86EFAC" }}>
                    <p className="text-sm font-extrabold mb-1" style={{ color: "#166534" }}>Invitation created</p>
                    <p className="text-xs mb-3" style={{ color: "#16A34A" }}>Share this link with the team member:</p>
                    <div className="flex items-center gap-3 rounded-xl px-4 py-3"
                         style={{ background: "var(--bg-card)", border: "1px solid #86EFAC" }}>
                        <code className="text-xs flex-1 truncate" style={{ color: "#166534" }}>
                            {inviteLink}
                        </code>
                        <button onClick={copyLink}
                                className="flex-shrink-0 p-1.5 rounded-lg transition-colors"
                                style={{ color: "#16A34A" }}>
                            {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                    </div>
                </div>
            )}

            {/* Role permissions table */}
            <div className="rounded-2xl p-5 mb-6 overflow-x-auto"
                 style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
                    Role permissions overview
                </p>
                <table className="w-full text-xs">
                    <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        <th className="text-left pb-2 pr-4 text-[10px] font-black uppercase tracking-widest"
                            style={{ color: "var(--text-muted)" }}>
                            Permission
                        </th>
                        {Object.keys(ROLES).map((role) => {
                            const b = ROLE_BADGE[role] ?? ROLE_BADGE["viewer"];
                            return (
                                <th key={role} className="text-center pb-2 px-2">
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                                              style={{ background: b.bg, color: b.color }}>
                                            {ROLES[role as keyof typeof ROLES].label}
                                        </span>
                                </th>
                            );
                        })}
                    </tr>
                    </thead>
                    <tbody>
                    {PERMISSIONS.map(({ key, label }) => (
                        <tr key={key} style={{ borderBottom: "1px solid var(--border)" }}>
                            <td className="py-2 pr-4 font-bold" style={{ color: "var(--text-secondary)" }}>
                                {label}
                            </td>
                            {Object.keys(ROLES).map((role) => (
                                <td key={role} className="py-2 px-2 text-center">
                                    {ROLE_DEFAULTS[role as keyof typeof ROLE_DEFAULTS][key as keyof typeof ROLE_DEFAULTS.owner]
                                        ? <Check size={15} className="mx-auto" style={{ color: "#16A34A" }} />
                                        : <X size={15} className="mx-auto" style={{ color: "#CBD5E1" }} />}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Members list */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={24} className="animate-spin" style={{ color: "var(--farm-green)" }} />
                </div>
            ) : members.length === 0 ? (
                <div className="rounded-2xl p-16 text-center"
                     style={{ background: "var(--bg-card)", border: "1.5px dashed var(--border)" }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                         style={{ background: "var(--bg-subtle)" }}>
                        <Users2 size={24} style={{ color: "var(--text-muted)" }} />
                    </div>
                    <p className="text-lg font-black mb-1" style={{ color: "var(--text-primary)" }}>
                        No team members yet
                    </p>
                    <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                        Invite team members to collaborate on your farm
                    </p>
                    <button onClick={() => setShowInvite(true)}
                            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-bold text-white"
                            style={{ background: "var(--farm-green)" }}>
                        <Plus size={15} /> Invite member
                    </button>
                </div>
            ) : (
                <div className="rounded-2xl overflow-hidden"
                     style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                    {members.map((member, idx) => {
                        const initials    = member.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) ?? "??";
                        const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                        const roleBadge   = ROLE_BADGE[member.role]   ?? ROLE_BADGE["viewer"];
                        const statusBadge = STATUS_BADGE[member.status] ?? STATUS_BADGE["invited"];

                        return (
                            <div key={member.id}
                                 className="flex items-center gap-4 px-6 py-4 transition-colors"
                                 style={{ borderBottom: "1px solid var(--border)" }}
                                 onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
                                 onMouseOut={(e)  => (e.currentTarget.style.background = "transparent")}>

                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
                                     style={{ background: avatarColor.bg, color: avatarColor.text }}>
                                    {initials}
                                </div>

                                {/* Name + email */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                                        {member.name}
                                    </p>
                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{member.email}</p>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center gap-2">
                                    {/* Role selector */}
                                    <select value={member.role}
                                            onChange={(e) => handleUpdateMember(member.id, { role: e.target.value })}
                                            style={{
                                                height: "28px", padding: "0 8px", fontSize: "10px",
                                                fontWeight: 900, borderRadius: "20px", outline: "none",
                                                border: "none", cursor: "pointer",
                                                background: roleBadge.bg, color: roleBadge.color,
                                            }}>
                                        {Object.entries(ROLES).map(([key, { label }]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>

                                    {/* Status badge */}
                                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full"
                                          style={{ background: statusBadge.bg, color: statusBadge.color }}>
                                        {member.status}
                                    </span>

                                    {/* Edit permissions */}
                                    <button onClick={() => openEdit(member)}
                                            className="p-1.5 rounded-lg transition-colors"
                                            style={{ color: "var(--text-muted)", background: "var(--bg-subtle)" }}
                                            title="Edit permissions">
                                        <Pencil size={13} />
                                    </button>

                                    {/* Delete */}
                                    <button onClick={() => handleDelete(member.id)}
                                            disabled={deletingId === member.id}
                                            className="p-1.5 rounded-lg transition-colors"
                                            style={{ background: "#FFF1F2", color: "#E11D48" }}>
                                        {deletingId === member.id
                                            ? <Loader2 size={13} className="animate-spin" />
                                            : <Trash2 size={13} />}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Invite slide-over ─────────────────────────────────────────── */}
            {showInvite && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setShowInvite(false)} />
                    <div className="w-full max-w-md flex flex-col shadow-2xl"
                         style={{ background: "var(--bg-card)", borderLeft: "1px solid var(--border)", height: "100vh" }}>

                        <div className="flex items-center justify-between px-6 py-5 flex-shrink-0"
                             style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                            <h2 className="text-base font-black" style={{ color: "var(--text-primary)" }}>
                                Invite team member
                            </h2>
                            <button onClick={() => setShowInvite(false)}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                                    style={{ background: "var(--bg-subtle)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                                <X size={15} />
                            </button>
                        </div>

                        <form onSubmit={handleInvite} className="flex-1 flex flex-col min-h-0">
                            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

                                <div>
                                    <Label>Email address *</Label>
                                    <input type="email" value={inviteEmail}
                                           onChange={(e) => setInviteEmail(e.target.value)}
                                           placeholder="colleague@farm.com" required style={INP} />
                                    <p className="text-[10px] mt-1.5" style={{ color: "var(--text-muted)" }}>
                                        The person must already have a AgriVault account
                                    </p>
                                </div>

                                <div>
                                    <Label>Role</Label>
                                    <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} style={INP}>
                                        {Object.entries(ROLES).filter(([k]) => k !== "owner").map(([key, { label }]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Permission preview */}
                                <div className="rounded-xl p-4"
                                     style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                                    <p className="text-[10px] font-black uppercase tracking-wide mb-3"
                                       style={{ color: "var(--text-muted)" }}>
                                        {ROLES[inviteRole as keyof typeof ROLES]?.label} can access:
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {PERMISSIONS.map(({ key, label }) => {
                                            const allowed = ROLE_DEFAULTS[inviteRole as keyof typeof ROLE_DEFAULTS]?.[key as keyof typeof ROLE_DEFAULTS.owner];
                                            return (
                                                <div key={key} className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-sm flex-shrink-0"
                                                         style={{ background: allowed ? "var(--farm-green)" : "var(--border)" }} />
                                                    <span className="text-xs"
                                                          style={{ color: allowed ? "var(--text-primary)" : "var(--text-muted)", fontWeight: allowed ? 600 : 400 }}>
                                                        {label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {error && (
                                    <div className="rounded-xl px-4 py-3"
                                         style={{ background: "#FFF1F2", border: "1px solid #FFE4E6" }}>
                                        <p className="text-sm font-semibold" style={{ color: "#9F1239" }}>{error}</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 px-6 py-5 flex-shrink-0"
                                 style={{ borderTop: "1px solid var(--border)", background: "var(--bg-card)" }}>
                                <button type="button" onClick={() => setShowInvite(false)}
                                        className="flex-1 h-11 rounded-xl font-bold text-sm"
                                        style={{ border: "1.5px solid var(--border)", color: "var(--text-muted)" }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                        className="flex-1 h-11 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
                                        style={{ background: saving ? "#94A3B8" : "var(--farm-green)" }}>
                                    {saving
                                        ? <><Loader2 size={14} className="animate-spin" /> Inviting...</>
                                        : "Send invite"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Edit permissions slide-over ───────────────────────────────── */}
            {editingMember && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setEditingMember(null)} />
                    <div className="w-full max-w-md flex flex-col shadow-2xl"
                         style={{ background: "var(--bg-card)", borderLeft: "1px solid var(--border)", height: "100vh" }}>

                        <div className="flex items-center justify-between px-6 py-5 flex-shrink-0"
                             style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                            <div>
                                <h2 className="text-base font-black" style={{ color: "var(--text-primary)" }}>
                                    Edit permissions
                                </h2>
                                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                                    {editingMember.name}
                                </p>
                            </div>
                            <button onClick={() => setEditingMember(null)}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                                    style={{ background: "var(--bg-subtle)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                                <X size={15} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

                            <div>
                                <Label>Role</Label>
                                <select value={editingMember.role}
                                        onChange={(e) => {
                                            const r = e.target.value as keyof typeof ROLE_DEFAULTS;
                                            setEditingMember({ ...editingMember, role: r });
                                            setCustomPerms(getDefaultPermissions(r));
                                        }}
                                        style={INP}>
                                    {Object.entries(ROLES).filter(([k]) => k !== "owner").map(([key, { label }]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <Label>Permissions</Label>
                                    <button onClick={() => setShowCustomPerms(!showCustomPerms)}
                                            className="text-xs font-bold"
                                            style={{ color: "var(--farm-green)" }}>
                                        {showCustomPerms ? "Reset to role defaults" : "Customise"}
                                    </button>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {PERMISSIONS.map(({ key, label }) => (
                                        <div key={key}
                                             className="flex items-center justify-between p-3 rounded-xl"
                                             style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                                            <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                                                {label}
                                            </span>
                                            <button
                                                onClick={() => { if (!showCustomPerms) setShowCustomPerms(true); setCustomPerms((p) => ({ ...p, [key]: !p[key] })); }}
                                                className="w-11 h-6 rounded-full relative flex-shrink-0 transition-colors"
                                                style={{ background: customPerms[key] ? "var(--farm-green)" : "#CBD5E1" }}>
                                                <div className="w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all"
                                                     style={{ left: customPerms[key] ? "calc(100% - 20px)" : "4px" }} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 px-6 py-5 flex-shrink-0"
                             style={{ borderTop: "1px solid var(--border)", background: "var(--bg-card)" }}>
                            <button onClick={() => setEditingMember(null)}
                                    className="flex-1 h-11 rounded-xl font-bold text-sm"
                                    style={{ border: "1.5px solid var(--border)", color: "var(--text-muted)" }}>
                                Cancel
                            </button>
                            <button onClick={async () => {
                                await handleUpdateMember(editingMember.id, { role: editingMember.role, permissions: customPerms });
                                setEditingMember(null);
                            }}
                                    className="flex-1 h-11 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
                                    style={{ background: "var(--farm-green)" }}>
                                <Check size={14} /> Save changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

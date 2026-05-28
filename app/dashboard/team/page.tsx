"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, Trash2, Copy, Check, X, Pencil, Users2 } from "lucide-react";
import { ROLES, PERMISSIONS, ROLE_DEFAULTS, getDefaultPermissions } from "@/lib/permissions";

const ROLE_COLORS: Record<string, string> = {
    owner:      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    manager:    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    agronomist: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    accountant: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    viewer:     "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
};

const STATUS_COLORS: Record<string, string> = {
    active:    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    invited:   "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    suspended: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function TeamPage() {
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInvite, setShowInvite] = useState(false);
    const [editingMember, setEditingMember] = useState<any>(null);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("viewer");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [copiedLink, setCopiedLink] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [customPerms, setCustomPerms] = useState<Record<string, boolean>>({});
    const [showCustomPerms, setShowCustomPerms] = useState(false);

    const load = () => {
        setLoading(true);
        fetch("/api/team").then((r) => r.json()).then((d) => { setMembers(d); setLoading(false); });
    };

    useEffect(() => { load(); }, []);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true); setError("");
        const res = await fetch("/api/team", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); setSaving(false); }
        else { setInviteLink(data.inviteLink); setSaving(false); load(); }
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

            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Team</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {members.length} team member{members.length !== 1 ? "s" : ""} · Enterprise feature
                    </p>
                </div>
                <button onClick={() => { setShowInvite(true); setInviteLink(null); setError(""); setInviteEmail(""); setInviteRole("viewer"); }}
                        className="flex items-center gap-2 h-10 px-5 bg-[#1a3d1f] text-white text-sm font-bold rounded-xl hover:bg-[#2d5c35] transition-colors hover:shadow-lg hover:shadow-[#1a3d1f]/20">
                    <Plus size={16} /> Invite member
                </button>
            </div>

            {inviteLink && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-5 mb-6">
                    <p className="text-sm font-bold text-green-900 dark:text-green-300 mb-2">Invitation created</p>
                    <p className="text-xs text-green-700 dark:text-green-400 mb-3">Share this link with the team member:</p>
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl px-4 py-3 border border-green-100 dark:border-green-800">
                        <code className="text-xs text-green-800 dark:text-green-300 flex-1 truncate">{inviteLink}</code>
                        <button onClick={copyLink} className="flex-shrink-0 p-1.5 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors">
                            {copiedLink ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-green-600" />}
                        </button>
                    </div>
                </div>
            )}

            {/* Role permissions table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mb-6 overflow-x-auto">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">Role permissions overview</p>
                <table className="w-full text-xs">
                    <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                        <th className="text-left text-slate-400 font-bold pb-2 pr-4">Permission</th>
                        {Object.keys(ROLES).map((role) => (
                            <th key={role} className="text-center pb-2 px-2">
                  <span className={`px-2 py-0.5 rounded-lg font-bold ${ROLE_COLORS[role]}`}>
                    {ROLES[role as keyof typeof ROLES].label}
                  </span>
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {PERMISSIONS.map(({ key, label }) => (
                        <tr key={key}>
                            <td className="py-2 pr-4 text-slate-600 dark:text-slate-400 font-medium">{label}</td>
                            {Object.keys(ROLES).map((role) => (
                                <td key={role} className="py-2 px-2 text-center">
                                    {ROLE_DEFAULTS[role as keyof typeof ROLE_DEFAULTS][key as keyof typeof ROLE_DEFAULTS.owner]
                                        ? <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                                        : <span className="text-slate-200 dark:text-slate-700">—</span>}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Members */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-slate-400" /></div>
            ) : members.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                        <Users2 size={28} className="text-slate-400" />
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white text-lg mb-2">No team members yet</p>
                    <p className="text-slate-400 text-sm mb-6">Invite team members to collaborate on your farm</p>
                    <button onClick={() => setShowInvite(true)}
                            className="inline-flex items-center gap-2 h-11 px-6 bg-[#1a3d1f] text-white text-sm font-bold rounded-xl hover:bg-[#2d5c35] transition-colors">
                        <Plus size={16} /> Invite member
                    </button>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {members.map((member) => (
                            <div key={member.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-900 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                    {member.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) ?? "??"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{member.name}</p>
                                    <p className="text-xs text-slate-400">{member.email}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select value={member.role} onChange={(e) => handleUpdateMember(member.id, { role: e.target.value })}
                                            className={`h-8 px-2 text-xs rounded-xl border-0 outline-none font-bold ${ROLE_COLORS[member.role]}`}>
                                        {Object.entries(ROLES).map(([key, { label }]) => <option key={key} value={key}>{label}</option>)}
                                    </select>
                                    <span className={`text-xs px-2 py-0.5 rounded-lg font-bold ${STATUS_COLORS[member.status]}`}>
                    {member.status}
                  </span>
                                    <button onClick={() => openEdit(member)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-700 transition-colors" title="Edit permissions">
                                        <Pencil size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(member.id)} disabled={deletingId === member.id}
                                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-slate-400 hover:text-red-600 transition-colors">
                                        {deletingId === member.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Invite form */}
            {showInvite && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setShowInvite(false)} />
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full overflow-y-auto shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">Invite team member</h2>
                            <button onClick={() => setShowInvite(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleInvite} className="flex-1 p-6 flex flex-col gap-5">
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Email address</label>
                                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@farm.com" required
                                       className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white" />
                                <p className="text-xs text-slate-400 mt-1">The person must already have a Farmio account</p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Role</label>
                                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
                                        className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white">
                                    {Object.entries(ROLES).filter(([k]) => k !== "owner").map(([key, { label }]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-3">
                                    {ROLES[inviteRole as keyof typeof ROLES]?.label} will have access to:
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {PERMISSIONS.map(({ key, label }) => {
                                        const allowed = ROLE_DEFAULTS[inviteRole as keyof typeof ROLE_DEFAULTS]?.[key as keyof typeof ROLE_DEFAULTS.owner];
                                        return (
                                            <div key={key} className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-sm flex-shrink-0 ${allowed ? "bg-[#1a3d1f]" : "bg-slate-300 dark:bg-slate-600"}`} />
                                                <span className={`text-xs ${allowed ? "text-slate-700 dark:text-slate-300 font-medium" : "text-slate-400"}`}>{label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">{error}</p>}
                            <div className="flex gap-3 mt-auto pt-4">
                                <button type="button" onClick={() => setShowInvite(false)}
                                        className="flex-1 h-12 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                                <button type="submit" disabled={saving}
                                        className="flex-1 h-12 bg-[#1a3d1f] text-white text-sm font-bold rounded-xl hover:bg-[#2d5c35] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                    {saving ? <><Loader2 size={15} className="animate-spin" /> Inviting...</> : "Send invite"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit permissions panel */}
            {editingMember && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setEditingMember(null)} />
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full overflow-y-auto shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h2 className="text-base font-bold text-slate-900 dark:text-white">Edit permissions</h2>
                                <p className="text-xs text-slate-400 mt-0.5">{editingMember.name}</p>
                            </div>
                            <button onClick={() => setEditingMember(null)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={18} /></button>
                        </div>
                        <div className="flex-1 p-6 flex flex-col gap-5">
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Role</label>
                                <select value={editingMember.role}
                                        onChange={(e) => {
                                            const newRole = e.target.value as keyof typeof ROLE_DEFAULTS;
                                            setEditingMember({ ...editingMember, role: newRole });
                                            setCustomPerms(getDefaultPermissions(newRole));
                                        }}
                                        className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white">
                                    {Object.entries(ROLES).filter(([k]) => k !== "owner").map(([key, { label }]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Permissions</label>
                                    <button onClick={() => setShowCustomPerms(!showCustomPerms)}
                                            className="text-xs text-[#1a3d1f] dark:text-[#7dd68a] font-bold hover:underline">
                                        {showCustomPerms ? "Reset to role defaults" : "Customise"}
                                    </button>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {PERMISSIONS.map(({ key, label }) => (
                                        <div key={key} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
                                            <button
                                                onClick={() => { if (!showCustomPerms) setShowCustomPerms(true); setCustomPerms((p) => ({ ...p, [key]: !p[key] })); }}
                                                className={`w-10 h-5 rounded-full transition-colors relative ${customPerms[key] ? "bg-[#1a3d1f]" : "bg-slate-300 dark:bg-slate-600"}`}>
                                                <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${customPerms[key] ? "translate-x-5" : "translate-x-0.5"}`} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 mt-auto pt-4">
                                <button onClick={() => setEditingMember(null)}
                                        className="flex-1 h-12 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                                <button
                                    onClick={async () => {
                                        await handleUpdateMember(editingMember.id, { role: editingMember.role, permissions: customPerms });
                                        setEditingMember(null);
                                    }}
                                    className="flex-1 h-12 bg-[#1a3d1f] text-white text-sm font-bold rounded-xl hover:bg-[#2d5c35] transition-colors flex items-center justify-center gap-2">
                                    <Check size={15} /> Save changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
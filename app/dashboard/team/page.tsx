"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, Trash2, Copy, Check, X, Pencil } from "lucide-react";
import { ROLES, PERMISSIONS, ROLE_DEFAULTS, getDefaultPermissions } from "@/lib/permissions";

const ROLE_COLORS: Record<string, string> = {
    owner:      "bg-purple-50 text-purple-800",
    manager:    "bg-blue-50 text-blue-800",
    agronomist: "bg-green-50 text-green-800",
    accountant: "bg-amber-50 text-amber-800",
    viewer:     "bg-slate-100 text-slate-600",
};

const STATUS_COLORS: Record<string, string> = {
    active:   "bg-green-50 text-green-800",
    invited:  "bg-blue-50 text-blue-800",
    suspended:"bg-red-50 text-red-800",
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
        fetch("/api/team")
            .then((r) => r.json())
            .then((d) => { setMembers(d); setLoading(false); });
    };

    useEffect(() => { load(); }, []);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true); setError("");
        const res = await fetch("/api/team", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); setSaving(false); }
        else {
            setInviteLink(data.inviteLink);
            setSaving(false);
            load();
        }
    };

    const handleUpdateMember = async (id: string, updates: any) => {
        await fetch(`/api/team/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
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
                    <h1 className="text-2xl font-medium text-slate-900">Team</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {members.length} team member{members.length !== 1 ? "s" : ""} &mdash; Enterprise plan feature
                    </p>
                </div>
                <button
                    onClick={() => { setShowInvite(true); setInviteLink(null); setError(""); setInviteEmail(""); setInviteRole("viewer"); }}
                    className="flex items-center gap-2 h-10 px-4 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
                >
                    <Plus size={16} /> Invite member
                </button>
            </div>

            {inviteLink && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6">
                    <p className="text-sm font-medium text-green-900 mb-2">Invitation created</p>
                    <p className="text-xs text-green-700 mb-3">Share this link with the team member:</p>
                    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-green-100">
                        <code className="text-xs text-green-800 flex-1 truncate">{inviteLink}</code>
                        <button onClick={copyLink} className="flex-shrink-0 p-1.5 hover:bg-green-50 rounded-lg transition-colors">
                            {copiedLink ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-green-600" />}
                        </button>
                    </div>
                </div>
            )}

            {/* Role legend */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-4">Role permissions</p>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                        <tr className="border-b border-slate-100">
                            <th className="text-left text-slate-400 font-medium pb-2 pr-4">Permission</th>
                            {Object.keys(ROLES).map((role) => (
                                <th key={role} className="text-center pb-2 px-2">
                    <span className={`px-2 py-0.5 rounded-lg font-medium ${ROLE_COLORS[role]}`}>
                      {ROLES[role as keyof typeof ROLES].label}
                    </span>
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                        {PERMISSIONS.map(({ key, label }) => (
                            <tr key={key}>
                                <td className="py-2 pr-4 text-slate-600">{label}</td>
                                {Object.keys(ROLES).map((role) => (
                                    <td key={role} className="py-2 px-2 text-center">
                                        {ROLE_DEFAULTS[role as keyof typeof ROLE_DEFAULTS][key as keyof typeof ROLE_DEFAULTS.owner]
                                            ? <span className="text-green-600">✓</span>
                                            : <span className="text-slate-200">—</span>}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Members list */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-slate-400" /></div>
            ) : members.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
                    <p className="text-4xl mb-4">👥</p>
                    <p className="text-slate-900 font-medium mb-1">No team members yet</p>
                    <p className="text-slate-400 text-sm mb-6">Invite team members to collaborate on your farm</p>
                    <button onClick={() => setShowInvite(true)}
                            className="inline-flex items-center gap-2 h-10 px-5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors">
                        <Plus size={16} /> Invite member
                    </button>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="flex flex-col divide-y divide-slate-100">
                        {members.map((member) => (
                            <div key={member.id} className="flex items-center gap-4 px-6 py-4">
                                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-700 flex-shrink-0">
                                    {member.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) ?? "??"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900">{member.name}</p>
                                    <p className="text-xs text-slate-400">{member.email}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={member.role}
                                        onChange={(e) => handleUpdateMember(member.id, { role: e.target.value })}
                                        className={`h-7 px-2 text-xs rounded-lg border-0 outline-none font-medium ${ROLE_COLORS[member.role]}`}
                                    >
                                        {Object.entries(ROLES).map(([key, { label }]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                    <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${STATUS_COLORS[member.status]}`}>
                    {member.status}
                  </span>
                                    <button onClick={() => openEdit(member)}
                                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors" title="Edit permissions">
                                        <Pencil size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(member.id)} disabled={deletingId === member.id}
                                            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors">
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
                    <div className="flex-1 bg-black/20" onClick={() => setShowInvite(false)} />
                    <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-xl flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h2 className="text-base font-medium text-slate-900">Invite team member</h2>
                            <button onClick={() => setShowInvite(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleInvite} className="flex-1 p-6 flex flex-col gap-5">
                            <div>
                                <label className="text-sm text-slate-500 mb-1.5 block">Email address</label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="colleague@farm.com"
                                    required
                                    className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400"
                                />
                                <p className="text-xs text-slate-400 mt-1">The person must already have a Farmio account.</p>
                            </div>

                            <div>
                                <label className="text-sm text-slate-500 mb-1.5 block">Role</label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value)}
                                    className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400"
                                >
                                    {Object.entries(ROLES).filter(([k]) => k !== "owner").map(([key, { label }]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4">
                                <p className="text-xs font-medium text-slate-600 mb-3">
                                    {ROLES[inviteRole as keyof typeof ROLES]?.label} permissions
                                </p>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {PERMISSIONS.map(({ key, label }) => {
                                        const allowed = ROLE_DEFAULTS[inviteRole as keyof typeof ROLE_DEFAULTS]?.[key as keyof typeof ROLE_DEFAULTS.owner];
                                        return (
                                            <div key={key} className="flex items-center gap-1.5">
                                                <div className={`w-3 h-3 rounded-sm ${allowed ? "bg-green-500" : "bg-slate-200"}`} />
                                                <span className={`text-xs ${allowed ? "text-slate-700" : "text-slate-400"}`}>{label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

                            <div className="flex gap-3 mt-auto pt-4">
                                <button type="button" onClick={() => setShowInvite(false)}
                                        className="flex-1 h-12 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                        className="flex-1 h-12 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                    {saving ? <><Loader2 size={15} className="animate-spin" /> Inviting...</> : "Send invite"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit permissions */}
            {editingMember && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/20" onClick={() => setEditingMember(null)} />
                    <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-xl flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div>
                                <h2 className="text-base font-medium text-slate-900">Edit permissions</h2>
                                <p className="text-xs text-slate-400 mt-0.5">{editingMember.name}</p>
                            </div>
                            <button onClick={() => setEditingMember(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={18} /></button>
                        </div>
                        <div className="flex-1 p-6 flex flex-col gap-5">
                            <div>
                                <label className="text-sm text-slate-500 mb-1.5 block">Role</label>
                                <select
                                    value={editingMember.role}
                                    onChange={(e) => {
                                        const newRole = e.target.value as keyof typeof ROLE_DEFAULTS;
                                        setEditingMember({ ...editingMember, role: newRole });
                                        setCustomPerms(getDefaultPermissions(newRole));
                                    }}
                                    className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400"
                                >
                                    {Object.entries(ROLES).filter(([k]) => k !== "owner").map(([key, { label }]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm text-slate-500">Custom permissions</label>
                                    <button
                                        onClick={() => setShowCustomPerms(!showCustomPerms)}
                                        className="text-xs text-slate-600 font-medium hover:underline"
                                    >
                                        {showCustomPerms ? "Use role defaults" : "Customise"}
                                    </button>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {PERMISSIONS.map(({ key, label }) => (
                                        <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                            <span className="text-sm text-slate-700">{label}</span>
                                            <button
                                                onClick={() => {
                                                    if (!showCustomPerms) setShowCustomPerms(true);
                                                    setCustomPerms((p) => ({ ...p, [key]: !p[key] }));
                                                }}
                                                className={`w-10 h-5 rounded-full transition-colors relative ${customPerms[key] ? "bg-slate-900" : "bg-slate-200"}`}
                                            >
                                                <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${customPerms[key] ? "translate-x-5" : "translate-x-0.5"}`} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 mt-auto pt-4">
                                <button onClick={() => setEditingMember(null)}
                                        className="flex-1 h-12 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        await handleUpdateMember(editingMember.id, {
                                            role: editingMember.role,
                                            permissions: customPerms,
                                        });
                                        setEditingMember(null);
                                    }}
                                    className="flex-1 h-12 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                                >
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
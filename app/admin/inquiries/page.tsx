"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail, Calendar, Check } from "lucide-react";

function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const CONTACT_STATUS_COLORS: Record<string, string> = {
    new:      "bg-blue-900/30 text-blue-400",
    read:     "bg-slate-800 text-slate-400",
    replied:  "bg-green-900/30 text-green-400",
    archived: "bg-slate-900 text-slate-500",
};

const BOOKING_STATUS_COLORS: Record<string, string> = {
    pending:   "bg-amber-900/30 text-amber-400",
    confirmed: "bg-blue-900/30 text-blue-400",
    completed: "bg-green-900/30 text-green-400",
    cancelled: "bg-red-900/30 text-red-400",
};

export default function AdminInquiriesPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"contacts" | "bookings">("contacts");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [editNotes, setEditNotes] = useState<Record<string, string>>({});
    const [editBookedFor, setEditBookedFor] = useState<Record<string, string>>({});

    const load = () => {
        setLoading(true);
        fetch("/api/admin/inquiries")
            .then((r) => r.json())
            .then((d) => { setData(d); setLoading(false); });
    };

    useEffect(() => { load(); }, []);

    const update = async (id: string, type: string, updates: any) => {
        await fetch(`/api/admin/inquiries/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, ...updates }),
        });
        load();
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[#3d8c47]" /></div>;

    const newContacts = data?.contacts.filter((c: any) => c.status === "new").length ?? 0;
    const pendingBookings = data?.bookings.filter((b: any) => b.status === "pending").length ?? 0;

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-medium text-white">Inquiries</h1>
                <p className="text-[#4a7a50] text-sm mt-1">Contact form submissions and demo booking requests</p>
            </div>

            <div className="flex gap-3 mb-6">
                <button onClick={() => setTab("contacts")}
                        className={`flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium transition-colors ${
                            tab === "contacts" ? "bg-[#1a3d1f] text-white" : "bg-[#1a2d1c] border border-[#2d5c35] text-[#4a7a50] hover:text-white"
                        }`}>
                    <Mail size={14} /> Contact forms
                    {newContacts > 0 && <span className="w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">{newContacts}</span>}
                </button>
                <button onClick={() => setTab("bookings")}
                        className={`flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium transition-colors ${
                            tab === "bookings" ? "bg-[#1a3d1f] text-white" : "bg-[#1a2d1c] border border-[#2d5c35] text-[#4a7a50] hover:text-white"
                        }`}>
                    <Calendar size={14} /> Demo bookings
                    {pendingBookings > 0 && <span className="w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">{pendingBookings}</span>}
                </button>
            </div>

            {tab === "contacts" && (
                <div className="flex flex-col gap-4">
                    {data.contacts.length === 0 ? (
                        <div className="bg-[#1a2d1c] border border-[#2d5c35] rounded-2xl p-16 text-center">
                            <p className="text-[#4a7a50] text-sm">No contact submissions yet</p>
                        </div>
                    ) : data.contacts.map((c: any) => (
                        <div key={c.id} className="bg-[#1a2d1c] border border-[#2d5c35] rounded-2xl overflow-hidden">
                            <div
                                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[#1a3d1f]/20 transition-colors"
                                onClick={() => {
                                    setExpandedId(expandedId === c.id ? null : c.id);
                                    if (c.status === "new") update(c.id, "contact", { status: "read" });
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-[#1a3d1f] flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
                                        {c.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{c.name}</p>
                                        <p className="text-xs text-[#4a7a50]">{c.email} &middot; {formatDate(c.createdAt)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={c.status}
                                        onChange={(e) => { e.stopPropagation(); update(c.id, "contact", { status: e.target.value }); }}
                                        onClick={(e) => e.stopPropagation()}
                                        className={`h-6 px-2 text-xs rounded-lg border-0 outline-none ${CONTACT_STATUS_COLORS[c.status]}`}
                                    >
                                        {["new", "read", "replied", "archived"].map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            {expandedId === c.id && (
                                <div className="px-5 pb-5 border-t border-[#2d5c35] pt-4">
                                    <p className="text-sm text-[#7dd68a] leading-relaxed mb-4 whitespace-pre-wrap">{c.message}</p>
                                    <div>
                                        <label className="text-xs text-[#4a7a50] mb-1.5 block">Internal notes</label>
                                        <div className="flex gap-2">
                      <textarea
                          defaultValue={c.notes ?? ""}
                          onChange={(e) => setEditNotes((prev) => ({ ...prev, [c.id]: e.target.value }))}
                          rows={2}
                          placeholder="Add notes about this inquiry..."
                          className="flex-1 px-3 py-2 text-xs bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white resize-none"
                      />
                                            <button
                                                onClick={() => update(c.id, "contact", { notes: editNotes[c.id] ?? c.notes, status: "replied" })}
                                                className="h-9 px-3 bg-[#1a3d1f] text-white text-xs rounded-xl hover:bg-[#2d5c35] transition-colors flex items-center gap-1.5 self-start"
                                            >
                                                <Check size={12} /> Save & mark replied
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {tab === "bookings" && (
                <div className="flex flex-col gap-4">
                    {data.bookings.length === 0 ? (
                        <div className="bg-[#1a2d1c] border border-[#2d5c35] rounded-2xl p-16 text-center">
                            <p className="text-[#4a7a50] text-sm">No demo bookings yet</p>
                        </div>
                    ) : data.bookings.map((b: any) => (
                        <div key={b.id} className="bg-[#1a2d1c] border border-[#2d5c35] rounded-2xl overflow-hidden">
                            <div
                                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[#1a3d1f]/20 transition-colors"
                                onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-[#2d5c35] flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
                                        {b.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{b.name}</p>
                                        <p className="text-xs text-[#4a7a50]">{b.email} &middot; {b.farm} &middot; {formatDate(b.createdAt)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {b.bookedFor && (
                                        <span className="text-xs text-[#7dd68a]">
                      {new Date(b.bookedFor).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                                    )}
                                    <select
                                        value={b.status}
                                        onChange={(e) => { e.stopPropagation(); update(b.id, "booking", { status: e.target.value }); }}
                                        onClick={(e) => e.stopPropagation()}
                                        className={`h-6 px-2 text-xs rounded-lg border-0 outline-none ${BOOKING_STATUS_COLORS[b.status]}`}
                                    >
                                        {["pending", "confirmed", "completed", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            {expandedId === b.id && (
                                <div className="px-5 pb-5 border-t border-[#2d5c35] pt-4">
                                    {b.message && <p className="text-sm text-[#7dd68a] leading-relaxed mb-4">{b.message}</p>}
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="text-xs text-[#4a7a50] mb-1.5 block">Schedule demo for</label>
                                            <input
                                                type="datetime-local"
                                                defaultValue={b.bookedFor ? new Date(b.bookedFor).toISOString().slice(0, 16) : ""}
                                                onChange={(e) => setEditBookedFor((prev) => ({ ...prev, [b.id]: e.target.value }))}
                                                className="w-full h-10 px-3 text-xs bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-[#4a7a50] mb-1.5 block">Internal notes</label>
                                            <input
                                                defaultValue={b.notes ?? ""}
                                                onChange={(e) => setEditNotes((prev) => ({ ...prev, [b.id]: e.target.value }))}
                                                placeholder="Notes..."
                                                className="w-full h-10 px-3 text-xs bg-[#111d13] border border-[#2d5c35] rounded-xl outline-none focus:border-[#3d8c47] text-white placeholder-[#2d5c35]"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => update(b.id, "booking", {
                                            notes: editNotes[b.id] ?? b.notes,
                                            bookedFor: editBookedFor[b.id] ?? b.bookedFor,
                                            status: "confirmed",
                                        })}
                                        className="h-8 px-4 bg-[#1a3d1f] text-white text-xs rounded-xl hover:bg-[#2d5c35] transition-colors flex items-center gap-1.5"
                                    >
                                        <Check size={12} /> Save & confirm booking
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, Loader2, AlertTriangle, CheckCircle, Info, Package } from "lucide-react";
import Link from "next/link";

const TYPE_CONFIG: Record<string, { icon: any; bg: string; border: string; iconColor: string; dotColor: string }> = {
    harvest_due: { icon: CheckCircle, bg: "#F0FDF4", border: "#BBF7D0", iconColor: "#16A34A", dotColor: "#22C55E" },
    crop_activity_due: { icon: AlertTriangle, bg: "#EFF6FF", border: "#BFDBFE", iconColor: "#2563EB", dotColor: "#3B82F6" },
    no_activity: { icon: AlertTriangle, bg: "#F0F9FF", border: "#BAE6FD", iconColor: "#0284C7", dotColor: "#06B6D4" },
    low_inventory: { icon: Package, bg: "#EFF6FF", border: "#BFDBFE", iconColor: "#2563EB", dotColor: "#3B82F6" },
    price_alert: { icon: Info, bg: "#FAF5FF", border: "#E9D5FF", iconColor: "#9333EA", dotColor: "#A855F7" },
};

function timeAgo(d: string) {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [markingAll, setMarkingAll] = useState(false);
    const [openId, setOpenId] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        fetch("/api/notifications")
            .then((r) => r.json())
            .then((d) => { setData(d); setLoading(false); })
            .catch(() => { setData({ notifications: [], count: 0 }); setLoading(false); });
    };

    useEffect(() => { load(); }, []);

    const markRead = async (id: string) => {
        await fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
        setData((current: any) => ({
            ...current,
            count: Math.max((current?.count ?? 1) - 1, 0),
            notifications: (current?.notifications ?? []).map((notification: any) =>
                notification.id === id ? { ...notification, isRead: true } : notification,
            ),
        }));
    };

    const markAllRead = async () => {
        setMarkingAll(true);
        await fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ markAllRead: true }),
        });
        setMarkingAll(false);
        load();
    };

    const notifications = data?.notifications ?? [];
    const unreadCount = data?.count ?? 0;

    return (
        <div className="p-8 max-w-3xl mx-auto animate-fade-in">
            <div className="page-header flex items-start justify-between">
                <div>
                    <h1 className="page-title">Notifications</h1>
                    <p className="page-subtitle">
                        {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"} - {notifications.length} total
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button onClick={markAllRead} disabled={markingAll}
                            className="btn-secondary text-xs disabled:opacity-50">
                        <CheckCheck size={13} />
                        {markingAll ? "Marking..." : "Mark all read"}
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={24} className="animate-spin" style={{ color: "var(--farm-green)" }} />
                </div>
            ) : notifications.length === 0 ? (
                <div className="rounded-3xl p-16 text-center"
                     style={{ background: "var(--bg-card)", border: "1.5px dashed var(--border)" }}>
                    <div className="empty-state">
                        <div className="empty-icon">
                            <Bell size={28} style={{ color: "var(--text-muted)" }} />
                        </div>
                        <p className="section-title mb-2">No notifications yet</p>
                        <p className="section-subtitle">
                            You&apos;ll be notified about upcoming harvests, missing activities and inventory levels.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {notifications.map((notif: any) => {
                        const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.price_alert;
                        const Icon = cfg.icon;
                        const open = openId === notif.id;
                        const isRecommendation = ["crop_activity_due", "no_activity", "harvest_due"].includes(notif.type);
                        const recordHref = notif.type === "crop_activity_due" || notif.type === "no_activity" ? notif.link : null;

                        return (
                            <div
                                key={notif.id}
                                className="rounded-2xl p-4 transition-all animate-slide-up"
                                style={{
                                    background: notif.isRead ? "var(--bg-card)" : cfg.bg,
                                    border: `1.5px solid ${notif.isRead ? "var(--border)" : cfg.border}`,
                                    boxShadow: notif.isRead ? "none" : "0 2px 8px rgba(28,25,23,0.06)",
                                }}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                         style={{ background: notif.isRead ? "var(--bg-subtle)" : cfg.iconColor + "20" }}>
                                        <Icon size={16} style={{ color: notif.isRead ? "var(--text-muted)" : cfg.iconColor }} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                                                {notif.title}
                                                {!notif.isRead && (
                                                    <span className="inline-block w-2 h-2 rounded-full ml-2 mb-0.5 align-middle"
                                                          style={{ background: cfg.dotColor }} />
                                                )}
                                            </p>
                                            <p className="text-[10px] font-semibold flex-shrink-0"
                                               style={{ color: "var(--text-hint)" }}>
                                                {timeAgo(notif.createdAt)}
                                            </p>
                                        </div>
                                        <p className="text-sm mt-0.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                                            {notif.message}
                                        </p>

                                        <div className="flex items-center gap-3 mt-2">
                                            {isRecommendation ? (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setOpenId(open ? null : notif.id);
                                                        if (!notif.isRead) markRead(notif.id);
                                                    }}
                                                    className="text-xs font-bold"
                                                    style={{ color: "var(--farm-green)" }}
                                                >
                                                    {open ? "Hide details" : "View details"}
                                                </button>
                                            ) : notif.link ? (
                                                <Link href={notif.link} onClick={() => markRead(notif.id)}
                                                      className="text-xs font-bold"
                                                      style={{ color: "var(--farm-green)" }}>
                                                    View
                                                </Link>
                                            ) : null}
                                            {!notif.isRead && (
                                                <button onClick={() => markRead(notif.id)}
                                                        className="text-xs font-semibold"
                                                        style={{ color: "var(--text-muted)" }}>
                                                    Mark read
                                                </button>
                                            )}
                                        </div>

                                        {open && isRecommendation && (
                                            <div className="mt-3 rounded-xl p-3" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                                                <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
                                                    Alert details
                                                </p>
                                                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                                                    {notif.title}
                                                </p>
                                                <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                                                    {notif.message}
                                                </p>
                                                {notif.type === "crop_activity_due" && (
                                                    <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                                                        This is a general crop-timeline recommendation. Confirm field conditions before recording the activity.
                                                    </p>
                                                )}
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {recordHref && (
                                                        <Link href={recordHref} className="btn-secondary min-h-10 text-xs">
                                                            Record activity
                                                        </Link>
                                                    )}
                                                    {notif.type === "harvest_due" && (
                                                        <Link href="/dashboard/yields" className="btn-secondary min-h-10 text-xs">
                                                            Record yield
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

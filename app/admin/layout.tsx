"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard, Users, CreditCard, Layers,
    LogOut, ChevronLeft, ChevronRight, Receipt,
    MessageSquare, FileText, BarChart2, ChevronRight as Breadcrumb,
} from "lucide-react";

const NAV_GROUPS = [
    {
        label: "Management",
        items: [
            { label: "Overview",      href: "/admin",               icon: LayoutDashboard },
            { label: "Users",         href: "/admin/users",         icon: Users },
            { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
            { label: "Payments",      href: "/admin/payments",      icon: Receipt },
        ],
    },
    {
        label: "Configuration",
        items: [
            { label: "Tiers",         href: "/admin/tiers",   icon: Layers },
            { label: "Market prices", href: "/admin/market",  icon: BarChart2 },
        ],
    },
    {
        label: "Content",
        items: [
            { label: "Inquiries",    href: "/admin/inquiries", icon: MessageSquare },
            { label: "Site content", href: "/admin/cms",       icon: FileText },
        ],
    },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const router   = useRouter();

    useEffect(() => {
        if (pathname === "/admin/login") return;
        fetch("/api/admin/overview")
            .then((r) => { if (r.status === 401) router.push("/admin/login"); })
            .catch(() => router.push("/admin/login"));
    }, [pathname]);

    if (pathname === "/admin/login") return <>{children}</>;

    const handleLogout = async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.push("/admin/login");
    };

    const currentPage = NAV_GROUPS.flatMap((g) => g.items).find(
        (item) => item.href === pathname || (item.href !== "/admin" && pathname.startsWith(item.href))
    );

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: "#F1F5F9" }}>

            {/* ── Sidebar ─────────────────────────────────────────────────────── */}
            <aside className={`
        flex-shrink-0 flex flex-col h-screen sticky top-0
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-[4.5rem]" : "w-60"}
      `}
                   style={{ background: "#1E293B", boxShadow: "4px 0 20px rgba(0,0,0,0.15)" }}>

                {/* Logo */}
                <div className={`flex items-center h-16 flex-shrink-0 ${collapsed ? "justify-center px-0" : "px-5 gap-3"}`}
                     style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                         style={{ background: "rgba(255,255,255,0.1)" }}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <polygon points="9,2 16,14 2,14" fill="#475569"/>
                            <polygon points="9,5 14,14 4,14" fill="#64748B"/>
                            <polygon points="9,8 12,14 6,14" fill="#94A3B8"/>
                            <rect x="7.5" y="11" width="3" height="5" rx="1" fill="#334155"/>
                        </svg>
                    </div>
                    {!collapsed && (
                        <div>
                            <p className="text-white font-extrabold text-base leading-none tracking-tight">Farmio</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5"
                               style={{ color: "rgba(148,163,184,0.7)" }}>
                                Admin Portal
                            </p>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-3 min-h-0" style={{ scrollbarWidth: "none" }}>
                    {NAV_GROUPS.map((group) => (
                        <div key={group.label} className="mb-1">
                            {!collapsed && (
                                <p className="px-4 pt-3 pb-1.5 text-[9px] font-black uppercase tracking-[0.15em]"
                                   style={{ color: "rgba(148,163,184,0.5)" }}>
                                    {group.label}
                                </p>
                            )}
                            {collapsed && <div className="h-3" />}
                            <div className="px-2">
                                {group.items.map(({ label, href, icon: Icon }) => {
                                    const active = pathname === href ||
                                        (href !== "/admin" && pathname.startsWith(href));
                                    return (
                                        <Link key={href} href={href} title={collapsed ? label : undefined}
                                              className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5
                        text-[13px] font-semibold transition-all duration-150
                        ${collapsed ? "justify-center" : ""}
                      `}
                                              style={{
                                                  background: active ? "rgba(255,255,255,0.12)" : "transparent",
                                                  color:      active ? "white" : "rgba(148,163,184,0.8)",
                                              }}
                                              onMouseOver={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.9)"; } }}
                                              onMouseOut={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(148,163,184,0.8)"; } }}>
                                            <Icon size={16} className="flex-shrink-0" />
                                            {!collapsed && <span className="truncate">{label}</span>}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Bottom */}
                <div className="flex-shrink-0 p-3"
                     style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <button onClick={handleLogout}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold w-full transition-all ${collapsed ? "justify-center" : ""}`}
                            style={{ color: "rgba(148,163,184,0.7)" }}
                            onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)"; (e.currentTarget as HTMLElement).style.color = "#FCA5A5"; }}
                            onMouseOut={(e)  => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(148,163,184,0.7)"; }}>
                        <LogOut size={15} className="flex-shrink-0" />
                        {!collapsed && "Sign out"}
                    </button>
                </div>

                {/* Collapse toggle */}
                <button onClick={() => setCollapsed(!collapsed)}
                        className="absolute -right-3 top-[4.5rem] w-6 h-6 rounded-full flex items-center justify-center z-10"
                        style={{
                            background:  "#1E293B",
                            border:      "2px solid #334155",
                            boxShadow:   "0 2px 8px rgba(0,0,0,0.3)",
                        }}>
                    {collapsed
                        ? <ChevronRight size={11} className="text-white" />
                        : <ChevronLeft  size={11} className="text-white" />}
                </button>
            </aside>

            {/* ── Main content ─────────────────────────────────────────────────── */}
            <main className="flex-1 min-w-0 overflow-y-auto" style={{ background: "#F1F5F9" }}>

                {/* Top bar */}
                <div className="sticky top-0 z-30 h-16 flex items-center justify-between px-8"
                     style={{ background: "rgba(241,245,249,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E2E8F0" }}>

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: "#94A3B8" }}>Admin</span>
                        <Breadcrumb size={14} style={{ color: "#CBD5E1" }} />
                        <span className="text-sm font-extrabold" style={{ color: "#0F172A" }}>
              {currentPage?.label ?? "Overview"}
            </span>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white"
                             style={{ background: "#1E293B" }}>
                            A
                        </div>
                    </div>
                </div>

                {/* Page content */}
                <div className="min-h-[calc(100vh-4rem)]">
                    {children}
                </div>
            </main>
        </div>
    );
}
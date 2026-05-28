"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard, Users, CreditCard, Layers,
    LogOut, ChevronLeft, ChevronRight, Receipt,
    MessageSquare, FileText, BarChart2,
} from "lucide-react";
import DarkModeToggle from "@/components/DarkModeToggle";

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
            { label: "Tiers",         href: "/admin/tiers",         icon: Layers },
            { label: "Market prices", href: "/admin/market",        icon: BarChart2 },
        ],
    },
    {
        label: "Content",
        items: [
            { label: "Inquiries",     href: "/admin/inquiries",     icon: MessageSquare },
            { label: "Site content",  href: "/admin/cms",           icon: FileText },
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

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: "#0a1209" }}>

            {/* Sidebar */}
            <aside className={`
        flex-shrink-0 flex flex-col h-screen sticky top-0
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-[4.5rem]" : "w-60"}
      `}
                   style={{ background: "linear-gradient(180deg, #162518 0%, #0a1209 100%)", borderRight: "1px solid #2d5c35" }}>

                {/* Logo */}
                <div className={`flex items-center h-14 flex-shrink-0 ${collapsed ? "justify-center px-0" : "px-5 gap-3"}`}
                     style={{ borderBottom: "1px solid rgba(61,140,71,0.15)" }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                         style={{ background: "rgba(61,140,71,0.15)", border: "1px solid rgba(61,140,71,0.3)" }}>
                        <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                            <polygon points="9,2 16,14 2,14" fill="#2d6a35"/>
                            <polygon points="9,5 14,14 4,14" fill="#3d8c47"/>
                            <polygon points="9,8 12,14 6,14" fill="#52b85e"/>
                            <rect x="7.5" y="11" width="3" height="5" rx="1" fill="#1a3d1f"/>
                        </svg>
                    </div>
                    {!collapsed && (
                        <div>
                            <p className="text-white font-extrabold text-sm leading-none">Farmio</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#4a7a50" }}>Admin Panel</p>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-3 min-h-0" style={{ scrollbarWidth: "none" }}>
                    {NAV_GROUPS.map((group) => (
                        <div key={group.label} className="mb-1">
                            {!collapsed && (
                                <p className="px-4 pt-3 pb-1 text-[9px] font-black uppercase tracking-[0.12em]"
                                   style={{ color: "rgba(74,122,80,0.6)" }}>
                                    {group.label}
                                </p>
                            )}
                            {collapsed && <div className="h-2" />}
                            <div className="px-2">
                                {group.items.map(({ label, href, icon: Icon }) => {
                                    const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
                                    return (
                                        <Link key={href} href={href} title={collapsed ? label : undefined}
                                              className={`
                        flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-0.5
                        text-[13px] font-semibold transition-all duration-150
                        ${collapsed ? "justify-center" : ""}
                        ${active
                                                  ? "text-white"
                                                  : "hover:text-white"
                                              }
                      `}
                                              style={{
                                                  background: active ? "rgba(61,140,71,0.2)" : "transparent",
                                                  color:      active ? "white" : "rgba(74,122,80,0.8)",
                                                  border:     active ? "1px solid rgba(61,140,71,0.3)" : "1px solid transparent",
                                              }}>
                                            <Icon size={15} className="flex-shrink-0" />
                                            {!collapsed && <span className="truncate">{label}</span>}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Bottom */}
                <div className="flex-shrink-0 p-2" style={{ borderTop: "1px solid rgba(61,140,71,0.15)" }}>
                    <DarkModeToggle collapsed={collapsed} />
                    <button onClick={handleLogout}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold w-full mt-1 transition-all ${collapsed ? "justify-center" : ""}`}
                            style={{ color: "rgba(74,122,80,0.7)" }}
                            onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.color = "white"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
                            onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(74,122,80,0.7)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                        <LogOut size={15} className="flex-shrink-0" />
                        {!collapsed && <span>Sign out</span>}
                    </button>
                </div>

                {/* Collapse toggle */}
                <button onClick={() => setCollapsed(!collapsed)}
                        className="absolute -right-3 top-16 w-6 h-6 rounded-full flex items-center justify-center z-10"
                        style={{
                            background: "#1a3d1f",
                            border: "2px solid #2d5c35",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                        }}>
                    {collapsed
                        ? <ChevronRight size={11} className="text-white" />
                        : <ChevronLeft  size={11} className="text-white" />}
                </button>
            </aside>

            {/* Main */}
            <main className="flex-1 min-w-0 overflow-y-auto" style={{ background: "#0f1a10" }}>

                {/* Top bar */}
                <div className="sticky top-0 z-30 h-14 flex items-center justify-between px-8"
                     style={{ background: "rgba(10,18,9,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid #2d5c35" }}>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="font-bold" style={{ color: "#4a7a50" }}>Admin</span>
                        <ChevronRight size={14} style={{ color: "#2d5c35" }} />
                        <span className="font-bold capitalize text-white">
              {pathname.split("/").pop()?.replace(/-/g, " ") || "Overview"}
            </span>
                    </div>
                    <p className="text-xs" style={{ color: "#4a7a50" }}>
                        {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                    </p>
                </div>

                <div className="min-h-[calc(100vh-3.5rem)]">
                    {children}
                </div>
            </main>
        </div>
    );
}
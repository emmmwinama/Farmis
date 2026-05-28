"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
    LayoutDashboard, Map, Sprout, ClipboardList, Users,
    Wallet, Settings, LogOut, ChevronLeft, ChevronRight,
    CalendarDays, Wheat, FileBarChart, Users2, Package,
    BarChart2, Award, Leaf, Bell, CalendarRange,
    CloudSun, ChevronDown,
} from "lucide-react";
import FarmSwitcher from "@/components/FarmSwitcher";
import DarkModeToggle from "@/components/DarkModeToggle";
import AIAssistant from "@/components/AIAssistant";

const NAV_GROUPS = [
    {
        label: "Farm operations",
        items: [
            { label: "Dashboard",     href: "/dashboard",              icon: LayoutDashboard },
            { label: "Fields",        href: "/dashboard/fields",       icon: Map },
            { label: "Crops",         href: "/dashboard/crops",        icon: Sprout },
            { label: "Activities",    href: "/dashboard/activities",   icon: ClipboardList },
            { label: "Calendar",      href: "/dashboard/calendar",     icon: CalendarRange },
            { label: "Yields",        href: "/dashboard/yields",       icon: Wheat },
            { label: "Inventory",     href: "/dashboard/inventory",    icon: Package },
        ],
    },
    {
        label: "Business",
        items: [
            { label: "Finance",       href: "/dashboard/finance",      icon: Wallet },
            { label: "Employees",     href: "/dashboard/employees",    icon: Users },
            { label: "Market prices", href: "/dashboard/market",       icon: BarChart2 },
            { label: "Seasons",       href: "/dashboard/seasons",      icon: CalendarDays },
        ],
    },
    {
        label: "Insights",
        items: [
            { label: "Reports",       href: "/dashboard/reports",      icon: FileBarChart },
            { label: "Credit score",  href: "/dashboard/credit-score", icon: Award },
            { label: "Farm impact",   href: "/dashboard/impact",       icon: Leaf },
            { label: "Weather",       href: "/dashboard/weather",      icon: CloudSun },
        ],
    },
    {
        label: "Account",
        items: [
            { label: "Team",          href: "/dashboard/team",         icon: Users2 },
            { label: "Settings",      href: "/dashboard/settings",     icon: Settings },
        ],
    },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const [notifCount, setNotifCount] = useState(0);
    const pathname = usePathname();
    const { data: session } = useSession();

    const initials = session?.user?.name
        ?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "FM";

    useEffect(() => {
        fetch("/api/notifications?unread=true")
            .then((r) => r.json())
            .then((d) => setNotifCount(d.count ?? 0))
            .catch(() => {});
    }, [pathname]);

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-page)" }}>

            {/* ── Sidebar ─────────────────────────────────────────────────────── */}
            <aside className={`
        flex-shrink-0 flex flex-col h-screen sticky top-0
        bg-green-gradient transition-all duration-300 ease-in-out
        ${collapsed ? "w-[4.5rem]" : "w-60"}
      `}
                   style={{ background: "linear-gradient(180deg, #1a3d1f 0%, #0f2411 100%)" }}
            >
                {/* Logo */}
                <div className={`flex items-center h-14 flex-shrink-0 border-b ${collapsed ? "justify-center px-0" : "px-5 gap-3"}`}
                     style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 ring-1 ring-white/20">
                        <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                            <polygon points="9,2 16,14 2,14" fill="#2d6a35"/>
                            <polygon points="9,5 14,14 4,14" fill="#3d8c47"/>
                            <polygon points="9,8 12,14 6,14" fill="#52b85e"/>
                            <rect x="7.5" y="11" width="3" height="5" rx="1" fill="#1a3d1f"/>
                        </svg>
                    </div>
                    {!collapsed && (
                        <div>
                            <p className="text-white font-extrabold text-base leading-none tracking-tight">Farmio</p>
                            <p className="text-white/40 text-[10px] font-semibold tracking-widest uppercase">Farm OS</p>
                        </div>
                    )}
                </div>

                {/* Farm switcher */}
                <div className={`flex-shrink-0 py-2 ${collapsed ? "px-2" : "px-3"}`}
                     style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <FarmSwitcher collapsed={collapsed} userId={session?.user?.id ?? ""} />
                </div>

                {/* Nav groups — scrollable */}
                <nav className="flex-1 overflow-y-auto py-2 min-h-0"
                     style={{ scrollbarWidth: "none" }}>
                    {NAV_GROUPS.map((group) => (
                        <div key={group.label} className="mb-1">
                            {!collapsed && (
                                <p className="px-4 pt-3 pb-1 text-[9px] font-black uppercase tracking-[0.12em]"
                                   style={{ color: "rgba(255,255,255,0.25)" }}>
                                    {group.label}
                                </p>
                            )}
                            {collapsed && <div className="h-2" />}
                            <div className={collapsed ? "px-2" : "px-2"}>
                                {group.items.map(({ label, href, icon: Icon }) => {
                                    const active = pathname === href;
                                    return (
                                        <Link
                                            key={href}
                                            href={href}
                                            title={collapsed ? label : undefined}
                                            className={`
                        flex items-center gap-2.5 px-3 py-2 rounded-xl mb-0.5
                        text-[13px] font-semibold transition-all duration-150
                        ${collapsed ? "justify-center" : ""}
                        ${active
                                                ? "bg-white/15 text-white shadow-sm ring-1 ring-white/10"
                                                : "text-white/55 hover:bg-white/08 hover:text-white/90"
                                            }
                      `}
                                            style={active ? { textShadow: "0 1px 2px rgba(0,0,0,0.2)" } : {}}
                                        >
                                            <Icon size={15} className="flex-shrink-0" />
                                            {!collapsed && <span className="truncate">{label}</span>}
                                            {!collapsed && label === "Notifications" && notifCount > 0 && (
                                                <span className="ml-auto bg-amber-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0">
                          {notifCount > 9 ? "9+" : notifCount}
                        </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Bottom */}
                <div className="flex-shrink-0 p-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <DarkModeToggle collapsed={collapsed} />

                    <div className={`flex items-center gap-2.5 px-3 py-2.5 mt-1 rounded-xl ${collapsed ? "justify-center" : ""}`}>
                        <div className="w-8 h-8 rounded-xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center text-xs font-extrabold text-white flex-shrink-0">
                            {initials}
                        </div>
                        {!collapsed && (
                            <>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-xs font-bold truncate leading-none">{session?.user?.name}</p>
                                    <p className="text-white/40 text-[10px] font-medium mt-0.5 truncate">{session?.user?.email}</p>
                                </div>
                                <button
                                    onClick={() => signOut({ callbackUrl: "/login" })}
                                    className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/08 transition-colors flex-shrink-0"
                                    title="Sign out"
                                >
                                    <LogOut size={13} />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-16 w-6 h-6 rounded-full flex items-center justify-center transition-all z-10"
                    style={{
                        background: "linear-gradient(135deg, #2d6a35, #1a3d1f)",
                        border: "2px solid rgba(255,255,255,0.15)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                    }}
                >
                    {collapsed
                        ? <ChevronRight size={11} className="text-white" />
                        : <ChevronLeft  size={11} className="text-white" />}
                </button>
            </aside>

            {/* ── Main content ─────────────────────────────────────────────────── */}
            <main className="flex-1 min-w-0 overflow-y-auto" style={{ background: "var(--bg-page)" }}>

                {/* Top bar */}
                <div className="sticky top-0 z-30 h-14 flex items-center justify-between px-8"
                     style={{
                         background: "rgba(247,246,242,0.85)",
                         backdropFilter: "blur(12px)",
                         borderBottom: "1px solid var(--border)",
                     }}>

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm">
                        <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Farmio</span>
                        <ChevronRight size={14} style={{ color: "var(--text-hint)" }} />
                        <span style={{ color: "var(--text-primary)", fontWeight: 700 }} className="capitalize">
              {pathname.split("/").pop()?.replace(/-/g, " ") || "Dashboard"}
            </span>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard/weather"
                              className="h-9 w-9 rounded-xl flex items-center justify-center transition-all"
                              style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                            <CloudSun size={16} />
                        </Link>
                        <Link href="/dashboard/notifications"
                              className="relative h-9 w-9 rounded-xl flex items-center justify-center transition-all"
                              style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                            <Bell size={16} />
                            {notifCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full text-white text-[9px] font-black flex items-center justify-center">
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
                            )}
                        </Link>
                    </div>
                </div>

                {/* Page content */}
                <div className="min-h-[calc(100vh-3.5rem)]">
                    {children}
                </div>
            </main>

            <AIAssistant />
        </div>
    );
}
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
    LayoutDashboard, Map, ClipboardCheck, BriefcaseBusiness,
    Settings, LogOut, ChevronLeft, ChevronRight,
    FileBarChart, Users2, Bell, CloudSun, Beef,
} from "lucide-react";
import FarmSwitcher from "@/components/FarmSwitcher";
import DarkModeToggle from "@/components/DarkModeToggle";
import AIAssistant from "@/components/AIAssistant";
import AgriVaultLogo from "@/components/AgriVaultLogo";

type SubscriptionAccess = {
    active: boolean;
    tier: {
        name: string;
        limits: Record<string, number>;
        features: Record<string, boolean>;
    } | null;
};

type NavItem = {
    label: string;
    href: string;
    icon: any;
    exact?: boolean;
    matches?: string[];
    access?: (access: SubscriptionAccess | null) => boolean;
};

const limitAllows = (limits: Record<string, number> | undefined, key: string) => {
    const value = limits?.[key];
    return value === undefined || value === -1 || value > 0;
};

const hasFeature = (features: Record<string, boolean> | undefined, key: string) => Boolean(features?.[key]);

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
    {
        label: "Command center",
        items: [
            { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
            {
                label: "Capture",
                href: "/dashboard/field-capture",
                icon: ClipboardCheck,
                access: (access) => !access || (access.active && limitAllows(access.tier?.limits, "maxActivities")),
            },
            {
                label: "Farm",
                href: "/dashboard/farm",
                icon: Map,
                matches: ["/dashboard/fields", "/dashboard/crops", "/dashboard/activities", "/dashboard/calendar", "/dashboard/yields", "/dashboard/map"],
                access: (access) => !access || (access.active && (
                    limitAllows(access.tier?.limits, "maxFields") ||
                    limitAllows(access.tier?.limits, "maxCrops") ||
                    limitAllows(access.tier?.limits, "maxActivities")
                )),
            },
            {
                label: "Business",
                href: "/dashboard/business",
                icon: BriefcaseBusiness,
                matches: ["/dashboard/finance", "/dashboard/inventory", "/dashboard/employees", "/dashboard/seasons", "/dashboard/market"],
                access: (access) => !access || (access.active && (
                    limitAllows(access.tier?.limits, "maxTransactions") ||
                    limitAllows(access.tier?.limits, "maxEmployees") ||
                    hasFeature(access.tier?.features, "payrollTracking")
                )),
            },
            { label: "Livestock", href: "/dashboard/livestock", icon: Beef, access: (access) => !access || access.active },
            {
                label: "Insights",
                href: "/dashboard/insights",
                icon: FileBarChart,
                matches: ["/dashboard/reports", "/dashboard/weather", "/dashboard/records", "/dashboard/credit-score"],
                access: (access) => !access || (access.active && (
                    hasFeature(access.tier?.features, "seasonAnalytics") ||
                    hasFeature(access.tier?.features, "yieldSuggestions") ||
                    hasFeature(access.tier?.features, "costPerHectare") ||
                    hasFeature(access.tier?.features, "customReports")
                )),
            },
        ],
    },
    {
        label: "Account",
        items: [
            {
                label: "Team",
                href: "/dashboard/team",
                icon: Users2,
                access: (access) => !access || (access.active && (
                    hasFeature(access.tier?.features, "teamAccounts") ||
                    limitAllows(access.tier?.limits, "maxTeamMembers")
                )),
            },
            { label: "Settings",      href: "/dashboard/settings",     icon: Settings },
        ],
    },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const [notifCount, setNotifCount] = useState(0);
    const [access, setAccess] = useState<SubscriptionAccess | null>(null);
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

    useEffect(() => {
        fetch("/api/subscription/me")
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => setAccess(d))
            .catch(() => setAccess(null));
    }, []);

    const visibleGroups = NAV_GROUPS
        .map((group) => ({ ...group, items: group.items.filter((item) => !item.access || item.access(access)) }))
        .filter((group) => group.items.length > 0);

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-page)" }}>

            {/* ── Sidebar ─────────────────────────────────────────────────────── */}
            <aside className={`
        flex-shrink-0 flex flex-col h-screen sticky top-0
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-20" : "w-64"}
      `}
                   style={{ background: "linear-gradient(180deg, #0F172A 0%, #111827 55%, #0B1120 100%)" }}
            >
                {/* Logo */}
                <div className={`flex items-center h-16 flex-shrink-0 border-b ${collapsed ? "justify-center px-0" : "px-5 gap-3"}`}
                     style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                    <AgriVaultLogo collapsed={collapsed} />
                </div>

                {/* Farm switcher */}
                <div className={`flex-shrink-0 py-2 ${collapsed ? "px-2" : "px-3"}`}
                     style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <FarmSwitcher collapsed={collapsed} userId={session?.user?.id ?? ""} />
                </div>

                {/* Nav groups — scrollable */}
                <nav className="flex-1 overflow-y-auto py-2 min-h-0"
                     style={{ scrollbarWidth: "none" }}>
                    {visibleGroups.map((group) => (
                        <div key={group.label} className="mb-2">
                            {!collapsed && (
                                <p className="px-4 pt-3 pb-1 text-[10px] font-black uppercase tracking-[0.12em]"
                                   style={{ color: "rgba(255,255,255,0.25)" }}>
                                    {group.label}
                                </p>
                            )}
                            {collapsed && <div className="h-2" />}
                            <div className={collapsed ? "px-2" : "px-2"}>
                                {group.items.map(({ label, href, icon: Icon, exact, matches }) => {
                                    const active = exact
                                        ? pathname === href
                                        : pathname === href ||
                                          pathname.startsWith(`${href}/`) ||
                                          matches?.some((match) => pathname === match || pathname.startsWith(`${match}/`));
                                    return (
                                        <Link
                                            key={href}
                                            href={href}
                                            title={collapsed ? label : undefined}
                                            className={`
                        flex min-h-11 items-center gap-3 px-3.5 py-2.5 rounded-2xl mb-1
                        text-sm font-semibold transition-all duration-150
                        ${collapsed ? "justify-center" : ""}
                        ${active
                                                ? "bg-white/15 text-white shadow-sm ring-1 ring-white/10"
                                                : "text-white/55 hover:bg-white/08 hover:text-white/90"
                                            }
                      `}
                                            style={active ? { textShadow: "0 1px 2px rgba(0,0,0,0.2)" } : {}}
                                        >
                                            <Icon size={18} className="flex-shrink-0" />
                                            {!collapsed && <span className="truncate">{label}</span>}
                                            {!collapsed && label === "Notifications" && notifCount > 0 && (
                                                <span className="ml-auto bg-sky-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0">
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

                    <div className={`flex min-h-12 items-center gap-3 px-3 py-2.5 mt-1 rounded-2xl ${collapsed ? "justify-center" : ""}`}>
                        <div className="w-10 h-10 rounded-2xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0">
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
                                    className="h-10 w-10 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/08 transition-colors flex-shrink-0 flex items-center justify-center"
                                    title="Sign out"
                                >
                                    <LogOut size={16} />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-4 top-20 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10"
                    style={{
                        background: "linear-gradient(135deg, #0284C7, #0F172A)",
                        border: "2px solid rgba(255,255,255,0.15)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                    }}
                >
                    {collapsed
                        ? <ChevronRight size={14} className="text-white" />
                        : <ChevronLeft  size={14} className="text-white" />}
                </button>
            </aside>

            {/* ── Main content ─────────────────────────────────────────────────── */}
            <main className="flex-1 min-w-0 overflow-y-auto" style={{ background: "var(--bg-page)" }}>

                {/* Top bar */}
                <div className="sticky top-0 z-30 min-h-16 flex items-center justify-between px-8"
                     style={{
                         background: "rgba(248,250,252,0.9)",
                         backdropFilter: "blur(12px)",
                         borderBottom: "1px solid var(--border)",
                     }}>

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm">
                        <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>AgriVault</span>
                        <ChevronRight size={14} style={{ color: "var(--text-hint)" }} />
                        <span style={{ color: "var(--text-primary)", fontWeight: 700 }} className="capitalize">
              {pathname.split("/").pop()?.replace(/-/g, " ") || "Dashboard"}
            </span>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard/weather"
                              className="h-11 w-11 rounded-2xl flex items-center justify-center transition-all"
                              style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                            <CloudSun size={18} />
                        </Link>
                        <Link href="/dashboard/notifications"
                              className="relative h-11 w-11 rounded-2xl flex items-center justify-center transition-all"
                              style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                            <Bell size={18} />
                            {notifCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-sky-500 rounded-full text-white text-[9px] font-black flex items-center justify-center">
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

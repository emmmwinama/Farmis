"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
    LayoutDashboard, Map, Sprout, ClipboardList, Users,
    Wallet, Settings, LogOut, ChevronLeft, ChevronRight,
    CalendarDays, Wheat, FileBarChart, Users2, Package,
} from "lucide-react";
import FarmSwitcher from "@/components/FarmSwitcher";
import DarkModeToggle from "@/components/DarkModeToggle";

const navItems = [
    { label: "Dashboard",  href: "/dashboard",            icon: LayoutDashboard },
    { label: "Fields",     href: "/dashboard/fields",     icon: Map },
    { label: "Crops",      href: "/dashboard/crops",      icon: Sprout },
    { label: "Activities", href: "/dashboard/activities", icon: ClipboardList },
    { label: "Yields",     href: "/dashboard/yields",     icon: Wheat },
    { label: "Inventory",  href: "/dashboard/inventory",  icon: Package },
    { label: "Employees",  href: "/dashboard/employees",  icon: Users },
    { label: "Finance",    href: "/dashboard/finance",    icon: Wallet },
    { label: "Seasons",    href: "/dashboard/seasons",    icon: CalendarDays },
    { label: "Reports",    href: "/dashboard/reports",    icon: FileBarChart },
    { label: "Team",       href: "/dashboard/team",       icon: Users2 },
    { label: "Settings",   href: "/dashboard/settings",   icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const { data: session } = useSession();

    const initials = session?.user?.name
        ?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "FM";

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
            <aside
                className={`relative flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ${
                    collapsed ? "w-16" : "w-56"
                }`}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-4 h-14 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-7 h-7 bg-[#1a3d1f] rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                            <polygon points="9,2 16,14 2,14" fill="#2d6a35"/>
                            <polygon points="9,5 14,14 4,14" fill="#3d8c47"/>
                            <polygon points="9,8 12,14 6,14" fill="#52b85e"/>
                            <rect x="7.5" y="11" width="3" height="5" rx="1" fill="#1a3d1f"/>
                        </svg>
                    </div>
                    {!collapsed && (
                        <span className="font-semibold text-slate-900 dark:text-white">Farmio</span>
                    )}
                </div>

                {/* Farm switcher */}
                <div className="px-2 py-2 border-b border-slate-100 dark:border-slate-800">
                    <FarmSwitcher collapsed={collapsed} userId={session?.user?.id ?? ""} />
                </div>

                {/* Nav */}
                <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-y-auto">
                    {navItems.map(({ label, href, icon: Icon }) => {
                        const active = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                title={collapsed ? label : undefined}
                                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                                    active
                                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold"
                                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white font-medium"
                                }`}
                            >
                                <Icon size={16} className="flex-shrink-0" />
                                {!collapsed && <span>{label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom */}
                <div className="border-t border-slate-100 dark:border-slate-800 p-2 flex flex-col gap-1">
                    <DarkModeToggle collapsed={collapsed} />

                    <div className="flex items-center gap-2 px-3 py-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300 flex-shrink-0">
                            {initials}
                        </div>
                        {!collapsed && (
                            <>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                        {session?.user?.name}
                                    </p>
                                </div>
                                <button
                                    onClick={() => signOut({ callbackUrl: "/login" })}
                                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
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
                    className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors z-10"
                >
                    {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
                </button>
            </aside>

            <main className="flex-1 min-w-0 overflow-auto">{children}</main>
        </div>
    );
}
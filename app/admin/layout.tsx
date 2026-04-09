"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard, Users, CreditCard, Layers,
    LogOut, ChevronLeft, ChevronRight, Receipt,
    MessageSquare, FileText,
} from "lucide-react";
import DarkModeToggle from "@/components/DarkModeToggle";

const navItems = [
    { label: "Overview",      href: "/admin",               icon: LayoutDashboard },
    { label: "Users",         href: "/admin/users",         icon: Users },
    { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
    { label: "Payments",      href: "/admin/payments",      icon: Receipt },
    { label: "Tiers",         href: "/admin/tiers",         icon: Layers },
    { label: "Inquiries",     href: "/admin/inquiries",     icon: MessageSquare },
    { label: "Site content",  href: "/admin/cms",           icon: FileText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (pathname === "/admin/login") return;
        fetch("/api/admin/overview")
            .then((r) => {
                if (r.status === 401) router.push("/admin/login");
                return r.json();
            })
            .catch(() => router.push("/admin/login"));
    }, [pathname]);

    if (pathname === "/admin/login") return <>{children}</>;

    const handleLogout = async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.push("/admin/login");
    };

    return (
        <div className="flex min-h-screen bg-[#111d13] dark:bg-[#0a1209]">
            <aside
                className={`relative flex flex-col bg-[#1a2d1c] dark:bg-[#111d13] border-r border-[#2d5c35] transition-all duration-300 ${
                    collapsed ? "w-16" : "w-56"
                }`}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-4 h-16 border-b border-[#2d5c35]">
                    <div className="w-7 h-7 bg-[#1a3d1f] border border-[#2d5c35] rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                            <polygon points="9,2 16,14 2,14" fill="#2d6a35"/>
                            <polygon points="9,5 14,14 4,14" fill="#3d8c47"/>
                            <polygon points="9,8 12,14 6,14" fill="#52b85e"/>
                            <rect x="7.5" y="11" width="3" height="5" rx="1" fill="#1a3d1f"/>
                        </svg>
                    </div>
                    {!collapsed && (
                        <span className="font-medium text-white text-sm">Admin Panel</span>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 py-4 px-2 flex flex-col gap-1">
                    {navItems.map(({ label, href, icon: Icon }) => {
                        const active = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                title={collapsed ? label : undefined}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                                    active
                                        ? "bg-[#1a3d1f] text-white"
                                        : "text-[#4a7a50] hover:bg-[#1a3d1f] hover:text-white"
                                }`}
                            >
                                <Icon size={16} className="flex-shrink-0" />
                                {!collapsed && <span>{label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom */}
                <div className="border-t border-[#2d5c35] p-2 flex flex-col gap-1">
                    <DarkModeToggle collapsed={collapsed} />
                    <button
                        onClick={handleLogout}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#4a7a50] hover:bg-[#1a3d1f] hover:text-white transition-colors w-full`}
                    >
                        <LogOut size={16} className="flex-shrink-0" />
                        {!collapsed && <span>Sign out</span>}
                    </button>
                </div>

                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-20 w-6 h-6 bg-[#1a2d1c] border border-[#2d5c35] rounded-full flex items-center justify-center text-[#4a7a50] hover:text-white transition-colors z-10"
                >
                    {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
                </button>
            </aside>

            <main className="flex-1 min-w-0 overflow-auto bg-[#111d13] dark:bg-[#0a1209]">
                {children}
            </main>
        </div>
    );
}
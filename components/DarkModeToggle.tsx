"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
    collapsed?: boolean;
    variant?: "sidebar" | "navbar";
}

export default function DarkModeToggle({ collapsed, variant = "sidebar" }: Props) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;

    const isDark = theme === "dark";

    if (variant === "navbar") {
        return (
            <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                title={isDark ? "Light mode" : "Dark mode"}
            >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
        );
    }

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors w-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 ${collapsed ? "justify-center" : ""}`}
            title={collapsed ? (isDark ? "Light mode" : "Dark mode") : undefined}
        >
            {isDark ? <Sun size={16} className="flex-shrink-0" /> : <Moon size={16} className="flex-shrink-0" />}
            {!collapsed && <span>{isDark ? "Light mode" : "Dark mode"}</span>}
        </button>
    );
}
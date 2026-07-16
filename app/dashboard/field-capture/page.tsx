"use client";

import Link from "next/link";
import { Activity, CloudOff, Database, ReceiptText, RefreshCw, Users } from "lucide-react";

const QUEUE_KEY = "agrivault-offline-capture-v1";

const ORIGINAL_FORMS = [
  {
    title: "Log activity",
    description: "Use the full activity form with fields, crops, labour, inputs, and notes.",
    href: "/dashboard/activities/new",
    icon: Activity,
  },
  {
    title: "Record sale",
    description: "Use inventory sales or finance records so revenue stays connected to reports.",
    href: "/dashboard/inventory",
    icon: ReceiptText,
  },
  {
    title: "Add worker",
    description: "Use employee records for payroll, roles, and team capacity evidence.",
    href: "/dashboard/employees",
    icon: Users,
  },
];

export default function FieldCapturePage() {
  const queued = typeof window !== "undefined"
    ? JSON.parse(window.localStorage.getItem(QUEUE_KEY) ?? "[]").filter((item: any) => item.status !== "synced").length
    : 0;

  return (
    <div className="p-8">
      <div className="page-header flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Offline capture</h1>
          <p className="page-subtitle">
            Field teams should use the original forms. When offline support is enabled, submissions from those forms are queued and synced automatically.
          </p>
        </div>
        <span className="badge badge-blue min-h-9">
          <CloudOff size={14} />
          Queue ready
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {ORIGINAL_FORMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="card card-hover p-5 min-h-56">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                     style={{ background: "var(--info-bg)", color: "var(--info-text)" }}>
                  <Icon size={21} />
                </div>
                <h2 className="text-lg font-black" style={{ color: "var(--text-primary)" }}>{item.title}</h2>
                <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>{item.description}</p>
                <span className="btn-secondary min-h-11 mt-5 w-full">Open form</span>
              </Link>
            );
          })}
        </div>

        <div className="card p-5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
               style={{ background: "#F0F9FF", color: "#0284C7" }}>
            <Database size={22} />
          </div>
          <h2 className="section-title">Sync queue</h2>
          <p className="section-subtitle mt-1">
            Pending submissions stay on this device until internet is available. The next step is to wire this queue into each original form submit handler.
          </p>
          <div className="rounded-2xl p-4 my-5" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Pending records</p>
            <p className="text-3xl font-black mt-1" style={{ color: "#0284C7" }}>{queued}</p>
          </div>
          <button className="btn-primary min-h-11 w-full" disabled>
            <RefreshCw size={16} />
            Auto-sync from original forms
          </button>
        </div>
      </div>
    </div>
  );
}

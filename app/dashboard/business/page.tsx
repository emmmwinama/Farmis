import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Package,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const BUSINESS_TOOLS: Array<{
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  meta: string;
}> = [
  {
    title: "Finance",
    description: "Track income, expenses, season profitability, and field-linked transactions.",
    href: "/dashboard/finance",
    icon: Wallet,
    meta: "Money movement",
  },
  {
    title: "Inventory",
    description: "Manage harvested produce, stock balances, sales, and storage records.",
    href: "/dashboard/inventory",
    icon: Package,
    meta: "Stock and sales",
  },
  {
    title: "Employees",
    description: "Maintain worker roles, pay rates, contact details, and active staff records.",
    href: "/dashboard/employees",
    icon: Users,
    meta: "Payroll setup",
  },
  {
    title: "Seasons",
    description: "Review seasonal performance and compare production, costs, and outcomes.",
    href: "/dashboard/seasons",
    icon: CalendarDays,
    meta: "Season control",
  },
];

export default function BusinessCommandPage() {
  return (
    <div className="p-8">
      <div className="page-header">
        <p className="text-xs font-black uppercase tracking-[0.16em] mb-2" style={{ color: "var(--farm-green)" }}>
          Business command center
        </p>
        <h1 className="page-title">Business</h1>
        <p className="page-subtitle">
          Finance, inventory, payroll, and seasons for running the farm like a business.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {BUSINESS_TOOLS.map((tool) => (
          <CommandCard key={tool.href} {...tool} />
        ))}
      </div>
    </div>
  );
}

function CommandCard({
  title,
  description,
  href,
  icon: Icon,
  meta,
}: {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  meta: string;
}) {
  return (
    <Link href={href} className="card card-hover p-5 group block">
      <div className="flex items-start justify-between gap-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "var(--info-bg)", color: "var(--info-text)" }}>
          <Icon size={20} />
        </div>
        <ArrowRight size={17} className="opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-muted)" }} />
      </div>
      <p className="text-[11px] font-black uppercase tracking-[0.12em] mt-5" style={{ color: "var(--text-muted)" }}>
        {meta}
      </p>
      <h2 className="text-lg font-black mt-1" style={{ color: "var(--text-primary)" }}>
        {title}
      </h2>
      <p className="text-sm leading-relaxed mt-2" style={{ color: "var(--text-muted)" }}>
        {description}
      </p>
    </Link>
  );
}

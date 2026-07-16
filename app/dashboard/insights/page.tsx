import Link from "next/link";
import {
  ArrowRight,
  CloudSun,
  FileArchive,
  FileBarChart,
  Landmark,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const INSIGHT_TOOLS: Array<{
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  meta: string;
}> = [
  {
    title: "Reports",
    description: "Analyse cost, revenue, production, season performance, and farm profitability.",
    href: "/dashboard/reports",
    icon: FileBarChart,
    meta: "Decision reports",
  },
  {
    title: "Weather",
    description: "Check weather conditions and farm advice before spraying, planting, or harvesting.",
    href: "/dashboard/weather",
    icon: CloudSun,
    meta: "Field timing",
  },
  {
    title: "Credit readiness",
    description: "Review lender-facing completeness, repayment evidence, and gaps to fix before applying.",
    href: "/dashboard/credit-score",
    icon: Landmark,
    meta: "Loan preparation",
  },
  {
    title: "Record packs",
    description: "Export farm evidence for loans, buyers, audits, insurance, and partner reporting.",
    href: "/dashboard/records",
    icon: FileArchive,
    meta: "Evidence exports",
  },
];

export default function InsightsCommandPage() {
  return (
    <div className="p-8">
      <div className="page-header">
        <p className="text-xs font-black uppercase tracking-[0.16em] mb-2" style={{ color: "var(--farm-green)" }}>
          Insights command center
        </p>
        <h1 className="page-title">Insights</h1>
        <p className="page-subtitle">
          Reports, weather, credit readiness, and exportable evidence for better farm decisions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {INSIGHT_TOOLS.map((tool) => (
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

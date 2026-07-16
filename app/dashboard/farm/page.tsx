import Link from "next/link";
import {
  ArrowRight,
  CalendarRange,
  ClipboardList,
  Beef,
  Globe,
  Map,
  Sprout,
  Wheat,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const FARM_TOOLS: Array<{
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  meta: string;
}> = [
  {
    title: "Fields",
    description: "Manage field size, soil type, GPS position, notes, and cultivatable area.",
    href: "/dashboard/fields",
    icon: Map,
    meta: "Land records",
  },
  {
    title: "Crops",
    description: "Track planted crops, varieties, seasons, harvest windows, and active status.",
    href: "/dashboard/crops",
    icon: Sprout,
    meta: "Crop planning",
  },
  {
    title: "Activities",
    description: "Review field work, labour, inputs, costs, and notes by field or season.",
    href: "/dashboard/activities",
    icon: ClipboardList,
    meta: "Operations log",
  },
  {
    title: "Calendar",
    description: "See upcoming tasks, crop dates, seasonal work, and scheduled farm events.",
    href: "/dashboard/calendar",
    icon: CalendarRange,
    meta: "Work schedule",
  },
  {
    title: "Yields",
    description: "Record harvests, compare production, and prepare evidence for sales and loans.",
    href: "/dashboard/yields",
    icon: Wheat,
    meta: "Harvest records",
  },
  {
    title: "Livestock",
    description: "Manage animal records, health, weight, production, expenses, and livestock sales.",
    href: "/dashboard/livestock",
    icon: Beef,
    meta: "Animal records",
  },
  {
    title: "Farm map",
    description: "View boundaries, zones, markers, and mapped farm assets in one place.",
    href: "/dashboard/map",
    icon: Globe,
    meta: "Spatial view",
  },
];

export default function FarmCommandPage() {
  return (
    <div className="p-8">
      <div className="page-header">
        <p className="text-xs font-black uppercase tracking-[0.16em] mb-2" style={{ color: "var(--farm-green)" }}>
          Farm command center
        </p>
        <h1 className="page-title">Farm</h1>
        <p className="page-subtitle">
          Land, crops, field work, maps, schedules, and harvest records in one focused workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {FARM_TOOLS.map((tool) => (
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

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, ClipboardList, FileText, Users } from "lucide-react";
import type { SeasonalTemplate } from "@/lib/seasonTemplates";

export default function SeasonalTemplatesPage() {
  const [templates, setTemplates] = useState<SeasonalTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/templates/seasonal")
      .then((res) => res.json())
      .then((data) => setTemplates(data.templates ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <div className="page-header flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Seasonal templates</h1>
          <p className="page-subtitle">Guided crop, activity, payroll, and sales workflows for field teams.</p>
        </div>
        <Link href="/dashboard/field-capture" className="btn-primary">
          <ClipboardList size={16} />
          Start capture
        </Link>
      </div>

      {loading ? (
        <div className="card p-8 text-sm text-muted">Loading templates...</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {templates.map((template) => (
            <div key={template.id} className="card card-hover p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--farm-green)" }}>
                    {template.crop}
                  </p>
                  <h2 className="text-lg font-black mt-1" style={{ color: "var(--text-primary)" }}>{template.name}</h2>
                  <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>{template.description}</p>
                </div>
                <span className="badge badge-blue">
                  <CalendarDays size={12} />
                  {template.season}
                </span>
              </div>

              <TemplateBlock icon={<ClipboardList size={15} />} title="Activities">
                {template.activities.map((activity) => (
                  <li key={`${template.id}-${activity.activityType}`} className="py-2">
                    <p className="font-bold" style={{ color: "var(--text-primary)" }}>{activity.activityType}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{activity.timing} - {activity.notes}</p>
                  </li>
                ))}
              </TemplateBlock>

              <TemplateBlock icon={<Users size={15} />} title="Payroll">
                {template.payroll.map((item) => (
                  <li key={`${template.id}-${item.role}`} className="py-2">
                    <p className="font-bold" style={{ color: "var(--text-primary)" }}>{item.role}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{item.payRateUnit} rate - {item.notes}</p>
                  </li>
                ))}
              </TemplateBlock>

              <TemplateBlock icon={<FileText size={15} />} title="Records">
                {template.recordPackHints.map((hint) => (
                  <li key={`${template.id}-${hint}`} className="py-1.5 text-xs" style={{ color: "var(--text-muted)" }}>{hint}</li>
                ))}
              </TemplateBlock>

              <Link href={`/dashboard/field-capture?template=${template.id}`} className="btn-secondary w-full mt-4">
                Use template
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateBlock({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.1em]" style={{ color: "var(--text-secondary)" }}>
        {icon}
        {title}
      </div>
      <ul className="mt-2 divide-y" style={{ borderColor: "var(--border)" }}>
        {children}
      </ul>
    </div>
  );
}

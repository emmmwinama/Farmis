"use client";

import { useMemo, useState } from "react";
import { Download, FileCheck2, Landmark, PackageCheck, ShieldCheck } from "lucide-react";

const PACKS = [
  {
    type: "loan",
    title: "Loan readiness",
    description: "Cashflow, area, production history, payroll capacity, and repayment evidence.",
    icon: Landmark,
  },
  {
    type: "buyer",
    title: "Buyer records",
    description: "Traceability, activity proof, crop volumes, sales history, and quality notes.",
    icon: PackageCheck,
  },
  {
    type: "audit",
    title: "Audit file",
    description: "Field, input, activity, finance, employee, and livestock evidence in one pack.",
    icon: FileCheck2,
  },
  {
    type: "insurance",
    title: "Insurance file",
    description: "Acreage, crop status, activities, harvest proof, livestock, and loss evidence.",
    icon: ShieldCheck,
  },
];

const SECTIONS = [
  { key: "fields", label: "Fields and crops" },
  { key: "activities", label: "Activities and inputs" },
  { key: "finance", label: "Finance records" },
  { key: "payroll", label: "Payroll capacity" },
  { key: "livestock", label: "Livestock summary" },
];

export default function RecordPacksPage() {
  const [selectedPack, setSelectedPack] = useState(PACKS[0].type);
  const [sections, setSections] = useState(SECTIONS.map((section) => section.key));

  const query = useMemo(() => {
    const params = new URLSearchParams({ type: selectedPack });
    sections.forEach((section) => params.append("section", section));
    return params.toString();
  }, [selectedPack, sections]);

  function toggleSection(key: string) {
    setSections((current) => current.includes(key)
      ? current.filter((item) => item !== key)
      : [...current, key]);
  }

  return (
    <div className="p-8">
      <div className="page-header">
        <h1 className="page-title">Record packs</h1>
        <p className="page-subtitle">Export farm records for lenders, buyers, auditors, and insurers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        {PACKS.map((pack) => {
          const Icon = pack.icon;
          const selected = selectedPack === pack.type;
          return (
            <button key={pack.type} onClick={() => setSelectedPack(pack.type)}
                    className="card card-hover p-5 flex flex-col text-left min-h-56"
                    style={{ borderColor: selected ? "#0284C7" : "var(--border)", boxShadow: selected ? "0 0 0 2px rgba(2,132,199,0.16)" : undefined }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: "var(--info-bg)", color: "var(--info-text)" }}>
                <Icon size={20} />
              </div>
              <h2 className="text-lg font-black" style={{ color: "var(--text-primary)" }}>{pack.title}</h2>
              <p className="text-sm mt-2 flex-1" style={{ color: "var(--text-muted)" }}>{pack.description}</p>
              <span className={`badge mt-5 ${selected ? "badge-blue" : "badge-sky"}`}>{selected ? "Selected" : "Select"}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="card p-5">
          <p className="text-sm font-bold mb-4" style={{ color: "var(--text-primary)" }}>Choose what to include</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SECTIONS.map((section) => (
              <label key={section.key}
                     className="min-h-12 rounded-2xl px-4 flex items-center gap-3 cursor-pointer"
                     style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                <input
                  type="checkbox"
                  checked={sections.includes(section.key)}
                  onChange={() => toggleSection(section.key)}
                  className="h-5 w-5"
                />
                <span className="text-sm font-bold" style={{ color: "var(--text-secondary)" }}>{section.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Professional export</p>
          <p className="text-sm mt-1 mb-5" style={{ color: "var(--text-muted)" }}>
            Generate a polished PDF with a cover summary, selected evidence sections, and page numbering. CSV remains available for spreadsheets.
          </p>
          <a href={`/api/export/records?${query}&format=pdf`} className="btn-primary w-full min-h-11">
            <Download size={16} />
            Export PDF
          </a>
          <a href={`/api/export/records?${query}&format=csv`} className="btn-secondary w-full min-h-11 mt-3">
            <Download size={16} />
            Export CSV
          </a>
        </div>
      </div>
    </div>
  );
}

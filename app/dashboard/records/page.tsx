"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileCheck2, Filter, Landmark, PackageCheck, ShieldCheck } from "lucide-react";

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

const SECTION_GROUPS = [
  {
    title: "Report page sections",
    items: [
      { key: "overview", label: "Executive overview" },
      { key: "finance", label: "Financials" },
      { key: "analytics", label: "Analytics tables" },
      { key: "yields", label: "Yields" },
      { key: "overhead", label: "Overhead" },
      { key: "trends", label: "Yield trends" },
      { key: "performance", label: "Crop performance" },
      { key: "breakeven", label: "Break-even" },
      { key: "comparison", label: "Season compare" },
    ],
  },
  {
    title: "Evidence records",
    items: [
      { key: "fields", label: "Fields and crops" },
      { key: "activities", label: "Activities and inputs" },
      { key: "payroll", label: "Payroll capacity" },
      { key: "livestock", label: "Livestock summary" },
    ],
  },
];
const SECTIONS = SECTION_GROUPS.flatMap((group) => group.items);

export default function RecordPacksPage() {
  const [selectedPack, setSelectedPack] = useState(PACKS[0].type);
  const [sections, setSections] = useState(SECTIONS.map((section) => section.key));
  const [fields, setFields] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    season: "",
    cropFieldId: "",
    fieldId: "",
    from: "",
    to: "",
    lifecycle: "all",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/fields").then((r) => r.json()).catch(() => []),
      fetch("/api/crops?archived=both").then((r) => r.json()).catch(() => []),
    ]).then(([fieldData, cropData]) => {
      setFields(Array.isArray(fieldData) ? fieldData : []);
      setCrops(Array.isArray(cropData) ? cropData : []);
    });
  }, []);

  const query = useMemo(() => {
    const params = new URLSearchParams({ type: selectedPack });
    sections.forEach((section) => params.append("section", section));
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "all") params.set(key, value);
    });
    return params.toString();
  }, [selectedPack, sections, filters]);

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
        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Choose what to include</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Select report tables and evidence records. Graph data is exported as readable tables.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setSections(SECTIONS.map((section) => section.key))}
                        className="h-9 px-3 rounded-xl text-xs font-bold"
                        style={{ background: "var(--info-bg)", color: "var(--info-text)" }}>
                  All
                </button>
                <button type="button" onClick={() => setSections([])}
                        className="h-9 px-3 rounded-xl text-xs font-bold"
                        style={{ background: "var(--bg-subtle)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                  None
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {SECTION_GROUPS.map((group) => (
                <div key={group.title} className="rounded-2xl p-4" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                  <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>{group.title}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.items.map((section) => (
                      <label key={section.key}
                             className="min-h-11 rounded-xl px-3 flex items-center gap-3 cursor-pointer"
                             style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
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
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "var(--info-bg)", color: "var(--info-text)" }}>
                <Filter size={17} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Filter records</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Scope the PDF before export.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input value={filters.season} onChange={(e) => setFilters((p) => ({ ...p, season: e.target.value }))}
                     placeholder="Season e.g. 2026A"
                     className="min-h-12 rounded-xl px-4 text-sm outline-none"
                     style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
              <select value={filters.fieldId} onChange={(e) => setFilters((p) => ({ ...p, fieldId: e.target.value }))}
                      className="min-h-12 rounded-xl px-4 text-sm outline-none"
                      style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                <option value="">All fields</option>
                {fields.map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}
              </select>
              <select value={filters.cropFieldId} onChange={(e) => setFilters((p) => ({ ...p, cropFieldId: e.target.value }))}
                      className="min-h-12 rounded-xl px-4 text-sm outline-none"
                      style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                <option value="">All crops</option>
                {crops.map((crop) => <option key={crop.id} value={crop.id}>{crop.cropTypeName} {crop.variety} - {crop.season}</option>)}
              </select>
              <input type="date" value={filters.from} onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
                     className="min-h-12 rounded-xl px-4 text-sm outline-none"
                     style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
              <input type="date" value={filters.to} onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
                     className="min-h-12 rounded-xl px-4 text-sm outline-none"
                     style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
              <select value={filters.lifecycle} onChange={(e) => setFilters((p) => ({ ...p, lifecycle: e.target.value }))}
                      className="min-h-12 rounded-xl px-4 text-sm outline-none"
                      style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                <option value="all">Active and archived</option>
                <option value="active">Active only</option>
                <option value="archived">Archived only</option>
              </select>
            </div>
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

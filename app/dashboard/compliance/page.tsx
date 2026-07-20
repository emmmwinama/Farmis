"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Building2, CheckCircle2, ClipboardCheck, Download, Loader2, ShieldAlert, ShieldCheck, TrendingUp, XCircle } from "lucide-react";
import { fetchJson } from "@/lib/fetchJson";

function fmt(n: number) {
  return new Intl.NumberFormat("en-MW").format(Math.round(n));
}

export default function CompliancePage() {
  const [data, setData] = useState<any>(null);
  const [partnerData, setPartnerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetchJson("/api/traceability"),
      fetchJson("/api/funder-dashboard").catch(() => null),
    ])
      .then(([traceability, partners]) => { setData(traceability ?? {}); setPartnerData(partners ?? {}); setLoading(false); })
      .catch(() => { setError("Traceability records could not be loaded."); setData({}); setLoading(false); });
  }, []);

  const lots = data?.lots ?? [];
  const partnerTotals = partnerData?.totals ?? {};
  const portfolio = partnerData?.portfolio ?? [];
  const csv = [
    ["Lot ID", "Crop", "Variety", "Field", "Season", "Activities", "Spray records", "Harvests", "Sales", "Revenue", "Buyer ready"].join(","),
    ...lots.map((lot: any) => [
      lot.lotId,
      lot.cropName,
      lot.variety,
      lot.fieldName,
      lot.season,
      lot.activityCount,
      lot.sprayRecordCount,
      lot.harvestCount,
      lot.saleCount,
      lot.revenue,
      lot.checklist.buyerReady ? "Yes" : "No",
    ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="page-header flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Record completeness and traceability</h1>
          <p className="page-subtitle">Completeness, evidence readiness, crop lot IDs, spray records, and harvest-to-sale linkage.</p>
        </div>
        <a href={csvHref} download="agrivault-traceability.csv" className="btn-primary min-h-11">
          <Download size={16} /> Export traceability
        </a>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
      ) : error ? (
        <div className="card p-8 text-center">
          <p className="section-title mb-2">Traceability unavailable</p>
          <p className="section-subtitle">{error}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {[
              { label: "Crop lots", value: data?.totals?.lots ?? 0 },
              { label: "Buyer ready", value: data?.totals?.buyerReady ?? 0 },
              { label: "Missing activities", value: data?.totals?.missingActivities ?? 0 },
              { label: "Missing harvest links", value: data?.totals?.missingHarvestLinks ?? 0 },
              { label: "Missing sales links", value: data?.totals?.missingSalesLinks ?? 0 },
            ].map((stat) => (
              <div key={stat.label} className="card p-5">
                <p className="text-2xl font-black" style={{ color: "var(--info-text)" }}>{stat.value}</p>
                <p className="text-xs font-bold mt-1" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {[
              { label: "Accessible farms", value: partnerTotals.farms ?? 0, icon: Building2, color: "#0284C7" },
              { label: "Avg completeness", value: `${partnerTotals.averageCompleteness ?? 0}%`, icon: CheckCircle2, color: "#0D9488" },
              { label: "Harvest records", value: partnerTotals.harvests ?? 0, icon: TrendingUp, color: "#2563EB" },
              { label: "Evidence docs", value: partnerTotals.documents ?? 0, icon: ShieldCheck, color: "#7C3AED" },
              { label: "High risk", value: partnerTotals.highRisk ?? 0, icon: AlertTriangle, color: "#DC2626" },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="card p-5">
                  <Icon size={18} style={{ color: stat.color }} />
                  <p className="text-2xl font-black mt-3" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-xs font-bold mt-1" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
                </div>
              );
            })}
          </div>

          {portfolio.length > 0 && (
            <div className="card overflow-hidden mb-6">
              <div className="px-5 py-4" style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border)" }}>
                <p className="text-sm font-black" style={{ color: "var(--text-primary)" }}>Farm record completeness</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["Farm", "Location", "Record proof", "Financials", "Completeness", "Risk"].map((head) => (
                        <th key={head} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{head}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.map((farm: any) => (
                      <tr key={farm.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="px-5 py-4 font-bold" style={{ color: "var(--text-primary)" }}>{farm.name}</td>
                        <td className="px-5 py-4 text-xs" style={{ color: "var(--text-secondary)" }}>{farm.location || "Not set"}</td>
                        <td className="px-5 py-4 text-xs" style={{ color: "var(--text-secondary)" }}>
                          {farm.fields} fields - {farm.crops} crops - {farm.activities} activities - {farm.harvests} harvests
                        </td>
                        <td className="px-5 py-4 font-black" style={{ color: farm.net >= 0 ? "#0D9488" : "#DC2626" }}>
                          MWK {fmt(farm.net)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="h-2 w-28 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                            <div className="h-full rounded-full" style={{ width: `${farm.recordCompleteness}%`, background: "#0284C7" }} />
                          </div>
                          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{farm.recordCompleteness}% complete</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="badge" style={{ background: farm.risk === "High" ? "#FEF2F2" : farm.risk === "Medium" ? "#EFF6FF" : "#ECFDF5", color: farm.risk === "High" ? "#DC2626" : farm.risk === "Medium" ? "#2563EB" : "#047857" }}>
                            {farm.risk}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
              <ClipboardCheck size={18} style={{ color: "#0284C7" }} />
              <p className="text-sm font-black" style={{ color: "var(--text-primary)" }}>Buyer-ready crop lots</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Lot", "Crop", "Field", "Evidence", "Revenue", "Status"].map((head) => (
                      <th key={head} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lots.map((lot: any) => (
                    <tr key={lot.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="px-5 py-4 font-mono text-xs font-bold" style={{ color: "var(--text-primary)" }}>{lot.lotId}</td>
                      <td className="px-5 py-4">
                        <p className="font-bold" style={{ color: "var(--text-primary)" }}>{lot.cropName} - {lot.variety}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{lot.season}</p>
                      </td>
                      <td className="px-5 py-4 text-xs" style={{ color: "var(--text-secondary)" }}>{lot.fieldName}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge ok={lot.checklist.activities} label={`${lot.activityCount} activities`} />
                          <Badge ok={lot.checklist.sprayRecords} label={`${lot.sprayRecordCount} spray`} />
                          <Badge ok={lot.checklist.harvestLinked} label={`${lot.harvestCount} harvest`} />
                          <Badge ok={lot.checklist.salesLinked} label={`${lot.saleCount} sales`} />
                        </div>
                      </td>
                      <td className="px-5 py-4 font-black" style={{ color: "#0D9488" }}>MWK {fmt(lot.revenue ?? 0)}</td>
                      <td className="px-5 py-4">
                        {lot.checklist.buyerReady ? (
                          <span className="badge badge-green"><CheckCircle2 size={12} /> Ready</span>
                        ) : (
                          <span className="badge badge-blue"><ShieldAlert size={12} /> Needs evidence</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black" style={{ background: ok ? "#ECFDF5" : "#EFF6FF", color: ok ? "#047857" : "#2563EB" }}>
      {ok ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
      {label}
    </span>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Download, Fuel, Loader2, Plus, Tractor, Wrench } from "lucide-react";

const emptyEquipment = { name: "", unit: "unit", quantity: "1", acquisitionType: "Owned", notes: "" };
const emptyCost = { description: "", category: "Fuel", amount: "", date: new Date().toISOString().slice(0, 10), notes: "" };

function fmt(n: number) {
  return new Intl.NumberFormat("en-MW").format(Math.round(n));
}

export default function EquipmentPage() {
  const [items, setItems] = useState<any[]>([]);
  const [costs, setCosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEquipment, setShowEquipment] = useState(false);
  const [showCost, setShowCost] = useState(false);
  const [equipment, setEquipment] = useState(emptyEquipment);
  const [cost, setCost] = useState(emptyCost);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [inventoryRes, overheadRes] = await Promise.all([
      fetch("/api/inventory?category=equipment").then((r) => r.json()),
      fetch("/api/overhead").then((r) => r.json()).catch(() => []),
    ]);
    setItems(inventoryRes.items ?? []);
    setCosts(Array.isArray(overheadRes) ? overheadRes.filter((row) => ["Fuel", "Maintenance", "Machinery"].includes(row.category)) : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totals = useMemo(() => ({
    equipment: items.reduce((sum, item) => sum + (item.quantity ?? 0), 0),
    cost: costs.reduce((sum, row) => sum + (row.amount ?? 0), 0),
    fuel: costs.filter((row) => row.category === "Fuel").reduce((sum, row) => sum + (row.amount ?? 0), 0),
    service: costs.filter((row) => row.category !== "Fuel").reduce((sum, row) => sum + (row.amount ?? 0), 0),
  }), [items, costs]);

  async function saveEquipment(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...equipment,
        category: "equipment",
        notes: `${equipment.acquisitionType} equipment${equipment.notes ? ` - ${equipment.notes}` : ""}`,
      }),
    });
    setEquipment(emptyEquipment);
    setShowEquipment(false);
    setSaving(false);
    load();
  }

  async function saveCost(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/overhead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cost),
    });
    setCost(emptyCost);
    setShowCost(false);
    setSaving(false);
    load();
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="page-header flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Equipment and machinery</h1>
          <p className="page-subtitle">Track tractors, implements, fuel, service reminders, and machinery costs.</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/export/records?type=equipment&format=pdf&section=inventory&section=overhead"
             className="btn-secondary min-h-11"><Download size={16} /> Equipment report</a>
          <a href="/api/export/records?type=fuel-maintenance&format=pdf&section=overhead"
             className="btn-secondary min-h-11"><Download size={16} /> Fuel and maintenance</a>
          <button onClick={() => setShowCost(true)} className="btn-secondary min-h-11"><Fuel size={16} /> Log fuel/service</button>
          <button onClick={() => setShowEquipment(true)} className="btn-primary min-h-11"><Plus size={16} /> Add equipment</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Equipment units", value: String(totals.equipment), icon: Tractor, color: "#0284C7" },
          { label: "Fuel cost", value: `MWK ${fmt(totals.fuel)}`, icon: Fuel, color: "#0D9488" },
          { label: "Service cost", value: `MWK ${fmt(totals.service)}`, icon: Wrench, color: "#7C3AED" },
          { label: "Total machinery cost", value: `MWK ${fmt(totals.cost)}`, icon: Tractor, color: "#DC2626" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card p-5">
              <Icon size={19} style={{ color: stat.color }} />
              <p className="text-2xl font-black mt-3" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs font-bold mt-1" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <p className="text-sm font-black mb-4" style={{ color: "var(--text-primary)" }}>Register</p>
            <div className="flex flex-col gap-3">
              {items.length === 0 ? <p className="text-sm" style={{ color: "var(--text-muted)" }}>No equipment registered.</p> : items.map((item) => (
                <div key={item.id} className="min-h-14 rounded-2xl px-4 py-3 flex justify-between gap-4" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{item.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{item.notes || "No notes"}</p>
                  </div>
                  <span className="text-sm font-black" style={{ color: "#0284C7" }}>{item.quantity} {item.unit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <p className="text-sm font-black mb-4" style={{ color: "var(--text-primary)" }}>Fuel and service log</p>
            <div className="flex flex-col gap-3">
              {costs.length === 0 ? <p className="text-sm" style={{ color: "var(--text-muted)" }}>No machinery costs logged.</p> : costs.slice(0, 12).map((row) => (
                <div key={row.id} className="min-h-14 rounded-2xl px-4 py-3 flex justify-between gap-4" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{row.description}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{row.category} - {new Date(row.date).toLocaleDateString("en-GB")}</p>
                  </div>
                  <span className="text-sm font-black" style={{ color: "#DC2626" }}>MWK {fmt(row.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showEquipment && (
        <Modal title="Add equipment" onClose={() => setShowEquipment(false)}>
          <form onSubmit={saveEquipment} className="grid grid-cols-1 gap-3">
            <input className="input min-h-12" required placeholder="Tractor, sprayer, trailer..." value={equipment.name} onChange={(e) => setEquipment((p) => ({ ...p, name: e.target.value }))} />
            <select className="input min-h-12" value={equipment.acquisitionType} onChange={(e) => setEquipment((p) => ({ ...p, acquisitionType: e.target.value }))}>
              <option>Owned</option>
              <option>Hired</option>
              <option>Leased</option>
              <option>Borrowed</option>
            </select>
            <input className="input min-h-12" type="number" min="1" value={equipment.quantity} onChange={(e) => setEquipment((p) => ({ ...p, quantity: e.target.value }))} />
            <textarea className="input min-h-24 p-4" placeholder="Model, registration, service interval, assignment..." value={equipment.notes} onChange={(e) => setEquipment((p) => ({ ...p, notes: e.target.value }))} />
            <button className="btn-primary min-h-11" disabled={saving}>{saving ? <Loader2 size={16} className="animate-spin" /> : "Save equipment"}</button>
          </form>
        </Modal>
      )}

      {showCost && (
        <Modal title="Log fuel or service" onClose={() => setShowCost(false)}>
          <form onSubmit={saveCost} className="grid grid-cols-1 gap-3">
            <input className="input min-h-12" required placeholder="Fuel for MF 375, oil service..." value={cost.description} onChange={(e) => setCost((p) => ({ ...p, description: e.target.value }))} />
            <select className="input min-h-12" value={cost.category} onChange={(e) => setCost((p) => ({ ...p, category: e.target.value }))}>
              <option>Fuel</option>
              <option>Maintenance</option>
              <option>Machinery</option>
            </select>
            <input className="input min-h-12" required type="number" min="0" placeholder="Amount" value={cost.amount} onChange={(e) => setCost((p) => ({ ...p, amount: e.target.value }))} />
            <input className="input min-h-12" type="date" value={cost.date} onChange={(e) => setCost((p) => ({ ...p, date: e.target.value }))} />
            <textarea className="input min-h-24 p-4" placeholder="Notes, hours, field, operator..." value={cost.notes} onChange={(e) => setCost((p) => ({ ...p, notes: e.target.value }))} />
            <button className="btn-primary min-h-11" disabled={saving}>{saving ? <Loader2 size={16} className="animate-spin" /> : "Save cost"}</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
      <div className="card p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title">{title}</h2>
          <button onClick={onClose} className="btn-secondary min-h-10">Cancel</button>
        </div>
        {children}
      </div>
    </div>
  );
}

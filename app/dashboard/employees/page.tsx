"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, X, Check, Users, Phone } from "lucide-react";

const ROLES     = ["General Worker", "Supervisor", "Irrigator", "Sprayer", "Tractor Operator", "Harvester", "Packhouse Worker", "Guard", "Manager", "Other"];
const PAY_UNITS = ["day", "hour", "week", "month", "task"];

const emptyForm = { name: "", role: "General Worker", payRate: "", payRateUnit: "day", phone: "" };

function fmt(n: number) { return new Intl.NumberFormat("en-MW").format(Math.round(n)); }

const ROLE_BADGE: Record<string, { bg: string; color: string }> = {
  Manager:          { bg: "#F5F3FF", color: "#3C3489" },
  Supervisor:       { bg: "#EFF6FF", color: "#1E3A8A" },
  "General Worker": { bg: "#F8FAFC", color: "#475569" },
  Irrigator:        { bg: "#ECFEFF", color: "#164E63" },
  Sprayer:          { bg: "#F0F9FF", color: "#9A3412" },
  Harvester:        { bg: "#F0F9FF", color: "#075985" },
};

const AVATAR_COLORS = [
  { bg: "#1a3d1f", text: "#fff" },
  { bg: "#0F766E", text: "#fff" },
  { bg: "#1E3A8A", text: "#fff" },
  { bg: "#3C3489", text: "#fff" },
  { bg: "#075985", text: "#fff" },
  { bg: "#9A3412", text: "#fff" },
];

const INP: React.CSSProperties = {
  width: "100%", height: "44px", padding: "0 14px",
  fontSize: "13px", outline: "none", borderRadius: "10px",
  border: "1px solid var(--border)",
  background: "var(--bg-subtle)",
  color: "var(--text-primary)",
};

function Label({ children }: { children: React.ReactNode }) {
  return (
      <label style={{
        display: "block", fontSize: "10px", fontWeight: 900,
        textTransform: "uppercase", letterSpacing: "0.08em",
        marginBottom: "6px", color: "var(--text-muted)",
      }}>
        {children}
      </label>
  );
}

export default function EmployeesPage() {
  const [employees,        setEmployees]        = useState<any[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [showForm,         setShowForm]         = useState(false);
  const [editingEmployee,  setEditingEmployee]  = useState<any>(null);
  const [form,             setForm]             = useState(emptyForm);
  const [saving,           setSaving]           = useState(false);
  const [error,            setError]            = useState("");
  const [deletingId,       setDeletingId]       = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/employees").then((r) => r.json()).then((d) => { setEmployees(d); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const setF = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const openAdd = () => {
    setEditingEmployee(null); setForm(emptyForm); setError(""); setShowForm(true);
  };
  const openEdit = (emp: any) => {
    setEditingEmployee(emp);
    setForm({ name: emp.name, role: emp.role, payRate: emp.payRate.toString(), payRateUnit: emp.payRateUnit, phone: emp.phone ?? "" });
    setError(""); setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    const url    = editingEmployee ? `/api/employees/${editingEmployee.id}` : "/api/employees";
    const method = editingEmployee ? "PATCH" : "POST";
    const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d      = await res.json();
    if (!res.ok) { setError(d.error); setSaving(false); } else { setShowForm(false); setSaving(false); load(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this employee?")) return;
    setDeletingId(id);
    await fetch(`/api/employees/${id}`, { method: "DELETE" });
    setDeletingId(null); load();
  };

  const active        = employees.filter((e) => e.isActive);
  const totalPayroll  = employees.filter((e) => e.payRateUnit === "month").reduce((s, e) => s + e.payRate, 0);

  return (
      <div className="p-8 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)", letterSpacing: "-0.04em" }}>
              Employees
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {active.length} active · {employees.length} total
              {totalPayroll > 0 ? ` · MWK ${fmt(totalPayroll)}/month payroll` : ""}
            </p>
          </div>
          <button onClick={openAdd}
                  className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold text-white"
                  style={{ background: "var(--farm-green)", boxShadow: "0 4px 12px rgba(26,61,31,0.25)" }}>
            <Plus size={15} /> Add employee
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Active staff",     value: String(active.length),                                              color: "var(--farm-green)" },
            { label: "Total staff",      value: String(employees.length),                                           color: "var(--text-primary)" },
            { label: "Monthly payroll",  value: totalPayroll > 0 ? `MWK ${fmt(totalPayroll)}` : "—",               color: "#2563EB" },
          ].map(({ label, value, color }) => (
              <div key={label} className="rounded-2xl p-5"
                   style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                  {label}
                </p>
                <p className="text-2xl font-black" style={{ color }}>{value}</p>
              </div>
          ))}
        </div>

        {/* Content */}
        {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--farm-green)" }} />
            </div>
        ) : employees.length === 0 ? (
            <div className="rounded-2xl p-16 text-center"
                 style={{ background: "var(--bg-card)", border: "1.5px dashed var(--border)" }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                   style={{ background: "var(--bg-subtle)" }}>
                <Users size={24} style={{ color: "var(--text-muted)" }} />
              </div>
              <p className="text-lg font-black mb-1" style={{ color: "var(--text-primary)" }}>
                No employees yet
              </p>
              <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                Add your farm workers to track labour costs in activities
              </p>
              <button onClick={openAdd}
                      className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-bold text-white"
                      style={{ background: "var(--farm-green)" }}>
                <Plus size={15} /> Add employee
              </button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((emp, idx) => {
                const initials   = emp.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                const avatarClr  = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                const roleBadge  = ROLE_BADGE[emp.role] ?? { bg: "#F8FAFC", color: "#475569" };

                return (
                    <div key={emp.id}
                         className="group rounded-2xl p-5 transition-all"
                         style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                         onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--farm-green)")}
                         onMouseOut={(e)  => (e.currentTarget.style.borderColor = "var(--border)")}>

                      {/* Card top */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                               style={{ background: avatarClr.bg, color: avatarClr.text }}>
                            {initials}
                          </div>
                          <div>
                            <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                              {emp.name}
                            </p>
                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block mt-0.5"
                                  style={{ background: roleBadge.bg, color: roleBadge.color }}>
                                                {emp.role}
                                            </span>
                          </div>
                        </div>
                        {/* Actions */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(emp)}
                                  className="p-1.5 rounded-lg transition-colors"
                                  style={{ color: "var(--text-muted)", background: "var(--bg-subtle)" }}>
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDelete(emp.id)}
                                  disabled={deletingId === emp.id}
                                  className="p-1.5 rounded-lg transition-colors"
                                  style={{ background: "#FFF1F2", color: "#E11D48" }}>
                            {deletingId === emp.id
                                ? <Loader2 size={13} className="animate-spin" />
                                : <Trash2 size={13} />}
                          </button>
                        </div>
                      </div>

                      {/* Pay rate */}
                      <div className="rounded-xl p-3 mb-3"
                           style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                        <p className="text-[10px] font-black uppercase tracking-wide mb-0.5"
                           style={{ color: "var(--text-muted)" }}>
                          Pay rate
                        </p>
                        <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                          MWK {fmt(emp.payRate)}
                          <span className="text-xs font-semibold ml-1" style={{ color: "var(--text-muted)" }}>
                                            / {emp.payRateUnit}
                                        </span>
                        </p>
                      </div>

                      {/* Phone */}
                      {emp.phone && (
                          <div className="flex items-center gap-2 mb-2 text-xs"
                               style={{ color: "var(--text-muted)" }}>
                            <Phone size={11} /> {emp.phone}
                          </div>
                      )}

                      {/* Active status */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0"
                             style={{ background: emp.isActive ? "#16A34A" : "#CBD5E1" }} />
                        <span className="text-xs font-bold"
                              style={{ color: emp.isActive ? "#16A34A" : "var(--text-muted)" }}>
                                        {emp.isActive ? "Active" : "Inactive"}
                                    </span>
                      </div>
                    </div>
                );
              })}
            </div>
        )}

        {/* ── Slide-over form ──────────────────────────────────────────────── */}
        {showForm && (
            <div className="fixed inset-0 z-50 flex">
              <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setShowForm(false)} />
              <div className="w-full max-w-md flex flex-col shadow-2xl"
                   style={{ background: "var(--bg-card)", borderLeft: "1px solid var(--border)", height: "100vh" }}>

                <div className="flex items-center justify-between px-6 py-5 flex-shrink-0"
                     style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                  <h2 className="text-base font-black" style={{ color: "var(--text-primary)" }}>
                    {editingEmployee ? "Edit employee" : "Add employee"}
                  </h2>
                  <button onClick={() => setShowForm(false)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{ background: "var(--bg-subtle)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                    <X size={15} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

                    <div>
                      <Label>Full name *</Label>
                      <input value={form.name} onChange={(e) => setF("name", e.target.value)}
                             placeholder="John Banda" required style={INP} />
                    </div>

                    <div>
                      <Label>Role</Label>
                      <select value={form.role} onChange={(e) => setF("role", e.target.value)} style={INP}>
                        {ROLES.map((r) => <option key={r}>{r}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Pay rate (MWK) *</Label>
                        <input type="number" step="1" min="0"
                               value={form.payRate}
                               onChange={(e) => setF("payRate", e.target.value)}
                               placeholder="0" required style={INP} />
                      </div>
                      <div>
                        <Label>Per</Label>
                        <select value={form.payRateUnit}
                                onChange={(e) => setF("payRateUnit", e.target.value)}
                                style={INP}>
                          {PAY_UNITS.map((u) => <option key={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Pay rate preview */}
                    {form.payRate && (
                        <div className="rounded-xl px-4 py-3"
                             style={{ background: "var(--farm-pale)", border: "1px solid #86efac" }}>
                          <p className="text-xs font-bold" style={{ color: "var(--farm-green)" }}>
                            MWK {fmt(parseFloat(form.payRate))} per {form.payRateUnit}
                            {form.payRateUnit === "day" && ` · est. MWK ${fmt(parseFloat(form.payRate) * 26)}/month`}
                            {form.payRateUnit === "hour" && ` · est. MWK ${fmt(parseFloat(form.payRate) * 8 * 26)}/month`}
                            {form.payRateUnit === "week" && ` · est. MWK ${fmt(parseFloat(form.payRate) * 4)}/month`}
                          </p>
                        </div>
                    )}

                    <div>
                      <Label>Phone (optional)</Label>
                      <input value={form.phone}
                             onChange={(e) => setF("phone", e.target.value)}
                             placeholder="+265 999 000 000" style={INP} />
                    </div>

                    {error && (
                        <div className="rounded-xl px-4 py-3"
                             style={{ background: "#FFF1F2", border: "1px solid #FFE4E6" }}>
                          <p className="text-sm font-semibold" style={{ color: "#9F1239" }}>{error}</p>
                        </div>
                    )}
                  </div>

                  <div className="flex gap-3 px-6 py-5 flex-shrink-0"
                       style={{ borderTop: "1px solid var(--border)", background: "var(--bg-card)" }}>
                    <button type="button" onClick={() => setShowForm(false)}
                            className="flex-1 h-11 rounded-xl font-bold text-sm"
                            style={{ border: "1.5px solid var(--border)", color: "var(--text-muted)" }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={saving}
                            className="flex-1 h-11 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
                            style={{ background: saving ? "#94A3B8" : "var(--farm-green)" }}>
                      {saving
                          ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
                          : <><Check size={14} /> {editingEmployee ? "Update" : "Add employee"}</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}
      </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, X, Check, Users, Phone } from "lucide-react";

const ROLES = ["General Worker", "Supervisor", "Irrigator", "Sprayer", "Tractor Operator", "Harvester", "Packhouse Worker", "Guard", "Manager", "Other"];
const PAY_UNITS = ["day", "hour", "week", "month", "task"];

const emptyForm = { name: "", role: "General Worker", payRate: "", payRateUnit: "day", phone: "" };

function fmt(n: number) { return new Intl.NumberFormat("en-MW").format(Math.round(n)); }

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/employees").then((r) => r.json()).then((d) => { setEmployees(d); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const openAdd = () => { setEditingEmployee(null); setForm(emptyForm); setError(""); setShowForm(true); };
  const openEdit = (emp: any) => {
    setEditingEmployee(emp);
    setForm({ name: emp.name, role: emp.role, payRate: emp.payRate.toString(), payRateUnit: emp.payRateUnit, phone: emp.phone ?? "" });
    setError(""); setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    const url = editingEmployee ? `/api/employees/${editingEmployee.id}` : "/api/employees";
    const method = editingEmployee ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await res.json();
    if (!res.ok) { setError(d.error); setSaving(false); } else { setShowForm(false); load(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this employee?")) return;
    setDeletingId(id);
    await fetch(`/api/employees/${id}`, { method: "DELETE" });
    setDeletingId(null); load();
  };

  const active = employees.filter((e) => e.isActive);
  const totalPayroll = employees.filter((e) => e.payRateUnit === "month").reduce((s, e) => s + e.payRate, 0);

  const ROLE_COLORS: Record<string, string> = {
    Manager: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    Supervisor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    "General Worker": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
    Irrigator: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
    Sprayer: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    Harvester: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Employees</h1>
          <p className="text-slate-400 text-sm mt-1">{active.length} active · {employees.length} total{totalPayroll > 0 ? ` · MWK ${fmt(totalPayroll)}/month payroll` : ""}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 h-10 px-5 bg-[#1a3d1f] text-white text-sm font-bold rounded-xl hover:bg-[#2d5c35] transition-colors hover:shadow-lg hover:shadow-[#1a3d1f]/20">
          <Plus size={16} /> Add employee
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Active staff", value: String(active.length) },
          { label: "Total staff", value: String(employees.length) },
          { label: "Monthly payroll", value: totalPayroll > 0 ? `MWK ${fmt(totalPayroll)}` : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">{label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-slate-400" /></div>
      ) : employees.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-slate-400" />
          </div>
          <p className="font-bold text-slate-900 dark:text-white text-lg mb-2">No employees yet</p>
          <p className="text-slate-400 text-sm mb-6">Add your farm workers to track labour costs in activities</p>
          <button onClick={openAdd} className="inline-flex items-center gap-2 h-11 px-6 bg-[#1a3d1f] text-white text-sm font-bold rounded-xl hover:bg-[#2d5c35] transition-colors">
            <Plus size={16} /> Add employee
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <div key={emp.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {emp.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{emp.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${ROLE_COLORS[emp.role] ?? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                      {emp.role}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(emp)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(emp.id)} disabled={deletingId === emp.id} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 transition-colors">
                    {deletingId === emp.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 mb-3">
                <p className="text-xs text-slate-400">Pay rate</p>
                <p className="font-bold text-slate-900 dark:text-white">MWK {fmt(emp.payRate)} / {emp.payRateUnit}</p>
              </div>
              {emp.phone && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Phone size={12} /> {emp.phone}
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${emp.isActive ? "bg-green-500" : "bg-slate-300"}`} />
                <span className="text-xs text-slate-400">{emp.isActive ? "Active" : "Inactive"}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{editingEmployee ? "Edit employee" : "Add employee"}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 p-6 flex flex-col gap-5">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Full name</label>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="John Banda" required
                  className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Role</label>
                <select value={form.role} onChange={(e) => set("role", e.target.value)}
                  className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white">
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Pay rate (MWK)</label>
                  <input type="number" step="1" min="0" value={form.payRate} onChange={(e) => set("payRate", e.target.value)} placeholder="0" required
                    className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Per</label>
                  <select value={form.payRateUnit} onChange={(e) => set("payRateUnit", e.target.value)}
                    className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white">
                    {PAY_UNITS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Phone (optional)</label>
                <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+265 999 000 000"
                  className="w-full h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#3d8c47] text-slate-900 dark:text-white" />
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">{error}</p>}
              <div className="flex gap-3 mt-auto pt-4">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 h-12 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 h-12 bg-[#1a3d1f] text-white text-sm font-bold rounded-xl hover:bg-[#2d5c35] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Check size={15} /> {editingEmployee ? "Update" : "Add employee"}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

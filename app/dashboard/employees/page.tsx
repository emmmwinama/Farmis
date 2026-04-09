"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, X, Check, Phone } from "lucide-react";

const ROLES = [
    "Field Worker", "Supervisor", "Tractor Operator",
    "Irrigation Technician", "Driver", "Manager", "Other",
];

const PAY_RATE_UNITS = ["Per Day", "Per Hour"];

const emptyForm = {
    name: "", role: "Field Worker", payRate: "",
    payRateUnit: "Per Day", phone: "", isActive: true,
};

function fmt(n: number) {
    return new Intl.NumberFormat("en-MW").format(Math.round(n));
}

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<any>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [filterActive, setFilterActive] = useState("All");

    const load = () => {
        setLoading(true);
        fetch("/api/employees")
            .then((r) => r.json())
            .then((d) => { setEmployees(d); setLoading(false); });
    };

    useEffect(() => { load(); }, []);

    const openAdd = () => {
        setEditingEmployee(null);
        setForm(emptyForm);
        setError("");
        setShowForm(true);
    };

    const openEdit = (emp: any) => {
        setEditingEmployee(emp);
        setForm({
            name: emp.name,
            role: emp.role,
            payRate: emp.payRate.toString(),
            payRateUnit: emp.payRateUnit,
            phone: emp.phone ?? "",
            isActive: emp.isActive,
        });
        setError("");
        setShowForm(true);
    };

    const closeForm = () => { setShowForm(false); setEditingEmployee(null); };
    const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        const url = editingEmployee ? `/api/employees/${editingEmployee.id}` : "/api/employees";
        const method = editingEmployee ? "PATCH" : "POST";

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });

        const data = await res.json();
        if (!res.ok) {
            setError(data.error);
            setSaving(false);
        } else {
            closeForm();
            load();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this employee?")) return;
        setDeletingId(id);
        await fetch(`/api/employees/${id}`, { method: "DELETE" });
        setDeletingId(null);
        load();
    };

    const filtered = employees.filter((e) => {
        if (filterActive === "Active") return e.isActive;
        if (filterActive === "Inactive") return !e.isActive;
        return true;
    });

    const activeCount = employees.filter((e) => e.isActive).length;

    return (
        <div className="p-8 max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-medium text-slate-900">Employees</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {activeCount} active &mdash; {employees.length} total
                    </p>
                </div>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 h-10 px-4 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
                >
                    <Plus size={16} /> Add employee
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                    { label: "Total employees", value: employees.length },
                    { label: "Active", value: activeCount },
                    { label: "Inactive", value: employees.length - activeCount },
                ].map(({ label, value }) => (
                    <div key={label} className="bg-white border border-slate-200 rounded-2xl p-5">
                        <p className="text-xs uppercase tracking-wide text-slate-400 font-medium mb-2">{label}</p>
                        <p className="text-2xl font-medium text-slate-900">{value}</p>
                    </div>
                ))}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-6">
                {["All", "Active", "Inactive"].map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilterActive(s)}
                        className={`h-8 px-4 rounded-xl text-sm font-medium transition-colors ${
                            filterActive === s
                                ? "bg-slate-900 text-white"
                                : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {/* Employees list */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={24} className="animate-spin text-slate-400" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
                    <p className="text-4xl mb-4">👷</p>
                    <p className="text-slate-900 font-medium mb-1">No employees yet</p>
                    <p className="text-slate-400 text-sm mb-6">Add employees to assign them to farm activities</p>
                    <button
                        onClick={openAdd}
                        className="inline-flex items-center gap-2 h-10 px-5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
                    >
                        <Plus size={16} /> Add employee
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((emp) => (
                        <div
                            key={emp.id}
                            className={`bg-white border rounded-2xl p-5 transition-colors ${
                                emp.isActive ? "border-slate-200 hover:border-slate-300" : "border-slate-100 opacity-60"
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-700 flex-shrink-0">
                                        {emp.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-slate-900">{emp.name}</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">{emp.role}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
                      emp.isActive ? "bg-green-50 text-green-800" : "bg-slate-100 text-slate-500"
                  }`}>
                    {emp.isActive ? "Active" : "Inactive"}
                  </span>
                                    <button
                                        onClick={() => openEdit(emp)}
                                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(emp.id)}
                                        disabled={deletingId === emp.id}
                                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                                    >
                                        {deletingId === emp.id
                                            ? <Loader2 size={14} className="animate-spin" />
                                            : <Trash2 size={14} />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <div className="bg-slate-50 rounded-xl p-3">
                                    <p className="text-xs text-slate-400 mb-1">Pay rate</p>
                                    <p className="text-sm font-medium text-slate-900">
                                        MWK {fmt(emp.payRate)} <span className="text-xs text-slate-400 font-normal">/ {emp.payRateUnit === "Per Day" ? "day" : "hour"}</span>
                                    </p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-3">
                                    <p className="text-xs text-slate-400 mb-1">Phone</p>
                                    <p className="text-sm font-medium text-slate-900">
                                        {emp.phone || <span className="text-slate-300">Not set</span>}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Slide-over form */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/20" onClick={closeForm} />
                    <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-xl flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h2 className="text-base font-medium text-slate-900">
                                {editingEmployee ? "Edit employee" : "Add employee"}
                            </h2>
                            <button onClick={closeForm} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 p-6 flex flex-col gap-5">

                            <div>
                                <label className="text-sm text-slate-500 mb-1.5 block">Full name</label>
                                <input
                                    value={form.name}
                                    onChange={(e) => set("name", e.target.value)}
                                    placeholder="e.g. John Banda"
                                    required
                                    className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-slate-500 mb-1.5 block">Role</label>
                                <select
                                    value={form.role}
                                    onChange={(e) => set("role", e.target.value)}
                                    className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 transition-colors"
                                >
                                    {ROLES.map((r) => <option key={r}>{r}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-slate-500 mb-1.5 block">Pay rate (MWK)</label>
                                    <input
                                        type="number" step="1" min="0"
                                        value={form.payRate}
                                        onChange={(e) => set("payRate", e.target.value)}
                                        placeholder="0"
                                        required
                                        className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-500 mb-1.5 block">Per</label>
                                    <select
                                        value={form.payRateUnit}
                                        onChange={(e) => set("payRateUnit", e.target.value)}
                                        className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 transition-colors"
                                    >
                                        {PAY_RATE_UNITS.map((u) => <option key={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-slate-500 mb-1.5 block">
                                    Phone <span className="text-slate-300">(optional)</span>
                                </label>
                                <input
                                    value={form.phone}
                                    onChange={(e) => set("phone", e.target.value)}
                                    placeholder="+265 999 000 000"
                                    className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 transition-colors"
                                />
                            </div>

                            {editingEmployee && (
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">Active status</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Inactive employees won&apos;t appear in activity forms</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => set("isActive", !form.isActive)}
                                        className={`w-11 h-6 rounded-full transition-colors relative ${
                                            form.isActive ? "bg-slate-900" : "bg-slate-200"
                                        }`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                                            form.isActive ? "translate-x-6" : "translate-x-1"
                                        }`} />
                                    </button>
                                </div>
                            )}

                            {error && (
                                <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
                            )}

                            <div className="flex gap-3 mt-auto pt-4">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="flex-1 h-12 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 h-12 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving
                                        ? <><Loader2 size={15} className="animate-spin" /> Saving...</>
                                        : <><Check size={15} /> {editingEmployee ? "Update" : "Save employee"}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
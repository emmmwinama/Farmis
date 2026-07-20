"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, Eye, FileText, Loader2, Plus, ReceiptText, ShieldCheck, Trash2, Upload, X } from "lucide-react";

const TYPES = [
  { key: "receipt", label: "Receipts", icon: ReceiptText },
  { key: "field_photo", label: "Field photos", icon: Camera },
  { key: "vet_record", label: "Vet records", icon: ShieldCheck },
  { key: "buyer_contract", label: "Buyer contracts", icon: FileText },
  { key: "loan_document", label: "Loan documents", icon: FileText },
  { key: "insurance_evidence", label: "Insurance evidence", icon: ShieldCheck },
  { key: "other", label: "Other", icon: FileText },
];

const emptyForm = {
  name: "",
  type: "receipt",
  notes: "",
  linkedType: "",
  linkedTo: "",
  url: "",
  size: 0,
};
const ALLOWED_FILE_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [previewDocument, setPreviewDocument] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/documents");
    const data = await res.json();
    setDocuments(data.documents ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => filter === "all" ? documents : documents.filter((document) => document.type === filter),
    [documents, filter],
  );

  async function selectFile(file?: File) {
    if (!file) return;
    if (!ALLOWED_FILE_TYPES.has(file.type)) {
      setError("Only PDF, Word documents, JPG, PNG, and WebP images can be uploaded.");
      return;
    }
    setError("");
    const url = await readFileAsDataUrl(file);
    setForm((current) => ({
      ...current,
      name: current.name || file.name,
      url,
      size: file.size,
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to save document");
      setSaving(false);
      return;
    }
    setForm(emptyForm);
    setShowForm(false);
    setSaving(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Remove this document from AgriVault?")) return;
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="page-header flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Documents and evidence</h1>
          <p className="page-subtitle">Store receipts, photos, contracts, loan files, insurance proof, and vet records.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary min-h-11">
          <Plus size={16} /> Add evidence
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
        <button onClick={() => setFilter("all")}
                className="min-h-14 rounded-2xl px-4 text-sm font-bold"
                style={{ background: filter === "all" ? "#0284C7" : "var(--bg-card)", color: filter === "all" ? "white" : "var(--text-secondary)", border: "1px solid var(--border)" }}>
          All ({documents.length})
        </button>
        {TYPES.map((type) => {
          const Icon = type.icon;
          const count = documents.filter((document) => document.type === type.key).length;
          return (
            <button key={type.key} onClick={() => setFilter(type.key)}
                    className="min-h-14 rounded-2xl px-4 flex items-center gap-2 text-sm font-bold"
                    style={{ background: filter === type.key ? "#0284C7" : "var(--bg-card)", color: filter === type.key ? "white" : "var(--text-secondary)", border: "1px solid var(--border)" }}>
              <Icon size={16} />
              <span className="truncate">{type.label} ({count})</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <Upload size={28} className="mx-auto mb-3" style={{ color: "var(--text-hint)" }} />
          <p className="text-sm font-bold" style={{ color: "var(--text-secondary)" }}>No evidence saved yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Add receipts, field photos, loan documents, contracts, and audit evidence here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((document) => (
            <div key={document.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-black truncate" style={{ color: "var(--text-primary)" }}>{document.name}</p>
                  <p className="text-xs mt-1 capitalize" style={{ color: "var(--text-muted)" }}>{document.type.replace(/_/g, " ")}</p>
                </div>
                <button onClick={() => remove(document.id)} className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "#FEF2F2", color: "#DC2626" }}>
                  <Trash2 size={15} />
                </button>
              </div>
              {document.url?.startsWith("data:image") ? (
                <img src={`/api/documents/${document.id}/file`} alt={document.name} className="mt-4 w-full aspect-video object-cover rounded-2xl" />
              ) : document.url?.startsWith("data:application/pdf") ? (
                <button onClick={() => setPreviewDocument(document)} className="btn-secondary min-h-11 mt-4 w-full">
                  <Eye size={16} /> Preview PDF
                </button>
              ) : (
                <a href={`/api/documents/${document.id}/file`} target="_blank" rel="noopener noreferrer" className="btn-secondary min-h-11 mt-4 w-full">
                  <FileText size={16} /> Open document
                </a>
              )}
              {document.notes && <p className="text-sm mt-4" style={{ color: "var(--text-muted)" }}>{document.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
          <form onSubmit={submit} className="card p-6 w-full max-w-xl">
            <h2 className="section-title mb-5">Add evidence</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Document name" required className="input md:col-span-2 min-h-12" />
              <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} className="input min-h-12">
                {TYPES.map((type) => <option key={type.key} value={type.key}>{type.label}</option>)}
              </select>
              <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf,.doc,.docx" onChange={(e) => selectFile(e.target.files?.[0])} className="input min-h-12" />
              <input value={form.url.startsWith("data:") ? "" : form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} placeholder="Or paste file/link URL" className="input md:col-span-2 min-h-12" />
              <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Notes" className="input md:col-span-2 min-h-24 p-4" />
            </div>
            {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary min-h-11">Cancel</button>
              <button disabled={saving} className="btn-primary min-h-11">{saving ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Save</button>
            </div>
          </form>
        </div>
      )}
      {previewDocument && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl h-[86vh] rounded-3xl overflow-hidden flex flex-col" style={{ background: "var(--bg-card)" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="min-w-0">
                <p className="text-sm font-black truncate" style={{ color: "var(--text-primary)" }}>{previewDocument.name}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>PDF preview</p>
              </div>
              <button onClick={() => setPreviewDocument(null)} className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "var(--bg-subtle)", color: "var(--text-muted)" }}>
                <X size={16} />
              </button>
            </div>
            <iframe src={`/api/documents/${previewDocument.id}/file`} title={previewDocument.name} className="flex-1 w-full" />
          </div>
        </div>
      )}
    </div>
  );
}

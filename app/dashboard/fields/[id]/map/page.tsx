"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

// ── Load Leaflet component client-side only ────────────────────────────────
const FieldMapComponent = dynamic(
    () => import("@/components/FieldMapComponent"),
    {
        ssr:     false,
        loading: () => (
            <div className="flex-1 flex items-center justify-center"
                 style={{ background: "#f0f4f0" }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="text-4xl">🗺️</div>
                    <Loader2 size={20} className="animate-spin" style={{ color: "#1a3d1f" }} />
                    <p className="text-sm font-semibold" style={{ color: "#666" }}>
                        Loading map...
                    </p>
                </div>
            </div>
        ),
    }
);

export default function FieldMapPage({
                                         params,
                                     }: {
    params: { id: string };
}) {
    const { id } = params;

    const [field,      setField]      = useState<any>(null);
    const [boundary,   setBoundary]   = useState<any>(null);
    const [zones,      setZones]      = useState<any[]>([]);
    const [markers,    setMarkers]    = useState<any[]>([]);
    const [cropFields, setCropFields] = useState<any[]>([]);
    const [loading,    setLoading]    = useState(true);

    const loadData = useCallback(async () => {
        try {
            const [fieldRes, boundaryRes, zonesRes, markersRes, cropsRes] =
                await Promise.all([
                    fetch(`/api/fields/${id}`).then((r) => r.json()),
                    fetch(`/api/fields/${id}/boundary`).then((r) => r.json()),
                    fetch(`/api/fields/${id}/zones`).then((r) => r.json()),
                    fetch("/api/markers").then((r) => r.json()),
                    fetch("/api/crops").then((r) => r.json()),
                ]);

            setField(fieldRes ?? null);
            setBoundary(boundaryRes ?? null);
            setZones(Array.isArray(zonesRes) ? zonesRes : []);
            setMarkers(
                Array.isArray(markersRes)
                    ? markersRes.filter((m: any) => m.fieldId === id)
                    : []
            );
            setCropFields(
                Array.isArray(cropsRes)
                    ? cropsRes.filter((c: any) => c.fieldId === id)
                    : []
            );
        } catch (err) {
            console.error("Failed to load map data:", err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return (
        <div className="flex flex-col h-screen overflow-hidden"
             style={{ background: "var(--bg-page)" }}>

            {/* Header */}
            <div
                className="flex items-center justify-between px-6 h-14 flex-shrink-0 z-10"
                style={{
                    background:   "var(--bg-card)",
                    borderBottom: "1px solid var(--border)",
                    boxShadow:    "0 1px 3px rgba(28,25,23,0.06)",
                }}>
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/fields"
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{
                            background: "var(--bg-subtle)",
                            border:     "1px solid var(--border)",
                            color:      "var(--text-muted)",
                        }}>
                        <ArrowLeft size={16} />
                    </Link>
                    <div>
                        <p
                            className="text-sm font-extrabold"
                            style={{ color: "var(--text-primary)" }}>
                            {field?.name ?? "Loading..."} — Field Map
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {boundary
                                ? `${boundary.areaHa?.toFixed(4) ?? "—"} ha mapped`
                                : "Boundary not drawn yet · Click 'Draw boundary' to start"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Live map
                </div>
            </div>

            {/* Map area */}
            {loading ? (
                <div
                    className="flex-1 flex items-center justify-center"
                    style={{ background: "#f0f4f0" }}>
                    <div className="flex flex-col items-center gap-3">
                        <div className="text-4xl">🗺️</div>
                        <Loader2
                            size={20}
                            className="animate-spin"
                            style={{ color: "#1a3d1f" }}
                        />
                        <p className="text-sm font-semibold" style={{ color: "#666" }}>
                            Loading field data...
                        </p>
                    </div>
                </div>
            ) : (
                <FieldMapComponent
                    fieldId={id}
                    field={field}
                    boundary={boundary}
                    zones={zones}
                    markers={markers}
                    cropFields={cropFields}
                    onDataChange={loadData}
                />
            )}
        </div>
    );
}
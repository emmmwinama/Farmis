"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, Layers, Map } from "lucide-react";
import Link from "next/link";

function FarmMapInner({ data }: { data: any }) {
    const mapRef      = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const [selectedField, setSelectedField] = useState<any>(null);
    const [showSatellite, setShowSatellite] = useState(false);
    const [mapReady,      setMapReady]      = useState(false);

    const FIELD_COLORS = [
        "#16A34A", "#2563EB", "#D97706", "#9333EA",
        "#DC2626", "#0891B2", "#EA580C", "#65A30D",
    ];

    function fmtHa(ha: number | null | undefined) {
        if (!ha) return "—";
        return `${ha.toFixed(2)} ha`;
    }

    useEffect(() => {
        if (!mapRef.current) return;

        // Clear stale Leaflet instance — fixes "already initialized" in React strict mode
        const container = mapRef.current as any;
        if (container._leaflet_id) container._leaflet_id = null;

        if (mapInstance.current) return;

        const init = async () => {
            const L = (await import("leaflet")).default;
            await import("leaflet/dist/leaflet.css");

            if (!mapRef.current) return;

            // Clear again after async gap (strict mode may have run cleanup)
            const c = mapRef.current as any;
            if (c._leaflet_id) c._leaflet_id = null;

            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
                iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
                shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
            });

            const map = L.map(mapRef.current, { center: [-13.9626, 33.7741], zoom: 13 });

            const osm = L.tileLayer(
                "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                { attribution: "© OpenStreetMap contributors", maxZoom: 22 }
            ).addTo(map);

            const sat = L.tileLayer(
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                { attribution: "Tiles © Esri", maxZoom: 19 }
            );

            mapInstance.current = { map, L, osm, sat, layers: [] };
            setMapReady(true);
        };

        init();

        return () => {
            if (mapInstance.current?.map) {
                mapInstance.current.map.remove();
                mapInstance.current = null;
            }
            if (mapRef.current) {
                (mapRef.current as any)._leaflet_id = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!mapReady || !data || !mapInstance.current) return;
        const { map, L, layers } = mapInstance.current;

        layers.forEach((l: any) => { try { map.removeLayer(l); } catch {} });
        mapInstance.current.layers = [];

        const allBounds: any[] = [];

        (data.fields ?? []).forEach((field: any, idx: number) => {
            const color = FIELD_COLORS[idx % FIELD_COLORS.length];

            if (field.boundary?.geoJson) {
                const poly = L.geoJSON(field.boundary.geoJson, {
                    style: { color, weight: 3, opacity: 1, fillColor: color, fillOpacity: 0.15, dashArray: "6,3" },
                })
                    .bindPopup(`
                        <div style="font-family:system-ui;min-width:180px;padding:4px">
                            <p style="font-weight:800;font-size:14px;margin:0 0 4px">${field.name}</p>
                            <p style="color:#666;font-size:12px;margin:0 0 8px">${fmtHa(field.boundary.areaHa)} · ${field.soilType ?? "—"}</p>
                            ${(field.activeCrops ?? []).map((c: any) =>
                        `<span style="display:inline-block;background:#EBF5EC;color:#14532D;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700;margin:2px">${c.cropName}</span>`
                    ).join("")}
                            <br/><a href="/dashboard/fields/${field.id}/map" style="display:inline-block;margin-top:8px;color:#1a3d1f;font-weight:700;font-size:11px">Open field map →</a>
                        </div>
                    `)
                    .on("click", () => setSelectedField(field))
                    .addTo(map);

                mapInstance.current.layers.push(poly);
                const bounds = poly.getBounds();
                if (bounds.isValid()) allBounds.push(bounds);

                // Field name label at centroid
                if (field.boundary.centroidLat && field.boundary.centroidLng) {
                    const label = L.marker(
                        [field.boundary.centroidLat, field.boundary.centroidLng],
                        {
                            icon: L.divIcon({
                                html: `<div style="background:white;color:#1a3d1f;font-weight:800;font-size:11px;padding:3px 8px;border-radius:8px;border:1.5px solid ${color};box-shadow:0 2px 6px rgba(0,0,0,0.15);white-space:nowrap;pointer-events:none">${field.name}</div>`,
                                className: "", iconAnchor: [0, 0],
                            }),
                        }
                    ).addTo(map);
                    mapInstance.current.layers.push(label);
                }

                // Zone overlays
                (field.boundary.zones ?? []).forEach((zone: any) => {
                    if (!zone.geoJson) return;
                    const zl = L.geoJSON(zone.geoJson, {
                        style: { color: zone.colour || color, weight: 1.5, fillColor: zone.colour || color, fillOpacity: 0.3 },
                    }).bindTooltip(`${zone.name} · ${fmtHa(zone.areaHa)}`, { sticky: true }).addTo(map);
                    mapInstance.current.layers.push(zl);
                });
            }
        });

        // Markers
        (data.markers ?? []).forEach((m: any) => {
            const icon = L.divIcon({
                html: `<div style="width:26px;height:26px;background:#1a3d1f;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,0.3)">📍</div>`,
                className: "", iconSize: [26, 26], iconAnchor: [13, 13],
            });
            const mk = L.marker([m.lat, m.lng], { icon })
                .bindPopup(`<strong>${m.label}</strong><br/>${m.type}`)
                .addTo(map);
            mapInstance.current.layers.push(mk);
        });

        if (allBounds.length > 0) {
            try {
                const combined = allBounds.reduce((acc, b) => acc.extend(b));
                map.fitBounds(combined, { padding: [50, 50] });
            } catch {}
        }
    }, [mapReady, data]);

    const toggleSatellite = () => {
        if (!mapInstance.current) return;
        const { map, osm, sat } = mapInstance.current;
        if (showSatellite) { map.removeLayer(sat); osm.addTo(map); }
        else               { map.removeLayer(osm); sat.addTo(map); }
        setShowSatellite((p) => !p);
    };

    const mappedFields   = (data?.fields ?? []).filter((f: any) =>  f.boundary);
    const unmappedFields = (data?.fields ?? []).filter((f: any) => !f.boundary);

    return (
        <div className="flex flex-1 min-h-0">
            {/* Map */}
            <div className="flex-1 relative">
                <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

                {/* Satellite toggle */}
                <div className="absolute top-4 left-4 z-[1000]">
                    <button onClick={toggleSatellite}
                            className="flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-bold shadow-lg"
                            style={{
                                background: showSatellite ? "#0891B2" : "white",
                                color:      showSatellite ? "white"   : "#475569",
                                border:     `1.5px solid ${showSatellite ? "#0891B2" : "#E2E8F0"}`,
                            }}>
                        <Layers size={13} />
                        {showSatellite ? "Street view" : "Satellite"}
                    </button>
                </div>

                {/* Unmapped notice */}
                {unmappedFields.length > 0 && (
                    <div className="absolute bottom-6 left-4 z-[1000] rounded-2xl p-4"
                         style={{ background: "white", border: "1px solid #E2E8F0", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", maxWidth: "260px" }}>
                        <p className="text-xs font-extrabold mb-2" style={{ color: "#64748B" }}>
                            📍 {unmappedFields.length} field{unmappedFields.length !== 1 ? "s" : ""} not yet mapped
                        </p>
                        <div className="flex flex-col gap-1.5">
                            {unmappedFields.map((f: any) => (
                                <Link key={f.id} href={`/dashboard/fields/${f.id}/map`}
                                      className="text-xs font-bold flex items-center gap-2 py-1.5 px-2.5 rounded-xl"
                                      style={{ background: "#F0FDF4", color: "#16A34A" }}>
                                    <Map size={11} /> {f.name} — Draw boundary →
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* No fields */}
                {(data?.fields ?? []).length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center z-[1000]">
                        <div className="rounded-2xl p-8 text-center"
                             style={{ background: "white", border: "1px solid #E2E8F0" }}>
                            <p className="text-4xl mb-3">🗺️</p>
                            <p className="font-bold mb-1" style={{ color: "#0F172A" }}>No fields yet</p>
                            <p className="text-sm mb-4" style={{ color: "#94A3B8" }}>Add fields to your farm first</p>
                            <Link href="/dashboard/fields"
                                  className="text-sm font-bold px-4 py-2 rounded-xl text-white inline-block"
                                  style={{ background: "#1a3d1f" }}>
                                Go to Fields →
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Sidebar */}
            <div className="w-72 flex-shrink-0 flex flex-col overflow-hidden"
                 style={{ background: "var(--bg-card)", borderLeft: "1px solid var(--border)" }}>
                <div className="px-5 py-4 flex-shrink-0"
                     style={{ borderBottom: "1px solid var(--border)" }}>
                    <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>All Fields</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {mappedFields.length} mapped · {unmappedFields.length} unmapped
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3 p-4 flex-shrink-0"
                     style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="rounded-xl p-3" style={{ background: "var(--farm-pale)" }}>
                        <p className="text-[10px] font-black uppercase tracking-wider mb-1"
                           style={{ color: "var(--farm-green)" }}>Mapped area</p>
                        <p className="text-lg font-black" style={{ color: "var(--farm-green)" }}>
                            {fmtHa(data?.stats?.totalMappedHa)}
                        </p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: "var(--bg-subtle)" }}>
                        <p className="text-[10px] font-black uppercase tracking-wider mb-1"
                           style={{ color: "var(--text-muted)" }}>Total fields</p>
                        <p className="text-lg font-black" style={{ color: "var(--text-primary)" }}>
                            {data?.stats?.totalFields ?? 0}
                        </p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                    {(data?.fields ?? []).map((field: any, idx: number) => {
                        const color    = FIELD_COLORS[idx % FIELD_COLORS.length];
                        const isSel    = selectedField?.id === field.id;
                        const isMapped = !!field.boundary;
                        return (
                            <div key={field.id}
                                 onClick={() => setSelectedField(isSel ? null : field)}
                                 className="rounded-xl p-3.5 cursor-pointer transition-all"
                                 style={{
                                     background: isSel ? `${color}12` : "var(--bg-subtle)",
                                     border:     `1.5px solid ${isSel ? color : "var(--border)"}`,
                                 }}>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full flex-shrink-0"
                                             style={{ background: isMapped ? color : "#CBD5E1" }} />
                                        <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                                            {field.name}
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                                          style={{
                                              background: isMapped ? "#ECFDF5" : "#F1F5F9",
                                              color:      isMapped ? "#059669" : "#64748B",
                                          }}>
                                        {isMapped ? "Mapped" : "No boundary"}
                                    </span>
                                </div>
                                <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                                    {isMapped ? fmtHa(field.boundary.areaHa) : `${field.totalArea} ha (record)`}
                                    {field.soilType ? ` · ${field.soilType}` : ""}
                                </p>
                                {(field.activeCrops ?? []).length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {field.activeCrops.map((c: any) => (
                                            <span key={c.id}
                                                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                  style={{ background: "var(--farm-pale)", color: "var(--farm-green)" }}>
                                                {c.cropName}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <Link href={`/dashboard/fields/${field.id}/map`}
                                      className="flex items-center gap-1.5 text-[11px] font-bold"
                                      style={{ color: isMapped ? color : "var(--farm-green)" }}
                                      onClick={(e) => e.stopPropagation()}>
                                    <Map size={11} />
                                    {isMapped ? "Edit map" : "Draw boundary"} →
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

const FarmMapDynamic = dynamic(
    () => Promise.resolve(FarmMapInner),
    {
        ssr: false,
        loading: () => (
            <div className="flex-1 flex items-center justify-center" style={{ background: "#f0f4f0" }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="text-4xl">🗺️</div>
                    <Loader2 size={20} className="animate-spin" style={{ color: "#1a3d1f" }} />
                    <p className="text-sm font-semibold" style={{ color: "#666" }}>Loading map...</p>
                </div>
            </div>
        ),
    }
);

export default function FarmMapPage() {
    const [data,    setData]    = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState("");

    useEffect(() => {
        fetch("/api/farm-map")
            .then(async (r) => {
                const text = await r.text();
                if (!text) { setError("Empty response"); setLoading(false); return; }
                try {
                    const d = JSON.parse(text);
                    if (d.error) setError(d.error);
                    else         setData(d);
                } catch { setError("Failed to parse response"); }
                finally  { setLoading(false); }
            })
            .catch((err) => { setError(err.message); setLoading(false); });
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-screen" style={{ background: "var(--bg-page)" }}>
            <div className="flex flex-col items-center gap-3">
                <div className="text-4xl">🗺️</div>
                <Loader2 size={20} className="animate-spin" style={{ color: "#1a3d1f" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>Loading farm map...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center h-screen" style={{ background: "var(--bg-page)" }}>
            <div className="rounded-2xl p-8 text-center" style={{ background: "white", border: "1px solid #E2E8F0" }}>
                <p className="text-4xl mb-3">⚠️</p>
                <p className="font-bold mb-1" style={{ color: "#0F172A" }}>Could not load map</p>
                <p className="text-sm mb-4" style={{ color: "#94A3B8" }}>{error}</p>
                <button onClick={() => window.location.reload()}
                        className="text-sm font-bold px-4 py-2 rounded-xl text-white"
                        style={{ background: "#1a3d1f" }}>
                    Retry
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg-page)" }}>
            <div className="flex items-center justify-between px-8 h-14 flex-shrink-0"
                 style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(28,25,23,0.06)" }}>
                <div>
                    <p className="text-base font-extrabold" style={{ color: "var(--text-primary)" }}>
                        {data?.farm?.name ?? "Farm"} — Overview Map
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {data?.stats?.fieldsMapped ?? 0} of {data?.stats?.totalFields ?? 0} fields mapped
                        {data?.stats?.totalMappedHa > 0 && ` · ${data.stats.totalMappedHa.toFixed(2)} ha total`}
                    </p>
                </div>
                <Link href="/dashboard/fields"
                      className="flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-bold"
                      style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                    <Map size={13} /> All fields
                </Link>
            </div>
            <FarmMapDynamic data={data} />
        </div>
    );
}
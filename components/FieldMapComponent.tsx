"use client";

import { useEffect, useRef, useState } from "react";
import {
    Plus, Layers, MapPin, Ruler, Loader2, Check, X, AlertTriangle,
} from "lucide-react";

const ZONE_COLORS = [
    "#16A34A", "#2563EB", "#0284C7", "#DC2626",
    "#9333EA", "#0891B2", "#EA580C", "#65A30D",
];

const ZONE_TYPES = [
    { value: "crop",           label: "Crop zone",      icon: "CR" },
    { value: "soil_good",      label: "Good soil",      icon: "SG" },
    { value: "soil_poor",      label: "Poor drainage",  icon: "DR" },
    { value: "soil_rocky",     label: "Rocky area",     icon: "RK" },
    { value: "infrastructure", label: "Infrastructure", icon: "IN" },
    { value: "empty",          label: "Unplanted",      icon: "UP" },
];

const MARKER_TYPES = [
    { value: "borehole",   label: "Borehole",     icon: "BH" },
    { value: "irrigation", label: "Irrigation",   icon: "IR" },
    { value: "shed",       label: "Storage shed", icon: "SH" },
    { value: "road",       label: "Road/path",    icon: "RD" },
    { value: "gate",       label: "Gate",         icon: "GT" },
    { value: "tree",       label: "Tree/shade",   icon: "TR" },
    { value: "other",      label: "Other",        icon: "MK" },
];

function fmtHa(ha: number | null | undefined) {
    if (!ha || ha === 0) return "-";
    if (ha < 0.01) return `${Math.round(ha * 10000)} sqm`;
    return `${ha.toFixed(4)} ha`;
}

function fmtAc(ha: number | null | undefined) {
    if (!ha || ha === 0) return "";
    return `(${(ha * 2.471).toFixed(3)} ac)`;
}

function calcAreaHa(coordinates: number[][]): number {
    if (coordinates.length < 3) return 0;
    const R = 6371000;
    let area = 0;
    const n = coordinates.length;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const lat1 = (coordinates[i][1] * Math.PI) / 180;
        const lat2 = (coordinates[j][1] * Math.PI) / 180;
        const lng1 = (coordinates[i][0] * Math.PI) / 180;
        const lng2 = (coordinates[j][0] * Math.PI) / 180;
        area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }
    return Math.abs((area * R * R) / 2) / 10000;
}

interface Props {
    fieldId:     string;
    field:       any;
    boundary:    any;
    zones:       any[];
    markers:     any[];
    cropFields:  any[];
    onDataChange: () => void;
}

export default function FieldMapComponent({
                                              fieldId, field, boundary, zones = [], markers = [], cropFields = [], onDataChange,
                                          }: Props) {
    const mapRef      = useRef<HTMLDivElement>(null);
    const mapObj      = useRef<any>(null);
    const leafletRef  = useRef<any>(null);
    const drawnItems  = useRef<any>(null);
    const boundaryGrp = useRef<any>(null);
    const zonesGrp    = useRef<any>(null);
    const markersGrp  = useRef<any>(null);

    const [mode,        setMode]        = useState<"view"|"draw_boundary"|"draw_zone"|"add_marker"|"measure">("view");
    const [saving,      setSaving]      = useState(false);
    const [error,       setError]       = useState("");
    const [measureArea, setMeasureArea] = useState<number|null>(null);
    const [activeTab,   setActiveTab]   = useState<"zones"|"markers"|"info">("zones");
    const [satellite,   setSatellite]   = useState(false);
    const [osmLayer,    setOsmLayer]    = useState<any>(null);
    const [satLayer,    setSatLayer]    = useState<any>(null);

    const [showZoneForm,         setShowZoneForm]         = useState(false);
    const [showMarkerForm,       setShowMarkerForm]       = useState(false);
    const [pendingZoneGeo,       setPendingZoneGeo]       = useState<any>(null);
    const [pendingMarkerLatLng,  setPendingMarkerLatLng]  = useState<any>(null);

    const [zoneForm, setZoneForm] = useState({
        name: "", type: "crop", cropFieldId: "", colour: ZONE_COLORS[0], notes: "",
    });
    const [markerForm, setMarkerForm] = useState({
        type: "borehole", label: "", notes: "",
    });

    // -- Init Leaflet ----------------------------------------------------------
    useEffect(() => {
        if (!mapRef.current) return;

        // Clear any stale Leaflet instance on the DOM node (React strict mode)
        const container = mapRef.current as any;
        if (container._leaflet_id) {
            container._leaflet_id = null;
        }

        if (mapObj.current) return;

        let isMounted = true;

        (async () => {
            const L = (await import("leaflet")).default;
            await import("leaflet/dist/leaflet.css");

            if (!isMounted || !mapRef.current) return;

            // Ensure container is still clean
            const c = mapRef.current as any;
            if (c._leaflet_id) c._leaflet_id = null;

            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });

            const map = L.map(mapRef.current, {
                center:             [-13.9626, 33.7741],
                zoom:               15,
                zoomControl:        true,
                attributionControl: true,
            });

            const osm = L.tileLayer(
                "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                { attribution: "OpenStreetMap contributors", maxZoom: 22 }
            ).addTo(map);

            const sat = L.tileLayer(
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                { attribution: "Tiles Esri", maxZoom: 19 }
            );

            const bGrp = L.featureGroup().addTo(map);
            const zGrp = L.featureGroup().addTo(map);
            const mGrp = L.featureGroup().addTo(map);
            const dGrp = L.featureGroup().addTo(map);

            boundaryGrp.current = bGrp;
            zonesGrp.current    = zGrp;
            markersGrp.current  = mGrp;
            drawnItems.current  = dGrp;
            leafletRef.current  = L;
            mapObj.current      = map;

            setOsmLayer(osm);
            setSatLayer(sat);

            map.on("click", (e: any) => {
                if ((map as any).__mode === "add_marker") {
                    setPendingMarkerLatLng(e.latlng);
                    setMarkerForm({ type: "borehole", label: "", notes: "" });
                    setShowMarkerForm(true);
                }
            });

            renderAll(L, map, bGrp, zGrp, mGrp);
        })();

        return () => {
            isMounted = false;
            if (mapObj.current) {
                mapObj.current.remove();
                mapObj.current      = null;
                leafletRef.current  = null;
                boundaryGrp.current = null;
                zonesGrp.current    = null;
                markersGrp.current  = null;
                drawnItems.current  = null;
            }
            if (mapRef.current) {
                (mapRef.current as any)._leaflet_id = null;
            }
        };
    }, []);

    // -- Re-render when data changes -------------------------------------------
    useEffect(() => {
        if (!mapObj.current || !leafletRef.current) return;
        renderAll(
            leafletRef.current,
            mapObj.current,
            boundaryGrp.current,
            zonesGrp.current,
            markersGrp.current,
        );
    }, [boundary, zones, markers]);

    // -- Sync mode to map ------------------------------------------------------
    useEffect(() => {
        if (!mapObj.current) return;
        (mapObj.current as any).__mode = mode;
        mapObj.current.getContainer().style.cursor =
            mode === "add_marker" ? "crosshair" : "";
    }, [mode]);

    // -- Render all layers -----------------------------------------------------
    function renderAll(L: any, map: any, bGrp: any, zGrp: any, mGrp: any) {
        bGrp.clearLayers();
        zGrp.clearLayers();
        mGrp.clearLayers();

        if (boundary?.geoJson) {
            const poly = L.geoJSON(boundary.geoJson, {
                style: {
                    color: "#1a3d1f", weight: 3, opacity: 1,
                    fillColor: "#1a3d1f", fillOpacity: 0.06, dashArray: "8,4",
                },
            }).addTo(bGrp);
            const bounds = poly.getBounds();
            if (bounds.isValid()) map.fitBounds(bounds, { padding: [60, 60] });
        }

        zones.forEach((zone) => {
            const fill = zone.colour || "#16A34A";
            L.geoJSON(zone.geoJson, {
                style: { color: fill, weight: 2, opacity: 0.9, fillColor: fill, fillOpacity: 0.3 },
            })
                .bindTooltip(
                    `<b>${zone.name}</b><br/>${fmtHa(zone.areaHa)} ${fmtAc(zone.areaHa)}`,
                    { sticky: true }
                )
                .addTo(zGrp);
        });

        markers.forEach((m) => {
            const mt = MARKER_TYPES.find((t) => t.value === m.type);
            const icon = L.divIcon({
                html: `<div style="background:#1a3d1f;color:white;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:11px;font-weight:800;letter-spacing:0"><span style="transform:rotate(45deg)">${mt?.icon ?? "MK"}</span></div>`,
                className: "", iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -30],
            });
            L.marker([m.lat, m.lng], { icon })
                .bindPopup(`<b>${m.label}</b><br/>${mt?.label ?? m.type}${m.notes ? `<br/>${m.notes}` : ""}`)
                .addTo(mGrp);
        });
    }

    // -- Draw boundary ---------------------------------------------------------
    const startDrawBoundary = async () => {
        if (!mapObj.current || !leafletRef.current) return;
        const L   = leafletRef.current;
        const map = mapObj.current;
        setMode("draw_boundary");
        drawnItems.current?.clearLayers();
        try { await import("leaflet-draw"); await import("leaflet-draw/dist/leaflet.draw.css" as any); } catch {}
        const drawCtrl = new (L as any).Draw.Polygon(map, {
            shapeOptions: { color: "#1a3d1f", weight: 3, fillColor: "#1a3d1f", fillOpacity: 0.15 },
        });
        drawCtrl.enable();
        map.once("draw:created", async (e: any) => {
            drawnItems.current.addLayer(e.layer);
            const geoJson = e.layer.toGeoJSON();
            setSaving(true);
            try {
                const res = await fetch(`/api/fields/${fieldId}/boundary`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ geoJson }),
                });
                if (res.ok) onDataChange();
                else { const d = await res.json(); setError(d.error || "Failed to save boundary"); }
            } finally { setSaving(false); setMode("view"); }
        });
    };

    // -- Draw zone -------------------------------------------------------------
    const startDrawZone = async () => {
        if (!mapObj.current || !leafletRef.current) return;
        if (!boundary) { setError("Draw the field boundary first"); setTimeout(() => setError(""), 3000); return; }
        const L   = leafletRef.current;
        const map = mapObj.current;
        setMode("draw_zone");
        try { await import("leaflet-draw"); await import("leaflet-draw/dist/leaflet.draw.css" as any); } catch {}
        const drawCtrl = new (L as any).Draw.Polygon(map, {
            shapeOptions: { color: zoneForm.colour, weight: 2, fillColor: zoneForm.colour, fillOpacity: 0.35 },
        });
        drawCtrl.enable();
        map.once("draw:created", (e: any) => {
            setPendingZoneGeo(e.layer.toGeoJSON());
            setZoneForm({ name: "", type: "crop", cropFieldId: "", colour: ZONE_COLORS[zones.length % ZONE_COLORS.length], notes: "" });
            setShowZoneForm(true);
            setMode("view");
        });
    };

    // -- Measure ---------------------------------------------------------------
    const startMeasure = async () => {
        if (!mapObj.current || !leafletRef.current) return;
        const L   = leafletRef.current;
        const map = mapObj.current;
        setMode("measure");
        setMeasureArea(null);
        try { await import("leaflet-draw"); await import("leaflet-draw/dist/leaflet.draw.css" as any); } catch {}
        const drawCtrl = new (L as any).Draw.Polygon(map, {
            shapeOptions: { color: "#0284C7", weight: 2, fillColor: "#0284C7", fillOpacity: 0.2 },
        });
        drawCtrl.enable();
        map.once("draw:created", (e: any) => {
            const coords: number[][] = e.layer.toGeoJSON().geometry.coordinates[0];
            setMeasureArea(calcAreaHa(coords));
            drawnItems.current.addLayer(e.layer);
            setMode("view");
        });
    };

    // -- Save zone -------------------------------------------------------------
    const saveZone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pendingZoneGeo) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/fields/${fieldId}/zones`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...zoneForm, geoJson: pendingZoneGeo }),
            });
            if (res.ok) { setShowZoneForm(false); setPendingZoneGeo(null); onDataChange(); }
        } finally { setSaving(false); }
    };

    // -- Save marker -----------------------------------------------------------
    const saveMarker = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pendingMarkerLatLng) return;
        setSaving(true);
        try {
            await fetch("/api/markers", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...markerForm, lat: pendingMarkerLatLng.lat, lng: pendingMarkerLatLng.lng, fieldId }),
            });
            setShowMarkerForm(false);
            setPendingMarkerLatLng(null);
            onDataChange();
        } finally { setSaving(false); }
    };

    const deleteBoundary = async () => {
        if (!confirm("Delete field boundary? All zones will also be deleted.")) return;
        await fetch(`/api/fields/${fieldId}/boundary`, { method: "DELETE" });
        onDataChange();
    };

    const deleteZone = async (zoneId: string) => {
        if (!confirm("Delete this zone?")) return;
        await fetch(`/api/fields/${fieldId}/zones/${zoneId}`, { method: "DELETE" });
        onDataChange();
    };

    const deleteMarker = async (markerId: string) => {
        if (!confirm("Delete this marker?")) return;
        await fetch(`/api/markers/${markerId}`, { method: "DELETE" });
        onDataChange();
    };

    const toggleSatellite = () => {
        if (!mapObj.current || !osmLayer || !satLayer) return;
        if (satellite) { mapObj.current.removeLayer(satLayer); osmLayer.addTo(mapObj.current); }
        else           { mapObj.current.removeLayer(osmLayer); satLayer.addTo(mapObj.current); }
        setSatellite((p) => !p);
    };

    // -- Render ----------------------------------------------------------------
    return (
        <div className="flex flex-1 min-h-0">

            {/* Map */}
            <div className="flex-1 relative">
                <div ref={mapRef} style={{ width: "100%", height: "100%", zIndex: 0 }} />

                {/* Mode banner */}
                {mode !== "view" && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] rounded-full px-5 py-2.5 text-sm font-bold text-white pointer-events-none"
                         style={{ background: "rgba(26,61,31,0.92)", backdropFilter: "blur(8px)", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}>
                        {mode === "draw_boundary" && "Click to draw boundary points - double-click to finish"}
                        {mode === "draw_zone"     && "Click to draw zone points - double-click to finish"}
                        {mode === "add_marker"    && "Click anywhere on the map to place marker"}
                        {mode === "measure"       && "Click to draw area - double-click to finish"}
                    </div>
                )}

                {/* Measure result */}
                {measureArea !== null && (
                    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000] rounded-2xl px-5 py-3 flex items-center gap-3"
                         style={{ background: "white", border: "1.5px solid #9333EA", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}>
                        <Ruler size={16} style={{ color: "#9333EA" }} />
                        <div>
                            <p className="text-sm font-extrabold" style={{ color: "#0F172A" }}>
                                {fmtHa(measureArea)} {fmtAc(measureArea)}
                            </p>
                            <p className="text-xs" style={{ color: "#64748B" }}>
                                {Math.round(measureArea * 10000).toLocaleString()} sqm
                            </p>
                        </div>
                        <button onClick={() => { setMeasureArea(null); drawnItems.current?.clearLayers(); }}
                                className="w-5 h-5 rounded-full flex items-center justify-center ml-1"
                                style={{ background: "#F1F5F9", color: "#64748B" }}>
                            <X size={11} />
                        </button>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="absolute top-4 right-4 z-[1000] rounded-xl px-4 py-3 flex items-center gap-2"
                         style={{ background: "#F0F9FF", border: "1.5px solid #BAE6FD" }}>
                        <AlertTriangle size={14} style={{ color: "#0284C7" }} />
                        <p className="text-sm font-semibold" style={{ color: "#075985" }}>{error}</p>
                    </div>
                )}

                {/* Layer + satellite toggle */}
                <div className="absolute bottom-6 left-4 z-[1000] rounded-2xl p-3"
                     style={{ background: "white", border: "1px solid #E2E8F0", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
                    <p className="text-[9px] font-black uppercase tracking-widest px-1 mb-1.5" style={{ color: "#94A3B8" }}>
                        Layers
                    </p>
                    <button onClick={toggleSatellite}
                            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs font-bold"
                            style={{
                                background: satellite ? "#0891B215" : "transparent",
                                color:      satellite ? "#0891B2"   : "#64748B",
                            }}>
                        <Layers size={12} />
                        {satellite ? "Street view" : "Satellite"}
                    </button>
                </div>

                {/* Toolbar */}
                <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
                    <button onClick={startDrawBoundary} disabled={mode !== "view" || saving}
                            className="flex items-center gap-2 h-9 px-3 rounded-xl text-xs font-bold disabled:opacity-40"
                            style={{ background: "white", color: "#1a3d1f", border: "1.5px solid #1a3d1f", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                        <Layers size={13} />
                        {boundary ? "Redraw boundary" : "Draw boundary"}
                    </button>

                    <button onClick={startDrawZone} disabled={mode !== "view" || saving || !boundary}
                            className="flex items-center gap-2 h-9 px-3 rounded-xl text-xs font-bold disabled:opacity-40"
                            style={{ background: "white", color: "#2563EB", border: "1.5px solid #2563EB", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                        <Plus size={13} />
                        Add zone
                    </button>

                    <button onClick={() => setMode(mode === "add_marker" ? "view" : "add_marker")} disabled={saving}
                            className="flex items-center gap-2 h-9 px-3 rounded-xl text-xs font-bold disabled:opacity-40"
                            style={{
                                background: mode === "add_marker" ? "#0284C7" : "white",
                                color:      mode === "add_marker" ? "white"   : "#0284C7",
                                border: "1.5px solid #0284C7", boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            }}>
                        <MapPin size={13} />
                        {mode === "add_marker" ? "Click map..." : "Add marker"}
                    </button>

                    <button onClick={startMeasure} disabled={mode !== "view" && mode !== "measure"}
                            className="flex items-center gap-2 h-9 px-3 rounded-xl text-xs font-bold disabled:opacity-40"
                            style={{
                                background: mode === "measure" ? "#9333EA" : "white",
                                color:      mode === "measure" ? "white"   : "#9333EA",
                                border: "1.5px solid #9333EA", boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            }}>
                        <Ruler size={13} />
                        Measure area
                    </button>

                    {saving && (
                        <div className="flex items-center gap-2 h-9 px-3 rounded-xl text-xs font-bold"
                             style={{ background: "white", border: "1px solid #E2E8F0" }}>
                            <Loader2 size={13} className="animate-spin" style={{ color: "#1a3d1f" }} />
                            Saving...
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar */}
            <div className="w-80 flex-shrink-0 flex flex-col overflow-hidden"
                 style={{ background: "var(--bg-card)", borderLeft: "1px solid var(--border)" }}>

                {/* Tabs */}
                <div className="flex flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
                    {[
                        { key: "zones"   as const, label: "Zones",   count: zones.length },
                        { key: "markers" as const, label: "Markers", count: markers.length },
                        { key: "info"    as const, label: "Info" },
                    ].map(({ key, label, count }) => (
                        <button key={key} onClick={() => setActiveTab(key)}
                                className="flex-1 py-3 text-xs font-bold transition-colors"
                                style={{
                                    color:        activeTab === key ? "var(--farm-green)" : "var(--text-muted)",
                                    borderBottom: activeTab === key ? "2px solid var(--farm-green)" : "2px solid transparent",
                                }}>
                            {label}
                            {count !== undefined && count > 0 && (
                                <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full"
                                      style={{ background: "var(--farm-pale)", color: "var(--farm-green)" }}>
                                    {count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto p-4">

                    {/* Zones tab */}
                    {activeTab === "zones" && (
                        <div className="flex flex-col gap-3">
                            {boundary ? (
                                <div className="rounded-xl p-4"
                                     style={{ background: "var(--farm-pale)", border: "1.5px solid #86EFAC" }}>
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-extrabold" style={{ color: "var(--farm-green)" }}>
                                            Field boundary
                                        </p>
                                        <button onClick={deleteBoundary}
                                                className="text-[10px] font-bold" style={{ color: "#DC2626" }}>
                                            Delete
                                        </button>
                                    </div>
                                    <p className="text-2xl font-black" style={{ color: "var(--farm-green)" }}>
                                        {fmtHa(boundary.areaHa)}
                                    </p>
                                    <p className="text-xs" style={{ color: "#166534" }}>
                                        {fmtAc(boundary.areaHa)}
                                        {boundary.areaHa ? `  -  ${Math.round(boundary.areaHa * 10000).toLocaleString()} sqm` : ""}
                                    </p>
                                    {boundary.centroidLat && (
                                        <p className="text-[10px] mt-0.5" style={{ color: "#166534", opacity: 0.7 }}>
                                            {boundary.centroidLat.toFixed(5)} deg, {boundary.centroidLng.toFixed(5)} deg
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-xl p-5 text-center"
                                     style={{ background: "var(--bg-subtle)", border: "1.5px dashed var(--border)" }}>
                                    <Layers size={28} className="mx-auto mb-2" style={{ color: "var(--text-hint)" }} />
                                    <p className="text-xs font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                                        No boundary drawn
                                    </p>
                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                        Click "Draw boundary" to outline your field
                                    </p>
                                </div>
                            )}

                            {zones.length > 0 && boundary?.areaHa && (
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-semibold" style={{ color: "var(--text-muted)" }}>Zone coverage</span>
                                        <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                                            {fmtHa(zones.reduce((s, z) => s + (z.areaHa ?? 0), 0))}
                                        </span>
                                    </div>
                                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-muted, #E2E8F0)" }}>
                                        <div className="h-full rounded-full"
                                             style={{
                                                 width: `${Math.min(100, (zones.reduce((s, z) => s + (z.areaHa ?? 0), 0) / (boundary.areaHa ?? 1)) * 100)}%`,
                                                 background: "linear-gradient(90deg, var(--farm-green), #4ade80)",
                                             }} />
                                    </div>
                                </div>
                            )}

                            {zones.map((zone) => (
                                <div key={zone.id} className="rounded-xl p-3"
                                     style={{ background: `${zone.colour}12`, border: `1.5px solid ${zone.colour}50` }}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{zone.name}</p>
                                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                {ZONE_TYPES.find((t) => t.value === zone.type)?.icon}{" "}
                                                {zone.cropField?.cropType?.name ?? zone.type}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs font-bold" style={{ color: zone.colour }}>
                                                {fmtHa(zone.areaHa)}
                                            </span>
                                            <button onClick={() => deleteZone(zone.id)}
                                                    className="w-5 h-5 rounded flex items-center justify-center"
                                                    style={{ color: "var(--text-muted)" }}>
                                                <X size={11} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Markers tab */}
                    {activeTab === "markers" && (
                        <div className="flex flex-col gap-2">
                            {markers.length === 0 ? (
                                <div className="text-center py-8">
                                    <MapPin size={28} className="mx-auto mb-2" style={{ color: "var(--text-hint)" }} />
                                    <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                                        No markers yet. Click "Add marker" then click the map.
                                    </p>
                                </div>
                            ) : markers.map((m) => {
                                const mt = MARKER_TYPES.find((t) => t.value === m.type);
                                return (
                                    <div key={m.id} className="rounded-xl p-3 flex gap-3"
                                         style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                                        <span className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black"
                                              style={{ background: "var(--bg-card)", color: "var(--text-secondary)" }}>
                                            {mt?.icon ?? "MK"}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{m.label}</p>
                                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                {mt?.label}  -  {m.lat.toFixed(5)}, {m.lng.toFixed(5)}
                                            </p>
                                            {m.notes && (
                                                <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{m.notes}</p>
                                            )}
                                        </div>
                                        <button onClick={() => deleteMarker(m.id)}
                                                className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center"
                                                style={{ color: "var(--text-muted)" }}>
                                            <X size={11} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Info tab */}
                    {activeTab === "info" && (
                        <div className="flex flex-col gap-3">
                            <div className="rounded-xl p-4"
                                 style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                                <p className="text-xs font-extrabold uppercase tracking-widest mb-3"
                                   style={{ color: "var(--text-muted)" }}>
                                    Field details
                                </p>
                                {[
                                    { label: "Name",          value: field?.name },
                                    { label: "Soil type",     value: field?.soilType ?? "Not specified" },
                                    { label: "Area (record)", value: `${field?.totalArea} ha` },
                                    { label: "Mapped area",   value: fmtHa(boundary?.areaHa) },
                                    { label: "Zones",         value: String(zones.length) },
                                    { label: "Markers",       value: String(markers.length) },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex justify-between py-2"
                                         style={{ borderBottom: "1px solid var(--border)" }}>
                                        <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{label}</p>
                                        <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="rounded-xl p-4"
                                 style={{ background: "var(--farm-pale)", border: "1.5px solid #86EFAC" }}>
                                <p className="text-xs font-extrabold mb-2" style={{ color: "var(--farm-green)" }}>
                                    How to use
                                </p>
                                {[
                                    "1. Draw boundary - trace your field outline",
                                    "2. Add zones - section by crop or soil type",
                                    "3. Add markers - pin boreholes, sheds, gates",
                                    "4. Measure - calculate any area on map",
                                    "5. Toggle satellite for better accuracy",
                                ].map((t, i) => (
                                    <p key={i} className="text-[11px] mb-1" style={{ color: "#166534" }}>{t}</p>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Zone form modal */}
            {showZoneForm && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                         onClick={() => setShowZoneForm(false)} />
                    <div className="relative rounded-3xl shadow-2xl w-full max-w-md p-6 z-10"
                         style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                        <h2 className="text-base font-black mb-5" style={{ color: "var(--text-primary)" }}>
                            Configure zone
                        </h2>
                        <form onSubmit={saveZone} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                       style={{ color: "var(--text-muted)" }}>Zone name *</label>
                                <input value={zoneForm.name}
                                       onChange={(e) => setZoneForm((f) => ({ ...f, name: e.target.value }))}
                                       placeholder="e.g. Maize block A" required
                                       className="w-full h-11 px-3 rounded-xl text-sm outline-none"
                                       style={{ border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-primary)" }} />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                       style={{ color: "var(--text-muted)" }}>Zone type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {ZONE_TYPES.map((zt) => (
                                        <button key={zt.value} type="button"
                                                onClick={() => setZoneForm((f) => ({ ...f, type: zt.value }))}
                                                className="flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-all"
                                                style={{
                                                    background: zoneForm.type === zt.value ? "var(--farm-pale)" : "var(--bg-subtle)",
                                                    border:     `1.5px solid ${zoneForm.type === zt.value ? "var(--farm-green)" : "var(--border)"}`,
                                                    color:      zoneForm.type === zt.value ? "var(--farm-green)" : "var(--text-secondary)",
                                                }}>
                                            <span className="text-base">{zt.icon}</span>
                                            <span className="text-center leading-tight">{zt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {zoneForm.type === "crop" && cropFields.length > 0 && (
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                           style={{ color: "var(--text-muted)" }}>Linked crop</label>
                                    <select value={zoneForm.cropFieldId}
                                            onChange={(e) => setZoneForm((f) => ({ ...f, cropFieldId: e.target.value }))}
                                            className="w-full h-11 px-3 rounded-xl text-sm outline-none"
                                            style={{ border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-primary)" }}>
                                        <option value="">Not linked</option>
                                        {cropFields.map((cf: any) => (
                                            <option key={cf.id} value={cf.id}>
                                                {cf.cropTypeName} - {cf.variety}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                       style={{ color: "var(--text-muted)" }}>Colour</label>
                                <div className="flex gap-2 flex-wrap">
                                    {ZONE_COLORS.map((c) => (
                                        <button key={c} type="button"
                                                onClick={() => setZoneForm((f) => ({ ...f, colour: c }))}
                                                className="w-8 h-8 rounded-xl transition-all"
                                                style={{
                                                    background:    c,
                                                    outline:       zoneForm.colour === c ? `3px solid ${c}` : "none",
                                                    outlineOffset: "2px",
                                                    transform:     zoneForm.colour === c ? "scale(1.2)" : "scale(1)",
                                                }} />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                       style={{ color: "var(--text-muted)" }}>Notes</label>
                                <input value={zoneForm.notes}
                                       onChange={(e) => setZoneForm((f) => ({ ...f, notes: e.target.value }))}
                                       placeholder="e.g. Sandy soil, needs irrigation"
                                       className="w-full h-11 px-3 rounded-xl text-sm outline-none"
                                       style={{ border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-primary)" }} />
                            </div>

                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowZoneForm(false)}
                                        className="flex-1 h-12 rounded-xl font-bold text-sm"
                                        style={{ border: "1.5px solid var(--border)", color: "var(--text-muted)" }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                        className="flex-1 h-12 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
                                        style={{ background: saving ? "#94A3B8" : "var(--farm-green)" }}>
                                    {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Check size={14} /> Save zone</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Marker form modal */}
            {showMarkerForm && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                         onClick={() => { setShowMarkerForm(false); setMode("view"); }} />
                    <div className="relative rounded-3xl shadow-2xl w-full max-w-sm p-6 z-10"
                         style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                        <h2 className="text-base font-black mb-5" style={{ color: "var(--text-primary)" }}>
                            Add marker
                        </h2>
                        <form onSubmit={saveMarker} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                       style={{ color: "var(--text-muted)" }}>Type</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {MARKER_TYPES.map((mt) => (
                                        <button key={mt.value} type="button"
                                                onClick={() => setMarkerForm((f) => ({ ...f, type: mt.value }))}
                                                className="flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-all"
                                                style={{
                                                    background: markerForm.type === mt.value ? "var(--farm-pale)" : "var(--bg-subtle)",
                                                    border:     `1.5px solid ${markerForm.type === mt.value ? "var(--farm-green)" : "var(--border)"}`,
                                                    color:      markerForm.type === mt.value ? "var(--farm-green)" : "var(--text-secondary)",
                                                }}>
                                            <span className="text-lg">{mt.icon}</span>
                                            <span className="leading-tight text-center">{mt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                       style={{ color: "var(--text-muted)" }}>Label *</label>
                                <input value={markerForm.label}
                                       onChange={(e) => setMarkerForm((f) => ({ ...f, label: e.target.value }))}
                                       placeholder="e.g. Main borehole" required
                                       className="w-full h-11 px-3 rounded-xl text-sm outline-none"
                                       style={{ border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-primary)" }} />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                       style={{ color: "var(--text-muted)" }}>Notes</label>
                                <input value={markerForm.notes}
                                       onChange={(e) => setMarkerForm((f) => ({ ...f, notes: e.target.value }))}
                                       placeholder="Optional notes..."
                                       className="w-full h-11 px-3 rounded-xl text-sm outline-none"
                                       style={{ border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-primary)" }} />
                            </div>

                            <div className="flex gap-3">
                                <button type="button"
                                        onClick={() => { setShowMarkerForm(false); setMode("view"); }}
                                        className="flex-1 h-12 rounded-xl font-bold text-sm"
                                        style={{ border: "1.5px solid var(--border)", color: "var(--text-muted)" }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                        className="flex-1 h-12 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
                                        style={{ background: saving ? "#94A3B8" : "var(--farm-green)" }}>
                                    {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Check size={14} /> Place</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

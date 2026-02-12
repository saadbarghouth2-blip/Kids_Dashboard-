import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  Polyline,
  CircleMarker,
  Circle,
  GeoJSON,
  useMapEvents,
  useMap,
} from "react-leaflet";
import type { Map as LeafletMap, LatLngExpression } from "leaflet";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import type { Lesson, Place, PlaceCategory } from "../types";
import { sumPathKm } from "../utils/geo";
import type { Layers } from "./LayerControls";
import type { CategoryFilter } from "./FilterControls";
import type { BaseMapId } from "./BaseMapControls";

import egyptGeo from "../data/geo/egypt.json";
import nileGeo from "../data/geo/nile.json";
import deltaGeo from "../data/geo/delta.json";

type DrawMode = "none" | "marker" | "path";

function TapHandler(props: {
  mode: DrawMode;
  onAddMarker: (pos: LatLngExpression) => void;
  onAddPathPoint: (pos: [number, number]) => void;
  onMove?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (props.mode === "marker") props.onAddMarker([e.latlng.lat, e.latlng.lng]);
      if (props.mode === "path") props.onAddPathPoint([e.latlng.lat, e.latlng.lng]);
    },
    mousemove(e) {
      props.onMove?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapReady(props: { onReady: (m: LeafletMap) => void }) {
  const map = useMap();
  useEffect(() => {
    props.onReady(map as any);
  }, [map]);
  return null;
}

const emojiByCat: Record<PlaceCategory, string> = {
  fresh: "💧",
  salty: "🌊",
  mineral: "⛏️",
  energy: "⚡",
  renewable: "☀️",
  problem: "⚠️",
  project: "🏗️",
  agri: "🌾",
  transport: "🚆",
  urban: "🏙️",
  aquaculture: "🐟",
  waterway: "🚢",
  mega: "🏆",
};

function mkIcon(cat: PlaceCategory, active: boolean) {
  const em = emojiByCat[cat] ?? "📍";
  return L.divIcon({
    className: "kids-marker",
    html: `<div class="kids-pin ${active ? "active" : ""}"><span class="emoji">${em}</span><span class="pulse"></span><span class="halo"></span></div>`,
    iconSize: [active ? 72 : 62, active ? 72 : 62],
    iconAnchor: [active ? 36 : 31, active ? 72 : 62],
    popupAnchor: [0, active ? -64 : -56],
  });
}

function tileFor(id: BaseMapId) {
  if (id === "esri") return { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attr: "Tiles © Esri" };
  if (id === "hot") return { url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", attr: "© OpenStreetMap contributors, HOT" };
  if (id === "osm") return { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attr: "© OpenStreetMap contributors" };
  return { url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", attr: "© OpenStreetMap contributors © CARTO" };
}

import GISLayers from "./GISLayers";

export default function MapView(props: {
  lesson: Lesson;
  activePlaceId: string | null;
  onSelectPlace: (id: string) => void;
  onMapReady: (m: LeafletMap) => void;
  layers: Layers;
  filters: CategoryFilter;
  baseMap: BaseMapId;
  enabledLayers?: Record<string, boolean>;
}) {
  const { lesson, activePlaceId, onSelectPlace, onMapReady, layers, filters, baseMap, enabledLayers } = props;

  const activePlace: Place | null = useMemo(
    () => lesson.places.find((p) => p.id === activePlaceId) ?? null,
    [lesson.places, activePlaceId]
  );

  const [mode, setMode] = useState<DrawMode>("none");
  const [userMarkers, setUserMarkers] = useState<LatLngExpression[]>([]);
  const [path, setPath] = useState<[number, number][]>([]);
  const [cursor, setCursor] = useState<{ lat: number; lng: number } | null>(null);


  const [legendQuery, setLegendQuery] = useState("");
  const legendRefs = useMemo(() => new Map<string, HTMLButtonElement | null>(), []);
  const markerRefs = useRef<Map<string, any>>(new Map());
  const [legendOpen, setLegendOpen] = useState(true);
  const [toolsOpen, setToolsOpen] = useState(true);

  const isCompact = useMemo(() => window.innerWidth < 1024, []);
  useEffect(() => {
    if (isCompact) { setLegendOpen(false); setToolsOpen(false); }
  }, [isCompact]);


  useEffect(() => {
    if (!activePlaceId) return;
    const el = legendRefs.get(activePlaceId);
    if (el && typeof (el as any).scrollIntoView === "function") {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activePlaceId, legendRefs]);


  const distanceKm = useMemo(() => (path.length >= 2 ? sumPathKm(path) : 0), [path]);
  const heatCenters = useMemo(() => lesson.places.slice(0, 12).map((p) => [p.lat, p.lng] as [number, number]), [lesson.places]);
  const visiblePlaces = useMemo<Place[]>(() => {
    return lesson.places.filter((p) => (filters[p.category] ?? true));
  }, [lesson.places, filters]);

  useEffect(() => {
    if (!activePlaceId) return;
    const m = markerRefs.current.get(activePlaceId);
    try {
      m?.openPopup?.();
    } catch { }
  }, [activePlaceId]);

  const legendPlaces = useMemo<Place[]>(() => {
    const q = legendQuery.trim().toLowerCase();
    if (!q) return visiblePlaces;
    return visiblePlaces.filter((p) => {
      const hay = `${p.title} ${(p.aliases ?? []).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [visiblePlaces, legendQuery]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMode("none"); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const tile = tileFor(baseMap);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[26.5, 30.8]}
        zoom={6}
        className="h-full w-full rounded-[34px] overflow-hidden shadow-glow gradient-stroke"
      >
        <TileLayer attribution={tile.attr} url={tile.url} />
        <GISLayers enabledLayers={enabledLayers ?? {}} />
        <MapReady onReady={onMapReady} />
        <TapHandler
          mode={mode}
          onAddMarker={(pos) => setUserMarkers((m) => [...m, pos])}
          onAddPathPoint={(pos) => setPath((p) => [...p, pos])}
          onMove={(lat, lng) => setCursor({ lat, lng })}
        />

        {layers.showEgypt ? <GeoJSON data={egyptGeo as any} style={() => ({ color: "white", weight: 1.5, opacity: 0.35, fillOpacity: 0.02 })} /> : null}
        {layers.showDelta ? <GeoJSON data={deltaGeo as any} style={() => ({ color: "white", weight: 2, opacity: 0.35, fillOpacity: 0.06 })} /> : null}
        {layers.showNile ? <GeoJSON data={nileGeo as any} style={() => ({ color: "white", weight: 3, opacity: 0.45 })} /> : null}

        {layers.showHeat ? heatCenters.map((c, i) => (
          <Circle key={i} center={c as any} radius={36000} pathOptions={{ color: "white", weight: 1, opacity: 0.07, fillOpacity: 0.04 }} />
        )) : null}

        {layers.showPlaces ? visiblePlaces.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            ref={(r) => { if (r) markerRefs.current.set(p.id, r); }}
            icon={mkIcon(p.category, p.id === activePlaceId)}
            eventHandlers={{ click: () => onSelectPlace(p.id) }}
          >
            {layers.showLabels ? <Tooltip direction="top" offset={[0, -24]} opacity={1} permanent>{p.title}</Tooltip> : null}
            <Popup>
              <div className="space-y-2">
                <div className="text-base font-extrabold">{p.title}</div>
                <div className="text-sm text-white/90">{p.summary}</div>
                <div className="flex gap-2 flex-wrap">
                  <span className="badge">#{p.id}</span>
                  <span className="badge">{p.category}</span>
                  <span className="badge">Tap = FlyTo</span>
                </div>
              </div>
            </Popup>
          </Marker>
        )) : null}

        {activePlace ? (
          <>
            <CircleMarker center={[activePlace.lat, activePlace.lng]} radius={18} pathOptions={{ color: "white", weight: 2, opacity: 0.78, fillOpacity: 0.12 }} />
            <Circle center={[activePlace.lat, activePlace.lng] as any} radius={20000} pathOptions={{ color: "white", weight: 1, opacity: 0.14, fillOpacity: 0.05 }} />
            <Circle center={[activePlace.lat, activePlace.lng] as any} radius={52000} pathOptions={{ color: "white", weight: 1, opacity: 0.07, fillOpacity: 0.02 }} />
          </>
        ) : null}

        {userMarkers.map((pos, i) => (
          <CircleMarker key={i} center={pos as any} radius={7} pathOptions={{ color: "white", weight: 2, opacity: 0.75, fillOpacity: 0.2 }} />
        ))}
        {path.length >= 2 ? <Polyline positions={path as any} pathOptions={{ color: "white", weight: 3, opacity: 0.78 }} /> : null}
      </MapContainer>

      {/* Compact toggles */}
      {isCompact ? (
        <div className="absolute left-4 top-4 z-[999] flex gap-2">
          <button className="btn-strong" onClick={() => setLegendOpen((v) => !v)}>Legend</button>
          <button className="btn-strong" onClick={() => setToolsOpen((v) => !v)}>Tools</button>
        </div>
      ) : null}

      {/* Legend panel */}
      <AnimatePresence>
        {legendOpen ? (
          <motion.div
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            transition={{ duration: 0.2 }}
            className="absolute left-4 top-4 z-[900] w-[320px] glass rounded-3xl p-3 shadow-soft"
          >
            <div className="flex items-center justify-between">
              <div className="panel-title">مفتاح الخريطة</div>
              {isCompact ? <button className="btn text-xs" onClick={() => setLegendOpen(false)}>إخفاء</button> : null}
            </div>

            <div className="mt-2">
              <input value={legendQuery} onChange={(e) => setLegendQuery(e.target.value)} className="input w-full" placeholder="ابحث عن معلم... (اكتب اسم مكان)" />
            </div>

            <div className="mt-2 grid gap-2 max-h-[260px] overflow-auto pr-1">
              {legendPlaces.map((p, idx) => (
                <button
                  key={p.id}
                  ref={(el) => legendRefs.set(p.id, el)}
                  onClick={() => onSelectPlace(p.id)}
                  className={clsx("btn text-right font-semibold flex items-center justify-between", p.id === activePlaceId && "border-white/35 bg-white/10")}
                  title={p.summary}
                >
                  <span className="flex items-center gap-2">
                    <span>{emojiByCat[p.category] ?? "📍"}</span>
                    <span>{p.title}</span>
                  </span>
                  <span className="badge">{idx + 1}</span>
                </button>
              ))}
            </div>

            <div className="mt-3 text-xs text-white/70">أي زر هنا = FlyTo للمكان + فتح معلوماته.</div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Tools panel */}
      <AnimatePresence>
        {toolsOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.2 }}
            className="absolute left-4 bottom-4 z-[900] glass rounded-3xl p-3 shadow-soft w-[320px]"
          >
            <div className="flex items-center justify-between">
              <div className="panel-title">أدوات الرسم</div>
              {isCompact ? <button className="btn text-xs" onClick={() => setToolsOpen(false)}>إخفاء</button> : null}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <button className={clsx("btn text-xs", mode === "marker" && "border-white/35 bg-white/10")} onClick={() => setMode(mode === "marker" ? "none" : "marker")}>نقطة ✦</button>
              <button className={clsx("btn text-xs", mode === "path" && "border-white/35 bg-white/10")} onClick={() => setMode(mode === "path" ? "none" : "path")}>مسار ➝</button>
              <button className="btn text-xs" onClick={() => { setUserMarkers([]); setPath([]); }}>مسح</button>
              <span className="badge">Esc</span>
            </div>

            <AnimatePresence>
              {mode !== "none" ? (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="mt-3 text-sm text-white/85">
                  اضغط على الخريطة لإضافة {mode === "marker" ? "نقطة" : "نقاط للمسار"}.
                  {mode === "path" && path.length >= 2 ? (
                    <div className="mt-2">المسافة: <span className="font-extrabold">{distanceKm.toFixed(2)}</span> كم</div>
                  ) : null}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-3 text-xs text-white/70">
              تلميح: فعّل/اقفل الفلاتر من اليمين علشان المعالم تبقى أوضح.
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {layers.showCoords && cursor ? (
        <div className="absolute right-4 bottom-4 glass rounded-3xl px-3 py-2 shadow-soft text-xs z-[900]">
          <span className="panel-title">إحداثيات المؤشر</span>
          <div className="font-extrabold mt-1">{cursor.lat.toFixed(4)}, {cursor.lng.toFixed(4)}</div>
        </div>
      ) : null}
    </div>
  );
}

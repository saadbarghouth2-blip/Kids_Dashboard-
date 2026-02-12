import { Fragment, useEffect, useMemo, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  Polygon,
  Tooltip,
  CircleMarker,
  useMap,
} from "react-leaflet";
import { motion } from "framer-motion";
import type { Lesson, Place } from "../types";
import type { DrawAction } from "./types";
import { categoryEmoji } from "../utils/categories";
import PlaceDrawer from "../components/PlaceDrawer";
import type { Layers } from "../components/LayerControls";
import type { CategoryFilter } from "../components/FilterControls";
import type { BaseMapId } from "../components/BaseMapControls";
import GISLayers from "../components/GISLayers";

function MapReady(props: { onReady: (map: LeafletMap) => void }) {
  const map = useMap();
  useEffect(() => {
    props.onReady(map);
  }, [map, props]);
  return null;
}

function mkTextIcon(label: string) {
  return L.divIcon({
    className: "map-note",
    html: `<div class="map-note-bubble">${label}</div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
}

function mkIcon(em: string, active: boolean) {
  return L.divIcon({
    className: "kids-marker",
    html: `<div class="kids-pin ${active ? "active" : ""}"><span class="emoji">${em}</span><span class="pulse"></span><span class="halo"></span><span class="spark s1">✦</span><span class="spark s2">✦</span><span class="spark s3">✦</span></div>`,
    iconSize: [active ? 74 : 62, active ? 74 : 62],
    iconAnchor: [active ? 37 : 31, active ? 74 : 62],
    popupAnchor: [0, active ? -64 : -56],
  });
}

const BASEMAPS: Record<BaseMapId, { url: string; attribution: string }> = {
  osm: { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: "© OpenStreetMap contributors" },
  hot: { url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", attribution: "© OpenStreetMap contributors, HOT" },
  carto: { url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", attribution: "© CARTO" },
  esri: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution: "© Esri" },
};

function boundsFromPlaceIds(ids: string[], places: Place[]) {
  const points = places.filter((p) => ids.includes(p.id)).map((p) => [p.lat, p.lng] as [number, number]);
  if (!points.length) return null;
  return { bounds: L.latLngBounds(points as any), pointCount: points.length };
}

function boundsFromDraw(draw: DrawAction[], places: Place[]) {
  if (!draw.length) return null;
  const bounds = L.latLngBounds([]);
  let pointCount = 0;
  const addPoint = (pt: [number, number]) => {
    bounds.extend(pt as any);
    pointCount += 1;
  };

  for (const d of draw) {
    if (d.kind === "circle") {
      const ringBounds = L.latLng(d.center as any).toBounds(d.radiusM * 1.2);
      bounds.extend(ringBounds);
      pointCount += 2;
    }
    if (d.kind === "polyline") d.points.forEach((pt) => addPoint(pt));
    if (d.kind === "polygon") (d.rings ?? []).forEach((ring) => ring.forEach((pt) => addPoint(pt)));
    if (d.kind === "text") addPoint(d.at);
    if (d.kind === "focusPlaces") {
      places
        .filter((p) => d.placeIds.includes(p.id))
        .forEach((p) => addPoint([p.lat, p.lng]));
    }
  }

  if (!bounds.isValid() || pointCount === 0) return null;
  return { bounds, pointCount };
}

function focusBounds(map: LeafletMap, bounds: L.LatLngBounds, pointCount: number) {
  if (!bounds.isValid()) return;
  if (pointCount <= 1) {
    const center = bounds.getCenter();
    map.flyTo([center.lat, center.lng], 14, { animate: true, duration: 1.5, easeLinearity: 0.25 });
    return;
  }
  map.fitBounds(bounds, { padding: [80, 80], maxZoom: 14, animate: true, duration: 1.5 });
}

export default function MapStage(props: {
  lesson: Lesson;
  layers: Layers;
  filters: CategoryFilter;
  baseMap: BaseMapId;
  activePlaceId: string | null;
  highlightIds: string[];
  draw: DrawAction[];
  focusToken: number;
  discovered: Set<string>;
  xp: number;
  onSelectPlace: (id: string) => void;
  onClosePlace: () => void;
  enabledLayers?: Record<string, boolean>;
}) {
  const { lesson, layers, filters, baseMap, activePlaceId, highlightIds, draw, focusToken, discovered, xp, onSelectPlace, onClosePlace, enabledLayers } = props;
  const mapRef = useRef<LeafletMap | null>(null);

  const visiblePlaces = useMemo(() => lesson.places.filter((p) => (filters[p.category] ?? true)), [lesson.places, filters]);
  const activePlace = useMemo(() => lesson.places.find((p) => p.id === activePlaceId) ?? null, [lesson.places, activePlaceId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (activePlace) {
      map.flyTo([activePlace.lat, activePlace.lng], 14, { animate: true, duration: 1.5, easeLinearity: 0.25 });
      return;
    }

    const drawFocus = boundsFromDraw(draw, lesson.places);
    if (drawFocus) {
      focusBounds(map, drawFocus.bounds, drawFocus.pointCount);
      return;
    }

    const highlightFocus = boundsFromPlaceIds(highlightIds, lesson.places);
    if (highlightFocus) focusBounds(map, highlightFocus.bounds, highlightFocus.pointCount);
  }, [activePlace, highlightIds, draw, lesson.places, focusToken]);

  const bm = BASEMAPS[baseMap] ?? BASEMAPS.hot;

  return (
    <div className="relative h-full w-full rounded-[28px] overflow-hidden map-frame">
      <div className="map-beams" />
      <div className="map-grain" />
      <div className="map-corners" />

      <MapContainer center={[26.8, 30.8]} zoom={6} className="h-full w-full">
        <MapReady onReady={(m) => { mapRef.current = m; }} />
        <TileLayer url={bm.url} attribution={bm.attribution} />
        <GISLayers enabledLayers={enabledLayers ?? {}} />

        {draw.map((d, idx) => {
          if (d.kind === "circle") {
            return (
              <Fragment key={`circle-${idx}`}>
                <Circle center={d.center} radius={d.radiusM} pathOptions={{ className: "dash-anim-fill dash-glow" }} />
                {d.label ? <Marker position={d.center as any} icon={mkTextIcon(d.label)} /> : null}
              </Fragment>
            );
          }

          if (d.kind === "polyline") {
            const mid = d.points[Math.max(0, Math.floor(d.points.length / 2))] as any;
            return (
              <Fragment key={`polyline-${idx}`}>
                <Polyline positions={d.points} pathOptions={{ className: "dash-anim dash-glow" }} />
                {d.label ? <Marker position={mid} icon={mkTextIcon(d.label)} /> : null}
              </Fragment>
            );
          }

          if (d.kind === "polygon") {
            const mid = (d.rings?.[0]?.[0] ?? [26.8, 30.8]) as any;
            return (
              <Fragment key={`polygon-${idx}`}>
                <Polygon positions={d.rings as any} pathOptions={{ className: "dash-anim-fill dash-glow" }} />
                {d.label ? <Marker position={mid} icon={mkTextIcon(d.label)} /> : null}
              </Fragment>
            );
          }

          if (d.kind === "text") return <Marker key={`text-${idx}`} position={d.at as any} icon={mkTextIcon(d.text)} />;
          return null;
        })}

        {activePlace ? (
          <>
            <CircleMarker center={[activePlace.lat, activePlace.lng]} radius={14} pathOptions={{ className: "map-focus-ring" }} />
            <Circle center={[activePlace.lat, activePlace.lng]} radius={18000} pathOptions={{ className: "map-focus-wave" }} />
          </>
        ) : null}

        {layers.showPlaces && visiblePlaces.map((p) => {
          const em = categoryEmoji(p.category);
          const isActive = p.id === activePlaceId || highlightIds.includes(p.id);
          return (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              icon={mkIcon(em, isActive)}
              eventHandlers={{ click: () => onSelectPlace(p.id) }}
            >
              {layers.showLabels ? <Tooltip direction="top" offset={[0, -24]} opacity={1} permanent>{p.title}</Tooltip> : null}
              <Popup>
                <div className="min-w-[220px]">
                  <div className="font-bold">{p.title}</div>
                  <div className="text-sm opacity-80">{p.summary}</div>
                  <div className="mt-2 text-xs opacity-70">اضغط اختيار لعرض الصور والفيديو الخاصة بالمكان.</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <PlaceDrawer
        lesson={lesson}
        place={activePlace}
        discovered={discovered}
        onClose={onClosePlace}
        onNavigateNext={() => {
          const idx = lesson.places.findIndex((p) => p.id === activePlaceId);
          const next = lesson.places[(idx + 1) % lesson.places.length];
          onSelectPlace(next.id);
        }}
        xp={xp}
      />

      <div className="absolute right-3 top-3 z-[800] pointer-events-none flex flex-col items-end gap-2">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="kid-pill"
        >
          👆 اختار أي معلم
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="kid-pill"
        >
          🖼️ صور + 🎬 فيديو لكل نقطة
        </motion.div>
      </div>

      <div className="absolute left-3 bottom-3 z-[800] pointer-events-none">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl px-3 py-2 text-xs text-ink-muted">
          الخريطة تروح تلقائيًا للمكان المختار وتفتح بطاقة وسائط بسيطة للأطفال.
        </motion.div>
      </div>
    </div>
  );
}

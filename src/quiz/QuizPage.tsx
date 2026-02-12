import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import LayerControls, { Layers } from "../components/LayerControls";
import FilterControls, { CategoryFilter } from "../components/FilterControls";
import BaseMapControls, { BaseMapId } from "../components/BaseMapControls";
import StatsStrip from "../components/StatsStrip";
import type { Lesson, Place } from "../types";
import MapStage from "./MapStage";
import QuizAssistant from "./QuizAssistant";
import type { DrawAction, QuizQuestion } from "./types";
import { DEFAULT_VOICE, stopSpeak } from "./voice";

const DEFAULT_LAYERS: Layers = {
  showPlaces: true,
  showLabels: true,
  showEgypt: true,
  showNile: true,
  showDelta: true,
  showHeat: false,
  showCoords: false,
};

function allOn(): CategoryFilter {
  return {
    fresh: true, salty: true, problem: true,
    project: true, mega: true,
    agri: true, transport: true, urban: true, aquaculture: true, waterway: true,
    energy: true, renewable: true, mineral: true,
  };
}

export default function QuizPage(props: { lesson: Lesson; onBack: () => void }) {
  const { lesson, onBack } = props;

  const [layers, setLayers] = useState<Layers>(DEFAULT_LAYERS);
  const [filters, setFilters] = useState<CategoryFilter>(allOn());
  const [baseMap, setBaseMap] = useState<BaseMapId>("hot");

  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);
  const [highlightIds, setHighlightIds] = useState<string[]>([]);
  const [draw, setDraw] = useState<DrawAction[]>([]);
  const [discovered, setDiscovered] = useState<Set<string>>(new Set());
  const [xp, setXp] = useState(0);
  const [focusToken, setFocusToken] = useState(0);
  const highlightTimeoutRef = useRef<number | null>(null);
  const drawTimeoutRef = useRef<number | null>(null);

  const [voiceEnabled, setVoiceEnabled] = useState(DEFAULT_VOICE.enabled);
  const [autoSpeak, setAutoSpeak] = useState(DEFAULT_VOICE.autoSpeak);

  // GIS Layers State
  const [gisEnabled, setGisEnabled] = useState<Record<string, boolean>>({});

  const totalCount = lesson.places.length;

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) window.clearTimeout(highlightTimeoutRef.current);
      if (drawTimeoutRef.current) window.clearTimeout(drawTimeoutRef.current);
    };
  }, []);

  const onAnswerAction = (q: QuizQuestion, place?: Place | null) => {
    const a = q.action || {};

    // layers
    if (a.setLayers) setLayers((prev) => ({ ...prev, ...a.setLayers }));
    if (!a.setLayers && place) setLayers((prev) => ({ ...prev, showLabels: true }));

    // map navigation / highlighting / draw
    const targetId = a.flyToPlaceId ?? place?.id ?? a.highlightPlaceIds?.[0] ?? null;
    if (targetId) {
      setActivePlaceId(targetId);
      setDiscovered((prev) => new Set(prev).add(targetId));
      setXp((x) => x + 8);
      setFocusToken((t) => t + 1);
    }

    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = null;
    }

    if (a.highlightPlaceIds?.length) {
      setHighlightIds([...a.highlightPlaceIds]);
    } else if (targetId) {
      setHighlightIds([targetId]);
      highlightTimeoutRef.current = window.setTimeout(() => setHighlightIds([]), 5200);
    } else {
      setHighlightIds([]);
    }

    if (drawTimeoutRef.current) {
      window.clearTimeout(drawTimeoutRef.current);
      drawTimeoutRef.current = null;
    }

    if (a.draw?.length) {
      setDraw([...a.draw]);
      setXp((x) => x + 5);
      // auto clear after a while
      drawTimeoutRef.current = window.setTimeout(() => setDraw([]), 9000);
    }

    // add bonus XP per difficulty
    setXp((x) => x + q.difficulty * 2);
  };

  const discoveredCount = discovered.size;

  return (
    <div className="h-screen w-screen text-ink relative overflow-hidden">
      <div className="relative z-10 h-full p-3 lg:p-4 flex flex-col gap-3">
        {/* Header - More compact */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass rounded-3xl px-4 py-3 shadow-soft relative overflow-hidden scanline flex-none"
        >
          <div className="glow-ring" />
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs opacity-70 font-semibold">Atlas Dashboard</div>
              <div className="text-xl lg:text-2xl font-extrabold font-display leading-tight">
                أسئلة تفاعلية — {lesson.title}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button className="btn text-xs" onClick={() => { stopSpeak(); setVoiceEnabled((v) => !v); }}>
                {voiceEnabled ? "🔊 شغال" : "🔇 مقفول"}
              </button>
              <button className="btn text-xs" onClick={() => setAutoSpeak((v) => !v)}>
                {autoSpeak ? "🤖 ON" : "🤖 OFF"}
              </button>
              <button className="btn-strong text-xs" onClick={onBack}>رجوع للدروس</button>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid - Takes remaining space */}
        <div className="grid flex-1 grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
          {/* Sidebar - 4 columns */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:col-span-4 flex flex-col gap-3 order-2 lg:order-1 min-h-0 overflow-hidden"
          >
            {/* Controls - All in scrollable area for full visibility */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              <QuizAssistant
                lesson={lesson}
                voiceEnabled={voiceEnabled}
                autoSpeak={autoSpeak}
                onAnswerAction={(q, place) => onAnswerAction(q, place)}
              />
              <LayerControls layers={layers} setLayers={setLayers} gisEnabled={gisEnabled} setGisEnabled={setGisEnabled} />
              <BaseMapControls baseMap={baseMap} setBaseMap={setBaseMap} />
              <FilterControls filters={filters} setFilters={setFilters} />
            </div>
          </motion.div>

          {/* Map - 8 columns */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:col-span-8 order-1 lg:order-2 min-h-[400px] h-full"
          >
            <MapStage
              lesson={lesson}
              layers={layers}
              filters={filters}
              baseMap={baseMap}
              activePlaceId={activePlaceId}
              highlightIds={highlightIds}
              draw={draw}
              focusToken={focusToken}
              discovered={discovered}
              xp={xp}
              enabledLayers={gisEnabled}
              onSelectPlace={(id) => {
                setActivePlaceId(id);
                setDiscovered((prev) => new Set(prev).add(id));
                setXp((x) => x + 6);
              }}
              onClosePlace={() => setActivePlaceId(null)}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

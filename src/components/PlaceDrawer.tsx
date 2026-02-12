import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { Lesson, Place, PlaceMediaAsset } from "../types";

type MediaTab = "images" | "videos";

type MediaItem = {
  id: string;
  kind: "image" | "video";
  src: string;
  title: string;
  caption?: string;
  thumb?: string;
};

function speak(text: string) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices?.() ?? [];
    const ar = voices.find((v) => (v.lang || "").toLowerCase().startsWith("ar"));
    if (ar) u.voice = ar;
    u.lang = ar?.lang || "ar-EG";
    u.rate = 1.02;
    u.pitch = 1.05;
    synth.speak(u);
  } catch {
    // ignore
  }
}

function normalizeYouTubeUrl(src: string) {
  const clean = src.trim();
  if (!clean) return "";
  try {
    const u = new URL(clean);
    const host = u.hostname.toLowerCase();
    if (host.includes("youtube.com") && u.pathname === "/watch") {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : clean;
    }
    if (host.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : clean;
    }
    return clean;
  } catch {
    return clean;
  }
}

function mapSnapshot(place: Place, zoom: number) {
  const latRad = (place.lat * Math.PI) / 180;
  const scale = 2 ** zoom;
  const x = Math.floor(((place.lng + 180) / 360) * scale);
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale);
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
}

function youtubeSearchEmbed(query: string) {
  return `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}`;
}

function uniqMedia(items: MediaItem[]) {
  const seen = new Set<string>();
  const out: MediaItem[] = [];
  for (const item of items) {
    const k = `${item.kind}:${item.src}`;
    if (!item.src || seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

function normalizeGalleryItem(asset: PlaceMediaAsset, idx: number): MediaItem | null {
  if (!asset.src) return null;
  return {
    id: `gallery-${idx}`,
    kind: asset.kind,
    src: asset.kind === "video" ? normalizeYouTubeUrl(asset.src) : asset.src,
    title: asset.title ?? (asset.kind === "video" ? "فيديو إضافي" : "صورة إضافية"),
    caption: asset.caption,
    thumb: asset.thumb,
  };
}

function buildMediaPack(place: Place, lesson: Lesson) {
  const images: MediaItem[] = [];
  const videos: MediaItem[] = [];
  const media = place.media;

  if (media?.gallery?.length) {
    media.gallery.forEach((asset, idx) => {
      const item = normalizeGalleryItem(asset, idx);
      if (!item) return;
      if (item.kind === "image") images.push(item);
      if (item.kind === "video") videos.push(item);
    });
  }

  media?.images?.forEach((src, idx) => {
    if (!src?.trim()) return;
    images.push({
      id: `img-${idx}`,
      kind: "image",
      src: src.trim(),
      title: `صورة ${idx + 1}`,
    });
  });

  media?.videos?.forEach((src, idx) => {
    if (!src?.trim()) return;
    videos.push({
      id: `vid-${idx}`,
      kind: "video",
      src: normalizeYouTubeUrl(src),
      title: `فيديو ${idx + 1}`,
    });
  });

  if (media?.image?.trim()) {
    images.push({
      id: "main-image",
      kind: "image",
      src: media.image.trim(),
      title: place.title,
      caption: "صورة حقيقية للمعلم",
    });
  }

  if (media?.video?.trim()) {
    videos.push({
      id: "main-video",
      kind: "video",
      src: normalizeYouTubeUrl(media.video),
      title: `${place.title} - فيديو`,
      caption: "فيديو مرتبط بالمكان",
    });
  }

  images.push({
    id: "map-image-close",
    kind: "image",
    src: mapSnapshot(place, 7),
    title: `${place.title} على الخريطة`,
    caption: "موقع المعلم على الخريطة",
  });
  images.push({
    id: "map-image-wide",
    kind: "image",
    src: mapSnapshot(place, 5),
    title: `نظرة أوسع حول ${place.title}`,
    caption: "المكان بالنسبة لباقي المناطق",
  });

  videos.push({
    id: "video-search",
    kind: "video",
    src: youtubeSearchEmbed(`${place.title} مصر ${lesson.title} للأطفال`),
    title: `فيديوهات ${place.title}`,
    caption: "نتائج فيديو تلقائية حسب اسم المكان",
  });

  return {
    images: uniqMedia(images),
    videos: uniqMedia(videos),
  };
}

export default function PlaceDrawer(props: {
  lesson: Lesson;
  place: Place | null;
  discovered: Set<string>;
  onClose: () => void;
  onNavigateNext: () => void;
  xp: number;
}) {
  const { lesson, place, onClose, onNavigateNext, discovered, xp } = props;
  const [speaking, setSpeaking] = useState(false);
  const [tab, setTab] = useState<MediaTab>("images");
  const [imageIdx, setImageIdx] = useState(0);
  const [videoIdx, setVideoIdx] = useState(0);

  const mediaPack = useMemo(() => {
    if (!place) return { images: [] as MediaItem[], videos: [] as MediaItem[] };
    return buildMediaPack(place, lesson);
  }, [place, lesson]);

  useEffect(() => {
    if (!place) return;
    setImageIdx(0);
    setVideoIdx(0);
    setTab(mediaPack.images.length ? "images" : "videos");
    setSpeaking(false);
  }, [place?.id, mediaPack.images.length]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const speakText = useMemo(() => {
    if (!place) return "";
    const lines: string[] = [];
    lines.push(`أهلا! أنت الآن عند: ${place.title}.`);
    lines.push(place.summary);
    for (const d of place.details ?? []) lines.push(d);
    lines.push("يمكنك مشاهدة الصور أو الفيديوهات الخاصة بهذا المكان.");
    return lines.join(" ");
  }, [place]);

  const onSpeak = () => {
    if (!place) return;
    if (speaking) {
      window.speechSynthesis?.cancel();
      setSpeaking(false);
      return;
    }
    speak(speakText);
    setSpeaking(true);
    window.setTimeout(() => setSpeaking(false), 9000);
  };

  const activeImage = mediaPack.images[imageIdx] ?? mediaPack.images[0] ?? null;
  const activeVideo = mediaPack.videos[videoIdx] ?? mediaPack.videos[0] ?? null;

  return (
    <AnimatePresence>
      {place ? (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.22 }}
          className="absolute left-4 top-4 z-[999] w-[420px] max-w-[95vw] glass rounded-[28px] p-4 shadow-glow overflow-hidden scanline"
        >
          <div className="glow-ring animate-pulseGlow" />
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-lg font-extrabold font-display">{place.title}</div>
              <div className="text-xs text-ink-soft mt-1">
                {discovered.has(place.id) ? "تم اكتشافه ✅" : "جديد ✨"} • XP: {xp}
              </div>
            </div>
            <button className="btn text-xs" onClick={onClose}>إغلاق</button>
          </div>

          <div className="mt-3 text-sm text-ink-muted leading-relaxed">{place.summary}</div>

          <div className="mt-3 flex gap-2">
            <button
              className={`media-tab ${tab === "images" ? "active" : ""}`}
              onClick={() => setTab("images")}
              disabled={!mediaPack.images.length}
            >
              🖼️ صور ({mediaPack.images.length})
            </button>
            <button
              className={`media-tab ${tab === "videos" ? "active" : ""}`}
              onClick={() => setTab("videos")}
              disabled={!mediaPack.videos.length}
            >
              🎬 فيديوهات ({mediaPack.videos.length})
            </button>
          </div>

          {tab === "images" ? (
            <div className="mt-3">
              <div className="media-stage">
                {activeImage ? (
                  <img
                    src={activeImage.src}
                    alt={activeImage.title}
                    className="h-[188px] w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="p-6 text-center text-sm text-ink-soft">لا توجد صور متاحة.</div>
                )}
              </div>
              {activeImage ? (
                <div className="mt-2 text-xs text-ink-soft">
                  {activeImage.title}
                  {activeImage.caption ? ` • ${activeImage.caption}` : ""}
                </div>
              ) : null}

              {mediaPack.images.length > 1 ? (
                <div className="mt-2 flex items-center gap-2">
                  <button
                    className="btn text-xs"
                    onClick={() => setImageIdx((i) => (i - 1 + mediaPack.images.length) % mediaPack.images.length)}
                  >
                    السابق
                  </button>
                  <span className="badge">{imageIdx + 1}/{mediaPack.images.length}</span>
                  <button
                    className="btn text-xs"
                    onClick={() => setImageIdx((i) => (i + 1) % mediaPack.images.length)}
                  >
                    التالي
                  </button>
                </div>
              ) : null}

              <div className="media-thumbs mt-2">
                {mediaPack.images.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => setImageIdx(idx)}
                    className={`media-thumb ${idx === imageIdx ? "active" : ""}`}
                    title={item.title}
                  >
                    <img src={item.thumb ?? item.src} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <div className="media-stage">
                {activeVideo ? (
                  <iframe
                    className="h-[188px] w-full"
                    src={activeVideo.src}
                    title={activeVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="p-6 text-center text-sm text-ink-soft">لا توجد فيديوهات متاحة.</div>
                )}
              </div>
              {activeVideo ? (
                <div className="mt-2 text-xs text-ink-soft">
                  {activeVideo.title}
                  {activeVideo.caption ? ` • ${activeVideo.caption}` : ""}
                </div>
              ) : null}

              {mediaPack.videos.length > 1 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {mediaPack.videos.map((item, idx) => (
                    <button
                      key={item.id}
                      className={`btn text-xs ${videoIdx === idx ? "btn-active" : ""}`}
                      onClick={() => setVideoIdx(idx)}
                    >
                      فيديو {idx + 1}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {place.details?.length ? (
            <ul className="mt-3 text-sm text-ink-muted list-disc pl-5 space-y-1 max-h-[120px] overflow-auto">
              {place.details.slice(0, 5).map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          ) : null}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-ink panel-muted p-3">
              <div className="panel-title">إحداثيات</div>
              <div className="font-extrabold mt-1 text-sm">
                {place.lat.toFixed(3)}, {place.lng.toFixed(3)}
              </div>
            </div>
            <div className="rounded-2xl border border-ink panel-muted p-3">
              <div className="panel-title">نوع المكان</div>
              <div className="font-extrabold mt-1 text-sm">{place.category}</div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button className="btn flex-1" onClick={onSpeak}>{speaking ? "إيقاف الصوت" : "اسمع الشرح 🔊"}</button>
            <button className="btn-strong flex-1" onClick={onNavigateNext}>التالي ➜</button>
          </div>

          {place.media?.source ? (
            <div className="mt-2 text-[11px] text-ink-soft">
              مصدر/مرجع:{" "}
              <a className="underline decoration-black/30 hover:decoration-black/60" href={place.media.source} target="_blank" rel="noreferrer">
                {place.media.attribution ?? "فتح المصدر"}
              </a>
            </div>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Lesson, Place } from "../types";
import { normalizeArabic } from "../utils/text";
import Typewriter from "./Typewriter";

type Intent = { action?: "flyTo"; id?: string };
type Msg = { role: "user" | "bot"; text: string; intent?: Intent };

type Reply = { text: string; intent?: Intent };

function findPlace(lesson: Lesson, q: string): Place | null {
  const nq = normalizeArabic(q);
  // Exact-ish match on title or aliases.
  for (const p of lesson.places) {
    const name = normalizeArabic(p.title);
    if (name && nq.includes(name)) return p;
    for (const a of p.aliases ?? []) {
      const na = normalizeArabic(a);
      if (na && nq.includes(na)) return p;
    }
  }
  // Token match (2 tokens) to be forgiving
  const tokens = nq.split(/\s+/).filter(Boolean).filter((t) => t.length >= 3);
  if (!tokens.length) return null;
  let best: { p: Place; score: number } | null = null;
  for (const p of lesson.places) {
    const hay = normalizeArabic(`${p.title} ${(p.aliases ?? []).join(" ")}`);
    const score = tokens.slice(0, 6).reduce((acc, t) => acc + (hay.includes(t) ? 1 : 0), 0);
    if (score >= 2 && (!best || score > best.score)) best = { p, score };
  }
  return best?.p ?? null;
}

function replyForLesson(lesson: Lesson, q: string): Reply | null {
  const nq = normalizeArabic(q);

  // UI guidance / meta
  if (nq.includes("نسب") || nq.includes("ارقام") || nq.includes("أرقام") || nq.includes("شارت") || nq.includes("chart") || nq.includes("رسوم") || nq.includes("بيانات")) {
    return {
      text:
        "عندك لوحة (مؤشرات & رسومات) على يمين الشاشة: Pie لتوزيع الفئات، Bar لأكثر الفئات، و Line (Serial) لزيادة XP وعدد المعالم المكتشفة. غيّر الفلاتر وشوف الرسوم تتغير فوراً.",
    };
  }

  if (nq.includes("صوت") || nq.includes("اتكلم") || nq.includes("تكلم")) {
    return {
      text:
        "على كارت أي معلم (المربع اللي بيظهر على الشمال) هتلاقي زر (اسمع الشرح 🔊). اضغطه وهيقرأ لك شرح المعلم بصوت.",
    };
  }

  if (nq.includes("فيديو") || nq.includes("video") || nq.includes("يوتيوب")) {
    return {
      text:
        "أكيد. افتح أي معلم وهتلاقي (صورة/فيديو) داخل كارت المعلم (لو متاح). قول اسم المعلم وأنا أوديك له مباشرة.",
    };
  }

  // Lesson-specific quick answers + navigation
  if (lesson.id === "water") {
    if (nq.includes("فرق") && (nq.includes("عذبه") || nq.includes("عذبة") || nq.includes("مالحه") || nq.includes("مالحة"))) {
      return { text: "العذبة: النيل/مياه جوفية. المالحة: المتوسط/الأحمر/بحيرات ساحلية. تحب نروح للنيل؟", intent: { action: "flyTo", id: "nile" } };
    }
    if (nq.includes("استخدام") || nq.includes("بنستخدم")) {
      return { text: "العذبة: شرب + زراعة + صناعة. المالحة: صيد + ملاحة + أملاح. تحب مثال على الخريطة؟", intent: { action: "flyTo", id: "redsea" } };
    }
    if (nq.includes("مشكله") || nq.includes("مشكلات") || nq.includes("تلوث") || nq.includes("ندرة")) {
      return { text: "أهم المشكلات: ندرة + تلوث + تغيّر مناخي. مثال: بحيرات ساحلية تتأثر بالتلوث. نروح لبحيرة البردويل؟", intent: { action: "flyTo", id: "bardawil" } };
    }
  }

  if (lesson.id === "minerals") {
    if (nq.includes("ذهب") || nq.includes("السكري")) return { text: "منجم السكري من أشهر أماكن الذهب في مصر. يلا نروح هناك!", intent: { action: "flyTo", id: "sukari" } };
    if (nq.includes("طاقة") && nq.includes("متجددة")) return { text: "طاقة متجددة: شمس (بنبان) + رياح (الزعفرانة). نروح لبنبان؟", intent: { action: "flyTo", id: "aswan-solar" } };
  }

  if (lesson.id === "projects") {
    if (nq.includes("تنمية") || nq.includes("مستدام")) return { text: "التنمية المستدامة: نلبي احتياجات اليوم بدون ما نضيع حق المستقبل. مثال: طاقة شمسية نظيفة في بنبان.", intent: { action: "flyTo", id: "benban" } };
    if (nq.includes("قناة") || nq.includes("السويس")) return { text: "قناة السويس الجديدة ترفع كفاءة المرور الملاحي وتدعم الاقتصاد. يلا نروح لها.", intent: { action: "flyTo", id: "suezcanal" } };
    if (nq.includes("عاصمة") || nq.includes("ادارية") || nq.includes("إدارية")) return { text: "العاصمة الإدارية مدينة حديثة لتخفيف الضغط عن القاهرة وتحسين الخدمات. نروح لها؟", intent: { action: "flyTo", id: "newcap" } };
  }

  // Heuristic: pull bullets from concept cards
  const hits: string[] = [];
  for (const c of lesson.conceptCards) {
    for (const b of c.bullets) {
      const nb = normalizeArabic(b);
      const tokens = nq.split(/\s+/).filter(Boolean).slice(0, 6);
      const score = tokens.reduce((acc, t) => acc + (t.length >= 3 && nb.includes(t) ? 1 : 0), 0);
      if (score >= 2) hits.push(b);
    }
  }
  if (hits.length) return { text: "أقرب معلومة من الدرس: " + hits.slice(0, 2).join(" | ") };

  return null;
}

export default function ChatTutor(props: {
  lesson: Lesson;
  onNavigate: (placeId: string) => void;
  onEarnBadge: (badge: string) => void;
  onToast?: (title: string, body?: string) => void;
}) {
  const { lesson, onNavigate, onEarnBadge, onToast } = props;

  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "bot",
      text:
        "أهلاً! أنا الداشبورد والخريطة الذكية. اسألني أي حاجة: (فين؟ ليه مهم؟ أرقام ونِسَب؟ فيديو؟) وأنا هأجاوبك وهوديك على المكان على الخريطة فوراً.",
    },
  ]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);

  const quickChips = useMemo(() => {
    if (lesson.id === "projects")
      return [
        "يعني إيه تنمية مستدامة؟",
        "فين قناة السويس؟",
        "ورّيني بنبان",
        "العاصمة الإدارية",
        "الدلتا الجديدة",
        "عايز أرقام ونِسَب",
        "ورّيني فيديو",
      ];
    if (lesson.id === "minerals")
      return [
        "إيه هي الموارد المعدنية؟",
        "إيه مصادر الطاقة المتجددة؟",
        "فين بنبان؟",
        "فين الزعفرانة؟",
        "عايز أرقام ونِسَب",
        "ورّيني فيديو",
      ];
    return [
      "فين نهر النيل؟",
      "الفرق بين العذبة والمالحة؟",
      "إيه مشكلات المياه؟",
      "فين بحيرة ناصر؟",
      "عايز أرقام ونِسَب",
      "ورّيني فيديو",
    ];
  }, [lesson.id]);

  const botReply = (payload: Reply) => {
    setTyping(true);
    const id = window.setTimeout(() => {
      setMessages((m) => [...m, { role: "bot", text: payload.text, intent: payload.intent }]);
      setTyping(false);
    }, 240);
    return () => window.clearTimeout(id);
  };

  const send = (q?: string) => {
    const msg = (q ?? text).trim();
    if (!msg) return;

    setMessages((m) => [...m, { role: "user", text: msg }]);
    setText("");

    const place = findPlace(lesson, msg);
    if (place) {
      onNavigate(place.id);
      onToast?.("انتقال للخريطة", `روّحتك لـ ${place.title}`);
      onEarnBadge("✨ شارة: مستكشف الخرائط");
      botReply({ text: `تمام! دي ${place.title}. تحب 3 معلومات سريعة ولا تشوف صورة/فيديو؟`, intent: { action: "flyTo", id: place.id } });
      return;
    }

    const ans = replyForLesson(lesson, msg);
    if (ans) {
      if (ans.intent?.action === "flyTo" && ans.intent.id) onNavigate(ans.intent.id);
      onEarnBadge("💡 شارة: سأل واتعلم");
      botReply(ans);
      return;
    }

    botReply({
      text:
        "مش فاهم قصدك بالكامل. جرّب تكتب اسم معلم (مثال: بنبان / قناة السويس / نهر النيل) أو اسأل عن (الأهداف / المشكلات / الاستخدامات / الأرقام والنسب).",
    });
  };

  const runIntent = (intent?: Intent) => {
    if (!intent?.action) return;
    if (intent.action === "flyTo" && intent.id) {
      onNavigate(intent.id);
      onToast?.("تم!", "نفذت الحركة على الخريطة");
    }
  };

  return (
    <div className="glass rounded-[28px] p-4 shadow-soft relative overflow-hidden scanline">
      <div className="glow-ring animate-pulseGlow" />

      <div className="flex items-center justify-between">
        <div className="panel-title">المساعد الذكي (تكلّم مع الداشبورد)</div>
        <div className="badge">Chat • FlyTo</div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {quickChips.map((c) => (
          <button key={c} className="btn text-xs" onClick={() => send(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="mt-3 h-[240px] overflow-auto rounded-2xl border border-white/10 bg-black/25 p-3">
        <div className="space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
              <div className={m.role === "user" ? "inline-block rounded-2xl bg-white/10 px-3 py-2 text-sm" : "inline-block rounded-2xl bg-black/30 px-3 py-2 text-sm"}>
                <Typewriter text={m.text} speed={m.role === "bot" ? 10 : 0} />
              </div>
              {m.role === "bot" && m.intent?.action === "flyTo" ? (
                <div className="mt-2">
                  <button className="btn text-xs" onClick={() => runIntent(m.intent)}>
                    روح للمكان على الخريطة ➜
                  </button>
                </div>
              ) : null}
            </div>
          ))}

          <AnimatePresence>
            {typing ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-left">
                <div className="inline-block rounded-2xl bg-black/30 px-3 py-2 text-sm text-white/70">… بكتب لك رد</div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="input flex-1"
          placeholder="اسأل سؤال... مثال: فين قناة السويس؟"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
        />
        <button className="btn-strong" onClick={() => send()}>
          إرسال
        </button>
      </div>

      <div className="mt-2 text-xs text-white/65">
        أمثلة: "عايز أرقام ونِسَب" — "ورّيني فيديو" — "فين بنبان" — "ليه المكان ده مهم؟"
      </div>
    </div>
  );
}

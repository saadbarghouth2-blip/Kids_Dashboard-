import { useEffect, useMemo, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Lesson, Place } from "../types";
import { QUESTION_BANK } from "./questionBank";
import type { QuizQuestion } from "./types";
import { findPlaceByText, pickBestQuestion, randomSample } from "./match";
import { speakEgyptian } from "./voice";

type Msg = { role: "user" | "bot"; text: string };

function joinAnswer(q: QuizQuestion) {
  const lines = [q.answer.title, ...q.answer.paragraphs];
  if (q.answer.quickFacts?.length) {
    lines.push("حقائق سريعة:");
    for (const f of q.answer.quickFacts) lines.push(`${f.k}: ${f.v}`);
  }
  return lines.join(" ");
}

export default function QuizAssistant(props: {
  lesson: Lesson;
  voiceEnabled: boolean;
  autoSpeak: boolean;
  onAnswerAction: (q: QuizQuestion, place?: Place | null) => void;
}) {
  const { lesson, voiceEnabled, autoSpeak, onAnswerAction } = props;

  const bank = useMemo(() => QUESTION_BANK.filter((q) => q.lessonId === (lesson.id as any)), [lesson.id]);
  // Increased question limit to provide "more questions"
  const chips = useMemo(() => randomSample(bank, Math.min(bank.length, 120)), [bank]);

  const [messages, setMessages] = useState<Msg[]>([
    { role: "bot", text: "🗺️ أهلاً يا صديقي! أنا الخريطة الذكية 🧠✨ جاهزة أجاوبك على أي سؤال!" },
    { role: "bot", text: "💡 اسألني: فين المكان ده؟ • ليه مهم؟ • اديني 3 حقائق • ورّيني على الخريطة • اشرحلي بالتفصيل!" },
    { role: "bot", text: "🎯 جرّب تضغط على أي سؤال من اللي تحت… أنا في خدمتك!" },
  ]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [challenge, setChallenge] = useState<QuizQuestion | null>(null);
  const [challengeMode, setChallengeMode] = useState(false);

  // Auto-scroll chat to bottom
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, typing]);


  useEffect(() => {
    // reset msgs when lesson changes
    setMessages([
      { role: "bot", text: `🗺️ رائع! دلوقتي إحنا في درس: ${lesson.title}` },
      { role: "bot", text: "✨ أنا جاهزة أساعدك تستكشف كل حاجة! اختار سؤال من تحت أو اكتب اللي في بالك." },
    ]);
    setText("");
  }, [lesson.id]);


  const startChallenge = () => {
    const q = bank[Math.floor(Math.random() * bank.length)];
    setChallenge(q);
    setChallengeMode(true);
    setMessages((m) => [
      ...m,
      { role: "bot", text: `🎯 تحدّي سريع! جاوب: ${q.prompt}` },
    ]);
    if (autoSpeak && voiceEnabled) {
      speakEgyptian(`تحدي سريع. ${q.prompt}`, { enabled: true, autoSpeak: true, rate: 1.02, pitch: 1.05, volume: 1, lang: "ar-EG" });
    }
  };

  const isCorrect = (q: QuizQuestion, userText: string) => {
    const t = userText.toLowerCase();
    const kws = (q.expectedKeywords ?? []).filter(Boolean);
    // accept if any keyword appears OR overlap with title words
    if (kws.some((k) => t.includes(String(k).toLowerCase()))) return true;
    const titleTokens = q.answer.title.split(/\s+/).filter((x) => x.length >= 3).slice(0, 4);
    if (titleTokens.some((k) => t.includes(k.toLowerCase()))) return true;
    return false;
  };

  const reply = (q: QuizQuestion, place?: Place | null) => {
    setTyping(true);
    window.setTimeout(() => {
      const answerText = q.answer.paragraphs.join("\n");
      setMessages((m) => [
        ...m,
        { role: "bot", text: `• ${q.answer.title}\n${answerText}` },
      ]);
      setTyping(false);

      if (autoSpeak && voiceEnabled) {
        speakEgyptian(joinAnswer(q), {
          enabled: true,
          autoSpeak: true,
          rate: 1.02,
          pitch: 1.05,
          volume: 1,
          lang: "ar-EG",
        });
      }
    }, 220);

    onAnswerAction(q, place);
  };

  const send = (forced?: string) => {
    const msg = (forced ?? text).trim();
    if (!msg) return;

    setMessages((m) => [...m, { role: "user", text: msg }]);
    setText("");


    // If we're in challenge mode, evaluate answer first
    if (challengeMode && challenge) {
      const ok = isCorrect(challenge, msg);
      setTyping(true);
      window.setTimeout(() => {
        setTyping(false);
        if (ok) {
          setMessages((m) => [...m, { role: "bot", text: "✅ برافو! إجابتك صح. بص بقى… ده الشرح التفصيلي:" }]);
          reply(challenge, findPlaceByText(lesson, challenge.prompt));
        } else {
          setMessages((m) => [
            ...m,
            { role: "bot", text: "❌ قريبة… جرّب تاني أو قول: (إجابة) بكلمة مفتاحية زي اسم المعلم." },
          ]);
        }
      }, 180);
      return;
    }

    // place intent (by name)
    const place = findPlaceByText(lesson, msg);

    // best question in bank
    const picked = pickBestQuestion(bank, msg);

    if (picked) {
      const pickedPlace = place ?? findPlaceByText(lesson, picked.prompt) ?? findPlaceByText(lesson, picked.answer.title);
      reply(picked, pickedPlace);
      return;
    }

    // If they asked for a place, fabricate an answer using the place
    if (place) {
      const fake: QuizQuestion = {
        id: "adhoc",
        lessonId: lesson.id as any,
        difficulty: 1,
        prompt: msg,
        answer: {
          title: place.title,
          paragraphs: [
            place.summary,
            ...(place.details?.slice(0, 4) ?? ["لو عايز تفاصيل أكتر: افتح كارت المعلم وهتلاقي شرح + فيديو/صورة لو متاحة."]),
            "تحب أسألك سؤال سريع عن المكان ده؟",
          ],
          quickFacts: [
            { k: "الفئة", v: place.category },
            { k: "الإحداثيات", v: `${place.lat.toFixed(3)}, ${place.lng.toFixed(3)}` },
          ],
          nextSuggestions: ["ليه المكان ده مهم؟", "اديني 3 حقائق سريعة", "ورّيني فيديو/صورة"],
        },
        action: { flyToPlaceId: place.id, highlightPlaceIds: [place.id], setLayers: { showLabels: true } },
      };
      reply(fake, place);
      return;
    }

    setTyping(true);
    window.setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          text:
            "مش لاقي السؤال بالظبط… جرّب تسأل بطريقة أبسط: (فين …؟ ليه … مهم؟ اشرحلي …) أو اختار سؤال من الأزرار.",
        },
      ]);
      setTyping(false);
    }, 200);
  };

  return (
    <div className="glass rounded-[28px] p-3 shadow-soft relative overflow-hidden scanline flex flex-col">
      <div className="glow-ring animate-pulseGlow" />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="map-character">🗺️</div>
          <div>
            <div className="panel-title text-sm">الخريطة الذكية</div>
            <div className="text-xs opacity-70">أنا هنا عشان أساعدك!</div>
          </div>
        </div>
        <div className="badge text-xs">AI 🧠</div>
      </div>


      <div className="mt-2 flex items-center gap-2">
        <button className="btn text-xs py-1 px-2" onClick={startChallenge}>تحدّي 🎯</button>
        <button className="btn text-xs py-1 px-2" onClick={() => send("اديني سؤال تحدي")}>صعب 🔥</button>
        <button className="btn text-xs py-1 px-2" onClick={() => { setChallenge(null); setChallengeMode(false); }}>إلغاء</button>
      </div>

      {/* Question chips - animated list */}
      <div className="mt-3 flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-[120px]">
        <div className="flex flex-col gap-2">
          <AnimatePresence mode="popLayout">
            {chips.map((c, i) => (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
                className="group relative flex items-center gap-3 w-full p-2.5 rounded-xl bg-white/40 hover:bg-white/70 border border-white/30 shadow-sm hover:shadow-md transition-all text-right"
                onClick={() => send(c.prompt)}
              >
                <span className="flex-none text-lg group-hover:scale-110 transition-transform">
                  {i % 2 === 0 ? "🤔" : "💡"}
                </span>
                <span className="text-sm font-bold text-ink-dark group-hover:text-primary-dark transition-colors">
                  {c.prompt}
                </span>
                <div className="absolute left-2 opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                  👈
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div
        ref={chatContainerRef}
        className="mt-2 flex-1 min-h-[140px] max-h-[180px] overflow-auto rounded-2xl border border-ink panel-muted p-2"
      >
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={
                "inline-block my-1 max-w-[92%] rounded-3xl px-3 py-2 whitespace-pre-line " +
                (m.role === "user"
                  ? "bubble-user"
                  : "bubble-bot")
              }
            >
              <div className="text-sm leading-relaxed">{m.text}</div>
            </motion.div>
          </div>
        ))}

        <AnimatePresence>
          {typing ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-left mt-2">
              <span className="inline-block rounded-3xl px-3 py-2 bubble-typing text-sm">
                الخريطة بتفكر…
              </span>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="input focus-ring flex-1 text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="اكتب سؤالك… مثال: فين قناة السويس؟"
        />
        <button className="btn-strong" onClick={() => send()}>
          اسأل
        </button>
      </div>

      <div className="mt-2 text-xs text-ink-soft">
        جرّب: “اديني أرقام” — “ورّيني فيديو” — “اسمع الشرح بصوت” — “فين …؟”
      </div>
    </div>
  );
}

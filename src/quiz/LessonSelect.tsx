import { motion } from "framer-motion";
import type { Lesson } from "../types";
import FloatingMapItems from "../components/FloatingMapItems";

export default function LessonSelect(props: { lessons: Lesson[]; onPick: (id: string) => void }) {
  const { lessons, onPick } = props;
  return (
    <div className="h-screen w-screen text-ink relative overflow-hidden grid place-items-center">
      {/* Dynamic Map Elements */}
      <FloatingMapItems />

      <div className="max-w-6xl w-full px-4 relative z-10">
        <div className="glass rounded-[34px] p-6 shadow-soft relative overflow-hidden scanline">
          <div className="glow-ring" />
          <div className="text-3xl font-extrabold font-display">Dashboard أسئلة تفاعلية (مصري + خريطة)</div>
          <div className="mt-2 text-sm text-ink-muted leading-relaxed">
            هنا الداشبورد عبارة عن أسئلة كتير جدًا عن الدروس. الخريطة “هترد عليك”:
            هتروح للمعلم، تظلل، ترسم تلقائي، وتشرح بصوت مصري.
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {lessons.map((l, idx) => (
              <motion.button
                key={l.id}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.99 }}
                className="text-right glass rounded-[28px] p-5 shadow-soft relative overflow-hidden focus-ring"
                onClick={() => onPick(l.id)}
              >
                <div className="glow-ring" />
                <div className="badge mb-2">Lesson {idx + 1}</div>
                <div className="text-xl font-extrabold font-display">{l.title}</div>
                <div className="mt-2 text-sm text-ink-muted">
                  {l.objectives.slice(0, 3).map((o) => (
                    <div key={o}>• {o}</div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="badge">{l.places.length} معلم</span>
                  <span className="badge">سؤال/إجابة</span>
                  <span className="badge">Voice</span>
                </div>
                <div className="mt-4">
                  <span className="btn-strong inline-flex">ابدأ الأسئلة ➜</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

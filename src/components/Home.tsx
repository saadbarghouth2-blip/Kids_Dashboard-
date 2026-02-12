import { motion } from "framer-motion";
import type { Lesson } from "../types";

export default function Home(props: { lessons: Lesson[]; onOpen: (id: string) => void }) {
  const { lessons, onOpen } = props;

  return (
    <div className="h-full grid place-items-center">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 glass rounded-[34px] p-6 shadow-soft relative overflow-hidden scanline">
          <div className="glow-ring" />
          <div className="text-3xl font-extrabold">Kids Geo Dashboard</div>
          <div className="mt-2 text-sm text-white/80 leading-relaxed">
            اختار درس من الوحدة الثالثة (كنوز مصر). الداشبورد فيه خريطة تفاعلية + أنشطة + مساعد ذكي بيوديك على المعالم ويفهمك بالمعلومة.
          </div>

          <div className="mt-4 grid gap-3">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="font-extrabold">مميزات سريعة</div>
              <ul className="text-sm text-white/85 list-disc pr-5 mt-2 space-y-1">
                <li>Markers متحركة + طبقات + فلاتر</li>
                <li>لو ضغطت على أي كارت/زر يروح للخريطة</li>
                <li>Drawing + قياس مسافة</li>
                <li>Chat Tutor: اسألني وأوديك للمكان</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
          {lessons.map((l, idx) => (
            <motion.button
              key={l.id}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onOpen(l.id)}
              className="text-right glass rounded-[34px] p-6 shadow-soft relative overflow-hidden scanline focus-ring"
            >
              <div className="glow-ring" />
              <div className="badge mb-2">Lesson {idx + 1}</div>
              <div className="text-xl font-extrabold">{l.title}</div>
              {l.ageHint ? <div className="text-xs text-white/70 mt-1">{l.ageHint}</div> : null}
              <div className="mt-3 text-sm text-white/80 leading-relaxed">
                {l.objectives.slice(0, 2).map((o) => <div key={o}>• {o}</div>)}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="badge">{l.places.length} معلم</span>
                <span className="badge">{l.activities.length} نشاط</span>
                <span className="badge">Interactive</span>
              </div>

              <div className="mt-4">
                <span className="btn-strong inline-flex">ابدأ ➜</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

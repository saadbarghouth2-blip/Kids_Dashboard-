import { motion } from "framer-motion";
import type { Lesson } from "../types";

export default function TopBar(props: {
  lesson: Lesson | null;
  view: "home" | "lesson";
  lessons: Lesson[];
  onSwitchLesson: (id: string) => void;
  onGoHome: () => void;
  xp: number;
  progress: number;
  discovered: number;
  total: number;
}) {
  const { lesson, view, lessons, onSwitchLesson, onGoHome, xp, progress, discovered, total } = props;

  return (
    <header className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="h-11 w-11 rounded-3xl glass shadow-soft grid place-items-center font-extrabold"
        >
          M
        </motion.div>
        <div className="leading-tight">
          <div className="font-extrabold">Dashboard تفاعلي للأطفال</div>
          <div className="text-xs text-white/70">
            {view === "home" ? "اختر درس وابدأ الاستكشاف" : `أنت داخل: ${lesson?.title ?? ""}`}
          </div>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-2 glass rounded-3xl px-3 py-2 shadow-soft">
        <div className="text-xs text-white/70">XP</div>
        <div className="font-extrabold">{xp}</div>
        <div className="w-[1px] h-5 bg-white/10 mx-1" />
        <div className="text-xs text-white/70">التقدم</div>
        <div className="font-extrabold">{progress}%</div>
        <div className="w-[1px] h-5 bg-white/10 mx-1" />
        <div className="text-xs text-white/70">اكتشاف</div>
        <div className="font-extrabold">{discovered}/{total}</div>
      </div>

      <div className="flex items-center gap-2">
        {view === "lesson" ? (
          <select
            className="focus-ring rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
            value={lesson?.id ?? ""}
            onChange={(e) => onSwitchLesson(e.target.value)}
          >
            {lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
        ) : null}
        <button className="btn-strong" onClick={onGoHome}>الرئيسية</button>
      </div>
    </header>
  );
}

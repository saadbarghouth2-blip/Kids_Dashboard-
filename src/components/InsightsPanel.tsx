import { useMemo, useState, useEffect } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import type { Lesson, PlaceCategory } from "../types";

type Point = { t: number; xp: number; discovered: number };

function fmtTime(t: number) {
  const d = new Date(t);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function InsightsPanel(props: {
  lesson: Lesson;
  discoveredCount: number;
  totalCount: number;
  xp: number;
  timeline: Point[];
  onFocusCategory?: (category: PlaceCategory) => void;
}) {
  const { lesson, discoveredCount, totalCount, xp, timeline, onFocusCategory } = props;

  const byCat = useMemo(() => {
    const m = new Map<PlaceCategory, number>();
    for (const p of lesson.places) m.set(p.category, (m.get(p.category) ?? 0) + 1);
    return Array.from(m.entries())
      .map(([k, v]) => ({ name: k, value: v }))
      .sort((a, b) => b.value - a.value);
  }, [lesson.places]);

  const topCats = useMemo(() => byCat.slice(0, 6), [byCat]);
  const pieData = useMemo(() => byCat.slice(0, 8), [byCat]);
  const progressPct = totalCount ? Math.round((discoveredCount / totalCount) * 100) : 0;
  const lineData = useMemo(
    () => (timeline ?? []).map((p) => ({ time: fmtTime(p.t), xp: p.xp, discovered: p.discovered })),
    [timeline]
  );

  const questionPrompts = useMemo(
    () =>
      topCats.slice(0, 3).map((cat, idx) => ({
        id: `${cat.name}-${idx}`,
        title: `اسأل عن ${cat.name}`,
        detail: `${cat.value} معلم في هذه الفئة على الخريطة، غيّر المنظور وشوفهم في جولة سريعة.`,
        value: cat.value,
        category: cat.name,
      })),
    [topCats]
  );

  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(questionPrompts[0]?.id ?? null);
  useEffect(() => {
    setActiveQuestionId(questionPrompts[0]?.id ?? null);
  }, [questionPrompts]);
  const activeQuestion = questionPrompts.find((q) => q.id === activeQuestionId) ?? questionPrompts[0] ?? null;

  return (
    <div className="glass rounded-3xl border border-ink/20 panel-muted p-4 shadow-soft space-y-4">
      <div className="space-y-2">
        <div className="panel-title">مؤشرات + أسئلة</div>
        <div className="text-sm text-ink-soft leading-relaxed">
          الأرقام هنا تسجّل التقدم وتعطيك أسئلة جاهزة تبرز المعالم وتدفعك تفتح الخريطة في الزوايا الصحيحة.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <button
          type="button"
          className="rounded-3xl border border-ink/20 bg-surface-strong p-4 text-left transition hover:border-ink/40"
        >
          <div className="text-xs text-ink-muted">تقدم الاستكشاف</div>
          <div className="text-2xl font-display font-extrabold text-ink">{progressPct}%</div>
          <div className="text-[12px] text-ink-soft">{discoveredCount} / {totalCount} معالم</div>
        </button>
        <button
          type="button"
          className="rounded-3xl border border-ink/20 bg-surface-strong p-4 text-left transition hover:border-ink/40"
        >
          <div className="text-xs text-ink-muted">النقاط (XP)</div>
          <div className="text-2xl font-display font-extrabold text-ink">{xp}</div>
          <div className="text-[12px] text-ink-soft">مجموع الحلول الصحيحة والأنشطة التفاعلية.</div>
        </button>
        <button
          type="button"
          className="rounded-3xl border border-ink/20 bg-surface-strong p-4 text-left transition hover:border-ink/40"
        >
          <div className="text-xs text-ink-muted">أكثر فئة ظاهرة</div>
          <div className="text-base font-extrabold text-ink">{topCats[0]?.name ?? "—"}</div>
          <div className="text-[12px] text-ink-soft">{topCats[0]?.value ?? 0} معالم</div>
        </button>
      </div>

      {questionPrompts.length ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-ink-muted">أسئلة جاهزة</div>
            <div className="text-[11px] text-ink-soft">اضغط على البطاقة عشان تبرز الفئة وتنطّق الخريطة.</div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {questionPrompts.map((q) => (
              <button
                key={q.id}
                type="button"
                className={`btn text-xs ${activeQuestionId === q.id ? "btn-active" : ""}`}
                onClick={() => {
                  setActiveQuestionId(q.id);
                  onFocusCategory?.(q.category);
                }}
              >
                {q.title}
              </button>
            ))}
          </div>
          {activeQuestion ? (
            <div className="rounded-3xl border border-ink/20 bg-white/10 p-3 space-y-2">
              <div className="text-sm font-display text-ink">{activeQuestion.title}</div>
              <div className="text-xs text-ink-soft leading-relaxed">{activeQuestion.detail}</div>
              <div className="inline-flex items-center gap-2 text-[12px]">
                <span className="badge">{activeQuestion.value} معالم</span>
                <span className="text-ink-muted">ركز على الخريطة وابدأ الجولة</span>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-3xl border border-ink/20 bg-white/10 p-3 space-y-2">
          <div className="text-xs font-semibold text-ink-muted">توزيع المعالم (Pie)</div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3}>
                  {pieData.map((_, i) => (
                    <Cell key={i} />
                  ))}
                </Pie>
                <RTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-3xl border border-ink/20 bg-white/10 p-3 space-y-2">
            <div className="text-xs font-semibold text-ink-muted">أكثر 6 فئات (Bar)</div>
            <div className="h-[190px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCats}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} hide />
                  <RTooltip />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-3xl border border-ink/20 bg-white/10 p-3 space-y-2">
            <div className="text-xs font-semibold text-ink-muted">سجل التقدم (Line)</div>
            <div className="h-[190px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" allowDecimals={false} hide />
                  <YAxis yAxisId="right" orientation="right" allowDecimals={false} hide />
                  <RTooltip />
                  <Line yAxisId="left" type="monotone" dataKey="xp" dot={false} strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="discovered" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

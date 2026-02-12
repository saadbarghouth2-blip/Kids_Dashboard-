import type { Lesson, Place } from "../types";
import type { QuizQuestion } from "./types";

function norm(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/[إأآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

export function findPlaceByText(lesson: Lesson, text: string): Place | null {
  const t = norm(text);
  for (const p of lesson.places) {
    const keys = [p.title, ...(p.aliases ?? [])].map(norm);
    if (keys.some((k) => k && t.includes(k))) return p;
  }
  return null;
}

export function pickBestQuestion(bank: QuizQuestion[], text: string): QuizQuestion | null {
  const t = norm(text);
  if (!t) return null;

  // Exact-ish prompt match
  const exact = bank.find((q) => norm(q.prompt) === t);
  if (exact) return exact;

  // Keyword scoring
  let best: { q: QuizQuestion; score: number } | null = null;
  for (const q of bank) {
    const p = norm(q.prompt);
    let score = 0;
    if (p.includes(t) || t.includes(p)) score += 6;

    const kws = q.expectedKeywords ?? [];
    for (const k of kws) {
      const nk = norm(k);
      if (nk && t.includes(nk)) score += 3;
    }

    // token overlap
    const tokens = t.split(" ").filter(Boolean).slice(0, 8);
    for (const tok of tokens) {
      if (tok.length >= 3 && p.includes(tok)) score += 1;
    }

    if (!best || score > best.score) best = { q, score };
  }

  if (!best || best.score < 2) return null;
  return best.q;
}

export function randomSample<T>(arr: T[], n: number) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

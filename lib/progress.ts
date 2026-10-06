import type { ProjectState } from "./types";
import type { LifeEntry } from "./life";
import { dayBefore, localDay, num, recentDays } from "./life";
import type { Trade } from "../components/TradingProvider";

export function revisionPlan(state: ProjectState, now = new Date()) {
  return state.chapters
    .map((chapter) => {
      const errors = state.errors.filter(
        (e) => e.chapterId === chapter.id && e.status !== "mastered",
      );
      const due = errors.filter(
        (e) => !e.nextReviewAt || Date.parse(e.nextReviewAt) <= now.getTime(),
      );
      const exam = state.tasks
        .filter(
          (t) =>
            t.kind === "exam" &&
            t.status !== "done" &&
            t.subjectId === chapter.subjectId &&
            t.dueAt &&
            Date.parse(t.dueAt) >= now.getTime() &&
            Date.parse(t.dueAt) <= now.getTime() + 14 * 86400000,
        )
        .sort((a, b) => a.dueAt!.localeCompare(b.dueAt!))[0];
      const lapses = errors.reduce((s, e) => s + (e.lapses || 0), 0);
      const weak = ["discover", "learning", "reinforce"].includes(
        chapter.status,
      );
      return {
        chapter,
        errors,
        due,
        exam,
        lapses,
        score: due.length * 5 + lapses * 2 + (exam ? 10 : 0) + (weak ? 3 : 0),
      };
    })
    .filter((x) => x.score > 0)
    .sort(
      (a, b) => b.score - a.score || a.chapter.id.localeCompare(b.chapter.id),
    );
}
export function resultInR(trade: Trade, risk: number | null, fees = 0) {
  if (
    trade.status !== "closed" ||
    trade.exit == null ||
    risk == null ||
    !Number.isFinite(risk) ||
    risk <= 0 ||
    !Number.isFinite(fees) ||
    fees < 0
  )
    return null;
  const net =
    (trade.exit - trade.entry) *
      trade.quantity *
      (trade.direction === "long" ? 1 : -1) -
    fees;
  return Number.isFinite(net / risk) ? net / risk : null;
}
export function healthWindow(entries: LifeEntry[], today: string, count = 30) {
  const days = recentDays(today, count);
  const own = entries.filter((e) => e.universe === "health" && !e.archived);
  return days.map((day) => {
    const daily = own.find((e) => e.kind === "health-day" && e.day === day);
    return {
      day,
      sleep: num(daily, "sleep"),
      energy: num(daily, "energy"),
      water: num(daily, "water"),
      mood: num(daily, "mood"),
      activity: own
        .filter((e) => e.kind === "workout" && e.day === day)
        .reduce((s, e) => s + (e.value || 0), 0),
    };
  });
}
export function habitWeek(entries: LifeEntry[], today: string) {
  const days = new Set(recentDays(today));
  return entries
    .filter(
      (e) =>
        e.universe === "health" &&
        e.kind === "habit" &&
        !e.archived &&
        e.data.status === "active",
    )
    .map((habit) => ({
      habit,
      days: new Set(
        entries
          .filter(
            (e) =>
              e.kind === "habit-check" &&
              !e.archived &&
              e.data.habitId === habit.id &&
              e.data.done === true &&
              days.has(e.day),
          )
          .map((e) => e.day),
      ).size,
    }));
}
export function weeklyMemory(entries: LifeEntry[], today: string) {
  const start = dayBefore(today, 6);
  return entries.filter(
    (e) =>
      e.universe === "islam" &&
      e.kind === "memorization" &&
      !e.archived &&
      typeof e.data.lastReviewed === "string" &&
      !Number.isNaN(Date.parse(e.data.lastReviewed)) &&
      localDay(new Date(e.data.lastReviewed)) >= start &&
      localDay(new Date(e.data.lastReviewed)) <= today,
  ).length;
}
export type MemoryReview = {
  at: string;
  ratingLabel: string;
  nextReview: string;
};
export function memoryHistory(entry: LifeEntry): MemoryReview[] {
  try {
    const parsed = JSON.parse(String(entry.data.reviewHistory || "[]"));
    return Array.isArray(parsed)
      ? parsed
          .filter(
            (r) =>
              r &&
              typeof r.at === "string" &&
              typeof r.ratingLabel === "string" &&
              typeof r.nextReview === "string",
          )
          .slice(-100)
      : [];
  } catch {
    return [];
  }
}
export type SearchItem = {
  id: string;
  title: string;
  detail: string;
  universe: string;
  href: string;
};
export function searchIndex(
  state: ProjectState,
  entries: LifeEntry[],
  trades: Trade[],
): SearchItem[] {
  const subject = (id?: string | null) =>
    state.subjects.find((s) => s.id === id)?.name || "";
  const academic = (
    kind: string,
    records: Array<{
      id: string;
      title: string;
      subjectId?: string | null;
      details?: string | null;
    }>,
    href: string,
  ) =>
    records.map((e) => ({
      id: kind + e.id,
      title: e.title,
      detail: [kind, subject(e.subjectId), e.details]
        .filter(Boolean)
        .join(" · "),
      universe: "Académie",
      href,
    }));
  const routes: Record<string, string> = {
    prayers: "prayers",
    quran: "quran",
    memorization: "quran",
    learning: "learning",
    goal: "goals",
    resource: "resources",
    plan: "planning",
    "health-day": "daily",
    habit: "habits",
    "habit-check": "habits",
    workout: "activity",
    reflection: "journal",
  };
  const names: Record<string, string> = {
    islam: "Islam",
    finance: "Finance",
    health: "Santé",
  };
  return [
    ...academic("Tâche", state.tasks, "/academic/tasks"),
    ...academic("Chapitre", state.chapters, "/academic/subjects"),
    ...academic("Erreur", state.errors, "/academic/errors"),
    ...academic("Objectif", state.goals, "/academic/goals"),
    ...academic("Note", state.grades, "/academic/grades"),
    ...academic("Ressource", state.resources, "/academic/resources"),
    ...entries
      .filter((e) => !e.archived && e.kind !== "habit-check")
      .map((e) => ({
        id: e.id,
        title: e.title,
        detail: Object.entries(e.data)
          .filter(
            ([key, value]) =>
              typeof value === "string" &&
              ![
                "path",
                "fileData",
                "nextReviewAt",
                "moduleId",
                "tradeId",
                "courseId",
                "answerKey",
                "reviewHistory",
              ].includes(key),
          )
          .map(([, v]) => String(v))
          .join(" · "),
        universe: names[e.universe],
        href: `/${e.universe}/${e.data.studioType ? "learning" : e.universe === "islam" && e.kind === "reflection" ? "quran" : routes[e.kind] || ""}`,
      })),
    ...trades.map((t) => ({
      id: "trade" + t.id,
      title: t.asset + " · " + t.direction,
      detail: [t.setup, t.note].filter(Boolean).join(" · "),
      universe: "Finance",
      href: "/finance/journal",
    })),
  ];
}
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export function findItems(items: SearchItem[], query: string) {
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return items
    .filter((i) =>
      terms.every((t) =>
        normalize(i.title + " " + i.detail + " " + i.universe).includes(t),
      ),
    )
    .sort(
      (a, b) =>
        Number(normalize(b.title).includes(normalize(query))) -
          Number(normalize(a.title).includes(normalize(query))) ||
        a.title.localeCompare(b.title, "fr"),
    );
}
export function questionVersion(q: LifeEntry) {
  return JSON.stringify([
    q.title,
    q.data.instructions ?? "",
    q.data.solution ?? "",
    q.data.answerKey ?? "",
    ...["A", "B", "C", "D"].map((k) => q.data["option" + k] ?? ""),
  ]);
}

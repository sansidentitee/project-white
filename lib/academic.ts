import type { AcademicError, ProjectState, Task } from "./types";
import { generalAverage, subjectAverage } from "./grades";

export type Rating = "again" | "hard" | "good" | "easy";
export function reviewError(
  card: AcademicError,
  rating: Rating,
  now = new Date(),
): Partial<AcademicError> {
  const old = Math.max(1, card.intervalDays || 1);
  const intervalDays =
    rating === "again"
      ? 0
      : rating === "hard"
        ? Math.max(1, old * 1.2)
        : rating === "good"
          ? Math.max(3, old * 2.5)
          : Math.max(7, old * 3.5);
  return {
    intervalDays,
    repetitions: (card.repetitions || 0) + 1,
    lapses: (card.lapses || 0) + (rating === "again" ? 1 : 0),
    status: rating === "again" ? "open" : "review",
    lastReviewedAt: now.toISOString(),
    nextReviewAt: new Date(
      now.getTime() + (rating === "again" ? 600000 : intervalDays * 86400000),
    ).toISOString(),
  };
}
export function priorities(tasks: Task[], now = new Date()) {
  const score = (t: Task) => {
    const days = t.dueAt
      ? (Date.parse(t.dueAt) - now.getTime()) / 86400000
      : 30;
    return (
      Math.max(0, 7 - days) * 10 +
      (t.kind === "exam" ? 30 : 0) +
      (t.quadrant === "do" ? 25 : 0) +
      (t.status === "blocked" ? 10 : 0)
    );
  };
  return tasks
    .filter((t) => t.status !== "done" && t.quadrant !== "eliminate")
    .sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id))
    .slice(0, 3);
}
export function academicRisk(
  state: ProjectState,
  subjectId: string,
  now = new Date(),
) {
  const avg = subjectAverage(state.grades, subjectId);
  const grades = state.grades
    .filter((g) => g.subjectId === subjectId)
    .sort((a, b) => Date.parse(a.takenAt) - Date.parse(b.takenAt));
  const trend =
    grades.length > 1
      ? (grades.at(-1)!.score / grades.at(-1)!.outOf) * 20 -
        (grades[0].score / grades[0].outOf) * 20
      : 0;
  const late = state.tasks.some(
    (t) =>
      t.subjectId === subjectId &&
      t.status !== "done" &&
      t.dueAt &&
      Date.parse(t.dueAt) < now.getTime(),
  );
  const dueErrors = state.errors.filter(
    (e) =>
      e.subjectId === subjectId &&
      (!e.nextReviewAt || Date.parse(e.nextReviewAt) <= now.getTime()) &&
      e.status !== "mastered",
  ).length;
  const weak = state.chapters.some(
    (c) => c.subjectId === subjectId && c.status === "reinforce",
  );
  const score =
    (avg !== null && avg < 10 ? 3 : avg !== null && avg < 12 ? 1 : 0) +
    (trend < -2 ? 1 : 0) +
    (late ? 2 : 0) +
    (dueErrors >= 3 ? 1 : 0) +
    (weak ? 1 : 0);
  return {
    label: score >= 3 ? "Prioritaire" : score >= 1 ? "À surveiller" : "Stable",
    score,
    avg,
    trend,
    hasData:
      grades.length > 0 ||
      state.tasks.some((t) => t.subjectId === subjectId) ||
      state.chapters.some((c) => c.subjectId === subjectId),
  };
}
export function weeklyReview(state: ProjectState, now = new Date()) {
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() - ((end.getDay() + 6) % 7));
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  const inside = (value?: string | null) =>
    !!value &&
    Date.parse(value) >= start.getTime() &&
    Date.parse(value) < end.getTime();
  const sessions = state.sessions.filter((s) => inside(s.endedAt));
  return {
    start,
    end,
    planned: state.tasks
      .filter((t) => inside(t.plannedStart))
      .reduce((a, t) => a + t.durationMin, 0),
    actual: sessions.reduce((a, s) => a + s.durationMin, 0),
    completed: state.tasks.filter((t) => inside(t.completedAt)).length,
    mastered: state.errors.filter(
      (e) => inside(e.lastReviewedAt) && (e.intervalDays || 0) >= 7,
    ).length,
    grades: state.grades.filter((g) => inside(g.takenAt)).length,
    averageBefore: generalAverage(
      state.grades.filter((g) => Date.parse(g.takenAt) < start.getTime()),
    ),
    averageAfter: generalAverage(
      state.grades.filter((g) => Date.parse(g.takenAt) < end.getTime()),
    ),
    weak: state.chapters.filter((c) => c.status === "reinforce"),
    risks: state.subjects
      .map((s) => ({ subject: s, ...academicRisk(state, s.id, now) }))
      .filter((r) => r.score > 0),
  };
}

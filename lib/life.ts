export type LifeUniverse = "islam" | "finance" | "health";
export type LifeKind =
  | "prayers"
  | "quran"
  | "memorization"
  | "learning"
  | "goal"
  | "resource"
  | "plan"
  | "health-day"
  | "habit"
  | "habit-check"
  | "workout"
  | "reflection";
export type LifeData = Record<string, string | number | boolean | null>;
export type LifeEntry = {
  id: string;
  universe: LifeUniverse;
  kind: LifeKind;
  title: string;
  day: string;
  value: number | null;
  data: LifeData;
  key: string | null;
  archived: boolean;
  createdAt: string;
};
export type LifeInput = Omit<
  LifeEntry,
  "id" | "createdAt" | "archived" | "key" | "value" | "data"
> & {
  id?: string;
  key?: string | null;
  value?: number | null;
  data?: LifeData;
};
export const prayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
const kinds: Record<LifeUniverse, LifeKind[]> = {
  islam: [
    "prayers",
    "quran",
    "memorization",
    "learning",
    "goal",
    "resource",
    "reflection",
  ],
  finance: ["plan", "learning", "goal", "resource", "reflection"],
  health: [
    "health-day",
    "habit",
    "habit-check",
    "workout",
    "goal",
    "resource",
    "reflection",
  ],
};
export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function dayBefore(day: string, days = 1) {
  const d = new Date(day + "T12:00:00");
  d.setDate(d.getDate() - days);
  return localDay(d);
}
export function recentDays(day: string, count = 7) {
  return Array.from({ length: count }, (_, i) => dayBefore(day, count - 1 - i));
}
export function num(entry: LifeEntry | undefined, field: string) {
  const n = entry?.data[field];
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}
export function text(entry: LifeEntry | undefined, field: string) {
  const s = entry?.data[field];
  return typeof s === "string" ? s : "";
}
export function validDay(day: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const d = new Date(day + "T12:00:00");
  return !Number.isNaN(d.getTime()) && localDay(d) === day;
}
export function validateLife(input: LifeInput) {
  if (!kinds[input.universe]?.includes(input.kind))
    throw new Error("Type incompatible avec cet univers.");
  if (!input.title.trim() || input.title.length > 300)
    throw new Error("Un titre de 1 à 300 caractères est requis.");
  if (!validDay(input.day)) throw new Error("Choisis une date valide.");
  if (input.value != null && (!Number.isFinite(input.value) || input.value < 0))
    throw new Error("La valeur doit être positive ou nulle.");
  if (
    input.data &&
    Object.values(input.data).some(
      (v) => typeof v === "number" && !Number.isFinite(v),
    )
  )
    throw new Error("Valeur numérique invalide.");
  if (
    ["quran", "workout", "plan"].includes(input.kind) &&
    (!(Number(input.value) > 0) || Number(input.value) > 1440)
  )
    throw new Error("La durée doit être comprise entre 1 et 1440 minutes.");
  if (input.kind === "goal" && !(Number(input.data?.target) > 0))
    throw new Error("L’objectif doit avoir une cible supérieure à zéro.");
  if (
    input.kind === "learning" &&
    input.data?.progress != null &&
    (Number(input.data.progress) < 0 || Number(input.data.progress) > 100)
  )
    throw new Error("La progression doit être comprise entre 0 et 100.");
  if (
    input.kind === "plan" &&
    input.data?.time &&
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(input.data.time))
  )
    throw new Error("Utilise une heure au format HH:MM.");
  if (input.kind === "health-day") {
    const ranges: Record<string, [number, number]> = {
      sleep: [0, 24],
      water: [0, 30000],
      steps: [0, 200000],
      energy: [1, 5],
      mood: [1, 5],
    };
    for (const [field, [min, max]] of Object.entries(ranges)) {
      const v = input.data?.[field];
      if (v != null && (typeof v !== "number" || v < min || v > max))
        throw new Error(`Valeur incorrecte : ${field}.`);
    }
  }
  if (input.kind === "resource" && input.data?.url)
    safeUrl(String(input.data.url));
}
export function safeUrl(raw: string) {
  const url = new URL(raw);
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error("Utilise une adresse http ou https.");
  return url.href;
}
export function reviewDue(entry: LifeEntry, now = new Date()) {
  const day = text(entry, "nextReview"),
    at = text(entry, "nextReviewAt");
  if (at && localDay(new Date(at)) === day)
    return Date.parse(at) <= now.getTime();
  return !day || day <= localDay(now);
}
export function habitStreak(
  entries: LifeEntry[],
  habitId: string,
  today: string,
) {
  const dates = new Set(
    entries
      .filter(
        (e) =>
          !e.archived &&
          e.kind === "habit-check" &&
          e.data.habitId === habitId &&
          e.data.done === true,
      )
      .map((e) => e.day),
  );
  let day = dates.has(today) ? today : dayBefore(today),
    streak = 0;
  while (dates.has(day)) {
    streak++;
    day = dayBefore(day);
  }
  return streak;
}
export function healthSummary(entries: LifeEntry[], today: string) {
  const days = new Set(recentDays(today));
  const daily = entries.filter(
    (e) => !e.archived && e.kind === "health-day" && days.has(e.day),
  );
  const average = (field: string) => {
    const values = daily
      .map((e) => num(e, field))
      .filter((v): v is number => v !== null);
    return values.length
      ? values.reduce((s, v) => s + v, 0) / values.length
      : null;
  };
  return {
    loggedDays: daily.length,
    sleep: average("sleep"),
    energy: average("energy"),
    water: average("water"),
    activity: entries
      .filter((e) => !e.archived && e.kind === "workout" && days.has(e.day))
      .reduce((s, e) => s + (e.value || 0), 0),
  };
}

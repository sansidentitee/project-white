import type { Subject, Task } from "./types";
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const weekdays = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];
export function parsePronoteText(
  text: string,
  subjects: Subject[],
  now = new Date(),
): Omit<Task, "id">[] {
  return text
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((raw) => {
      const lower = normalize(raw);
      const candidates = subjects
        .flatMap((s) => {
          const aliases = [s.name, s.shortName];
          const name = normalize(s.name);
          if (name.includes("experte"))
            aliases.push("maths expertes", "maths exp", "me");
          else if (name.includes("math")) aliases.push("maths", "math");
          if (name.includes("physique"))
            aliases.push("pc", "physique", "chimie");
          if (name.includes("histoire"))
            aliases.push("hg", "histoire", "histoire geo");
          if (name.includes("philo")) aliases.push("philo");
          if (name.includes("enseignement")) aliases.push("es");
          return aliases.map((alias) => ({
            subject: s,
            alias: normalize(alias),
          }));
        })
        .sort((a, b) => b.alias.length - a.alias.length);
      const match = candidates.find((c) =>
        (" " + lower + " ").includes(" " + c.alias + " "),
      );
      const due = new Date(now);
      due.setHours(23, 59, 0, 0);
      let hasDue = false;
      if (lower.includes("aujourd'hui")) {
        hasDue = true;
      } else if (/\bdemain\b/.test(lower)) {
        due.setDate(due.getDate() + 1);
        hasDue = true;
      } else {
        const day = weekdays.findIndex((d) =>
          new RegExp("\\b" + d + "\\b").test(lower),
        );
        if (day >= 0) {
          due.setDate(due.getDate() + ((day - due.getDay() + 7) % 7 || 7));
          hasDue = true;
        } else {
          const date = lower.match(
            /\b(\d{1,2})[/.](\d{1,2})(?:[/.](\d{4}))?\b/,
          );
          if (date) {
            const d = new Date(
              Number(date[3] || now.getFullYear()),
              Number(date[2]) - 1,
              Number(date[1]),
              23,
              59,
            );
            if (
              d.getMonth() === Number(date[2]) - 1 &&
              d.getDate() === Number(date[1])
            ) {
              due.setTime(d.getTime());
              hasDue = true;
            }
          }
        }
      }
      const minutes = lower.match(/\b(\d+)\s*(?:min|mn)\b/);
      const hours = lower.match(/\b(\d+)\s*h(?:\s*(\d{1,2}))?\b/);
      const kind = /\b(controle|ds|evaluation|interro|oral)\b/.test(lower)
        ? "exam"
        : /revis|apprendre|relire|fiche/.test(lower)
          ? "study"
          : "homework";
      const urgency = hasDue ? (due.getTime() - now.getTime()) / 86400000 : 99;
      return {
        title: raw,
        subjectId: match?.subject.id || null,
        details: "Inbox rapide",
        kind,
        dueAt: hasDue ? due.toISOString() : null,
        plannedStart: null,
        durationMin: Math.min(
          720,
          Math.max(
            5,
            minutes
              ? Number(minutes[1])
              : hours
                ? Number(hours[1]) * 60 + Number(hours[2] || 0)
                : kind === "exam"
                  ? 60
                  : 45,
          ),
        ),
        status: "todo",
        quadrant: urgency <= 2 ? "do" : "schedule",
        priority: urgency <= 2 ? 1 : 2,
      };
    });
}

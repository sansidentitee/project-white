import { localDay, validDay } from "./life";
export const reviewSteps = [
  {
    id: "academic",
    label: "Académie",
    intro: "Reprendre ta journée de cours, un point à la fois.",
    questions: [
      [
        "lessons",
        "Qu’as-tu étudié aujourd’hui ?",
        "Matières, chapitres et ce que tu as compris…",
      ],
      [
        "success",
        "Qu’est-ce qui s’est bien passé ?",
        "Un exercice réussi, une note, une idée comprise…",
      ],
      [
        "difficulty",
        "Qu’est-ce qui reste difficile ?",
        "Question à poser, erreur à revoir, chapitre à reprendre…",
      ],
      [
        "tomorrow",
        "Que dois-tu préparer pour demain ?",
        "Devoirs, matériel, contrôle et première tâche…",
      ],
    ],
  },
  {
    id: "islam",
    label: "Islam",
    intro: "Un retour personnel sur ta pratique et ton apprentissage.",
    questions: [
      [
        "prayers",
        "Comment s’est passée ta journée de prières ?",
        "Ce que tu souhaites retenir de ta journée…",
      ],
      [
        "quran",
        "Quel passage as-tu lu ou mémorisé ?",
        "Lecture, révision, difficulté ou aucune session aujourd’hui…",
      ],
      [
        "learning",
        "Qu’as-tu appris ou mis en pratique ?",
        "Cours, réflexion, bonne action ou point à reprendre…",
      ],
      [
        "tomorrow",
        "Quelle petite intention gardes-tu pour demain ?",
        "Une intention réaliste, à ton rythme…",
      ],
    ],
  },
  {
    id: "finance",
    label: "Trading et formation",
    intro: "Faire le point sur tes décisions et ton apprentissage.",
    questions: [
      [
        "activity",
        "As-tu tradé, observé ou suivi une formation ?",
        "Session, module étudié ou aucun trading aujourd’hui…",
      ],
      [
        "plan",
        "As-tu respecté ton plan ?",
        "Checklist, risque prévu, décisions et discipline…",
      ],
      [
        "lesson",
        "Quelle leçon retiens-tu ?",
        "Erreur, émotion, setup ou concept de formation…",
      ],
      [
        "tomorrow",
        "Que veux-tu travailler demain ?",
        "Un exercice, un module ou une règle à appliquer…",
      ],
    ],
  },
  {
    id: "health",
    label: "Santé",
    intro: "Observer ton état sans avoir à remplir des chiffres inconnus.",
    questions: [
      [
        "energy",
        "Comment sont ton énergie et ton humeur ?",
        "Ton ressenti, fatigue, stress ou niveau d’énergie…",
      ],
      [
        "recovery",
        "Comment as-tu dormi et récupéré ?",
        "Sommeil, pauses, repas et hydratation…",
      ],
      [
        "movement",
        "Qu’as-tu fait pour prendre soin de toi ?",
        "Activité, habitudes, marche ou repos…",
      ],
      [
        "tomorrow",
        "Quel geste simple te ferait du bien demain ?",
        "Un geste concret et raisonnable…",
      ],
    ],
  },
] as const;
export type ReviewAnswers = Record<string, string>;
export type DailyReview = {
  day: string;
  answers: ReviewAnswers;
  completed: boolean;
  updatedAt: string;
};
export const reviewKeys = reviewSteps.flatMap((s) =>
  s.questions.map((q) => `${s.id}:${q[0]}`),
);
export function answeredCount(answers: ReviewAnswers) {
  return reviewKeys.filter((k) => answers[k]?.trim()).length;
}
export function validateDailyReview(
  day: string,
  answers: ReviewAnswers,
  completed: boolean,
) {
  if (!validDay(day) || day > localDay())
    throw Error("Choisis une journée passée ou aujourd’hui.");
  if (
    !answers ||
    typeof answers !== "object" ||
    Array.isArray(answers) ||
    Object.entries(answers).some(
      ([k, v]) =>
        !reviewKeys.includes(k) || typeof v !== "string" || v.length > 3000,
    )
  )
    throw Error("Une réponse du bilan est invalide ou trop longue.");
  if (completed && answeredCount(answers) !== reviewKeys.length)
    throw Error(
      "Réponds à chaque point ou indique qu’il ne s’applique pas aujourd’hui.",
    );
}
export function shouldOpenEveningReview(
  now: Date,
  hour: number,
  completed: boolean,
  deferred: boolean,
) {
  return (
    !completed &&
    !deferred &&
    now.getHours() >= Math.min(23, Math.max(12, hour))
  );
}

import type { Grade } from "./types";
export function validateGrade(grade: Omit<Grade, "id">) {
  if (
    !grade.subjectId ||
    !grade.title.trim() ||
    !Number.isFinite(Date.parse(grade.takenAt))
  )
    throw Error("Vérifie la matière, le titre et la date.");
  if (
    !Number.isFinite(grade.score) ||
    grade.score < 0 ||
    !Number.isFinite(grade.outOf) ||
    grade.outOf <= 0 ||
    grade.score > grade.outOf ||
    !Number.isFinite(grade.coefficient) ||
    grade.coefficient <= 0
  )
    throw Error(
      "La note doit respecter son barème et le coefficient doit être positif.",
    );
}

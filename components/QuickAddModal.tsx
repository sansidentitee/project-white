"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useProject } from "./ProjectProvider";
import { V3Dialog } from "./V3Dialog";
import type { Quadrant } from "@/lib/types";

export function QuickAddModal({
  open,
  onClose,
  initialMode = "task",
}: {
  open: boolean;
  onClose: () => void;
  initialMode?: "task" | "grade";
}) {
  const { state, addTask, addGrade } = useProject();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);
  const [mode, setMode] = useState<"task" | "grade">("task");
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState("");
  const [score, setScore] = useState("");
  const [outOf, setOutOf] = useState("20");
  const [coefficient, setCoefficient] = useState("1");
  const [duration, setDuration] = useState("45");
  const [quadrant, setQuadrant] = useState<Quadrant>("schedule");

  useEffect(() => {
    if (!open) return;
    if (mode === "grade" && !coefficient)
      setCoefficient(String(Number(outOf || 20) / 20));
  }, [open, mode, outOf, coefficient]);

  if (!open) return null;

  function changeOutOf(value: string) {
    setOutOf(value);
    const n = Number(value);
    if (n > 0) setCoefficient(String(Math.round((n / 20) * 100) / 100));
  }

  async function save() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      if (mode === "task") {
        if (!title.trim()) throw new Error("Ajoute un titre.");
        await addTask({
          subjectId: subjectId || null,
          title: title.trim(),
          details: null,
          kind: "homework",
          dueAt: date ? new Date(date + "T20:00:00").toISOString() : null,
          plannedStart: null,
          durationMin: Math.max(5, Number(duration) || 45),
          status: "todo",
          quadrant,
          priority: quadrant === "do" ? 1 : quadrant === "schedule" ? 2 : 3,
        });
      } else {
        const raw = Number(score),
          scale = Number(outOf),
          coef = Number(coefficient);
        if (
          !subjectId ||
          !score.trim() ||
          !Number.isFinite(raw) ||
          !Number.isFinite(scale) ||
          scale <= 0 ||
          raw < 0 ||
          raw > scale ||
          !Number.isFinite(coef) ||
          coef <= 0
        )
          throw new Error("Vérifie la matière, la note et le coefficient.");
        await addGrade({
          subjectId,
          title: title.trim() || "Évaluation",
          score: raw,
          outOf: scale,
          coefficient: Number.isFinite(coef) && coef > 0 ? coef : scale / 20,
          takenAt: new Date().toISOString(),
        });
      }
      setTitle("");
      setSubjectId("");
      setDate("");
      setScore("");
      setOutOf("20");
      setCoefficient("1");
      setDuration("45");
      setQuadrant("schedule");
      onClose();
    } catch {
      setError("Enregistrement impossible. Vérifie les champs et réessaie.");
    } finally {
      setPending(false);
    }
  }

  return (
    <V3Dialog
      open={open}
      onClose={() => {
        if (!pending) onClose();
      }}
      title={mode === "task" ? "Nouvelle tâche" : "Nouvelle note"}
    >
      <fieldset disabled={pending}>
        <div className="os-segmented">
          <button
            className={mode === "task" ? "selected" : ""}
            onClick={() => setMode("task")}
          >
            Tâche
          </button>
          <button
            className={mode === "grade" ? "selected" : ""}
            onClick={() => setMode("grade")}
          >
            Note
          </button>
        </div>

        <label className="os-field">
          Matière
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          >
            <option value="">{mode === "task" ? "Aucune" : "Choisir"}</option>
            {state.subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="os-field">
          {mode === "task" ? "Consigne" : "Évaluation"}
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={mode === "task" ? "Exercices 12 à 16" : "DS Suites"}
          />
        </label>

        {mode === "task" ? (
          <>
            <div className="quick-grid-2">
              <label className="os-field">
                Échéance
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
              <label className="os-field">
                Durée estimée
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </label>
            </div>
            <label className="os-field">
              Matrice
              <select
                value={quadrant}
                onChange={(e) => setQuadrant(e.target.value as Quadrant)}
              >
                <option value="do">Faire — urgent & important</option>
                <option value="schedule">Planifier — important</option>
                <option value="delegate">Déléguer — urgent</option>
                <option value="eliminate">Éliminer</option>
              </select>
            </label>
          </>
        ) : (
          <>
            <div className="quick-grid-2">
              <label className="os-field">
                Note
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                />
              </label>
              <label className="os-field">
                Barème
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={outOf}
                  onChange={(e) => changeOutOf(e.target.value)}
                />
              </label>
            </div>
            <label className="os-field">
              Coefficient
              <input
                type="number"
                min="0.05"
                step="0.05"
                value={coefficient}
                onChange={(e) => setCoefficient(e.target.value)}
              />
              <small className="field-hint">
                Par défaut : barème ÷ 20. Tu peux le modifier.
              </small>
            </label>
          </>
        )}

        {error && <p role="alert">{error}</p>}
        <div className="os-modal-actions">
          <button className="os-button" onClick={onClose}>
            Annuler
          </button>
          <button className="os-button primary" onClick={save}>
            Enregistrer
          </button>
        </div>
      </fieldset>
    </V3Dialog>
  );
}

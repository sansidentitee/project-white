"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useProject } from "./ProjectProvider";
import { V3Dialog } from "./V3Dialog";
import type { Quadrant } from "@/lib/types";

export function QuickAddModal({
  open,
  onClose,
  initialMode = "task",
  initialSubjectId,
}: {
  open: boolean;
  onClose: () => void;
  initialMode?: "task" | "grade";
  initialSubjectId?: string;
}) {
  const { state, addTask, addGrade } = useProject();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError("");
      setNotice("");
      if (initialSubjectId) setSubjectId(initialSubjectId);
    }
  }, [open, initialMode, initialSubjectId]);
  useEffect(() => {
    if (open && !pending) titleRef.current?.focus();
  }, [open, pending]);
  const [mode, setMode] = useState<"task" | "grade">("task");
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState("");
  const [score, setScore] = useState("");
  const [outOf, setOutOf] = useState("20");
  const [coefficient, setCoefficient] = useState("1");
  const [duration, setDuration] = useState("25");
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

  async function save(keepAdding = false) {
    if (pending) return;
    setPending(true);
    setError("");
    setNotice("");
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
          durationMin: Math.max(5, Number(duration) || 25),
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
      if (!keepAdding) {
        setSubjectId("");
        setDate("");
      }
      setScore("");
      setOutOf("20");
      setCoefficient("1");
      if (!keepAdding) setDuration("25");
      setQuadrant("schedule");
      if (!keepAdding) onClose();
      else setNotice("Enregistré. Tu peux ajouter le suivant.");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Enregistrement impossible. Réessaie.",
      );
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save(
            (e.nativeEvent as SubmitEvent).submitter?.getAttribute("name") ===
              "continue",
          );
        }}
      >
        <fieldset disabled={pending}>
          <div className="os-segmented">
            <button
              className={mode === "task" ? "selected" : ""}
              type="button"
              onClick={() => setMode("task")}
            >
              Tâche
            </button>
            <button
              className={mode === "grade" ? "selected" : ""}
              type="button"
              onClick={() => setMode("grade")}
            >
              Note
            </button>
          </div>

          <details
            className="comfort-details"
            open={mode === "grade" ? true : undefined}
            key={mode}
          >
            <summary>Matière (facultatif pour une tâche)</summary>
            <label className="os-field">
              Matière
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
              >
                <option value="">
                  {mode === "task" ? "Aucune" : "Choisir"}
                </option>
                {state.subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </details>

          <label className="os-field">
            {mode === "task" ? "Titre de la tâche" : "Évaluation"}
            <input
              autoFocus
              ref={titleRef}
              name="title"
              required={mode === "task"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={mode === "task" ? "Exercices 12 à 16" : "DS Suites"}
            />
          </label>

          {mode === "task" ? (
            <details className="comfort-details">
              <summary>Date, durée et priorité (facultatif)</summary>
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
            </details>
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
          {notice && <p role="status">{notice}</p>}
          {mode === "task" && (
            <p className="comfort-field-hint">
              Un titre suffit. Durée préremplie : 25 minutes, sans échéance.
            </p>
          )}
          <div className="os-modal-actions comfort-form-actions">
            <button className="os-button" type="button" onClick={onClose}>
              Annuler
            </button>
            <button className="os-button primary" type="submit">
              {pending ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button name="continue" className="os-button" type="submit">
              Enregistrer et ajouter
            </button>
          </div>
        </fieldset>
      </form>
    </V3Dialog>
  );
}

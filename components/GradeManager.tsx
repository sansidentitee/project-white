"use client";
import { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useProject } from "./ProjectProvider";
import { useComfortFilter } from "./ComfortProvider";
import { V3Dialog } from "./V3Dialog";
import type { Grade } from "@/lib/types";

export function GradeActions({ grade }: { grade: Grade }) {
  const { state, updateGrade, removeGrade } = useProject();
  const [action, setAction] = useState<"edit" | "delete" | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  function close() {
    if (!pending) {
      setAction(null);
      setError("");
    }
  }
  async function save(form: HTMLFormElement) {
    if (pending) return;
    const fields = new FormData(form);
    setPending(true);
    setError("");
    try {
      if (action === "delete") await removeGrade(grade.id);
      else
        await updateGrade(grade.id, {
          subjectId: String(fields.get("subject")),
          title: String(fields.get("title")).trim(),
          score: Number(fields.get("score")),
          outOf: Number(fields.get("scale")),
          coefficient: Number(fields.get("coefficient")),
          takenAt: new Date(
            String(fields.get("date")) + "T12:00:00",
          ).toISOString(),
        });
      setAction(null);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Enregistrement impossible. Réessaie.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="calm-grade-actions">
      <button
        aria-label={`Modifier ${grade.title}`}
        onClick={() => {
          setError("");
          setAction("edit");
        }}
      >
        <Pencil size={15} />
        <span>Modifier</span>
      </button>
      <button
        aria-label={`Supprimer ${grade.title}`}
        onClick={() => {
          setError("");
          setAction("delete");
        }}
      >
        <Trash2 size={15} />
        <span>Supprimer</span>
      </button>
      {action && (
        <V3Dialog
          open
          onClose={close}
          title={
            action === "delete" ? "Supprimer cette note ?" : "Modifier la note"
          }
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save(e.currentTarget);
            }}
          >
            <fieldset disabled={pending}>
              {action === "delete" ? (
                <p>
                  <strong>
                    {grade.title} · {grade.score}/{grade.outOf}
                  </strong>
                  <br />
                  Les moyennes seront recalculées. Tu pourras annuler cette
                  suppression pendant cinq minutes, jusqu’à la prochaine
                  modification ou au rechargement.
                </p>
              ) : (
                <div className="calm-grade-form">
                  <label>
                    Évaluation
                    <input
                      name="title"
                      defaultValue={grade.title}
                      required
                      maxLength={200}
                    />
                  </label>
                  <label>
                    Matière
                    <select
                      name="subject"
                      defaultValue={grade.subjectId}
                      required
                    >
                      {state.subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="calm-field-pair">
                    <label>
                      Note
                      <input
                        name="score"
                        type="number"
                        defaultValue={grade.score}
                        min="0"
                        step="any"
                        required
                      />
                    </label>
                    <label>
                      Sur
                      <input
                        name="scale"
                        type="number"
                        defaultValue={grade.outOf}
                        min="0.01"
                        step="any"
                        required
                      />
                    </label>
                  </div>
                  <label>
                    Coefficient
                    <input
                      name="coefficient"
                      type="number"
                      defaultValue={grade.coefficient}
                      min="0.01"
                      step="any"
                      required
                    />
                  </label>
                  <label>
                    Date
                    <input
                      name="date"
                      type="date"
                      defaultValue={grade.takenAt.slice(0, 10)}
                      required
                    />
                  </label>
                </div>
              )}
              {error && <p role="alert">{error}</p>}
              <div className="modal-actions">
                <button type="button" className="neo-pill" onClick={close}>
                  Annuler
                </button>
                <button className="comfort-primary" type="submit">
                  {pending
                    ? "Enregistrement…"
                    : action === "delete"
                      ? "Supprimer la note"
                      : "Enregistrer"}
                </button>
              </div>
            </fieldset>
          </form>
        </V3Dialog>
      )}
    </div>
  );
}
export function GradeManager({ subjectId }: { subjectId?: string }) {
  const { state } = useProject();
  const [subject, setSubject] = useComfortFilter(
    `grades:subject:${subjectId || "all"}`,
    "all",
  );
  const [query, setQuery] = useComfortFilter(
    `grades:query:${subjectId || "all"}`,
  );
  const [limit, setLimit] = useState(10);
  const search = query.toLocaleLowerCase("fr");
  const grades = state.grades
    .filter(
      (g) =>
        (!subjectId || g.subjectId === subjectId) &&
        (subject === "all" || g.subjectId === subject) &&
        `${g.title} ${state.subjects.find((s) => s.id === g.subjectId)?.name || ""}`
          .toLocaleLowerCase("fr")
          .includes(search),
    )
    .sort((a, b) => Date.parse(b.takenAt) - Date.parse(a.takenAt));
  return (
    <section className="neo-panel calm-grades">
      <div className="calm-section-head">
        <div>
          <h2>Mes notes</h2>
          <p>
            {grades.length} {grades.length === 1 ? "note" : "notes"} · barèmes
            et coefficients d’origine
          </p>
        </div>
        <button
          className="comfort-primary"
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("pw:quick-add", { detail: { mode: "grade" } }),
            )
          }
        >
          <Plus size={16} />
          Ajouter une note
        </button>
      </div>
      <div className="calm-filters">
        <label>
          Rechercher
          <input
            type="search"
            value={query}
            placeholder="Titre ou matière"
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(10);
            }}
          />
        </label>
        {!subjectId && (
          <label>
            Matière
            <select
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setLimit(10);
              }}
            >
              <option value="all">Toutes les matières</option>
              {state.subjects.map((s) => (
                <option value={s.id} key={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="calm-grade-list">
        {grades.slice(0, limit).map((g) => (
          <article key={g.id}>
            <div>
              <h3>{g.title}</h3>
              <p>
                {state.subjects.find((s) => s.id === g.subjectId)?.name} ·{" "}
                {new Date(g.takenAt).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <div className="calm-grade-value">
              <strong>
                {g.score}/{g.outOf}
              </strong>
              <span>coefficient {g.coefficient}</span>
            </div>
            <GradeActions grade={g} />
          </article>
        ))}
      </div>
      {!grades.length && (
        <p role="status">
          {state.grades.length
            ? "Aucune note ne correspond à ces filtres."
            : "Ajoute ta première note. Tu pourras la corriger ou la supprimer ensuite."}
        </p>
      )}
      {grades.length > limit && (
        <button className="neo-pill" onClick={() => setLimit(limit + 10)}>
          Afficher les 10 suivantes
        </button>
      )}
    </section>
  );
}

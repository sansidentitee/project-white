"use client";
import Link from "next/link";
import { useState } from "react";
import { useProject } from "./ProjectProvider";
import { academicRisk, priorities, weeklyReview } from "@/lib/academic";
import { generalAverage, subjectAverage } from "@/lib/grades";
import { parsePronoteText } from "@/lib/parser";
import type { Task } from "@/lib/types";

export function StartTask({ id }: { id: string }) {
  return (
    <Link
      className="neo-pill"
      href={"/academic/revisions?task=" + encodeURIComponent(id)}
    >
      Commencer
    </Link>
  );
}
export function GradeSimulator({ subjectId }: { subjectId?: string }) {
  const { state } = useProject();
  const [selected, setSelected] = useState(subjectId || "");
  const [raw, setRaw] = useState("18/20 coef 2");
  const match = raw
    .replaceAll(",", ".")
    .match(
      /^\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)(?:\s+(?:coef|coeff?)\s*(\d+(?:\.\d+)?))?\s*$/i,
    );
  const score = Number(match?.[1]),
    scale = Number(match?.[2]),
    coef = Number(match?.[3] || 1);
  const valid =
    !!match &&
    score >= 0 &&
    scale > 0 &&
    score <= scale &&
    coef > 0 &&
    !!selected;
  const current = subjectAverage(state.grades, selected);
  const simulated = valid
    ? [
        ...state.grades,
        {
          id: "simulation",
          subjectId: selected,
          title: "Simulation",
          score,
          outOf: scale,
          coefficient: coef,
          takenAt: new Date().toISOString(),
        },
      ]
    : state.grades;
  return (
    <section className="neo-panel section-space">
      <h2>Simulateur de notes</h2>
      <p>Teste une note et son coefficient avant de l’enregistrer.</p>
      <div className="v3-row">
        {!subjectId && (
          <select
            aria-label="Matière à simuler"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">Choisir une matière</option>
            {state.subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
        <input
          aria-label="Note hypothétique"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="18/20 coef 2"
        />
      </div>
      <p aria-live="polite">
        {valid ? (
          <>
            Matière : {current ?? "—"} →{" "}
            <strong>{subjectAverage(simulated, selected)}/20</strong> · Moyenne
            générale : {generalAverage(state.grades) ?? "—"} →{" "}
            {generalAverage(simulated)}/20
          </>
        ) : (
          "Choisis une matière et saisis une note valide, par exemple 4/5 coef 0,5."
        )}
      </p>
    </section>
  );
}

const widgetLabels = {
  overview: "Vue d’ensemble classique",
  priorities: "3 priorités",
  exams: "Contrôles proches",
  errors: "Erreurs dues",
  risk: "Risque académique",
  review: "Weekly Review",
};
export function SmartDashboard() {
  const { state, saveAcademicPreferences } = useProject();
  const [customize, setCustomize] = useState(false);
  const [error, setError] = useState("");
  const widgets =
    state.preferences.dashboardWidgets || Object.keys(widgetLabels);
  const now = new Date();
  const due = state.errors.filter(
    (e) =>
      e.status !== "mastered" &&
      (!e.nextReviewAt || Date.parse(e.nextReviewAt) <= now.getTime()),
  );
  const exams = state.tasks
    .filter(
      (t) =>
        t.kind === "exam" &&
        t.status !== "done" &&
        t.dueAt &&
        Date.parse(t.dueAt) <= now.getTime() + 7 * 86400000,
    )
    .sort((a, b) => Date.parse(a.dueAt!) - Date.parse(b.dueAt!));
  const review = weeklyReview(state, now);
  async function save(next: string[]) {
    try {
      await saveAcademicPreferences({ dashboardWidgets: next });
      setError("");
    } catch {
      setError("Personnalisation non enregistrée. Réessaie.");
    }
  }
  const panels: Record<string, React.ReactNode> = {
    priorities: (
      <>
        <h2>3 priorités</h2>
        {priorities(state.tasks, now).map((t) => (
          <div className="v3-row" key={t.id}>
            <span>
              <strong>{t.title}</strong>
              <small>{t.durationMin} min</small>
            </span>
            <StartTask id={t.id} />
          </div>
        ))}
        <p>
          Temps prévu :{" "}
          {priorities(state.tasks, now).reduce((a, t) => a + t.durationMin, 0)}{" "}
          min
        </p>
      </>
    ),
    exams: (
      <>
        <h2>Contrôles proches</h2>
        {exams.map((t) => (
          <p key={t.id}>
            {t.title} · {new Date(t.dueAt!).toLocaleDateString("fr-FR")}
          </p>
        ))}
        {!exams.length && <p>Aucun contrôle dans les 7 prochains jours.</p>}
      </>
    ),
    errors: (
      <>
        <h2>Erreurs dues</h2>
        <strong>{due.length} à revoir</strong>
        <p>
          {due
            .slice(0, 3)
            .map((e) => e.title)
            .join(" · ") || "Révisions à jour."}
        </p>
        <Link className="neo-pill" href="/academic/errors">
          Réviser
        </Link>
      </>
    ),
    risk: (
      <>
        <h2>Risque académique</h2>
        {state.subjects.map((s) => {
          const r = academicRisk(state, s.id, now);
          return (
            <Link className="v3-row" href={"/subjects/" + s.id} key={s.id}>
              <span>{s.name}</span>
              <strong className={"v3-risk risk-" + r.score}>
                {r.hasData ? r.label : "Données à compléter"}
              </strong>
            </Link>
          );
        })}
        <small>
          Calcul fondé sur notes, tendance, retards, erreurs dues et chapitres
          faibles.
        </small>
      </>
    ),
    review: (
      <>
        <h2>Weekly Review</h2>
        <p>
          Semaine du {review.start.toLocaleDateString("fr-FR")} au{" "}
          {new Date(review.end.getTime() - 1).toLocaleDateString("fr-FR")}
        </p>
        <p>
          Prévu : {review.planned} min · Réalisé : {review.actual} min
        </p>
        <p>
          {review.completed} tâches terminées · {review.mastered} erreurs
          espacées à 7 jours ou plus · {review.grades} notes
        </p>
        <p>
          Moyenne générale : {review.averageBefore ?? "—"}/20 →{" "}
          {review.averageAfter ?? "—"}/20
        </p>
        <p>
          À renforcer :{" "}
          {review.weak.map((c) => c.title).join(", ") ||
            "aucun chapitre signalé"}
        </p>
        <p>
          Prochaine semaine :{" "}
          {review.risks.map((r) => r.subject.name).join(", ") ||
            "maintenir un rythme régulier"}
        </p>
        <small>
          Les tâches anciennes sans date de fin ne sont pas comptabilisées.
        </small>
      </>
    ),
  };
  return (
    <section className="section-space">
      <div className="panel-head">
        <h2>Accueil intelligent</h2>
        <button className="neo-pill" onClick={() => setCustomize((v) => !v)}>
          Personnaliser
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      {customize && (
        <div className="neo-panel">
          {Object.entries(widgetLabels).map(([id, label]) => (
            <div key={id} className="v3-row">
              <label>
                <input
                  type="checkbox"
                  checked={widgets.includes(id)}
                  onChange={() =>
                    void save(
                      widgets.includes(id)
                        ? widgets.filter((w) => w !== id)
                        : [...widgets, id],
                    )
                  }
                />
                {label}
              </label>
              {widgets.includes(id) && (
                <>
                  <button
                    disabled={widgets.indexOf(id) === 0}
                    onClick={() => {
                      const list = [...widgets],
                        i = list.indexOf(id);
                      [list[i - 1], list[i]] = [list[i], list[i - 1]];
                      void save(list);
                    }}
                  >
                    Monter
                  </button>
                  <button
                    disabled={widgets.indexOf(id) === widgets.length - 1}
                    onClick={() => {
                      const list = [...widgets],
                        i = list.indexOf(id);
                      [list[i + 1], list[i]] = [list[i], list[i + 1]];
                      void save(list);
                    }}
                  >
                    Descendre
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="v3-grid">
        {widgets
          .filter((w) => panels[w])
          .map((w) => (
            <section key={w} className="neo-panel">
              {panels[w]}
            </section>
          ))}
      </div>
    </section>
  );
}

export function Inbox() {
  const { state, addTask } = useProject();
  const [raw, setRaw] = useState("");
  const [draft, setDraft] = useState<Omit<Task, "id"> | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    if (!draft || pending) return;
    setPending(true);
    try {
      await addTask(draft);
      setDraft(null);
      setRaw("");
      setError("Tâche enregistrée.");
    } catch {
      setError("Échec de l’enregistrement. Ta tâche reste ici.");
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="neo-panel">
      <h1>Inbox rapide</h1>
      <p>Saisis une consigne, puis vérifie les informations reconnues.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setDraft(parsePronoteText(raw, state.subjects)[0] || null);
        }}
      >
        <label className="neo-field">
          Texte libre
          <input
            autoFocus
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="exo 32 maths jeudi 45 min"
            required
          />
        </label>
        <button className="neo-pill" type="submit">
          Structurer
        </button>
      </form>
      {draft && (
        <fieldset disabled={pending}>
          <label className="neo-field">
            Titre
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </label>
          <label className="neo-field">
            Matière
            <select
              value={draft.subjectId || ""}
              onChange={(e) =>
                setDraft({ ...draft, subjectId: e.target.value || null })
              }
            >
              <option value="">Sans matière</option>
              {state.subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="neo-field">
            Type
            <select
              value={draft.kind}
              onChange={(e) =>
                setDraft({ ...draft, kind: e.target.value as Task["kind"] })
              }
            >
              <option value="homework">Devoir</option>
              <option value="study">Révision</option>
              <option value="exam">Contrôle</option>
              <option value="event">Événement</option>
            </select>
          </label>
          <label className="neo-field">
            Échéance
            <input
              type="date"
              value={
                draft.dueAt
                  ? new Date(draft.dueAt).toLocaleDateString("sv-SE")
                  : ""
              }
              onChange={(e) =>
                setDraft({
                  ...draft,
                  dueAt: e.target.value
                    ? new Date(e.target.value + "T23:59:00").toISOString()
                    : null,
                })
              }
            />
          </label>
          <label className="neo-field">
            Durée (min)
            <input
              type="number"
              min="5"
              max="720"
              value={draft.durationMin}
              onChange={(e) =>
                setDraft({ ...draft, durationMin: Number(e.target.value) })
              }
            />
          </label>
          <button
            className="neo-pill primary"
            disabled={!draft.title.trim() || draft.durationMin < 5}
            onClick={() => void save()}
          >
            Créer la tâche
          </button>
        </fieldset>
      )}
      {error && <p role="status">{error}</p>}
    </section>
  );
}

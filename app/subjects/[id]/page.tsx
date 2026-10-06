"use client";
import { use, useState } from "react";
import { PageFrame } from "@/components/PageFrame";
import { useProject } from "@/components/ProjectProvider";
import { GradeSimulator, StartTask } from "@/components/AcademicV3";
import { academicRisk } from "@/lib/academic";
import { subjectAverage } from "@/lib/grades";
import type { Chapter } from "@/lib/types";
import { GradeManager } from "@/components/GradeManager";
import { OptionalPanel } from "@/components/CalmWorkspace";
import { useComfortFilter } from "@/components/ComfortProvider";
const tabs = [
  "Vue générale",
  "Notes",
  "Chapitres",
  "Tâches",
  "Erreurs",
  "Ressources",
  "Sessions",
  "Objectifs",
] as const;
export default function SubjectDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    state,
    addChapter,
    updateChapter,
    uploadResource,
    addResource,
    updateResource,
    removeResource,
    addGoal,
    updateGoal,
  } = useProject();
  const [tab, setTab] = useComfortFilter(`subject:tab:${id}`, "Vue générale");
  const [title, setTitle] = useState(""),
    [link, setLink] = useState(""),
    [error, setError] = useState(""),
    [pending, setPending] = useState(false),
    [target, setTarget] = useState("18");
  const subject = state.subjects.find((s) => s.id === id);
  const chapters = state.chapters.filter((c) => c.subjectId === id),
    grades = state.grades
      .filter((g) => g.subjectId === id)
      .sort((a, b) => Date.parse(a.takenAt) - Date.parse(b.takenAt)),
    tasks = state.tasks.filter((t) => t.subjectId === id),
    errors = state.errors.filter((e) => e.subjectId === id),
    resources = state.resources.filter((r) => r.subjectId === id),
    sessions = state.sessions.filter((s) => s.subjectId === id),
    goals = state.goals.filter((g) => g.subjectId === id);
  const risk = academicRisk(state, id);
  async function act(fn: () => Promise<unknown>) {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await fn();
      setTitle("");
      setLink("");
    } catch {
      setError("Enregistrement impossible. Tes champs sont conservés.");
    } finally {
      setPending(false);
    }
  }
  if (!subject)
    return (
      <PageFrame>
        <p>Matière introuvable.</p>
      </PageFrame>
    );
  return (
    <PageFrame>
      <div className="academic-page">
        <h1>{subject.name}</h1>
        <p>
          Moyenne : {subjectAverage(state.grades, id) ?? "—"}/20 ·{" "}
          {risk.hasData ? risk.label : "Données à compléter"} ·{" "}
          {sessions.reduce((a, s) => a + s.durationMin, 0)} min travaillées
        </p>
        <nav className="v3-row" aria-label="Sections de la matière">
          {tabs.slice(0, 4).map((t) => (
            <button
              className="neo-pill"
              aria-pressed={tab === t}
              key={t}
              onClick={() => {
                setTab(t);
                setTitle("");
              }}
            >
              {t}
            </button>
          ))}
          <label>
            Autres sections
            <select
              aria-label="Autres sections de la matière"
              value={tabs.slice(4).includes(tab as (typeof tabs)[4]) ? tab : ""}
              onChange={(e) => {
                if (e.target.value) setTab(e.target.value);
              }}
            >
              <option value="">Choisir…</option>
              {tabs.slice(4).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        </nav>
        {error && <p role="alert">{error}</p>}
        {tab === "Vue générale" && (
          <section className="calm-home-paths">
            <h2>Que souhaites-tu faire ?</h2>
            <div>
              <button onClick={() => setTab("Notes")}>
                <strong>Mes notes</strong>
                <span>
                  {grades.length} notes · moyenne{" "}
                  {subjectAverage(state.grades, id) ?? "—"}/20
                </span>
              </button>
              <button onClick={() => setTab("Tâches")}>
                <strong>Mes tâches</strong>
                <span>
                  {tasks.filter((t) => t.status !== "done").length} à terminer
                </span>
              </button>
              <button onClick={() => setTab("Chapitres")}>
                <strong>Mes chapitres</strong>
                <span>{chapters.length} chapitres à retrouver</span>
              </button>
            </div>
          </section>
        )}
        {tab === "Notes" && <GradeManager subjectId={id} />}
        {tab === "Notes" && (
          <OptionalPanel title="Tendance et simulation">
            <>
              <section className="neo-panel section-space">
                <h2>Tendance des notes</h2>
                {grades.length ? (
                  <>
                    <svg
                      viewBox="0 0 600 210"
                      role="img"
                      aria-label="Notes normalisées sur 20"
                    >
                      <line
                        x1="20"
                        y1="190"
                        x2="580"
                        y2="190"
                        stroke="currentColor"
                      />
                      {grades.map((g, i) => {
                        const x =
                            30 + (i / Math.max(1, grades.length - 1)) * 530,
                          y = 190 - (g.score / g.outOf) * 8;
                        const prev = grades[i - 1] || g,
                          py = 190 - (prev.score / prev.outOf) * 8;
                        return (
                          <g key={g.id}>
                            <line
                              x1={x}
                              x2={x}
                              y1={Math.min(y, py) - 8}
                              y2={Math.max(y, py) + 8}
                              stroke="currentColor"
                            />
                            <rect
                              x={x - 5}
                              y={Math.min(y, py)}
                              width="10"
                              height={Math.max(3, Math.abs(y - py))}
                              fill="currentColor"
                              opacity={y <= py ? 1 : 0.4}
                            />
                            <title>
                              {g.title} : {g.score}/{g.outOf} · coef{" "}
                              {g.coefficient}
                            </title>
                          </g>
                        );
                      })}
                    </svg>
                    <table className="grade-table">
                      <thead>
                        <tr>
                          <th>Évaluation</th>
                          <th>Note</th>
                          <th>Coefficient</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grades.map((g) => (
                          <tr key={g.id}>
                            <td>{g.title}</td>
                            <td>
                              {g.score}/{g.outOf}
                            </td>
                            <td>{g.coefficient}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                ) : (
                  <p>Ajoute ta première note avec +.</p>
                )}
                <button
                  className="neo-pill"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("pw:quick-add", {
                        detail: { mode: "grade" },
                      }),
                    )
                  }
                >
                  + Ajouter une note
                </button>
              </section>
              <GradeSimulator subjectId={id} />
            </>
          </OptionalPanel>
        )}
        {tab === "Chapitres" && (
          <section className="neo-panel section-space">
            <h2>Chapitres</h2>
            {chapters.map((c) => (
              <div className="v3-row" key={c.id}>
                <strong>{c.title}</strong>
                <select
                  aria-label={"Maîtrise de " + c.title}
                  disabled={pending}
                  value={c.status}
                  onChange={(e) =>
                    void act(() =>
                      updateChapter(c.id, {
                        status: e.target.value as Chapter["status"],
                      }),
                    )
                  }
                >
                  <option value="discover">À découvrir</option>
                  <option value="learning">En cours</option>
                  <option value="reinforce">À renforcer</option>
                  <option value="solid">Solide</option>
                  <option value="mastered">Maîtrisé</option>
                </select>
              </div>
            ))}
            {tab === "Chapitres" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void act(() =>
                    addChapter({
                      subjectId: id,
                      title: title.trim(),
                      status: "discover",
                    }),
                  );
                }}
              >
                <label className="neo-field">
                  Nouveau chapitre
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </label>
                <button disabled={pending} className="neo-pill">
                  Ajouter
                </button>
              </form>
            )}
          </section>
        )}
        {tab === "Tâches" && (
          <section className="neo-panel section-space">
            <h2>Tâches</h2>
            {tasks.map((t) => (
              <div className="v3-row" key={t.id}>
                <span>
                  {t.title} · {t.durationMin} min · {t.status}
                </span>
                <StartTask id={t.id} />
              </div>
            ))}
            {!tasks.length && <p>Aucune tâche pour cette matière.</p>}
          </section>
        )}
        {tab === "Erreurs" && (
          <section className="neo-panel section-space">
            <h2>Erreurs liées aux chapitres</h2>
            {errors.map((e) => (
              <p key={e.id}>
                {e.title} ·{" "}
                {chapters.find((c) => c.id === e.chapterId)?.title ||
                  "Sans chapitre"}{" "}
                · prochaine révision :{" "}
                {e.nextReviewAt
                  ? new Date(e.nextReviewAt).toLocaleDateString("fr-FR")
                  : "maintenant"}
              </p>
            ))}
            <a className="neo-pill" href="/academic/errors">
              Réviser les cartes
            </a>
          </section>
        )}
        {tab === "Ressources" && (
          <section className="neo-panel section-space">
            <h2>Ressources</h2>
            {resources.map((r) => (
              <div className="v3-row" key={r.id}>
                <a href={r.url} target="_blank" rel="noopener noreferrer">
                  {r.title}
                </a>
                <input
                  aria-label={"Renommer " + r.title}
                  defaultValue={r.title}
                  onBlur={(e) => {
                    if (e.target.value.trim() && e.target.value !== r.title)
                      void act(() =>
                        updateResource(r.id, { title: e.target.value.trim() }),
                      );
                  }}
                />
                <button
                  disabled={pending}
                  className="neo-pill"
                  onClick={() => {
                    if (confirm("Supprimer cette ressource ?"))
                      void act(() => removeResource(r.id));
                  }}
                >
                  Supprimer
                </button>
              </div>
            ))}
            <label className="neo-field">
              Importer un fichier
              <input
                type="file"
                disabled={pending}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void act(() => uploadResource(id, f));
                }}
              />
            </label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void act(() =>
                  addResource({
                    subjectId: id,
                    title: title.trim() || link,
                    url: link,
                    kind: "link",
                  }),
                );
              }}
            >
              <label className="neo-field">
                Nom du lien
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <label className="neo-field">
                Adresse
                <input
                  required
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
              </label>
              <button disabled={pending} className="neo-pill">
                Ajouter le lien
              </button>
            </form>
          </section>
        )}
        {tab === "Sessions" && (
          <section className="neo-panel section-space">
            <h2>Sessions</h2>
            {sessions.map((s) => (
              <p key={s.id}>
                {new Date(s.endedAt).toLocaleDateString("fr-FR")} ·{" "}
                {s.durationMin} min · {s.outcome}
              </p>
            ))}
            {!sessions.length && <p>Aucune session enregistrée.</p>}
          </section>
        )}
        {tab === "Objectifs" && (
          <section className="neo-panel section-space">
            <h2>Objectifs</h2>
            {goals.map((g) => (
              <div className="v3-row" key={g.id}>
                <span>
                  {g.title} · {g.currentValue}/{g.targetValue} {g.unit}
                </span>
                <label>
                  Progression
                  <input
                    type="number"
                    min="0"
                    defaultValue={g.currentValue}
                    onBlur={(e) =>
                      void act(() =>
                        updateGoal(g.id, {
                          currentValue: Number(e.target.value),
                        }),
                      )
                    }
                  />
                </label>
              </div>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void act(() =>
                  addGoal({
                    subjectId: id,
                    title: title.trim(),
                    targetValue: Number(target),
                    currentValue: 0,
                    unit: "points",
                    status: "active",
                  }),
                );
              }}
            >
              <label className="neo-field">
                Objectif
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <label className="neo-field">
                Cible
                <input
                  required
                  type="number"
                  min="0.1"
                  step="any"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </label>
              <button className="neo-pill" disabled={pending}>
                Ajouter
              </button>
            </form>
          </section>
        )}
      </div>
    </PageFrame>
  );
}

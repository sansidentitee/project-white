"use client";
import { useComfortFilter } from "./ComfortProvider";
import Link from "next/link";
import { useState } from "react";
import { useProject } from "./ProjectProvider";
import { useLife } from "./LifeProvider";
import { LifeEntry, localDay, num, recentDays, text } from "@/lib/life";
import {
  habitWeek,
  healthWindow,
  revisionPlan,
  weeklyMemory,
  memoryHistory,
  questionVersion,
} from "@/lib/progress";
import {
  ActionFeedback,
  EntryManager,
  LifeEmpty,
  LifePanel,
  useLifeAction,
} from "./LifeUI";

export function RevisionCoach() {
  const project = useProject(),
    action = useLifeAction(),
    plan = revisionPlan(project.state);
  return (
    <LifePanel title="Mon plan de révision ciblé">
      <p>
        Les contrôles des 14 prochains jours, les erreurs dues et les échecs
        répétés déterminent l’ordre proposé.
      </p>
      {plan.slice(0, 6).map((p) => (
        <article key={p.chapter.id} className="life-entry">
          <div>
            <h3>{p.chapter.title}</h3>
            <small>
              {
                project.state.subjects.find((s) => s.id === p.chapter.subjectId)
                  ?.name
              }
            </small>
            <p>
              {p.exam
                ? `Contrôle : ${p.exam.title} · ${new Date(p.exam.dueAt!).toLocaleDateString("fr-FR")}. `
                : ""}
              {p.due.length} erreurs dues · {p.lapses} échecs enregistrés.
            </p>
            <Link href="/academic/errors">Revoir mes erreurs →</Link>
          </div>
          <button
            className="neo-pill"
            disabled={
              action.busy ||
              project.loading ||
              project.state.tasks.some(
                (t) =>
                  t.status !== "done" &&
                  t.title === "Réviser : " + p.chapter.title &&
                  t.subjectId === p.chapter.subjectId,
              )
            }
            onClick={() =>
              void action.run(
                () =>
                  project.addTask({
                    title: "Réviser : " + p.chapter.title,
                    subjectId: p.chapter.subjectId,
                    details: `Chapitre : ${p.chapter.title}. Revoir les erreurs puis refaire un exercice.`,
                    kind: "study",
                    durationMin: 25,
                    status: "todo",
                    quadrant: "do",
                    priority: 2,
                    dueAt: new Date(localDay() + "T23:59:00").toISOString(),
                  }),
                "Révision ajoutée au planning.",
              )
            }
          >
            Planifier 25 min
          </button>
        </article>
      ))}
      {!plan.length && (
        <LifeEmpty>
          Ajoute des chapitres et rattache tes erreurs pour construire ton plan.
        </LifeEmpty>
      )}
      <ActionFeedback action={action} />
    </LifePanel>
  );
}

export function MemorizationPath() {
  const life = useLife(),
    action = useLifeAction(),
    today = localDay(),
    week = new Set(recentDays(today)),
    cards = life.entries.filter(
      (e) => e.universe === "islam" && e.kind === "memorization" && !e.archived,
    ),
    target = life.entries.find(
      (e) =>
        e.key === "memory-week-target" && e.universe === "islam" && !e.archived,
    ),
    completed = weeklyMemory(life.entries, today);
  const [open, setOpen] = useState(false);
  const history = cards
    .flatMap((card) =>
      memoryHistory(card).map((h, i) => ({
        id: card.id + "-" + i,
        title: card.title,
        createdAt: h.at,
        data: { ratingLabel: h.ratingLabel, nextReview: h.nextReview },
      })),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <LifePanel title="Mon parcours de mémorisation">
      <p>
        Objectif glissant sur sept jours :{" "}
        <strong>
          {completed} / {num(target, "target") || "—"}
        </strong>{" "}
        passages distincts révisés.
      </p>
      {target && (
        <progress
          max={Number(target.data.target)}
          value={Math.min(completed, Number(target.data.target))}
          aria-label="Objectif hebdomadaire de mémorisation"
        />
      )}
      <button className="neo-pill" onClick={() => setOpen(!open)}>
        Définir mon objectif hebdomadaire
      </button>
      {open && (
        <form
          className="life-form"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget),
              n = Number(fd.get("target"));
            if (n >= 1 && n <= 1000)
              void action
                .run(() =>
                  life.save({
                    universe: "islam",
                    kind: "reflection",
                    title: "Objectif hebdomadaire de mémorisation",
                    day: today,
                    key: "memory-week-target",
                    data: { type: "memory-target", target: n },
                  }),
                )
                .then((ok) => {
                  if (ok) setOpen(false);
                });
          }}
        >
          <label>
            Passages à réviser par semaine
            <input
              name="target"
              type="number"
              min={1}
              max={1000}
              required
              defaultValue={num(target, "target") || 3}
            />
          </label>
          <button className="neo-pill primary" disabled={action.busy}>
            Enregistrer l’objectif
          </button>
        </form>
      )}
      <div className="life-list">
        {cards.map((c, i) => (
          <div className="life-entry" key={c.id}>
            <div>
              <strong>
                {i + 1}. {c.title}
              </strong>
              <p>
                {text(c, "reference")} · {c.data.repetitions || 0} révisions ·
                prochaine : {text(c, "nextReview") || "à revoir"}
              </p>
            </div>
            <span>
              {Number(c.data.intervalDays) >= 7
                ? "À entretenir"
                : Number(c.data.repetitions) > 0
                  ? "En consolidation"
                  : "À apprendre"}
            </span>
          </div>
        ))}
      </div>
      <h3>Historique des révisions</h3>
      {history.slice(0, 30).map((h) => (
        <div className="life-entry" key={h.id}>
          <strong>{h.title}</strong>
          <span>
            {new Date(h.createdAt).toLocaleString("fr-FR")} ·{" "}
            {h.data.ratingLabel} · prochaine {h.data.nextReview}
          </span>
        </div>
      ))}
      {!history.length && (
        <LifeEmpty>
          Les prochaines réponses Encore / Difficile / Bien / Facile
          apparaîtront ici.
        </LifeEmpty>
      )}
      <small>
        {
          life.entries.filter(
            (e) => e.kind === "quran" && week.has(e.day) && !e.archived,
          ).length
        }{" "}
        sessions de Coran sur les sept derniers jours.
      </small>
      <ActionFeedback action={action} />
    </LifePanel>
  );
}
export function HealthTrends() {
  const { entries } = useLife(),
    today = localDay(),
    rows = healthWindow(entries, today),
    habits = habitWeek(entries, today);
  const [metric, setMetric] = useComfortFilter<
    "sleep" | "energy" | "water" | "mood" | "activity"
  >("health-trends-indicator", "sleep");
  const labels = {
      sleep: "Sommeil (h)",
      energy: "Énergie /5",
      water: "Eau (ml)",
      mood: "Humeur /5",
      activity: "Activité (min)",
    },
    values = rows.map((r) => r[metric]),
    known = values.filter((v): v is number => v !== null),
    max = Math.max(...known, 1);
  return (
    <LifePanel title="Tendances · 30 jours">
      <label>
        Indicateur
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value as typeof metric)}
        >
          {Object.entries(labels).map(([k, v]) => (
            <option value={k} key={k}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <div
        className="v4-bars"
        role="img"
        aria-label={`Historique ${labels[metric]} sur trente jours ; valeurs détaillées ci-dessous`}
      >
        {rows.map((r, i) => (
          <div
            key={r.day}
            title={`${r.day} : ${values[i] === null ? "non renseigné" : values[i]}`}
          >
            <span
              style={{
                height:
                  values[i] === null
                    ? 0
                    : Math.max(2, (Number(values[i]) / max) * 100) + "%",
              }}
            />
            <small>{i % 7 === 0 ? r.day.slice(8) : ""}</small>
          </div>
        ))}
      </div>
      <p>
        {known.length
          ? `Moyenne des ${known.length} valeurs renseignées : ${(known.reduce((s, v) => s + v, 0) / known.length).toFixed(1)}.`
          : "Aucune valeur renseignée."}{" "}
        Les jours manquants restent vides.
      </p>
      <details>
        <summary>Voir les valeurs des trente jours</summary>
        <div className="v4-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>{labels[metric]}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.day}>
                  <td>{r.day}</td>
                  <td>{r[metric] ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <h3>Bilan des sept derniers jours</h3>
      <p>
        {
          rows
            .slice(-7)
            .filter(
              (r) =>
                r.sleep !== null ||
                r.energy !== null ||
                r.water !== null ||
                r.mood !== null,
            ).length
        }{" "}
        jours renseignés · {rows.slice(-7).reduce((s, r) => s + r.activity, 0)}{" "}
        minutes d’activité.
      </p>
      {habits.map(({ habit, days }) => (
        <div key={habit.id} className="life-entry">
          <strong>{habit.title}</strong>
          <span>{days}/7 jours cochés</span>
          <progress
            max={7}
            value={days}
            aria-label={"Régularité " + habit.title}
          />
        </div>
      ))}
      {!habits.length && (
        <Link href="/health/habits">Créer mes habitudes →</Link>
      )}
      <small>
        Ce bilan décrit tes données personnelles, sans interprétation médicale.
      </small>
    </LifePanel>
  );
}

export function LearningStudio() {
  const life = useLife(),
    action = useLifeAction(),
    [moduleId, setModuleId] = useState("");
  const own = life.entries.filter(
      (e) => e.universe === "finance" && !e.archived,
    ),
    courses = own.filter((e) => e.kind === "learning"),
    modules = own.filter(
      (e) => e.kind === "reflection" && e.data.studioType === "module",
    ),
    module = modules.find((e) => e.id === moduleId),
    questions = own.filter(
      (e) => e.data.studioType === "quiz" && e.data.moduleId === moduleId,
    ),
    exercises = own.filter(
      (e) => e.data.studioType === "exercise" && e.data.moduleId === moduleId,
    ),
    attempts = own.filter((e) => e.data.studioType === "answer");
  const latest = (id: string) =>
    attempts
      .filter(
        (a) =>
          a.data.questionId === id &&
          a.data.questionVersion ===
            questionVersion(own.find((q) => q.id === id)!),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const passed = questions.filter(
      (q) => latest(q.id)?.data.passed === true,
    ).length,
    done = exercises.filter((q) => latest(q.id)?.data.passed === true).length;
  return (
    <>
      <LifePanel title="Progression par cours">
        {courses.map((course) => {
          const linked = modules.filter((m) => m.data.courseId === course.id),
            completed = linked.filter((m) => {
              const checks = own.filter(
                (q) =>
                  ["quiz", "exercise"].includes(text(q, "studioType")) &&
                  q.data.moduleId === m.id,
              );
              return (
                m.data.completed === true &&
                checks.length > 0 &&
                checks.every((q) => latest(q.id)?.data.passed === true)
              );
            }).length;
          return (
            <div className="life-entry" key={course.id}>
              <strong>{course.title}</strong>
              <span>
                {completed}/{linked.length} modules validés
              </span>
              <progress
                max={Math.max(1, linked.length)}
                value={completed}
                aria-label={"Modules validés " + course.title}
              />
            </div>
          );
        })}
        {!courses.length && (
          <LifeEmpty>
            Ajoute un cours dans Ma formation, puis associe-lui tes modules.
          </LifeEmpty>
        )}
      </LifePanel>
      <EntryManager
        universe="finance"
        kind="reflection"
        title="Mes modules de formation"
        entries={modules}
        fields={[
          {
            key: "studioType",
            label: "Type",
            type: "select",
            options: [{ value: "module", label: "Module" }],
          },
          {
            key: "courseId",
            label: "Cours associé",
            type: "select",
            options: [
              { value: "", label: "Indépendant" },
              ...courses.map((c) => ({ value: c.id, label: c.title })),
            ],
          },
          { key: "notes", label: "Notes du module", type: "textarea" },
        ]}
      />
      <LifePanel title="Travailler un module">
        <label>
          Module
          <select
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
          >
            <option value="">Choisir un module</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </label>
        {module && (
          <>
            <p>{text(module, "notes")}</p>
            <p>
              {passed}/{questions.length} quiz réussis · {done}/
              {exercises.length} exercices terminés.
            </p>
            <progress
              max={Math.max(1, questions.length + exercises.length)}
              value={passed + done}
              aria-label="Progression du module"
            />
            {questions.map((q) => (
              <QuizQuestion key={q.id} question={q} latest={latest(q.id)} />
            ))}
            {exercises.map((q) => (
              <ExerciseQuestion key={q.id} question={q} latest={latest(q.id)} />
            ))}
            <button
              className="neo-pill"
              disabled={
                action.busy ||
                questions.length + exercises.length === 0 ||
                passed + done !== questions.length + exercises.length
              }
              onClick={() =>
                void action.run(
                  () =>
                    life.save({
                      ...module,
                      data: { ...module.data, completed: true },
                    }),
                  "Module terminé.",
                )
              }
            >
              {module.data.completed &&
              passed + done === questions.length + exercises.length
                ? "Module terminé ✓"
                : "Marquer le module terminé"}
            </button>
          </>
        )}{" "}
        {!module && (
          <LifeEmpty>
            Crée ou sélectionne un module pour ajouter tes exercices et tes
            quiz.
          </LifeEmpty>
        )}
        <ActionFeedback action={action} />
      </LifePanel>
      {module && (
        <div key={module.id}>
          <EntryManager
            universe="finance"
            kind="reflection"
            title="Questions du module"
            entries={questions}
            render={() => (
              <p>
                Quiz du module · modifier pour éditer les choix et la
                correction.
              </p>
            )}
            fields={[
              {
                key: "studioType",
                label: "Type",
                type: "select",
                options: [{ value: "quiz", label: "Quiz" }],
              },
              {
                key: "moduleId",
                label: "Module",
                type: "select",
                options: [{ value: module.id, label: module.title }],
              },
              ...["A", "B", "C", "D"].map((k) => ({
                key: "option" + k,
                label: "Réponse " + k,
              })),
              {
                key: "answerKey",
                label: "Bonne réponse",
                type: "select",
                options: ["A", "B", "C", "D"].map((k) => ({
                  value: k,
                  label: k,
                })),
              },
              {
                key: "explanation",
                label: "Explication / source",
                type: "textarea",
              },
            ]}
          />
          <EntryManager
            universe="finance"
            kind="reflection"
            title="Exercices du module"
            entries={exercises}
            fields={[
              {
                key: "studioType",
                label: "Type",
                type: "select",
                options: [{ value: "exercise", label: "Exercice" }],
              },
              {
                key: "moduleId",
                label: "Module",
                type: "select",
                options: [{ value: module.id, label: module.title }],
              },
              { key: "instructions", label: "Consigne", type: "textarea" },
              {
                key: "solution",
                label: "Correction / critères de réussite",
                type: "textarea",
              },
            ]}
          />
        </div>
      )}
    </>
  );
}
function QuizQuestion({
  question: q,
  latest,
}: {
  question: LifeEntry;
  latest?: LifeEntry;
}) {
  const life = useLife(),
    action = useLifeAction(),
    [answer, setAnswer] = useState(""),
    [feedback, setFeedback] = useState("");
  return (
    <form
      className="life-entry v4-question"
      onSubmit={(e) => {
        e.preventDefault();
        const passed = answer === q.data.answerKey;
        void action
          .run(() =>
            life.save({
              universe: "finance",
              kind: "reflection",
              title: "Réponse : " + q.title,
              day: localDay(),
              data: {
                studioType: "answer",
                questionId: q.id,
                questionVersion: questionVersion(q),
                moduleId: text(q, "moduleId"),
                answer,
                passed,
              },
            }),
          )
          .then((ok) => {
            if (ok)
              setFeedback(
                passed
                  ? "Bonne réponse."
                  : "À revoir. " + text(q, "explanation"),
              );
          });
      }}
    >
      <h3>{q.title}</h3>
      {["A", "B", "C", "D"]
        .filter((k) => text(q, "option" + k))
        .map((k) => (
          <label key={k}>
            <input
              type="radio"
              required
              name={"quiz-" + q.id}
              checked={answer === k}
              onChange={() => setAnswer(k)}
            />
            {k}. {text(q, "option" + k)}
          </label>
        ))}
      <button className="neo-pill" disabled={!answer || action.busy}>
        Vérifier ma réponse
      </button>
      <p role="status">
        {feedback ||
          (latest
            ? latest.data.passed
              ? "Dernier essai réussi ✓"
              : "Dernier essai à revoir"
            : "")}
      </p>
      <ActionFeedback action={action} />
    </form>
  );
}
function ExerciseQuestion({
  question: q,
  latest,
}: {
  question: LifeEntry;
  latest?: LifeEntry;
}) {
  const life = useLife(),
    action = useLifeAction(),
    [answer, setAnswer] = useState(text(latest, "answer")),
    [solution, setSolution] = useState(false);
  return (
    <div className="v4-question">
      <h3>{q.title}</h3>
      <p>{text(q, "instructions")}</p>
      <label>
        Ma réponse
        <textarea
          value={answer}
          maxLength={10000}
          onChange={(e) => setAnswer(e.target.value)}
        />
      </label>
      <button className="neo-pill" onClick={() => setSolution(!solution)}>
        Voir les critères / correction
      </button>
      {solution && (
        <p className="life-prewrap">
          {text(q, "solution") || "Aucune correction renseignée."}
        </p>
      )}
      <button
        className="neo-pill"
        disabled={!answer.trim() || action.busy}
        onClick={() =>
          void action.run(
            () =>
              life.save({
                universe: "finance",
                kind: "reflection",
                title: "Exercice : " + q.title,
                day: localDay(),
                data: {
                  studioType: "answer",
                  questionId: q.id,
                  questionVersion: questionVersion(q),
                  moduleId: text(q, "moduleId"),
                  answer,
                  passed: true,
                },
              }),
            "Exercice enregistré comme terminé.",
          )
        }
      >
        Enregistrer et marquer terminé
      </button>
      <small>Auto-évaluation à partir des critères que tu as renseignés.</small>
      <ActionFeedback action={action} />
    </div>
  );
}

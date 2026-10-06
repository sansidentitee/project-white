"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type DragEvent,
} from "react";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileUp,
  GraduationCap,
  Link as LinkIcon,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Save,
  SkipForward,
  Target,
  Trash2,
} from "lucide-react";
import {
  SmartDashboard,
  GradeSimulator,
  StartTask,
  Inbox,
} from "@/components/AcademicV3";
import { UnifiedPlanning } from "@/components/UnifiedPlanning";
import { SmartFocus } from "@/components/SmartFocus";
import { RevisionCoach } from "@/components/ProgressWorkspace";
import { reviewError, type Rating } from "@/lib/academic";
import { PageFrame } from "@/components/PageFrame";
import { useProject } from "@/components/ProjectProvider";
import { generalAverage, subjectAverage } from "@/lib/grades";
import type { Grade, Quadrant } from "@/lib/types";

const quadrantMeta: Record<Quadrant, { title: string; sub: string }> = {
  do: { title: "Faire", sub: "Urgent · important" },
  schedule: { title: "Planifier", sub: "Important · non urgent" },
  delegate: { title: "Déléguer", sub: "Urgent · peu important" },
  eliminate: { title: "Éliminer", sub: "Ni urgent · ni important" },
};

function PageTitle({
  eyebrow = "ACADÉMIE",
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="academic-page-title">
      <div>
        <span className="label">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

function CandlestickChart({ grades }: { grades: Grade[] }) {
  const { state } = useProject();
  const candles = useMemo(
    () =>
      state.subjects
        .map((subject) => {
          const list = grades
            .filter((g) => g.subjectId === subject.id)
            .sort(
              (a, b) =>
                new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime(),
            );
          if (!list.length) return null;
          const values = list.map((g) => (g.score / g.outOf) * 20);
          return {
            id: subject.id,
            label: subject.shortName || subject.name,
            open: values[0],
            close: values[values.length - 1],
            high: Math.max(...values),
            low: Math.min(...values),
            count: list.length,
          };
        })
        .filter(Boolean)
        .slice(0, 9) as Array<{
        id: string;
        label: string;
        open: number;
        close: number;
        high: number;
        low: number;
        count: number;
      }>,
    [grades, state.subjects],
  );

  if (!candles.length)
    return (
      <div className="empty">
        Ajoute des notes avec le bouton + pour construire le graphique.
      </div>
    );

  const W = 760,
    H = 300,
    padL = 42,
    padR = 18,
    padT = 18,
    padB = 42;
  const chartH = H - padT - padB;
  const y = (v: number) =>
    padT + ((20 - Math.max(0, Math.min(20, v))) / 20) * chartH;
  const step = (W - padL - padR) / candles.length;
  return (
    <div className="candle-chart-wrap">
      <svg
        className="candle-chart"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Évolution des notes sous forme de bougies par matière"
      >
        {[0, 5, 10, 15, 20].map((v) => (
          <g key={v}>
            <line
              className="candle-grid"
              x1={padL}
              x2={W - padR}
              y1={y(v)}
              y2={y(v)}
            />
            <text
              className="candle-y"
              x={padL - 9}
              y={y(v) + 4}
              textAnchor="end"
            >
              {v}
            </text>
          </g>
        ))}
        {candles.map((c, i) => {
          const x = padL + step * i + step / 2;
          const top = Math.min(y(c.open), y(c.close));
          const bottom = Math.max(y(c.open), y(c.close));
          const up = c.close >= c.open;
          return (
            <g key={c.id} className={up ? "candle-up" : "candle-down"}>
              <line
                className="candle-wick"
                x1={x}
                x2={x}
                y1={y(c.high)}
                y2={y(c.low)}
              />
              <rect
                className="candle-body"
                x={x - 8}
                y={top}
                width={16}
                height={Math.max(4, bottom - top)}
                rx={3}
              />
              <circle className="candle-close" cx={x} cy={y(c.close)} r={2.5} />
              <text
                className="candle-label"
                x={x}
                y={H - 17}
                textAnchor="middle"
              >
                {c.label.length > 9 ? c.label.slice(0, 8) + "…" : c.label}
              </text>
              <title>
                {c.label} · première {c.open.toFixed(1)}/20 · dernière{" "}
                {c.close.toFixed(1)}/20 · min {c.low.toFixed(1)} · max{" "}
                {c.high.toFixed(1)}
              </title>
            </g>
          );
        })}
      </svg>
      <p className="candle-caption">
        Corps : première → dernière note · mèche : minimum → maximum de la
        matière.
      </p>
    </div>
  );
}

function AcademicDashboard() {
  const { state, updateTask, setAverageGoal } = useProject();
  const avg = generalAverage(state.grades);
  const target = state.preferences.averageGoal || 18;
  const done = state.tasks.filter((t) => t.status === "done").length;
  const open = state.tasks.filter((t) => t.status !== "done");
  const late = open.filter(
    (t) => t.dueAt && new Date(t.dueAt).getTime() < Date.now(),
  ).length;
  const errorOpen = state.errors.filter((e) => e.status !== "mastered").length;
  const minutes = state.sessions.reduce((s, x) => s + x.durationMin, 0);
  const subjectMap = useMemo(
    () => Object.fromEntries(state.subjects.map((s) => [s.id, s.name])),
    [state.subjects],
  );
  const priorities = [...open]
    .sort((a, b) => {
      const da = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
      const db = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
      return a.priority - b.priority || da - db;
    })
    .slice(0, 3);
  const subjects = [...state.subjects]
    .map((s) => ({ s, avg: subjectAverage(state.grades, s.id) }))
    .sort((a, b) => (a.avg ?? 99) - (b.avg ?? 99))
    .slice(0, 6);
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
  const taskPct = state.tasks.length
    ? Math.round((done / state.tasks.length) * 100)
    : 0;
  const avgPct = avg ? Math.min(100, (avg / 20) * 100) : 0;

  return (
    <>
      <SmartDashboard />
      <div
        hidden={
          !!state.preferences.dashboardWidgets &&
          !state.preferences.dashboardWidgets.includes("overview")
        }
      >
        <PageTitle
          title="Centre académique"
          subtitle="Notes, échéances, erreurs et révisions — uniquement ce qui aide à progresser."
        />
        <div className="academic-kpi-band">
          <Link href="/academic/grades" className="academic-kpi">
            <div
              className="mini-donut"
              style={{ "--p": avgPct } as CSSProperties}
            >
              <span />
            </div>
            <div>
              <small>MOYENNE</small>
              <strong>
                {avg !== null ? avg.toFixed(1).replace(".0", "") : "—"}
              </strong>
              <p>/ 20 · {state.grades.length} notes</p>
            </div>
          </Link>
          <Link href="/academic/tasks" className="academic-kpi">
            <div
              className="mini-donut"
              style={{ "--p": taskPct } as CSSProperties}
            >
              <span />
            </div>
            <div>
              <small>TÂCHES</small>
              <strong>{open.length}</strong>
              <p>{late ? late + " en retard" : "aucun retard"}</p>
            </div>
          </Link>
          <Link href="/academic/errors" className="academic-kpi">
            <div
              className="mini-donut"
              style={{ "--p": Math.min(100, errorOpen * 15) } as CSSProperties}
            >
              <span />
            </div>
            <div>
              <small>ERREURS</small>
              <strong>{errorOpen}</strong>
              <p>à corriger / revoir</p>
            </div>
          </Link>
          <Link href="/academic/revisions" className="academic-kpi">
            <div
              className="mini-donut"
              style={{ "--p": Math.min(100, minutes / 6) } as CSSProperties}
            >
              <span />
            </div>
            <div>
              <small>RÉVISIONS</small>
              <strong>{Math.round(minutes / 60)} h</strong>
              <p>{state.sessions.length} sessions</p>
            </div>
          </Link>
        </div>

        <div className="academic-home-grid">
          <section className="neo-panel hero-average-panel">
            <div className="panel-head">
              <span className="label">MOYENNE GÉNÉRALE</span>
              <Link href="/academic/grades">notes</Link>
            </div>
            <div
              className="academic-hero-ring"
              style={{ "--p": avgPct } as CSSProperties}
            >
              <div>
                <strong>
                  {avg !== null ? avg.toFixed(1).replace(".0", "") : "—"}
                </strong>
                <span>/ 20</span>
              </div>
            </div>
            <div className="academic-target-line">
              <span>Objectif</span>
              <input
                aria-label="Objectif de moyenne"
                type="number"
                min="0"
                max="20"
                step=".1"
                defaultValue={target}
                onBlur={(e) => setAverageGoal(Number(e.target.value) || 18)}
              />
            </div>
            <div className="academic-target-status">
              {avg
                ? avg >= target
                  ? "objectif atteint"
                  : "écart : " + (target - avg).toFixed(1) + " pt"
                : "ajoute tes premières notes"}
            </div>
          </section>

          <div className="academic-center-stack">
            <section className="neo-panel">
              <div className="panel-head">
                <span className="label">SEMAINE</span>
                <Link href="/academic/calendar">agenda</Link>
              </div>
              <div className="academic-week-strip">
                {week.map((d, i) => {
                  const n = state.tasks.filter(
                    (t) =>
                      t.status !== "done" &&
                      t.dueAt &&
                      new Date(t.dueAt).toDateString() === d.toDateString(),
                  ).length;
                  return (
                    <div key={i} className={i === 0 ? "today" : ""}>
                      <small>
                        {new Intl.DateTimeFormat("fr-FR", {
                          weekday: "short",
                        }).format(d)}
                      </small>
                      <strong>{d.getDate()}</strong>
                      <span>
                        {n
                          ? Array.from({ length: Math.min(3, n) }, (_, x) => (
                              <i key={x} />
                            ))
                          : null}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="neo-panel grow-panel">
              <div className="panel-head">
                <span className="label">MATIÈRES À SURVEILLER</span>
                <Link href="/academic/subjects">matières</Link>
              </div>
              <div className="subject-urgency-list">
                {subjects.length ? (
                  subjects.map(({ s, avg: a }) => (
                    <Link
                      href={"/subjects/" + s.id}
                      key={s.id}
                      className="subject-urgency-row"
                    >
                      <span>
                        <strong>{s.name}</strong>
                        <small>
                          {
                            state.chapters.filter((c) => c.subjectId === s.id)
                              .length
                          }{" "}
                          chapitres
                        </small>
                      </span>
                      <div className="spark-placeholder">
                        <i
                          style={{
                            width:
                              (a ? Math.min(100, (a / 20) * 100) : 0) + "%",
                          }}
                        />
                      </div>
                      <b>{a === null ? "—" : a.toFixed(1).replace(".0", "")}</b>
                    </Link>
                  ))
                ) : (
                  <p className="empty">Aucune matière.</p>
                )}
              </div>
            </section>
          </div>

          <div className="academic-right-stack">
            <section className="neo-panel grow-panel">
              <div className="panel-head">
                <span className="label">À FAIRE</span>
                <Link href="/academic/tasks">matrice</Link>
              </div>
              <div className="dashboard-task-list">
                {priorities.length ? (
                  priorities.map((t) => (
                    <div key={t.id} className="dashboard-task-row">
                      <button
                        className={
                          "neo-check " + (t.status === "done" ? "done" : "")
                        }
                        onClick={() =>
                          updateTask(t.id, {
                            status: t.status === "done" ? "todo" : "done",
                          })
                        }
                      >
                        {t.status === "done" ? <Check size={12} /> : null}
                      </button>
                      <span>
                        <strong>{t.title}</strong>
                        <small>
                          {t.subjectId ? subjectMap[t.subjectId] : "Général"} ·{" "}
                          {t.durationMin} min
                          {t.dueAt
                            ? " · " +
                              new Date(t.dueAt).toLocaleDateString("fr-FR", {
                                day: "2-digit",
                                month: "2-digit",
                              })
                            : ""}
                        </small>
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="empty">Rien à faire.</p>
                )}
              </div>
            </section>

            <section className="neo-panel">
              <div className="panel-head">
                <span className="label">BANQUE D’ERREURS</span>
                <Link href="/academic/errors">réviser</Link>
              </div>
              <div className="error-mini-list">
                {state.errors
                  .filter((e) => e.status !== "mastered")
                  .slice(0, 3)
                  .map((e) => (
                    <div key={e.id}>
                      <AlertTriangle size={13} />
                      <span>{e.title}</span>
                    </div>
                  ))}
                {!state.errors.some((e) => e.status !== "mastered") && (
                  <p className="empty sm">Aucune erreur active.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

function GradesPage() {
  const { state } = useProject();
  const avg = generalAverage(state.grades);
  const subjectMap = useMemo(
    () => Object.fromEntries(state.subjects.map((s) => [s.id, s.name])),
    [state.subjects],
  );

  return (
    <>
      <GradeSimulator />
      <PageTitle
        title="Suivi des notes"
        subtitle="Les notes gardent leur barème réel et leur coefficient ; l’ajout se fait depuis le bouton +."
      />
      <div className="grades-overview-grid">
        <section className="neo-panel candle-panel">
          <div className="panel-head">
            <span className="label">BOUGIES · ÉVOLUTION PAR MATIÈRE</span>
            <span>{state.grades.length} notes</span>
          </div>
          <CandlestickChart grades={state.grades} />
        </section>
        <section className="neo-panel averages-panel">
          <div className="panel-head">
            <span className="label">MOYENNES PAR MATIÈRE</span>
            <span>
              {avg !== null ? avg.toFixed(1).replace(".0", "") + "/20" : "—"}
            </span>
          </div>
          <div className="subject-average-list">
            {state.subjects.map((s) => {
              const a = subjectAverage(state.grades, s.id);
              return (
                <div key={s.id}>
                  <span>
                    <strong>{s.name}</strong>
                    <small>
                      {state.grades.filter((g) => g.subjectId === s.id).length}{" "}
                      notes
                    </small>
                  </span>
                  <div className="inset-progress">
                    <i
                      style={{
                        width: (a ? Math.min(100, (a / 20) * 100) : 0) + "%",
                      }}
                    />
                  </div>
                  <b>{a === null ? "—" : a.toFixed(1).replace(".0", "")}</b>
                </div>
              );
            })}
          </div>
        </section>
      </div>
      <section className="neo-panel section-space">
        <div className="panel-head">
          <span className="label">DERNIÈRES NOTES</span>
          <span>barème · coefficient · équivalent /20</span>
        </div>
        <div className="grade-list detailed">
          {state.grades.slice(0, 18).map((g) => (
            <div key={g.id}>
              <small>
                {new Date(g.takenAt).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                })}
              </small>
              <span>
                <strong>{g.title}</strong>
                <em>{subjectMap[g.subjectId]}</em>
              </span>
              <span className="grade-raw">
                <b>
                  {g.score}/{g.outOf}
                </b>
                <em>coef. {g.coefficient}</em>
              </span>
              <b className="grade-normalized">
                {((g.score / g.outOf) * 20).toFixed(1).replace(".0", "")}/20
              </b>
            </div>
          ))}
          {!state.grades.length && (
            <p className="empty">Aucune note enregistrée.</p>
          )}
        </div>
      </section>
    </>
  );
}

function TasksPage() {
  const { state, addTask, updateTask, removeTask } = useProject();
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [due, setDue] = useState("");
  const [duration, setDuration] = useState("45");
  const [quadrant, setQuadrant] = useState<Quadrant>("do");
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Quadrant | null>(null);
  const subjectMap = useMemo(
    () => Object.fromEntries(state.subjects.map((s) => [s.id, s.name])),
    [state.subjects],
  );

  async function createTask() {
    if (!title.trim()) return;
    await addTask({
      subjectId: subjectId || null,
      title: title.trim(),
      details: null,
      kind: "study",
      dueAt: due ? new Date(due + "T20:00:00").toISOString() : null,
      plannedStart: null,
      durationMin: Math.max(5, Number(duration) || 45),
      status: "todo",
      quadrant,
      priority: quadrant === "do" ? 1 : quadrant === "schedule" ? 2 : 3,
    });
    setTitle("");
    setDue("");
    setDuration("45");
  }

  function startDrag(e: DragEvent<HTMLElement>, id: string) {
    setDragging(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }
  async function drop(e: DragEvent<HTMLElement>, q: Quadrant) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || dragging;
    setDragOver(null);
    setDragging(null);
    if (id)
      await updateTask(id, {
        quadrant: q,
        priority: q === "do" ? 1 : q === "schedule" ? 2 : 3,
      });
  }

  return (
    <>
      <PageTitle
        title="Tâches · Matrice d’Eisenhower"
        subtitle="Ajoute une durée, puis déplace les cartes entre les quadrants par glisser-déposer."
      />
      <section className="neo-panel task-composer">
        <input
          className="neo-input grow"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createTask()}
          placeholder="Ajouter une tâche académique…"
        />
        <select
          className="neo-input"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
        >
          <option value="">Matière</option>
          {state.subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          className="neo-input"
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
        />
        <div className="duration-input">
          <Clock3 size={14} />
          <input
            className="neo-input"
            type="number"
            min="5"
            step="5"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
          <span>min</span>
        </div>
        <select
          className="neo-input"
          value={quadrant}
          onChange={(e) => setQuadrant(e.target.value as Quadrant)}
        >
          {Object.entries(quadrantMeta).map(([k, v]) => (
            <option key={k} value={k}>
              {v.title}
            </option>
          ))}
        </select>
        <button className="round-action" onClick={createTask}>
          <Plus size={16} />
        </button>
      </section>
      <div className="eisenhower-grid">
        {(Object.keys(quadrantMeta) as Quadrant[]).map((q) => (
          <section
            key={q}
            className={
              "neo-panel eisenhower-quadrant " +
              (dragOver === q ? "drag-over" : "")
            }
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(q);
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => drop(e, q)}
          >
            <div className="quadrant-head">
              <div>
                <span className="label">{quadrantMeta[q].title}</span>
                <p>{quadrantMeta[q].sub}</p>
              </div>
              <b>
                {
                  state.tasks.filter(
                    (t) => t.status !== "done" && t.quadrant === q,
                  ).length
                }
              </b>
            </div>
            <div className="quadrant-list">
              {state.tasks
                .filter((t) => t.quadrant === q)
                .map((t) => (
                  <article
                    key={t.id}
                    draggable
                    onDragStart={(e) => startDrag(e, t.id)}
                    onDragEnd={() => {
                      setDragging(null);
                      setDragOver(null);
                    }}
                    className={
                      (t.status === "done" ? "done " : "") +
                      (dragging === t.id ? "dragging" : "")
                    }
                  >
                    <button
                      className={
                        "neo-check " + (t.status === "done" ? "done" : "")
                      }
                      onClick={() =>
                        updateTask(t.id, {
                          status: t.status === "done" ? "todo" : "done",
                        })
                      }
                    >
                      {t.status === "done" ? <Check size={12} /> : null}
                    </button>
                    <div>
                      <strong>{t.title}</strong>
                      <small>
                        {t.subjectId ? subjectMap[t.subjectId] : "Général"}
                        {t.dueAt
                          ? " · " +
                            new Date(t.dueAt).toLocaleDateString("fr-FR")
                          : ""}
                      </small>
                    </div>
                    <label className="task-duration-edit">
                      <Clock3 size={11} />
                      <input
                        type="number"
                        min="5"
                        step="5"
                        value={t.durationMin}
                        onChange={(e) =>
                          updateTask(t.id, {
                            durationMin: Math.max(
                              5,
                              Number(e.target.value) || 5,
                            ),
                          })
                        }
                      />
                      <span>min</span>
                    </label>
                    <StartTask id={t.id} />
                    <button
                      className="icon-ghost"
                      onClick={() => removeTask(t.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </article>
                ))}
              {!state.tasks.some((t) => t.quadrant === q) && (
                <p className="empty sm">Dépose une tâche ici.</p>
              )}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

function SubjectsPage() {
  const { state } = useProject();
  return (
    <>
      <PageTitle
        title="Matières"
        subtitle="Une lecture rapide de chaque matière : moyenne, chapitres et niveau de maîtrise."
      />
      <div className="academic-subject-grid">
        {state.subjects.map((s) => {
          const a = subjectAverage(state.grades, s.id);
          const chapters = state.chapters.filter((c) => c.subjectId === s.id);
          const mastered = chapters.filter(
            (c) => c.status === "mastered" || c.status === "solid",
          ).length;
          const p = chapters.length
            ? Math.round((mastered / chapters.length) * 100)
            : 0;
          return (
            <Link
              href={"/subjects/" + s.id}
              key={s.id}
              className="neo-panel subject-tile"
            >
              <span className="subject-orb">
                <GraduationCap size={19} />
              </span>
              <div>
                <span className="label">{s.shortName}</span>
                <h2>{s.name}</h2>
              </div>
              <div className="subject-score">
                <strong>
                  {a === null ? "—" : a.toFixed(1).replace(".0", "")}
                </strong>
                <small>/20</small>
              </div>
              <div className="inset-progress">
                <i style={{ width: p + "%" }} />
              </div>
              <footer>
                <span>{chapters.length} chapitres</span>
                <span>{p}% maîtrisé</span>
                <ChevronRight size={15} />
              </footer>
            </Link>
          );
        })}
      </div>
    </>
  );
}

function ErrorsPage() {
  const { state, addError, updateError, removeError } = useProject();
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [correction, setCorrection] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [chapterId, setChapterId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const subjectMap = useMemo(
    () => Object.fromEntries(state.subjects.map((s) => [s.id, s.name])),
    [state.subjects],
  );
  const dueCards = useMemo(
    () =>
      state.errors
        .filter(
          (e) =>
            e.status !== "mastered" &&
            (!e.nextReviewAt ||
              new Date(e.nextReviewAt).getTime() <= Date.now()),
        )
        .sort(
          (a, b) =>
            new Date(a.nextReviewAt || 0).getTime() -
            new Date(b.nextReviewAt || 0).getTime(),
        ),
    [state.errors],
  );
  const current = dueCards[0];

  async function create() {
    if (!title.trim() || pending) return;
    setPending(true);
    setError("");
    try {
      await addError({
        chapterId: chapterId || null,
        subjectId: subjectId || null,
        title: title.trim(),
        details: details.trim() || null,
        correction: correction.trim() || null,
        status: "open",
        nextReviewAt: new Date().toISOString(),
      });
      setTitle("");
      setDetails("");
      setCorrection("");
    } catch {
      setError("Carte non enregistrée. Réessaie.");
    } finally {
      setPending(false);
    }
  }

  async function answer(rating: Rating) {
    if (!current || pending) return;
    setPending(true);
    setError("");
    try {
      await updateError(current.id, reviewError(current, rating));
      setRevealed(false);
    } catch {
      setError("Révision non enregistrée. Réessaie.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <PageTitle
        title="Banque d’erreurs"
        subtitle="Les erreurs reviennent comme des cartes : rappelle-toi la correction avant de retourner la carte."
      />
      <div className="error-review-layout">
        <section className="neo-panel anki-deck">
          <div className="panel-head">
            <span className="label">RÉVISION · {dueCards.length} DUE</span>
            <span>
              {current?.subjectId ? subjectMap[current.subjectId] : "Général"}
            </span>
          </div>
          {current ? (
            <div className={"anki-card " + (revealed ? "revealed" : "")}>
              <div className="anki-front">
                <small>ERREUR</small>
                <h2>{current.title}</h2>
                {current.details && <p>{current.details}</p>}
              </div>
              {revealed ? (
                <div className="anki-back">
                  <span>Correction</span>
                  <p>
                    {current.correction ||
                      "Ajoute une correction précise à cette erreur."}
                  </p>
                </div>
              ) : (
                <button
                  className="neo-pill reveal-card"
                  onClick={() => setRevealed(true)}
                >
                  Afficher la correction
                </button>
              )}
              {revealed && (
                <div className="anki-actions" aria-busy={pending}>
                  {(["again", "hard", "good", "easy"] as Rating[]).map(
                    (r, i) => (
                      <button
                        disabled={pending}
                        key={r}
                        onClick={() => void answer(r)}
                      >
                        <span>
                          {["Encore", "Difficile", "Bien", "Facile"][i]}
                        </span>
                        <small>
                          {r === "again"
                            ? "10 min"
                            : Math.round(
                                reviewError(current, r).intervalDays || 0,
                              ) + " jours"}
                        </small>
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="anki-empty">
              <Check size={23} />
              <strong>Rien à réviser maintenant</strong>
              <p>Les cartes réapparaîtront à leur prochaine échéance.</p>
            </div>
          )}
        </section>

        <section className="neo-panel academic-form-panel error-composer">
          <span className="label">NOUVELLE CARTE</span>
          <label className="neo-field">
            Matière
            <select
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setChapterId("");
              }}
            >
              <option value="">Général</option>
              {state.subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          {error && <p role="alert">{error}</p>}
          <label className="neo-field">
            Chapitre
            <select
              value={chapterId}
              onChange={(e) => setChapterId(e.target.value)}
            >
              <option value="">Sans chapitre</option>
              {state.chapters
                .filter((c) => c.subjectId === subjectId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
            </select>
          </label>
          <label className="neo-field">
            Erreur
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ce que j’ai raté"
            />
          </label>
          <label className="neo-field">
            Contexte
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Pourquoi je me suis trompé ?"
            />
          </label>
          <label className="neo-field">
            Correction
            <textarea
              value={correction}
              onChange={(e) => setCorrection(e.target.value)}
              placeholder="Méthode ou règle à retrouver"
            />
          </label>
          <button
            className="neo-pill primary"
            disabled={pending}
            onClick={create}
          >
            <Plus size={15} />
            Créer la carte
          </button>
        </section>
      </div>

      <section className="neo-panel section-space">
        <div className="panel-head">
          <span className="label">TOUTES LES CARTES</span>
          <span>{state.errors.length}</span>
        </div>
        <div className="error-card-library">
          {state.errors.map((e) => (
            <div key={e.id}>
              <span>
                <strong>{e.title}</strong>
                <small>
                  {e.subjectId ? subjectMap[e.subjectId] : "Général"} ·{" "}
                  {e.status}
                </small>
              </span>
              <button className="icon-ghost" onClick={() => removeError(e.id)}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          {!state.errors.length && <p className="empty">Aucune carte.</p>}
        </div>
      </section>
    </>
  );
}

type FocusConfig = {
  pomodoro: number;
  shortBreak: number;
  longBreak: number;
  cycles: number;
  deep: number;
};

function ResourcesPage() {
  const { state, addResource, uploadResource, updateResource, removeResource } =
    useProject();
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const subjectMap = useMemo(
    () => Object.fromEntries(state.subjects.map((s) => [s.id, s.name])),
    [state.subjects],
  );

  async function add() {
    if (!subjectId || !title.trim() || !url.trim()) return;
    await addResource({
      subjectId,
      title: title.trim(),
      url: url.trim(),
      kind: "link",
    });
    setTitle("");
    setUrl("");
  }
  async function saveRename(id: string) {
    if (editTitle.trim()) await updateResource(id, { title: editTitle.trim() });
    setEditing(null);
  }

  return (
    <>
      <PageTitle
        title="Ressources"
        subtitle="Importe, ouvre, renomme ou supprime tes ressources sans quitter l’univers Académie."
      />
      <div className="academic-split-layout">
        <section className="neo-panel academic-form-panel">
          <span className="label">AJOUTER</span>
          <label className="neo-field">
            Matière
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              <option value="">Choisir</option>
              {state.subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="neo-field">
            Titre
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Cours chapitre 3"
            />
          </label>
          <label className="neo-field">
            Lien
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
            />
          </label>
          <button className="neo-pill primary" onClick={add}>
            <LinkIcon size={14} />
            Ajouter le lien
          </button>
          <label className="file-drop">
            <FileUp size={17} />
            <span>Importer un fichier</span>
            <input
              type="file"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f && subjectId) await uploadResource(subjectId, f);
              }}
            />
          </label>
        </section>

        <section className="neo-panel">
          <div className="panel-head">
            <span className="label">BIBLIOTHÈQUE</span>
            <span>{state.resources.length}</span>
          </div>
          <div className="resource-manager">
            {state.resources.map((r) => (
              <article key={r.id}>
                <span className="resource-icon">
                  {r.kind === "file" ? (
                    <FileUp size={16} />
                  ) : (
                    <LinkIcon size={16} />
                  )}
                </span>
                <div className="resource-copy">
                  {editing === r.id ? (
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void saveRename(r.id);
                        if (e.key === "Escape") setEditing(null);
                      }}
                    />
                  ) : (
                    <>
                      <strong>{r.title}</strong>
                      <small>{subjectMap[r.subjectId]}</small>
                    </>
                  )}
                </div>
                <div className="resource-actions">
                  {editing === r.id ? (
                    <button onClick={() => saveRename(r.id)}>
                      <Save size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setEditing(r.id);
                        setEditTitle(r.title);
                      }}
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  <a href={r.url} target="_blank" rel="noreferrer">
                    <ExternalLink size={14} />
                  </a>
                  <button onClick={() => removeResource(r.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </article>
            ))}
            {!state.resources.length && (
              <p className="empty">Aucune ressource enregistrée.</p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function GoalsPage() {
  const { state, addGoal, updateGoal, removeGoal, setAverageGoal } =
    useProject();
  const avg = generalAverage(state.grades);
  const target = state.preferences.averageGoal || 18;
  const [title, setTitle] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("");
  const [due, setDue] = useState("");

  async function create() {
    if (!title.trim()) return;
    await addGoal({
      title: title.trim(),
      details: null,
      targetValue: targetValue ? Number(targetValue) : null,
      currentValue: 0,
      unit: unit.trim() || null,
      dueAt: due ? new Date(due + "T20:00:00").toISOString() : null,
      status: "active",
    });
    setTitle("");
    setTargetValue("");
    setUnit("");
    setDue("");
  }

  const avgProgress = avg ? Math.min(100, (avg / target) * 100) : 0;
  return (
    <>
      <PageTitle
        title="Objectifs"
        subtitle="Définis tes propres objectifs et garde la moyenne cible séparée du reste."
      />
      <div className="goals-layout">
        <section className="neo-panel goal-focus">
          <span className="label">MOYENNE CIBLE</span>
          <div
            className="goal-ring"
            style={{ "--p": avgProgress } as CSSProperties}
          >
            <div>
              <strong>
                {avg !== null ? avg.toFixed(1).replace(".0", "") : "—"}
              </strong>
              <small>/ {target}</small>
            </div>
          </div>
          <label className="neo-field">
            Objectif sur 20
            <input
              type="number"
              min="0"
              max="20"
              step=".1"
              value={target}
              onChange={(e) => setAverageGoal(Number(e.target.value) || 18)}
            />
          </label>
        </section>

        <section className="neo-panel goal-create-panel">
          <span className="label">NOUVEL OBJECTIF</span>
          <label className="neo-field">
            Nom
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex. finir 3 chapitres"
            />
          </label>
          <div className="field-row">
            <label className="neo-field">
              Cible
              <input
                type="number"
                step=".1"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="3"
              />
            </label>
            <label className="neo-field">
              Unité
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="chapitres"
              />
            </label>
          </div>
          <label className="neo-field">
            Échéance
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </label>
          <button className="neo-pill primary" onClick={create}>
            <Plus size={15} />
            Ajouter l’objectif
          </button>
        </section>
      </div>

      <section className="neo-panel section-space">
        <div className="panel-head">
          <span className="label">MES OBJECTIFS</span>
          <span>
            {state.goals.filter((g) => g.status === "active").length} actifs
          </span>
        </div>
        <div className="custom-goal-list">
          {state.goals.map((g) => {
            const p =
              g.targetValue && g.targetValue > 0
                ? Math.min(100, (g.currentValue / g.targetValue) * 100)
                : g.status === "done"
                  ? 100
                  : 0;
            return (
              <article key={g.id} className={g.status === "done" ? "done" : ""}>
                <button
                  className={"neo-check " + (g.status === "done" ? "done" : "")}
                  onClick={() =>
                    updateGoal(g.id, {
                      status: g.status === "done" ? "active" : "done",
                    })
                  }
                >
                  {g.status === "done" ? <Check size={12} /> : null}
                </button>
                <div className="goal-copy">
                  <strong>{g.title}</strong>
                  <small>
                    {g.dueAt
                      ? "échéance " +
                        new Date(g.dueAt).toLocaleDateString("fr-FR")
                      : "sans échéance"}
                  </small>
                  <div className="inset-progress">
                    <i style={{ width: p + "%" }} />
                  </div>
                </div>
                {g.targetValue != null ? (
                  <label className="goal-current">
                    <input
                      type="number"
                      step=".1"
                      value={g.currentValue}
                      onChange={(e) =>
                        updateGoal(g.id, {
                          currentValue: Number(e.target.value) || 0,
                        })
                      }
                    />
                    <span>
                      / {g.targetValue} {g.unit || ""}
                    </span>
                  </label>
                ) : (
                  <span />
                )}
                <button className="icon-ghost" onClick={() => removeGoal(g.id)}>
                  <Trash2 size={13} />
                </button>
              </article>
            );
          })}
          {!state.goals.length && (
            <p className="empty">Ajoute ton premier objectif.</p>
          )}
        </div>
      </section>
    </>
  );
}

export default function AcademicSectionPage() {
  const params = useParams<{ section: string }>();
  let content: React.ReactNode;
  switch (params.section) {
    case "inbox":
      return (
        <PageFrame>
          <Inbox />
        </PageFrame>
      );
    case "dashboard":
      content = <AcademicDashboard />;
      break;
    case "grades":
      content = <GradesPage />;
      break;
    case "tasks":
      content = <TasksPage />;
      break;
    case "calendar":
      content = <UnifiedPlanning matrix={<TasksPage />} />;
      break;
    case "subjects":
      content = <SubjectsPage />;
      break;
    case "errors":
      content = <ErrorsPage />;
      break;
    case "revisions":
      content = (
        <>
          <RevisionCoach />
          <SmartFocus />
        </>
      );
      break;
    case "resources":
      content = <ResourcesPage />;
      break;
    case "goals":
      content = <GoalsPage />;
      break;
    default:
      content = <AcademicDashboard />;
  }
  return (
    <PageFrame>
      <div className="academic-page">{content}</div>
    </PageFrame>
  );
}

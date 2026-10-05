"use client";
import { useState, type ReactNode } from "react";
import { useProject } from "./ProjectProvider";
import { StartTask } from "./AcademicV3";
export function UnifiedPlanning({ matrix }: { matrix: ReactNode }) {
  const { state, updateTask } = useProject();
  const [view, setView] = useState("Agenda"),
    [offset, setOffset] = useState(0),
    [error, setError] = useState("");
  const open = state.tasks.filter((t) => t.status !== "done");
  const anchor = new Date();
  anchor.setHours(0, 0, 0, 0);
  if (view === "Calendrier") {
    anchor.setDate(1);
    anchor.setMonth(anchor.getMonth() + offset);
  } else anchor.setDate(anchor.getDate() + offset * 7);
  const count =
    view === "Calendrier"
      ? new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate()
      : 7;
  const days = Array.from({ length: count }, (_, i) => {
    const d = new Date(anchor);
    d.setDate(d.getDate() + i);
    return d;
  });
  async function schedule(id: string, date: Date) {
    const d = new Date(date);
    d.setHours(17, 0, 0, 0);
    try {
      await updateTask(id, { plannedStart: d.toISOString() });
      setError("");
    } catch {
      setError("Créneau non enregistré. Réessaie.");
    }
  }
  return (
    <>
      <h1>Planning unifié</h1>
      <div className="v3-row">
        {["Eisenhower", "Agenda", "Semaine", "Calendrier"].map((v) => (
          <button
            className="neo-pill"
            aria-pressed={view === v}
            key={v}
            onClick={() => {
              setView(v);
              setOffset(0);
            }}
          >
            {v}
          </button>
        ))}
      </div>
      {error && <p role="alert">{error}</p>}
      {view === "Eisenhower" ? (
        matrix
      ) : view === "Agenda" ? (
        <section className="neo-panel section-space">
          <h2>
            Agenda · {open.reduce((a, t) => a + t.durationMin, 0)} min restantes
          </h2>
          {[...open]
            .sort(
              (a, b) =>
                Date.parse(a.plannedStart || a.dueAt || "9999-01-01") -
                Date.parse(b.plannedStart || b.dueAt || "9999-01-01"),
            )
            .map((t) => (
              <div className="v3-row" key={t.id}>
                <span>
                  <strong>{t.title}</strong>
                  <small>
                    {t.durationMin} min · échéance{" "}
                    {t.dueAt
                      ? new Date(t.dueAt).toLocaleDateString("fr-FR")
                      : "libre"}
                  </small>
                </span>
                <label>
                  Créneau
                  <input
                    aria-label={"Planifier " + t.title}
                    type="datetime-local"
                    defaultValue={
                      t.plannedStart
                        ? new Date(
                            Date.parse(t.plannedStart) -
                              new Date(t.plannedStart).getTimezoneOffset() *
                                60000,
                          )
                            .toISOString()
                            .slice(0, 16)
                        : ""
                    }
                    onChange={(e) => {
                      if (e.target.value)
                        void updateTask(t.id, {
                          plannedStart: new Date(e.target.value).toISOString(),
                        }).catch(() => setError("Créneau non enregistré."));
                    }}
                  />
                </label>
                <StartTask id={t.id} />
              </div>
            ))}
        </section>
      ) : (
        <>
          <div className="v3-row">
            <button
              className="neo-pill"
              onClick={() => setOffset((o) => o - 1)}
            >
              Précédent
            </button>
            <strong>
              {anchor.toLocaleDateString("fr-FR", {
                month: "long",
                year: "numeric",
              })}
            </strong>
            <button
              className="neo-pill"
              onClick={() => setOffset((o) => o + 1)}
            >
              Suivant
            </button>
          </div>
          <div className="v3-calendar">
            {days.map((d) => (
              <section
                className="neo-panel"
                key={d.toISOString()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain");
                  if (open.some((t) => t.id === id)) void schedule(id, d);
                }}
              >
                <h3>
                  {d.toLocaleDateString("fr-FR", {
                    weekday: "short",
                    day: "numeric",
                  })}
                </h3>
                {open
                  .filter((t) =>
                    [t.plannedStart, t.dueAt].some(
                      (date) =>
                        date &&
                        new Date(date).toDateString() === d.toDateString(),
                    ),
                  )
                  .map((t) => (
                    <article
                      draggable
                      key={t.id}
                      onDragStart={(e) =>
                        e.dataTransfer.setData("text/plain", t.id)
                      }
                    >
                      <strong>{t.title}</strong>
                      <p>
                        {t.durationMin} min ·{" "}
                        {t.plannedStart &&
                        new Date(t.plannedStart).toDateString() ===
                          d.toDateString()
                          ? "créneau"
                          : "échéance"}
                      </p>
                      <StartTask id={t.id} />
                    </article>
                  ))}
              </section>
            ))}
          </div>
          <p>
            Glisse une tâche sur un jour pour déplacer son créneau. L’échéance
            reste visible.
          </p>
        </>
      )}
    </>
  );
}

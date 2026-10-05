"use client";
import { useEffect, useRef, useState } from "react";
import { useProject } from "./ProjectProvider";
export function SmartFocus() {
  const { state, addSession, updateTask } = useProject();
  const [taskId, setTaskId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [mode, setMode] = useState<"deep" | "pomodoro">("deep");
  const [minutes, setMinutes] = useState(25);
  const [shortBreak, setShort] = useState(5);
  const [longBreak, setLong] = useState(15);
  const [cycles, setCycles] = useState(4);
  const [phase, setPhase] = useState<"focus" | "break">("focus");
  const [cycle, setCycle] = useState(0);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const elapsed = useRef(0),
    timeLeft = useRef(remaining),
    lastTick = useRef(0),
    started = useRef<Date | null>(null),
    lock = useRef(false),
    initialized = useRef(false);
  useEffect(() => {
    if (initialized.current || !state.tasks.length) return;
    initialized.current = true;
    const requested = new URLSearchParams(window.location.search).get("task");
    const task = state.tasks.find((t) => t.id === requested);
    if (task) {
      setTaskId(task.id);
      setSubjectId(task.subjectId || "");
      setMinutes(task.durationMin);
      setRemaining(task.durationMin * 60);
    }
  }, [state.tasks]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("pw-focus-config");
      if (raw) {
        const c = JSON.parse(raw);
        setShort(Math.min(60, Math.max(1, Number(c.shortBreak) || 5)));
        setLong(Math.min(120, Math.max(1, Number(c.longBreak) || 15)));
        setCycles(Math.min(12, Math.max(1, Number(c.cycles) || 4)));
        if (!new URLSearchParams(window.location.search).has("task")) {
          const n = Math.min(720, Math.max(1, Number(c.deep) || 25));
          setMinutes(n);
          setRemaining(n * 60);
        }
      }
    } catch {}
  }, []);
  function persistSettings() {
    localStorage.setItem(
      "pw-focus-config",
      JSON.stringify({
        deep: minutes,
        pomodoro: minutes,
        shortBreak,
        longBreak,
        cycles,
      }),
    );
    setMessage("Réglages enregistrés.");
  }
  const task = state.tasks.find((t) => t.id === taskId);
  useEffect(() => {
    if (!running) return;
    lastTick.current = Date.now();
    timeLeft.current = remaining;
    const id = setInterval(() => {
      const now = Date.now(),
        delta = (now - lastTick.current) / 1000;
      lastTick.current = now;
      const consumed = Math.min(delta, timeLeft.current);
      if (phase === "focus") elapsed.current += consumed;
      timeLeft.current = Math.max(0, timeLeft.current - consumed);
      setRemaining(timeLeft.current);
    }, 250);
    return () => clearInterval(id);
  }, [running, phase]);
  async function save(
    outcome: "done" | "partial" = "partial",
    automatic = false,
  ) {
    if (lock.current || !started.current) return;
    lock.current = true;
    setSaving(true);
    setRunning(false);
    try {
      if (elapsed.current <= 0)
        throw new Error("Travaille quelques secondes avant d’enregistrer.");
      await addSession({
        taskId: taskId || null,
        subjectId: subjectId || null,
        startedAt: started.current.toISOString(),
        endedAt: new Date().toISOString(),
        durationMin: Math.max(1, Math.round(elapsed.current / 60)),
        outcome,
      });
      elapsed.current = 0;
      started.current = null;
      if (outcome === "done" && taskId)
        await updateTask(taskId, { status: "done" });
      setMessage("Session enregistrée.");
      if (automatic && mode === "pomodoro") {
        const next = cycle + 1;
        setCycle(next);
        setPhase("break");
        setRemaining((next % cycles === 0 ? longBreak : shortBreak) * 60);
      } else setRemaining(minutes * 60);
    } catch (cause) {
      setMessage(
        cause instanceof Error
          ? cause.message
          : "Sauvegarde impossible. Réessaie.",
      );
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }
  useEffect(() => {
    if (!running || remaining > 0) return;
    if (phase === "focus") void save("partial", true);
    else {
      setRunning(false);
      setPhase("focus");
      setRemaining(minutes * 60);
    }
  }, [remaining, running, phase]);
  function start() {
    if (phase === "focus" && !started.current) started.current = new Date();
    setRunning((v) => !v);
    setMessage("");
  }
  const mm = Math.floor(remaining / 60),
    ss = Math.floor(remaining % 60);
  return (
    <>
      <h1>Révisions · Focus</h1>
      <div className="v3-grid">
        <section className="neo-panel">
          <label className="neo-field">
            Tâche
            <select
              disabled={running || elapsed.current > 0 || saving}
              value={taskId}
              onChange={(e) => {
                const t = state.tasks.find((t) => t.id === e.target.value);
                setTaskId(e.target.value);
                setSubjectId(t?.subjectId || "");
                setMinutes(t?.durationMin || 25);
                setRemaining((t?.durationMin || 25) * 60);
              }}
            >
              <option value="">Session libre</option>
              {state.tasks
                .filter((t) => t.status !== "done")
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
            </select>
          </label>
          <label className="neo-field">
            Matière
            <select
              disabled={running || elapsed.current > 0 || saving}
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              <option value="">Sans matière</option>
              {state.subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <h2>{task?.title || "Une seule chose à la fois"}</h2>
          <p>
            {phase === "focus" ? "Focus" : "Pause"} · cycle {cycle + 1}
          </p>
          <div className="v3-timer" aria-live="off">
            {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
          </div>
          <div className="v3-row">
            <button
              className="neo-pill primary"
              disabled={saving}
              onClick={start}
            >
              {running ? "Pause" : "Commencer"}
            </button>
            <button
              className="neo-pill"
              disabled={saving || !started.current}
              onClick={() => void save("partial")}
            >
              Enregistrer la session
            </button>
            <button
              className="neo-pill"
              disabled={saving || !started.current}
              onClick={() => void save("done")}
            >
              Tâche terminée
            </button>
          </div>
          <p role="status">{message}</p>
        </section>
        <section className="neo-panel">
          <h2>Réglages</h2>
          <fieldset disabled={running || elapsed.current > 0 || saving}>
            <label className="neo-field">
              Mode
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as "deep" | "pomodoro")}
              >
                <option value="deep">Deep Focus</option>
                <option value="pomodoro">Pomodoro</option>
              </select>
            </label>
            <label className="neo-field">
              Durée (min)
              <input
                type="number"
                min="1"
                max="720"
                value={minutes}
                onChange={(e) => {
                  const n = Math.min(
                    720,
                    Math.max(1, Number(e.target.value) || 1),
                  );
                  setMinutes(n);
                  setRemaining(n * 60);
                }}
              />
            </label>
            {mode === "pomodoro" && (
              <>
                <label className="neo-field">
                  Pause courte
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={shortBreak}
                    onChange={(e) =>
                      setShort(Math.max(1, Number(e.target.value)))
                    }
                  />
                </label>
                <label className="neo-field">
                  Pause longue
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={longBreak}
                    onChange={(e) =>
                      setLong(Math.max(1, Number(e.target.value)))
                    }
                  />
                </label>
                <label className="neo-field">
                  Cycles avant pause longue
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={cycles}
                    onChange={(e) =>
                      setCycles(Math.max(1, Number(e.target.value)))
                    }
                  />
                </label>
              </>
            )}
          </fieldset>
          <button
            className="neo-pill"
            disabled={running || elapsed.current > 0}
            onClick={persistSettings}
          >
            Enregistrer les réglages
          </button>
          <p>
            La fin du minuteur enregistre le temps de travail. Les pauses ne
            sont pas comptabilisées.
          </p>
        </section>
      </div>
      <section className="neo-panel section-space">
        <h2>Historique des sessions</h2>
        {state.sessions.slice(0, 20).map((s) => (
          <p key={s.id}>
            {state.subjects.find((x) => x.id === s.subjectId)?.name ||
              "Session libre"}{" "}
            · {s.durationMin} min ·{" "}
            {new Date(s.endedAt).toLocaleDateString("fr-FR")}
          </p>
        ))}
      </section>
    </>
  );
}

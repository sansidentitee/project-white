"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useComfort, useComfortFilter } from "./ComfortProvider";
import { useDailyReviews } from "./DailyReviewProvider";
import { useProject } from "./ProjectProvider";
import { useLife } from "./LifeProvider";
import { useTrading } from "./TradingProvider";
import { V3Dialog } from "./V3Dialog";
import { localDay } from "@/lib/life";
import {
  answeredCount,
  reviewKeys,
  reviewSteps,
  shouldOpenEveningReview,
  type ReviewAnswers,
} from "@/lib/dailyReview";
const questions = reviewSteps.flatMap((step) =>
  step.questions.map((q) => ({
    category: step.label,
    intro: step.intro,
    key: `${step.id}:${q[0]}`,
    label: q[1],
    placeholder: q[2],
    universe: step.id,
  })),
);

export function ReviewEditor({
  day,
  onFinished,
}: {
  day: string;
  onFinished?: () => void;
}) {
  const review = useDailyReviews();
  const project = useProject(),
    life = useLife(),
    trading = useTrading();
  const existing = review.reviews.find((r) => r.day === day);
  const [raw, setRaw] = useComfortFilter(`draft:review:${day}`);
  const { ready, storageError } = useComfort();
  const [answers, setAnswers] = useState<ReviewAnswers>({});
  const [index, setIndex] = useState(0),
    [loaded, setLoaded] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const revision = useRef<string | null>(null);
  useEffect(() => {
    if (!ready || review.loading || review.error || loaded) return;
    let next = existing?.answers || {},
      position = existing?.completed
        ? questions.length
        : reviewKeys.findIndex((k) => !next[k]?.trim());
    let baseRevision = existing?.updatedAt || null;
    try {
      const draft = JSON.parse(raw || "{}");
      if (
        draft.answers &&
        typeof draft.answers === "object" &&
        !Array.isArray(draft.answers) &&
        (!existing || Date.parse(String(draft.updatedAt)) > Date.parse(existing.updatedAt))
      ) {
        next = Object.fromEntries(
          Object.entries(draft.answers).filter(
            ([k, v]) => reviewKeys.includes(k) && typeof v === "string",
          ),
        ) as ReviewAnswers;
        position = Number.isInteger(draft.index)
          ? Math.min(questions.length, Math.max(0, draft.index))
          : 0;
        if (draft.baseUpdatedAt === null || typeof draft.baseUpdatedAt === "string") {
          baseRevision = draft.baseUpdatedAt;
          if ((existing?.updatedAt || null) !== baseRevision)
            setError("Le bilan enregistré a changé depuis ce brouillon. Compare les versions avant de garder tes réponses.");
        }
      }
    } catch {
      /* The server version remains available if a local draft is invalid. */
    }
    revision.current = baseRevision;
    setAnswers(next);
    setIndex(position < 0 ? questions.length : position);
    setLoaded(true);
  }, [ready, review.loading, review.error, loaded, existing, raw]);
  useEffect(() => {
    if (loaded && index < questions.length) textarea.current?.focus();
  }, [loaded, index]);
  function update(next: ReviewAnswers, position = index) {
    setAnswers(next);
    setIndex(position);
    setNotice("");
    setError("");
    setRaw(
      JSON.stringify({
        answers: next,
        index: position,
        baseUpdatedAt: revision.current,
        updatedAt: new Date().toISOString(),
      }),
    );
  }
  async function advance(final = false) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const saved = await review.save(
        day,
        answers,
        final || !!existing?.completed,
        revision.current,
      );
      revision.current = saved.updatedAt;
      if (final) {
        setRaw("");
        setNotice("Ton bilan des quatre catégories est enregistré.");
        onFinished?.();
      } else update(answers, Math.min(questions.length, index + 1));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Enregistrement impossible. Tes réponses restent dans ton brouillon.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (review.error)
    return (
      <div role="alert">
        <p>{review.error}</p>
        <button className="neo-pill" onClick={() => void review.refresh()}>
          Réessayer
        </button>
      </div>
    );
  if (review.loading || !loaded)
    return <p role="status">Chargement du bilan…</p>;
  const question = questions[index],
    count = answeredCount(answers);
  const known =
    question?.universe === "academic"
      ? `${project.state.tasks.filter((t) => t.completedAt && localDay(new Date(t.completedAt)) === day).length} tâches terminées · ${project.state.sessions.filter((s) => localDay(new Date(s.endedAt)) === day).reduce((sum, s) => sum + s.durationMin, 0)} minutes de travail enregistrées.`
      : question?.universe === "finance"
        ? `${trading.trades.filter((t) => localDay(new Date(t.openedAt)) === day).length} positions ouvertes ce jour · ${life.entries.filter((e) => e.universe === "finance" && e.day === day && !e.archived).length} éléments enregistrés.`
        : `${life.entries.filter((e) => e.universe === question?.universe && e.day === day && !e.archived).length} éléments déjà enregistrés aujourd’hui.`;
  return (
    <div className="daily-review-editor">
      <div className="daily-review-progress">
        <span>
          {question
            ? `${Math.floor(index / 4) + 1}/4 · ${question.category}`
            : "Récapitulatif des quatre catégories"}
        </span>
        <small>{count}/16 points renseignés</small>
      </div>
      <progress max={16} value={count} aria-label="Avancement du bilan" />
      {question ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void advance();
          }}
        >
          <p className="daily-review-intro">{question.intro}</p>
          <h2 id="review-question">{question.label}</h2>
          <p className="daily-review-point">Point {(index % 4) + 1} sur 4</p>
          <textarea
            ref={textarea}
            aria-labelledby="review-question"
            rows={5}
            maxLength={3000}
            value={answers[question.key] || ""}
            placeholder={question.placeholder}
            onChange={(e) =>
              update({ ...answers, [question.key]: e.target.value })
            }
            disabled={busy}
          />
          <button
            className="daily-review-skip"
            type="button"
            disabled={busy}
            onClick={() =>
              update({
                ...answers,
                [question.key]: "Rien à signaler / pas d’activité aujourd’hui.",
              })
            }
          >
            Rien à signaler aujourd’hui
          </button>
          <details className="comfort-details">
            <summary>Déjà renseigné dans mon espace</summary>
            <p>{known}</p>
            <p>Ce bilan ne crée ni note, ni trade, ni tâche automatiquement.</p>
          </details>
          <div className="daily-review-actions">
            <button
              className="neo-pill"
              type="button"
              disabled={busy || index === 0}
              onClick={() => update(answers, index - 1)}
            >
              Précédent
            </button>
            <button
              className="comfort-primary"
              disabled={busy || !answers[question.key]?.trim()}
              type="submit"
            >
              {busy
                ? "Enregistrement…"
                : index === questions.length - 1
                  ? "Voir mon récapitulatif"
                  : "Point suivant"}
            </button>
          </div>
        </form>
      ) : (
        <div>
          <h2>
            Ma journée du{" "}
            {new Date(day + "T12:00:00").toLocaleDateString("fr-FR")}
          </h2>
          <p>
            Relis ton bilan, puis termine pour ne plus le voir s’ouvrir ce soir.
          </p>
          {reviewSteps.map((step, stepIndex) => (
            <details className="daily-review-summary" key={step.id}>
              <summary>
                {step.label}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    update(answers, stepIndex * 4);
                  }}
                >
                  Corriger
                </button>
              </summary>
              {step.questions.map((q) => (
                <div key={q[0]}>
                  <h3>{q[1]}</h3>
                  <p>{answers[`${step.id}:${q[0]}`] || "Non renseigné"}</p>
                </div>
              ))}
            </details>
          ))}
          {count < 16 && <p>Il reste {16 - count} points à compléter.</p>}
          <div className="daily-review-actions">
            <button
              className="neo-pill"
              disabled={busy}
              onClick={() => update(answers, 15)}
            >
              Revenir au dernier point
            </button>
            <button
              className="comfort-primary"
              disabled={busy || count < 16}
              onClick={() => void advance(true)}
            >
              {busy ? "Enregistrement…" : "Terminer mon bilan"}
            </button>
          </div>
        </div>
      )}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button
            className="neo-pill"
            disabled={busy}
            onClick={() => void review.refresh()}
          >
            Recharger les bilans
          </button>
          {existing && existing.updatedAt !== revision.current && (
            <details className="daily-review-summary">
              <summary>Comparer avec la version enregistrée</summary>
              {reviewSteps.map((step) => (
                <div key={step.id}>
                  <h3>{step.label}</h3>
                  {step.questions.map((q) => (
                    <p key={q[0]}>
                      <strong>{q[1]}</strong>
                      <br />
                      {existing.answers[`${step.id}:${q[0]}`] ||
                        "Non renseigné"}
                    </p>
                  ))}
                </div>
              ))}
              <button
                className="neo-pill"
                onClick={() => {
                  revision.current = existing.updatedAt;
                  setError("");
                  setNotice(
                    "Version enregistrée consultée. Tes réponses actuelles seront utilisées au prochain enregistrement.",
                  );
                }}
              >
                Garder mes réponses après comparaison
              </button>
            </details>
          )}
        </div>
      )}
      {notice && <p role="status">{notice}</p>}
      {storageError && <p role="alert">{storageError}</p>}
    </div>
  );
}
export function DailyReviewPrompt() {
  const { user, configured, loading: authLoading } = useAuth(),
    review = useDailyReviews(),
    { ready } = useComfort();
  const path = usePathname();
  const [day, setDay] = useState(localDay());
  const [hour] = useComfortFilter("pref:review-hour", "17"),
    [enabled] = useComfortFilter("pref:review-enabled", "yes");
  const [deferred, setDeferred] = useComfortFilter("review:deferred-day");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    function check() {
      const now = new Date(),
        today = localDay(now);
      setDay(today);
      if (
        path === "/daily-review" ||
        document.hidden ||
        !ready ||
        authLoading ||
        (configured && !user) ||
        review.loading ||
        review.error ||
        enabled !== "yes"
      )
        return;
      if (document.querySelector("dialog[open]") && !open) return;
      if (
        shouldOpenEveningReview(
          now,
          Number(hour) || 17,
          !!review.reviews.find((r) => r.day === today)?.completed,
          deferred === today,
        )
      )
        setOpen(true);
    }
    const initial = window.setTimeout(check, 1000);
    const timer = window.setInterval(check, 60000);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [
    path,
    ready,
    authLoading,
    configured,
    user,
    review.loading,
    review.error,
    review.reviews,
    enabled,
    hour,
    deferred,
    open,
  ]);
  function close() {
    setDeferred(day);
    setOpen(false);
  }
  return (
    <V3Dialog open={open} onClose={close} title="Mon bilan du soir">
      <p className="daily-review-welcome">
        Quatre catégories, une question à la fois. Tu peux reprendre plus tard
        depuis « Bilan du soir ».
      </p>
      {open && <ReviewEditor key={day} day={day} onFinished={close} />}
      <button className="daily-review-later" onClick={close}>
        Reprendre plus tard
      </button>
    </V3Dialog>
  );
}
export function EveningPreferences() {
  const [hour, setHour] = useComfortFilter("pref:review-hour", "17"),
    [enabled, setEnabled] = useComfortFilter("pref:review-enabled", "yes");
  return (
    <section className="neo-panel calm-settings">
      <h2>Bilan du soir</h2>
      <p>
        À la première visite après l’heure choisie, le bilan s’ouvre une fois
        par jour. L’heure est celle de ton appareil.
      </p>
      <label>
        Ouverture automatique
        <select value={enabled} onChange={(e) => setEnabled(e.target.value)}>
          <option value="yes">Activée</option>
          <option value="no">Seulement quand je l’ouvre</option>
        </select>
      </label>
      <label>
        Après les cours, à partir de
        <select value={hour} onChange={(e) => setHour(e.target.value)}>
          {Array.from({ length: 12 }, (_, i) => i + 12).map((n) => (
            <option key={n} value={n}>
              {n} h
            </option>
          ))}
        </select>
      </label>
      <Link href="/daily-review">Ouvrir mes bilans</Link>
    </section>
  );
}

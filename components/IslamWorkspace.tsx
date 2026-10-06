"use client";
import Link from "next/link";
import { useState } from "react";
import { useLife } from "./LifeProvider";
import {
  ActionFeedback,
  EntryManager,
  LifeEmpty,
  LifeGoals,
  LifeLayout,
  LifeMetric,
  LifePanel,
  LifeResources,
  formatDay,
  useLifeAction,
} from "./LifeUI";
import { localDay, prayers, recentDays, text, reviewDue } from "@/lib/life";
import { reviewError } from "@/lib/academic";
import { memoryHistory } from "@/lib/progress";
import { MemorizationPath } from "./ProgressWorkspace";

function PrayerTracker() {
  const life = useLife(),
    action = useLifeAction();
  const [day, setDay] = useState(localDay());
  const entry = life.entries.find(
    (e) =>
      e.universe === "islam" &&
      e.kind === "prayers" &&
      e.day === day &&
      !e.archived,
  );
  const count = prayers.filter((p) => entry?.data[p] === true).length;
  return (
    <LifePanel title="Mes prières">
      <div className="life-panel-actions">
        <label>
          Journée
          <input
            type="date"
            aria-label="Journée des prières"
            value={day}
            max={localDay()}
            onChange={(e) => setDay(e.target.value)}
          />
        </label>
        <span>{count} / 5 renseignées</span>
      </div>
      <div className="life-prayers">
        {prayers.map((p) => (
          <button
            key={p}
            disabled={action.busy || !day}
            aria-pressed={entry?.data[p] === true}
            onClick={() =>
              void action.run(() =>
                life.save({
                  id: entry?.id,
                  universe: "islam",
                  kind: "prayers",
                  key: day,
                  title: "Prières du " + day,
                  day,
                  data: {
                    ...(entry?.data || {}),
                    [p]: entry?.data[p] !== true,
                  },
                }),
              )
            }
          >
            <span>{p}</span>
            <small>
              {entry?.data[p] === true ? "Accomplie" : "À renseigner"}
            </small>
          </button>
        ))}
      </div>
      <p className="life-muted">
        Suivi personnel, sans horaires calculés. Tu peux revenir sur les jours
        précédents.
      </p>
      <ActionFeedback action={action} />
      <div className="life-week">
        {recentDays(localDay()).map((d) => {
          const row = life.entries.find(
            (e) =>
              e.universe === "islam" &&
              e.kind === "prayers" &&
              e.day === d &&
              !e.archived,
          );
          return (
            <button
              key={d}
              aria-label={"Prières du " + formatDay(d)}
              aria-pressed={d === day}
              onClick={() => setDay(d)}
            >
              <small>{formatDay(d)}</small>
              <strong>
                {row
                  ? prayers.filter((p) => row.data[p] === true).length + "/5"
                  : "—"}
              </strong>
            </button>
          );
        })}
      </div>
    </LifePanel>
  );
}
function QuranWorkspace() {
  const life = useLife(),
    action = useLifeAction();
  const cards = life.entries.filter(
    (e) => e.universe === "islam" && e.kind === "memorization" && !e.archived,
  );
  const [dueOnly, setDueOnly] = useState(false);
  const today = localDay();
  return (
    <>
      <EntryManager
        universe="islam"
        kind="quran"
        title="Mes sessions de Coran"
        valueLabel="Durée en minutes"
        fields={[
          {
            key: "type",
            label: "Session",
            type: "select",
            options: [
              { value: "reading", label: "Lecture" },
              { value: "memorization", label: "Mémorisation" },
              { value: "revision", label: "Révision" },
            ],
          },
          { key: "reference", label: "Sourate / passage", required: true },
          { key: "pages", label: "Pages lues", type: "number", min: 0 },
          { key: "notes", label: "Notes", type: "textarea" },
        ]}
      />
      <EntryManager
        universe="islam"
        kind="memorization"
        title="Passages à mémoriser"
        fields={[
          { key: "reference", label: "Sourate / versets", required: true },
          {
            key: "nextReview",
            label: "Prochaine révision",
            type: "date",
            defaultValue: today,
          },
          { key: "notes", label: "Points à travailler", type: "textarea" },
        ]}
      />
      <LifePanel title="Révision espacée">
        <div className="life-panel-actions">
          <label className="life-checkbox">
            <input
              type="checkbox"
              checked={dueOnly}
              onChange={(e) => setDueOnly(e.target.checked)}
            />
            Seulement les passages dus
          </label>
          <span>{cards.filter((e) => reviewDue(e)).length} à revoir</span>
        </div>
        {cards
          .filter((e) => !dueOnly || reviewDue(e))
          .map((card) => (
            <article className="life-entry" key={card.id}>
              <div>
                <h3>{card.title}</h3>
                <p>{text(card, "reference")}</p>
                <small>
                  Prochaine révision :{" "}
                  {text(card, "nextReviewAt") &&
                  localDay(new Date(text(card, "nextReviewAt"))) ===
                    text(card, "nextReview")
                    ? new Date(text(card, "nextReviewAt")).toLocaleString(
                        "fr-FR",
                      )
                    : text(card, "nextReview")
                      ? formatDay(text(card, "nextReview"))
                      : "maintenant"}{" "}
                  · {Number(card.data.repetitions || 0)} réponses
                </small>
                <div className="life-review">
                  {(["again", "hard", "good", "easy"] as const).map(
                    (rating, i) => (
                      <button
                        key={rating}
                        className="neo-pill"
                        disabled={action.busy}
                        onClick={() =>
                          void action.run(() => {
                            const result = reviewError(
                              {
                                id: card.id,
                                title: card.title,
                                status: "review",
                                intervalDays: Number(
                                  card.data.intervalDays || 0,
                                ),
                                repetitions: Number(card.data.repetitions || 0),
                                lapses: Number(card.data.lapses || 0),
                              },
                              rating,
                            );
                            return life.save({
                              ...card,
                              data: {
                                ...card.data,
                                intervalDays: result.intervalDays ?? 0,
                                repetitions: result.repetitions ?? 0,
                                lapses: result.lapses ?? 0,
                                nextReview: localDay(
                                  new Date(result.nextReviewAt!),
                                ),
                                nextReviewAt: result.nextReviewAt!,
                                lastReviewed: new Date().toISOString(),
                                reviewHistory: JSON.stringify(
                                  [
                                    ...memoryHistory(card),
                                    {
                                      at: new Date().toISOString(),
                                      ratingLabel: [
                                        "Encore",
                                        "Difficile",
                                        "Bien",
                                        "Facile",
                                      ][i],
                                      nextReview: localDay(
                                        new Date(result.nextReviewAt!),
                                      ),
                                    },
                                  ].slice(-100),
                                ),
                              },
                            });
                          }, "Prochaine révision enregistrée.")
                        }
                      >
                        {["Encore", "Difficile", "Bien", "Facile"][i]}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </article>
          ))}
        {!cards.length && (
          <LifeEmpty>
            Ajoute un passage ci-dessus pour commencer la révision.
          </LifeEmpty>
        )}
        <ActionFeedback action={action} />
      </LifePanel>
    </>
  );
}
function IslamOverview() {
  const { entries } = useLife();
  const today = localDay(),
    week = new Set(recentDays(today));
  const own = entries.filter((e) => e.universe === "islam" && !e.archived),
    sessions = own.filter((e) => e.kind === "quran" && week.has(e.day));
  const todayPrayers = own.find((e) => e.kind === "prayers" && e.day === today);
  const goals = own.filter(
    (e) => e.kind === "goal" && e.data.status === "active",
  );
  return (
    <>
      <div className="life-metrics">
        <LifeMetric
          label="Prières aujourd’hui"
          value={
            prayers.filter((p) => todayPrayers?.data[p] === true).length + "/5"
          }
          detail="Ton suivi personnel"
        />
        <LifeMetric
          label="Coran · 7 jours"
          value={sessions.reduce((s, e) => s + (e.value || 0), 0) + " min"}
          detail={`${sessions.length} sessions enregistrées`}
        />
        <LifeMetric
          label="Passages à revoir"
          value={
            own.filter((e) => e.kind === "memorization" && reviewDue(e)).length
          }
        />
        <LifeMetric label="Objectifs en cours" value={goals.length} />
      </div>
      <div className="life-grid">
        <PrayerTracker />
        <LifePanel title="Reprendre mon chemin">
          <Link className="life-link-card" href="/islam/quran">
            <strong>Coran & mémorisation</strong>
            <span>Lecture, passages et prochaines révisions →</span>
          </Link>
          <Link className="life-link-card" href="/islam/learning">
            <strong>Apprentissage</strong>
            <span>Mes cours, notes et progression →</span>
          </Link>
          <Link className="life-link-card" href="/islam/goals">
            <strong>Mes intentions</strong>
            <span>{goals.length} objectifs à poursuivre →</span>
          </Link>
          {sessions.length > 0 && (
            <>
              <h3>Dernière session</h3>
              <p>
                {
                  sessions.sort((a, b) =>
                    b.createdAt.localeCompare(a.createdAt),
                  )[0].title
                }
              </p>
            </>
          )}
        </LifePanel>
      </div>
    </>
  );
}
export function IslamWorkspace({ section = "" }: { section?: string }) {
  return (
    <LifeLayout universe="islam" section={section}>
      {(section === "" || section === "quran") && <MemorizationPath />}
      {section === "prayers" ? (
        <PrayerTracker />
      ) : section === "quran" ? (
        <QuranWorkspace />
      ) : section === "learning" ? (
        <EntryManager
          universe="islam"
          kind="learning"
          title="Mes apprentissages"
          fields={[
            { key: "topic", label: "Thème" },
            { key: "source", label: "Enseignant / source" },
            {
              key: "progress",
              label: "Progression (%)",
              type: "number",
              min: 0,
              max: 100,
              defaultValue: "0",
            },
            {
              key: "status",
              label: "État",
              type: "select",
              options: [
                { value: "planned", label: "À commencer" },
                { value: "active", label: "En cours" },
                { value: "done", label: "Terminé" },
              ],
            },
            { key: "notes", label: "Notes personnelles", type: "textarea" },
          ]}
        />
      ) : section === "goals" ? (
        <LifeGoals universe="islam" />
      ) : section === "resources" ? (
        <LifeResources universe="islam" />
      ) : (
        <IslamOverview />
      )}
    </LifeLayout>
  );
}

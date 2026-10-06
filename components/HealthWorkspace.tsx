"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useLife } from "./LifeProvider";
import { HealthTrends } from "./ProgressWorkspace";
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
import {
  habitStreak,
  healthSummary,
  LifeData,
  localDay,
  num,
  recentDays,
  text,
} from "@/lib/life";

const dailyFields = [
  { key: "sleep", label: "Sommeil · heures", min: 0, max: 24, step: 0.25 },
  { key: "water", label: "Eau · ml", min: 0, max: 30000, step: 50 },
  { key: "steps", label: "Pas", min: 0, max: 200000, step: 1 },
  { key: "energy", label: "Énergie · 1 à 5", min: 1, max: 5, step: 1 },
  { key: "mood", label: "Humeur · 1 à 5", min: 1, max: 5, step: 1 },
];
function DailyHealth() {
  const life = useLife(),
    action = useLifeAction();
  const [day, setDay] = useState(localDay()),
    [values, setValues] = useState<Record<string, string>>({});
  const entry = life.entries.find(
    (e) =>
      e.universe === "health" &&
      e.kind === "health-day" &&
      e.day === day &&
      !e.archived,
  );
  useEffect(() => {
    setValues(
      Object.fromEntries([
        ...dailyFields.map((f) => [
          f.key,
          entry?.data[f.key] == null ? "" : String(entry.data[f.key]),
        ]),
        ["notes", text(entry, "notes")],
      ]),
    );
  }, [day, entry]);
  async function save(event: FormEvent) {
    event.preventDefault();
    const data: LifeData = { notes: values.notes || "" };
    dailyFields.forEach((f) => {
      data[f.key] = values[f.key]?.trim() ? Number(values[f.key]) : null;
    });
    await action.run(() =>
      life.save({
        id: entry?.id,
        universe: "health",
        kind: "health-day",
        key: day,
        title: "Bilan du " + day,
        day,
        data,
      }),
    );
  }
  return (
    <LifePanel title="Mon bilan quotidien">
      <form className="life-form" onSubmit={save}>
        <label>
          Journée
          <input
            type="date"
            required
            max={localDay()}
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />
        </label>
        <div className="life-form-grid">
          {dailyFields.map((f) => (
            <label key={f.key}>
              {f.label}
              <input
                type="number"
                min={f.min}
                max={f.max}
                step={f.step}
                value={values[f.key] || ""}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f.key]: e.target.value }))
                }
                placeholder="Non renseigné"
              />
            </label>
          ))}
        </div>
        <label>
          Ressenti / repas / récupération
          <textarea
            rows={3}
            maxLength={10000}
            value={values.notes || ""}
            onChange={(e) =>
              setValues((v) => ({ ...v, notes: e.target.value }))
            }
          />
        </label>
        <button className="neo-pill primary" disabled={action.busy}>
          {action.busy ? "Enregistrement…" : "Enregistrer mon bilan"}
        </button>
        <ActionFeedback action={action} />
      </form>
      <p className="life-muted">
        Les champs laissés vides ne sont pas comptés dans tes moyennes.
      </p>
    </LifePanel>
  );
}
function HabitChecks() {
  const life = useLife(),
    action = useLifeAction();
  const today = localDay(),
    [day, setDay] = useState(today);
  const own = life.entries.filter(
    (e) => e.universe === "health" && !e.archived,
  );
  const habits = own.filter(
    (e) => e.kind === "habit" && e.data.status !== "paused",
  );
  return (
    <LifePanel title="Mes habitudes aujourd’hui">
      <label>
        Journée
        <input
          aria-label="Journée des habitudes"
          type="date"
          max={today}
          value={day}
          onChange={(e) => setDay(e.target.value)}
        />
      </label>
      {habits.map((habit) => {
        const check = own.find(
            (e) =>
              e.kind === "habit-check" &&
              e.data.habitId === habit.id &&
              e.day === day,
          ),
          done = check?.data.done === true;
        return (
          <div className="life-row" key={habit.id}>
            <span>
              <strong>{habit.title}</strong>
              <small>
                {text(habit, "details")} · {habitStreak(own, habit.id, today)}{" "}
                jours consécutifs
              </small>
            </span>
            <button
              className="neo-pill"
              aria-pressed={done}
              disabled={action.busy || !day}
              onClick={() =>
                void action.run(() =>
                  life.save({
                    id: check?.id,
                    universe: "health",
                    kind: "habit-check",
                    key: habit.id + ":" + day,
                    title: habit.title,
                    day,
                    data: { habitId: habit.id, done: !done },
                  }),
                )
              }
            >
              {done ? "Fait ✓" : "Marquer fait"}
            </button>
          </div>
        );
      })}
      {!habits.length && (
        <LifeEmpty>Crée une habitude pour la cocher chaque jour.</LifeEmpty>
      )}
      <ActionFeedback action={action} />
    </LifePanel>
  );
}
function HealthOverview() {
  const { entries } = useLife(),
    today = localDay();
  const own = entries.filter((e) => e.universe === "health" && !e.archived),
    summary = healthSummary(own, today),
    week = new Set(recentDays(today));
  return (
    <>
      <div className="life-metrics">
        <LifeMetric
          label="Sommeil · 7 jours"
          value={summary.sleep === null ? "—" : summary.sleep.toFixed(1) + " h"}
          detail={`${summary.loggedDays} bilans renseignés`}
        />
        <LifeMetric
          label="Activité · 7 jours"
          value={summary.activity + " min"}
        />
        <LifeMetric
          label="Énergie moyenne"
          value={
            summary.energy === null ? "—" : summary.energy.toFixed(1) + "/5"
          }
        />
        <LifeMetric
          label="Eau moyenne"
          value={
            summary.water === null ? "—" : Math.round(summary.water) + " ml"
          }
          detail="Sur les jours renseignés"
        />
      </div>
      <div className="life-grid">
        <DailyHealth />
        <div className="life-stack">
          <HabitChecks />
          <LifePanel title="Les sept derniers jours">
            <div className="life-week">
              {recentDays(today).map((day) => {
                const e = own.find(
                  (r) => r.kind === "health-day" && r.day === day,
                );
                return (
                  <div key={day}>
                    <small>{formatDay(day)}</small>
                    <strong>
                      {e && num(e, "energy") !== null
                        ? num(e, "energy") + "/5"
                        : "—"}
                    </strong>
                    <span>
                      {e && num(e, "sleep") !== null
                        ? num(e, "sleep") + " h"
                        : "Sommeil —"}
                    </span>
                  </div>
                );
              })}
            </div>
            <Link className="life-link-card" href="/health/activity">
              <strong>Mes séances</strong>
              <span>
                {
                  own.filter((e) => e.kind === "workout" && week.has(e.day))
                    .length
                }{" "}
                enregistrées cette semaine →
              </span>
            </Link>
          </LifePanel>
        </div>
      </div>
    </>
  );
}
export function HealthWorkspace({ section = "" }: { section?: string }) {
  return (
    <LifeLayout universe="health" section={section}>
      {(section === "" || section === "daily" || section === "habits") && (
        <HealthTrends />
      )}
      {section === "daily" ? (
        <DailyHealth />
      ) : section === "activity" ? (
        <EntryManager
          universe="health"
          kind="workout"
          title="Mes séances d’activité"
          valueLabel="Durée en minutes"
          fields={[
            {
              key: "type",
              label: "Activité",
              type: "select",
              options: [
                { value: "walk", label: "Marche" },
                { value: "strength", label: "Musculation" },
                { value: "run", label: "Course" },
                { value: "sport", label: "Sport" },
                { value: "mobility", label: "Mobilité" },
                { value: "other", label: "Autre" },
              ],
            },
            {
              key: "effort",
              label: "Effort ressenti",
              type: "select",
              options: [
                { value: "easy", label: "Léger" },
                { value: "moderate", label: "Modéré" },
                { value: "hard", label: "Soutenu" },
              ],
            },
            {
              key: "details",
              label: "Exercices / distance / ressenti",
              type: "textarea",
            },
          ]}
        />
      ) : section === "habits" ? (
        <>
          <HabitChecks />
          <EntryManager
            universe="health"
            kind="habit"
            title="Gérer mes habitudes"
            fields={[
              { key: "details", label: "Ce que je veux faire" },
              {
                key: "status",
                label: "État",
                type: "select",
                options: [
                  { value: "active", label: "Active" },
                  { value: "paused", label: "En pause" },
                ],
              },
            ]}
          />
        </>
      ) : section === "journal" ? (
        <EntryManager
          universe="health"
          kind="reflection"
          title="Mon journal personnel"
          fields={[{ key: "notes", label: "Ma journée", type: "textarea" }]}
        />
      ) : section === "goals" ? (
        <LifeGoals universe="health" />
      ) : section === "resources" ? (
        <LifeResources universe="health" />
      ) : (
        <HealthOverview />
      )}
    </LifeLayout>
  );
}

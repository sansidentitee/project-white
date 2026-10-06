"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useProject } from "./ProjectProvider";
import { useLife } from "./LifeProvider";
import { useTrading } from "./TradingProvider";
import { useSave } from "./SaveProvider";
import { useComfortFilter } from "./ComfortProvider";
import { PageFrame } from "./PageFrame";
import { LifePanel, LifeMetric, LifeEmpty } from "./LifeUI";
import { localDay, prayers, reviewDue } from "@/lib/life";
import { priorities } from "@/lib/academic";
import { findItems, searchIndex } from "@/lib/progress";
export function SyncStatus() {
  const project = useProject(),
    life = useLife(),
    trading = useTrading(),
    saving = useSave();
  const [busy, setBusy] = useState(false),
    [checked, setChecked] = useState("");
  const refresh = async () => {
    if (saving.pending || busy) return;
    setBusy(true);
    try {
      await Promise.all([
        project.refresh(true),
        life.refresh(true),
        trading.refresh(true),
      ]);
      setChecked(
        new Date().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    const focus = () => {
      if (document.visibilityState === "visible" && !saving.pending && !busy)
        void refresh();
    };
    const storage = (e: StorageEvent) => {
      if (e.key?.startsWith("project-white-")) focus();
    };
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", focus);
    window.addEventListener("storage", storage);
    return () => {
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", focus);
      window.removeEventListener("storage", storage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.refresh, life.refresh, trading.refresh, saving.pending, busy]);
  const errors = [project.error, life.error, trading.error].filter(Boolean);
  return (
    <div className="v4-sync">
      <span>
        {busy || project.loading || life.loading || trading.loading
          ? "Chargement des données…"
          : errors.length
            ? "Synchronisation à vérifier"
            : project.demoMode
              ? "Données locales"
              : `Données du compte chargées${checked ? " · " + checked : ""}`}
      </span>
      <button
        className="neo-pill"
        disabled={busy || !!saving.pending}
        onClick={() => void refresh()}
      >
        Actualiser les données
      </button>
      {errors.length > 0 && <p role="alert">{errors.join(" · ")}</p>}
    </div>
  );
}
export function GlobalToday() {
  const project = useProject(),
    life = useLife(),
    trading = useTrading();
  const today = localDay();
  const own = life.entries.filter((e) => !e.archived),
    tasks = priorities(project.state.tasks),
    due = own.filter(
      (e) =>
        e.universe === "islam" && e.kind === "memorization" && reviewDue(e),
    ),
    prayer = own.find((e) => e.kind === "prayers" && e.day === today),
    habits = own.filter(
      (e) => e.kind === "habit" && e.data.status === "active",
    ),
    done = habits.filter((h) =>
      own.some(
        (e) =>
          e.kind === "habit-check" &&
          e.day === today &&
          e.data.habitId === h.id &&
          e.data.done === true,
      ),
    ),
    plans = own
      .filter(
        (e) =>
          e.universe === "finance" &&
          e.kind === "plan" &&
          e.day <= today &&
          e.data.status === "planned",
      )
      .sort((a, b) => a.day.localeCompare(b.day));
  return (
    <PageFrame>
      <div className="life-page">
        <div className="life-heading">
          <div>
            <p className="life-eyebrow">MES QUATRE UNIVERS</p>
            <h1>Aujourd’hui</h1>
            <p>
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}{" "}
              · Une journée, une vue.
            </p>
          </div>
        </div>
        <details className="comfort-overview">
          <summary>Voir les indicateurs du jour</summary>
          <div className="life-metrics">
            <LifeMetric
              label="Priorités études"
              value={project.loading ? "…" : tasks.length}
            />
            <LifeMetric
              label="Prières renseignées"
              value={
                life.loading
                  ? "…"
                  : prayers.filter((p) => prayer?.data[p] === true).length +
                    "/5"
              }
            />
            <LifeMetric
              label="Sessions trading / formation"
              value={life.loading ? "…" : plans.length}
            />
            <LifeMetric
              label="Habitudes du jour"
              value={life.loading ? "…" : `${done.length}/${habits.length}`}
            />
          </div>
        </details>
        <div className="life-grid">
          <LifePanel title="Académie · Mes trois priorités">
            {project.error ? (
              <p role="alert">{project.error}</p>
            ) : (
              tasks.map((t) => (
                <Link
                  className="life-link-card"
                  key={t.id}
                  href={"/academic/revisions?task=" + t.id}
                >
                  <strong>{t.title}</strong>
                  <span>{t.durationMin} min · Commencer Focus →</span>
                </Link>
              ))
            )}
            {!project.loading && !project.error && !tasks.length && (
              <LifeEmpty>Aucune priorité en attente.</LifeEmpty>
            )}
            <Link href="/academic/revisions">Mon plan de révision →</Link>
          </LifePanel>
          <LifePanel title="Islam · Continuer mon parcours">
            <p>{due.length} passages à revoir.</p>
            <Link className="life-link-card" href="/islam/prayers">
              <strong>Mes prières aujourd’hui</strong>
              <span>Renseigner ma journée →</span>
            </Link>
            <Link className="life-link-card" href="/islam/quran">
              <strong>Révisions & mémorisation</strong>
              <span>Objectifs hebdomadaires et historique →</span>
            </Link>
          </LifePanel>
          <LifePanel title="Finance · Ce que j’ai prévu">
            {plans.slice(0, 3).map((e) => (
              <Link
                key={e.id}
                className="life-link-card"
                href="/finance/planning"
              >
                <strong>{e.title}</strong>
                <span>
                  {e.day} · {e.value} min
                </span>
              </Link>
            ))}
            {!plans.length && (
              <LifeEmpty>
                Aucune session prévue aujourd’hui ou en retard.
              </LifeEmpty>
            )}
            <Link className="life-link-card" href="/finance/journal">
              <strong>
                {trading.loading
                  ? "…"
                  : trading.trades.filter((t) => t.status === "open")
                      .length}{" "}
                positions ouvertes dans mon journal
              </strong>
              <span>Documenter mon plan et mes décisions →</span>
            </Link>
          </LifePanel>
          <LifePanel title="Santé · Ma journée">
            <p>
              {done.length} habitudes cochées sur {habits.length}.
            </p>
            <Link className="life-link-card" href="/health/daily">
              <strong>
                {own.some((e) => e.kind === "health-day" && e.day === today)
                  ? "Mon bilan est renseigné"
                  : "Renseigner mon bilan"}
              </strong>
              <span>Sommeil, énergie et ressenti →</span>
            </Link>
            <Link className="life-link-card" href="/health">
              <strong>Tendances & bilan hebdomadaire</strong>
              <span>Observer les 30 derniers jours →</span>
            </Link>
          </LifePanel>
        </div>
      </div>
    </PageFrame>
  );
}
export function GlobalSearch() {
  const params = useSearchParams(),
    project = useProject(),
    life = useLife(),
    trading = useTrading();
  const [query, setQuery] = useComfortFilter(
      "global-search-query",
      params.get("q") || "",
    ),
    [world, setWorld] = useComfortFilter("global-search-universe", "all");
  const requestedQuery = params.get("q");
  useEffect(() => {
    if (requestedQuery !== null) setQuery(requestedQuery);
  }, [requestedQuery]);
  const index = useMemo(
      () => searchIndex(project.state, life.entries, trading.trades),
      [project.state, life.entries, trading.trades],
    ),
    results = findItems(index, query).filter(
      (i) => world === "all" || i.universe === world,
    );
  return (
    <PageFrame>
      <div className="life-page">
        <h1>Recherche globale</h1>
        <p>
          Tâches, chapitres, notes, documents et journaux des quatre univers.
        </p>
        <div className="life-form">
          <label>
            Rechercher dans mon espace
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Un titre, une matière, un mot de mes notes…"
            />
          </label>
          <label>
            Univers
            <select value={world} onChange={(e) => setWorld(e.target.value)}>
              <option value="all">Tous les univers</option>
              {["Académie", "Islam", "Finance", "Santé"].map((w) => (
                <option key={w}>{w}</option>
              ))}
            </select>
          </label>
        </div>
        <LifePanel title={`${results.length} résultats`}>
          {!query.trim() ? (
            <LifeEmpty>Saisis quelques mots pour rechercher.</LifeEmpty>
          ) : results.length ? (
            results.slice(0, 100).map((i) => (
              <Link key={i.id} href={i.href} className="life-link-card">
                <strong>{i.title}</strong>
                <span>
                  {i.universe} · {i.detail.slice(0, 240)}
                </span>
              </Link>
            ))
          ) : (
            <LifeEmpty>Aucun résultat dans les données chargées.</LifeEmpty>
          )}
          {results.length > 100 && (
            <p>
              Les 100 premiers résultats sont affichés. Affine ta recherche.
            </p>
          )}
        </LifePanel>
        <small>
          La recherche porte sur les titres et les notes enregistrées ; elle ne
          lit pas le contenu des fichiers joints.
        </small>
      </div>
    </PageFrame>
  );
}

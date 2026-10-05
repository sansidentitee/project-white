"use client";
import Link from "next/link";
import { useState } from "react";
import { useLife } from "./LifeProvider";
import { useTrading, Trade } from "./TradingProvider";
import {
  ActionFeedback,
  EntryManager,
  LifeEmpty,
  LifeGoals,
  LifeLayout,
  LifeMetric,
  LifePanel,
  LifeResources,
  useLifeAction,
} from "./LifeUI";
import { localDay, text } from "@/lib/life";
import { positionSize, tradingSummary } from "@/lib/finance";

function TradeJournalEntry({ trade }: { trade: Trade }) {
  const trading = useTrading(),
    action = useLifeAction();
  const [setup, setSetup] = useState(trade.setup || ""),
    [note, setNote] = useState(trade.note || "");
  return (
    <LifePanel title={trade.asset}>
      <small>
        {new Date(trade.openedAt).toLocaleDateString("fr-FR")} ·{" "}
        {trade.status === "open" ? "Position ouverte" : "Clôturée"}
      </small>
      <form
        className="life-form"
        onSubmit={(e) => {
          e.preventDefault();
          void action.run(() => trading.updateTrade(trade.id, { setup, note }));
        }}
      >
        <label>
          Setup
          <input
            value={setup}
            maxLength={1000}
            onChange={(e) => setSetup(e.target.value)}
          />
        </label>
        <label>
          Bilan du trade
          <textarea
            value={note}
            maxLength={10000}
            rows={4}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Plan, décision, émotions et leçon à retenir…"
          />
        </label>
        <button className="neo-pill primary" disabled={action.busy}>
          Enregistrer le bilan
        </button>
        <ActionFeedback action={action} />
      </form>
    </LifePanel>
  );
}
function FinanceJournal() {
  const { trades, loading, error, refresh } = useTrading();
  const [asset, setAsset] = useState("all");
  const assets = Array.from(new Set(trades.map((t) => t.asset)));
  return (
    <>
      <label>
        Filtrer par actif
        <select
          aria-label="Filtrer le journal par actif"
          value={asset}
          onChange={(e) => setAsset(e.target.value)}
        >
          <option value="all">Tous les actifs</option>
          {assets.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
      </label>
      {loading ? (
        <LifeEmpty>Chargement du journal…</LifeEmpty>
      ) : error ? (
        <p role="alert">
          {error}
          <button onClick={() => void refresh()}>Réessayer</button>
        </p>
      ) : (
        <div className="life-grid">
          {trades
            .filter((t) => asset === "all" || t.asset === asset)
            .map((t) => (
              <TradeJournalEntry key={t.id} trade={t} />
            ))}
        </div>
      )}
      {!loading && !error && !trades.length && (
        <LifeEmpty>
          Le journal est vide. <Link href="/trading">Ajouter un trade</Link>
        </LifeEmpty>
      )}
    </>
  );
}
function EquityCurve({
  curve,
}: {
  curve: ReturnType<typeof tradingSummary>["curve"];
}) {
  const values = [0, ...curve.map((p) => p.balance)];
  const min = Math.min(...values),
    max = Math.max(...values),
    range = max - min || 1;
  const points = values
    .map(
      (value, i) =>
        `${20 + (i * 460) / Math.max(values.length - 1, 1)},${155 - ((value - min) * 125) / range}`,
    )
    .join(" ");
  return (
    <figure className="life-chart">
      <svg
        viewBox="0 0 500 180"
        role="img"
        aria-label="P&L cumulé des trades clôturés"
      >
        <title>P&L cumulé brut</title>
        <line
          x1="20"
          x2="480"
          y1={155 - ((0 - min) * 125) / range}
          y2={155 - ((0 - min) * 125) / range}
          stroke="currentColor"
          opacity=".2"
        />
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </svg>
      <figcaption>
        {curve.length} trades clôturés · du plus ancien au plus récent
      </figcaption>
    </figure>
  );
}
function TradingAnalytics() {
  const { trades, loading, error, refresh } = useTrading();
  const [asset, setAsset] = useState("all");
  const filtered = trades.filter((t) => asset === "all" || t.asset === asset),
    stats = tradingSummary(filtered);
  return (
    <>
      <label>
        Actif
        <select
          aria-label="Actif des analyses"
          value={asset}
          onChange={(e) => setAsset(e.target.value)}
        >
          <option value="all">Tous les actifs</option>
          {Array.from(new Set(trades.map((t) => t.asset))).map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
      </label>
      {loading ? (
        <LifeEmpty>Chargement des analyses…</LifeEmpty>
      ) : error ? (
        <p role="alert">
          {error}
          <button onClick={() => void refresh()}>Réessayer</button>
        </p>
      ) : (
        <>
          <div className="life-metrics">
            <LifeMetric
              label="Trades clôturés"
              value={stats.closed.length}
              detail={`${stats.wins} gains · ${stats.losses} pertes · ${stats.breakeven} neutres`}
            />
            <LifeMetric
              label="Win rate"
              value={
                stats.winRate === null ? "—" : stats.winRate.toFixed(1) + " %"
              }
            />
            <LifeMetric
              label="P&L brut"
              value={stats.total.toFixed(2)}
              detail="Unités de cotation"
            />
            <LifeMetric
              label="Résultat moyen"
              value={
                stats.expectancy === null ? "—" : stats.expectancy.toFixed(2)
              }
            />
          </div>
          <div className="life-grid">
            <LifePanel title="Courbe du journal">
              {stats.closed.length ? (
                <EquityCurve curve={stats.curve} />
              ) : (
                <LifeEmpty>Clôture un trade pour afficher sa courbe.</LifeEmpty>
              )}
              <p className="life-muted">
                Frais et conversion des devises non inclus. Le total n’est
                comparable que pour des montants exprimés dans la même unité.
              </p>
            </LifePanel>
            <LifePanel title="Qualité du suivi">
              <div className="life-row">
                <span>Profit factor</span>
                <strong>
                  {stats.profitFactor === null
                    ? "—"
                    : stats.profitFactor.toFixed(2)}
                </strong>
              </div>
              <div className="life-row">
                <span>Baisse maximale depuis un sommet</span>
                <strong>{stats.drawdown.toFixed(2)}</strong>
              </div>
              <div className="life-row">
                <span>Positions encore ouvertes</span>
                <strong>
                  {filtered.filter((t) => t.status === "open").length}
                </strong>
              </div>
              <Link className="neo-pill" href="/finance/journal">
                Compléter mes bilans
              </Link>
            </LifePanel>
          </div>
        </>
      )}
    </>
  );
}
function RiskCalculator() {
  const [capital, setCapital] = useState(""),
    [risk, setRisk] = useState(""),
    [entry, setEntry] = useState(""),
    [stop, setStop] = useState("");
  const result = positionSize(
    Number(capital),
    Number(risk),
    Number(entry),
    Number(stop),
  );
  return (
    <LifePanel title="Simuler la taille d’une position">
      <div className="life-form-grid">
        <label>
          Capital
          <input
            type="number"
            min="0"
            step="any"
            value={capital}
            onChange={(e) => setCapital(e.target.value)}
          />
        </label>
        <label>
          Risque choisi (%)
          <input
            type="number"
            min="0"
            max="100"
            step="any"
            value={risk}
            onChange={(e) => setRisk(e.target.value)}
          />
        </label>
        <label>
          Prix d’entrée
          <input
            type="number"
            min="0"
            step="any"
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
          />
        </label>
        <label>
          Prix du stop
          <input
            type="number"
            min="0"
            step="any"
            value={stop}
            onChange={(e) => setStop(e.target.value)}
          />
        </label>
      </div>
      {result ? (
        <p>
          <strong>{result.riskAmount.toFixed(2)}</strong> de risque théorique ·{" "}
          <strong>{result.quantity.toFixed(4)}</strong> unités
        </p>
      ) : (
        <p className="life-muted">
          Renseigne quatre valeurs positives et deux prix différents.
        </p>
      )}
      <small>
        Prix et capital dans la même unité monétaire. Frais, levier et
        conversion de devises non inclus.
      </small>
    </LifePanel>
  );
}
function FinanceOverview() {
  const life = useLife(),
    trading = useTrading();
  const own = life.entries.filter(
      (e) => e.universe === "finance" && !e.archived,
    ),
    stats = tradingSummary(trading.trades);
  const courses = own.filter((e) => e.kind === "learning"),
    plans = own
      .filter((e) => e.kind === "plan" && e.data.status === "planned")
      .sort((a, b) =>
        (a.day + text(a, "time")).localeCompare(b.day + text(b, "time")),
      );
  return (
    <>
      <div className="life-metrics">
        <LifeMetric
          label="Positions suivies"
          value={
            trading.loading ? "…" : trading.error ? "—" : trading.trades.length
          }
          detail={`${trading.trades.filter((t) => t.status === "open").length} ouvertes`}
        />
        <LifeMetric
          label="Win rate"
          value={
            trading.loading
              ? "…"
              : trading.error || stats.winRate === null
                ? "—"
                : stats.winRate.toFixed(1) + " %"
          }
          detail={`${stats.closed.length} trades clôturés`}
        />
        <LifeMetric
          label="Formation"
          value={
            courses.filter((e) => e.data.status === "done").length +
            " / " +
            courses.length
          }
          detail="Cours terminés"
        />
        <LifeMetric label="Sessions prévues" value={plans.length} />
      </div>
      {trading.error && (
        <p role="alert">
          {trading.error}{" "}
          <button onClick={() => void trading.refresh()}>Réessayer</button>
        </p>
      )}
      <div className="life-grid">
        <LifePanel title="Mes prochaines sessions">
          {plans.slice(0, 4).map((e) => (
            <Link
              className="life-link-card"
              key={e.id}
              href="/finance/planning"
            >
              <strong>{e.title}</strong>
              <span>
                {new Date(e.day + "T12:00:00").toLocaleDateString("fr-FR")} ·{" "}
                {text(e, "time")} · {e.value} min
              </span>
            </Link>
          ))}
          {!plans.length && (
            <LifeEmpty>
              Prévois une session de formation, d’analyse ou de bilan.
            </LifeEmpty>
          )}
          <Link className="neo-pill" href="/finance/planning">
            Planifier une session
          </Link>
        </LifePanel>
        <LifePanel title="Mon espace de trading">
          <Link className="life-link-card" href="/trading">
            <strong>Journal de trading</strong>
            <span>Retrouver mes positions enregistrées →</span>
          </Link>
          <Link className="life-link-card" href="/finance/analyses">
            <strong>Mes analyses</strong>
            <span>Courbe, statistiques et bilans →</span>
          </Link>
          <Link className="life-link-card" href="/finance/learning">
            <strong>Formation</strong>
            <span>Cours, progression et notes →</span>
          </Link>
          <Link className="life-link-card" href="/finance/resources">
            <strong>Ma bibliothèque</strong>
            <span>Setups, documents et ressources →</span>
          </Link>
        </LifePanel>
      </div>
      <RiskCalculator />
    </>
  );
}
export function FinanceWorkspace({ section = "" }: { section?: string }) {
  return (
    <LifeLayout universe="finance" section={section}>
      {section === "analyses" ? (
        <TradingAnalytics />
      ) : section === "journal" ? (
        <FinanceJournal />
      ) : section === "planning" ? (
        <EntryManager
          universe="finance"
          kind="plan"
          title="Mes sessions planifiées"
          valueLabel="Durée en minutes"
          fields={[
            { key: "time", label: "Heure (HH:MM)", defaultValue: "18:00" },
            {
              key: "type",
              label: "Type",
              type: "select",
              options: [
                { value: "learning", label: "Formation" },
                { value: "analysis", label: "Analyse" },
                { value: "review", label: "Bilan du journal" },
              ],
            },
            {
              key: "status",
              label: "État",
              type: "select",
              options: [
                { value: "planned", label: "Prévue" },
                { value: "done", label: "Terminée" },
                { value: "canceled", label: "Annulée" },
              ],
            },
            { key: "notes", label: "Plan de la session", type: "textarea" },
          ]}
        />
      ) : section === "learning" ? (
        <EntryManager
          universe="finance"
          kind="learning"
          title="Ma formation"
          fields={[
            { key: "source", label: "Cours / source" },
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
            { key: "notes", label: "Notes / leçons", type: "textarea" },
          ]}
        />
      ) : section === "goals" ? (
        <LifeGoals universe="finance" />
      ) : section === "resources" ? (
        <>
          <LifeResources universe="finance" />
          <SetupLibrary />
        </>
      ) : (
        <FinanceOverview />
      )}
    </LifeLayout>
  );
}
function SetupLibrary() {
  const { trades } = useTrading();
  const setups = Array.from(
    new Set(trades.map((t) => t.setup?.trim()).filter((s): s is string => !!s)),
  );
  return (
    <LifePanel title="Setups de mon journal">
      {setups.map((setup) => (
        <Link className="life-link-card" key={setup} href="/finance/journal">
          <strong>{setup}</strong>
          <span>
            {trades.filter((t) => t.setup?.trim() === setup).length} trades
            associés →
          </span>
        </Link>
      ))}
      {!setups.length && (
        <LifeEmpty>
          Les setups renseignés dans ton journal apparaîtront ici.
        </LifeEmpty>
      )}
    </LifePanel>
  );
}

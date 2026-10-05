"use client";

import { useMemo, useState } from "react";
import { ActionFeedback, LifeLayout, useLifeAction } from "@/components/LifeUI";
import { V3Dialog } from "@/components/V3Dialog";
import { NeuCard, NeuButton } from "@/components/Neu";
import {
  tradePnl,
  TradeDirection,
  useTrading,
} from "@/components/TradingProvider";
import { ArrowDownRight, ArrowUpRight, Trash2 } from "@/components/icons";

export default function TradingPage() {
  const {
    trades,
    addTrade,
    closeTrade,
    removeTrade,
    demoMode,
    loading,
    error,
    refresh,
  } = useTrading();
  const action = useLifeAction();
  const [removing, setRemoving] = useState<string | null>(null);
  const [asset, setAsset] = useState("EURUSD");
  const [direction, setDirection] = useState<TradeDirection>("long");
  const [entry, setEntry] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [setup, setSetup] = useState("");
  const [note, setNote] = useState("");
  const [closing, setClosing] = useState<Record<string, string>>({});

  const stats = useMemo(() => {
    const closed = trades.filter((t) => t.status === "closed");
    const pnl = closed.reduce((a, t) => a + tradePnl(t), 0);
    const wins = closed.filter((t) => tradePnl(t) > 0).length;
    return {
      closed,
      pnl,
      winRate: closed.length ? (wins / closed.length) * 100 : 0,
      open: trades.filter((t) => t.status === "open").length,
    };
  }, [trades]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(entry.replace(",", ".")),
      qty = Number(quantity.replace(",", "."));
    if (
      await action.run(
        () =>
          addTrade({
            asset: asset.trim().toUpperCase(),
            direction,
            entry: price,
            quantity: qty,
            setup: setup || null,
            note: note || null,
            exit: null,
          }),
        "Trade ajouté au journal.",
      )
    ) {
      setEntry("");
      setSetup("");
      setNote("");
    }
  }

  return (
    <LifeLayout universe="finance" section="trading">
      <p className="life-muted">
        Mes positions et observations ·{" "}
        {demoMode ? "sur cet appareil" : "sur mon compte"}
      </p>
      {loading && <p role="status">Chargement du journal…</p>}
      {error && (
        <p role="alert">
          {error} <button onClick={() => void refresh()}>Réessayer</button>
        </p>
      )}
      <ActionFeedback action={action} />

      <div className="metric-grid trading-metrics">
        <div className="metric-card soft-card">
          <span>Trades suivis</span>
          <strong>{trades.length}</strong>
          <small>{stats.open} ouverts</small>
        </div>
        <div className="metric-card soft-card">
          <span>Trades clôturés</span>
          <strong>{stats.closed.length}</strong>
          <small>journal complet</small>
        </div>
        <div className="metric-card soft-card">
          <span>Win rate</span>
          <strong>{stats.winRate.toFixed(0)}%</strong>
          <small>sur les trades clôturés</small>
        </div>
        <div className="metric-card soft-card">
          <span>P&L brut</span>
          <strong className={stats.pnl < 0 ? "negative" : "positive"}>
            {stats.pnl >= 0 ? "+" : ""}
            {stats.pnl.toFixed(2)}
          </strong>
          <small>unités de cotation · hors frais</small>
        </div>
      </div>

      <div className="trading-layout">
        <NeuCard className="journal-card">
          <div className="section-title">
            <div>
              <h2>Journal</h2>
              <p className="muted">Entrées enregistrées sur ton compte.</p>
            </div>
          </div>
          <div className="trade-table">
            <div className="trade-row trade-row-head">
              <span>Actif</span>
              <span>Sens</span>
              <span>Entrée</span>
              <span>Sortie</span>
              <span>Résultat</span>
              <span />
            </div>
            {trades.map((t) => (
              <div className="trade-row" key={t.id}>
                <div>
                  <strong>{t.asset}</strong>
                  <small>{t.setup || "Sans setup"}</small>
                </div>
                <span className="direction-cell">
                  {t.direction === "long" ? (
                    <ArrowUpRight size={15} />
                  ) : (
                    <ArrowDownRight size={15} />
                  )}{" "}
                  {t.direction}
                </span>
                <span>{t.entry}</span>
                <span>
                  {t.status === "closed" ? (
                    t.exit
                  ) : (
                    <input
                      aria-label={"Prix de sortie " + t.asset}
                      className="mini-input"
                      placeholder="sortie"
                      value={closing[t.id] || ""}
                      onChange={(e) =>
                        setClosing((v) => ({ ...v, [t.id]: e.target.value }))
                      }
                    />
                  )}
                </span>
                <strong className={tradePnl(t) < 0 ? "negative" : "positive"}>
                  {t.status === "closed"
                    ? `${tradePnl(t) >= 0 ? "+" : ""}${tradePnl(t).toFixed(2)}`
                    : "ouverte"}
                </strong>
                <div className="row-actions">
                  {t.status === "open" && (
                    <button
                      className="tiny-button"
                      disabled={action.busy}
                      onClick={() =>
                        void action.run(
                          () =>
                            closeTrade(
                              t.id,
                              Number((closing[t.id] || "").replace(",", ".")),
                            ),
                          "Position clôturée.",
                        )
                      }
                    >
                      Clôturer
                    </button>
                  )}
                  <button
                    className="icon-ghost"
                    aria-label={"Supprimer " + t.asset}
                    disabled={action.busy}
                    onClick={() => setRemoving(t.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
            {!trades.length && (
              <div className="empty-state">
                Le journal est vide. Ajoute une première observation à droite.
              </div>
            )}
          </div>
        </NeuCard>

        <NeuCard className="trade-form-card">
          <span className="eyebrow">NOUVELLE ENTRÉE</span>
          <h2>Journaliser un trade</h2>
          <p className="muted">
            Suivi et analyse uniquement. Aucun ordre n’est envoyé à un broker.
          </p>
          <form onSubmit={submit} className="trade-form">
            <label>
              Actif
              <input
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
                placeholder="EURUSD"
              />
            </label>
            <div className="form-two">
              <label>
                Sens
                <select
                  value={direction}
                  onChange={(e) =>
                    setDirection(e.target.value as TradeDirection)
                  }
                >
                  <option value="long">Long</option>
                  <option value="short">Short</option>
                </select>
              </label>
              <label>
                Quantité
                <input
                  inputMode="decimal"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </label>
            </div>
            <label>
              Prix d’entrée
              <input
                inputMode="decimal"
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                placeholder="1.0824"
              />
            </label>
            <label>
              Setup
              <input
                value={setup}
                onChange={(e) => setSetup(e.target.value)}
                placeholder="Pullback, breakout…"
              />
            </label>
            <label>
              Note
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Contexte, invalidation, émotion…"
              />
            </label>
            <NeuButton
              type="submit"
              disabled={action.busy || loading || !!error}
            >
              {action.busy ? "Enregistrement…" : "Ajouter au journal"}
            </NeuButton>
          </form>
        </NeuCard>
      </div>
      <V3Dialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title="Supprimer le trade"
      >
        <p>
          Cette suppression efface définitivement l’entrée du journal. Les
          autres positions restent conservées.
        </p>
        <div className="life-panel-actions">
          <button className="neo-pill" onClick={() => setRemoving(null)}>
            Annuler
          </button>
          <button
            className="neo-pill"
            disabled={action.busy}
            onClick={() =>
              void action
                .run(() => removeTrade(removing!), "Trade supprimé.")
                .then((ok) => {
                  if (ok) setRemoving(null);
                })
            }
          >
            Confirmer la suppression
          </button>
        </div>
        <ActionFeedback action={action} />
      </V3Dialog>
    </LifeLayout>
  );
}

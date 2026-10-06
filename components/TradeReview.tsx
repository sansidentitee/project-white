"use client";
import { useState } from "react";
import { useLife } from "./LifeProvider";
import { useTrading, Trade } from "./TradingProvider";
import { localDay, num, text } from "@/lib/life";
import { resultInR } from "@/lib/progress";
import { ActionFeedback, LifeMetric, useLifeAction } from "./LifeUI";
export function TradeReview({ trade }: { trade: Trade }) {
  const life = useLife(),
    action = useLifeAction(),
    entry = life.entries.find(
      (e) => e.key === "trade-review-" + trade.id && !e.archived,
    );
  const [stage, setStage] = useState("before");
  const r = resultInR(trade, num(entry, "risk"), num(entry, "fees") || 0),
    attachments = life.entries.filter(
      (e) =>
        !e.archived && e.kind === "resource" && e.data.tradeId === trade.id,
    );
  return (
    <div className="v4-trade-review">
      <h3>Plan & résultat en R</h3>
      <p>
        <strong>{r === null ? "R non calculable" : r.toFixed(2) + " R"}</strong>{" "}
        · 1 R correspond au risque initial que tu as renseigné.
      </p>
      <form
        key={entry?.id || "new"}
        className="life-form"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget),
            risk = String(fd.get("risk") || "").trim(),
            fees = String(fd.get("fees") || "").trim();
          void action.run(() =>
            life.save({
              universe: "finance",
              kind: "reflection",
              title: "Plan : " + trade.asset,
              day: localDay(new Date(trade.openedAt)),
              key: "trade-review-" + trade.id,
              data: {
                type: "trade-review",
                tradeId: trade.id,
                risk: risk ? Number(risk) : null,
                fees: fees ? Number(fees) : 0,
                plan: String(fd.get("plan") || ""),
                respect: String(fd.get("respect") || "unknown"),
                emotionBefore: String(fd.get("emotionBefore") || ""),
                emotionAfter: String(fd.get("emotionAfter") || ""),
                lesson: String(fd.get("lesson") || ""),
              },
            }),
          );
        }}
      >
        <div className="life-form-grid">
          <label>
            Risque initial · unités de cotation
            <input
              name="risk"
              type="number"
              min="0.00000001"
              step="any"
              defaultValue={num(entry, "risk") ?? ""}
            />
          </label>
          <label>
            Frais · mêmes unités
            <input
              name="fees"
              type="number"
              min={0}
              step="any"
              defaultValue={num(entry, "fees") ?? 0}
            />
          </label>
        </div>
        <label>
          Mon plan avant le trade
          <textarea
            name="plan"
            maxLength={10000}
            defaultValue={text(entry, "plan")}
          />
        </label>
        <label>
          Respect de mon plan
          <select
            name="respect"
            defaultValue={text(entry, "respect") || "unknown"}
          >
            <option value="unknown">Non évalué</option>
            <option value="yes">Respecté</option>
            <option value="partial">Partiellement respecté</option>
            <option value="no">Non respecté</option>
          </select>
        </label>
        <div className="life-form-grid">
          <label>
            Émotions avant
            <input
              name="emotionBefore"
              maxLength={300}
              defaultValue={text(entry, "emotionBefore")}
            />
          </label>
          <label>
            Émotions après
            <input
              name="emotionAfter"
              maxLength={300}
              defaultValue={text(entry, "emotionAfter")}
            />
          </label>
        </div>
        <label>
          Leçon à retenir
          <textarea
            name="lesson"
            maxLength={10000}
            defaultValue={text(entry, "lesson")}
          />
        </label>
        <button className="neo-pill primary" disabled={action.busy}>
          Enregistrer mon plan
        </button>
        <small>
          R = (P&L du trade − frais) / risque initial. Risque, frais et résultat
          doivent utiliser la même unité. Aucune conversion de devise n’est
          appliquée.
        </small>
      </form>
      <div className="life-form">
        <label>
          Moment de la capture
          <select value={stage} onChange={(e) => setStage(e.target.value)}>
            <option value="before">Avant le trade</option>
            <option value="after">Après le trade</option>
          </select>
        </label>
        <label>
          Importer une capture · 2 Mo maximum
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={action.busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              void action.run(async () => {
                if (
                  !["image/png", "image/jpeg", "image/webp"].includes(file.type)
                )
                  throw Error("Choisis une image PNG, JPEG ou WebP.");
                const attachment = await life.upload("finance", file);
                await life.save({
                  universe: "finance",
                  kind: "resource",
                  title:
                    trade.asset +
                    " · " +
                    (stage === "before" ? "Avant" : "Après"),
                  day: localDay(),
                  data: { ...attachment, tradeId: trade.id, stage },
                });
              }, "Capture enregistrée.");
            }}
          />
        </label>
      </div>
      {attachments.map((e) => (
        <div className="life-entry" key={e.id}>
          <span>
            {e.data.stage === "before" ? "Avant" : "Après"} ·{" "}
            {text(e, "fileName")}
          </span>
          <div>
            <button
              className="neo-pill"
              disabled={action.busy}
              onClick={() =>
                void action.run(
                  () => life.openFile(e),
                  "Téléchargement demandé.",
                )
              }
            >
              Voir / télécharger
            </button>
            <button
              className="neo-pill"
              disabled={action.busy}
              onClick={() => void action.run(() => life.archive(e.id))}
            >
              Retirer
            </button>
          </div>
        </div>
      ))}
      <ActionFeedback action={action} />
    </div>
  );
}
export function TradeQuality() {
  const life = useLife(),
    { trades } = useTrading();
  const pairs = trades
      .filter((t) => t.status === "closed")
      .map((trade) => {
        const review = life.entries.find(
          (e) => !e.archived && e.key === "trade-review-" + trade.id,
        );
        return {
          review,
          r: resultInR(trade, num(review, "risk"), num(review, "fees") || 0),
        };
      }),
    rs = pairs.map((p) => p.r).filter((r): r is number => r !== null),
    evaluated = pairs.filter((p) =>
      ["yes", "partial", "no"].includes(text(p.review, "respect")),
    );
  return (
    <div className="life-metrics">
      <LifeMetric
        label="Résultat moyen en R"
        value={
          rs.length
            ? (rs.reduce((s, r) => s + r, 0) / rs.length).toFixed(2) + " R"
            : "—"
        }
        detail={`${rs.length} trades avec risque initial renseigné`}
      />
      <LifeMetric
        label="Plans respectés"
        value={
          evaluated.length
            ? `${evaluated.filter((p) => p.review?.data.respect === "yes").length}/${evaluated.length}`
            : "—"
        }
        detail="Trades clôturés et évalués"
      />
    </div>
  );
}

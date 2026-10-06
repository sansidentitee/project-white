"use client";
import { useState } from "react";
import { useProject } from "./ProjectProvider";
import { useLife } from "./LifeProvider";
import { useTrading } from "./TradingProvider";
import { useDailyReviews } from "./DailyReviewProvider";
export function DataExport() {
  const project = useProject(),
    life = useLife(),
    trading = useTrading();
  const daily = useDailyReviews();
  const [notice, setNotice] = useState("");
  const blocked =
    project.loading ||
    life.loading ||
    trading.loading ||
    daily.loading ||
    !!(project.error || life.error || trading.error || daily.error);
  function download() {
    const backup = {
      format: "project-white-export",
      version: 1,
      exportedAt: new Date().toISOString(),
      academic: project.state,
      life: life.entries,
      trades: trading.trades,
      dailyReviews: daily.reviews,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `project-white-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Export préparé. Retrouve-le dans tes téléchargements.");
  }
  return (
    <section className="neo-panel calm-settings">
      <h2>Exporter mes données</h2>
      <p>
        Notes, tâches, sessions, journal de trading et données des quatre
        univers. Les fichiers hébergés sont référencés par leur lien ; leur
        contenu n’est pas téléchargé.
      </p>
      <button className="neo-pill" disabled={blocked} onClick={download}>
        Télécharger mon export JSON
      </button>
      {blocked && (
        <p>
          Attends le chargement complet et résous les erreurs de synchronisation
          avant d’exporter.
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
    </section>
  );
}

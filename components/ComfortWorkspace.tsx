"use client";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import {
  comfortSections,
  comfortNames,
  type ComfortUniverse,
} from "@/lib/comfort";
import { PageFrame } from "./PageFrame";
import { useComfortFilter } from "./ComfortProvider";
import { HealthTrends, MemorizationPath } from "./ProgressWorkspace";
import { TradeQuality } from "./TradeReview";
import { SmartDashboard } from "./AcademicV3";
import { FavoriteButton, OptionalPanel } from "./CalmWorkspace";
export function ComfortWorkspace({
  universe,
  view,
}: {
  universe: ComfortUniverse;
  view: "items" | "progress";
}) {
  const [query, setQuery] = useComfortFilter(`hub:${universe}:${view}`);
  const sections = comfortSections[universe].filter(
    (s) =>
      s.view === view &&
      s.label.toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr")),
  );
  return (
    <PageFrame>
      <div className="comfort-hub">
        <span className="comfort-eyebrow">{comfortNames[universe]}</span>
        <h1>{view === "items" ? "Mes éléments" : "Ma progression"}</h1>
        <p>
          {view === "items"
            ? "Choisis ce que tu souhaites retrouver."
            : "Prendre du recul et voir mes prochains pas."}
        </p>
        <label className="comfort-search">
          Filtrer ces espaces
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Un espace à retrouver…"
            type="search"
          />
        </label>
        {view === "progress" && (
          <OptionalPanel title="Mon bilan en détail">
            <div className="comfort-progress">
              {universe === "health" ? (
                <HealthTrends />
              ) : universe === "islam" ? (
                <MemorizationPath />
              ) : universe === "finance" ? (
                <TradeQuality />
              ) : (
                <SmartDashboard only="review" />
              )}
            </div>
          </OptionalPanel>
        )}
        <div className="comfort-hub-grid">
          {sections.map((s) => (
            <div key={s.href} className="calm-hub-item">
              <FavoriteButton href={s.href} label={s.label} />
              <Link href={s.href} className="comfort-hub-card">
                {view === "items" ? (
                  <BookOpen size={20} />
                ) : (
                  <CheckCircle2 size={20} />
                )}
                <h2>{s.label}</h2>
                <p>{s.description}</p>
                <span>
                  Ouvrir
                  <ArrowRight size={16} />
                </span>
              </Link>
            </div>
          ))}
        </div>
        {!sections.length && (
          <p role="status">
            Aucun espace ne correspond.{" "}
            <button onClick={() => setQuery("")}>Effacer le filtre</button>
          </p>
        )}
      </div>
    </PageFrame>
  );
}

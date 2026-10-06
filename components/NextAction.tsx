"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useProject } from "./ProjectProvider";
import { useLife } from "./LifeProvider";
import { useTrading } from "./TradingProvider";
import { priorities } from "@/lib/academic";
import { localDay, prayers, reviewDue } from "@/lib/life";
import { comfortSections, type ComfortUniverse } from "@/lib/comfort";
export function NextAction({
  universe = "academic",
  global = false,
}: {
  universe?: ComfortUniverse;
  global?: boolean;
}) {
  const project = useProject(),
    life = useLife(),
    trading = useTrading();
  const own = life.entries.filter((e) => !e.archived),
    today = localDay();
  const task = priorities(project.state.tasks)[0];
  const prayer = own.find((e) => e.kind === "prayers" && e.day === today);
  const due = own.filter((e) => e.kind === "memorization" && reviewDue(e));
  const course = own.find(
    (e) =>
      e.universe === "finance" &&
      e.kind === "learning" &&
      e.data.status !== "done",
  );
  const health = own.some((e) => e.kind === "health-day" && e.day === today);
  const actions = {
    academic: task
      ? {
          title: task.title,
          detail: `${task.durationMin} minutes · Une tâche à la fois.`,
          href: "/academic/revisions?task=" + task.id,
          cta: "Commencer cette tâche",
        }
      : {
          title: "Préparer ma prochaine tâche",
          detail: "Un titre suffit pour commencer.",
          href: "/academic/inbox",
          cta: "Ajouter une tâche",
        },
    islam: prayers.some((p) => prayer?.data[p] !== true)
      ? {
          title: "Renseigner mes prières",
          detail: "Retrouver les cinq prières de ma journée.",
          href: "/islam/prayers",
          cta: "Ouvrir mes prières",
        }
      : {
          title: due.length
            ? "Reprendre mes passages à revoir"
            : "Continuer mon parcours de Coran",
          detail: due.length
            ? `${due.length} passages à revoir.`
            : "Lecture, mémorisation et révision à mon rythme.",
          href: "/islam/quran",
          cta: "Ouvrir mes révisions",
        },
    finance: trading.trades.some((t) => t.status === "open")
      ? {
          title: "Reprendre mon journal",
          detail: "Mes positions ouvertes et mon plan.",
          href: "/finance/journal",
          cta: "Ouvrir mon journal",
        }
      : {
          title: course?.title || "Continuer ma formation",
          detail: "Modules, exercices et notes personnelles.",
          href: "/finance/learning",
          cta: "Reprendre ma formation",
        },
    health: {
      title: health
        ? "Cocher mes habitudes du jour"
        : "Prendre une minute pour mon bilan",
      detail: health
        ? "Avancer à mon rythme, un geste à la fois."
        : "Seuls les champs que je connais sont utiles.",
      href: health ? "/health/habits" : "/health/daily",
      cta: health ? "Ouvrir mes habitudes" : "Remplir mon bilan",
    },
  };
  const current = actions[universe];
  const Heading = global ? "h2" : "h1";
  const alternatives = global
    ? [actions.islam, actions.health]
    : comfortSections[universe]
        .filter((s) => s.view === "items" && s.href !== current.href)
        .slice(0, 2)
        .map((s) => ({ title: s.label, href: s.href }));
  const loading = project.loading || life.loading || trading.loading;
  return (
    <section className="comfort-next" aria-label="Ma prochaine action">
      <div>
        <span className="comfort-eyebrow">
          {global ? "MA JOURNÉE" : "POUR COMMENCER"}
        </span>
        <Heading>{loading ? "Préparer ma journée…" : current.title}</Heading>
        <p>{loading ? "Chargement de mes éléments." : current.detail}</p>
      </div>
      {!loading && (
        <Link className="comfort-primary" href={current.href}>
          {current.cta}
          <ArrowRight size={18} />
        </Link>
      )}
      {!loading && (
        <div className="comfort-alternatives">
          <span>Ou choisir :</span>
          {alternatives.map((a) => (
            <Link key={a.href} href={a.href}>
              {a.title}
              <ArrowRight size={14} />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

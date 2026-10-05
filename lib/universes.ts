import type { LifeUniverse } from "./life";
export const universeSections: Record<
  LifeUniverse,
  { slug: string; label: string }[]
> = {
  islam: [
    { slug: "", label: "Vue d’ensemble" },
    { slug: "prayers", label: "Prières" },
    { slug: "quran", label: "Coran · Révisions" },
    { slug: "learning", label: "Apprentissage" },
    { slug: "goals", label: "Objectifs" },
    { slug: "resources", label: "Ressources" },
  ],
  finance: [
    { slug: "", label: "Vue d’ensemble" },
    { slug: "trading", label: "Journal de trading" },
    { slug: "analyses", label: "Analyses" },
    { slug: "journal", label: "Bilans des trades" },
    { slug: "planning", label: "Planification" },
    { slug: "learning", label: "Formation" },
    { slug: "goals", label: "Objectifs" },
    { slug: "resources", label: "Ressources" },
  ],
  health: [
    { slug: "", label: "Vue d’ensemble" },
    { slug: "daily", label: "Bilan quotidien" },
    { slug: "activity", label: "Activité · Sport" },
    { slug: "habits", label: "Habitudes" },
    { slug: "journal", label: "Journal personnel" },
    { slug: "goals", label: "Objectifs" },
    { slug: "resources", label: "Ressources" },
  ],
};
export function universeHref(universe: LifeUniverse, slug: string) {
  return universe === "finance" && slug === "trading"
    ? "/trading"
    : `/${universe}${slug ? "/" + slug : ""}`;
}
export const universeDescriptions = {
  islam: {
    name: "Islam",
    intro: "Un espace calme pour tes prières, ton Coran et ton apprentissage.",
  },
  finance: {
    name: "Finance",
    intro:
      "Documenter tes décisions, analyser ton journal et progresser dans ta formation.",
  },
  health: {
    name: "Santé",
    intro:
      "Observer tes journées et construire les habitudes qui te conviennent.",
  },
};

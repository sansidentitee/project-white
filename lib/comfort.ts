export type ComfortUniverse = "academic" | "islam" | "finance" | "health";
export const comfortHomes: Record<ComfortUniverse, string> = {
  academic: "/academic/dashboard",
  islam: "/islam",
  finance: "/finance",
  health: "/health",
};
export const comfortNames = {
  academic: "Académie",
  islam: "Islam",
  finance: "Finance",
  health: "Santé",
};
export const comfortSections: Record<
  ComfortUniverse,
  {
    label: string;
    href: string;
    description: string;
    view: "items" | "progress";
  }[]
> = {
  academic: [
    {
      label: "Tâches et planning",
      href: "/academic/tasks",
      description: "Organiser ce que tu as à faire.",
      view: "items",
    },
    {
      label: "Matières",
      href: "/academic/subjects",
      description: "Cours, chapitres et ressources réunis.",
      view: "items",
    },
    {
      label: "Notes et tendances",
      href: "/academic/grades",
      description: "Ajouter, corriger ou retirer une note.",
      view: "items",
    },
    {
      label: "Réviser mes erreurs",
      href: "/academic/errors",
      description: "Reprendre les points qui résistent.",
      view: "items",
    },
    {
      label: "Ressources",
      href: "/academic/resources",
      description: "Retrouver mes documents et mes liens.",
      view: "items",
    },
    {
      label: "Bilan de la semaine",
      href: "/academic/review",
      description: "Comprendre ma semaine et préparer la suivante.",
      view: "progress",
    },
    {
      label: "Objectifs",
      href: "/academic/goals",
      description: "Choisir et suivre mes prochains objectifs.",
      view: "progress",
    },
  ],
  islam: [
    {
      label: "Prières",
      href: "/islam/prayers",
      description: "Renseigner ma journée en quelques gestes.",
      view: "items",
    },
    {
      label: "Coran et mémorisation",
      href: "/islam/quran",
      description: "Reprendre mes passages et mes révisions.",
      view: "items",
    },
    {
      label: "Apprentissage",
      href: "/islam/learning",
      description: "Continuer mes cours et mes notes.",
      view: "items",
    },
    {
      label: "Ressources",
      href: "/islam/resources",
      description: "Mes livres, documents et liens.",
      view: "items",
    },
    {
      label: "Parcours de mémorisation",
      href: "/islam/quran",
      description: "Objectif hebdomadaire et historique des révisions.",
      view: "progress",
    },
    {
      label: "Objectifs",
      href: "/islam/goals",
      description: "Suivre ce que je souhaite accomplir.",
      view: "progress",
    },
  ],
  finance: [
    {
      label: "Journal de trading",
      href: "/trading",
      description: "Ajouter et suivre mes positions.",
      view: "items",
    },
    {
      label: "Formation",
      href: "/finance/learning",
      description: "Reprendre mes modules, exercices et quiz.",
      view: "items",
    },
    {
      label: "Sessions prévues",
      href: "/finance/planning",
      description: "Planifier mon trading et mon apprentissage.",
      view: "items",
    },
    {
      label: "Ressources",
      href: "/finance/resources",
      description: "Mes documents, captures et setups.",
      view: "items",
    },
    {
      label: "Analyses",
      href: "/finance/analyses",
      description: "Résultats, régularité et respect de mon plan.",
      view: "progress",
    },
    {
      label: "Bilans des trades",
      href: "/finance/journal",
      description: "Documenter mes décisions et mes leçons.",
      view: "progress",
    },
    {
      label: "Objectifs",
      href: "/finance/goals",
      description: "Suivre ma progression personnelle.",
      view: "progress",
    },
  ],
  health: [
    {
      label: "Bilan rapide",
      href: "/health/daily",
      description: "Noter seulement ce que je connais.",
      view: "items",
    },
    {
      label: "Habitudes",
      href: "/health/habits",
      description: "Cocher mes habitudes du jour.",
      view: "items",
    },
    {
      label: "Activité",
      href: "/health/activity",
      description: "Enregistrer mes séances.",
      view: "items",
    },
    {
      label: "Journal",
      href: "/health/journal",
      description: "Prendre un moment pour mon ressenti.",
      view: "items",
    },
    {
      label: "Tendances et habitudes",
      href: "/health",
      description: "Observer mes trente derniers jours.",
      view: "progress",
    },
    {
      label: "Objectifs",
      href: "/health/goals",
      description: "Suivre mes objectifs à mon rythme.",
      view: "progress",
    },
  ],
};

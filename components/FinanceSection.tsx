import { FinanceWorkspace } from "./FinanceWorkspace";
export function FinanceSection({
  title,
}: {
  title: "Analyses" | "Journal" | "Planification" | "Ressources" | "Objectifs";
}) {
  const section = {
    Analyses: "analyses",
    Journal: "journal",
    Planification: "planning",
    Ressources: "resources",
    Objectifs: "goals",
  }[title];
  return <FinanceWorkspace section={section} />;
}

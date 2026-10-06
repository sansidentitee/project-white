import { notFound } from "next/navigation";
import { ComfortWorkspace } from "@/components/ComfortWorkspace";
import { comfortHomes, type ComfortUniverse } from "@/lib/comfort";
export function generateStaticParams() {
  return Object.keys(comfortHomes).flatMap((universe) =>
    ["items", "progress"].map((view) => ({ universe, view })),
  );
}
export default async function Page({
  params,
}: {
  params: Promise<{ universe: string; view: string }>;
}) {
  const { universe, view } = await params;
  if (
    !Object.hasOwn(comfortHomes, universe) ||
    (view !== "items" && view !== "progress")
  )
    notFound();
  return (
    <ComfortWorkspace universe={universe as ComfortUniverse} view={view} />
  );
}

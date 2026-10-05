import { notFound } from "next/navigation";
import { HealthWorkspace } from "@/components/HealthWorkspace";
import { universeSections } from "@/lib/universes";
export function generateStaticParams() {
  return universeSections.health
    .filter((s) => s.slug)
    .map((s) => ({ section: s.slug }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!universeSections.health.some((s) => s.slug === section)) notFound();
  return <HealthWorkspace section={section} />;
}

import { notFound } from "next/navigation";
import { IslamWorkspace } from "@/components/IslamWorkspace";
import { universeSections } from "@/lib/universes";
export function generateStaticParams() {
  return universeSections.islam
    .filter((s) => s.slug)
    .map((s) => ({ section: s.slug }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!universeSections.islam.some((s) => s.slug === section)) notFound();
  return <IslamWorkspace section={section} />;
}

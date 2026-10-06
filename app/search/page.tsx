import { Suspense } from "react";
import { GlobalSearch } from "@/components/GlobalWorkspace";
export default function SearchPage() {
  return (
    <Suspense fallback={<p>Chargement de la recherche…</p>}>
      <GlobalSearch />
    </Suspense>
  );
}

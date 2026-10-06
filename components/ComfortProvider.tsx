"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { useAuth } from "./AuthProvider";
type Filters = Record<string, string>;
const Context = createContext<{
  filters: Filters;
  set: (key: string, value: string) => void;
} | null>(null);
function ScopedFilters({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Filters>({});
  return (
    <Context.Provider
      value={{
        filters,
        set: (key, value) =>
          setFilters((previous) => ({ ...previous, [key]: value })),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function ComfortProvider({ children }: { children: ReactNode }) {
  const { user, configured } = useAuth();
  return (
    <ScopedFilters key={configured ? user?.id || "signed-out" : "local"}>
      {children}
    </ScopedFilters>
  );
}
export function useComfortFilter<T extends string = string>(
  key: string,
  initial: string = "",
) {
  const context = useContext(Context);
  if (!context) throw Error("ComfortProvider missing");
  return [
    (context.filters[key] ?? initial) as T,
    (value: T) => context.set(key, value),
  ] as const;
}

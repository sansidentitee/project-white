"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthProvider";
type Filters = Record<string, string>;
const Context = createContext<{
  filters: Filters;
  set: (key: string, value: string) => void;
  ready: boolean;
  storageError: string;
} | null>(null);
function ScopedFilters({
  children,
  owner,
}: {
  children: ReactNode;
  owner: string;
}) {
  const [filters, setFilters] = useState<Filters>({});
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const current = useRef<Filters>({});
  const storageKey = `project-white-comfort-v2:${owner}`;
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey) || "{}");
      if (raw && !Array.isArray(raw) && typeof raw === "object") {
        current.current = Object.fromEntries(
          Object.entries(raw).filter(([, value]) => typeof value === "string"),
        ) as Filters;
        setFilters(current.current);
      }
    } catch {
      setStorageError(
        "Les préférences de cet appareil n’ont pas pu être chargées.",
      );
    }
    setReady(true);
  }, [storageKey]);
  function set(key: string, value: string) {
    let previous = current.current;
    try {
      const latest = JSON.parse(localStorage.getItem(storageKey) || "{}");
      if (latest && !Array.isArray(latest) && typeof latest === "object")
        previous = Object.fromEntries(Object.entries(latest).filter(([, item]) => typeof item === "string")) as Filters;
    } catch { /* Preserve the current draft even if storage cannot be read. */ }
    const next = { ...previous, [key]: value };
    current.current = next;
    setFilters(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setStorageError("");
    } catch {
      setStorageError(
        "Ton navigateur ne permet pas de conserver les brouillons et préférences après fermeture.",
      );
    }
  }
  return (
    <Context.Provider
      value={{
        filters,
        set,
        ready,
        storageError,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function ComfortProvider({ children }: { children: ReactNode }) {
  const { user, configured } = useAuth();
  const owner = configured ? user?.id || "signed-out" : "local";
  return (
    <ScopedFilters key={owner} owner={owner}>
      {children}
    </ScopedFilters>
  );
}
export function useComfort() {
  const context = useContext(Context);
  if (!context) throw Error("ComfortProvider missing");
  return context;
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

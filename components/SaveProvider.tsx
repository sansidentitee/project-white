"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
type Undo = { label: string; action: () => Promise<void>; owner: string };
type SaveContext = {
  pending: number;
  lastSaved: string;
  error: string;
  undo: Undo | null;
  run: <T>(
    label: string,
    action: () => Promise<T>,
    inverse?: (result: T) => Promise<void>,
  ) => Promise<T>;
  revert: () => Promise<void>;
};
const Ctx = createContext<SaveContext | null>(null);
export function SaveProvider({ children }: { children: React.ReactNode }) {
  const { user, configured } = useAuth(),
    owner = configured ? user?.id || "signed-out" : "local";
  const current = useRef(owner);
  current.current = owner;
  const sequence = useRef(0),
    active = useRef(0);
  const [pending, setPending] = useState(0),
    [lastSaved, setLastSaved] = useState(""),
    [error, setError] = useState(""),
    [undo, setUndo] = useState<Undo | null>(null);
  useEffect(() => {
    sequence.current++;
    setUndo(null);
    setError("");
    setLastSaved("");
  }, [owner]);
  useEffect(() => {
    if (!undo) return;
    const timer = window.setTimeout(() => setUndo(null), 5 * 60 * 1000);
    return () => window.clearTimeout(timer);
  }, [undo]);
  async function run<T>(
    label: string,
    action: () => Promise<T>,
    inverse?: (result: T) => Promise<void>,
  ) {
    const who = owner,
      turn = ++sequence.current;
    active.current++;
    setPending(active.current);
    setError("");
    setUndo(null);
    try {
      const result = await action();
      if (current.current === who) {
        setLastSaved(new Date().toISOString());
        if (turn === sequence.current && inverse)
          setUndo({ label, owner: who, action: () => inverse(result) });
      }
      return result;
    } catch (e) {
      if (current.current === who)
        setError(e instanceof Error ? e.message : "Enregistrement impossible.");
      throw e;
    } finally {
      active.current--;
      setPending(active.current);
    }
  }
  async function revert() {
    const item = undo;
    if (!item || active.current || item.owner !== current.current) return;
    await run("Annulation", item.action);
  }
  return (
    <Ctx.Provider value={{ pending, lastSaved, error, undo, run, revert }}>
      {children}
    </Ctx.Provider>
  );
}
export function useSave() {
  const c = useContext(Ctx);
  if (!c) throw Error("SaveProvider missing");
  return c;
}
export function SaveStatus() {
  const save = useSave(),
    { configured } = useAuth();
  return (
    <div className="v4-save" role="status" aria-live="polite">
      <span>
        {save.pending
          ? "Enregistrement…"
          : save.error
            ? "Échec de sauvegarde"
            : save.lastSaved
              ? `Enregistré ${configured ? "sur ton compte" : "sur cet appareil"} à ${new Date(save.lastSaved).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
              : "Prêt à enregistrer"}
      </span>
      {save.undo && (
        <button
          className="neo-pill"
          disabled={!!save.pending}
          onClick={() => void save.revert().catch(() => {})}
        >
          Annuler : {save.undo.label}
        </button>
      )}
      {save.error && <small>{save.error}</small>}
    </div>
  );
}

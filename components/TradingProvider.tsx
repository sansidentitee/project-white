"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { pnl } from "@/lib/finance";
export type TradeDirection = "long" | "short";
export type TradeStatus = "open" | "closed";
export type Trade = {
  id: string;
  asset: string;
  direction: TradeDirection;
  entry: number;
  exit?: number | null;
  quantity: number;
  status: TradeStatus;
  setup?: string | null;
  note?: string | null;
  openedAt: string;
  closedAt?: string | null;
};
type NewTrade = Omit<Trade, "id" | "openedAt" | "closedAt" | "status"> & {
  openedAt?: string;
};
type TradingContextValue = {
  trades: Trade[];
  loading: boolean;
  error: string;
  demoMode: boolean;
  addTrade: (trade: NewTrade) => Promise<void>;
  closeTrade: (id: string, exit: number) => Promise<void>;
  updateTrade: (
    id: string,
    patch: { note: string; setup: string },
  ) => Promise<void>;
  removeTrade: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};
const Ctx = createContext<TradingContextValue | null>(null),
  LOCAL_KEY = "project-white-trading-v1";
function fromDb(x: any): Trade {
  return {
    id: x.id,
    asset: x.asset,
    direction: x.direction,
    entry: Number(x.entry),
    exit: x.exit == null ? null : Number(x.exit),
    quantity: Number(x.quantity),
    status: x.status,
    setup: x.setup,
    note: x.note,
    openedAt: x.opened_at,
    closedAt: x.closed_at,
  };
}
export const tradePnl = pnl;
export function TradingProvider({ children }: { children: React.ReactNode }) {
  const { user, configured, loading: authLoading } = useAuth();
  const demoMode = !configured;
  const [trades, setTrades] = useState<Trade[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const records = useRef<Trade[]>([]),
    scope = useRef(""),
    ticket = useRef(0);
  const owner = configured ? user?.id || "signed-out" : "local";
  scope.current = owner;
  function replace(next: Trade[]) {
    records.current = next;
    setTrades(next);
  }
  const refresh = useCallback(async () => {
    if (authLoading) return;
    const current = owner,
      turn = ++ticket.current;
    setLoading(true);
    setError("");
    try {
      let next: Trade[] = [];
      if (!configured) {
        const raw = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
        if (!Array.isArray(raw)) throw new Error();
        next = raw;
      } else if (supabase && user) {
        let offset = 0;
        while (true) {
          const { data, error: dbError } = await supabase
            .from("trades")
            .select("*")
            .eq("user_id", user.id)
            .order("opened_at", { ascending: false })
            .order("id")
            .range(offset, offset + 999);
          if (dbError) throw dbError;
          next.push(...(data || []).map(fromDb));
          if (!data || data.length < 1000) break;
          offset += 1000;
        }
      }
      if (scope.current === current && ticket.current === turn) replace(next);
    } catch {
      if (scope.current === current && ticket.current === turn) {
        replace([]);
        setError("Chargement du journal impossible. Réessaie.");
      }
    } finally {
      if (scope.current === current && ticket.current === turn)
        setLoading(false);
    }
  }, [authLoading, configured, owner, user]);
  useEffect(() => {
    replace([]);
    void refresh();
    return () => {
      ticket.current++;
    };
  }, [refresh]);
  function ready() {
    if (loading || error) throw new Error("Attends le chargement ou réessaie.");
    if (configured && (!supabase || !user))
      throw new Error("Reconnecte-toi pour enregistrer.");
  }
  function commit(next: Trade[]) {
    if (demoMode) {
      try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
      } catch {
        throw new Error("Stockage local indisponible.");
      }
    }
    replace(next);
  }
  async function addTrade(input: NewTrade) {
    ready();
    if (
      !input.asset.trim() ||
      !Number.isFinite(input.entry) ||
      input.entry <= 0 ||
      !Number.isFinite(input.quantity) ||
      input.quantity <= 0 ||
      !["long", "short"].includes(input.direction)
    )
      throw new Error("Renseigne un actif, un prix et une quantité positifs.");
    const current = owner;
    let trade: Trade = {
      ...input,
      id: crypto.randomUUID(),
      asset: input.asset.trim().toUpperCase(),
      status: "open",
      openedAt: input.openedAt || new Date().toISOString(),
      closedAt: null,
      exit: null,
    };
    if (!demoMode && supabase && user) {
      const { data, error: dbError } = await supabase
        .from("trades")
        .insert({
          user_id: user.id,
          asset: trade.asset,
          direction: trade.direction,
          entry: trade.entry,
          quantity: trade.quantity,
          status: "open",
          setup: trade.setup,
          note: trade.note,
          opened_at: trade.openedAt,
        })
        .select("*")
        .single();
      if (dbError) throw new Error("Ajout impossible. Vérifie ta connexion.");
      trade = fromDb(data);
    }
    if (scope.current !== current) throw new Error("Le compte a changé.");
    commit([trade, ...records.current]);
  }
  async function closeTrade(id: string, exit: number) {
    ready();
    if (!Number.isFinite(exit) || exit <= 0)
      throw new Error("Renseigne un prix de sortie positif.");
    if (!records.current.some((t) => t.id === id && t.status === "open"))
      throw new Error("Cette position est déjà clôturée ou introuvable.");
    const current = owner,
      closedAt = new Date().toISOString();
    if (!demoMode && supabase && user) {
      const { error: dbError } = await supabase
        .from("trades")
        .update({ exit, status: "closed", closed_at: closedAt })
        .eq("id", id)
        .eq("user_id", user.id)
        .eq("status", "open")
        .select("id")
        .single();
      if (dbError) throw new Error("Clôture impossible. Réessaie.");
    }
    if (scope.current !== current) return;
    commit(
      records.current.map((t) =>
        t.id === id ? { ...t, exit, status: "closed", closedAt } : t,
      ),
    );
  }
  async function updateTrade(
    id: string,
    patch: { note: string; setup: string },
  ) {
    ready();
    const current = owner;
    if (!demoMode && supabase && user) {
      const { error: dbError } = await supabase
        .from("trades")
        .update(patch)
        .eq("id", id)
        .eq("user_id", user.id)
        .select("id")
        .single();
      if (dbError) throw new Error("Bilan non enregistré. Réessaie.");
    }
    if (scope.current !== current) return;
    commit(records.current.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }
  async function removeTrade(id: string) {
    ready();
    const current = owner;
    if (!demoMode && supabase && user) {
      const { error: dbError } = await supabase
        .from("trades")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)
        .select("id")
        .single();
      if (dbError) throw new Error("Suppression impossible. Réessaie.");
    }
    if (scope.current !== current) return;
    commit(records.current.filter((t) => t.id !== id));
  }
  return (
    <Ctx.Provider
      value={{
        trades,
        loading,
        error,
        demoMode,
        addTrade,
        closeTrade,
        updateTrade,
        removeTrade,
        refresh,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
export function useTrading() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useTrading must be used inside TradingProvider");
  return value;
}

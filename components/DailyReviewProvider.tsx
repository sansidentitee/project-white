"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthProvider";
import { useSave } from "./SaveProvider";
import { supabase } from "@/lib/supabase/client";
import { writeLocalIfChanged } from "@/lib/localStore";
import {
  validateDailyReview,
  type DailyReview,
  type ReviewAnswers,
} from "@/lib/dailyReview";
type Context = {
  reviews: DailyReview[];
  loading: boolean;
  error: string;
  refresh: (background?: boolean) => Promise<void>;
  save: (
    day: string,
    answers: ReviewAnswers,
    completed: boolean,
    expectedUpdatedAt: string | null,
  ) => Promise<DailyReview>;
};
const Ctx = createContext<Context | null>(null);
const localKey = "project-white-daily-reviews-v1";
export function DailyReviewProvider({ children }: { children: ReactNode }) {
  const { user, configured, loading: authLoading } = useAuth();
  const tracker = useSave();
  const owner = configured ? user?.id || "signed-out" : "local";
  const account = useRef(owner);
  account.current = owner;
  const ticket = useRef(0),
    records = useRef<DailyReview[]>([]);
  const [reviews, setReviews] = useState<DailyReview[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const refresh = useCallback(
    async (background = false) => {
      if (authLoading) return;
      const who = owner,
        turn = ++ticket.current;
      if (!background) setLoading(true);
      setError("");
      try {
        let next: DailyReview[] = [];
        if (!configured) {
          const saved = JSON.parse(localStorage.getItem(localKey) || "[]");
          if (!Array.isArray(saved))
            throw Error("La sauvegarde des bilans est invalide.");
          next = saved;
        } else if (user && supabase) {
          for (let offset = 0; ; offset += 1000) {
            const { data, error: failed } = await supabase
              .from("daily_reviews")
              .select("day,answers,completed,updated_at")
              .eq("user_id", user.id)
              .order("day", { ascending: false })
              .range(offset, offset + 999);
            if (failed) throw failed;
            next.push(
              ...(data || []).map((row) => ({
                day: row.day,
                answers: row.answers,
                completed: row.completed,
                updatedAt: row.updated_at,
              })),
            );
            if ((data || []).length < 1000) break;
          }
        }
        if (account.current === who && ticket.current === turn) {
          records.current = next;
          setReviews(next);
        }
      } catch (e) {
        if (account.current === who && ticket.current === turn)
          setError(
            e instanceof Error
              ? e.message
              : "Les bilans ne peuvent pas être chargés. Réessaie.",
          );
      } finally {
        if (account.current === who && ticket.current === turn)
          setLoading(false);
      }
    },
    [owner, authLoading, configured, user],
  );
  useEffect(() => {
    records.current = [];
    setReviews([]);
    void refresh();
  }, [refresh]);
  async function save(
    day: string,
    answers: ReviewAnswers,
    completed: boolean,
    expectedUpdatedAt: string | null,
  ) {
    validateDailyReview(day, answers, completed);
    if (loading || error)
      throw Error(
        "Recharge les bilans avant d’enregistrer, pour préserver la version existante.",
      );
    return tracker.run(
      completed ? "Bilan du soir" : "Brouillon du bilan",
      async () => {
        const who = owner;
        let saved: DailyReview = {
          day,
          answers,
          completed,
          updatedAt: new Date().toISOString(),
        };
        if (configured) {
          if (!user || !supabase)
            throw Error("Reconnecte-toi pour enregistrer ton bilan.");
          const row = {
            user_id: user.id,
            day,
            answers,
            completed,
            updated_at: saved.updatedAt,
          };
          const result = expectedUpdatedAt
            ? await supabase
                .from("daily_reviews")
                .update(row)
                .eq("user_id", user.id)
                .eq("day", day)
                .eq("updated_at", expectedUpdatedAt)
                .select("day,answers,completed,updated_at")
                .maybeSingle()
            : await supabase
                .from("daily_reviews")
                .insert(row)
                .select("day,answers,completed,updated_at")
                .single();
          const { data, error: failed } = result;
          if (failed?.code === "23505" || (!failed && !data))
            throw Error(
              "Ce bilan a changé sur un autre appareil. Tes réponses restent dans le brouillon. Recharge les bilans pour comparer les versions.",
            );
          if (failed) throw failed;
          if (!data) throw Error("Le bilan n’a pas été enregistré.");
          saved = {
            day: data.day,
            answers: data.answers,
            completed: data.completed,
            updatedAt: data.updated_at,
          };
        }
        if (account.current !== who) return saved;
        ticket.current++;
        let next = [
          saved,
          ...records.current.filter((r) => r.day !== day),
        ].sort((a, b) => b.day.localeCompare(a.day));
        if (!configured) {
          const previous = JSON.parse(
            localStorage.getItem(localKey) || "[]",
          ) as DailyReview[];
          if (
            (previous.find((r) => r.day === day)?.updatedAt || null) !==
            expectedUpdatedAt
          )
            throw Error(
              "Ce bilan a changé dans un autre onglet. Tes réponses restent dans le brouillon. Recharge les bilans pour comparer les versions.",
            );
          next = [saved, ...previous.filter((r) => r.day !== day)].sort(
            (a, b) => b.day.localeCompare(a.day),
          );
          writeLocalIfChanged(localStorage, localKey, next);
        }
        records.current = next;
        setReviews(next);
        return saved;
      },
    );
  }
  return (
    <Ctx.Provider value={{ reviews, loading, error, refresh, save }}>
      {children}
    </Ctx.Provider>
  );
}
export function useDailyReviews() {
  const context = useContext(Ctx);
  if (!context) throw Error("DailyReviewProvider missing");
  return context;
}

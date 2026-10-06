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
import { useSave } from "./SaveProvider";
import { supabase } from "@/lib/supabase/client";
import { LifeEntry, LifeInput, LifeUniverse, validateLife } from "@/lib/life";

const LOCAL_KEY = "project-white-life-v1";
type Context = {
  entries: LifeEntry[];
  loading: boolean;
  error: string;
  local: boolean;
  save: (input: LifeInput) => Promise<LifeEntry>;
  archive: (id: string, archived?: boolean) => Promise<void>;
  refresh: (background?: boolean) => Promise<void>;
  upload: (
    universe: LifeUniverse,
    file: File,
  ) => Promise<{ path?: string; fileData?: string; fileName: string }>;
  openFile: (entry: LifeEntry) => Promise<void>;
};
const Ctx = createContext<Context | null>(null);
function fromDb(row: any): LifeEntry {
  return {
    id: row.id,
    universe: row.universe,
    kind: row.kind,
    title: row.title,
    day: row.day,
    value: row.value == null ? null : Number(row.value),
    data: row.data || {},
    key: row.record_key,
    archived: row.archived,
    createdAt: row.created_at,
  };
}
export function LifeProvider({ children }: { children: React.ReactNode }) {
  const saving = useSave();
  const { user, configured, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<LifeEntry[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const records = useRef<LifeEntry[]>([]);
  const scope = useRef("");
  const ticket = useRef(0);
  const owner = configured ? user?.id || "signed-out" : "local";
  scope.current = owner;
  function replace(next: LifeEntry[]) {
    records.current = next;
    setEntries(next);
  }
  const refresh = useCallback(
    async (background = false) => {
      if (authLoading) return;
      const current = owner;
      const turn = ++ticket.current;
      if (!background) setLoading(true);
      setError("");
      try {
        let next: LifeEntry[] = [];
        if (!configured) {
          const raw = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
          if (!Array.isArray(raw))
            throw new Error("Sauvegarde locale invalide.");
          next = raw;
        } else if (user && supabase) {
          let offset = 0;
          while (true) {
            const { data, error: dbError } = await supabase
              .from("life_entries")
              .select("*")
              .eq("user_id", user.id)
              .order("created_at")
              .order("id")
              .range(offset, offset + 999);
            if (dbError) throw dbError;
            next.push(...(data || []).map(fromDb));
            if (!data || data.length < 1000) break;
            offset += 1000;
          }
        }
        if (scope.current === current && ticket.current === turn) replace(next);
      } catch (e) {
        if (scope.current === current && ticket.current === turn) {
          replace([]);
          setError(
            "Chargement impossible. Réessaie avant de modifier tes données.",
          );
        }
      } finally {
        if (scope.current === current && ticket.current === turn)
          setLoading(false);
      }
    },
    [authLoading, configured, owner, user],
  );
  useEffect(() => {
    replace([]);
    void refresh();
    return () => {
      ticket.current++;
    };
  }, [refresh]);
  useEffect(() => {
    if (configured) return;
    const sync = (event: StorageEvent) => {
      if (event.key === LOCAL_KEY) void refresh();
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [configured, refresh]);
  function assertWritable() {
    if (loading || error) throw new Error("Attends le chargement ou réessaie.");
    if (configured && (!user || !supabase))
      throw new Error("Reconnecte-toi pour enregistrer.");
  }
  async function undoEntry(before: LifeEntry | undefined, after: LifeEntry) {
    if (scope.current !== owner) throw new Error("Le compte a changé.");
    const latest = records.current.find((e) => e.id === after.id);
    if (JSON.stringify(latest) !== JSON.stringify(after))
      throw new Error(
        "Cette entrée a changé depuis. Recharge avant de la modifier.",
      );
    if (configured && supabase && user) {
      const { data, error } = await supabase
        .from("life_entries")
        .select("*")
        .eq("id", after.id)
        .eq("user_id", user.id)
        .single();
      if (error || JSON.stringify(fromDb(data)) !== JSON.stringify(after))
        throw new Error(
          "Cette entrée a changé sur ton compte. Actualise les données.",
        );
    }
    if (before) {
      await save(before);
      if (before.archived) await archive(before.id, true);
    } else await archive(after.id, true);
  }
  const trackedSave = (input: LifeInput) => {
    const before = records.current.find((e) =>
      input.id
        ? e.id === input.id
        : !!input.key &&
          e.key === input.key &&
          e.kind === input.kind &&
          e.universe === input.universe,
    );
    return saving.run(
      input.title,
      () => save(input),
      (after) => undoEntry(before, after),
    );
  };
  const trackedArchive = (id: string, archived = true) => {
    const before = records.current.find((e) => e.id === id);
    return saving.run(
      archived ? "Retrait" : "Restauration",
      () => archive(id, archived),
      async () => {
        if (scope.current !== owner) throw Error("Le compte a changé.");
        await archive(id, before?.archived || false);
      },
    );
  };
  function persist(next: LifeEntry[]) {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
    } catch {
      throw new Error(
        "Stockage local plein ou indisponible. Exporte une copie avant de libérer de l’espace.",
      );
    }
    replace(next);
  }
  async function save(input: LifeInput) {
    assertWritable();
    validateLife(input);
    const current = owner;
    const existing = input.id
      ? records.current.find((e) => e.id === input.id)
      : input.key
        ? records.current.find(
            (e) =>
              e.universe === input.universe &&
              e.kind === input.kind &&
              e.key === input.key,
          )
        : undefined;
    if (input.id && !existing)
      throw new Error("Entrée introuvable. Recharge la page.");
    const entry: LifeEntry = {
      ...input,
      id: existing?.id || crypto.randomUUID(),
      title: input.title.trim(),
      value: input.value ?? null,
      data: input.data || {},
      key: input.key ?? existing?.key ?? null,
      archived: false,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    let result = entry;
    if (configured && supabase && user) {
      const row = {
        id: entry.id,
        user_id: user.id,
        universe: entry.universe,
        kind: entry.kind,
        title: entry.title,
        day: entry.day,
        value: entry.value,
        data: entry.data,
        record_key: entry.key,
        archived: false,
      };
      const request = existing
        ? supabase
            .from("life_entries")
            .update(row)
            .eq("id", entry.id)
            .eq("user_id", user.id)
        : entry.key
          ? supabase
              .from("life_entries")
              .upsert(row, { onConflict: "user_id,universe,kind,record_key" })
          : supabase.from("life_entries").insert(row);
      const { data, error: dbError } = await request.select("*").single();
      if (dbError)
        throw new Error(
          "Enregistrement impossible. Vérifie ta connexion et réessaie.",
        );
      result = fromDb(data);
    }
    if (scope.current !== current)
      throw new Error("Le compte a changé. Recharge tes données.");
    const next = [
      ...records.current.filter(
        (e) =>
          e.id !== result.id &&
          !(
            result.key &&
            e.universe === result.universe &&
            e.kind === result.kind &&
            e.key === result.key
          ),
      ),
      result,
    ];
    if (!configured) persist(next);
    else replace(next);
    return result;
  }
  async function archive(id: string, archived = true) {
    assertWritable();
    const current = owner;
    if (configured && supabase && user) {
      const { error: dbError } = await supabase
        .from("life_entries")
        .update({ archived })
        .eq("id", id)
        .eq("user_id", user.id)
        .select("id")
        .single();
      if (dbError) throw new Error("Modification impossible. Réessaie.");
    }
    if (scope.current !== current) return;
    const next = records.current.map((e) =>
      e.id === id ? { ...e, archived } : e,
    );
    if (!configured) persist(next);
    else replace(next);
  }
  async function upload(universe: LifeUniverse, file: File) {
    assertWritable();
    const current = owner;
    if (file.size > 2 * 1024 * 1024)
      throw new Error("Choisis un fichier de 2 Mo maximum.");
    if (!file.size) throw new Error("Ce fichier est vide.");
    if (configured && supabase && user) {
      const path = `${user.id}/${universe}/${crypto.randomUUID()}/${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: uploadError } = await supabase.storage
        .from("life-resources")
        .upload(path, file, { upsert: false });
      if (uploadError) throw new Error("Import impossible. Réessaie.");
      if (scope.current !== current) throw new Error("Le compte a changé.");
      return { path, fileName: file.name };
    }
    const fileData = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () =>
        reject(new Error("Lecture du fichier impossible."));
      reader.readAsDataURL(file);
    });
    return { fileData, fileName: file.name };
  }
  async function openFile(entry: LifeEntry) {
    const current = owner;
    let href = String(entry.data.fileData || "");
    if (entry.data.path && supabase && user) {
      const { data, error: dbError } = await supabase.storage
        .from("life-resources")
        .createSignedUrl(String(entry.data.path), 60, { download: true });
      if (dbError) throw new Error("Fichier indisponible.");
      href = data.signedUrl;
    }
    if (!href) throw new Error("Fichier indisponible.");
    if (scope.current !== current) throw new Error("Le compte a changé.");
    const a = document.createElement("a");
    a.href = href;
    a.download = String(entry.data.fileName || entry.title);
    a.rel = "noopener";
    a.click();
  }
  return (
    <Ctx.Provider
      value={{
        entries,
        loading,
        error,
        local: !configured,
        save: trackedSave,
        archive: trackedArchive,
        refresh,
        upload,
        openFile,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
export function useLife() {
  const value = useContext(Ctx);
  if (!value) throw new Error("LifeProvider missing");
  return value;
}

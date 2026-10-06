"use client";
import Link from "next/link";
import { FormEvent, ReactNode, useRef, useState, useEffect } from "react";
import { useLife } from "./LifeProvider";
import { PageFrame } from "./PageFrame";
import { V3Dialog } from "./V3Dialog";
import { useComfortFilter } from "./ComfortProvider";
import {
  LifeData,
  LifeEntry,
  LifeKind,
  LifeUniverse,
  localDay,
  safeUrl,
  text,
} from "@/lib/life";
import {
  universeDescriptions,
  universeHref,
  universeSections,
} from "@/lib/universes";

export function useLifeAction() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const lock = useRef(false);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  async function run(action: () => Promise<unknown>, success = "Enregistré.") {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(success);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action impossible. Réessaie.");
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return { busy, error, notice, run };
}
export function ActionFeedback({
  action,
}: {
  action: ReturnType<typeof useLifeAction>;
}) {
  return (
    <>
      {action.error && (
        <p className="life-error" role="alert">
          {action.error}
        </p>
      )}
      {action.notice && (
        <p className="life-notice" role="status">
          {action.notice}
        </p>
      )}
    </>
  );
}
export function LifePanel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={"neo-panel life-panel " + className}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
export function LifeMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className="neo-panel life-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}
export function LifeEmpty({ children }: { children: ReactNode }) {
  return <p className="life-empty">{children}</p>;
}
export function formatDay(day: string) {
  return new Date(day + "T12:00:00").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}
export function LifeLayout({
  universe,
  section = "",
  children,
}: {
  universe: LifeUniverse;
  section?: string;
  children: ReactNode;
}) {
  const life = useLife();
  const meta = universeDescriptions[universe];
  const selected = universeSections[universe].find((s) => s.slug === section);
  const [trash, setTrash] = useState(false);
  const action = useLifeAction();
  const archived = life.entries.filter(
    (e) => e.universe === universe && e.archived,
  );
  return (
    <PageFrame>
      <div className="life-page">
        <div className="life-heading">
          <div>
            <p className="life-eyebrow">
              {meta.name.toUpperCase()} · MON ESPACE
            </p>
            <h1>{section ? selected?.label : meta.name}</h1>
            <p>{meta.intro}</p>
          </div>
          <span className="life-mode">
            {life.local ? "Sur cet appareil" : "Compte personnel"}
          </span>
        </div>
        <details className="comfort-section-tools">
          <summary>Explorer cet espace</summary>
          <nav className="life-tabs" aria-label={"Sections " + meta.name}>
            {universeSections[universe].map((s) => (
              <Link
                key={s.slug}
                href={universeHref(universe, s.slug)}
                aria-current={section === s.slug ? "page" : undefined}
              >
                {s.label}
              </Link>
            ))}
          </nav>
        </details>
        {life.loading ? (
          <LifeEmpty>Chargement de ton espace…</LifeEmpty>
        ) : life.error ? (
          <LifePanel title="Données indisponibles">
            <p role="alert">{life.error}</p>
            <button className="neo-pill" onClick={() => void life.refresh()}>
              Réessayer
            </button>
          </LifePanel>
        ) : (
          children
        )}
        <footer className="life-footer">
          <button onClick={() => setTrash(true)}>
            Corbeille{archived.length ? ` (${archived.length})` : ""}
          </button>
          <button
            onClick={() => {
              const blob = new Blob(
                [
                  JSON.stringify(
                    {
                      version: 1,
                      universe,
                      exportedAt: new Date().toISOString(),
                      entries: life.entries.filter(
                        (e) => e.universe === universe,
                      ),
                    },
                    null,
                    2,
                  ),
                ],
                { type: "application/json" },
              );
              const href = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = href;
              a.download = `project-white-${universe}-${localDay()}.json`;
              a.click();
              URL.revokeObjectURL(href);
            }}
            disabled={life.loading || !!life.error}
          >
            Exporter une copie
          </button>
        </footer>
        <V3Dialog
          open={trash}
          onClose={() => setTrash(false)}
          title={"Corbeille · " + meta.name}
        >
          <p>
            Les éléments retirés peuvent être restaurés ici. Les fichiers
            restent associés à leurs ressources.
          </p>
          {archived.map((e) => (
            <div className="life-row" key={e.id}>
              <span>
                {e.title}
                <small>{formatDay(e.day)}</small>
              </span>
              <button
                className="neo-pill"
                disabled={action.busy}
                onClick={() =>
                  void action.run(() => life.archive(e.id, false), "Restauré.")
                }
              >
                Restaurer
              </button>
            </div>
          ))}
          {!archived.length && <LifeEmpty>La corbeille est vide.</LifeEmpty>}
          <ActionFeedback action={action} />
        </V3Dialog>
      </div>
    </PageFrame>
  );
}
export type EntryField = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "textarea" | "select";
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  defaultValue?: string;
};
export function EntryManager({
  universe,
  kind,
  title,
  fields = [],
  valueLabel,
  entries: provided,
  render,
  dayLabel = "Date",
}: {
  universe: LifeUniverse;
  kind: LifeKind;
  title: string;
  fields?: EntryField[];
  valueLabel?: string;
  entries?: LifeEntry[];
  render?: (entry: LifeEntry) => ReactNode;
  dayLabel?: string;
}) {
  const life = useLife(),
    action = useLifeAction();
  const [editing, setEditing] = useState<LifeEntry | null>(null),
    [open, setOpen] = useState(false);
  const [query, setQuery] = useComfortFilter(
    `entries:${universe}:${kind}:${title}`,
  );
  const [lastAdded, setLastAdded] = useState("");
  const [draft, setDraft] = useComfortFilter(`draft:entry:${universe}:${kind}`);
  const formRef = useRef<HTMLFormElement>(null);
  const [limit, setLimit] = useState(10);
  useEffect(() => {
    if (!open || editing) return;
    try {
      const saved = JSON.parse(draft || "{}");
      Object.entries(saved).forEach(([name, value]) => {
        const field = formRef.current?.elements.namedItem(name);
        if (
          (field instanceof HTMLInputElement ||
            field instanceof HTMLTextAreaElement ||
            field instanceof HTMLSelectElement) &&
          typeof value === "string"
        )
          field.value = value;
      });
    } catch {
      /* Keep the empty form usable if a draft cannot be restored. */
    }
    // Restore once when opening; changing fields must never reset another field.
  }, [open, editing]);
  const addLabel: Record<string, string> = {
    quran: "Ajouter une session",
    memorization: "Ajouter un passage",
    learning: "Ajouter un cours",
    goal: "Ajouter un objectif",
    workout: "Ajouter une séance",
    habit: "Ajouter une habitude",
    reflection: "Ajouter une note",
    plan: "Planifier une session",
  };
  const entries =
    provided ||
    life.entries
      .filter((e) => e.universe === universe && e.kind === kind && !e.archived)
      .sort(
        (a, b) =>
          b.day.localeCompare(a.day) || b.createdAt.localeCompare(a.createdAt),
      );
  const visibleEntries = entries.filter((e) =>
    e.title.toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr")),
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const keepAdding =
      (event.nativeEvent as SubmitEvent).submitter?.getAttribute("name") ===
      "continue";
    const form = new FormData(event.currentTarget);
    const data: LifeData = { ...(editing?.data || {}) };
    fields.forEach((f) => {
      const value = String(form.get(f.key) || "");
      data[f.key] =
        f.type === "number"
          ? value === ""
            ? null
            : Number(value)
          : value.trim();
    });
    const value = valueLabel ? Number(form.get("value")) : editing?.value;
    if (
      await action.run(() =>
        life.save({
          id: editing?.id,
          universe,
          kind,
          title: String(form.get("title")),
          day: String(form.get("day")),
          value,
          data,
        }),
      )
    ) {
      setLastAdded(String(form.get("title")));
      if (!editing) setDraft("");
      if (!keepAdding) setOpen(false);
      else {
        formElement.reset();
        formElement
          .querySelector<HTMLInputElement>('input[name="title"]')
          ?.focus();
      }
      setEditing(null);
    }
  }
  return (
    <LifePanel title={title}>
      <div className="life-panel-actions">
        <button
          className="neo-pill primary"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          {addLabel[kind] || "Ajouter un élément"}
        </button>
        <small>
          {entries.length} élément{entries.length > 1 ? "s" : ""}
        </small>
      </div>
      {entries.length > 0 && (
        <label className="comfort-search">
          Rechercher dans cette liste
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(10);
            }}
            placeholder="Un titre…"
          />
        </label>
      )}
      {lastAdded && !open && (
        <p className="comfort-confirmation" role="status">
          {lastAdded} est enregistré.{" "}
          <button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            Ajouter encore
          </button>
        </p>
      )}
      <div className="life-list">
        {visibleEntries.slice(0, limit).map((entry) => (
          <article className="life-entry" key={entry.id}>
            <div>
              <h3>{entry.title}</h3>
              <small>{formatDay(entry.day)}</small>
              {render ? (
                render(entry)
              ) : (
                <>
                  <p>
                    {fields
                      .filter((f) => f.type !== "textarea")
                      .map((f) => {
                        const v = entry.data[f.key];
                        return v == null || v === "" ? null : (
                          <span className="life-tag" key={f.key}>
                            {f.label} :{" "}
                            {f.options?.find((o) => o.value === String(v))
                              ?.label ?? String(v)}
                          </span>
                        );
                      })}
                  </p>
                  {fields
                    .filter((f) => f.type === "textarea")
                    .map((f) =>
                      entry.data[f.key] ? (
                        <p className="life-prewrap" key={f.key}>
                          {String(entry.data[f.key])}
                        </p>
                      ) : null,
                    )}
                  {fields.some((f) => f.key === "progress") && (
                    <progress
                      aria-label={"Progression " + entry.title}
                      max={100}
                      value={Number(entry.data.progress || 0)}
                    />
                  )}
                  {valueLabel && (
                    <p>
                      {entry.value} · {valueLabel}
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="life-entry-actions">
              <button
                className="neo-pill"
                onClick={() => {
                  setEditing(entry);
                  setOpen(true);
                }}
              >
                Modifier
              </button>
              <button
                className="life-text-button"
                disabled={action.busy}
                onClick={() =>
                  void action.run(
                    () => life.archive(entry.id),
                    "Déplacé dans la corbeille.",
                  )
                }
              >
                Retirer
              </button>
            </div>
          </article>
        ))}
      </div>
      {visibleEntries.length > limit && (
        <button className="neo-pill" onClick={() => setLimit(limit + 10)}>
          Afficher les 10 suivants
        </button>
      )}
      {!!entries.length && !visibleEntries.length && (
        <p role="status">
          Aucun résultat.{" "}
          <button onClick={() => setQuery("")}>Effacer le filtre</button>
        </p>
      )}
      {!entries.length && (
        <LifeEmpty>
          Commence avec un premier élément. Il sera conservé après rechargement.
        </LifeEmpty>
      )}
      <ActionFeedback action={action} />
      <V3Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Modifier · " + title : "Ajouter · " + title}
      >
        <form
          className="life-form"
          ref={formRef}
          key={editing?.id || "new"}
          onSubmit={submit}
          onChange={(e) => {
            if (!editing)
              setDraft(
                JSON.stringify(
                  Object.fromEntries(
                    [...new FormData(e.currentTarget).entries()].filter(
                      ([, v]) => typeof v === "string",
                    ),
                  ),
                ),
              );
          }}
        >
          {!editing && draft && (
            <p className="calm-draft-note">
              Brouillon conservé sur cet appareil.
              <button
                type="button"
                onClick={() => {
                  formRef.current?.reset();
                  setDraft("");
                }}
              >
                Effacer
              </button>
            </p>
          )}
          <label>
            Titre
            <input
              autoFocus
              name="title"
              maxLength={300}
              required
              defaultValue={editing?.title || ""}
            />
          </label>
          <details className="comfort-details">
            <summary>Date et détails facultatifs</summary>
            <label>
              {dayLabel}
              <input
                name="day"
                type="date"
                required
                defaultValue={editing?.day || localDay()}
              />
            </label>
          </details>
          {valueLabel && (
            <label>
              {valueLabel}
              <input
                name="value"
                type="number"
                step="any"
                min={0}
                required
                defaultValue={editing?.value ?? 25}
              />
            </label>
          )}
          {[true, false].map((essential) => (
            <details
              key={String(essential)}
              open={essential ? true : undefined}
              className={essential ? "comfort-essential" : "comfort-details"}
            >
              <summary>
                {essential
                  ? "Informations nécessaires"
                  : "Ajouter des détails facultatifs"}
              </summary>
              {fields
                .filter((f) => !!f.required === essential)
                .map((field) => (
                  <label key={field.key}>
                    {field.label}
                    {field.type === "textarea" ? (
                      <textarea
                        name={field.key}
                        rows={4}
                        maxLength={10000}
                        defaultValue={String(
                          editing?.data[field.key] ?? field.defaultValue ?? "",
                        )}
                      />
                    ) : field.type === "select" ? (
                      <select
                        name={field.key}
                        defaultValue={String(
                          editing?.data[field.key] ??
                            field.defaultValue ??
                            field.options?.[0]?.value ??
                            "",
                        )}
                      >
                        {field.options?.map((o) => (
                          <option value={o.value} key={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        name={field.key}
                        type={field.type || "text"}
                        min={field.min}
                        max={field.max}
                        step={field.step ?? "any"}
                        required={field.required}
                        maxLength={
                          field.type === "text" || !field.type
                            ? 1000
                            : undefined
                        }
                        defaultValue={String(
                          editing?.data[field.key] ?? field.defaultValue ?? "",
                        )}
                      />
                    )}
                  </label>
                ))}
            </details>
          ))}
          <div className="comfort-form-actions">
            <button className="neo-pill primary" disabled={action.busy}>
              {action.busy ? "Enregistrement…" : "Enregistrer"}
            </button>
            {!editing && (
              <button
                name="continue"
                className="neo-pill"
                disabled={action.busy}
              >
                Enregistrer et ajouter
              </button>
            )}
          </div>
          <ActionFeedback action={action} />
        </form>
      </V3Dialog>
    </LifePanel>
  );
}
export function LifeGoals({ universe }: { universe: LifeUniverse }) {
  return (
    <EntryManager
      universe={universe}
      kind="goal"
      title="Mes objectifs"
      fields={[
        {
          key: "target",
          label: "Cible",
          type: "number",
          min: 0.01,
          required: true,
        },
        {
          key: "current",
          label: "Progression actuelle",
          type: "number",
          min: 0,
          defaultValue: "0",
        },
        { key: "unit", label: "Unité", defaultValue: "sessions" },
        { key: "deadline", label: "Échéance", type: "date" },
        {
          key: "status",
          label: "État",
          type: "select",
          options: [
            { value: "active", label: "En cours" },
            { value: "done", label: "Terminé" },
            { value: "paused", label: "En pause" },
          ],
        },
        { key: "notes", label: "Notes", type: "textarea" },
      ]}
      render={(e) => {
        const progress = Math.min(
          100,
          Math.max(
            0,
            (Number(e.data.current || 0) / Number(e.data.target || 1)) * 100,
          ),
        );
        return (
          <>
            <p>
              {e.data.current || 0} / {e.data.target} {e.data.unit} ·{" "}
              {e.data.status === "done"
                ? "Terminé"
                : e.data.status === "paused"
                  ? "En pause"
                  : "En cours"}
            </p>
            <progress
              aria-label={"Progression " + e.title}
              max={100}
              value={progress}
            />
            {e.data.deadline && (
              <small>Échéance : {formatDay(String(e.data.deadline))}</small>
            )}
            {e.data.notes && (
              <p className="life-prewrap">{String(e.data.notes)}</p>
            )}
          </>
        );
      }}
    />
  );
}
export function LifeResources({ universe }: { universe: LifeUniverse }) {
  const life = useLife(),
    action = useLifeAction();
  const [editing, setEditing] = useState<LifeEntry | null>(null),
    [open, setOpen] = useState(false),
    [mode, setMode] = useState("link");
  const resources = life.entries.filter(
    (e) => e.universe === universe && e.kind === "resource" && !e.archived,
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    let data: LifeData = {
      ...(editing?.data || {}),
      notes: String(form.get("notes") || ""),
    };
    const result = await action.run(async () => {
      if (!editing) {
        if (mode === "file") {
          const file = form.get("file");
          if (!(file instanceof File) || !file.size)
            throw new Error("Choisis un fichier.");
          data = {
            ...data,
            ...(await life.upload(universe, file)),
            type: "file",
          };
        } else {
          data.url = safeUrl(String(form.get("url")));
          data.type = "link";
        }
      } else if (data.type === "link")
        data.url = safeUrl(String(form.get("url")));
      await life.save({
        id: editing?.id,
        universe,
        kind: "resource",
        title: String(form.get("title")),
        day: editing?.day || localDay(),
        data,
      });
    });
    if (result) setOpen(false);
  }
  return (
    <LifePanel title="Mes ressources">
      <button
        className="neo-pill primary"
        onClick={() => {
          setEditing(null);
          setMode("link");
          setOpen(true);
        }}
      >
        Ajouter une ressource
      </button>
      <div className="life-list">
        {resources.map((e) => (
          <article className="life-entry" key={e.id}>
            <div>
              <h3>{e.title}</h3>
              <small>
                {e.data.type === "file"
                  ? String(e.data.fileName)
                  : "Lien enregistré"}
              </small>
              <p className="life-prewrap">{text(e, "notes")}</p>
              {e.data.type === "file" ? (
                <button
                  className="neo-pill"
                  disabled={action.busy}
                  onClick={() =>
                    void action.run(() => life.openFile(e), "Fichier ouvert.")
                  }
                >
                  Télécharger
                </button>
              ) : (
                <a
                  className="neo-pill"
                  href={text(e, "url")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ouvrir
                </a>
              )}
            </div>
            <div className="life-entry-actions">
              <button
                className="neo-pill"
                onClick={() => {
                  setEditing(e);
                  setMode(String(e.data.type));
                  setOpen(true);
                }}
              >
                Renommer / modifier
              </button>
              <button
                className="life-text-button"
                disabled={action.busy}
                onClick={() =>
                  void action.run(
                    () => life.archive(e.id),
                    "Ressource déplacée dans la corbeille.",
                  )
                }
              >
                Retirer
              </button>
            </div>
          </article>
        ))}
      </div>
      {!resources.length && (
        <LifeEmpty>
          Enregistre un lien, un cours ou un document pour le retrouver ici.
        </LifeEmpty>
      )}
      <ActionFeedback action={action} />
      <V3Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Modifier la ressource" : "Ajouter une ressource"}
      >
        <form
          className="life-form"
          key={editing?.id || "new"}
          onSubmit={submit}
        >
          <label>
            Nom
            <input
              autoFocus
              name="title"
              required
              maxLength={300}
              defaultValue={editing?.title}
            />
          </label>
          {!editing && (
            <label>
              Type
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="link">Lien</option>
                <option value="file">Fichier</option>
              </select>
            </label>
          )}
          {mode === "link" ? (
            <label>
              Adresse
              <input
                name="url"
                type="url"
                required
                defaultValue={editing ? text(editing, "url") : ""}
                placeholder="https://…"
              />
            </label>
          ) : !editing ? (
            <label>
              Fichier · 2 Mo maximum
              <input name="file" type="file" required />
              <small>
                {life.local
                  ? "Conservé sur cet appareil."
                  : "Conservé dans ton espace privé."}
              </small>
            </label>
          ) : (
            <p>{text(editing, "fileName")}</p>
          )}
          <label>
            Notes
            <textarea
              name="notes"
              rows={3}
              maxLength={10000}
              defaultValue={editing ? text(editing, "notes") : ""}
            />
          </label>
          <button className="neo-pill primary" disabled={action.busy}>
            {action.busy ? "Enregistrement…" : "Enregistrer"}
          </button>
          <ActionFeedback action={action} />
        </form>
      </V3Dialog>
    </LifePanel>
  );
}

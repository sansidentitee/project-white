"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  CalendarDays,
  Dumbbell,
  NotebookPen,
  ChartNoAxesColumnIncreasing,
  ChevronRight,
  CircleUserRound,
  Clock3,
  FolderOpen,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  ListChecks,
  Moon,
  Plus,
  Search,
  Sparkles,
  Sun,
  Target,
  TriangleAlert,
} from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useProject } from "./ProjectProvider";
import { QuickAddModal } from "./QuickAddModal";
import { useTheme } from "./ThemeProvider";
import { V3Dialog } from "./V3Dialog";
import { Guide } from "./Guide";
import { Inbox } from "./AcademicV3";
import { SaveStatus } from "./SaveProvider";
import { SyncStatus } from "./GlobalWorkspace";
import { isTyping } from "@/lib/shortcuts";
import {
  universeDescriptions,
  universeHref,
  universeSections,
} from "@/lib/universes";

type Universe = "academic" | "islam" | "finance" | "health";

const universes = [
  {
    id: "academic" as const,
    label: "Académie",
    href: "/academic/dashboard",
    icon: GraduationCap,
  },
  { id: "islam" as const, label: "Islam", href: "/islam", icon: Landmark },
  {
    id: "finance" as const,
    label: "Finance",
    href: "/finance",
    icon: ChartNoAxesColumnIncreasing,
  },
  { id: "health" as const, label: "Santé", href: "/health", icon: HeartPulse },
];

const academicNav = [
  { href: "/academic/dashboard", label: "Vue d’ensemble", icon: House },
  {
    href: "/academic/grades",
    label: "Suivi des notes",
    icon: ChartNoAxesColumnIncreasing,
  },
  { href: "/academic/tasks", label: "Tâches · Eisenhower", icon: ListChecks },
  {
    href: "/academic/calendar",
    label: "Calendrier · Agenda",
    icon: CalendarDays,
  },
  { href: "/academic/subjects", label: "Matières", icon: BookOpen },
  { href: "/academic/errors", label: "Banque d’erreurs", icon: TriangleAlert },
  { href: "/academic/revisions", label: "Révisions · Focus", icon: Clock3 },
  { href: "/academic/resources", label: "Ressources", icon: FolderOpen },
  { href: "/academic/inbox", label: "Inbox rapide", icon: ListChecks },
  { href: "/academic/goals", label: "Objectifs", icon: Target },
];

function universeFromPath(path: string): Universe {
  if (path.startsWith("/islam")) return "islam";
  if (path.startsWith("/finance") || path.startsWith("/trading"))
    return "finance";
  if (path.startsWith("/health")) return "health";
  return "academic";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const universe = universeFromPath(path);
  const universeMeta = universes.find((x) => x.id === universe)!;
  const currentNav =
    universe === "academic"
      ? academicNav
      : universeSections[universe].map((s) => ({
          href: universeHref(universe, s.slug),
          label: s.label,
          icon:
            s.slug === ""
              ? House
              : s.slug === "goals"
                ? Target
                : s.slug === "resources"
                  ? FolderOpen
                  : s.slug === "planning"
                    ? CalendarDays
                    : s.slug === "prayers"
                      ? Landmark
                      : s.slug === "daily"
                        ? HeartPulse
                        : s.slug === "activity"
                          ? Dumbbell
                          : s.slug === "habits"
                            ? ListChecks
                            : s.slug === "learning"
                              ? GraduationCap
                              : s.slug === "analyses"
                                ? ChartNoAxesColumnIncreasing
                                : s.slug === "trading"
                                  ? ChartNoAxesColumnIncreasing
                                  : s.slug === "journal"
                                    ? NotebookPen
                                    : BookOpen,
        }));
  const { user, configured, loading } = useAuth();
  const {
    state,
    loading: projectLoading,
    error: projectError,
    refresh,
  } = useProject();
  const { theme, toggleTheme } = useTheme();
  const [quick, setQuick] = useState(false);
  const [query, setQuery] = useState("");
  const [quickMode, setQuickMode] = useState<"task" | "grade">("task");
  const [command, setCommand] = useState(false);
  const [guide, setGuide] = useState(false);
  const [inbox, setInbox] = useState(false);
  useEffect(() => {
    if (
      universe === "academic" &&
      !projectLoading &&
      !loading &&
      !state.preferences.tutorialCompleted
    )
      setGuide(true);
  }, [projectLoading, loading, state.preferences.tutorialCompleted, universe]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing || e.repeat || isTyping(e.target))
        return;
      if (e.key === "Escape") {
        setCommand(false);
        setInbox(false);
        setQuick(false);
        return;
      }
      if (document.querySelector("dialog[open]")) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommand(true);
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (universe !== "academic") {
        if (e.key === "?") {
          e.preventDefault();
          setGuide(true);
          return;
        }
        const index = Number(e.key) - 1;
        if (
          index >= 0 &&
          index < Math.min(currentNav.length, 5) &&
          /^\d$/.test(e.key)
        ) {
          e.preventDefault();
          router.push(currentNav[index].href);
        }
        return;
      }
      const routes: Record<string, string> = {
        "1": "dashboard",
        "2": "subjects",
        "3": "calendar",
        "4": "revisions",
        "5": "errors",
        e: "errors",
        f: "revisions",
      };
      const key = e.key.toLowerCase();
      if (routes[key]) {
        e.preventDefault();
        router.push("/academic/" + routes[key]);
      }
      if (key === "n" || key === "g") {
        e.preventDefault();
        setQuickMode(key === "g" ? "grade" : "task");
        setQuick(true);
      }
      if (key === "i") {
        e.preventDefault();
        setInbox(true);
      }
      if (key === "?") {
        e.preventDefault();
        setGuide(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router, universe]);
  useEffect(() => {
    const add = (e: Event) => {
      setQuickMode(
        (e as CustomEvent).detail?.mode === "grade" ? "grade" : "task",
      );
      setQuick(true);
    };
    window.addEventListener("pw:quick-add", add);
    return () => window.removeEventListener("pw:quick-add", add);
  }, []);

  useEffect(() => {
    if (!loading && configured && !user && path !== "/login")
      router.replace("/login");
  }, [loading, configured, user, path, router]);

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Ozan";

  const dueSoon = useMemo(() => {
    const now = Date.now();
    return state.tasks.filter((t) => {
      if (t.status === "done" || !t.dueAt) return false;
      const d = new Date(t.dueAt).getTime();
      return d >= now - 86400000 && d <= now + 86400000;
    }).length;
  }, [state.tasks]);

  if (loading || (configured && !user))
    return <div className="os-loader">Project White</div>;

  function submitSearch(e: FormEvent) {
    e.preventDefault();
    if (universe !== "academic") return;
    router.push(
      query.trim()
        ? "/search?q=" + encodeURIComponent(query.trim())
        : "/academic/dashboard",
    );
  }

  return (
    <div className="os-shell universe-shell">
      <aside className="os-sidebar universe-sidebar">
        <Link href="/academic/dashboard" className="os-brand">
          <span className="os-brand-icon">
            <Sparkles size={18} />
          </span>
          <span>
            <strong>Project White</strong>
            <small>{universeMeta.label.toUpperCase()} · OS</small>
          </span>
        </Link>

        <div className="universe-current">
          <span className="universe-current-icon">
            <universeMeta.icon size={18} />
          </span>
          <span>
            <small>UNIVERS</small>
            <strong>{universeMeta.label}</strong>
          </span>
        </div>

        <nav
          className="os-nav academic-side-nav"
          aria-label={universeMeta.label}
        >
          {currentNav.map(({ href, label, icon: Icon }) => {
            const active = path === href;
            return (
              <Link
                key={href}
                href={href}
                title={label}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={"os-nav-item " + (active ? "active" : "")}
              >
                <Icon size={17} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="os-sidebar-bottom">
          <div className="sidebar-quick-actions">
            {universe === "academic" && (
              <button
                className="os-round-button"
                aria-label="Ajouter rapidement"
                onClick={() => setQuick(true)}
              >
                <Plus size={19} />
              </button>
            )}
            <button
              className="os-round-button"
              aria-label={
                theme === "light"
                  ? "Activer le noir profond"
                  : "Activer le blanc glacier"
              }
              onClick={toggleTheme}
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
          <Link href="/settings" className="os-profile">
            <CircleUserRound size={23} />
            <span>
              <strong>{displayName}</strong>
              <small>Mon espace</small>
            </span>
            <ChevronRight size={16} />
          </Link>
        </div>
      </aside>

      <section className="os-main">
        <header className="os-topbar universe-topbar">
          <div
            className="universe-switch"
            role="navigation"
            aria-label="Changer d’univers"
          >
            {universes.map(({ id, label, href, icon: Icon }) => (
              <Link
                key={id}
                href={href}
                className={universe === id ? "active" : ""}
                aria-current={universe === id ? "page" : undefined}
              >
                <span>
                  <Icon size={17} />
                </span>
                <b>{label}</b>
              </Link>
            ))}
          </div>

          <div className="topbar-actions">
            <button
              className={
                "os-icon-button " +
                (universe === "academic" ? "v3-command-trigger" : "")
              }
              aria-label="Ouvrir la palette"
              onClick={() => setCommand(true)}
            >
              <Search size={18} />
            </button>
            {universe === "academic" && (
              <form
                className="os-search compact-search"
                onSubmit={submitSearch}
              >
                <Search size={16} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher..."
                  aria-label="Rechercher"
                />
              </form>
            )}
            {universe === "academic" && (
              <button
                className="os-icon-button os-bell"
                aria-label="Notifications"
                onClick={() => router.push("/academic/tasks")}
              >
                <Bell size={18} />
                {dueSoon > 0 && <span>{dueSoon}</span>}
              </button>
            )}
            <Link href="/settings" className="os-avatar" aria-label="Profil">
              <CircleUserRound size={21} />
            </Link>
          </div>
        </header>

        <main className="os-content">
          <div className="v4-global-nav">
            <Link className="neo-pill" href="/today">
              Aujourd’hui · Tous les univers
            </Link>
            <Link className="neo-pill" href="/search">
              Recherche globale
            </Link>
          </div>
          <SaveStatus />
          <SyncStatus />
          {universe === "academic" && projectError && (
            <p role="alert">
              {projectError}{" "}
              <button onClick={() => void refresh()}>Réessayer</button>
            </p>
          )}
          <div key={path} className="v3-enter">
            {children}
          </div>
        </main>
        {universe === "academic" && (
          <button
            className="os-floating-add"
            aria-label="Ajouter"
            onClick={() => setQuick(true)}
          >
            <Plus size={22} />
          </button>
        )}
      </section>

      <button
        className="v3-help neo-pill"
        aria-label="Ouvrir le guide"
        onClick={() => setGuide(true)}
      >
        ?
      </button>
      <QuickAddModal
        open={quick}
        initialMode={quickMode}
        onClose={() => setQuick(false)}
      />
      <V3Dialog
        open={inbox}
        onClose={() => setInbox(false)}
        title="Capture rapide"
      >
        <Inbox />
      </V3Dialog>
      {universe === "academic" ? (
        <Guide open={guide} onClose={() => setGuide(false)} />
      ) : (
        <V3Dialog
          open={guide}
          onClose={() => setGuide(false)}
          title={"Guide · " + universeMeta.label}
        >
          <p>{universeDescriptions[universe].intro}</p>
          <p>
            {universe === "islam"
              ? "Coche tes prières pour le jour choisi, enregistre tes sessions de Coran et ajoute les passages à réviser. Les quatre réponses espacent les prochaines révisions."
              : universe === "health"
                ? "Renseigne uniquement les valeurs que tu connais dans ton bilan. Crée tes habitudes, coche-les chaque jour et enregistre tes séances pour retrouver ton historique."
                : "Le journal de trading conserve tes positions existantes. Les analyses portent sur les trades clôturés. Utilise Formation et Planification pour suivre tes cours et tes séances."}
          </p>
          <p>
            Ajoute tes objectifs et tes ressources dans leurs pages. Retirer
            déplace un élément dans la corbeille ; tu peux le restaurer. Le
            journal de trading possède son propre bouton de suppression.
          </p>
          <p>
            Ctrl/Cmd + K : palette · 1 à 5 : premières sections · ? : guide ·
            Esc : fermer. Les raccourcis restent inactifs pendant la saisie.
          </p>
        </V3Dialog>
      )}
      <V3Dialog
        open={command}
        onClose={() => setCommand(false)}
        title="Palette de commandes"
      >
        <input
          autoFocus
          aria-label="Filtrer les commandes"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Une page ou une action…"
        />
        <div className="v3-command">
          {[
            ...currentNav,
            { href: "/today", label: "Aujourd’hui · Tous les univers" },
            { href: "/search", label: "Recherche globale" },
            ...universes.map((u) => ({
              href: u.href,
              label: "Univers " + u.label,
            })),
            ...(universe === "academic"
              ? [
                  { href: "/academic/revisions", label: "Lancer Focus" },
                  { href: "/academic/grades", label: "Simulateur de notes" },
                ]
              : []),
          ]
            .filter((a) => a.label.toLowerCase().includes(query.toLowerCase()))
            .map((a) => (
              <button
                key={a.label}
                onClick={() => {
                  router.push(a.href);
                  setCommand(false);
                  setQuery("");
                }}
              >
                {a.label}
              </button>
            ))}
          {universe === "academic" && (
            <>
              <button
                onClick={() => {
                  setCommand(false);
                  setQuickMode("task");
                  setQuick(true);
                }}
              >
                Nouvelle tâche
              </button>
              <button
                onClick={() => {
                  setCommand(false);
                  setQuickMode("grade");
                  setQuick(true);
                }}
              >
                Nouvelle note
              </button>
              <button
                onClick={() => {
                  setCommand(false);
                  router.push("/academic/errors");
                }}
              >
                Nouvelle erreur
              </button>
            </>
          )}
          <button
            onClick={() => {
              setCommand(false);
              setGuide(true);
            }}
          >
            Guide
          </button>
        </div>
      </V3Dialog>
    </div>
  );
}

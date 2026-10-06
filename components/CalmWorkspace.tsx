"use client";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Star, ArrowLeft } from "lucide-react";
import { useComfort, useComfortFilter } from "./ComfortProvider";
import {
  comfortHomes,
  comfortNames,
  comfortSections,
  type ComfortUniverse,
} from "@/lib/comfort";

export function ComfortMode() {
  const [mode, setMode] = useComfortFilter("pref:mode", "essential");
  return (
    <div className="calm-mode" aria-label="Quantité d’informations affichées">
      <button
        aria-pressed={mode !== "complete"}
        onClick={() => setMode("essential")}
      >
        Essentiel
      </button>
      <button
        aria-pressed={mode === "complete"}
        onClick={() => setMode("complete")}
      >
        Complet
      </button>
    </div>
  );
}
export function OptionalPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [mode] = useComfortFilter("pref:mode", "essential");
  const [expanded, setExpanded] = useState<boolean | null>(null);
  const open = expanded ?? mode === "complete";
  return (
    <section className="calm-disclosure">
      <button
        className="calm-disclosure-button"
        aria-expanded={open}
        onClick={() => setExpanded(!open)}
      >
        {title}
        <span>{open ? "Réduire" : "Voir les détails"}</span>
      </button>
      {open && <div className="calm-disclosure-content">{children}</div>}
    </section>
  );
}
export function FavoriteButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const [value, setValue] = useComfortFilter(`favorite:${href}`, "no");
  const active = value === "yes";
  return (
    <button
      className="calm-favorite"
      aria-pressed={active}
      aria-label={`${active ? "Retirer" : "Ajouter"} ${label} ${active ? "des" : "aux"} favoris`}
      onClick={() => setValue(active ? "no" : "yes")}
    >
      <Star size={18} fill={active ? "currentColor" : "none"} />
    </button>
  );
}
export function HomePaths({ universe }: { universe: ComfortUniverse }) {
  const { filters } = useComfort();
  const sections = comfortSections[universe];
  const favorites = sections.filter(
    (s) => filters[`favorite:${s.href}`] === "yes",
  );
  const paths = favorites.length
    ? favorites.slice(0, 3)
    : sections.filter((s) => s.view === "items").slice(0, 3);
  return (
    <section
      className="calm-home-paths"
      aria-label={favorites.length ? "Mes favoris" : "Accès rapides"}
    >
      <h2>{favorites.length ? "Mes favoris" : "Retrouver mes éléments"}</h2>
      <div>
        {paths.map((s) => (
          <Link key={s.href} href={s.href}>
            <strong>{s.label}</strong>
            <span>{s.description}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
export function PageLocation({
  universe,
  path,
}: {
  universe: ComfortUniverse;
  path: string;
}) {
  if (
    path === comfortHomes[universe] ||
    path === "/today" ||
    path === "/settings" || path === "/daily-review" || path === "/search"
  )
    return null;
  const item = comfortSections[universe].find((s) => s.href === path);
  return (
    <nav className="calm-location" aria-label="Repères de navigation">
      <Link href={comfortHomes[universe]}>
        <ArrowLeft size={15} />
        {comfortNames[universe]} · Accueil
      </Link>
      <span aria-current="page">
        {item?.label ||
          (path === "/daily-review"
            ? "Bilan quotidien"
            : path.includes("/subjects/")
              ? "Ma matière"
              : path.endsWith("/items")
                ? "Mes éléments"
                : path.endsWith("/progress")
                  ? "Progression"
                  : "Mon espace")}
      </span>
    </nav>
  );
}
export function ComfortPreferences() {
  const [density, setDensity] = useComfortFilter("pref:density", "comfortable");
  const [text, setText] = useComfortFilter("pref:text", "normal");
  const [motion, setMotion] = useComfortFilter("pref:motion", "quiet");
  const [minutes, setMinutes] = useComfortFilter("pref:minutes", "25");
  const { storageError } = useComfort();
  return (
    <section className="neo-panel calm-settings">
      <h2>Mon confort</h2>
      <p>
        Ces préférences et tes favoris sont conservés sur cet appareil,
        séparément pour chaque compte.
      </p>
      <label>
        Quantité d’informations
        <ComfortMode />
      </label>
      <label>
        Espacement
        <select value={density} onChange={(e) => setDensity(e.target.value)}>
          <option value="comfortable">Aéré</option>
          <option value="compact">Compact</option>
        </select>
      </label>
      <label>
        Taille du texte
        <select value={text} onChange={(e) => setText(e.target.value)}>
          <option value="normal">Normale</option>
          <option value="large">Plus grande</option>
        </select>
      </label>
      <label>
        Animations
        <select value={motion} onChange={(e) => setMotion(e.target.value)}>
          <option value="quiet">Très discrètes</option>
          <option value="none">Désactivées</option>
        </select>
      </label>
      <label>
        Durée habituelle d’une tâche
        <select value={minutes} onChange={(e) => setMinutes(e.target.value)}>
          {[15, 25, 45, 60].map((n) => (
            <option key={n} value={n}>
              {n} minutes
            </option>
          ))}
        </select>
      </label>
      {storageError && <p role="alert">{storageError}</p>}
    </section>
  );
}

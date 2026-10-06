"use client";
import { useState } from "react";
import { parsePronoteText } from "@/lib/parser";
import { useProject } from "./ProjectProvider";
import { V3Dialog } from "./V3Dialog";
const screens = [
  [
    "Ton accueil",
    "Une prochaine action et trois accès utiles. Le mode Complet révèle les statistiques.",
  ],
  [
    "Capture rapide",
    "Transforme une consigne libre en tâche avec matière, date et durée.",
  ],
  [
    "Notes et matières",
    "Ajoute, modifie ou supprime une note. Les tendances et simulations restent disponibles à la demande.",
  ],
  [
    "Planning unifié",
    "La même tâche suit tes changements dans la matrice et le calendrier.",
  ],
  [
    "Focus et erreurs",
    "Commence une tâche puis espace tes révisions selon tes réponses.",
  ],
  [
    "Tes raccourcis",
    "Personnalise ton accueil et retrouve ce guide à tout moment avec ? .",
  ],
];
function MiniDemo({ step }: { step: number }) {
  const { state } = useProject();
  const [text, setText] = useState("exo 32 maths jeudi 45 min");
  const [score, setScore] = useState(4);
  const [quadrant, setQuadrant] = useState("Faire");
  const [rating, setRating] = useState("");
  const [priority, setPriority] = useState(false);
  if (step === 0)
    return (
      <button
        className="neo-pill"
        aria-pressed={priority}
        onClick={() => setPriority((v) => !v)}
      >
        {priority ? "✓ Priorité terminée" : "Préparer le contrôle · 45 min"}
      </button>
    );
  if (step === 1) {
    const t = parsePronoteText(text, state.subjects)[0];
    return (
      <>
        <label className="neo-field">
          Essaie une consigne
          <input value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <p aria-live="polite">
          {t
            ? (state.subjects.find((s) => s.id === t.subjectId)?.name ||
                "Sans matière") +
              " · " +
              t.durationMin +
              " min · " +
              (t.dueAt
                ? new Date(t.dueAt).toLocaleDateString("fr-FR")
                : "sans échéance")
            : "Saisis une consigne."}
        </p>
      </>
    );
  }
  if (step === 2)
    return (
      <>
        <label className="neo-field">
          Note sur 5
          <input
            type="number"
            min="0"
            max="5"
            step=".25"
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
          />
        </label>
        <p aria-live="polite">Équivalent : {score * 4}/20</p>
      </>
    );
  if (step === 3)
    return (
      <>
        <label className="neo-field">
          Déplacer la tâche
          <select
            value={quadrant}
            onChange={(e) => setQuadrant(e.target.value)}
          >
            {["Faire", "Planifier", "Déléguer", "Éliminer"].map((q) => (
              <option key={q}>{q}</option>
            ))}
          </select>
        </label>
        <p>Carte « Réviser les suites » · {quadrant} · 45 min</p>
      </>
    );
  if (step === 4)
    return (
      <>
        <p>Carte démo : combien vaut i² ? Correction : −1.</p>
        <div className="v3-row">
          {["Encore", "Difficile", "Bien", "Facile"].map((r, i) => (
            <button
              className="neo-pill"
              key={r}
              onClick={() =>
                setRating(["10 minutes", "1 jour", "3 jours", "7 jours"][i])
              }
            >
              {r}
            </button>
          ))}
        </div>
        <p aria-live="polite">
          {rating
            ? "Prochaine révision : " + rating
            : "Choisis ton niveau de rappel."}
        </p>
      </>
    );
  return (
    <p>
      Ferme le guide et essaie N ou Ctrl/Cmd + K. Tes démos n’ajoutent aucune
      donnée à ton compte.
    </p>
  );
}
export function Guide({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { state, saveAcademicPreferences } = useProject();
  const [step, setStep] = useState(0);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState("");
  async function finish() {
    try {
      await saveAcademicPreferences({ tutorialCompleted: true });
      onClose();
    } catch {
      setError("Impossible de mémoriser le tutoriel. Réessaie.");
    }
  }
  return (
    <V3Dialog
      open={open}
      onClose={() => void finish()}
      title={"Guide · " + (step + 1) + "/6"}
    >
      <h3>{screens[step][0]}</h3>
      <p>{screens[step][1]}</p>
      <div className="v3-demo">
        <button className="neo-pill" onClick={() => setDemo((v) => !v)}>
          Essayer
        </button>
        {demo && <MiniDemo key={step} step={step} />}
      </div>
      {step === 5 && (
        <p>
          Ctrl/Cmd+K palette · N tâche · G note · E erreur · F Focus · I Inbox ·
          1 accueil · 2 matières · 3 planning · 4 révisions · 5 erreurs · ?
          guide · Esc fermer.
          <br />
          Les raccourcis restent inactifs dans les champs.
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      <div className="v3-row">
        <button
          className="neo-pill"
          disabled={step === 0}
          onClick={() => {
            setStep((s) => s - 1);
            setDemo(false);
          }}
        >
          Précédent
        </button>
        {step < 5 ? (
          <button
            className="neo-pill primary"
            onClick={() => {
              setStep((s) => s + 1);
              setDemo(false);
            }}
          >
            Suivant
          </button>
        ) : (
          <button className="neo-pill primary" onClick={() => void finish()}>
            Terminer
          </button>
        )}
      </div>
    </V3Dialog>
  );
}

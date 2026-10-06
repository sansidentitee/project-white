"use client";
import Link from "next/link";
import { PageFrame } from "./PageFrame";
import { useProject } from "./ProjectProvider";
import { GradeManager } from "./GradeManager";
import { useComfortFilter } from "./ComfortProvider";
export function AcademicRecords({ kind }: { kind: "notes" | "resources" }) {
  const { state } = useProject();
  const [subject, setSubject] = useComfortFilter("resources:subject", "all");
  if (kind === "notes")
    return (
      <PageFrame>
        <h1>Mes notes</h1>
        <GradeManager />
      </PageFrame>
    );
  const records = state.resources.filter(
    (r) => subject === "all" || r.subjectId === subject,
  );
  return (
    <PageFrame>
      <section className="nd-records">
        <div className="nd-heading">
          <h1>Mes ressources</h1>
          <select
            aria-label="Filtrer par matière"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="all">Toutes les matières</option>
            {state.subjects.map((s) => (
              <option value={s.id} key={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="nd-record-grid">
          {records.map((r) => (
            <Link
              className="nd-card nd-record"
              key={r.id}
              href={`/subjects/${r.subjectId}`}
            >
              <div>
                <small>
                  {state.subjects.find((s) => s.id === r.subjectId)?.name}
                </small>
                <h2>{r.title}</h2>
                <p>
                  {r.kind === "file" ? "Fichier" : "Lien"} · ouvrir la matière
                </p>
              </div>
            </Link>
          ))}
        </div>
        {!records.length && (
          <p>Aucune ressource enregistrée dans cette sélection.</p>
        )}
        <p>
          Ouvre une matière pour ajouter, renommer ou retirer ses ressources.
        </p>
      </section>
    </PageFrame>
  );
}

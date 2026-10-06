"use client";
import { PageFrame } from "@/components/PageFrame";
import { GradeManager } from "@/components/GradeManager";
export default function NotesPage() {
  return (
    <PageFrame>
      <h1>Mes notes</h1>
      <GradeManager />
    </PageFrame>
  );
}

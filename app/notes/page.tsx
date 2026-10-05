'use client';

import { NotebookPen } from 'lucide-react';
import { PageFrame } from '@/components/PageFrame';
import { useProject } from '@/components/ProjectProvider';
import { generalAverage, subjectAverage } from '@/lib/grades';

export default function NotesPage() {
  const {state}=useProject();
  const subjectMap=Object.fromEntries(state.subjects.map(s=>[s.id,s.name]));
  const avg=generalAverage(state.grades);
  return <PageFrame>
    <div className="os-page-title"><h1>Notes</h1><p>Les résultats utiles, sans tableau compliqué.</p></div>
    <div className="os-two-columns">
      <section className="os-card">
        <div className="os-card-head"><div><NotebookPen size={18}/><h2>Résultats récents</h2></div><span className="os-card-meta">{avg ? avg.toFixed(1).replace('.0','')+'/20' : '—'}</span></div>
        <div className="os-grade-list">
          {state.grades.length ? state.grades.map(g=><div key={g.id}><span><strong>{subjectMap[g.subjectId] || 'Matière'}</strong><small>{g.title} · {new Date(g.takenAt).toLocaleDateString('fr-FR')}</small></span><b>{(g.score/g.outOf*20).toFixed(1).replace('.0','')}/20</b></div>) : <div className="os-empty">Aucune note enregistrée.</div>}
        </div>
      </section>
      <section className="os-card">
        <div className="os-card-head"><div><NotebookPen size={18}/><h2>Moyennes</h2></div></div>
        <div className="os-progress-table">
          {state.subjects.map(s=>{const a=subjectAverage(state.grades,s.id);return <div key={s.id}><span>{s.name}</span><div><i style={{width:(a?Math.min(100,a/20*100):0)+'%'}}/></div><b>{a ?? '—'}</b></div>})}
        </div>
      </section>
    </div>
  </PageFrame>;
}

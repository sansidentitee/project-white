'use client';
import Link from 'next/link';
import { useState } from 'react';
import { PageFrame } from './PageFrame';
import { useProject } from './ProjectProvider';
import { BookOpen, FileText, Plus } from 'lucide-react';

export function AcademicRecords({kind}:{kind:'notes'|'resources'}) {
  const {state}=useProject();
  const [subject,setSubject]=useState('all');
  const records=kind==='notes'?state.grades.filter(g=>subject==='all'||g.subjectId===subject):state.resources.filter(r=>subject==='all'||r.subjectId===subject);
  return <PageFrame><section className="nd-records"><div className="nd-heading"><div><p>Monde académique</p><h1>{kind==='notes'?'Mes notes':'Mes ressources'}</h1></div><select aria-label="Filtrer par matière" value={subject} onChange={e=>setSubject(e.target.value)}><option value="all">Toutes les matières</option>{state.subjects.map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select></div><div className="nd-record-grid">{records.map(r=><Link className="nd-card nd-record" key={r.id} href={`/subjects/${r.subjectId}`}><span className="nd-icon">{kind==='notes'?<FileText/>:<BookOpen/>}</span><div><small>{state.subjects.find(s=>s.id===r.subjectId)?.name}</small><h2>{r.title}</h2>{'score' in r?<p>{r.score} / {r.outOf} · coefficient {r.coefficient}</p>:<p>{r.kind==='file'?'Fichier':'Lien'} · ouvrir la matière</p>}</div></Link>)}</div>{!records.length&&<div className="nd-card nd-empty">{kind==='notes'?'Aucune note enregistrée.':'Aucune ressource enregistrée.'}<Link href="/subjects">Choisir une matière pour ajouter {kind==='notes'?'une note':'une ressource'} <Plus size={16}/></Link></div>}<p className="nd-record-help">Pour ajouter {kind==='notes'?'une note':'une ressource'}, ouvre la matière correspondante.</p></section></PageFrame>;
}

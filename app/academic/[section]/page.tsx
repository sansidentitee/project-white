'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState, useEffect, type CSSProperties } from 'react';
import {
  Activity, AlertTriangle, ArrowRight, BookOpen, CalendarDays, Check, ChevronRight,
  Circle, Clock3, FileUp, FolderOpen, GraduationCap, Link as LinkIcon, ListChecks,
  NotebookPen, Plus, RotateCcw, Target, Trash2, TrendingUp
} from 'lucide-react';
import { PageFrame } from '@/components/PageFrame';
import { useProject } from '@/components/ProjectProvider';
import { generalAverage, subjectAverage } from '@/lib/grades';
import type { Quadrant } from '@/lib/types';

const quadrantMeta:Record<Quadrant,{title:string;sub:string}> = {
  do:{title:'Faire',sub:'Urgent · important'},
  schedule:{title:'Planifier',sub:'Important · non urgent'},
  delegate:{title:'Déléguer',sub:'Urgent · peu important'},
  eliminate:{title:'Éliminer',sub:'Ni urgent · ni important'}
};

function PageTitle({eyebrow='ACADÉMIE',title,subtitle,action}:{eyebrow?:string;title:string;subtitle:string;action?:React.ReactNode}) {
  return <div className="academic-page-title">
    <div><span className="label">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>
    {action&&<div>{action}</div>}
  </div>;
}

function AcademicDashboard() {
  const {state,updateTask}=useProject();
  const avg=generalAverage(state.grades);
  const done=state.tasks.filter(t=>t.status==='done').length;
  const open=state.tasks.filter(t=>t.status!=='done');
  const late=open.filter(t=>t.dueAt && new Date(t.dueAt).getTime()<Date.now()).length;
  const errorOpen=state.errors.filter(e=>e.status!=='mastered').length;
  const minutes=state.sessions.reduce((s,x)=>s+x.durationMin,0);
  const subjectMap=useMemo(()=>Object.fromEntries(state.subjects.map(s=>[s.id,s.name])),[state.subjects]);
  const priorities=[...open].sort((a,b)=>{
    const da=a.dueAt?new Date(a.dueAt).getTime():Infinity;
    const db=b.dueAt?new Date(b.dueAt).getTime():Infinity;
    return (a.priority-b.priority)||da-db;
  }).slice(0,5);
  const subjects=[...state.subjects].map(s=>({s,avg:subjectAverage(state.grades,s.id)})).sort((a,b)=>(a.avg??99)-(b.avg??99)).slice(0,5);
  const week=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()+i);return d;});
  const taskPct=state.tasks.length?Math.round(done/state.tasks.length*100):0;
  const avgPct=avg?Math.min(100,avg/20*100):0;

  return <>
    <PageTitle title="Centre académique" subtitle="Notes, échéances, erreurs et révisions — uniquement ce qui aide à progresser."/>
    <div className="academic-kpi-band">
      <Link href="/academic/grades" className="academic-kpi">
        <div className="mini-donut" style={{'--p':avgPct} as CSSProperties}><span/></div>
        <div><small>MOYENNE</small><strong>{avg?avg.toFixed(1).replace('.0',''):'—'}</strong><p>/ 20 · {state.grades.length} notes</p></div>
      </Link>
      <Link href="/academic/tasks" className="academic-kpi">
        <div className="mini-donut" style={{'--p':taskPct} as CSSProperties}><span/></div>
        <div><small>TÂCHES</small><strong>{open.length}</strong><p>{late?late+' en retard':'aucun retard'}</p></div>
      </Link>
      <Link href="/academic/errors" className="academic-kpi">
        <div className="mini-donut" style={{'--p':Math.min(100,errorOpen*15)} as CSSProperties}><span/></div>
        <div><small>ERREURS</small><strong>{errorOpen}</strong><p>à corriger / revoir</p></div>
      </Link>
      <Link href="/academic/revisions" className="academic-kpi">
        <div className="mini-donut" style={{'--p':Math.min(100,minutes/6)} as CSSProperties}><span/></div>
        <div><small>RÉVISIONS</small><strong>{Math.round(minutes/60)} h</strong><p>{state.sessions.length} sessions</p></div>
      </Link>
    </div>

    <div className="academic-home-grid">
      <section className="neo-panel hero-average-panel">
        <div className="panel-head"><span className="label">MOYENNE GÉNÉRALE</span><Link href="/academic/grades">notes</Link></div>
        <div className="academic-hero-ring" style={{'--p':avgPct} as CSSProperties}>
          <div><strong>{avg?avg.toFixed(1).replace('.0',''):'—'}</strong><span>/ 20</span></div>
        </div>
        <div className="academic-target-line"><span>Objectif</span><b>18,0</b></div>
        <div className="academic-target-status">{avg ? (avg>=18?'objectif atteint':'écart : '+(18-avg).toFixed(1)+' pt') : 'ajoute tes premières notes'}</div>
      </section>

      <div className="academic-center-stack">
        <section className="neo-panel">
          <div className="panel-head"><span className="label">SEMAINE</span><Link href="/academic/calendar">agenda</Link></div>
          <div className="academic-week-strip">
            {week.map((d,i)=>{
              const n=state.tasks.filter(t=>t.status!=='done'&&t.dueAt&&new Date(t.dueAt).toDateString()===d.toDateString()).length;
              return <div key={i} className={i===0?'today':''}><small>{new Intl.DateTimeFormat('fr-FR',{weekday:'short'}).format(d)}</small><strong>{d.getDate()}</strong><span>{n?Array.from({length:Math.min(3,n)},(_,x)=><i key={x}/>):null}</span></div>
            })}
          </div>
        </section>

        <section className="neo-panel grow-panel">
          <div className="panel-head"><span className="label">MATIÈRES À SURVEILLER</span><Link href="/academic/subjects">matières</Link></div>
          <div className="subject-urgency-list">
            {subjects.length?subjects.map(({s,avg:a})=><Link href={'/subjects/'+s.id} key={s.id} className="subject-urgency-row">
              <span><strong>{s.name}</strong><small>{state.chapters.filter(c=>c.subjectId===s.id).length} chapitres</small></span>
              <div className="spark-placeholder"><i style={{width:(a?Math.min(100,a/20*100):0)+'%'}}/></div>
              <b>{a===null?'—':a.toFixed(1).replace('.0','')}</b>
            </Link>):<p className="empty">Aucune matière.</p>}
          </div>
        </section>
      </div>

      <div className="academic-right-stack">
        <section className="neo-panel grow-panel">
          <div className="panel-head"><span className="label">À FAIRE</span><Link href="/academic/tasks">matrice</Link></div>
          <div className="dashboard-task-list">
            {priorities.length?priorities.map(t=><div key={t.id} className="dashboard-task-row">
              <button className={'neo-check '+(t.status==='done'?'done':'')} onClick={()=>updateTask(t.id,{status:t.status==='done'?'todo':'done'})}>{t.status==='done'?<Check size={12}/>:null}</button>
              <span><strong>{t.title}</strong><small>{t.subjectId?subjectMap[t.subjectId]:'Général'}{t.dueAt?' · '+new Date(t.dueAt).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'}):''}</small></span>
            </div>):<p className="empty">Rien à faire.</p>}
          </div>
        </section>

        <section className="neo-panel">
          <div className="panel-head"><span className="label">BANQUE D’ERREURS</span><Link href="/academic/errors">ouvrir</Link></div>
          <div className="error-mini-list">
            {state.errors.filter(e=>e.status!=='mastered').slice(0,3).map(e=><div key={e.id}><AlertTriangle size={13}/><span>{e.title}</span></div>)}
            {!state.errors.some(e=>e.status!=='mastered')&&<p className="empty sm">Aucune erreur active.</p>}
          </div>
        </section>
      </div>
    </div>
  </>;
}

function GradesPage() {
  const {state,addGrade}=useProject();
  const [subjectId,setSubjectId]=useState('');
  const [title,setTitle]=useState('');
  const [score,setScore]=useState('');
  const [coef,setCoef]=useState('1');
  const avg=generalAverage(state.grades);
  const subjectMap=useMemo(()=>Object.fromEntries(state.subjects.map(s=>[s.id,s.name])),[state.subjects]);

  async function submit(){
    if(!subjectId||!score)return;
    await addGrade({subjectId,title:title.trim()||'Évaluation',score:Number(score),outOf:20,coefficient:Number(coef)||1,takenAt:new Date().toISOString()});
    setTitle('');setScore('');setCoef('1');
  }

  return <>
    <PageTitle title="Suivi des notes" subtitle="Ajoute une note en quelques secondes et repère immédiatement les matières qui demandent ton attention."/>
    <div className="academic-split-layout">
      <section className="neo-panel academic-form-panel">
        <span className="label">NOUVELLE NOTE</span>
        <label className="neo-field">Matière<select value={subjectId} onChange={e=>setSubjectId(e.target.value)}><option value="">Choisir</option>{state.subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label className="neo-field">Évaluation<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="DS, contrôle, oral…"/></label>
        <div className="field-row"><label className="neo-field">Note /20<input type="number" min="0" max="20" step=".25" value={score} onChange={e=>setScore(e.target.value)}/></label><label className="neo-field">Coef.<input type="number" min=".5" step=".5" value={coef} onChange={e=>setCoef(e.target.value)}/></label></div>
        <button className="neo-pill primary" onClick={submit}><Plus size={15}/>Ajouter</button>
        <div className="grade-hero-number"><small>MOYENNE ACTUELLE</small><strong>{avg?avg.toFixed(1).replace('.0',''):'—'}</strong><span>/20</span></div>
      </section>

      <section className="neo-panel">
        <div className="panel-head"><span className="label">MOYENNES PAR MATIÈRE</span><span>{state.subjects.length} matières</span></div>
        <div className="subject-average-list">
          {state.subjects.map(s=>{const a=subjectAverage(state.grades,s.id);return <div key={s.id}>
            <span><strong>{s.name}</strong><small>{state.grades.filter(g=>g.subjectId===s.id).length} notes</small></span>
            <div className="inset-progress"><i style={{width:(a?Math.min(100,a/20*100):0)+'%'}}/></div>
            <b>{a===null?'—':a.toFixed(1).replace('.0','')}</b>
          </div>})}
        </div>
        <div className="divider"/>
        <div className="panel-head"><span className="label">DERNIÈRES NOTES</span></div>
        <div className="grade-list">
          {state.grades.slice(0,12).map(g=><div key={g.id}><small>{new Date(g.takenAt).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}</small><span><strong>{g.title}</strong><em>{subjectMap[g.subjectId]}</em></span><b>{(g.score/g.outOf*20).toFixed(1).replace('.0','')}</b></div>)}
        </div>
      </section>
    </div>
  </>;
}

function TasksPage() {
  const {state,addTask,updateTask,removeTask}=useProject();
  const [title,setTitle]=useState('');
  const [subjectId,setSubjectId]=useState('');
  const [due,setDue]=useState('');
  const [quadrant,setQuadrant]=useState<Quadrant>('do');
  const subjectMap=useMemo(()=>Object.fromEntries(state.subjects.map(s=>[s.id,s.name])),[state.subjects]);

  async function createTask(){
    if(!title.trim())return;
    await addTask({subjectId:subjectId||null,title:title.trim(),details:null,kind:'study',dueAt:due?new Date(due+'T20:00:00').toISOString():null,plannedStart:null,durationMin:45,status:'todo',quadrant,priority:quadrant==='do'?1:quadrant==='schedule'?2:3});
    setTitle('');setDue('');
  }

  return <>
    <PageTitle title="Tâches · Matrice d’Eisenhower" subtitle="Classe le travail par importance et urgence au lieu d’empiler une todo-list sans ordre."/>
    <section className="neo-panel task-composer">
      <input className="neo-input grow" value={title} onChange={e=>setTitle(e.target.value)} onKeyDown={e=>e.key==='Enter'&&createTask()} placeholder="Ajouter une tâche académique…"/>
      <select className="neo-input" value={subjectId} onChange={e=>setSubjectId(e.target.value)}><option value="">Matière</option>{state.subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
      <input className="neo-input" type="date" value={due} onChange={e=>setDue(e.target.value)}/>
      <select className="neo-input" value={quadrant} onChange={e=>setQuadrant(e.target.value as Quadrant)}>{Object.entries(quadrantMeta).map(([k,v])=><option key={k} value={k}>{v.title}</option>)}</select>
      <button className="round-action" onClick={createTask}><Plus size={16}/></button>
    </section>
    <div className="eisenhower-grid">
      {(Object.keys(quadrantMeta) as Quadrant[]).map(q=><section key={q} className="neo-panel eisenhower-quadrant">
        <div className="quadrant-head"><div><span className="label">{quadrantMeta[q].title}</span><p>{quadrantMeta[q].sub}</p></div><b>{state.tasks.filter(t=>t.status!=='done'&&t.quadrant===q).length}</b></div>
        <div className="quadrant-list">
          {state.tasks.filter(t=>t.quadrant===q).map(t=><article key={t.id} className={t.status==='done'?'done':''}>
            <button className={'neo-check '+(t.status==='done'?'done':'')} onClick={()=>updateTask(t.id,{status:t.status==='done'?'todo':'done'})}>{t.status==='done'?<Check size={12}/>:null}</button>
            <div><strong>{t.title}</strong><small>{t.subjectId?subjectMap[t.subjectId]:'Général'}{t.dueAt?' · '+new Date(t.dueAt).toLocaleDateString('fr-FR'):''}</small></div>
            <select value={t.quadrant} onChange={e=>updateTask(t.id,{quadrant:e.target.value as Quadrant})}>{Object.entries(quadrantMeta).map(([k,v])=><option key={k} value={k}>{v.title}</option>)}</select>
            <button className="icon-ghost" onClick={()=>removeTask(t.id)}><Trash2 size={13}/></button>
          </article>)}
          {!state.tasks.some(t=>t.quadrant===q)&&<p className="empty sm">Vide.</p>}
        </div>
      </section>)}
    </div>
  </>;
}

function CalendarPage() {
  const {state}=useProject();
  const subjectMap=useMemo(()=>Object.fromEntries(state.subjects.map(s=>[s.id,s.name])),[state.subjects]);
  const days=Array.from({length:7},(_,i)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+i);return d;});
  const agenda=[...state.tasks].filter(t=>t.status!=='done'&&(t.dueAt||t.plannedStart)).sort((a,b)=>new Date(a.dueAt||a.plannedStart!).getTime()-new Date(b.dueAt||b.plannedStart!).getTime());

  return <>
    <PageTitle title="Calendrier · Agenda" subtitle="Une vue semaine pour les échéances, puis une liste chronologique pour l’exécution."/>
    <section className="neo-panel">
      <div className="panel-head"><span className="label">7 PROCHAINS JOURS</span><span>{agenda.length} événements</span></div>
      <div className="academic-calendar-grid">
        {days.map((d,i)=>{const list=state.tasks.filter(t=>t.status!=='done'&&t.dueAt&&new Date(t.dueAt).toDateString()===d.toDateString());return <div key={i} className={'academic-day '+(i===0?'today':'')}>
          <header><small>{new Intl.DateTimeFormat('fr-FR',{weekday:'short'}).format(d)}</small><strong>{d.getDate()}</strong></header>
          <div>{list.map(t=><span key={t.id}><b>{t.title}</b><small>{t.subjectId?subjectMap[t.subjectId]:''}</small></span>)}{!list.length&&<em>Libre</em>}</div>
        </div>})}
      </div>
    </section>
    <section className="neo-panel section-space">
      <div className="panel-head"><span className="label">AGENDA</span></div>
      <div className="agenda-list">
        {agenda.map(t=><div key={t.id}><span className="agenda-date">{new Date(t.dueAt||t.plannedStart!).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}</span><span><strong>{t.title}</strong><small>{t.subjectId?subjectMap[t.subjectId]:'Général'}</small></span><b>{t.durationMin} min</b></div>)}
        {!agenda.length&&<p className="empty">Aucune échéance.</p>}
      </div>
    </section>
  </>;
}

function SubjectsPage() {
  const {state}=useProject();
  return <>
    <PageTitle title="Matières" subtitle="Une lecture rapide de chaque matière : moyenne, chapitres et niveau de maîtrise."/>
    <div className="academic-subject-grid">
      {state.subjects.map(s=>{
        const a=subjectAverage(state.grades,s.id);
        const chapters=state.chapters.filter(c=>c.subjectId===s.id);
        const mastered=chapters.filter(c=>c.status==='mastered'||c.status==='solid').length;
        const p=chapters.length?Math.round(mastered/chapters.length*100):0;
        return <Link href={'/subjects/'+s.id} key={s.id} className="neo-panel subject-tile">
          <span className="subject-orb"><GraduationCap size={19}/></span>
          <div><span className="label">{s.shortName}</span><h2>{s.name}</h2></div>
          <div className="subject-score"><strong>{a===null?'—':a.toFixed(1).replace('.0','')}</strong><small>/20</small></div>
          <div className="inset-progress"><i style={{width:p+'%'}}/></div>
          <footer><span>{chapters.length} chapitres</span><span>{p}% maîtrisé</span><ChevronRight size={15}/></footer>
        </Link>;
      })}
    </div>
  </>;
}

function ErrorsPage() {
  const {state,addError,updateError,removeError}=useProject();
  const [subjectId,setSubjectId]=useState('');
  const [title,setTitle]=useState('');
  const [details,setDetails]=useState('');
  const [correction,setCorrection]=useState('');
  const subjectMap=useMemo(()=>Object.fromEntries(state.subjects.map(s=>[s.id,s.name])),[state.subjects]);

  async function create(){
    if(!title.trim())return;
    const next=new Date();next.setDate(next.getDate()+2);
    await addError({subjectId:subjectId||null,title:title.trim(),details:details.trim()||null,correction:correction.trim()||null,status:'open',nextReviewAt:next.toISOString()});
    setTitle('');setDetails('');setCorrection('');
  }

  return <>
    <PageTitle title="Banque d’erreurs" subtitle="Chaque erreur devient une donnée à éliminer avant le prochain contrôle."/>
    <div className="academic-split-layout error-layout">
      <section className="neo-panel academic-form-panel">
        <span className="label">NOUVELLE ERREUR</span>
        <label className="neo-field">Matière<select value={subjectId} onChange={e=>setSubjectId(e.target.value)}><option value="">Général</option>{state.subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label className="neo-field">Erreur<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ce que j’ai raté"/></label>
        <label className="neo-field">Pourquoi ?<textarea value={details} onChange={e=>setDetails(e.target.value)} placeholder="Cause de l’erreur"/></label>
        <label className="neo-field">Correction<textarea value={correction} onChange={e=>setCorrection(e.target.value)} placeholder="Règle / méthode à retenir"/></label>
        <button className="neo-pill primary" onClick={create}><Plus size={15}/>Ajouter à la banque</button>
      </section>

      <section className="neo-panel">
        <div className="panel-head"><span className="label">ERREURS ACTIVES</span><span>{state.errors.filter(e=>e.status!=='mastered').length}</span></div>
        <div className="error-bank-list">
          {state.errors.map(e=><article key={e.id} className={'error-bank-card status-'+e.status}>
            <div className="error-card-head"><span><small>{e.subjectId?subjectMap[e.subjectId]:'Général'}</small><strong>{e.title}</strong></span><button className="icon-ghost" onClick={()=>removeError(e.id)}><Trash2 size={13}/></button></div>
            {e.details&&<p>{e.details}</p>}
            {e.correction&&<div className="correction-box"><span>Correction</span><p>{e.correction}</p></div>}
            <footer>
              <select value={e.status} onChange={x=>updateError(e.id,{status:x.target.value as any})}><option value="open">À corriger</option><option value="review">À revoir</option><option value="mastered">Maîtrisée</option></select>
              {e.nextReviewAt&&<small>revoir {new Date(e.nextReviewAt).toLocaleDateString('fr-FR')}</small>}
            </footer>
          </article>)}
          {!state.errors.length&&<p className="empty">Ta banque d’erreurs est vide.</p>}
        </div>
      </section>
    </div>
  </>;
}

function RevisionsPage() {
  const {state,addSession}=useProject();
  const [subjectId,setSubjectId]=useState('');
  const [duration,setDuration]=useState('45');
  const [outcome,setOutcome]=useState<'done'|'partial'|'resume'|'blocked'>('done');
  const subjectMap=useMemo(()=>Object.fromEntries(state.subjects.map(s=>[s.id,s.name])),[state.subjects]);

  async function log(){
    if(!subjectId)return;
    const end=new Date();const start=new Date(end.getTime()-Number(duration||45)*60000);
    await addSession({subjectId,taskId:null,startedAt:start.toISOString(),endedAt:end.toISOString(),durationMin:Number(duration)||45,outcome});
  }

  const total=state.sessions.reduce((s,x)=>s+x.durationMin,0);
  return <>
    <PageTitle title="Révisions" subtitle="Enregistre les vraies sessions de travail pour distinguer intention et exécution."/>
    <div className="academic-kpi-band compact">
      <div className="academic-kpi"><Clock3/><div><small>TEMPS TOTAL</small><strong>{Math.round(total/60)} h</strong><p>{state.sessions.length} sessions</p></div></div>
      <div className="academic-kpi"><Activity/><div><small>MOYENNE / SESSION</small><strong>{state.sessions.length?Math.round(total/state.sessions.length):0}</strong><p>minutes</p></div></div>
      <div className="academic-kpi"><Check/><div><small>TERMINÉES</small><strong>{state.sessions.filter(s=>s.outcome==='done').length}</strong><p>sessions complètes</p></div></div>
      <div className="academic-kpi"><RotateCcw/><div><small>À REPRENDRE</small><strong>{state.sessions.filter(s=>s.outcome==='resume'||s.outcome==='partial').length}</strong><p>sessions</p></div></div>
    </div>
    <div className="academic-split-layout section-space">
      <section className="neo-panel academic-form-panel">
        <span className="label">ENREGISTRER UNE SESSION</span>
        <label className="neo-field">Matière<select value={subjectId} onChange={e=>setSubjectId(e.target.value)}><option value="">Choisir</option>{state.subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label className="neo-field">Durée<input type="number" min="5" step="5" value={duration} onChange={e=>setDuration(e.target.value)}/></label>
        <label className="neo-field">Résultat<select value={outcome} onChange={e=>setOutcome(e.target.value as any)}><option value="done">Terminé</option><option value="partial">Partiel</option><option value="resume">À reprendre</option><option value="blocked">Bloqué</option></select></label>
        <button className="neo-pill primary" onClick={log}><Plus size={15}/>Enregistrer</button>
      </section>
      <section className="neo-panel">
        <div className="panel-head"><span className="label">HISTORIQUE</span></div>
        <div className="session-list">
          {state.sessions.slice(0,20).map(s=><div key={s.id}><span><strong>{s.subjectId?subjectMap[s.subjectId]:'Général'}</strong><small>{new Date(s.startedAt).toLocaleDateString('fr-FR')}</small></span><b>{s.durationMin} min</b><em>{s.outcome}</em></div>)}
          {!state.sessions.length&&<p className="empty">Aucune session.</p>}
        </div>
      </section>
    </div>
  </>;
}

function ResourcesPage() {
  const {state,addResource,uploadResource}=useProject();
  const [subjectId,setSubjectId]=useState('');
  const [title,setTitle]=useState('');
  const [url,setUrl]=useState('');
  const subjectMap=useMemo(()=>Object.fromEntries(state.subjects.map(s=>[s.id,s.name])),[state.subjects]);
  async function add(){if(!subjectId||!title.trim()||!url.trim())return;await addResource({subjectId,title:title.trim(),url:url.trim(),kind:'link'});setTitle('');setUrl('')}
  return <>
    <PageTitle title="Ressources" subtitle="Cours, PDF et liens rangés par matière sans encombrer le dashboard."/>
    <div className="academic-split-layout">
      <section className="neo-panel academic-form-panel">
        <span className="label">AJOUTER</span>
        <label className="neo-field">Matière<select value={subjectId} onChange={e=>setSubjectId(e.target.value)}><option value="">Choisir</option>{state.subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label className="neo-field">Titre<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Cours chapitre 3"/></label>
        <label className="neo-field">Lien<input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://…"/></label>
        <button className="neo-pill primary" onClick={add}><LinkIcon size={14}/>Ajouter le lien</button>
        <label className="file-drop"><FileUp size={17}/><span>Ajouter un fichier</span><input type="file" onChange={async e=>{const f=e.target.files?.[0];if(f&&subjectId)await uploadResource(subjectId,f)}}/></label>
      </section>
      <section className="neo-panel">
        <div className="panel-head"><span className="label">BIBLIOTHÈQUE</span><span>{state.resources.length}</span></div>
        <div className="resource-grid">
          {state.resources.map(r=><a key={r.id} href={r.url} target="_blank" rel="noreferrer"><span>{r.kind==='file'?<FileUp size={16}/>:<LinkIcon size={16}/>}</span><div><strong>{r.title}</strong><small>{subjectMap[r.subjectId]}</small></div><ChevronRight size={14}/></a>)}
          {!state.resources.length&&<p className="empty">Aucune ressource enregistrée.</p>}
        </div>
      </section>
    </div>
  </>;
}

function StatsPage() {
  const {state}=useProject();
  const avg=generalAverage(state.grades);
  const total=state.sessions.reduce((s,x)=>s+x.durationMin,0);
  const done=state.tasks.filter(t=>t.status==='done').length;
  const completion=state.tasks.length?Math.round(done/state.tasks.length*100):0;
  const mastered=state.chapters.filter(c=>c.status==='mastered'||c.status==='solid').length;
  const chapterPct=state.chapters.length?Math.round(mastered/state.chapters.length*100):0;
  return <>
    <PageTitle title="Progression" subtitle="Des indicateurs simples pour vérifier si ton système académique produit réellement des résultats."/>
    <div className="academic-kpi-band compact">
      <div className="academic-kpi"><TrendingUp/><div><small>MOYENNE</small><strong>{avg?avg.toFixed(1).replace('.0',''):'—'}</strong><p>/20</p></div></div>
      <div className="academic-kpi"><Check/><div><small>EXÉCUTION</small><strong>{completion}%</strong><p>tâches terminées</p></div></div>
      <div className="academic-kpi"><BookOpen/><div><small>MAÎTRISE</small><strong>{chapterPct}%</strong><p>chapitres solides</p></div></div>
      <div className="academic-kpi"><Clock3/><div><small>TRAVAIL</small><strong>{Math.round(total/60)} h</strong><p>enregistrées</p></div></div>
    </div>
    <section className="neo-panel section-space">
      <div className="panel-head"><span className="label">PAR MATIÈRE</span></div>
      <div className="stats-subject-bars">
        {state.subjects.map(s=>{const a=subjectAverage(state.grades,s.id);const chapters=state.chapters.filter(c=>c.subjectId===s.id);const m=chapters.filter(c=>c.status==='solid'||c.status==='mastered').length;const p=chapters.length?Math.round(m/chapters.length*100):0;return <div key={s.id}>
          <span><strong>{s.name}</strong><small>{p}% chapitres solides</small></span>
          <div className="inset-progress"><i style={{width:(a?Math.min(100,a/20*100):0)+'%'}}/></div>
          <b>{a===null?'—':a.toFixed(1).replace('.0','')}</b>
        </div>})}
      </div>
    </section>
  </>;
}

function GoalsPage() {
  const {state}=useProject();
  const avg=generalAverage(state.grades);
  const [goal,setGoal]=useState('18');
  useEffect(()=>{const x=localStorage.getItem('pw-academic-goal');if(x)setGoal(x)},[]);
  const target=Math.max(1,Math.min(20,Number(goal)||18));
  const p=avg?Math.min(100,avg/target*100):0;
  const openErrors=state.errors.filter(e=>e.status!=='mastered').length;
  const late=state.tasks.filter(t=>t.status!=='done'&&t.dueAt&&new Date(t.dueAt).getTime()<Date.now()).length;
  return <>
    <PageTitle title="Objectifs" subtitle="Un petit nombre d’objectifs, reliés à des métriques que Project White peut réellement suivre."/>
    <div className="goals-layout">
      <section className="neo-panel goal-focus">
        <span className="label">OBJECTIF PRINCIPAL</span>
        <div className="goal-ring" style={{'--p':p} as CSSProperties}><div><strong>{avg?avg.toFixed(1).replace('.0',''):'—'}</strong><small>/ {target}</small></div></div>
        <label className="neo-field">Moyenne visée<input type="number" min="1" max="20" step=".5" value={goal} onChange={e=>{setGoal(e.target.value);localStorage.setItem('pw-academic-goal',e.target.value)}}/></label>
      </section>
      <section className="neo-panel goal-rules">
        <div><span className="goal-orb"><Check size={15}/></span><p><strong>Zéro retard</strong><small>{late===0?'objectif respecté':late+' tâche(s) en retard'}</small></p><b>{late}</b></div>
        <div><span className="goal-orb"><AlertTriangle size={15}/></span><p><strong>Banque d’erreurs à zéro</strong><small>corriger avant de multiplier les nouveaux exercices</small></p><b>{openErrors}</b></div>
        <div><span className="goal-orb"><Clock3 size={15}/></span><p><strong>Révision mesurable</strong><small>enregistrer les sessions profondes</small></p><b>{state.sessions.length}</b></div>
        <div><span className="goal-orb"><BookOpen size={15}/></span><p><strong>Chapitres solides</strong><small>transformer les zones faibles en automatismes</small></p><b>{state.chapters.filter(c=>c.status==='solid'||c.status==='mastered').length}</b></div>
      </section>
    </div>
  </>;
}

export default function AcademicSectionPage(){
  const params=useParams<{section:string}>();
  let content:React.ReactNode;
  switch(params.section){
    case 'dashboard': content=<AcademicDashboard/>; break;
    case 'grades': content=<GradesPage/>; break;
    case 'tasks': content=<TasksPage/>; break;
    case 'calendar': content=<CalendarPage/>; break;
    case 'subjects': content=<SubjectsPage/>; break;
    case 'errors': content=<ErrorsPage/>; break;
    case 'revisions': content=<RevisionsPage/>; break;
    case 'resources': content=<ResourcesPage/>; break;
    case 'stats': content=<StatsPage/>; break;
    case 'goals': content=<GoalsPage/>; break;
    default: content=<AcademicDashboard/>;
  }
  return <PageFrame><div className="academic-page">{content}</div></PageFrame>;
}

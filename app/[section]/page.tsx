'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen, CalendarDays, Check, Circle, Clock3, Dumbbell, FileText, GraduationCap,
  HeartPulse, Landmark, Plus, Search, Target, TrendingUp
} from 'lucide-react';
import { PageFrame } from '@/components/PageFrame';
import { useProject } from '@/components/ProjectProvider';
import { generalAverage, subjectAverage } from '@/lib/grades';

function PageTitle({title,subtitle}:{title:string;subtitle:string}) {
  return <div className="os-page-title"><h1>{title}</h1><p>{subtitle}</p></div>;
}

function TasksPage() {
  const {state,updateTask} = useProject();
  const subjectMap = useMemo(()=>Object.fromEntries(state.subjects.map(s=>[s.id,s.name])),[state.subjects]);
  const tasks = [...state.tasks].sort((a,b)=>{
    if(a.status==='done' && b.status!=='done') return 1;
    if(a.status!=='done' && b.status==='done') return -1;
    return a.priority-b.priority;
  });
  return <>
    <PageTitle title="Tâches" subtitle="Une liste unique. Le minimum nécessaire pour savoir quoi faire ensuite."/>
    <div className="os-two-columns">
      <section className="os-card">
        <div className="os-card-head"><div><Check size={18}/><h2>À traiter</h2></div><span className="os-card-meta">{tasks.filter(t=>t.status!=='done').length}</span></div>
        <div className="os-task-list">
          {tasks.length ? tasks.map(t=><button key={t.id} onClick={()=>updateTask(t.id,{status:t.status==='done'?'todo':'done'})} className={t.status==='done'?'completed':''}>
            <span className="os-check">{t.status==='done'?<Check size={14}/>:<Circle size={14}/>}</span>
            <span><strong>{t.title}</strong><small>{t.subjectId ? subjectMap[t.subjectId] || 'Académique' : 'Personnel'}{t.dueAt ? ' · ' + new Date(t.dueAt).toLocaleDateString('fr-FR') : ''}</small></span>
            <b>P{t.priority}</b>
          </button>) : <div className="os-empty">Aucune tâche.</div>}
        </div>
      </section>
      <section className="os-card">
        <div className="os-card-head"><div><Target size={18}/><h2>Règle de simplicité</h2></div></div>
        <div className="os-big-message">Garde seulement trois priorités réelles par jour.</div>
        <p className="os-muted">Ajoute tout rapidement avec le bouton +. Project White conserve le reste sans encombrer l’écran principal.</p>
      </section>
    </div>
  </>;
}

function CalendarPage() {
  const {state} = useProject();
  const days = Array.from({length:7},(_,i)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+i);return d;});
  return <>
    <PageTitle title="Calendrier" subtitle="Une semaine lisible, centrée sur les échéances."/>
    <section className="os-card">
      <div className="os-week-board">
        {days.map((d,i)=>{
          const dayTasks = state.tasks.filter(t=>t.dueAt && new Date(t.dueAt).toDateString()===d.toDateString());
          return <div key={i} className={'os-day-column ' + (i===0?'today':'')}>
            <div><small>{new Intl.DateTimeFormat('fr-FR',{weekday:'short'}).format(d)}</small><strong>{d.getDate()}</strong></div>
            {dayTasks.length ? dayTasks.map(t=><span key={t.id}>{t.title}</span>) : <em>Libre</em>}
          </div>;
        })}
      </div>
    </section>
  </>;
}

function GoalsPage() {
  const {state} = useProject();
  const avg = generalAverage(state.grades);
  const open = state.tasks.filter(t=>t.status!=='done').length;
  const overdue = state.tasks.filter(t=>t.status!=='done' && t.dueAt && new Date(t.dueAt).getTime()<Date.now()).length;
  return <>
    <PageTitle title="Objectifs" subtitle="Des objectifs mesurables, reliés à des actions contrôlables."/>
    <div className="os-card-grid">
      <section className="os-card os-goal-card"><Target/><small>Académique</small><h2>Moyenne ≥ 18</h2><strong>{avg ? avg.toFixed(1).replace('.0','') + '/20' : '—'}</strong></section>
      <section className="os-card os-goal-card"><Check/><small>Organisation</small><h2>0 retard</h2><strong>{overdue}</strong></section>
      <section className="os-card os-goal-card"><TrendingUp/><small>Exécution</small><h2>Tâches ouvertes</h2><strong>{open}</strong></section>
      <section className="os-card os-goal-card"><BookOpen/><small>Révision</small><h2>Sessions enregistrées</h2><strong>{state.sessions.length}</strong></section>
    </div>
  </>;
}

function TrackingPage() {
  const {state} = useProject();
  const avg = generalAverage(state.grades);
  const minutes = state.sessions.reduce((s,x)=>s+x.durationMin,0);
  const done = state.tasks.filter(t=>t.status==='done').length;
  return <>
    <PageTitle title="Suivi" subtitle="Quelques indicateurs seulement, pour voir si ton système fonctionne."/>
    <div className="os-card-grid">
      <section className="os-card os-stat-card"><TrendingUp/><span><small>Moyenne</small><strong>{avg ? avg.toFixed(1).replace('.0','') : '—'}</strong></span></section>
      <section className="os-card os-stat-card"><Clock3/><span><small>Travail enregistré</small><strong>{Math.round(minutes/60)} h</strong></span></section>
      <section className="os-card os-stat-card"><Check/><span><small>Tâches terminées</small><strong>{done}</strong></span></section>
      <section className="os-card os-stat-card"><GraduationCap/><span><small>Matières suivies</small><strong>{state.subjects.length}</strong></span></section>
    </div>
    <section className="os-card os-section-gap">
      <div className="os-card-head"><div><TrendingUp size={18}/><h2>Progression par matière</h2></div></div>
      <div className="os-progress-table">
        {state.subjects.map(s=>{const a=subjectAverage(state.grades,s.id);return <div key={s.id}><span>{s.name}</span><div><i style={{width:(a ? Math.min(100,a/20*100):0)+'%'}}/></div><b>{a ?? '—'}</b></div>})}
      </div>
    </section>
  </>;
}

function AcademicPage() {
  const {state} = useProject();
  return <>
    <PageTitle title="Académique" subtitle="Tes matières, chapitres et résultats au même endroit."/>
    <div className="os-subject-grid">
      {state.subjects.map(s=>{
        const avg=subjectAverage(state.grades,s.id);
        const chapters=state.chapters.filter(c=>c.subjectId===s.id);
        return <Link href={'/subjects/'+s.id} className="os-card os-subject-card" key={s.id}>
          <span className="os-subject-icon"><GraduationCap size={22}/></span>
          <h2>{s.name}</h2>
          <p>{chapters.length} chapitre{chapters.length>1?'s':''}</p>
          <strong>{avg===null?'—':avg+'/20'}</strong>
        </Link>;
      })}
    </div>
  </>;
}

function DeenPage() {
  const names=['Fajr','Dhuhr','Asr','Maghrib','Isha'];
  const key='pw-deen-'+new Date().toISOString().slice(0,10);
  const [checked,setChecked]=useState<Record<string,boolean>>({});
  const [quran,setQuran]=useState('15');
  useEffect(()=>{try{const r=localStorage.getItem(key);if(r)setChecked(JSON.parse(r));const q=localStorage.getItem('pw-quran-min');if(q)setQuran(q)}catch{}},[key]);
  function toggle(n:string){setChecked(p=>{const x={...p,[n]:!p[n]};localStorage.setItem(key,JSON.stringify(x));return x})}
  return <>
    <PageTitle title="Deen" subtitle="Un suivi calme, simple et volontairement discret."/>
    <div className="os-two-columns">
      <section className="os-card">
        <div className="os-card-head"><div><Landmark size={18}/><h2>Prières</h2></div><span className="os-card-meta">{Object.values(checked).filter(Boolean).length}/5</span></div>
        <div className="os-prayer-large">{names.map(n=><button key={n} onClick={()=>toggle(n)} className={checked[n]?'done':''}><span>{checked[n]?<Check size={16}/>:<Circle size={16}/>}</span><strong>{n}</strong></button>)}</div>
      </section>
      <section className="os-card">
        <div className="os-card-head"><div><BookOpen size={18}/><h2>Coran</h2></div></div>
        <label className="os-field">Temps quotidien souhaité
          <input type="number" min="0" value={quran} onChange={e=>{setQuran(e.target.value);localStorage.setItem('pw-quran-min',e.target.value)}}/>
        </label>
        <div className="os-big-message">{quran || '0'} min / jour</div>
        <p className="os-muted">L’objectif ici est de rendre la pratique visible sans transformer le deen en jeu.</p>
      </section>
    </div>
  </>;
}

function VitalityPage() {
  const [data,setData]=useState({steps:'',sleep:'',activity:'',energy:''});
  useEffect(()=>{try{const r=localStorage.getItem('pw-vitality');if(r)setData(JSON.parse(r))}catch{}},[]);
  function set(k:string,v:string){const next={...data,[k]:v};setData(next);localStorage.setItem('pw-vitality',JSON.stringify(next))}
  return <>
    <PageTitle title="Vitalité" subtitle="Sommeil, mouvement et énergie, sans surcharge de données."/>
    <div className="os-card-grid">
      <section className="os-card os-input-card"><Dumbbell/><label>Pas aujourd’hui<input type="number" value={data.steps} onChange={e=>set('steps',e.target.value)} placeholder="0"/></label></section>
      <section className="os-card os-input-card"><Clock3/><label>Sommeil (heures)<input type="number" step="0.1" value={data.sleep} onChange={e=>set('sleep',e.target.value)} placeholder="0"/></label></section>
      <section className="os-card os-input-card"><HeartPulse/><label>Activité (minutes)<input type="number" value={data.activity} onChange={e=>set('activity',e.target.value)} placeholder="0"/></label></section>
      <section className="os-card os-input-card"><TrendingUp/><label>Énergie / 100<input type="number" min="0" max="100" value={data.energy} onChange={e=>set('energy',e.target.value)} placeholder="0"/></label></section>
    </div>
  </>;
}

function LifePage() {
  const {state,addTask} = useProject();
  const [title,setTitle]=useState('');
  const personal=state.tasks.filter(t=>!t.subjectId);
  async function add(){if(!title.trim())return;await addTask({subjectId:null,title:title.trim(),details:null,kind:'study',dueAt:null,plannedStart:null,durationMin:30,status:'todo',quadrant:'schedule',priority:3});setTitle('')}
  return <>
    <PageTitle title="Life" subtitle="Tout ce qui ne mérite pas une application séparée."/>
    <div className="os-two-columns">
      <section className="os-card">
        <div className="os-card-head"><div><FileText size={18}/><h2>Personnel</h2></div></div>
        <div className="os-inline-add"><input value={title} onChange={e=>setTitle(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')add()}} placeholder="Ajouter une tâche personnelle"/><button onClick={add}><Plus size={17}/></button></div>
        <div className="os-simple-list">{personal.length?personal.map(t=><div key={t.id}><span><strong>{t.title}</strong><small>{t.status}</small></span></div>):<div className="os-empty compact">Rien à afficher.</div>}</div>
      </section>
      <section className="os-card">
        <div className="os-card-head"><div><BookOpen size={18}/><h2>Axes de vie</h2></div></div>
        <div className="os-pill-list"><span>Langues</span><span>Lecture</span><span>Projets</span><span>Administration</span></div>
      </section>
    </div>
  </>;
}

function SearchPage() {
  const params=useSearchParams();
  const {state}=useProject();
  const [q,setQ]=useState(params.get('q') || '');
  const needle=q.trim().toLowerCase();
  const results=needle ? [
    ...state.subjects.filter(x=>x.name.toLowerCase().includes(needle)).map(x=>({type:'Matière',title:x.name,href:'/subjects/'+x.id})),
    ...state.tasks.filter(x=>(x.title+' '+(x.details||'')).toLowerCase().includes(needle)).map(x=>({type:'Tâche',title:x.title,href:'/tasks'})),
    ...state.resources.filter(x=>x.title.toLowerCase().includes(needle)).map(x=>({type:'Ressource',title:x.title,href:x.url}))
  ] : [];
  return <>
    <PageTitle title="Recherche" subtitle="Retrouve une matière, une tâche ou une ressource sans naviguer partout."/>
    <section className="os-card">
      <div className="os-search-page"><Search size={19}/><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Commence à écrire..."/></div>
      <div className="os-search-results">{needle ? (results.length?results.map((r,i)=><Link key={i} href={r.href}><small>{r.type}</small><strong>{r.title}</strong></Link>):<div className="os-empty">Aucun résultat.</div>) : <div className="os-empty">La recherche reste volontairement simple.</div>}</div>
    </section>
  </>;
}

export default function SectionPage() {
  const params=useParams<{section:string}>();
  switch(params.section) {
    case 'tasks': return <PageFrame><TasksPage/></PageFrame>;
    case 'calendar': return <PageFrame><CalendarPage/></PageFrame>;
    case 'goals': return <PageFrame><GoalsPage/></PageFrame>;
    case 'tracking': return <PageFrame><TrackingPage/></PageFrame>;
    case 'academic': return <PageFrame><AcademicPage/></PageFrame>;
    case 'deen': return <PageFrame><DeenPage/></PageFrame>;
    case 'vitality': return <PageFrame><VitalityPage/></PageFrame>;
    case 'life': return <PageFrame><LifePage/></PageFrame>;
    case 'search': return <PageFrame><SearchPage/></PageFrame>;
    default: return <PageFrame><PageTitle title="Project White" subtitle="Cette page n’existe pas encore."/></PageFrame>;
  }
}

'use client';
import { PageFrame } from '@/components/PageFrame';
import { NeuCard, GoldButton, SoftCard } from '@/components/Neu';
import { useProject } from '@/components/ProjectProvider';
import { SubjectIcon } from '@/components/icons';
import { sortedOpenTasks } from '@/lib/scheduler';
import { daysUntil, longDate, shortDate } from '@/lib/date';
import { useRouter } from 'next/navigation';

export default function TodayPage(){
 const {state}=useProject(); const router=useRouter();
 const tasks=sortedOpenTasks(state.tasks); const now=tasks[0]; const next=tasks.slice(1,4); const upcoming=tasks.filter(t=>t.dueAt).slice(0,4);
 const subject=(id?:string|null)=>state.subjects.find(s=>s.id===id);
 const worked=state.sessions.filter(s=>new Date(s.startedAt).toDateString()===new Date().toDateString()).reduce((a,s)=>a+s.durationMin,0);
 const doneToday=state.tasks.filter(t=>t.status==='done').length; const total=Math.max(doneToday+tasks.length,1);
 return <PageFrame><div className="page-head"><div><h1>Aujourd’hui</h1><p>{longDate()}</p></div></div>
 <div className="page-grid two-col">
   <div className="page-grid">
    <NeuCard className="hero-card">{now?<><div className="subject-glyph"><SubjectIcon icon={subject(now.subjectId)?.icon||'file'} size={40}/></div><div className="hero-copy"><span className="eyebrow">MAINTENANT</span><h2>{subject(now.subjectId)?.name||'Travail'}</h2><div className="serif" style={{fontSize:20}}>{now.title}</div><div className="meta-row"><span>Échéance {shortDate(now.dueAt)}</span><span>Durée prévue : {now.durationMin} min</span></div></div><GoldButton onClick={()=>router.push(`/work?task=${now.id}`)}>Commencer →</GoldButton></>:<div className="hero-copy"><span className="eyebrow">MAINTENANT</span><h2>Rien d’urgent</h2><p className="muted">Ajoute ton travail depuis le Planning.</p></div>}</NeuCard>
    <NeuCard className="list-card"><div className="section-title"><h2>Ensuite</h2></div>{next.length?next.map(t=>{const s=subject(t.subjectId);return <div className="task-row" key={t.id}><div className="small-glyph"><SubjectIcon icon={s?.icon||'file'} size={24}/></div><div className="task-copy"><strong>{s?.name||'Travail'}</strong><p>{t.title}</p></div><span className="task-time">{t.durationMin} min</span></div>}):<p className="muted">Aucune autre tâche planifiée.</p>}</NeuCard>
   </div>
   <div className="page-grid">
    <NeuCard className="dashboard-stats"><div className="section-title"><h2>Ma journée</h2></div><div className="stats-inner"><div className="ring" style={{'--progress':`${Math.min(100,doneToday/total*100)}%`} as React.CSSProperties}><div><strong>{doneToday}/{total}</strong><div className="muted">tâches</div></div></div><div className="stat-stack"><div><strong>{Math.floor(worked/60)}h{String(worked%60).padStart(2,'0')}</strong><div className="muted">travaillées</div></div><div><strong>{state.sessions.length?3:0}</strong><div className="muted">jours de régularité</div></div></div></div></NeuCard>
    <NeuCard className="list-card"><div className="section-title"><h2>À venir</h2><a href="/planning">Voir tout →</a></div>{upcoming.map(t=>{const s=subject(t.subjectId),d=t.dueAt?new Date(t.dueAt):new Date(); return <div className="upcoming-row" key={t.id}><div className="date-cube"><small>{d.toLocaleDateString('fr-FR',{weekday:'short'}).toUpperCase()}</small>{d.getDate()}</div><div className="task-copy"><strong>{s?.name||t.kind}</strong><p>{t.title}</p></div><span className={`dot ${daysUntil(t.dueAt)<=3?'gold':''}`}/></div>})}</NeuCard>
   </div>
 </div>
 <SoftCard className="collapsed-bar"><span>Toutes les tâches du jour ({tasks.length})</span><span>⌄</span></SoftCard>
 </PageFrame>
}

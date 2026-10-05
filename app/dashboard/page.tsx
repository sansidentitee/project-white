'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen, CalendarDays, Check, ChevronRight, Circle, Clock3, Dumbbell,
  Landmark, Moon, Target, TrendingUp
} from 'lucide-react';
import { PageFrame } from '@/components/PageFrame';
import { useProject } from '@/components/ProjectProvider';
import { useAuth } from '@/components/AuthProvider';
import { generalAverage } from '@/lib/grades';

const prayers = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];

export default function DashboardPage() {
  const {state,updateTask} = useProject();
  const {user} = useAuth();
  const [prayerState,setPrayerState] = useState<Record<string,boolean>>({});

  useEffect(()=>{
    try {
      const raw = localStorage.getItem('pw-prayers-' + new Date().toISOString().slice(0,10));
      if(raw) setPrayerState(JSON.parse(raw));
    } catch {}
  },[]);

  function togglePrayer(name:string) {
    setPrayerState(prev=>{
      const next = {...prev,[name]:!prev[name]};
      localStorage.setItem('pw-prayers-' + new Date().toISOString().slice(0,10),JSON.stringify(next));
      return next;
    });
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Ozan';
  const dateText = new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());
  const openTasks = state.tasks.filter(t=>t.status !== 'done');
  const priorities = [...openTasks].sort((a,b)=>a.priority-b.priority).slice(0,3);
  const todayTasks = [...openTasks].sort((a,b)=>{
    const aa = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
    const bb = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
    return aa-bb;
  }).slice(0,6);
  const average = generalAverage(state.grades);
  const done = state.tasks.filter(t=>t.status === 'done').length;
  const taskProgress = state.tasks.length ? Math.round(done/state.tasks.length*100) : 0;

  const recentGrades = state.grades.slice(0,3);
  const subjectMap = useMemo(()=>Object.fromEntries(state.subjects.map(s=>[s.id,s.name])),[state.subjects]);

  const week = Array.from({length:7},(_,i)=>{
    const d = new Date();
    d.setDate(d.getDate()+i);
    return {day:new Intl.DateTimeFormat('fr-FR',{weekday:'short'}).format(d),num:d.getDate()};
  });

  return (
    <PageFrame>
      <div className="os-dashboard">
        <section className="os-hero-row">
          <div>
            <h1>Bonjour {displayName}</h1>
            <p className="os-muted">{dateText.charAt(0).toUpperCase()+dateText.slice(1)} · Une seule interface pour avancer.</p>
          </div>
          <div className="os-quote">« Chaque petit effort compte. »</div>
        </section>

        <section className="os-dashboard-grid">
          <article className="os-card os-schedule-card">
            <div className="os-card-head"><div><CalendarDays size={18}/><h2>Aujourd’hui</h2></div><Link href="/calendar">Voir tout</Link></div>
            <div className="os-timeline">
              {todayTasks.length ? todayTasks.map((task,index)=>(
                <div className="os-timeline-row" key={task.id}>
                  <span className="os-time">{task.dueAt ? new Date(task.dueAt).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) : index < 3 ? ['17:00','18:00','19:00'][index] : '—'}</span>
                  <i/>
                  <button className="os-task-line" onClick={()=>updateTask(task.id,{status:task.status==='done'?'todo':'done'})}>
                    <span><strong>{task.title}</strong><small>{task.subjectId ? subjectMap[task.subjectId] || 'Académique' : 'Personnel'}</small></span>
                    <ChevronRight size={16}/>
                  </button>
                </div>
              )) : <div className="os-empty">Aucune tâche prévue. Utilise le bouton + pour commencer.</div>}
            </div>
          </article>

          <div className="os-stack">
            <article className="os-card">
              <div className="os-card-head"><div><Target size={18}/><h2>Priorités du jour</h2></div><Link href="/tasks">Tout voir</Link></div>
              <div className="os-priority-list">
                {priorities.length ? priorities.map((task,index)=>(
                  <button key={task.id} className="os-priority-row" onClick={()=>updateTask(task.id,{status:task.status==='done'?'todo':'done'})}>
                    <span className="os-index">{index+1}</span>
                    <span className="os-check">{task.status==='done'?<Check size={14}/>:<Circle size={14}/>}</span>
                    <span><strong>{task.title}</strong><small>{task.details || (task.subjectId ? subjectMap[task.subjectId] : 'À traiter')}</small></span>
                  </button>
                )) : <div className="os-empty compact">Rien d’urgent actuellement.</div>}
              </div>
            </article>

            <article className="os-card">
              <div className="os-card-head"><div><TrendingUp size={18}/><h2>Progression du jour</h2></div><span className="os-card-meta">{done}/{state.tasks.length}</span></div>
              <div className="os-progress-layout">
                <div className="os-ring" style={{'--progress':taskProgress} as React.CSSProperties}><span>{taskProgress}%</span></div>
                <div className="os-progress-lines">
                  <div><span>Académique</span><b>{state.subjects.length ? 'actif' : '—'}</b></div>
                  <div><span>Deen</span><b>{Object.values(prayerState).filter(Boolean).length}/5</b></div>
                  <div><span>Finance</span><b>apprentissage</b></div>
                  <div><span>Vitalité</span><b>à renseigner</b></div>
                </div>
              </div>
            </article>
          </div>

          <div className="os-stack">
            <article className="os-card">
              <div className="os-card-head"><div><Landmark size={18}/><h2>Prières du jour</h2></div><Link href="/deen">Ouvrir</Link></div>
              <p className="os-muted small">Suivi simple, sans information inutile.</p>
              <div className="os-prayer-row">
                {prayers.map(name=><button key={name} className={prayerState[name]?'done':''} onClick={()=>togglePrayer(name)}><span>{prayerState[name]?<Check size={14}/>:<Circle size={14}/>}</span><small>{name}</small></button>)}
              </div>
            </article>

            <article className="os-card">
              <div className="os-card-head"><div><Dumbbell size={18}/><h2>État actuel</h2></div><Link href="/vitality">Modifier</Link></div>
              <div className="os-metric-grid">
                <div><Moon size={17}/><span><small>Sommeil</small><strong>—</strong></span></div>
                <div><Clock3 size={17}/><span><small>Activité</small><strong>—</strong></span></div>
                <div><BookOpen size={17}/><span><small>Concentration</small><strong>—</strong></span></div>
                <div><TrendingUp size={17}/><span><small>Énergie</small><strong>—</strong></span></div>
              </div>
            </article>
          </div>

          <article className="os-card os-week-card">
            <div className="os-card-head"><div><CalendarDays size={18}/><h2>Vue semaine</h2></div><Link href="/calendar">Calendrier</Link></div>
            <div className="os-week-row">{week.map((d,i)=><div key={i} className={i===0?'today':''}><small>{d.day}</small><strong>{d.num}</strong></div>)}</div>
          </article>

          <article className="os-card">
            <div className="os-card-head"><div><BookOpen size={18}/><h2>Notes récentes</h2></div><Link href="/notes">Tout voir</Link></div>
            <div className="os-simple-list">
              {recentGrades.length ? recentGrades.map(g=>(
                <div key={g.id}><span><strong>{subjectMap[g.subjectId] || 'Matière'}</strong><small>{g.title}</small></span><b>{(g.score/g.outOf*20).toFixed(1).replace('.0','')}/20</b></div>
              )) : <div className="os-empty compact">Aucune note enregistrée.</div>}
            </div>
          </article>

          <article className="os-card">
            <div className="os-card-head"><div><Target size={18}/><h2>Objectifs</h2></div><Link href="/goals">Tout voir</Link></div>
            <div className="os-goal-list">
              <div><span>Moyenne générale ≥ 18</span><b>{average ? average.toFixed(1).replace('.0','') + '/20' : '—'}</b></div>
              <div><span>Tâches terminées</span><b>{taskProgress}%</b></div>
              <div><span>Prières suivies aujourd’hui</span><b>{Object.values(prayerState).filter(Boolean).length}/5</b></div>
            </div>
          </article>
        </section>
      </div>
    </PageFrame>
  );
}

'use client';

import { PageFrame } from '@/components/PageFrame';
import { useProject } from '@/components/ProjectProvider';
import { tradePnl, useTrading } from '@/components/TradingProvider';
import { useWorld } from '@/components/WorldProvider';
import { BookOpen, CalendarDays, TrendingUp, Target, FileText, NotebookTabs } from '@/components/icons';

const academicSubjects=[
  ['Mathématiques',16.8,78],['Physique-Chimie',15.1,62],['Maths expertes',16.0,70],['Philosophie',14.3,55],['Anglais',15.6,70]
] as const;

const academicTasks=[
  ['Réviser maths — Chapitre 4','09:00 – 10:30',true],
  ['Faire le devoir de physique','11:00 – 12:00',true],
  ['Lire le chapitre de philosophie','14:00 – 15:00',false],
  ['Préparer l’exposé d’anglais','15:30 – 17:00',false],
  ['Revoir méthodologie','20:00 – 21:00',false],
] as const;

const financeTasks=[
  ['Analyser EURUSD (H1)','09:00 – 10:00',true],
  ['Revoir module 3 : Price Action','10:30 – 12:00',true],
  ['Rédiger le journal de trading','13:00 – 13:30',false],
  ['Backtest : stratégie breakout','15:00 – 17:00',false],
  ['Lire : Psychologie du trading','20:00 – 20:30',false],
] as const;

function Sparkline({up=true}:{up?:boolean}){
  const points=up?'2,34 14,28 24,31 36,20 48,23 62,10 76,15 90,3':'2,17 14,22 26,14 38,20 50,10 63,17 76,7 90,12';
  return <svg className="sparkline" viewBox="0 0 92 36" aria-hidden><polyline points={points}/><circle cx="90" cy={up?'3':'12'} r="2.4"/></svg>;
}

function MainChart({finance}:{finance:boolean}){
  const line=finance?'0,128 42,120 84,132 126,110 168,88 210,98 252,122 294,108 336,142 378,124 420,152 462,118 504,94 546,102 588,82 630,88':'0,138 42,122 84,128 126,110 168,92 210,76 252,82 294,104 336,96 378,116 420,94 462,86 504,68 546,74 588,66 630,44';
  return <div className="hero-chart">
    <div className="chart-toolbar"><strong>{finance?'EURUSD':'Évolution de mes notes'}</strong><div className="chart-tabs"><span>1M</span><span className="selected">3M</span><span>6M</span><span>1A</span></div></div>
    <div className="chart-canvas">
      <div className="grid-lines"/>
      <svg viewBox="0 0 630 170" preserveAspectRatio="none">
        <defs><linearGradient id={finance?'fillF':'fillA'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".24"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs>
        <polyline className="chart-area" points={`${line} 630,170 0,170`} fill={`url(#${finance?'fillF':'fillA'})`}/>
        <polyline className="chart-line" points={line}/>
      </svg>
      <div className="chart-labels"><span>{finance?'8 mars':'Janv.'}</span><span>{finance?'9 mars':'Févr.'}</span><span>{finance?'10 mars':'Mars'}</span><span>{finance?'12 mars':'Aujourd’hui'}</span></div>
    </div>
  </div>;
}

export default function DashboardPage(){
  const {world}=useWorld();
  const finance=world==='finance';
  const {state}=useProject();
  const {trades}=useTrading();
  const completed=state.tasks.filter(t=>t.status==='done').length;
  const open=state.tasks.filter(t=>t.status!=='done').length;
  const study=state.sessions.reduce((a,s)=>a+s.durationMin,0);
  const closed=trades.filter(t=>t.status==='closed');
  const pnl=closed.reduce((a,t)=>a+tradePnl(t),0);
  const wins=closed.filter(t=>tradePnl(t)>0).length;
  const winRate=closed.length?wins/closed.length*100:0;
  const tasks=finance?financeTasks:academicTasks;

  const cards=finance?[
    ['Portefeuille','12 450,00 €','+ 320,50 € · +2,64%',true],
    ['EURUSD','1,0824','+ 1,8%',true],
    ['XAUUSD','2 348,10','− 0,4%',false],
    ['Win rate',`${winRate.toFixed(0)}%`,`${closed.length} trades clôturés`,true],
  ]:[
    ['Moyenne générale','15,2 / 20','+ 0,8 pts',true],
    ['Heures d’étude',`${Math.floor(study/60)} h ${String(study%60).padStart(2,'0')}`,'cette semaine',true],
    ['Devoirs restants',String(open||5),'à terminer',false],
    ['Progression bac','62 %','+ 8 % ce mois',true],
  ];

  return <PageFrame>
    <section className="pw-dashboard">
      <div className="dash-heading"><div><span>Bon retour, Alexandre.</span><h1>Discipline aujourd’hui, liberté demain.</h1></div><div className="dash-date">{new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div></div>

      <div className="summary-row">
        {cards.map(([label,value,sub,up])=><div className="summary-card" key={label}><div className="summary-card-top"><span>{label}</span><span>•••</span></div><div className="summary-value">{value}</div><div className={up?'trend up':'trend down'}>{sub}</div><Sparkline up={Boolean(up)}/></div>)}
      </div>

      <div className="dashboard-core">
        <div className="main-panel"><MainChart finance={finance}/></div>
        <div className="progress-panel">
          <div className="panel-title"><span className="panel-icon"><TrendingUp size={17}/></span><strong>{finance?'Progression trading':'Progression académique'}</strong></div>
          <div className="progress-top"><div className="progress-ring"><span>62%</span></div><p>{finance?'Maîtriser. Progresser. Construire.':'Sur la voie du bac. Continue sur cette lancée.'}</p></div>
          <div className="progress-list">
            {(finance?[['Parcours Trading',67],['Analyse technique',60],['Psychologie du trader',50],['Gestion du risque',42]]:academicSubjects.slice(0,4).map(x=>[x[0],x[2]] as [string,number])).map(([name,pct])=><div className="progress-item" key={name}><span>{name}</span><div><i style={{width:`${pct}%`}}/></div><small>{pct}%</small></div>)}
          </div>
        </div>
      </div>

      <div className="dashboard-bottom">
        <div className="bottom-card tasks-card"><div className="panel-title"><span className="panel-icon"><FileText size={17}/></span><strong>Tâches du jour</strong><small>{completed||2} / {tasks.length}</small></div><div className="task-list">{tasks.map(([title,time,done])=><div className="dash-task" key={title}><span className={done?'task-dot done':'task-dot'}>{done?'✓':''}</span><span>{title}</span><small>{time}</small></div>)}</div></div>
        <div className="bottom-card schedule-card"><div className="panel-title"><span className="panel-icon"><CalendarDays size={17}/></span><strong>{finance?'Planning':'Planning de la semaine'}</strong></div><div className="timeline">{(finance?['Étude des marchés','Formation','Journal de trading','Backtest','Lecture']:['Mathématiques','Physique-Chimie','Déjeuner','Anglais','Révisions']).map((x,i)=><div key={x}><span>{['08:00','10:30','13:00','15:00','18:00'][i]}</span><i/><div><strong>{x}</strong><small>{finance?'Session structurée':'Cours / session de travail'}</small></div></div>)}</div></div>
        <div className="bottom-card goals-card"><div className="panel-title"><span className="panel-icon"><Target size={17}/></span><strong>Mes objectifs</strong></div><div className="goal-tabs"><span className="active">Court terme</span><span>Moyen terme</span><span>Long terme</span></div><div className="goal-list">{(finance?[["Obtenir une constance sur 3 mois",68],["Terminer l’académie",62],["Atteindre 25 000 €",50],["Développer une routine solide",80]]:[["Obtenir une moyenne générale ≥ 16",62],["Terminer tous mes devoirs à temps",80],["Réussir le bac avec mention",45],["Améliorer mon anglais",70]]).map(([g,p])=><div className="goal" key={String(g)}><span>{g}</span><small>{p}%</small><div><i style={{width:`${p}%`}}/></div></div>)}</div></div>
      </div>
    </section>
  </PageFrame>;
}

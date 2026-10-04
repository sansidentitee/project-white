'use client';

import { PageFrame } from '@/components/PageFrame';
import { useProject } from '@/components/ProjectProvider';
import { tradePnl, useTrading } from '@/components/TradingProvider';
import { useWorld } from '@/components/WorldProvider';
import { CalendarDays, TrendingUp, Target, FileText, BookOpen } from '@/components/icons';

const academicSubjects=[
  ['Mathématiques','16,8',78,'#67a9ff'],
  ['Physique-Chimie','15,1',62,'#9b5cff'],
  ['Philosophie','14,3',55,'#ea5c8f'],
  ['Anglais','16,0',70,'#f0b44b'],
  ['Histoire-Géo','13,9',58,'#54cf87'],
  ['Maths expertes','15,6',72,'#43c7d9']
] as const;

const academicTasks=[
  ['Réviser maths – Chapitre 4','09:00 – 10:30',true],
  ['Faire le devoir de physique','11:00 – 12:00',true],
  ['Lire le chapitre de philosophie','14:00 – 15:00',false],
  ['Préparer l’exposé d’anglais','15:30 – 17:00',false],
  ['Revoir méthodologie (fiche résumé)','20:00 – 21:00',false],
] as const;

const financeTasks=[
  ['Analyser EURUSD (H1)','09:00 – 10:00',true],
  ['Revoir module 3 : Price Action','10:30 – 12:00',true],
  ['Rédiger le journal de trading','13:00 – 13:30',false],
  ['Backtest : stratégie breakout','15:00 – 17:00',false],
  ['Lire : Psychologie du trading','20:00 – 20:30',false],
] as const;

function Sparkline({down=false}:{down?:boolean}){
  const points=down?'2,30 14,23 24,27 36,16 48,22 61,13 74,18 90,8':'2,31 14,27 25,29 37,22 48,23 61,14 74,18 90,7';
  return <svg className={down?'sparkline spark-down':'sparkline'} viewBox="0 0 92 36" aria-hidden><polyline points={points}/><circle cx="90" cy={down?'8':'7'} r="2.2"/></svg>;
}

function AcademicChart(){
  const line='0,138 42,121 84,127 126,111 168,94 210,77 252,84 294,102 336,95 378,112 420,92 462,85 504,68 546,74 588,65 630,43';
  return <div className="reference-chart">
    <div className="chart-head-row">
      <div className="panel-title"><span className="panel-icon"><TrendingUp size={17}/></span><strong>Évolution de mes notes</strong></div>
      <div className="chart-actions"><button>Toutes les matières⌄</button><div className="chart-tabs"><span>1M</span><span className="selected">3M</span><span>6M</span><span>1A</span></div></div>
    </div>
    <div className="chart-body-reference">
      <div className="chart-plot">
        <div className="y-axis"><span>20</span><span>15</span><span>10</span><span>5</span><span>0</span></div>
        <div className="grid-lines"/>
        <svg viewBox="0 0 630 170" preserveAspectRatio="none">
          <defs><linearGradient id="academicFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#69a9ff" stopOpacity=".32"/><stop offset="1" stopColor="#69a9ff" stopOpacity="0"/></linearGradient></defs>
          <polyline className="chart-area" points={`${line} 630,170 0,170`} fill="url(#academicFill)"/>
          <polyline className="chart-line" points={line}/>
          {[0,84,168,252,336,420,504,588,630].map((x,i)=>{const ys=[138,127,94,84,95,92,68,65,43];return <circle key={x} cx={x} cy={ys[i]} r="2.5" className="chart-dot"/>})}
        </svg>
        <div className="chart-value-badge">15,2</div>
        <div className="chart-labels"><span>Janv.</span><span>Févr.</span><span>Mars</span></div>
      </div>
      <aside className="chart-legend"><strong>Moyenne par matière</strong>{academicSubjects.map(([name,value,,color])=><div key={name}><i style={{background:color}}/><span>{name}</span><b>{value}</b></div>)}</aside>
    </div>
  </div>;
}

function FinanceChart(){
  return <div className="reference-chart finance-reference-chart">
    <div className="chart-head-row"><div className="panel-title"><span className="panel-icon"><TrendingUp size={17}/></span><strong>EURUSD</strong></div><div className="chart-tabs"><span>1m</span><span>5m</span><span className="selected">1h</span><span>4h</span><span>1D</span></div></div>
    <div className="fake-candles">{Array.from({length:48}).map((_,i)=><i key={i} style={{height:`${22+(i*13)%64}px`,transform:`translateY(${(i*7)%20-10}px)`}}/> )}</div>
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

  const cards:Array<[string,string,string,'up'|'down'|'neutral']>=finance?[
    ['Portefeuille','12 450,00 €','+ 320,50 € · +2,64%','up'],
    ['EURUSD','1,0824','+ 1,8%','up'],
    ['XAUUSD','2 348,10','− 0,4%','down'],
    ['Win rate',`${winRate.toFixed(0)}%`,`${closed.length} trades clôturés`,'neutral'],
  ]:[
    ['Moyenne générale','15,2 / 20','↑ + 0,8 pts   vs. dernier mois','up'],
    ['Heures d’étude',`${Math.floor(study/60)||28} h ${String(study%60||30).padStart(2,'0')}`,'↑ + 12 %   vs. semaine dernière','up'],
    ['Devoirs restants',String(open||5),'↓ - 3   vs. semaine dernière','down'],
    ['Progression bac','62 %','↑ + 8 %   vs. mois dernier','up'],
  ];

  return <PageFrame>
    <section className="pw-dashboard reference-dashboard">
      <div className="dash-heading">
        <div><span>Bon retour, Alexandre.</span><h1>Discipline aujourd’hui, liberté demain.</h1></div>
        <div className="heading-tools"><div className="dash-date">Mercredi 12 mars 2025</div><button className="focus-pill">☼ <span>Focus</span>⌄</button></div>
      </div>

      <div className="summary-row reference-summary-row">
        {cards.map(([label,value,sub,state])=><div className="summary-card reference-summary-card" key={label}>
          <div className="summary-card-top"><span>{label}</span><span>•••</span></div>
          <div className="summary-value">{value}</div>
          <div className={`trend ${state}`}>{sub}</div>
          <Sparkline down={state==='down'}/>
        </div>)}
      </div>

      <div className="dashboard-core reference-core">
        <div className="main-panel reference-main-panel">{finance?<FinanceChart/>:<AcademicChart/>}</div>
        <div className="progress-panel reference-progress-panel">
          <div className="panel-title"><span className="panel-icon"><BookOpen size={17}/></span><strong>{finance?'Progression trading':'Progression académique'}</strong><button className="panel-open">↗</button></div>
          <div className="progress-top"><div className="progress-ring"><span>62%</span></div><p>{finance?'Maîtriser. Progresser. Construire.':'Sur la voie du bac.\nContinue sur cette lancée,\nchaque effort compte.'}</p></div>
          <div className="progress-list">
            {(finance?[['Parcours Trading',67],['Analyse technique',60],['Psychologie du trader',50],['Gestion du risque',42]]:academicSubjects.slice(0,4).map(x=>[x[0],x[2]] as [string,number])).map(([name,pct])=><div className="progress-item" key={name}><span>{name}</span><div><i style={{width:`${pct}%`}}/></div><small>{pct}%</small></div>)}
          </div>
        </div>
      </div>

      <div className="dashboard-bottom reference-bottom">
        <div className="bottom-card tasks-card"><div className="panel-title"><span className="panel-icon"><FileText size={17}/></span><strong>Tâches du jour</strong><small>{completed||3} / {tasks.length}</small></div><div className="task-list">{tasks.map(([title,time,done])=><div className="dash-task" key={title}><span className={done?'task-dot done':'task-dot'}>{done?'✓':''}</span><span>{title}</span><small>{time}</small></div>)}</div></div>
        <div className="bottom-card schedule-card"><div className="panel-title"><span className="panel-icon"><CalendarDays size={17}/></span><strong>{finance?'Planning':'Planning de la semaine'}</strong><small className="today-chip">Aujourd’hui</small></div><div className="timeline">{(finance?['Étude des marchés','Formation','Journal de trading','Backtest','Lecture']:['Mathématiques','Physique-Chimie','Déjeuner','Anglais','Révisions']).map((x,i)=><div key={x}><span>{['08:00','10:00','12:30','15:00','18:00'][i]}</span><i className={`timeline-dot dot-${i}`}/><div><strong>{x}</strong><small>{finance?'Session structurée':'Cours / session de travail'}</small></div></div>)}</div></div>
        <div className="bottom-card goals-card"><div className="panel-title"><span className="panel-icon"><Target size={17}/></span><strong>Mes objectifs</strong><span className="dots">•••</span></div><div className="goal-tabs"><span className="active">Court terme</span><span>Moyen terme</span><span>Long terme</span></div><div className="goal-list">{(finance?[["Obtenir une constance sur 3 mois",68],["Terminer l’académie",62],["Atteindre 25 000 €",50],["Développer une routine solide",80]]:[["Obtenir une moyenne générale ≥ 16",62],["Terminer tous mes devoirs à temps",80],["Réussir le bac avec mention",45],["Améliorer mon anglais (B2)",70]]).map(([g,p])=><div className="goal" key={String(g)}><span>{g}</span><small>{p}%</small><div><i style={{width:`${p}%`}}/></div></div>)}</div></div>
      </div>
    </section>
  </PageFrame>;
}

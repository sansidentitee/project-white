'use client';

import Link from 'next/link';
import { PageFrame } from '@/components/PageFrame';
import { NeuCard, SoftCard } from '@/components/Neu';
import { useProject } from '@/components/ProjectProvider';
import { tradePnl, useTrading } from '@/components/TradingProvider';
import { BookOpen, CalendarDays, TrendingUp, WalletCards, ArrowUpRight } from '@/components/icons';

export default function DashboardPage(){
  const {state}=useProject();
  const {trades}=useTrading();
  const openTasks=state.tasks.filter(t=>t.status!=='done').length;
  const now=Date.now();
  const studyWeek=state.sessions.filter(s=>now-new Date(s.startedAt).getTime()<604800000).reduce((sum,s)=>sum+s.durationMin,0);
  const weighted=state.grades.reduce((a,g)=>({points:a.points+(g.score/g.outOf*20)*g.coefficient,coef:a.coef+g.coefficient}),{points:0,coef:0});
  const average=weighted.coef?weighted.points/weighted.coef:0;
  const mastered=state.chapters.filter(c=>c.status==='mastered').length;
  const closed=trades.filter(t=>t.status==='closed');
  const pnl=closed.reduce((sum,t)=>sum+tradePnl(t),0);
  const wins=closed.filter(t=>tradePnl(t)>0).length;
  const winRate=closed.length?wins/closed.length*100:0;
  const openTrades=trades.filter(t=>t.status==='open').length;
  const chapterProgress=state.chapters.length?mastered/state.chapters.length*100:0;

  return <PageFrame>
    <div className="dashboard-welcome">
      <div><span className="eyebrow">PROJECT WHITE</span><h1>Bon retour.</h1><p>Deux domaines. Une seule discipline.</p></div>
      <div className="dashboard-date">{new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</div>
    </div>

    <div className="metric-grid">
      <SoftCard className="metric-card"><div className="metric-icon"><BookOpen size={19}/></div><span>Travail à faire</span><strong>{openTasks}</strong><small>tâches ouvertes</small></SoftCard>
      <SoftCard className="metric-card"><div className="metric-icon"><CalendarDays size={19}/></div><span>Étude cette semaine</span><strong>{Math.floor(studyWeek/60)}h {String(studyWeek%60).padStart(2,'0')}</strong><small>temps enregistré</small></SoftCard>
      <SoftCard className="metric-card"><div className="metric-icon"><TrendingUp size={19}/></div><span>P&L journal</span><strong>{pnl>=0?'+':''}{pnl.toFixed(2)} €</strong><small>{closed.length} trades clôturés</small></SoftCard>
      <SoftCard className="metric-card"><div className="metric-icon"><WalletCards size={19}/></div><span>Win rate</span><strong>{winRate.toFixed(0)}%</strong><small>{openTrades} position{openTrades>1?'s':''} suivie{openTrades>1?'s':''}</small></SoftCard>
    </div>

    <div className="dashboard-split">
      <NeuCard className="domain-card">
        <div className="domain-head"><div><span className="eyebrow">ACADÉMIQUE</span><h2>Avancer sans bruit.</h2></div><Link href="/today" className="round-link"><ArrowUpRight size={18}/></Link></div>
        <div className="domain-stats"><div><strong>{average?average.toFixed(1):'—'}</strong><span>Moyenne /20</span></div><div><strong>{mastered}</strong><span>Chapitres maîtrisés</span></div><div><strong>{state.subjects.length}</strong><span>Matières</span></div></div>
        <div className="quiet-progress"><i style={{width:`${Math.min(100,chapterProgress)}%`}}/></div>
        <p className="domain-note">Notes, tâches, planning et sessions de travail sont synchronisés avec ton compte.</p>
      </NeuCard>

      <NeuCard className="domain-card">
        <div className="domain-head"><div><span className="eyebrow">TRADING JOURNAL</span><h2>Observer. Noter. Corriger.</h2></div><Link href="/trading" className="round-link"><ArrowUpRight size={18}/></Link></div>
        <div className="domain-stats"><div><strong>{trades.length}</strong><span>Entrées</span></div><div><strong>{closed.length}</strong><span>Clôturées</span></div><div><strong>{pnl>=0?'+':''}{pnl.toFixed(0)} €</strong><span>P&L cumulé</span></div></div>
        <div className="trade-mini-list">
          {trades.slice(0,3).map(t=><div key={t.id}><span>{t.asset}</span><span>{t.direction==='long'?'Long':'Short'}</span><strong className={t.status==='closed'&&tradePnl(t)<0?'negative':'positive'}>{t.status==='closed'?`${tradePnl(t)>=0?'+':''}${tradePnl(t).toFixed(2)} €`:'ouverte'}</strong></div>)}
          {!trades.length&&<p className="muted">Aucun trade journalisé pour le moment.</p>}
        </div>
      </NeuCard>
    </div>

    <NeuCard className="quiet-banner"><span>Le tableau de bord privilégie les données utiles et masque le reste.</span><span className="muted">Blanc givré · neumorphism discret · option noire</span></NeuCard>
  </PageFrame>
}

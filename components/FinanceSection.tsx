'use client';
import { PageFrame } from '@/components/PageFrame';
import { TrendingUp, Target, BookOpen, CalendarDays, NotebookTabs } from '@/components/icons';

const iconMap={
  Analyses:TrendingUp, Journal:NotebookTabs, Planification:CalendarDays, Ressources:BookOpen, Objectifs:Target
} as const;

export function FinanceSection({title}:{title:keyof typeof iconMap}){
  const Icon=iconMap[title];
  const copy={
    Analyses:['Analyse technique','Structures de marché','Confluences','Scénarios'],
    Journal:['Journal quotidien','Erreurs récurrentes','Psychologie','Bilan hebdomadaire'],
    Planification:['Préparation de session','Watchlist','Backtests','Revue de semaine'],
    Ressources:['Cours','Notes','Playbooks','Archives'],
    Objectifs:['Régularité','Gestion du risque','Processus','Formation'],
  }[title];
  return <PageFrame>
    <section className="world-page">
      <div className="world-page-head"><span className="panel-icon"><Icon size={18}/></span><div><small>MONDE FINANCIER</small><h1>{title}</h1><p>Un espace structuré pour progresser par l’analyse, la répétition et le journal.</p></div></div>
      <div className="world-page-grid">{copy.map((x,i)=><div className="world-page-card" key={x}><span>0{i+1}</span><h2>{x}</h2><p>Module prêt à recevoir tes données et ta progression Supabase.</p><div className="quiet-progress"><i style={{width:`${22+i*17}%`}}/></div></div>)}</div>
    </section>
  </PageFrame>;
}

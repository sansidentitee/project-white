import Link from 'next/link';
import { BookOpen, CandlestickChart, NotebookPen, Target } from 'lucide-react';
import { PageFrame } from '@/components/PageFrame';

export default function FinancePage() {
  return <PageFrame>
    <div className="os-page-title"><h1>Finance</h1><p>Apprendre, documenter, analyser. Pas de bruit inutile.</p></div>
    <div className="os-card-grid">
      <Link href="/trading" className="os-card os-space-card"><CandlestickChart/><small>Formation</small><h2>Trading</h2><p>Comprendre les marchés et pratiquer sur données simulées.</p></Link>
      <Link href="/finance/journal" className="os-card os-space-card"><NotebookPen/><small>Processus</small><h2>Journal</h2><p>Consigner les hypothèses, erreurs et leçons.</p></Link>
      <Link href="/finance/analyses" className="os-card os-space-card"><BookOpen/><small>Étude</small><h2>Analyses</h2><p>Construire des analyses structurées plutôt que réagir au hasard.</p></Link>
      <Link href="/finance/goals" className="os-card os-space-card"><Target/><small>Direction</small><h2>Objectifs</h2><p>Mesurer surtout la qualité du processus d’apprentissage.</p></Link>
    </div>
  </PageFrame>;
}

'use client';
import Link from 'next/link';
import { useState } from 'react';
import { PageFrame } from './PageFrame';
import { useTrading, tradePnl, type Trade } from './TradingProvider';
import { BookOpen, TrendingUp, Plus } from 'lucide-react';

function JournalEntry({trade}:{trade:Trade}){
  const {updateTrade}=useTrading();
  const [note,setNote]=useState(trade.note || '');
  const [setup,setSetup]=useState(trade.setup || '');
  const [status,setStatus]=useState('');
  const [busy,setBusy]=useState(false);
  async function save(e:React.FormEvent){e.preventDefault();setBusy(true);setStatus('');try{await updateTrade(trade.id,{note,setup});setStatus('Enregistré.');}catch{setStatus('Enregistrement impossible. Réessaie.');}finally{setBusy(false);}}
  return <form className="nd-card nd-journal" onSubmit={save}><h2>{trade.asset} <small>{new Date(trade.openedAt).toLocaleDateString('fr-FR')}</small></h2><label>Setup<input value={setup} onChange={e=>setSetup(e.target.value)} placeholder="Structure, déclencheur, invalidation…"/></label><label>Bilan du trade<textarea value={note} onChange={e=>setNote(e.target.value)} rows={4} placeholder="Décision, émotions, points à améliorer…"/></label><button disabled={busy}>{busy?'Enregistrement…':'Enregistrer'}</button><span role="status">{status}</span></form>;
}

export function FinanceSection({title}:{title:'Analyses'|'Journal'|'Planification'|'Ressources'|'Objectifs'}){
  const {trades,loading}=useTrading();
  const closed=trades.filter(t=>t.status==='closed');
  const [asset,setAsset]=useState('all');
  const filtered=trades.filter(t=>asset==='all'||t.asset===asset);
  const assets=Array.from(new Set(trades.map(t=>t.asset)));
  const setups=Array.from(new Set(trades.map(t=>t.setup?.trim()).filter((s):s is string=>!!s)));
  return <PageFrame><section className="nd-records"><div className="nd-heading"><div><p>Monde financier</p><h1>{title}</h1></div><Link className="nd-focus" href="/trading"><Plus size={16}/>Ajouter un trade</Link></div>
    {loading?<div className="nd-empty" role="status">Chargement…</div>:title==='Journal'?<><select className="nd-select" aria-label="Filtrer le journal par actif" value={asset} onChange={e=>setAsset(e.target.value)}><option value="all">Tous les actifs</option>{assets.map(a=><option key={a}>{a}</option>)}</select><div className="nd-record-grid">{filtered.map(t=><JournalEntry key={t.id} trade={t}/>)}</div></>:title==='Analyses'?<div className="nd-record-grid">{assets.map(a=>{const list=closed.filter(t=>t.asset===a);const pnl=list.reduce((sum,t)=>sum+tradePnl(t),0);return <Link href="/trading" key={a} className="nd-card nd-record"><span className="nd-icon"><TrendingUp/></span><div><h2>{a}</h2><p>{pnl.toLocaleString('fr-FR',{maximumFractionDigits:2})} € réalisés</p><small>{list.length} clôturés · {list.length?Math.round(list.filter(t=>tradePnl(t)>0).length/list.length*100):0} % gagnants</small></div></Link>})}</div>:title==='Ressources'?<><p className="nd-record-help">Tes setups enregistrés, regroupés pour retrouver tes exemples et tes bilans.</p><div className="nd-record-grid">{setups.map(s=><Link href="/finance/journal" className="nd-card nd-record" key={s}><span className="nd-icon"><BookOpen/></span><div><h2>{s}</h2><p>{trades.filter(t=>t.setup?.trim()===s).length} trades associés</p></div></Link>)}</div>{!setups.length&&<div className="nd-empty">Ajoute un setup à un trade dans le journal.<Link href="/finance/journal">Ouvrir le journal</Link></div>}</>:title==='Planification'?<><p className="nd-record-help">Chronologie de tes sessions enregistrées.</p><div className="nd-record-grid">{[...trades].sort((a,b)=>Date.parse(b.openedAt)-Date.parse(a.openedAt)).map(t=><Link href="/finance/journal" key={t.id} className="nd-card nd-record"><div><small>{new Date(t.openedAt).toLocaleString('fr-FR')}</small><h2>{t.asset}</h2><p>{t.setup || 'Session de trading'} · {t.status==='open'?'Position ouverte':'Position clôturée'}</p></div></Link>)}</div></>:<div className="nd-card nd-empty">Tes objectifs suivent la progression de ton journal.<Link href="/dashboard#objectifs">Voir mes objectifs</Link></div>}
    {!loading&&!trades.length&&title!=='Objectifs'&&<div className="nd-card nd-empty">Ton espace est prêt. Ajoute un premier trade pour commencer.<Link href="/trading">Ouvrir le journal de trading</Link></div>}
  </section></PageFrame>;
}

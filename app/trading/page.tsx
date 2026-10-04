'use client';

import { useMemo, useState } from 'react';
import { PageFrame } from '@/components/PageFrame';
import { NeuCard, NeuButton } from '@/components/Neu';
import { tradePnl, TradeDirection, useTrading } from '@/components/TradingProvider';
import { ArrowDownRight, ArrowUpRight, Trash2 } from '@/components/icons';

export default function TradingPage(){
  const {trades,addTrade,closeTrade,removeTrade,demoMode}=useTrading();
  const [asset,setAsset]=useState('EURUSD');
  const [direction,setDirection]=useState<TradeDirection>('long');
  const [entry,setEntry]=useState('');
  const [quantity,setQuantity]=useState('1');
  const [setup,setSetup]=useState('');
  const [note,setNote]=useState('');
  const [closing,setClosing]=useState<Record<string,string>>({});

  const stats=useMemo(()=>{
    const closed=trades.filter(t=>t.status==='closed');
    const pnl=closed.reduce((a,t)=>a+tradePnl(t),0);
    const wins=closed.filter(t=>tradePnl(t)>0).length;
    return {closed,pnl,winRate:closed.length?wins/closed.length*100:0,open:trades.filter(t=>t.status==='open').length};
  },[trades]);

  async function submit(e:React.FormEvent){
    e.preventDefault();
    const price=Number(entry),qty=Number(quantity);
    if(!asset.trim() || !Number.isFinite(price) || price<=0 || !Number.isFinite(qty) || qty<=0) return;
    await addTrade({asset:asset.trim().toUpperCase(),direction,entry:price,quantity:qty,setup:setup||null,note:note||null,exit:null});
    setEntry('');setSetup('');setNote('');
  }

  return <PageFrame>
    <div className="page-head trading-head"><div><span className="eyebrow">JOURNAL PERSONNEL</span><h1>Trading</h1><p>Analyser et documenter, sans exécuter d’ordre.</p></div><span className="status-chip">{demoMode?'Mode local':'Synchronisé'}</span></div>

    <div className="metric-grid trading-metrics">
      <div className="metric-card soft-card"><span>Trades suivis</span><strong>{trades.length}</strong><small>{stats.open} ouverts</small></div>
      <div className="metric-card soft-card"><span>Trades clôturés</span><strong>{stats.closed.length}</strong><small>journal complet</small></div>
      <div className="metric-card soft-card"><span>Win rate</span><strong>{stats.winRate.toFixed(0)}%</strong><small>sur les trades clôturés</small></div>
      <div className="metric-card soft-card"><span>P&L journal</span><strong className={stats.pnl<0?'negative':'positive'}>{stats.pnl>=0?'+':''}{stats.pnl.toFixed(2)} €</strong><small>calcul manuel</small></div>
    </div>

    <div className="trading-layout">
      <NeuCard className="journal-card">
        <div className="section-title"><div><h2>Journal</h2><p className="muted">Entrées enregistrées sur ton compte.</p></div></div>
        <div className="trade-table">
          <div className="trade-row trade-row-head"><span>Actif</span><span>Sens</span><span>Entrée</span><span>Sortie</span><span>Résultat</span><span/></div>
          {trades.map(t=><div className="trade-row" key={t.id}>
            <div><strong>{t.asset}</strong><small>{t.setup||'Sans setup'}</small></div>
            <span className="direction-cell">{t.direction==='long'?<ArrowUpRight size={15}/>:<ArrowDownRight size={15}/>} {t.direction}</span>
            <span>{t.entry}</span>
            <span>{t.status==='closed'?t.exit:<input className="mini-input" placeholder="sortie" value={closing[t.id]||''} onChange={e=>setClosing(v=>({...v,[t.id]:e.target.value}))}/>}</span>
            <strong className={tradePnl(t)<0?'negative':'positive'}>{t.status==='closed'?`${tradePnl(t)>=0?'+':''}${tradePnl(t).toFixed(2)} €`:'ouverte'}</strong>
            <div className="row-actions">{t.status==='open'&&<button className="tiny-button" onClick={()=>{const x=Number(closing[t.id]);if(Number.isFinite(x)&&x>0)closeTrade(t.id,x)}}>Clôturer</button>}<button className="icon-ghost" aria-label="Supprimer" onClick={()=>removeTrade(t.id)}><Trash2 size={15}/></button></div>
          </div>)}
          {!trades.length&&<div className="empty-state">Le journal est vide. Ajoute une première observation à droite.</div>}
        </div>
      </NeuCard>

      <NeuCard className="trade-form-card">
        <span className="eyebrow">NOUVELLE ENTRÉE</span>
        <h2>Journaliser un trade</h2>
        <p className="muted">Suivi et analyse uniquement. Aucun ordre n’est envoyé à un broker.</p>
        <form onSubmit={submit} className="trade-form">
          <label>Actif<input value={asset} onChange={e=>setAsset(e.target.value)} placeholder="EURUSD"/></label>
          <div className="form-two">
            <label>Sens<select value={direction} onChange={e=>setDirection(e.target.value as TradeDirection)}><option value="long">Long</option><option value="short">Short</option></select></label>
            <label>Quantité<input inputMode="decimal" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label>
          </div>
          <label>Prix d’entrée<input inputMode="decimal" value={entry} onChange={e=>setEntry(e.target.value)} placeholder="1.0824"/></label>
          <label>Setup<input value={setup} onChange={e=>setSetup(e.target.value)} placeholder="Pullback, breakout…"/></label>
          <label>Note<textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Contexte, invalidation, émotion…"/></label>
          <NeuButton type="submit">Ajouter au journal</NeuButton>
        </form>
      </NeuCard>
    </div>
  </PageFrame>
}

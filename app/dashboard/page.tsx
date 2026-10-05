'use client';

import Link from 'next/link';
import { useEffect, useState, type CSSProperties } from 'react';
import { ArrowUpRight, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, FileText, GraduationCap, Plus, Sun, Target, TrendingUp, Trophy, WalletCards } from 'lucide-react';
import { PageFrame } from '@/components/PageFrame';
import { useProject } from '@/components/ProjectProvider';
import { useAuth } from '@/components/AuthProvider';
import { tradePnl, useTrading } from '@/components/TradingProvider';
import { useWorld } from '@/components/WorldProvider';
import { generalAverage, subjectAverage } from '@/lib/grades';

const colors = ['#7bb7ff', '#a065ff', '#ed659e', '#f3be52', '#5bdd95', '#52dce0', '#a6bfdf'];
const number = (n: number, digits = 1) => n.toLocaleString('fr-FR', { maximumFractionDigits: digits });
const pct = (part: number, total: number) => total ? Math.round(part / total * 100) : 0;
const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
const clock = (date: string) => new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

function MiniChart({ values, bars = false, red = false }: { values: number[]; bars?: boolean; red?: boolean }) {
  const max = Math.max(...values, 1), min = Math.min(...values, 0), span = max - min || 1;
  const points = values.map((v, i) => `${5 + i / Math.max(values.length - 1, 1) * 115},${48 - (v - min) / span * 39}`).join(' ');
  return <svg className={`nd-spark ${red ? 'negative' : ''}`} viewBox="0 0 125 55" aria-hidden="true">
    {bars ? values.map((v, i) => <rect key={i} x={i * 12 + 3} y={48 - v / max * 40} width="6" height={Math.max(2, v / max * 40)} rx="2" opacity={.45 + i / Math.max(values.length, 1) * .55} />) : <><polyline points={points} />{values.length > 0 && <circle cx={values.length === 1 ? 5 : 120} cy={48 - (values[values.length - 1] - min) / span * 39} r="2.6" />}</>}
  </svg>;
}

export default function DashboardPage() {
  const { world } = useWorld();
  const finance = world === 'finance';
  const { user } = useAuth();
  const { state, loading, demoMode, updateTask } = useProject();
  const { trades, loading: tradesLoading } = useTrading();
  const [months, setMonths] = useState(3);
  const [subjectId, setSubjectId] = useState('all');
  const [dayOffset, setDayOffset] = useState(0);
  const [goalTerm, setGoalTerm] = useState(0);
  const [pendingTask, setPendingTask] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => { setToday(new Date()); }, []);
  if (!today) return <PageFrame><div className="nd-empty" role="status">Chargement du tableau de bord…</div></PageFrame>;
  const selectedDay = new Date(today); selectedDay.setDate(today.getDate() + dayOffset);
  const cutoff = new Date(today); cutoff.setMonth(cutoff.getMonth() - months);
  const name = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || (demoMode ? 'Alexandre' : '');
  const average = generalAverage(state.grades);
  const study = state.sessions.reduce((sum, s) => sum + s.durationMin, 0);
  const openTasks = state.tasks.filter(t => t.status !== 'done');
  const mastered = state.chapters.filter(c => ['solid', 'mastered'].includes(c.status)).length;
  const progress = pct(mastered, state.chapters.length);
  const closed = trades.filter(t => t.status === 'closed').sort((a, b) => Date.parse(a.closedAt || a.openedAt) - Date.parse(b.closedAt || b.openedAt));
  const pnl = closed.reduce((sum, t) => sum + tradePnl(t), 0);
  const wins = closed.filter(t => tradePnl(t) > 0).length;
  const winRate = pct(wins, closed.length);
  const financeProgress = pct(trades.filter(t => t.note?.trim() || t.setup?.trim()).length, trades.length);
  const subjects = state.subjects.map((s, i) => {
    const chapters = state.chapters.filter(c => c.subjectId === s.id);
    return { ...s, average: subjectAverage(state.grades, s.id), progress: pct(chapters.filter(c => ['solid', 'mastered'].includes(c.status)).length, chapters.length), color: colors[i % colors.length] };
  });
  const grades = state.grades.filter(g => g.outOf > 0 && g.coefficient > 0 && (subjectId === 'all' || g.subjectId === subjectId) && Date.parse(g.takenAt) >= cutoff.getTime()).sort((a, b) => Date.parse(a.takenAt) - Date.parse(b.takenAt));
  const gradePoints = grades.map((g, i) => ({ date: g.takenAt, value: generalAverage(grades.slice(0, i + 1)) ?? 0, label: g.title }));
  let cumulative = 0;
  const tradePoints = closed.map(t => ({ date: t.closedAt || t.openedAt, value: cumulative += tradePnl(t), label: t.asset })).filter(p => Date.parse(p.date) >= cutoff.getTime());
  const points = finance ? tradePoints : gradePoints;
  const chartMax = finance ? Math.max(...points.map(p => p.value), 1) : 20;
  const chartMin = finance ? Math.min(...points.map(p => p.value), 0) : 0;
  const timeSpan = today.getTime() - cutoff.getTime();
  const coords = points.map(p => ({ ...p, x: 8 + Math.max(0, Math.min(1, (Date.parse(p.date) - cutoff.getTime()) / timeSpan)) * 604, y: 192 - (p.value - chartMin) / (chartMax - chartMin) * 180 }));
  const line = coords.map(p => `${p.x},${p.y}`).join(' ');
  const todayTasks = state.tasks.filter(t => t.plannedStart && dayKey(new Date(t.plannedStart)) === dayKey(today));
  const visibleTasks = (todayTasks.length ? todayTasks : state.tasks).slice(0, 5);
  const scheduled = state.tasks.filter(t => t.plannedStart && dayKey(new Date(t.plannedStart)) === dayKey(selectedDay)).sort((a, b) => Date.parse(a.plannedStart!) - Date.parse(b.plannedStart!));
  const dailyTrades = trades.filter(t => dayKey(new Date(t.openedAt)) === dayKey(selectedDay));
  const cards = finance ? [
    { label: 'Résultat réalisé', value: `${number(pnl, 2)} €`, sub: `${closed.length} trades clôturés`, icon: WalletCards, values: closed.map(tradePnl), href: '/trading', red: pnl < 0 },
    { label: 'Positions ouvertes', value: String(trades.length - closed.length), sub: 'Dans ton journal de trading', icon: TrendingUp, values: trades.slice(0, 10).map(t => t.quantity), href: '/trading', bars: true },
    { label: 'Trades gagnants', value: String(wins), sub: `${closed.length - wins} autres trades clôturés`, icon: Trophy, values: closed.slice(-10).map(t => Math.max(0, tradePnl(t))), href: '/finance/analyses', bars: true },
    { label: 'Taux de réussite', value: `${winRate} %`, sub: 'Sur les trades clôturés', icon: Target, values: closed.map((_, i) => pct(closed.slice(0, i + 1).filter(t => tradePnl(t) > 0).length, i + 1)), href: '/finance/journal' }
  ] : [
    { label: 'Moyenne générale', value: average === null ? '— / 20' : `${number(average)} / 20`, sub: `${state.grades.length} notes enregistrées`, icon: GraduationCap, values: gradePoints.map(p => p.value), href: '/notes' },
    { label: 'Heures d’étude', value: `${Math.floor(study / 60)} h ${String(study % 60).padStart(2, '0')}`, sub: `${state.sessions.length} séances de concentration`, icon: Clock3, values: state.sessions.slice(0, 10).reverse().map(s => s.durationMin), href: '/work', bars: true },
    { label: 'Devoirs restants', value: String(openTasks.filter(t => t.kind === 'homework').length), sub: `${openTasks.length} tâches à accomplir`, icon: FileText, values: state.tasks.slice(0, 10).map(t => t.status === 'done' ? 0 : t.durationMin), href: '/today', bars: true, red: true },
    { label: 'Progression bac', value: `${progress} %`, sub: `${mastered} / ${state.chapters.length} chapitres solides`, icon: Target, values: subjects.map(s => s.progress), href: '/subjects' }
  ];
  const goals = finance ? [
    [{ title: 'Documenter chaque trade', value: financeProgress, href: '/finance/journal' }, { title: 'Revoir les positions clôturées', value: pct(closed.filter(t => t.note?.trim()).length, closed.length), href: '/finance/journal' }],
    [{ title: 'Construire un journal de 20 trades', value: Math.min(100, pct(trades.length, 20)), href: '/trading' }],
    [{ title: 'Analyser 100 trades clôturés', value: Math.min(100, closed.length), href: '/finance/analyses' }]
  ] : [
    [{ title: 'Obtenir une moyenne générale ≥ 16', value: Math.min(100, pct(average ?? 0, 16)), href: '/notes' }, { title: 'Terminer tous mes devoirs', value: pct(state.tasks.filter(t => t.kind === 'homework' && t.status === 'done').length, state.tasks.filter(t => t.kind === 'homework').length), href: '/today' }, { title: 'Consolider mes chapitres', value: progress, href: '/subjects' }, { title: 'Atteindre 10 heures de travail', value: Math.min(100, pct(study, 600)), href: '/work' }],
    [{ title: 'Atteindre 25 heures de travail', value: Math.min(100, pct(study, 1500)), href: '/work' }, { title: 'Maîtriser tous mes chapitres', value: pct(state.chapters.filter(c => c.status === 'mastered').length, state.chapters.length), href: '/subjects' }],
    [{ title: 'Préparer le bac : chapitres solides', value: progress, href: '/subjects' }, { title: 'Construire 100 heures de pratique', value: Math.min(100, pct(study, 6000)), href: '/work' }]
  ];
  async function toggleTask(id: string, done: boolean) {
    setPendingTask(id); setError('');
    try { await updateTask(id, { status: done ? 'todo' : 'done' }); }
    catch { setError('La tâche n’a pas pu être enregistrée. Réessaie.'); }
    finally { setPendingTask(null); }
  }
  return <PageFrame><section className="nd-dashboard" aria-busy={loading || tradesLoading}>
    <header className="nd-heading"><div><p>Bon retour{name ? `, ${name}` : ''}.{demoMode && <span className="nd-demo">Démo locale</span>}</p><h1>Discipline <span>aujourd’hui, liberté demain.</span></h1></div><div className="nd-heading-tools"><time dateTime={today.toISOString()}>{today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</time><Link className="nd-focus" href="/work"><Sun size={18} />Focus<ChevronRight size={14} /></Link></div></header>
    <div className="nd-kpis">{cards.map(({ label, value, sub, icon: Icon, values, href, bars, red }) => <Link className="nd-card nd-kpi" href={href} key={label}><div className="nd-kpi-label"><span className="nd-icon"><Icon size={23} /></span><h2>{label}</h2><ArrowUpRight size={15} className="nd-more" /></div><strong>{loading || tradesLoading ? '…' : value}</strong><p className={red ? 'nd-red' : ''}>{sub}</p><MiniChart values={values.slice(-10)} bars={bars} red={red} /></Link>)}</div>
    <div className="nd-core"><section className="nd-card nd-chart"><div className="nd-panel-head"><h2><span className="nd-icon"><TrendingUp size={22} /></span>{finance ? 'Évolution du résultat réalisé' : 'Évolution de mes notes'}</h2><div className="nd-chart-controls">{!finance && <select aria-label="Matière du graphique" value={subjectId} onChange={e => setSubjectId(e.target.value)}><option value="all">Toutes les matières</option>{subjects.map(s => <option value={s.id} key={s.id}>{s.name}</option>)}</select>}<div className="nd-tabs" aria-label="Période du graphique">{[1, 3, 6, 12].map(m => <button aria-pressed={months === m} className={months === m ? 'selected' : ''} key={m} onClick={() => setMonths(m)}>{m === 12 ? '1A' : `${m}M`}</button>)}</div></div></div>
      <div className="nd-chart-body"><div className="nd-plot"><div className="nd-y-axis">{[1, .75, .5, .25, 0].map(r => <span key={r}>{number(chartMin + (chartMax - chartMin) * r, finance ? 2 : 0)}</span>)}</div><div className="nd-grid" />{points.length ? <svg viewBox="0 0 620 205" preserveAspectRatio="none" role="img" aria-label={finance ? 'Résultat cumulé des trades clôturés' : 'Moyenne cumulée des notes de la période'}><defs><linearGradient id="nd-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#75b0ff" stopOpacity=".3" /><stop offset="1" stopColor="#75b0ff" stopOpacity="0" /></linearGradient></defs><polygon points={`${line} ${coords[coords.length - 1].x},205 ${coords[0].x},205`} fill="url(#nd-fill)" /><polyline className="nd-chart-line" points={line} />{coords.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3.4"><title>{p.label} · {number(p.value)}{finance ? ' €' : ' / 20'}</title></circle>)}</svg> : <div className="nd-empty">{finance ? 'Tes trades clôturés dessineront ta courbe.' : 'Ajoute des notes pour voir ta progression.'}<Link href={finance ? '/trading' : '/notes'}>Ajouter {finance ? 'un trade' : 'une note'} <Plus size={14} /></Link></div>}{points.length > 0 && <span className="nd-chart-badge">{number(points[points.length - 1].value)}{finance ? ' €' : ''}</span>}<div className="nd-x-axis"><span>{cutoff.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span><span>{today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span></div></div><aside className="nd-legend"><h3>{finance ? 'Résultat par actif' : 'Moyenne par matière'}</h3>{finance ? Array.from(new Set(trades.map(t => t.asset))).slice(0, 7).map((asset, i) => <Link href="/trading" key={asset}><i style={{ background: colors[i % colors.length] }} /><span>{asset}</span><b>{number(closed.filter(t => t.asset === asset).reduce((sum, t) => sum + tradePnl(t), 0), 2)} €</b></Link>) : subjects.slice(0, 7).map(s => <Link href={`/subjects/${s.id}`} key={s.id}><i style={{ background: s.color }} /><span>{s.name}</span><b>{s.average === null ? '—' : number(s.average)}</b></Link>)}{finance && trades.length === 0 && <p>Aucun actif enregistré.</p>}</aside></div>
    </section><section className="nd-card nd-progress"><div className="nd-panel-head"><h2><span className="nd-icon"><Target size={23} /></span>{finance ? 'Discipline de trading' : 'Progression académique'}</h2><Link className="nd-small-button" href={finance ? '/finance/journal' : '/subjects'} aria-label="Voir ma progression"><ArrowUpRight size={17} /></Link></div><div className="nd-progress-top"><div className="nd-ring" style={{ '--progress': `${finance ? financeProgress : progress}%` } as CSSProperties}><span>{finance ? financeProgress : progress}%</span></div><p><strong>{finance ? 'Un processus solide.' : 'Sur la voie du bac.'}</strong>{finance ? 'Documente tes décisions, analyse tes résultats.' : 'Continue sur cette lancée, chaque effort compte.'}</p></div><div className="nd-progress-list">{(finance ? [{ name: 'Trades documentés', progress: financeProgress, id: 'journal' }, { name: 'Trades avec un setup', progress: pct(trades.filter(t => t.setup?.trim()).length, trades.length), id: 'analyses' }, { name: 'Bilans après clôture', progress: pct(closed.filter(t => t.note?.trim()).length, closed.length), id: 'journal-2' }] : subjects.slice(0, 4)).map((s, i) => <Link href={finance ? '/finance/journal' : `/subjects/${s.id}`} key={s.id}><span className="nd-subject-icon">{['∑', '♧', '◎', '▤'][i]}</span><span>{s.name}</span><div className="nd-track"><i style={{ width: `${s.progress}%` }} /></div><small>{s.progress} %</small></Link>)}</div></section></div>
    <div className="nd-bottom"><section className="nd-card nd-tasks"><div className="nd-panel-head"><h2><span className="nd-icon"><FileText size={21} /></span>{finance ? 'Derniers trades' : todayTasks.length ? 'Tâches du jour' : 'Mes tâches'}</h2><Link className="nd-small-button" href={finance ? '/trading' : '/today'} aria-label={finance ? 'Voir tous les trades' : 'Voir toutes les tâches'}><ArrowUpRight size={17} /></Link></div>{error && <p role="alert" className="nd-error">{error}</p>}<div className="nd-task-list">{finance ? trades.slice(0, 5).map(t => <Link className="nd-task" href="/trading" key={t.id}><span className={`nd-check ${t.status === 'closed' ? 'done' : ''}`}>{t.status === 'closed' && <Check size={14} />}</span><span>{t.asset}<small>{t.direction === 'long' ? 'Achat' : 'Vente'} · {t.status === 'closed' ? 'Clôturé' : 'Ouvert'}</small></span><time>{t.status === 'closed' ? `${number(tradePnl(t), 2)} €` : number(t.entry, 4)}</time></Link>) : visibleTasks.map(t => <div className="nd-task" key={t.id}><button className={`nd-check ${t.status === 'done' ? 'done' : ''}`} aria-label={`${t.status === 'done' ? 'Rouvrir' : 'Terminer'} : ${t.title}`} aria-pressed={t.status === 'done'} disabled={pendingTask !== null} onClick={() => toggleTask(t.id, t.status === 'done')}>{t.status === 'done' && <Check size={15} />}</button><Link href={`/work?task=${t.id}`}>{t.title}</Link><time>{t.plannedStart ? clock(t.plannedStart) : `${t.durationMin} min`}</time></div>)}{(finance ? !trades.length : !visibleTasks.length) && <div className="nd-empty">{finance ? 'Ton journal commence ici.' : 'Tout est à jour.'}<Link href={finance ? '/trading' : '/today'}>Ajouter {finance ? 'un trade' : 'une tâche'} <Plus size={14} /></Link></div>}</div></section>
    <section className="nd-card nd-schedule"><div className="nd-panel-head"><h2><span className="nd-icon"><CalendarDays size={21} /></span>Planning</h2><div className="nd-day-controls"><button className="nd-day" onClick={() => setDayOffset(0)}>{dayOffset === 0 ? 'Aujourd’hui' : selectedDay.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</button><button className="nd-small-button" aria-label="Jour précédent" onClick={() => setDayOffset(v => v - 1)}><ChevronLeft size={16} /></button><button className="nd-small-button" aria-label="Jour suivant" onClick={() => setDayOffset(v => v + 1)}><ChevronRight size={16} /></button></div></div><div className="nd-timeline">{(finance ? dailyTrades.map(t => ({ id: t.id, title: t.asset, date: t.openedAt, detail: t.setup || 'Session de trading' })) : scheduled.map(t => ({ id: t.id, title: state.subjects.find(s => s.id === t.subjectId)?.name || t.title, date: t.plannedStart!, detail: t.title }))).slice(0, 5).map((t, i) => <Link href={finance ? '/trading' : '/planning'} key={t.id} style={{ '--event-color': colors[i % colors.length] } as CSSProperties}><time>{clock(t.date)}</time><i /><div><strong>{t.title}</strong><small>{t.detail}</small></div></Link>)}{(finance ? !dailyTrades.length : !scheduled.length) && <div className="nd-empty">Une journée à organiser.<Link href={finance ? '/trading' : '/planning'}>Ouvrir le planning <ChevronRight size={14} /></Link></div>}</div></section>
    <section className="nd-card nd-goals" id="objectifs"><div className="nd-panel-head"><h2><span className="nd-icon"><Target size={23} /></span>Mes objectifs</h2><span className="nd-subtle">{goals[goalTerm].length}</span></div><div className="nd-goal-tabs">{['Court terme', 'Moyen terme', 'Long terme'].map((term, i) => <button key={term} className={goalTerm === i ? 'selected' : ''} aria-pressed={goalTerm === i} onClick={() => setGoalTerm(i)}>{term}</button>)}</div><div className="nd-goal-list">{goals[goalTerm].map((g, i) => <Link href={g.href} key={g.title}><span className="nd-goal-icon">{i === 0 ? <Trophy size={19} /> : i === 1 ? <FileText size={19} /> : <Target size={19} />}</span><div><span>{g.title}</span><div className="nd-track"><i style={{ width: `${g.value}%` }} /></div></div><small>{g.value} %</small></Link>)}</div></section></div>
  </section></PageFrame>;
}

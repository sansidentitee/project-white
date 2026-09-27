import { Subject, Task, TaskKind } from './types';
import { daysUntil } from './date';

const dayNames: Record<string, number> = { dimanche:0, lundi:1, mardi:2, mercredi:3, jeudi:4, vendredi:5, samedi:6 };

function nextDay(day: number) {
  const now = new Date();
  let delta = (day - now.getDay() + 7) % 7;
  if (delta === 0) delta = 7;
  const d = new Date(now);
  d.setDate(now.getDate()+delta);
  d.setHours(20,0,0,0);
  return d;
}

function parseDue(line: string) {
  const lower = line.toLowerCase();
  if (/demain/.test(lower)) {
    const d = new Date(); d.setDate(d.getDate()+1); d.setHours(20,0,0,0); return d;
  }
  for (const [name, day] of Object.entries(dayNames)) if (lower.includes(name)) return nextDay(day);
  const match = lower.match(/\b(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?\b/);
  if (match) {
    const year = match[3] ? Number(match[3].length===2 ? `20${match[3]}` : match[3]) : new Date().getFullYear();
    const d = new Date(year, Number(match[2])-1, Number(match[1]), 20, 0, 0, 0);
    return d;
  }
  return null;
}

function detectKind(line: string): TaskKind {
  const l = line.toLowerCase();
  if (/contr[oô]le|ds\b|évaluation|interro|oral/.test(l)) return 'exam';
  if (/dm\b|devoir|ex(?:ercice)?s?\b|à rendre/.test(l)) return 'homework';
  if (/révis|apprendre|relire|fiche/.test(l)) return 'study';
  return 'homework';
}

function duration(line: string, kind: TaskKind) {
  const m = line.match(/(\d{1,3})\s*(?:min|mn)/i);
  if (m) return Math.max(10, Number(m[1]));
  if (kind === 'exam') return 60;
  if (kind === 'study') return 30;
  return 45;
}

export function parsePronoteText(text: string, subjects: Subject[]): Omit<Task,'id'>[] {
  return text.split(/\n+/).map(s=>s.trim()).filter(Boolean).map(line => {
    const lower = line.toLowerCase();
    const subject = subjects.find(s => lower.includes(s.name.toLowerCase()) || lower.includes(s.shortName.toLowerCase()) || aliases(s.name).some(a=>lower.startsWith(a)));
    const due = parseDue(line);
    const kind = detectKind(line);
    const remaining = subject ? line.replace(new RegExp(subject.name, 'i'),'').replace(new RegExp(subject.shortName, 'i'),'').trim().replace(/^[-:–—]+/,'').trim() : line;
    const urgency = due ? daysUntil(due.toISOString()) : 99;
    return {
      subjectId: subject?.id ?? null,
      title: remaining || line,
      details: 'Import Pronote',
      kind,
      dueAt: due?.toISOString() ?? null,
      plannedStart: null,
      durationMin: duration(line, kind),
      status: 'todo' as const,
      quadrant: urgency <= 2 ? 'do' as const : 'schedule' as const,
      priority: kind === 'exam' ? 4 : urgency <= 2 ? 4 : urgency <= 5 ? 3 : 2
    };
  });
}

function aliases(name: string) {
  const n = name.toLowerCase();
  if (n.includes('maths expertes')) return ['maths exp','expert','me '];
  if (n.includes('math')) return ['maths ','math '];
  if (n.includes('physique')) return ['pc ','physique ','chimie '];
  if (n.includes('histoire')) return ['histoire ','hg '];
  if (n.includes('philosophie')) return ['philo '];
  if (n === 'svt') return ['svt '];
  return [n+' '];
}

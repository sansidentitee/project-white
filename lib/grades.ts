import { Grade } from './types';
export function subjectAverage(grades: Grade[], subjectId: string) {
  const list = grades.filter(g => g.subjectId === subjectId);
  if (!list.length) return null;
  const totalWeight = list.reduce((s,g)=>s+g.coefficient,0);
  const value = list.reduce((s,g)=>s+(g.score/g.outOf*20)*g.coefficient,0)/totalWeight;
  return Math.round(value*10)/10;
}
export function generalAverage(grades: Grade[]) {
  if (!grades.length) return null;
  const subjects = Array.from(new Set(grades.map(g=>g.subjectId)));
  const avgs = subjects.map(id=>subjectAverage(grades,id)).filter((v):v is number=>v!==null);
  return avgs.length ? Math.round((avgs.reduce((a,b)=>a+b,0)/avgs.length)*10)/10 : null;
}

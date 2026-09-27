import { Task } from './types';
import { daysUntil } from './date';

export function taskScore(t: Task) {
  const due = daysUntil(t.dueAt);
  const dueScore = due <= 0 ? 100 : due <= 1 ? 80 : due <= 3 ? 55 : due <= 7 ? 30 : 10;
  const kind = t.kind === 'exam' ? 35 : t.kind === 'homework' ? 20 : 10;
  const status = t.status === 'blocked' ? 20 : t.status === 'partial' ? 12 : 0;
  return dueScore + kind + status + t.priority * 8;
}

export function sortedOpenTasks(tasks: Task[]) {
  return tasks.filter(t=>t.status!=='done' && t.quadrant!=='eliminate').sort((a,b)=>taskScore(b)-taskScore(a));
}

export function autoPlan(tasks: Task[]) {
  const slots: Date[] = [];
  const start = new Date();
  start.setMinutes(0,0,0);
  for (let day=0; day<14; day++) {
    const d = new Date(start); d.setDate(start.getDate()+day);
    const weekend = d.getDay()===0 || d.getDay()===6;
    const hours = weekend ? [10,12,15,17] : [17,18,19,20];
    for (const h of hours) { const s = new Date(d); s.setHours(h,0,0,0); if (s>new Date()) slots.push(s); }
  }
  const planned = new Set(tasks.filter(t=>t.plannedStart).map(t=>new Date(t.plannedStart!).getTime()));
  let cursor=0;
  return sortedOpenTasks(tasks).map(task=>{
    if (task.plannedStart || task.kind==='event') return task;
    while (cursor<slots.length && planned.has(slots[cursor].getTime())) cursor++;
    const slot = slots[cursor++];
    if (!slot) return task;
    planned.add(slot.getTime());
    return {...task, plannedStart: slot.toISOString()};
  });
}

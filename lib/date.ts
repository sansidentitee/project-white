const DAYS = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
const MONTHS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

export function longDate(date = new Date()) {
  return `${DAYS[date.getDay()][0].toUpperCase()}${DAYS[date.getDay()].slice(1)} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function shortDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 4)}.`;
}

export function daysUntil(value?: string | null) {
  if (!value) return 999;
  const now = new Date();
  now.setHours(0,0,0,0);
  const due = new Date(value);
  due.setHours(0,0,0,0);
  return Math.ceil((due.getTime() - now.getTime()) / 86400000);
}

export function weekDates(base = new Date()) {
  const day = base.getDay() || 7;
  const monday = new Date(base);
  monday.setDate(base.getDate() - day + 1);
  monday.setHours(0,0,0,0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function sameDay(a: Date, b: Date) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

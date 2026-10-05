import { ProjectState } from './types';

const today = new Date();
const iso = (d: Date) => d.toISOString();
const plusDays = (n: number, hour = 18) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return iso(d);
};
const id = (s: string) => `demo-${s}`;

export const demoState: ProjectState = {
  subjects: [
    { id: id('math'), name: 'Mathématiques', shortName: 'Maths', icon: 'sigma' },
    { id: id('pc'), name: 'Physique-Chimie', shortName: 'PC', icon: 'flask' },
    { id: id('expert'), name: 'Maths expertes', shortName: 'Expert', icon: 'sigma' },
    { id: id('history'), name: 'Histoire-Géographie', shortName: 'H-G', icon: 'book' },
    { id: id('philo'), name: 'Philosophie', shortName: 'Philo', icon: 'file' },
    { id: id('english'), name: 'Anglais', shortName: 'Anglais', icon: 'languages' },
    { id: id('spanish'), name: 'Espagnol', shortName: 'Espagnol', icon: 'languages' }
  ],
  chapters: [
    { id: id('c1'), subjectId: id('math'), title: 'Suites numériques', status: 'solid' },
    { id: id('c2'), subjectId: id('math'), title: 'Récurrence', status: 'reinforce' },
    { id: id('c3'), subjectId: id('pc'), title: 'Transformations et cinétique', status: 'reinforce' },
    { id: id('c4'), subjectId: id('expert'), title: 'Nombres complexes', status: 'learning' },
    { id: id('c5'), subjectId: id('history'), title: 'Les totalitarismes', status: 'solid' },
    { id: id('c6'), subjectId: id('philo'), title: 'La condition humaine', status: 'learning' }
  ],
  tasks: [
    { id: id('t1'), subjectId: id('expert'), title: 'Complexes — exercices ciblés', kind: 'study', dueAt: plusDays(2, 8), plannedStart: plusDays(0, 18), durationMin: 45, status: 'todo', quadrant: 'do', priority: 4 },
    { id: id('t2'), subjectId: id('pc'), title: 'Reprendre les erreurs du contrôle', kind: 'study', dueAt: plusDays(3, 8), plannedStart: plusDays(0, 19), durationMin: 50, status: 'todo', quadrant: 'do', priority: 4 },
    { id: id('t3'), subjectId: id('history'), title: 'Fiche totalitarismes', kind: 'study', dueAt: plusDays(5, 8), plannedStart: plusDays(1, 18), durationMin: 30, status: 'partial', quadrant: 'schedule', priority: 2 },
    { id: id('t4'), subjectId: id('philo'), title: 'Relire le cours et construire un plan', kind: 'homework', dueAt: plusDays(7, 8), plannedStart: plusDays(2, 18), durationMin: 60, status: 'todo', quadrant: 'schedule', priority: 3 },
    { id: id('t5'), subjectId: id('math'), title: 'Automatismes exponentielle', kind: 'study', dueAt: plusDays(4, 8), durationMin: 35, status: 'todo', quadrant: 'schedule', priority: 3 }
  ],
  grades: [
    { id: id('g1'), subjectId: id('math'), title: 'DS Suites', score: 16.5, outOf: 20, coefficient: 1, takenAt: plusDays(-14) },
    { id: id('g2'), subjectId: id('pc'), title: 'Premier contrôle', score: 13, outOf: 20, coefficient: 1, takenAt: plusDays(-9) },
    { id: id('g3'), subjectId: id('expert'), title: 'Complexes', score: 3.5, outOf: 5, coefficient: .25, takenAt: plusDays(-5) },
    { id: id('g4'), subjectId: id('philo'), title: 'Dissertation', score: 17, outOf: 20, coefficient: 1, takenAt: plusDays(-11) },
    { id: id('g5'), subjectId: id('english'), title: 'Compréhension', score: 4, outOf: 5, coefficient: .25, takenAt: plusDays(-4) }
  ],
  sessions: [
    { id: id('s1'), taskId: id('t1'), subjectId: id('expert'), startedAt: plusDays(-1, 18), endedAt: plusDays(-1, 18), durationMin: 45, outcome: 'partial' },
    { id: id('s2'), taskId: id('t2'), subjectId: id('pc'), startedAt: plusDays(-2, 19), endedAt: plusDays(-2, 19), durationMin: 35, outcome: 'partial' }
  ],
  resources: [],
  errors: [
    { id:id('e1'), subjectId:id('expert'), title:'Confusion sur les puissances de i', details:'Automatisme trop lent sous pression.', correction:'Réduire l’exposant modulo 4 avant tout calcul.', status:'review', nextReviewAt:plusDays(0,18) },
    { id:id('e2'), subjectId:id('pc'), title:'Tableau d’avancement mal exploité', details:'Lecture trop rapide de la stœchiométrie.', correction:'Écrire les rapports n/a avant de conclure.', status:'open', nextReviewAt:plusDays(1,18) }
  ],
  goals: [
    { id:id('goal1'), title:'Zéro retard cette semaine', details:'Terminer les tâches avant leur échéance.', targetValue:0, currentValue:0, unit:'retard', dueAt:plusDays(7,20), status:'active' }
  ],
  preferences:{averageGoal:18}
};

# Project White

Project White est un environnement scolaire minimaliste blanc/noir/or basé sur Next.js + TypeScript + Supabase, conçu pour réduire la saisie quotidienne et accélérer le passage au travail réel.

## Fonctionnalités

- Authentification Supabase (inscription, connexion, déconnexion)
- Row Level Security : chaque compte ne voit que ses données
- Dashboard `Aujourd’hui` avec travail recommandé, prochaines tâches, échéances et temps de travail
- Planning semaine/mois, glisser-déposer des blocs, échéances et matrice de priorités
- Saisie rapide type Pronote : plusieurs lignes sont parsées en matière, consigne, type, date et durée
- Organisation automatique de la semaine selon urgence/priorité
- Matières avec moyennes, chapitres, statuts de maîtrise, notes et ressources
- Upload de fichiers dans Supabase Storage
- Mode Travail avec sessions 25/45/60/90/libre, pause, fin de session et résultat (terminé/partiel/à reprendre/bloqué)
- Historique des sessions et reprise des tâches
- Command bar globale `Ctrl/Cmd + K`
- Ajout rapide global
- Mode démo automatique en local si Supabase n'est pas configuré
- Responsive desktop/tablette/mobile

## 1. GitHub Codespaces / local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Sans `.env.local`, le site fonctionne en **mode démo local** avec `localStorage`.

## 2. Supabase

1. Crée un projet Supabase.
2. Ouvre **SQL Editor** et exécute `supabase/migrations/001_project_white.sql`.
3. Dans **Project Settings > API**, copie l'URL du projet et la clé `anon`.
4. Crée `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

5. Dans **Authentication > URL Configuration**, ajoute les URLs locales et Vercel autorisées.
6. Pour une inscription sans confirmation e-mail en développement, tu peux temporairement désactiver "Confirm email" dans Supabase Auth. En production, garde la confirmation.

## 3. Vercel

1. Pousse le dossier sur GitHub.
2. Importe le dépôt dans Vercel.
3. Ajoute `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans **Project Settings > Environment Variables**.
4. Déploie. La commande de build est automatiquement `npm run build`.
5. Ajoute l'URL Vercel finale dans les URLs autorisées de Supabase Auth.

## Architecture des données

- `subjects`
- `chapters`
- `tasks`
- `grades`
- `work_sessions`
- `resources`
- `profiles`
- bucket Storage `resources`

Toutes les tables sont protégées par RLS et liées à `auth.uid()`.

## Notes sur l'import Pronote

La V1 ne dépend pas d'une API privée/fragile de Pronote. Tu colles ou écris des lignes telles que :

```text
Maths ex 12-18 jeudi 45 min
PC contrôle vendredi
Histoire apprendre partie 3 lundi
```

Le parseur déduit automatiquement la matière, la date, le type, une durée par défaut et une priorité. Cette approche reste robuste même si Pronote change son interface.

## Deployment

Production is deployed from `main` on Vercel. Supabase public environment variables are configured in Vercel for production, preview, and development.

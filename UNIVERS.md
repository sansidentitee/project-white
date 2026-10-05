# Project White — Islam, Finance et Santé

Les trois pages d’attente sont remplacées par des espaces fonctionnels. Le projet existant, ses thèmes blanc glacier/noir profond, ses données académiques et ses configurations Supabase/Vercel sont conservés. Finance reste consacré au trading et à la formation, conformément au choix utilisateur.

## Islam

- Accueil : prières du jour, minutes de Coran sur sept jours, passages à revoir et objectifs actifs.
- Prières : cinq cases quotidiennes, choix d’une date passée et historique de sept jours. Aucun horaire religieux n’est inventé.
- Coran : historique de lecture/mémorisation/révision avec durée, référence, pages et notes ; édition et corbeille.
- Mémorisation : passages personnels et réponses Encore/Difficile/Bien/Facile. L’intervalle augmente ; Encore revient après dix minutes. Les échéances sont datées et les passages dus peuvent être filtrés.
- Apprentissage : cours, source, progression, état et notes personnelles.

## Finance

- Accueil : positions suivies, win rate, formation et prochaines séances.
- Journal de trading existant : entrées conservées ; ajout, clôture, setup et notes. Les prix avec virgule sont acceptés. Les erreurs de sauvegarde sont affichées et les boutons empêchent les doubles envois.
- Analyses : filtre par actif, P&L cumulé brut, résultat moyen, win rate, profit factor et baisse depuis un sommet. Les trades ouverts ne sont pas inclus dans les résultats clôturés. Frais et conversions de devises ne sont pas simulés ; les unités de cotation restent explicites.
- Bilans : notes et setup des positions déjà enregistrées.
- Planification : véritables sessions datées, heure, durée, type et état.
- Formation : cours, sources, progression, notes et état.
- Calculateur de taille : calcul théorique à partir du capital, du risque choisi, du prix et du stop ; aucune exécution d’ordre ni recommandation de pourcentage.
- Bibliothèque : ressources importées et setups retrouvés depuis le journal.

## Santé

- Accueil : indicateurs des sept derniers jours, bilan quotidien, habitudes et séances.
- Bilan : sommeil, eau, pas, énergie, humeur et notes de repas/ressenti/récupération. Un champ vide reste inconnu et n’est pas traité comme zéro.
- Activité : séances datées, durée, activité, effort ressenti et détails, avec édition.
- Habitudes : création, pause, cases quotidiennes et nombre de jours consécutifs. Retirer une habitude ne détruit pas ses anciennes cases.
- Journal personnel daté et modifiable.

## Fonctions communes

Chaque univers possède ses objectifs avec cible/progression/unité/échéance, ses liens et fichiers, son export JSON, sa corbeille et son guide. Les nouvelles suppressions déplacent les éléments dans la corbeille et la restauration conserve les fichiers. La suppression historique d’un trade reste définitive et demande une confirmation dans l’application.

La navigation latérale, les onglets sur mobile et la palette Ctrl/Cmd+K s’adaptent à l’univers. Les touches 1 à 5 ouvrent ses cinq premières sections. Les raccourcis académiques d’ajout restent réservés à l’Académie ; les champs de saisie protègent toujours les raccourcis globaux. Les animations respectent la préférence de réduction des mouvements.

## Données et migration

`20261005194056_personal_universes.sql` est appliquée au projet Supabase existant. Elle ajoute `life_entries` avec droits d’accès par utilisateur, séparation par univers, archivage et unicité des suivis quotidiens. Les tables et données existantes restent intactes. Le nouveau bucket `life-resources` est privé, limité à 2 Mo par fichier et protégé par le dossier de l’utilisateur. Le téléchargement utilise une URL signée de courte durée, selon la [documentation Supabase](https://supabase.com/docs/reference/javascript/storage-from-createsignedurl).

`20261005194611_personal_universes_permissions.sql` reste **non appliquée** : le contrôle automatique demande une autorisation explicite pour restreindre les privilèges hérités du rôle `authenticated` à SELECT/INSERT/UPDATE sur la seule table `life_entries`. La RLS est déjà active et aucune politique DELETE n’est accordée. Cette restriction complémentaire doit être approuvée avant application.

Sans configuration Supabase, les espaces utilisent une nouvelle sauvegarde locale versionnée et n’écrasent pas les anciennes clés de l’Académie ou du trading. Sur un projet configuré, une session expirée n’est jamais remplacée silencieusement par une sauvegarde invitée. Les chargements échoués disposent d’une action Réessayer.

L’audit Supabase retrouve uniquement le réglage préexistant de [protection contre les mots de passe compromis](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection), non modifié.

## Vérification et livraison

- Build et vérification des types.
- 14 tests automatisés : Académie, dates/DST, séries d’habitudes, valeurs Santé manquantes, révision à heure précise, validation des entrées, statistiques de positions longues/courtes et calcul de taille.
- Tests navigateur sur données fictives locales : prières puis rechargement, Coran et révision Bien, bilan Santé puis rechargement, création/case/restauration d’habitude, ajout/clôture de trade avec décimales françaises, analyses, formation, planification, objectif à 20 %, ressource puis renommage/rechargement, palette et raccourcis dans les champs.
- Import de fichier local puis rechargement vérifiés ; le nom saisi reste conservé lors du choix du type Fichier. Affichage mobile à 390 px contrôlé dans les trois univers sans débordement horizontal.
- Aucun message d’erreur console observé sur les parcours contrôlés.
- Les parcours cloud avec compte connecté et import privé Storage ne sont pas vérifiés de bout en bout faute de session utilisateur dans le navigateur de test. Schéma, RLS et policies Storage sont contrôlés par requêtes.

Ces ajouts complètent la branche de la PR #1. La production sur `project-white.vercel.app` reste en attente d’une autorisation explicite de sortir la PR du brouillon et la fusionner dans `main`.

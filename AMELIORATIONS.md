# Améliorations des quatre univers

## Ajouts

- Accueil global Aujourd’hui avec études, prières, passages à revoir, sessions Finance et habitudes Santé ; accessible depuis chaque univers.
- Recherche globale dans titres, notes, chapitres, ressources et journaux, avec filtrage par univers et recherche sans accents. Le contenu binaire des documents n’est pas analysé.
- Plan de révision académique ordonné selon les contrôles des quatorze prochains jours, les erreurs dues, les échecs et l’état des chapitres. Ajout direct au planning avec prévention des doublons.
- Parcours de mémorisation, objectif sur sept jours glissants et historique des cent dernières réponses par passage. Les nouvelles réponses sont enregistrées avec le passage en une seule sauvegarde.
- Journal trading : risque initial, frais, résultat en R, plan, respect du plan, émotions, leçon et captures avant/après. Les prix, frais et risque doivent utiliser la même unité ; aucun ordre financier n’est exécuté.
- Formation : cours existants, modules associés, notes, exercices avec auto-évaluation et quiz personnels. Les réponses persistent ; modifier une question invalide ses anciens résultats. Progression par cours et validation du module.
- Santé : trente jours de sommeil, énergie, humeur, eau et activité, tableau des valeurs et bilan hebdomadaire des habitudes. Les champs manquants restent inconnus.
- État de sauvegarde commun : en cours, enregistré localement ou sur le compte, échec. Annulation pendant cinq minutes de la dernière modification réversible. Les nouveaux éléments des univers personnels sont archivés lors d’une annulation ; les suppressions historiques définitives ne proposent pas d’annulation.
- Actualisation manuelle et au retour dans l’application, sans remplacer les formulaires pendant une actualisation normale. Les données académiques sont chargées par pages de mille lignes ; les réponses d’un ancien compte sont ignorées.

## Conservation et limites

Aucune nouvelle table, migration, dépendance ou configuration n’est nécessaire. Les ajouts utilisent les entrées personnelles et les données existantes, avec les règles d’accès par compte déjà actives. Le durcissement de permissions précédemment refusé reste non appliqué.

L’annulation est disponible pour les modifications académiques, les bilans/clôtures du journal trading, ainsi que les ajouts/modifications/retraits des entrées personnelles. Les anciennes suppressions définitives et les créations académiques ne sont pas annulables. Les données restent consultables après rechargement ; l’annulation temporaire ne persiste pas après rechargement.

La synchronisation repose sur Supabase et une actualisation au retour ou sur demande, sans promesse de fusion automatique de modifications simultanées. Un compte connecté et deux appareils sont nécessaires pour la validation finale de ce parcours.

## Vérifications

Vingt et un tests automatiques couvrent la logique académique, les données des univers, les révisions, le calcul de R, les valeurs Santé manquantes, les quiz et la recherche. La compilation des 37 pages réussit. Vérifiés dans le navigateur avec des données fictives : historique de mémorisation après rechargement, tendances Santé, quiz et invalidation après modification, résultat de trading en R, import de capture, recherche, annulation, planification sans doublon et actualisation entre deux onglets. Aucune erreur console sur les parcours contrôlés. La synchronisation authentifiée sur deux appareils reste à vérifier avec le compte connecté. Un test de régression empêche les écritures locales identiques de déclencher une boucle entre onglets.

Pagination vérifiée avec la [documentation Supabase](https://supabase.com/docs/reference/javascript/range).

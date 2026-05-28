# SmartCampus — Spécifications fonctionnelles

**Module :** Projet Web Dynamique 2026  
**Équipe :** Youva Hachichi  
**Date :** 28 mai 2026

---

## 1. Contexte et vision du projet

SmartCampus est une plateforme de gestion académique pour une école d'ingénieurs (type ECE). Elle centralise les interactions entre trois catégories d'acteurs :

- **Étudiants** : accès à leur cursus, notes, présences, emploi du temps, messagerie
- **Enseignants** : gestion pédagogique, saisie de notes, suivi des présences
- **Administrateurs** : pilotage global (étudiants, enseignants, cours, statistiques)

**Établissement cible :** École d'ingénieurs pluridisciplinaire (informatique, mathématiques, physique, économie)  
**Public prioritaire :** Étudiants (licence L1–L3, master M1–M2)

---

## 2. Rôles et permissions

| Fonctionnalité | Étudiant | Enseignant | Admin |
|---|:---:|:---:|:---:|
| Connexion / déconnexion | ✅ | ✅ | ✅ |
| Voir son tableau de bord | ✅ | ✅ | ✅ |
| Consulter l'emploi du temps | ✅ | ✅ | ✅ |
| Consulter ses cours inscrits | ✅ | — | — |
| S'inscrire / se désinscrire d'un cours | ✅ | — | — |
| Consulter ses notes | ✅ | — | — |
| Consulter ses présences | ✅ | — | — |
| Envoyer/recevoir des messages | ✅ | ✅ | ✅ |
| Voir les notifications | ✅ | ✅ | ✅ |
| Saisir les notes | — | ✅ | — |
| Faire l'appel (QR code) | — | ✅ | — |
| Gérer les étudiants (CRUD) | — | — | ✅ |
| Gérer les enseignants | — | — | ✅ |
| Créer / désactiver des cours | — | — | ✅ |
| Voir les statistiques globales | — | — | ✅ |

---

## 3. Fonctionnalités détaillées

### 3.1 Authentification

- Connexion par email + mot de passe (bcrypt)
- Sessions PHP avec HttpOnly cookies
- Déconnexion sécurisée (destruction de session)
- Toutes les routes API vérifiées par `AuthMiddleware`
- Redirection automatique selon le rôle après connexion

### 3.2 Gestion des étudiants

- **Création** : formulaire admin (nom, prénom, email, numéro étudiant, niveau, filière, date naissance)
- **Consultation** : fiche détaillée avec parcours académique, notes, inscriptions
- **Modification** : édition des informations personnelles et académiques
- **Suppression** : suppression en cascade (notes, inscriptions, présences)
- **Filtres** : recherche par nom, niveau, filière, statut (inscrit / suspendu / diplômé)
- **Statistiques** : moyenne générale calculée dynamiquement

### 3.3 Gestion des enseignants

- **Liste** avec répartition par département, nombre de cours actifs
- **Détail** : profil, cours responsables, grade
- **Association** cours-enseignant à la création du cours

### 3.4 Gestion des cours

- **Création** : code unique, nom, niveau, semestre, département, enseignant, capacité max
- **Liste** avec occupation (nb inscrits / capacité max), barre de progression colorée
- **Désactivation** (soft delete, `actif = 0`)
- **Séances** : récurrentes par jour de semaine, heure début/fin, salle, type (CM/TD/TP/Examen)

### 3.5 Inscriptions aux cours

- **Auto-inscription étudiant** depuis le catalogue des cours disponibles
- **Désinscription** depuis la page "Mes cours"
- **Règles métier** :
  - Impossibilité de s'inscrire deux fois (contrainte UNIQUE en base)
  - Contrôle de la capacité maximale (HTTP 400 si plein)
  - Statut "Complet" affiché si `nb_inscrits >= capacite_max`

### 3.6 Gestion des notes

- **Saisie enseignant** : par cours → évaluation → liste étudiants avec champ note
- **Verrouillage** : évaluation verrouillée (`verrouille = 1`) → notes non modifiables
- **Consultation étudiant** : par cours avec coefficient, type d'évaluation, moyenne
- **Calcul de moyenne** : pondéré par coefficient, affiché par cours et globalement

### 3.7 Suivi des présences

**Côté enseignant (Feuille d'appel) :**
- Sélection du cours → sélection de la séance
- Génération d'un QR code unique (code de session aléatoire)
- Timer 5 minutes pour la phase de scan
- Grille étudiants avec boutons P/A/R/E (Présent/Absent/Retard/Excusé)
- "Marquer tous présents" / "Confirmer les absences" / "Clôturer"
- Envoi en base via `POST /api/presences/upsert`

**Côté étudiant (Mes présences) :**
- Taux d'assiduité global avec barre colorée
- Heatmap des 90 derniers jours
- Répartition par cours (barres de progression)
- Historique détaillé des séances

### 3.8 Emploi du temps

- Vue semaine avec navigation (semaine précédente / suivante / aujourd'hui)
- Affichage des dates réelles (lundi 26 mai, mardi 27 mai…)
- Séances colorées par type (CM=bleu, TD=violet, TP=vert, Examen=rouge)
- Filtrage automatique selon le rôle (étudiant voit ses cours, enseignant les siens)
- Mise en évidence de la journée actuelle

### 3.9 Messagerie

- Conversations groupées par interlocuteur
- Liste avec avatar coloré, dernier message, timestamp relatif, badge non-lus
- Envoi avec Entrée (Shift+Entrée = saut de ligne)
- Nouveau message : sélection du destinataire depuis les contacts
- Rafraîchissement automatique toutes les 10 secondes

### 3.10 Notifications

- Types : note publiée, absence enregistrée, nouveau cours, changement emploi du temps
- Badge de notifications non lues dans la sidebar et header
- Marquer tout comme lu
- Couleurs par type, timestamps relatifs

### 3.11 Tableaux de bord

**Étudiant :** cours du jour avec statut (EN COURS / DANS Xmin / TERMINÉ), notes récentes, taux de présence, notifications non lues

**Enseignant :** cours actifs, notes à saisir, étudiants à surveiller (> 3 absences), séances du jour, évaluations en attente

**Admin :** 6 KPIs (étudiants, enseignants, cours, inscriptions, notes, absences), graphe SVG d'occupation des cours, derniers inscrits, cours populaires

---

## 4. Règles métier implémentées

| Règle | Implémentation |
|---|---|
| Pas de double inscription | `UNIQUE KEY (etudiant_id, cours_id)` + vérification en PHP |
| Capacité maximale | Vérification `countInscrits >= capacite_max` avant insertion |
| Verrouillage des notes | Champ `verrouille` dans `evaluations`, vérifié au frontend et backend |
| Restriction par rôle | `AuthMiddleware::hasRole()` sur chaque route sensible |
| Alerte absences | Requête `etudiantsARisque` dans le dashboard enseignant (> 3 absences) |
| Notes entre 0 et 20 | Contrainte `CHECK (note >= 0 AND note <= 20)` en base + validation PHP |

---

## 5. Architecture technique

### Backend (PHP 8.2+ MVC)

```
backend/
├── public/index.php         # Point d'entrée unique (Front Controller)
├── routes/api.php           # Routeur REST (match/pattern matching)
├── app/
│   ├── Controllers/         # Logique métier, réponses JSON
│   ├── Models/              # Accès BDD via PDO (requêtes préparées)
│   └── Middleware/          # Auth (session, rôle)
└── config/database.php      # Singleton de connexion PDO
```

**Choix techniques :**
- Pas de framework → compréhension complète du flux requête-réponse
- PDO avec requêtes préparées → protection SQL injection
- Sessions PHP côté serveur → pas de JWT côté client
- Architecture MVC → séparation claire des responsabilités

### Frontend (React 19 + TypeScript)

```
frontend/src/
├── pages/          # Une page par fonctionnalité
├── components/     # Layout, PrivateRoute, composants réutilisables
├── context/        # AuthContext (état utilisateur global)
├── api/client.ts   # Axios avec baseURL et credentials
└── router.tsx      # Routes privées + protection par rôle
```

**Choix techniques :**
- React Query (TanStack) → cache, refetch automatique, mutations
- Vite → build rapide, proxy dev vers PHP
- TypeScript → typage fort, détection d'erreurs à la compilation
- Inline styles avec design tokens → cohérence visuelle sans dépendance CSS-in-JS

### Base de données (MySQL 8)

13 tables : `roles`, `utilisateurs`, `etudiants`, `enseignants`, `cours`, `salles`, `seances`, `inscriptions`, `evaluations`, `notes`, `presences`, `notifications`, `messages`

**Contraintes d'intégrité :**
- Clés étrangères avec ON DELETE CASCADE pour les entités dépendantes
- UNIQUE sur emails, numéros étudiants/enseignants, (etudiant, cours), (etudiant, évaluation)
- ENUM pour les types contraints (statuts, types de séances)

---

## 6. Décisions de conception et compromis

### Ce qui a été simplifié
- **Pas de groupes/promotions** : les inscriptions se font directement cours par cours
- **Pas de gestion de semestres multiples** : une seule année académique active
- **Messagerie sans pièces jointes** : texte uniquement
- **Emploi du temps sans drag & drop** : consultation seule, modification via admin

### Difficultés rencontrées
- **Contrainte UNIQUE presences** : la contrainte initiale `(etudiant_id, seance_id)` empêchait d'enregistrer plusieurs occurrences historiques. Résolution : ajout de `date_seance` dans la clé unique.
- **Sessions PHP côté CORS** : configuration des headers CORS et cookies `SameSite=None` nécessaire pour le proxy Vite.
- **profil_id en session** : `etudiant_id` / `enseignant_id` non disponible dans `me()`, causant des appels admin-only depuis le frontend. Résolution : stockage du `profil_id` en session dès la connexion.

### Limites actuelles
- Pas d'authentification à deux facteurs
- Pas de pagination côté backend (OK pour ~100 étudiants, limiterait à grande échelle)
- Pas de WebSockets → rafraîchissement polling (10-30s) pour messagerie/notifications
- Pas de génération de relevé PDF (fonctionnalité optionnelle non implémentée)

---

## 7. Répartition prévisionnelle du travail

| Membre | Domaine principal |
|---|---|
| Youva Hachichi | Architecture globale, backend PHP, base de données, frontend admin |
| [Membre 2] | Frontend étudiant, pages notes, présences |
| [Membre 3] | Frontend enseignant, emploi du temps, messagerie |
| [Membre 4] | Tests, documentation, seed data |

---

## 8. Technologies utilisées

| Technologie | Version | Rôle |
|---|---|---|
| PHP | 8.2 | Backend MVC |
| MySQL | 8.0 | Base de données |
| React | 19 | UI frontend |
| TypeScript | 5.x | Typage statique |
| Vite | 6.x | Build & dev server |
| TailwindCSS | 3.x | Utilitaires CSS |
| React Query | 5.x | Gestion état serveur |
| React Router | 6.x | Routing SPA |
| Axios | 1.x | Client HTTP |
| qrcode.react | 4.x | Génération QR codes |
| Playfair Display | — | Typographie titres |

---

## 9. Journal d'assistance IA

**Outils utilisés :** Claude (Anthropic) via Claude Code CLI

**Tâches assistées :**
- Génération des contrôleurs PHP (AuthController, DashboardController, PresenceController, MessageController)
- Création des composants React (pages, layout, navigation)
- Rédaction des requêtes SQL complexes (mesCours, bilanEtudiant, dashboard stats)
- Seed data : génération de 106 étudiants, 768 présences, 744 notes avec distribution gaussienne
- Debugging : contrainte UNIQUE presences, CORS sessions, profil_id en session

**Réponses utiles :**
- Architecture MVC PHP sans framework → structure Controllers/Models/Middleware claire
- Distribution Box-Muller pour des notes réalistes (gaussienne centrée par cours)
- QRCodeSVG de qrcode.react pour la feuille d'appel

**Ajustements nécessaires :**
- La contrainte UNIQUE initiale sur presences (etudiant_id, seance_id) ne permettait pas l'historique → modifiée pour inclure date_seance
- Les routes emploi du temps appelaient des endpoints admin-only (`/etudiants`, `/enseignants`) pour récupérer le profil_id → corrigé en stockant profil_id en session PHP
- L'IA suggérait `ALTER TABLE ADD COLUMN IF NOT EXISTS` non supporté par MySQL 8 → remplacé par deux requêtes séparées avec gestion d'erreur

**Limites observées :**
- L'IA ne peut pas exécuter directement les migrations DB → intervention manuelle requise
- Certaines requêtes SQL générées dépassaient les capacités de MySQL (sous-requêtes trop imbriquées) → simplifiées
- Le code généré suppose parfois des dépendances non installées → vérification des package.json nécessaire

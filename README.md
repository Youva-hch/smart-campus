# SmartCampus

Application de gestion académique universitaire — architecture client-serveur avec backend PHP MVC et frontend React TypeScript.

## Stack technique

| Couche | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite, TailwindCSS v3, React Query v5, React Router v6 |
| Backend | PHP 8.2+ vanilla (architecture MVC, sans framework) |
| Base de données | MySQL 8+ |
| HTTP Client | Axios |
| Auth | Sessions PHP + HttpOnly cookies |

## Prérequis

- PHP 8.2+
- MySQL 8+
- Node.js 18+
- npm 9+

---

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/Youva-hch/smart-campus.git
cd smart-campus
```

### 2. Base de données

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p smart_campus < database/seed.sql
```

> Le script `schema.sql` crée la base `smart_campus` et toutes les tables.  
> Le script `seed.sql` insère les données de test (comptes, cours, étudiants, notes, présences, messages).

### 3. Configuration du backend

Copiez et adaptez le fichier de configuration :

```bash
cp backend/config/database.example.php backend/config/database.php
```

Éditez `backend/config/database.php` :

```php
return [
    'host'     => 'localhost',
    'dbname'   => 'smart_campus',
    'username' => 'root',
    'password' => 'votre_mot_de_passe',
    'charset'  => 'utf8mb4',
];
```

### 4. Lancer le backend PHP

```bash
cd backend
php -S localhost:8000 -t public
```

Le backend écoute sur `http://localhost:8000`.

### 5. Lancer le frontend

```bash
cd frontend
npm install
npm run dev
```

Le frontend est accessible sur `http://localhost:5173`.

> Le proxy Vite redirige automatiquement `/api/*` vers `http://localhost:8000/api/*` (configuré dans `vite.config.ts`).

---

## Comptes de test

| Rôle | Email | Mot de passe |
|---|---|---|
| Administrateur | admin@polynum.fr | admin123 |
| Enseignant | prof.martin@polynum.fr | prof123 |
| Étudiant | alice.dupont@etu.polynum.fr | etudiant123 |

---

## Architecture

```
smart-campus/
├── backend/
│   ├── public/          # Point d'entrée (index.php)
│   ├── app/
│   │   ├── Controllers/ # Logique métier (AuthController, CoursController, etc.)
│   │   ├── Models/      # Accès base de données (PDO)
│   │   └── Middleware/  # AuthMiddleware (sessions, rôles)
│   ├── config/          # Configuration DB
│   └── routes/
│       └── api.php      # Routage REST
├── frontend/
│   ├── src/
│   │   ├── pages/       # Composants de pages (Dashboard, Cours, Notes, etc.)
│   │   ├── components/  # Layout, PrivateRoute, UI
│   │   ├── context/     # AuthContext (état global utilisateur)
│   │   ├── api/         # Client Axios
│   │   └── router.tsx   # Routes React
│   └── vite.config.ts
└── database/
    ├── schema.sql        # Structure complète de la base
    └── seed.sql          # Données de test
```

---

## Fonctionnalités implémentées

### Authentification
- Connexion / déconnexion avec sessions PHP sécurisées
- Accès différencié par rôle (admin / enseignant / étudiant)
- Protection de toutes les routes sensibles

### Espace étudiant
- Tableau de bord (cours du jour, notes récentes, présences)
- Mes cours (cours inscrits avec moyenne, avancement, prochaine séance)
- Inscription / désinscription aux cours disponibles
- Notes & relevé (par cours, par évaluation, avec coefficients)
- Mes présences (taux global, heatmap 90j, historique)
- Emploi du temps (navigation semaine par semaine)
- Messagerie (conversations, envoi, réception temps réel)
- Notifications

### Espace enseignant
- Tableau de bord (cours, étudiants à risque, évaluations en attente)
- Saisie des notes (par cours, par évaluation, avec verrouillage)
- Feuille d'appel (QR code, timer 5 min, statuts P/A/R/E)
- Emploi du temps

### Espace administrateur
- Pilotage académique (KPIs, graphe occupation, activité)
- Gestion des étudiants (CRUD, filtres, note moyenne)
- Corps enseignant (répartition par département, nb cours)
- Cours & UE (création, désactivation, occupation)

### Règles métier
- Pas de double inscription (contrainte UNIQUE en base)
- Contrôle de la capacité maximale des cours
- Verrouillage des notes après validation
- Restriction des actions selon les rôles
- Alerte étudiants à risque (absences excessives)

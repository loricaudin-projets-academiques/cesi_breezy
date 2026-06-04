# Breezy  (Projet Académique CESI)

Breezy est une application distribuée en cours de développement, structurée sous la forme d'un monorepo contenant un frontend et un backend découpé en microservices (API et Authentification) orchestrés par Docker et une passerelle Nginx (API Gateway).

---

##  Architecture Globale du Projet

Le projet s'organise en plusieurs répertoires clés :

*   breezy-front : L'application Frontend (base de projet Node.js).
*   breezy-back : L'application Backend divisée en plusieurs services :
    *   api-service : Service d'API principal écrit en Node.js (Express), gérant la logique métier principale.
    *   auth-service : Service d'authentification autonome (préparé avec Express, Sequelize, PostgreSQL, bcrypt et JWT).
    *   gateway : Configuration Nginx agissant comme reverse-proxy / API Gateway.
*   docker-compose.yml : Fichier d'orchestration Docker pour démarrer et lier tous les services backend dans des conteneurs isolés.

---

##  Structure Interne de l'API (`api-service`)

L'API principale (`api-service`) suit une architecture en couches propre et modulaire sous le dossier `src/` :

```text
api-service/src/
├── config/             # Configuration globale (ex: base de données)
│   └── database.js     # Connexion à la base de données (À compléter)
├── controllers/        # Contrôleurs gérant les requêtes/réponses HTTP
├── models/             # Modèles de données (représentation BDD)
├── routes/             # Déclaration et routage des points d'accès API
├── services/           # Logique métier et règles de gestion
├── tests/              # Tests unitaires et d'intégration
└── index.js            # Point d'entrée principal de l'application
```

Des dossiers `example (to remove)` ont été ajoutés dans chaque couche pour illustrer l'organisation du code et faciliter l'implémentation de futures fonctionnalités.

---

##  Configuration & Lancement

### Prérequis
*   [Docker](https://www.docker.com/) et Docker Compose installés sur votre machine.
*   [Node.js](https://nodejs.org/) (Version 23+) pour le développement local hors conteneurs.

### Premier démarrage des Services avec Docker

Pour lancer l'environnement backend (API et Gateway Nginx) avec rechargement automatique (Hot Reload) grâce aux volumes partagés :

1. Ouvrez un terminal à la racine du projet.
2. Lancez la commande suivante :
   ```bash
   docker compose up --build
   ```

Une fois démarré :
*   **L'API Gateway (Nginx)** écoute sur le port **`80`** (`http://localhost`).
*   Toutes les requêtes dirigées vers `http://localhost/api/` sont redirigées vers l'**`api-service`** sur son port interne `3000`.
*   Toutes les requêtes dirigées vers `http://localhost/auth/` sont configurées pour être redirigées vers le service d'authentification.

---

##  État Actuel & Prochaines Étapes

### Réalisé :
- [x] Initialisation de l'arborescence `breezy-back`.
- [x] Configuration de Docker Compose (liaison Gateway Nginx/API).
- [x] Création du serveur de base Express dans `api-service` (Hello World opérationnel).
- [x] Mise en place de la structure en couches (MVC/Clean Architecture) avec placeholders pour `api-service`.
- [x] Configuration des dépendances clés pour l'authentification (`auth-service`).


### Reste à faire :
- [ ] Connecter et configurer la base de données PostgreSQL dans `api-service/src/config/database.js`.
- [ ] Développer les modèles, services et contrôleurs dans `api-service`.
- [ ] Implémenter le service d'authentification (`auth-service`) et l'implémenter dans Docker Compose.
- [ ] Mettre à jour `breezy-back/gateway/nginx.conf` pour rediriger `/auth/` vers le conteneur `auth-service` (actuellement redirigé vers l'api principale en guise de placeholder).
- [ ] Initialiser et développer le frontend dans `breezy-front`.
- [ ] Réaliser les différentes fonctionnalités dans `breezy-front` + `breezy-back`.
- [ ] Configuration des dépendances clés pour l'authentification (`auth-service`).
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

##  Configuration & Lancement

### Prérequis
*   [Docker](https://www.docker.com/) et Docker Compose installés sur votre machine.
*   [Node.js](https://nodejs.org/) (Version 23+) pour le développement local hors conteneurs.

### Premier démarrage

Pour lancer l'environnement backend (API et Gateway Nginx) avec rechargement automatique (Hot Reload) grâce aux volumes partagés :

1. Ouvrez un terminal à la racine du projet.
2. Lancez la commande suivante :
   ```bash
   docker compose up
   ```

Pour lancer l'environnement frontend avec rechargement automatique :

1. Ouvrez un terminal à la racine du projet.
2. Lancez les commandes suivantes :
   ```bash
   npm install
   npm run dev
   ```

Une fois démarré :
*   **Le site frontend écoute sur le port **`3000`** (`http://localhost:3000`).
*   **L'API Gateway (Nginx)** écoute sur le port **`80`** (`http://localhost`).
*   Toutes les requêtes dirigées vers `http://localhost/api/` sont redirigées vers l'**`api-service`** sur son port interne `3000`.
*   Toutes les requêtes dirigées vers `http://localhost/auth/` sont configurées pour être redirigées vers le service d'authentification.

# Breezy — Backend Microservices

Ce dossier contient l'ensemble de l'infrastructure backend et des bases de données de Breezy, orchestrés via Docker Compose.

Le backend est découpé en microservices indépendants qui communiquent par requêtes HTTP via la Gateway Nginx.

## Stack Technique Backend
*   **API Framework** : Express.js (Node.js)
*   **Base de données Relationnelle** : PostgreSQL (avec Sequelize ORM)
*   **Base de données NoSQL** : MongoDB (avec Mongoose ODM)
*   **Stockage de fichiers** : MinIO (compatible avec l'API AWS S3)
*   **Orchestration & Gateway** : Nginx + Docker Compose

---

## Architecture des Microservices

Le backend est structuré en plusieurs services autonomes :

1.  **`auth-service`** : Gère l'authentification des comptes, le chiffrement des mots de passe (bcrypt) et la création/validation des jetons de session JWT. Il gère également l'endpoint d'administration de création d'utilisateurs (`POST /api/auth/admin/create-user`).
2.  **`user-service`** : Gère les profils des utilisateurs (bio, avatar, note d'humeur), la liste des abonnés/abonnements et les requêtes de suspension/réactivation de comptes.
3.  **`api-service`** : Gère la logique des posts, des tags, de l'affichage du flux d'actualité ("For You", "Following", "Friends") et de la modération des posts/mentions par le staff.
4.  **`media-service`** : Responsable du téléchargement d'images et de fichiers médias vers notre bucket S3 hébergé sur MinIO.
5.  **`gateway`** : Fournit un point d'accès unifié `http://localhost/` grâce à sa configuration de reverse-proxy Nginx.

Chaque microservice Node.js suit la structure interne suivante :
```text
[service-name]/src/
├── config/       # Configurations (BDD, clés d'API)
├── controllers/  # Contrôleurs recevant les requêtes et formatant les réponses
├── databases/    # Initialisation et modèles de BDD (Postgres / Mongo)
├── middlewares/  # Middlewares (validation JWT, gestion d'erreurs)
├── routes/       # Routage des appels HTTP de l'API
├── services/     # Contient les règles métiers et la logique principale
└── index.js      # Point d'entrée de l'application Express
```

---

## Lancement du Backend

### Prérequis
*   Avoir Docker Desktop lancé.

### Démarrage
Exécute la commande suivante depuis ce répertoire :
```bash
docker compose up -d
```
Toutes les API sont ensuite accessibles au travers de la gateway sur le port `80` :
*   L'API globale est disponible à : **`http://localhost/api/`**
*   L'API d'authentification à : **`http://localhost/api/auth/`**
*   L'API utilisateur à : **`http://localhost/api/users/`**
*   L'API média à : **`http://localhost/api/media/`**

---

## Commandes Utiles de Maintenance

| Commande | Action |
| :--- | :--- |
| `docker compose up -d` | Démarre toute l'infrastructure en tâche de fond. |
| `docker compose down` | Arrête et supprime tous les conteneurs du projet. |
| `docker compose logs -f` | Affiche les logs cumulés de tous les microservices en temps réel. |
| `docker compose logs -f [service]` | Filtre et affiche les logs d'un service spécifique (ex : `docker compose logs -f auth`). |
| `docker compose restart [service]` | Redémarre un conteneur donné (ex : `docker compose restart api`). |
| `docker compose exec api npm run seed` | Exécute les scripts d'initialisation et de remplissage de données de test (seeding). |

---

## Dashboards d'Administration BDD & Médias

| Service | Rôle | URL | Identifiants |
| :--- | :--- | :--- | :--- |
| **pgAdmin** | Interface pour PostgreSQL | `http://localhost:8082` | `admin@breezy.com` / `root` <br> *(Le mot de passe de connexion au serveur DB est `postgres`)* |
| **Mongo Express** | Interface pour MongoDB | `http://localhost:8081` | `admin@breezy.com` / `root` |
| **MinIO Console** | Interface pour le stockage S3 | `http://localhost:9001` | `breezy` / `breezy_password` |

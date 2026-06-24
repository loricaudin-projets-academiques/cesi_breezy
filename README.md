# Breezy - Back-end

Breezy back-end is the logic project of Breezy with **ExpressJS + MongoDB (with Mongoose) + PostgreSQL (with Sequelize) + JWT**.

## Run Locally

**Prerequisite:**
*   [Docker](https://www.docker.com/) + Docker Compose
*   [Node.js](https://nodejs.org/) (Version 23+) (local only).

```bash
docker compose up
```

The api runs at **http://localhost:80/**.

## DB Admin

### Mongo Express
Mongo Express is used to view the MongoDB database.
Mongo Express run at **http://localhost:8081/**
username: admin@breezy.com
password: root

### pgAdmin
pgAdmin is used to view the MongoDB database.
pgAdmin run at **http://localhost:8082/**
username: admin@breezy.com
password: root

if demanded:
db_username: postgres
db_password: postgres

## Scripts

| Command | Description |
|---|---|
| `docker compose up` | Starts all backend services |
| `docker compose up -d` | Starts all backend services in detached |
| `docker compose down` | Stop all backend services in detached |
| `docker compose exec api npm run seed` | Runs seed for databases (only api_service seeds) |
| `docker compose exec api npm run lint` | Runs lint for api_service only |
| `docker compose exec api npm run lint:fix` | Runs lint for api_service only and try to autofix |

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

# Breezy — Projet Final A3 INFO (CESI)

Ce dépôt contient le code source de l'application Breezy, développée dans le cadre du projet de fin d'année de la promotion A3 INFO à CESI. L'objectif du projet est de concevoir et réaliser une application de réseau social s'appuyant sur une architecture distribuée en microservices et orchestrée avec Docker.

## Architecture Globale du Projet

Le projet est structuré sous forme de monorepo :

*   **`breezy-front`** : Interface utilisateur web développée en Next.js (React 19, TypeScript, Tailwind CSS, et Motion).
*   **`breezy-microservices`** : Répertoire contenant les microservices conteneurisés du backend :
    *   `api-service` : Gestion du flux d'actualité, des publications (posts), des tags et des mentions.
    *   `auth-service` : Service d'authentification autonome et sécurisé (JWT, Sequelize, PostgreSQL).
    *   `user-service` : Gestion des profils utilisateurs, des abonnements et des relations d'amitié.
    *   `media-service` : Gestion de l'upload et du stockage de fichiers médias via une intégration avec MinIO.
    *   `gateway` : Passerelle Nginx (API Gateway) unifiant les points d'accès des services sur le port `80`.

---

## Gestion des Rôles et des Privilèges

Le système de privilèges comporte trois rôles distincts définis en base de données :

1.  **Utilisateur (`user`)** : Rôle par défaut permettant de publier du contenu, aimer (like), ajouter aux favoris, suivre des profils et échanger des messages privés.
2.  **Modérateur (`moderator`)** : Rôle de modération. Il permet de suspendre/réactiver des comptes utilisateurs et de modérer (éditer ou supprimer) n'importe quelle publication sur la plateforme.
    *   *Règle métier : Un modérateur ne peut pas suspendre d'autres modérateurs ni de comptes administrateurs.*
3.  **Administrateur (`admin`)** : Possède l'intégralité des droits de modération de posts. De plus, il dispose d'un accès à un panneau d'**Administration** dédié dans le menu latéral pour créer des comptes (staff et membres) et possède les droits de suspension complets.
4.  **Effet de la suspension** : Toute tentative de connexion ou appel à l'API effectué par un compte suspendu retourne immédiatement un code d'erreur `403 Forbidden`.

---

## Lancement du Projet

### Prérequis
*   Docker Desktop installé et actif.

### 1. Démarrage de l'Application Complète (Docker - Recommandé)
Le fichier Docker Compose orchestre l'ensemble de l'application (frontend Next.js, Gateway Nginx, microservices, et bases de données). 

Se positionner dans le répertoire des microservices et exécuter :
```bash
cd breezy-microservices
docker compose up -d
```

### 2. Démarrage Alternatif du Frontend (Local / Dev)
Si vous préférez exécuter uniquement le frontend en local hors Docker (par exemple pour du développement intensif avec installation rapide de dépendances) :
1. Assurez-vous d'avoir Node.js (version 20+) installé localement.
2. Commentez ou arrêtez le service `frontend` dans `docker-compose.yml` (ou ignorez-le).
3. Ouvrez un terminal dans `breezy-front/` et exécutez :
```bash
cd breezy-front
npm install
npm run dev
```

### 3. Accès à l'Application
Dans les deux cas (tout Docker ou frontend en local), ouvrez votre navigateur à l'adresse suivante :
**`http://localhost/`** (port 80 de la Gateway Nginx, qui redirige automatiquement le trafic vers le conteneur frontend ou votre instance locale).

---

## Commandes Utiles de Maintenance

### Gestion de l'Infrastructure Docker
*Commandes à exécuter depuis le dossier `breezy-microservices/`*

*   **Arrêter tous les conteneurs du projet** :
    ```bash
    docker compose down
    ```
*   **Afficher les logs cumulés en temps réel** :
    ```bash
    docker compose logs -f
    ```
*   **Forcer la reconstruction et relancer les conteneurs** :
    ```bash
    docker compose up -d --build
    ```
*   **Afficher le statut et les ports des conteneurs actifs** :
    ```bash
    docker compose ps
    ```
*   **Redémarrer un conteneur spécifique** :
    ```bash
    docker compose restart frontend
    ```
*   **Lancer ou reconstruire uniquement le frontend sous Docker** :
    ```bash
    # Lancer le conteneur
    docker compose up -d frontend
    
    # Forcer le rebuild de l'image et relancer le conteneur
    docker compose up -d --build frontend
    ```
*   **Rafraîchir le cache DNS de la passerelle (Nginx)** :
    *Si vous reconstruisez individuellement des microservices (`docker compose up -d --build api` par exemple), Nginx garde les anciennes IP en mémoire. Utilisez cette commande pour forcer Nginx à re-résoudre les adresses IP :*
    ```bash
    docker compose restart api_gateway
    ```

### Remplissage et Initialisation des Données
*   **Lancer les seeds de test (remplir les bases Postgres et MongoDB avec des posts et profils de démo)** :
    ```bash
    docker compose exec api npm run seed
    ```

### Nettoyage et Compilation du Frontend
*Commandes à exécuter depuis le dossier `breezy-front/`*

*   **Supprimer le cache Next.js en cas de conflit de compilation** :
    *   *Sous Windows (PowerShell)* : `Remove-Item -Recurse -Force .next`
    *   *Sous macOS / Linux* : `rm -rf .next`
*   **Valider les types TypeScript et compiler l'application** :
    ```bash
    npm run build
    ```

---

## Interfaces d'Administration et Accès BDD

Ces utilitaires d'administration sont accessibles lorsque les conteneurs Docker sont actifs :

| Service | Rôle | URL | Identifiants par défaut |
| :--- | :--- | :--- | :--- |
| **pgAdmin** | Administration de PostgreSQL | `http://localhost:8082` | `admin@breezy.com` / `root` <br> *(Mot de passe de connexion au serveur PostgreSQL : `postgres`)* |
| **Mongo Express** | Visualisation de MongoDB | `http://localhost:8081` | `admin@breezy.com` / `root` |
| **MinIO Console** | Visualisation du stockage S3 | `http://localhost:9001` | `breezy` / `breezy_password` |

---

## Versioning Git
*   **Vérifier le statut local** : `git status`
*   **Créer un commit** :
    ```bash
    git add .
    git commit -m "feat: description du commit"
    ```
*   **Pousser les modifications locales** : `git push origin fix-and-roles`

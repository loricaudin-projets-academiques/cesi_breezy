# Breezy — Frontend Client

Ce dossier contient l'interface utilisateur web et mobile-first de Breezy, développée avec le framework Next.js.

## Stack Technique & Outils
*   **Framework** : Next.js (App Router, React 19)
*   **Langage** : TypeScript
*   **Styles** : Tailwind CSS
*   **Client HTTP** : Axios (configuré dans `src/services/api.ts`)
*   **Animations** : Motion (Framer Motion)

---

## Lancement du Frontend

### Option A : Sous Docker (Recommandé)
Le conteneur frontend est géré par l'orchestrateur Docker Compose global du projet. 
Pour le démarrer ou le reconstruire individuellement depuis le répertoire `breezy-microservices/` :
*   **Lancer le conteneur frontend** :
    ```bash
    docker compose up -d frontend
    ```
*   **Reconstruire l'image et relancer** :
    ```bash
    docker compose up -d --build frontend
    ```

### Option B : En Local (Dev)
Pour démarrer Next.js localement hors conteneur (port `3000`) :
1.  **Installation des dépendances** :
    ```bash
    npm install
    ```
2.  **Démarrage du serveur** :
    ```bash
    npm run dev
    ```
    *Le serveur local démarrera à l'adresse : `http://localhost:3000`.*

> [!IMPORTANT]
> En cas d'utilisation de l'infrastructure Docker complète avec la Gateway Nginx, il est recommandé d'accéder au projet via l'adresse **`http://localhost/`** (port 80) au lieu du port 3000, afin de laisser la gateway faire office de reverse-proxy pour toutes les requêtes (frontend et backend) et éviter les erreurs de CORS ou de cache.

---

## Architecture des Fichiers

Voici un aperçu de l'arborescence interne du projet (`src/`) :
```text
src/
├── app/              # Routes Next.js, Layout global et Provider applicatif
├── components/       # Composants graphiques réutilisables (NoteEditor, SpotifyWidget, etc.)
├── hooks/            # Hooks personnalisés (useTranslation, useFeed, etc.)
├── screens/          # Écrans principaux associés aux onglets de navigation
├── services/         # Implémentations des services HTTP et Mocks
│   ├── auth/         # Authentification (HttpAuthService)
│   ├── feed/         # Gestion du fil d'actualité et posts (HttpFeedService)
│   ├── conversation/ # Gestion des chats privés (HttpConversationService)
│   └── storage/      # Fournisseur de stockage LocalStorage
├── utils/            # Utilitaires globaux (gestion des erreurs, formats de texte)
├── types.ts          # Déclarations des types TypeScript du domaine (UserProfile, Post, etc.)
└── config.ts         # Configuration par défaut (base URL de l'API)
```

---

## Mapping des Routes & Onglets

| Route URL | Écran ou Composant Associé | Description |
| :--- | :--- | :--- |
| `/` | Redirige vers `/feed` | Page d'atterrissage |
| `/login` | `src/screens/LoginScreen.tsx` | Écrans de connexion / inscription |
| `/feed` | `src/screens/FeedScreen.tsx` | Flux de publications principal |
| `/search` | `src/screens/SearchScreen.tsx` | Moteur de recherche et hashtags |
| `/messages` | `src/components/MessagesTab.tsx` | Messagerie instantanée privée |
| `/profile` | `src/screens/ProfileScreen.tsx` | Profil personnel de l'utilisateur connecté |
| `/profile/[username]` | `src/app/profile/[username]/page.tsx` | Profils publics des autres membres (avec actions de suivi, message et modération) |

---

## Scripts Disponibles dans package.json

| Commande | Action |
| :--- | :--- |
| `npm run dev` | Démarre Next.js en mode développement. |
| `npm run build` | Compile le projet et prépare le livrable optimisé pour la production. |
| `npm run start` | Démarre le serveur Next.js compilé en production. |
| `npm run lint` | Exécute l'analyseur de code (ESLint) pour remonter les alertes. |

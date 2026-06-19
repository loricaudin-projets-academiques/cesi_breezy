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
| `npm run dev` | Starts the Next.js development server |
| `npm run build` | Builds the Next.js app for production |
| `npm run start` | Starts the production server |
| `npm run lint` | Runs Next.js linting |

## Environment

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL, for example `http://localhost:80/api` |

## Architecture

```text
src/
  app/              Next.js App Router routes and global layout
  components/       Reusable UI components
  hooks/            Client-side domain hooks
  screens/          UI screens rendered by app routes
  services/         Mock and HTTP data services
    auth/
    feed/
    conversation/
    storage/
  utils/            Shared utility functions
  types.ts          Shared domain types
  config.ts         Runtime config defaults
  mockData.ts       Initial local mock data
  audio.ts          Web Audio helpers
```

Main route mapping:

| Route | UI screen |
|---|---|
| `/` | Redirects to `/feed` |
| `/login` | `src/screens/LoginScreen.tsx` |
| `/feed` | `src/screens/FeedScreen.tsx` |
| `/search` | `src/screens/SearchScreen.tsx` |
| `/messages` | `src/components/MessagesTab.tsx` |
| `/profile` | `src/screens/ProfileScreen.tsx` |

The backend switch point remains `src/services/ServiceContainer.ts`. Mock services are active by default; HTTP service implementations live next to them for backend integration.

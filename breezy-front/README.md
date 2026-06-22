# Breezy - Front-end

Breezy is a mobile-first social UI built with **React + Next.js + TypeScript + Tailwind CSS + Axios**.

The current app keeps mock services for local development and also includes HTTP service classes for a backend or microservices setup.

## Run Locally

**Prerequisite:** Node.js 18.18+ for Next.js 15.

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app runs at **http://localhost:3000**.

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

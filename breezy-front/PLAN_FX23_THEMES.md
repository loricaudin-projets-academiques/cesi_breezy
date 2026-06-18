# Plan d'implémentation — Fx23 : Thème personnalisé

> Feature : permettre à l'utilisateur de choisir parmi **6 thèmes** visuels.
> Périmètre : **front uniquement** (`breezy-front`). Aucune modification backend.
> Stack : Next.js 15 (App Router) + React 19 + **Tailwind CSS v4** + TypeScript.
> Persistance : `localStorage` via `LocalStorageProvider` existant (**Option A : valeur JSON**).

---

## 0. Principe directeur

Tailwind v4 compile une classe comme `bg-breezy-bg` en `background-color: var(--color-breezy-bg)`.
Donc pour re-thémer, on **redéfinit les variables CSS** sous un sélecteur `html[data-theme="..."]`,
et toutes les classes utilitaires suivent automatiquement à l'exécution.

On ne sauvegarde **jamais** les couleurs : seulement l'**identifiant** du thème (ex. `"noir-violet"`).
Les couleurs vivent exclusivement dans `globals.css`.

**Deux conditions pour que ça marche :**
1. Déclarer un jeu de **tokens sémantiques** complet (incluant ce qui est codé en dur aujourd'hui).
2. **Refactorer** les ~269 couleurs codées en dur des composants pour qu'elles utilisent ces tokens.
   Sans ça, le thème clair s'affiche cassé (texte blanc sur fond blanc, etc.).

---

## 1. Les 6 thèmes (palettes définitives)

| id | Nom affiché | Fond | Accent 1 |
|---|---|---|---|
| `base` | Base | `#050508` | `#AEEBFF` (cyan néon) |
| `light` | Blanc | `#FFFFFF` | `#4F46E5` (indigo) |
| `noir-violet` | Noir Violet | `#05010A` | `#C084FC` (violet) |
| `ocean` | Océan | `#04121F` | `#22D3EE` (cyan) |
| `forest` | Forêt | `#04140E` | `#34D399` (émeraude) |
| `sunset` | Sunset | `#1A0A12` | `#FB7185` (rose) |

`base` est le thème par défaut.

---

## 2. `globals.css` — tokens + thèmes

### 2.1 Bloc `@theme` (déclaration des tokens + valeurs du thème `base`)

Remplacer le bloc `@theme` actuel par celui-ci (on **garde le préfixe `breezy-`** pour ne pas casser
les ~124 usages existants, et on **ajoute** les tokens manquants) :

```css
@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-display: "Space Grotesk", sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  /* Structure */
  --color-breezy-bg: #050508;
  --color-breezy-card: rgba(13, 13, 18, 0.6);
  --color-breezy-card-hover: rgba(22, 22, 33, 0.8);
  --color-breezy-border: rgba(255, 255, 255, 0.08);
  --color-breezy-border-active: rgba(174, 235, 255, 0.3);

  /* Texte */
  --color-breezy-icy: #F5FAFF;                    /* texte principal */
  --color-breezy-muted: rgba(245, 250, 255, 0.5); /* texte secondaire (≈ white/40-50) */
  --color-breezy-faint: rgba(245, 250, 255, 0.3); /* texte ténu (≈ white/20-30) */

  /* Accents */
  --color-breezy-neon: #AEEBFF;
  --color-breezy-lavender: #C8B6FF;
  --color-breezy-purple: #E4B5FF;

  /* Divers (nouveaux) */
  --color-breezy-overlay: rgba(0, 0, 0, 0.6);     /* fond des modales */
  --breezy-glass-bg: rgba(255, 255, 255, 0.03);
  --breezy-glass-border: rgba(255, 255, 255, 0.08);
  --breezy-frame: #1a1a1a;                          /* bordure du PhoneFrame */
  --breezy-glow-1: rgba(228, 181, 255, 0.08);       /* halo (violet) */
  --breezy-glow-2: rgba(174, 235, 255, 0.07);       /* halo (bleu) */
  --breezy-grid: rgba(255, 255, 255, 0.012);        /* grille de fond */
}
```

### 2.2 Blocs d'override par thème

À ajouter **après** le `@theme`. `html[data-theme="x"]` (spécificité 0,1,1) gagne sur `:root` (0,1,0).
Inclure `base` explicitement pour la robustesse.

```css
[data-theme="base"] {
  /* identique aux valeurs @theme ci-dessus (déjà actives par défaut) */
}

[data-theme="light"] {
  --color-breezy-bg: #FFFFFF;
  --color-breezy-card: rgba(15, 18, 30, 0.04);
  --color-breezy-card-hover: rgba(15, 18, 30, 0.07);
  --color-breezy-border: rgba(15, 18, 30, 0.10);
  --color-breezy-border-active: rgba(79, 70, 229, 0.35);
  --color-breezy-icy: #0B0B12;
  --color-breezy-muted: rgba(11, 11, 18, 0.58);
  --color-breezy-faint: rgba(11, 11, 18, 0.38);
  --color-breezy-neon: #4F46E5;
  --color-breezy-lavender: #7C3AED;
  --color-breezy-purple: #9333EA;
  --color-breezy-overlay: rgba(15, 18, 30, 0.35);
  --breezy-glass-bg: rgba(255, 255, 255, 0.6);
  --breezy-glass-border: rgba(15, 18, 30, 0.08);
  --breezy-frame: #D2D6DE;
  --breezy-glow-1: rgba(124, 58, 237, 0.10);
  --breezy-glow-2: rgba(79, 70, 229, 0.08);
  --breezy-grid: rgba(15, 18, 30, 0.04);
}

[data-theme="noir-violet"] {
  --color-breezy-bg: #05010A;
  --color-breezy-card: rgba(24, 10, 38, 0.6);
  --color-breezy-card-hover: rgba(38, 18, 56, 0.8);
  --color-breezy-border: rgba(192, 132, 252, 0.12);
  --color-breezy-border-active: rgba(192, 132, 252, 0.4);
  --color-breezy-icy: #F5EEFF;
  --color-breezy-muted: rgba(245, 238, 255, 0.55);
  --color-breezy-faint: rgba(245, 238, 255, 0.3);
  --color-breezy-neon: #C084FC;
  --color-breezy-lavender: #A855F7;
  --color-breezy-purple: #E879F9;
  --color-breezy-overlay: rgba(0, 0, 0, 0.7);
  --breezy-glass-bg: rgba(168, 85, 247, 0.05);
  --breezy-glass-border: rgba(192, 132, 252, 0.14);
  --breezy-frame: #160826;
  --breezy-glow-1: rgba(168, 85, 247, 0.14);
  --breezy-glow-2: rgba(232, 121, 249, 0.10);
  --breezy-grid: rgba(192, 132, 252, 0.03);
}

[data-theme="ocean"] {
  --color-breezy-bg: #04121F;
  --color-breezy-card: rgba(8, 30, 48, 0.6);
  --color-breezy-card-hover: rgba(12, 44, 68, 0.8);
  --color-breezy-border: rgba(56, 189, 248, 0.10);
  --color-breezy-border-active: rgba(34, 211, 238, 0.35);
  --color-breezy-icy: #ECFBFF;
  --color-breezy-muted: rgba(236, 251, 255, 0.55);
  --color-breezy-faint: rgba(236, 251, 255, 0.3);
  --color-breezy-neon: #22D3EE;
  --color-breezy-lavender: #38BDF8;
  --color-breezy-purple: #818CF8;
  --color-breezy-overlay: rgba(2, 8, 15, 0.65);
  --breezy-glass-bg: rgba(56, 189, 248, 0.05);
  --breezy-glass-border: rgba(56, 189, 248, 0.12);
  --breezy-frame: #0A1E30;
  --breezy-glow-1: rgba(34, 211, 238, 0.12);
  --breezy-glow-2: rgba(56, 189, 248, 0.10);
  --breezy-grid: rgba(56, 189, 248, 0.03);
}

[data-theme="forest"] {
  --color-breezy-bg: #04140E;
  --color-breezy-card: rgba(8, 32, 22, 0.6);
  --color-breezy-card-hover: rgba(12, 48, 32, 0.8);
  --color-breezy-border: rgba(52, 211, 153, 0.10);
  --color-breezy-border-active: rgba(52, 211, 153, 0.35);
  --color-breezy-icy: #ECFFF6;
  --color-breezy-muted: rgba(236, 255, 246, 0.55);
  --color-breezy-faint: rgba(236, 255, 246, 0.3);
  --color-breezy-neon: #34D399;
  --color-breezy-lavender: #6EE7B7;
  --color-breezy-purple: #A3E635;
  --color-breezy-overlay: rgba(2, 12, 8, 0.65);
  --breezy-glass-bg: rgba(52, 211, 153, 0.05);
  --breezy-glass-border: rgba(52, 211, 153, 0.12);
  --breezy-frame: #0A2016;
  --breezy-glow-1: rgba(52, 211, 153, 0.12);
  --breezy-glow-2: rgba(163, 230, 53, 0.08);
  --breezy-grid: rgba(52, 211, 153, 0.03);
}

[data-theme="sunset"] {
  --color-breezy-bg: #1A0A12;
  --color-breezy-card: rgba(42, 16, 28, 0.6);
  --color-breezy-card-hover: rgba(60, 24, 40, 0.8);
  --color-breezy-border: rgba(251, 113, 133, 0.12);
  --color-breezy-border-active: rgba(251, 113, 133, 0.4);
  --color-breezy-icy: #FFF1F4;
  --color-breezy-muted: rgba(255, 241, 244, 0.55);
  --color-breezy-faint: rgba(255, 241, 244, 0.3);
  --color-breezy-neon: #FB7185;
  --color-breezy-lavender: #FB923C;
  --color-breezy-purple: #FBBF24;
  --color-breezy-overlay: rgba(20, 4, 10, 0.65);
  --breezy-glass-bg: rgba(251, 113, 133, 0.05);
  --breezy-glass-border: rgba(251, 113, 133, 0.12);
  --breezy-frame: #2A1019;
  --breezy-glow-1: rgba(251, 113, 133, 0.12);
  --breezy-glow-2: rgba(251, 191, 36, 0.08);
  --breezy-grid: rgba(251, 113, 133, 0.03);
}
```

### 2.3 Réécrire les classes utilitaires CSS pour utiliser les variables

Dans `globals.css`, remplacer les valeurs codées en dur des classes par les variables :

- `body { background-color: var(--color-breezy-bg); color: var(--color-breezy-icy); }`
  (ajouter `transition: background-color .3s ease, color .3s ease;` pour un switch fluide)
- `.glass`, `.glass-bright`, `.glassmorphism`, `.glassmorphism-light`, `.glassmorphism-premium`
  → utiliser `var(--breezy-glass-bg)` et `var(--breezy-glass-border)`.
- `.bg-gradient-custom` → baser les `radial-gradient` sur `var(--breezy-glow-1)` / `var(--breezy-glow-2)`.
- `.ambient-glow-violet` → `var(--breezy-glow-1)` ; `.ambient-glow-blue` → `var(--breezy-glow-2)`.
- `.neon-glow-*`, `.glow-*`, `.active-nav-glow`, `.text-icy`, `.text-muted`
  → utiliser `var(--color-breezy-neon)`, `var(--color-breezy-icy)`, `var(--color-breezy-muted)`, etc.

---

## 3. Refactor des couleurs codées en dur (~269 occ., 19 fichiers)

Remplacer mécaniquement (vérifier le rendu après) :

| Codé en dur | Remplacer par |
|---|---|
| `bg-[#050505]`, `bg-[#050508]`, `bg-[#08080c]`, `bg-[#050508]/80` | `bg-breezy-bg` (+ `/80` si opacité) |
| `border-[#1a1a1a]` (PhoneFrame) | `border-breezy-frame` |
| `text-white`, `text-white/90`, `text-white/95` | `text-breezy-icy` |
| `text-white/40`, `text-white/50` | `text-breezy-muted` |
| `text-white/20`, `text-white/30` | `text-breezy-faint` |
| `border-white/5`, `border-white/10`, `border-white/[0.04]` | `border-breezy-border` |
| `bg-white/[0.02]`, `bg-white/[0.03]`, `bg-white/5` | `bg-breezy-card` ou `bg-breezy-glass-bg` selon contexte |
| `bg-black/60`, `bg-black/95` (backdrops modales) | `bg-breezy-overlay` |
| grille `#ffffff03` (AppShell) | classe dédiée basée sur `var(--breezy-grid)` |
| Couleurs hex de halo dans `AmbientGlow`/CSS | variables `--breezy-glow-*` |

**À CONSERVER tel quel sur tous les thèmes** (couleurs sémantiques d'état) :
`rose-500` / `rose-400` / `rose-300` (like, déconnexion, danger). Ne pas tokeniser.

**Fichiers par priorité (volume de hardcode décroissant) :**
`MessagesTab.tsx`, `ProfileScreen.tsx`, `LoginScreen.tsx`, `PostCard.tsx`, `SpotifyWidget.tsx`,
`PostCreationModal.tsx`, `FollowersModal.tsx`, `AppShell.tsx`, `HamburgerPanel.tsx`,
puis modales (`Avatar/Bio/Note`), `Navigation.tsx`, `PhoneFrame.tsx`, `AmbientGlow.tsx`,
`SearchScreen.tsx`, `FeedScreen.tsx`, `NotificationToast.tsx`, `Avatar.tsx`.

---

## 4. Logique applicative (fichiers à créer / modifier)

### 4.1 `src/theme/themes.ts` (nouveau)

```ts
export type ThemeId = "base" | "light" | "noir-violet" | "ocean" | "forest" | "sunset";

export const THEME_STORAGE_KEY = "breezy:theme";
export const DEFAULT_THEME: ThemeId = "base";

export interface ThemeMeta {
  id: ThemeId;
  label: string;
  swatch: [string, string, string]; // 3 couleurs pour la pastille du sélecteur
}

export const THEMES: ThemeMeta[] = [
  { id: "base",        label: "Base",        swatch: ["#050508", "#AEEBFF", "#C8B6FF"] },
  { id: "light",       label: "Blanc",       swatch: ["#FFFFFF", "#4F46E5", "#9333EA"] },
  { id: "noir-violet", label: "Noir Violet", swatch: ["#05010A", "#C084FC", "#E879F9"] },
  { id: "ocean",       label: "Océan",       swatch: ["#04121F", "#22D3EE", "#38BDF8"] },
  { id: "forest",      label: "Forêt",       swatch: ["#04140E", "#34D399", "#A3E635"] },
  { id: "sunset",      label: "Sunset",      swatch: ["#1A0A12", "#FB7185", "#FBBF24"] },
];

export function isThemeId(v: unknown): v is ThemeId {
  return typeof v === "string" && THEMES.some((t) => t.id === v);
}
```

### 4.2 `src/services/ServiceContainer.ts` (modifier)

Exporter le `storageProvider` existant pour le réutiliser côté thème :

```ts
export { storageProvider }; // ajouter cet export (l'instance LocalStorageProvider déjà créée)
```

### 4.3 État du thème — dans `BreezyAppProvider.tsx` (modifier)

Suivre le pattern de `ambientGlow`. Ajouter dans `useBreezyAppState()` :

```ts
import { storageProvider } from "../services/ServiceContainer";
import { ThemeId, DEFAULT_THEME, THEME_STORAGE_KEY, isThemeId } from "../theme/themes";

const [theme, setThemeState] = useState<ThemeId>(() => {
  const saved = storageProvider.get<ThemeId>(THEME_STORAGE_KEY); // Option A : JSON
  return isThemeId(saved) ? saved : DEFAULT_THEME;
});

const setTheme = (id: ThemeId) => {
  setThemeState(id);
  document.documentElement.dataset.theme = id;          // applique le thème
  storageProvider.set(THEME_STORAGE_KEY, id);           // persiste (JSON, Option A)
};

// garder le DOM synchronisé (utile au montage)
useEffect(() => {
  document.documentElement.dataset.theme = theme;
}, [theme]);
```

Exposer `theme` et `setTheme` dans l'objet retourné par `useBreezyAppState`.

### 4.4 Anti-FOUC — `src/app/layout.tsx` (modifier) — **Option A**

```tsx
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=JSON.parse(localStorage.getItem('breezy:theme'));}catch(e){}var ok=['base','light','noir-violet','ocean','forest','sunset'];document.documentElement.dataset.theme=(ok.indexOf(t)>-1)?t:'base';})();`,
          }}
        />
      </head>
      <body>
        <BreezyAppProvider>
          <AppShell>{children}</AppShell>
        </BreezyAppProvider>
      </body>
    </html>
  );
}
```

> Le `JSON.parse` est cohérent avec `LocalStorageProvider.set` qui fait `JSON.stringify`
> (la valeur stockée est `"base"` **avec guillemets**). C'est l'Option A.

---

## 5. UI du sélecteur — `HamburgerPanel.tsx` + `AppShell.tsx`

### 5.1 Props

- `HamburgerPanelProps` : ajouter `theme: ThemeId` et `onThemeChange: (id: ThemeId) => void`.
- Dans `AppShell.tsx` : récupérer `theme`, `setTheme` depuis `useBreezyApp()` et les passer
  au `<HamburgerPanel .../>`.

### 5.2 Bloc "Thème" dans la vue `settings` (au-dessus des toggles existants)

- Titre "Thème" + grille de 6 boutons.
- Chaque bouton : une **pastille** dessinée avec les 3 couleurs `swatch` (ex. dégradé
  `linear-gradient(135deg, c0 0%, c1 50%, c2 100%)`), le `label`, et l'icône `Check`
  (déjà importée) si `theme === t.id`. Bordure `border-breezy-border-active` si actif.
- `onClick` : `playTick()` → `onThemeChange(t.id)` → `triggerToast("Thème : " + t.label)`.

Exemple de rendu d'une pastille :
```tsx
<button
  onClick={() => { playTick(); onThemeChange(t.id); triggerToast("Thème : " + t.label); }}
  className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition ${
    theme === t.id ? "border-breezy-border-active bg-breezy-card-hover" : "border-breezy-border"
  }`}
>
  <span
    className="w-7 h-7 rounded-full border border-breezy-border shrink-0"
    style={{ background: `linear-gradient(135deg, ${t.swatch[0]} 0%, ${t.swatch[1]} 55%, ${t.swatch[2]} 100%)` }}
  />
  <span className="text-xs font-semibold flex-1 text-left">{t.label}</span>
  {theme === t.id && <Check className="w-4 h-4 text-breezy-neon" />}
</button>
```

---

## 6. Validation

1. `npm run lint` puis `npm run build` → zéro erreur.
2. Tester les 6 thèmes via le sélecteur. **Priorité au thème `light`** (le plus risqué) :
   - lisibilité du texte principal / muted / faint,
   - toggles (le bouton `bg-slate-900` du knob — vérifier le contraste),
   - fonds des modales (`overlay`), effet verre (`glass`),
   - halos `AmbientGlow` qui suivent l'accent.
3. Parcourir tous les écrans sur `light` : login, feed, search, messages, profile + toutes les modales.
4. **Reload** : pas de flash (FOUC), thème conservé, aucun warning d'hydratation en console.
5. Vérifier que le thème actif est bien coché dans le sélecteur après reload.

---

## 7. Hors périmètre

- Persistance serveur par compte utilisateur (localStorage suffit, cohérent avec l'app actuelle).
- Éditeur de couleurs custom par l'utilisateur (on livre 6 presets figés).
- Détection automatique `prefers-color-scheme` (peut être ajoutée plus tard comme fallback initial).

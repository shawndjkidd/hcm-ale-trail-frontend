# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Vite dev server (localhost:5173)
npm run build    # Production build to dist/
npm run preview  # Preview production build locally
```

No test runner or linter is configured.

## What This App Is

A digital beer passport for Ho Chi Minh City's craft beer trail. Users register, visit 8 breweries, scan QR codes, rate beers, and collect stamps. Completing all 8 earns a leaderboard entry ranked by completion time.

## Architecture

**Single-page React 18 app built with Vite. No router — navigation is driven by a `view` state string in App.jsx (`home`, `brewery`, `faq`, `mybeers`, `leaderboard`).**

### State Management

All state lives in `App.jsx` via `useState` hooks. There is no context or state library. Each state variable is synced to localStorage (prefixed `hcm-`) via `useEffect`. The `BREWERIES` array (id 1-8, with name/district/address/logo) is a constant in App.jsx.

### Supabase Integration (`src/lib/supabase.js`)

- Client initialized from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (set in `.env.local`)
- Hard-coded `TRAIL_ID` UUID and `BREWERY_MAP` mapping frontend IDs (1-8) to Supabase UUIDs
- DB tables: `participants` (registration), `checkins` (stamp collection)
- Four exported functions: `registerParticipant`, `recordCheckin`, `getParticipantCheckins`, `getParticipantByEmail`
- **Beer ratings, timer data, and leaderboard are localStorage-only — not yet persisted to Supabase**

### QR Code Flow

QR codes link to the app with `?brewery=N` parameter. On load, App.jsx parses this, stores it in `pendingQR` ref, and either navigates directly to the brewery (returning user) or shows the welcome modal first (new user). The URL param is stripped immediately via `replaceState`.

### Internationalization (`src/translations.js`)

Custom translations object with keys for `en`, `vn`, `kr`, `jp`. The current language is stored in state and localStorage. Components receive `language` as a prop and look up `translations[language]`.

### Styling (`src/styles/App.css`)

Single CSS file, no framework. Red (#E31E24) / yellow (#FFD100) / black color scheme. Mobile-first, max-width 480px. Nunito font.

## Key Constraints

- Brewery IDs (1-8) in frontend code must stay in sync with the UUID mapping in `src/lib/supabase.js`
- Brewery logos live in `public/logos/` and are referenced by filename in the `BREWERIES` constant
- The `.env.local` file must contain both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Deployed on Vercel with automatic builds from GitHub

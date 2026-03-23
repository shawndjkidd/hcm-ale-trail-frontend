# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm run dev`
- **Build:** `npm run build`
- **Preview production build:** `npm run preview`
- **Deploy frontend:** `dfe` (stages, commits as "deploy", pushes to main — Vercel auto-deploys)
- **Deploy backend:** `dbe` (same pattern, in `~/hcm-ale-trail-backend`)
- No linter, typechecker, or test runner is configured.

## Architecture

This is a **Vite + React 18 SPA** for the Ho Chi Minh City Ale Trail — a craft beer passport where users scan QR codes at breweries, collect stamps, rate beers, and complete side quests.

### Routing

There is no router library. Routing is handled manually in `src/main.jsx`:
- `/admin*` renders `AdminApp` (from `src/admin/`)
- Everything else renders the user-facing `App` (from `src/App.jsx`)

Within `App`, a `view` state variable drives which component renders (`"home"`, `"brewery"`, `"sidequest"`, `"faq"`, `"mybeers"`, `"leaderboard"`). URL paths like `/brewery/:id` and `/side-quest/:id` are parsed manually with `window.location` and `pushState`.

### Data Flow

- **Backend API:** Calls go through `/api/*` which Vite proxies (dev) or Vercel rewrites (prod) to `hcm-ale-trail-backend-flm8.vercel.app`. API helpers live in `src/lib/api.js`.
- **Supabase:** Direct client in `src/lib/supabase.js` for auth and check-in recording. Credentials come from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars.
- **localStorage:** Stamps, beers, user data, timer state, and leaderboard are persisted with `hcm-*` prefixed keys. On login, server state from `/api/me` syncs into local state.
- **Config:** `src/config.js` centralizes the trail UUID (`TRAIL_ID`) and API base path.

### Admin Dashboard

`src/admin/` is a separate app tree with its own API layer (`adminApi.js`), CSS (`admin.css`), and auth flow. It includes an HQ dashboard and per-brewery dashboard. Admin auth uses a separate token stored as `hcm-admin-token`.

### Internationalization

`src/translations.js` contains string maps for **4 languages: EN, VN, KR, JP**. Components receive a `language` prop and use `translations[language]`. Always add new keys to all 4 language blocks.

### Styling

Vanilla CSS in `src/styles/App.css` — no CSS framework. Mobile-first design. **File is ~6200+ lines — never replace it, only append new styles at the end.**

## Important Rules

- **Deploy directly to main** — `dfe` / `dbe` commit and push straight to main. No PR workflow in practice.
- **Never commit secrets** — no `.env*` files, no hardcoded Supabase keys.
- **App.css: append only** — never replace; always add new rules at the end.
- **Always provide full file contents** for component rewrites, never partial edits.
- This repo is frontend-only. Server-only secrets, custom domain routing, and service-role admin operations belong in the separate backend repo (`~/hcm-ale-trail-backend`).

## Session Management
- After completing each task, remind me to run /compact before starting the next one
- When switching to a completely different feature, suggest I run /clear
- Always confirm which files you plan to edit before making changes
- One task at a time — if I ask for multiple things, suggest doing them sequentially

## Key Project Info
- Trail ID: 89e5e2d6-090b-448a-8e53-6d05b731a921
- Test Side Quest ID: a6230c02-e9e3-4dd0-9d37-4dc30393057d (PIN: 1234)
- Brewery PINs are stored in `BREWERY_DATA` in `BreweryDetail.jsx` (hardcoded fallback) and also in `brewery.manual_code` from the API
- `html5-qrcode@2.3.8` is installed — used for QR scanning in AddBeerModal step 2
- `dfe` sometimes fails with "nothing to commit" if changes were already committed — just run `git push origin main` directly

## Backend Repo Notes (`~/hcm-ale-trail-backend`)
- Next.js 14 App Router, deployed to Vercel
- Auth endpoints pattern: `src/app/api/auth/[action]/route.ts`
- Uses `createSupabaseServerAdmin()` from `@/lib/supabase/server` for admin operations
- Verify Bearer token via `supabase.auth.getUser(token)` before any user mutation

## Feature Status

### Done
- **QR scan + check-in flow** — users scan brewery QR codes, stamps recorded to Supabase
- **Two-step brewery check-in** — rate beer first (step 1), then server enters PIN to confirm stamp (step 2). PIN is validated against `breweryCode` prop (from `BREWERY_DATA` or `brewery.manual_code`). If already stamped, skip PIN entirely.
- **QR scan alternative on PIN screen** — "SCAN BREWERY QR CODE" button on step 2; uses `html5-qrcode` (dynamic import); validates scanned URL matches `brewery.id` from `/checkin/[uuid]` pattern
- **Side quest check-in flow** — rate-first → PIN-confirm (matches brewery flow). POSTs to `/api/side-quests/:id/checkin` then `/api/side-quests/:id/ratings`
- **Brewery detail page layout** — section order: info card → hours → check-in CTA → two-column (hours + social buttons) → events → our beers menu → hashtag → my beers
- **Our Beers section** — fetches from `/api/trails/:id/breweries/:id/beers`, shows beer name + style + ABV
- **Event category tags** — 🎉 EVENT (yellow) / 🍺 NEW RELEASE (green) badges on event cards in both BreweryDetail and EventsPage. Reads `event.category` field; defaults to "event". Backend `category` column not yet added — all show as EVENT until then.
- **Operating hours display** — two-column compact layout; reads `operating_hours` JSON from API (backend fixed to include this field); midnight crossover handled; open/closed status badge
- **AuthModal** — login, create account, and forgot password views; mode defaults to `"login"`; input focus bug fixed (no inner component definitions)
- **Forgot password** — `submitForgot` POSTs to `/api/auth/forgot-password`; button disabled after success
- **Reset password page** — `/reset-password` route in `main.jsx` renders `ResetPassword` component; parses `access_token`/`refresh_token` from URL hash; calls `supabase.auth.setSession` + `supabase.auth.updateUser`; redirects home after 3s on success
- **WelcomeModal "Already have an account? Sign in" link** — translatable via `alreadyHaveAccount`/`signInLink` keys in `translations.js`; passes `onSignIn` callback prop from App
- **Settings page — change email** — inline edit pattern; calls `POST /api/auth/change-email`; shows confirmation message; `changeEmail()` exported from `api.js`
- **Settings page — change password** — existing feature
- **Trail Guide (FAQ)** — uses `← BACK` button (not ✕ close)
- **Dark mode fixes** — events section, brewery menu, My Beers page, Leaderboard page, PIN inputs, all dark-mode safe
- **Leaderboard rank styling** — gold/silver/bronze rows with colored left borders and backgrounds in both light and dark mode
- **Translations** — all 4 languages (EN/VN/KR/JP) complete for: PIN verification, QR scanner, event categories, beer menu, settings, email change, operating hours, beer rating modal

### Pending (backend work needed)
- **Event `category` column** — add to `events` table in Supabase with default `'event'`, options: `'event'`, `'new_release'`. Also needs admin dashboard dropdown for creating/editing events.
- **Admin dashboard event category** — dropdown to set `new_release` vs `event` when creating/editing events

### Routing notes
- `/reset-password` is handled in `main.jsx` (not `App.jsx`) to bypass the `showWelcome` guard that fires when no `hcm-user` is in localStorage
- `resetPassword()` lives in `supabase.js` (not `api.js`) because it uses the Supabase JS client directly

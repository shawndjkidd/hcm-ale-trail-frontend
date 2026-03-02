# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm run dev`
- **Build:** `npm run build`
- **Preview production build:** `npm run preview`
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

`src/translations.js` contains English/Vietnamese string maps. Components receive a `language` prop and use `translations[language]`.

### Styling

Vanilla CSS in `src/styles/App.css` — no CSS framework. Mobile-first design.

## Important Rules (from AGENT.md)

- **Never push to `main`** — always create a branch and open a PR.
- **Never commit secrets** — no `.env*` files, no hardcoded Supabase keys.
- **Keep PRs small** (< 400 LOC).
- This repo is frontend-only. Server-only secrets, custom domain routing, and service-role admin operations belong in the separate Next.js platform repo.

## Session Management
- After completing each task, remind me to run /compact before starting the next one
- When switching to a completely different feature, suggest I run /clear
- Always confirm which files you plan to edit before making changes
- One task at a time — if I ask for multiple things, suggest doing them sequentially

## Key Project Info
- Trail ID: 89e5e2d6-090b-448a-8e53-6d05b731a921
- Test Side Quest ID: a6230c02-e9e3-4dd0-9d37-4dc30393057d (PIN: 1234)
- App.css is ~52KB — never replace it, only append new styles
- Always provide full file contents, never partial edits

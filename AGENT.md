# AGENT.md — Project Rules for AI Coding Agents

## Project
- Type: Vite + React frontend (SPA)
- Backend: Supabase (Postgres/Auth/RLS) + Vercel hosting
- IMPORTANT: This repo must not contain secrets or service role operations.

## Golden Rules (DO NOT BREAK)
1. Never push to `main`. Always create a branch and open a PR.
2. Never commit secrets:
   - Do not commit `.env.local` or any `.env*` files.
   - Do not hardcode Supabase keys. Use env vars.
3. Keep changes small and reviewable (prefer < 400 LOC per PR).
4. If a change touches auth, tenant logic, or security, add a clear test/verification checklist in the PR.

## Local Commands
- Install: `npm i`
- Dev: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`
- Lint: `npm run lint` (if present)
- Typecheck: `npm run typecheck` (if present)
- Tests: `npm test` (if present)

## Repo Structure
- Source: `src/`
- Static: `public/`
- Entry HTML: `index.html`
- Build config: `vite.config.js`

## Multi-tenant Note (White Label)
This repo can render tenant branding by reading tenant config from Supabase,
but it should NOT handle:
- server-only secrets
- custom domain routing logic
- service-role admin operations
Those should live in the Next.js platform repo.

## PR Requirements
PR description must include:
- What changed
- Why
- How to test (steps)
- Screenshots for UI changes

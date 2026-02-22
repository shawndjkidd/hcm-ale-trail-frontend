// src/config.js

// Keep this centralized so the app doesn’t have random hardcoded IDs everywhere.
export const TRAIL_ID = "89e5e2d6-090b-448a-8e53-6d05b731a921";

// We’re using Vercel rewrites so frontend can call backend via same-origin /api.
export const API_BASE = "/api";

// Optional: store a Supabase JWT access token here for “real mode” /me + checkins.
// Set it in browser DevTools console:
// localStorage.setItem('hcm-access-token', '<PASTE_TOKEN>')
export const AUTH_TOKEN_STORAGE_KEY = "hcm-access-token";

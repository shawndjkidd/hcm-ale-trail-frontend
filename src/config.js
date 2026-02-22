export const TRAIL_ID = "89e5e2d6-090b-448a-8e53-6d05b731a921";

// For local dev:
// - If you run frontend on Vite (usually :5173) and backend on :3000,
//   this points directly at your local backend.
// For Vercel prod, you can set VITE_API_BASE in Vercel env vars later.
export const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:3000";

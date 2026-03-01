import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev proxy so localhost can call backend without CORS issues.
// Any request to /api/* will be forwarded to the backend.
const BACKEND = "https://hcm-ale-trail-backend-flm8.vercel.app";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: BACKEND,
        changeOrigin: true,
        secure: true,
        // Keep path exactly the same: /api/... -> /api/...
        // If you ever see double /api/api, we can adjust rewrite.
      },
    },
  },
});

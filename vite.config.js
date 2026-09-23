import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// One id per build: the app embeds it and /version.json publishes it, so open
// copies of the app can tell when a newer version has gone live.
const BUILD_ID = process.env.VERCEL_GIT_COMMIT_SHA || String(Date.now());
const versionFile = () => ({
  name: "version-file",
  generateBundle() {
    this.emitFile({ type: "asset", fileName: "version.json", source: JSON.stringify({ id: BUILD_ID }) });
  },
});

// Dev proxy so localhost can call backend without CORS issues.
// Any request to /api/* will be forwarded to the backend.
const BACKEND = "https://hcm-ale-trail-backend-flm8.vercel.app";

export default defineConfig({
  plugins: [react(), versionFile()],
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
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

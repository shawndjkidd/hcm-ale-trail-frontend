import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { rmSync } from "node:fs";
import { resolve } from "node:path";

// One id per build: the app embeds it and /version.json publishes it, so open
// copies of the app can tell when a newer version has gone live.
const BUILD_ID = process.env.VERCEL_GIT_COMMIT_SHA || String(Date.now());
const versionFile = () => ({
  name: "version-file",
  generateBundle() {
    this.emitFile({ type: "asset", fileName: "version.json", source: JSON.stringify({ id: BUILD_ID }) });
  },
});

// Stand-in photos we don't hold rights to live in public/preview/. Production builds
// (Vercel sets VERCEL_ENV=production) delete that folder from the output so the files
// are never served on the live domain. STRIP_PREVIEW_ASSETS=1 does the same locally.
const STRIP_PREVIEW = process.env.VERCEL_ENV === "production" || process.env.STRIP_PREVIEW_ASSETS === "1";
const stripPreviewAssets = () => ({
  name: "strip-preview-assets",
  apply: "build",
  closeBundle() {
    if (STRIP_PREVIEW) rmSync(resolve(__dirname, "dist/preview"), { recursive: true, force: true });
  },
});

// Dev proxy so localhost can call backend without CORS issues.
// Any request to /api/* will be forwarded to the backend.
// DEV_BACKEND lets local testing point at a locally running backend branch.
const BACKEND = process.env.DEV_BACKEND || "https://hcm-ale-trail-backend-flm8.vercel.app";

export default defineConfig({
  plugins: [react(), versionFile(), stripPreviewAssets()],
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

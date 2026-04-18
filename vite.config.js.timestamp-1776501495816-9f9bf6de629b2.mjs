// vite.config.js
import { defineConfig } from "file:///sessions/tender-charming-dirac/mnt/hcm-ale-trail-frontend/node_modules/vite/dist/node/index.js";
import react from "file:///sessions/tender-charming-dirac/mnt/hcm-ale-trail-frontend/node_modules/@vitejs/plugin-react/dist/index.js";
var BACKEND = "https://hcm-ale-trail-backend-flm8.vercel.app";
var vite_config_default = defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: BACKEND,
        changeOrigin: true,
        secure: true
        // Keep path exactly the same: /api/... -> /api/...
        // If you ever see double /api/api, we can adjust rewrite.
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvdGVuZGVyLWNoYXJtaW5nLWRpcmFjL21udC9oY20tYWxlLXRyYWlsLWZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvc2Vzc2lvbnMvdGVuZGVyLWNoYXJtaW5nLWRpcmFjL21udC9oY20tYWxlLXRyYWlsLWZyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9zZXNzaW9ucy90ZW5kZXItY2hhcm1pbmctZGlyYWMvbW50L2hjbS1hbGUtdHJhaWwtZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuXG4vLyBEZXYgcHJveHkgc28gbG9jYWxob3N0IGNhbiBjYWxsIGJhY2tlbmQgd2l0aG91dCBDT1JTIGlzc3Vlcy5cbi8vIEFueSByZXF1ZXN0IHRvIC9hcGkvKiB3aWxsIGJlIGZvcndhcmRlZCB0byB0aGUgYmFja2VuZC5cbmNvbnN0IEJBQ0tFTkQgPSBcImh0dHBzOi8vaGNtLWFsZS10cmFpbC1iYWNrZW5kLWZsbTgudmVyY2VsLmFwcFwiO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIHNlcnZlcjoge1xuICAgIHByb3h5OiB7XG4gICAgICBcIi9hcGlcIjoge1xuICAgICAgICB0YXJnZXQ6IEJBQ0tFTkQsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgc2VjdXJlOiB0cnVlLFxuICAgICAgICAvLyBLZWVwIHBhdGggZXhhY3RseSB0aGUgc2FtZTogL2FwaS8uLi4gLT4gL2FwaS8uLi5cbiAgICAgICAgLy8gSWYgeW91IGV2ZXIgc2VlIGRvdWJsZSAvYXBpL2FwaSwgd2UgY2FuIGFkanVzdCByZXdyaXRlLlxuICAgICAgfSxcbiAgICB9LFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWdXLFNBQVMsb0JBQW9CO0FBQzdYLE9BQU8sV0FBVztBQUlsQixJQUFNLFVBQVU7QUFFaEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2pCLFFBQVE7QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQTtBQUFBO0FBQUEsTUFHVjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K

import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tempo } from "tempo-devtools/dist/vite";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  optimizeDeps: {
    entries: ["src/main.tsx", "src/tempobook/**/*"],
    include: ['jspdf', 'dompurify'],
  },
  plugins: [
    react(),
    tempo(),
    // Custom plugin to handle dompurify resolution
    {
      name: 'fix-dompurify',
      resolveId(source) {
        if (source === 'dompurify') {
          return {
            id: 'dompurify',
            resolveId: 'dompurify',
          };
        }
        return null;
      },
      load(id) {
        if (id === 'dompurify') {
          return `
            import DOMPurify from 'dompurify';
            window.DOMPurify = DOMPurify;
            export default DOMPurify;
            export const sanitize = DOMPurify.sanitize;
          `;
        }
        return null;
      },
    },
  ],
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
      'dompurify': path.resolve(__dirname, 'node_modules/dompurify/dist/purify.js'),
    },
  },
  define: {
    'process.env': {},
    'process.platform': JSON.stringify('browser'),
    'process.version': JSON.stringify(process.version),
  },
  server: {
    // @ts-ignore
    allowedHosts: true,
  },
});

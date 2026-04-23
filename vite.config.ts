import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          // Let lucide-react be split per-route chunk for proper tree-shaking
          if (id.includes("lucide-react")) return;
          if (id.includes("react-dom") || id.match(/[\\/]react[\\/]/) || id.includes("react/jsx") || id.includes("scheduler")) return "react-vendor";
          if (id.includes("react-router")) return "router";
          if (id.includes("@radix-ui")) return "radix";
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("@tanstack")) return "query";
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
          if (id.includes("@dnd-kit")) return "dnd";
          if (id.includes("qrcode")) return "qrcode";
          if (id.includes("date-fns")) return "date-fns";
          if (id.includes("embla-carousel")) return "carousel";
          return "vendor";
        },
      },
    },
  },
}));

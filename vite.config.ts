import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/@dnd-kit")) return "vendor-dnd";
          if (id.includes("node_modules/framer-motion")) return "vendor-motion";
          if (id.includes("node_modules/@supabase")) return "vendor-supabase";
          if (id.includes("node_modules/@tanstack")) return "vendor-query";
          if (id.includes("node_modules/@radix-ui")) return "vendor-radix";
          if (
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/react-router") ||
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-helmet-async") ||
            id.includes("node_modules/scheduler")
          )
            return "vendor-react";
          // lucide-react fica FORA deste chunk de proposito: agrupa-lo aqui
          // forcava a biblioteca inteira de icones no bundle sempre-carregado.
          // Sem agrupar, o rollup co-localiza so os icones usados por rota.
          if (
            id.includes("node_modules/sonner") ||
            id.includes("node_modules/clsx") ||
            id.includes("node_modules/class-variance-authority") ||
            id.includes("node_modules/tailwind-merge")
          )
            return "vendor-ui";
        },
      },
    },
  },
}));

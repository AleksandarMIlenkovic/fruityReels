import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/fruityReels/" : "/",
  server: {
    port: 8080,
    open: true,
  },
}));

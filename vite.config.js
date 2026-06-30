import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
  base: "/",

  root: "src",
  plugins: [tailwindcss()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.html"),
        leaderboard: resolve(__dirname, "src/leaderboard.html")
      }
    }
  },
});

import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/GeoShuffle/",

  root: "src",
  plugins: [tailwindcss()],
  build: { outDir: "../dist", emptyOutDir: true },
});

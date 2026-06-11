import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Tell Vite that your source files live inside the src folder
  root: "src",

  plugins: [tailwindcss()],

  // Tell Vite to output the final build folder back out in the main project root
  build: {
    outDir: "../dist",
    emptyOutDir: true, // Cleans up the old dist folder before rebuilding
  },
});

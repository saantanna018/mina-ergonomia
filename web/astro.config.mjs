// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Dominio raíz de GitHub Pages (SIN el nombre del repo: eso lo gestiona `base`).
const SITE_URL = process.env.SITE_URL || "https://saantanna018.github.io";

export default defineConfig({
  site: SITE_URL,
  base: "/mina-ergonomia/",
  output: "static",
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});

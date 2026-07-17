#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────
// ErgoLab Miner — ciclo autónomo de publicación
//   1. Selecciona la siguiente keyword transaccional pendiente
//   2. Ingesta titulares del nicho (Google News RSS, es-ES)
//   3. Genera artículo SEO estructurado con OpenAI (o mock sin API key)
//   4. Compila a Markdown+frontmatter y lo publica en el frontend Astro
// Uso: node miner/index.mjs [--dry-run]
// ─────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { config } from "./config.mjs";
import { fetchNicheNews } from "./sources.mjs";
import { loadCatalog } from "./catalog.mjs";
import { generateArticle } from "./generate.mjs";
import { generateMockArticle } from "./mock.mjs";
import { publishArticle } from "./publish.mjs";

const DRY_RUN = process.argv.includes("--dry-run");

function loadState() {
  if (!existsSync(config.paths.state)) return { published: [] };
  return JSON.parse(readFileSync(config.paths.state, "utf8"));
}

function saveState(state) {
  writeFileSync(config.paths.state, JSON.stringify(state, null, 2), "utf8");
}

async function main() {
  const started = Date.now();
  console.log(`[miner] Ciclo iniciado ${new Date().toISOString()}${DRY_RUN ? " (dry-run)" : ""}`);

  // 1. Keyword pendiente
  const { keywords } = JSON.parse(readFileSync(config.paths.keywords, "utf8"));
  const state = loadState();
  const done = new Set(state.published.map((p) => p.keyword));
  const next = keywords.find((k) => !done.has(k.keyword));

  if (!next) {
    console.log("[miner] Cola de keywords agotada. Añade más en data/keywords.json.");
    return;
  }
  console.log(`[miner] Keyword objetivo: "${next.keyword}"`);

  // 2. Contexto de actualidad + catálogo del subconjunto relevante
  const [news, catalog] = [await fetchNicheNews(next.newsQuery), loadCatalog(next.categories)];
  console.log(`[miner] ${news.length} titulares · ${catalog.length} productos en contexto`);

  // 3. Generación (OpenAI si hay API key; mock determinista si no)
  const useMock = !config.openaiApiKey;
  if (useMock) {
    console.warn("[miner] Sin OPENAI_API_KEY → modo MOCK (artículo de muestra).");
  }
  const article = useMock
    ? generateMockArticle({ keyword: next.keyword, news, catalog })
    : await generateArticle({ keyword: next.keyword, intent: next.intent, news, catalog });

  if (DRY_RUN) {
    console.log("[miner] Dry-run: artículo generado pero NO publicado.");
    console.log(JSON.stringify({ title: article.title, slug: article.slug }, null, 2));
    return;
  }

  // 4. Publicación + registro de estado
  const { slug } = publishArticle(article, { keyword: next.keyword, catalog, mock: useMock });
  state.published.push({
    keyword: next.keyword,
    slug,
    mock: useMock,
    date: new Date().toISOString(),
  });
  saveState(state);

  console.log(`[miner] Ciclo completado en ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error(`[miner] ERROR: ${err.message}`);
  process.exitCode = 1;
});

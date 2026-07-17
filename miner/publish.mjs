import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { config } from "./config.mjs";

// Compila el artículo estructurado a Markdown con frontmatter YAML y lo
// deposita en la carpeta de contenido de Astro. El frontmatter transporta
// los datos programáticos (productos, FAQ, veredicto) que el frontend
// renderiza como componentes; el body es el editorial.
export function publishArticle(article, { keyword, catalog, mock = false }) {
  const byId = new Map(catalog.map((p) => [p.id, p]));

  // Merge determinista: datos duros del catálogo + capa editorial del LLM.
  // Ids desconocidos se descartan (protección anti-alucinación).
  const products = article.products
    .filter((p) => byId.has(p.id))
    .map((p) => {
      const cat = byId.get(p.id);
      return {
        id: p.id,
        name: cat.name,
        brand: cat.brand,
        category: cat.category,
        price: cat.price_eur,
        badge: p.badge,
        rating: p.rating,
        specs: cat.specs,
        pros: p.pros,
        cons: p.cons,
        url: cat.url,
        ctaLabel: p.cta_label,
      };
    });

  if (products.length === 0) {
    throw new Error("Ningún producto del artículo coincide con el catálogo; publicación abortada.");
  }

  const verdictProduct = byId.has(article.verdict.product_id)
    ? article.verdict.product_id
    : products[0].id;

  const frontmatter = {
    title: article.title,
    description: article.description,
    excerpt: article.excerpt,
    pubDate: new Date().toISOString(),
    keyword,
    tags: article.tags,
    mock,
    products,
    faq: article.faq.map((f) => ({ q: f.question, a: f.answer })),
    verdict: { productId: verdictProduct, summary: article.verdict.summary },
  };

  const slug = sanitizeSlug(article.slug);
  mkdirSync(config.paths.articlesDir, { recursive: true });
  const file = path.join(config.paths.articlesDir, `${slug}.md`);

  if (existsSync(file)) {
    console.warn(`[publish] ${slug}.md ya existe; se sobreescribe con la versión nueva.`);
  }

  const md = `---\n${YAML.stringify(frontmatter)}---\n\n${article.body_markdown.trim()}\n`;
  writeFileSync(file, md, "utf8");
  console.log(`[publish] Artículo publicado → web/src/content/articles/${slug}.md`);
  return { slug, file };
}

function sanitizeSlug(raw) {
  const slug = String(raw)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  if (!slug) throw new Error("Slug vacío tras sanitizar.");
  return slug;
}

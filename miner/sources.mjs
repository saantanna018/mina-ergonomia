import { XMLParser } from "fast-xml-parser";
import { config } from "./config.mjs";

// Ingesta headless de tendencias: Google News RSS (sin API key, es-ES).
// Devuelve titulares recientes del nicho para dar contexto temporal al artículo.
export async function fetchNicheNews(query) {
  const url =
    "https://news.google.com/rss/search?q=" +
    encodeURIComponent(query) +
    "&hl=es&gl=ES&ceid=ES:es";

  try {
    const res = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; ErgoLabMiner/1.0)" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`RSS HTTP ${res.status}`);
    const xml = await res.text();

    const parser = new XMLParser({ ignoreAttributes: false });
    const feed = parser.parse(xml);
    let items = feed?.rss?.channel?.item ?? [];
    if (!Array.isArray(items)) items = [items];

    return items.slice(0, config.maxNewsItems).map((item) => ({
      title: String(item.title ?? "").trim(),
      source: String(item.source?.["#text"] ?? item.source ?? "").trim(),
      pubDate: String(item.pubDate ?? "").trim(),
      link: String(item.link ?? "").trim(),
    }));
  } catch (err) {
    // Las noticias son contexto opcional: un fallo de red no debe parar el pipeline.
    console.warn(`[sources] RSS no disponible (${err.message}); continuando sin contexto de noticias.`);
    return [];
  }
}

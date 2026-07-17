import { readFileSync } from "node:fs";
import { config } from "./config.mjs";

// Construye el enlace de afiliado de forma determinista.
// Con ASIN → enlace directo de producto; sin ASIN → búsqueda estricta
// marca+modelo con suelo de precio (low-price), para que Amazon excluya
// clones y genéricos baratos y muestre el producto auténtico high-ticket.
export function affiliateUrl(product) {
  const tag = config.affiliateTag;
  if (product.asin) {
    return `https://www.amazon.es/dp/${product.asin}?tag=${tag}&linkCode=ll1`;
  }
  const q = encodeURIComponent(product.searchQuery || product.name);
  const priceFloor = product.minPriceEur ? `&low-price=${product.minPriceEur}` : "";
  return `https://www.amazon.es/s?k=${q}${priceFloor}&tag=${tag}&linkCode=ll2`;
}

export function loadCatalog(categories = null) {
  const { products } = JSON.parse(readFileSync(config.paths.products, "utf8"));
  const subset = categories
    ? products.filter((p) => categories.includes(p.category))
    : products;
  return subset.map((p) => ({ ...p, url: affiliateUrl(p) }));
}

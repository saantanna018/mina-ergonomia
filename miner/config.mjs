import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(ROOT, ".env") });

export const config = {
  openaiApiKey: process.env.OPENAI_API_KEY || null,
  model: process.env.OPENAI_MODEL || "gpt-4o",
  affiliateTag: process.env.AMAZON_ASSOCIATES_TAG || "tutag-21",
  siteUrl: process.env.SITE_URL || "https://ergolab-pro.example",
  maxNewsItems: Number(process.env.MAX_NEWS_ITEMS || 6),

  paths: {
    products: path.join(ROOT, "data", "products.json"),
    keywords: path.join(ROOT, "data", "keywords.json"),
    state: path.join(ROOT, "data", "state.json"),
    articlesDir: path.join(ROOT, "web", "src", "content", "articles"),
  },
};

import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const articles = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/articles" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    excerpt: z.string(),
    pubDate: z.coerce.date(),
    keyword: z.string(),
    tags: z.array(z.string()).default([]),
    mock: z.boolean().default(false),
    products: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        brand: z.string(),
        category: z.string(),
        price: z.number(),
        badge: z.string(),
        rating: z.string(),
        specs: z.record(z.string()),
        pros: z.array(z.string()),
        cons: z.array(z.string()),
        url: z.string(),
        ctaLabel: z.string(),
      }),
    ),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    verdict: z.object({ productId: z.string(), summary: z.string() }),
  }),
});

export const collections = { articles };

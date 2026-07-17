# ErgoLab — Plataforma autónoma de SEO programático + afiliación

Nicho: **ergonomía premium para profesionales** (España). Sillas high-ticket (Herman Miller,
Steelcase), escritorios elevables y periféricos ergonómicos — categorías con comisión de Amazon ES
en la banda 5-10% y tickets de 100 a 1.800 €.

## Arquitectura

```
┌──────────────── MINER (Node.js, headless) ────────────────┐
│ data/keywords.json ──► siguiente keyword transaccional     │
│ Google News RSS (es-ES) ──► contexto de actualidad         │
│ data/products.json ──► catálogo curado (anti-alucinación)  │
│         │                                                  │
│         ▼                                                  │
│ OpenAI API (gpt-4o, response_format json_object)           │
│   → artículo es-ES +1500 palabras, pros/contras, FAQ,      │
│     veredicto, con enlaces de afiliado inyectados          │
│         │                                                  │
│         ▼                                                  │
│ web/src/content/articles/<slug>.md (frontmatter + body)    │
└────────────────────────────┬───────────────────────────────┘
                             ▼
        FRONTEND (Astro SSG + Tailwind v4, dark/light)
        Home agregadora · Reading view · CTAs con gradiente
        JSON-LD (Article/FAQPage/ItemList) · sitemap · robots
```

## Puesta en marcha

```bash
npm install && npm --prefix web install
copy .env.example .env        # rellena OPENAI_API_KEY y AMAZON_ASSOCIATES_TAG
npm run mine                  # genera y publica 1 artículo (sin key → modo mock)
npm run dev                   # frontend en http://localhost:4321
npm run daily                 # ciclo completo: mine + build estático (web/dist)
```

Sin `OPENAI_API_KEY`, el miner entra en **modo mock**: publica un artículo de muestra
determinista para validar el pipeline completo sin coste (marcado con `mock: true`).

## Automatización desatendida

- **Producción (GitHub Actions):** `.github/workflows/daily-miner.yml` — cron diario 06:00 UTC,
  genera artículo, commitea, reconstruye y despliega en GitHub Pages. Configura los secrets
  `OPENAI_API_KEY` y `AMAZON_ASSOCIATES_TAG`, y la variable `SITE_URL`.
- **Local (Windows):** ejecuta una vez `powershell -ExecutionPolicy Bypass -File scripts\register-task.ps1`
  para registrar la tarea diaria de las 07:00 (`scripts/run-daily.ps1`).

## Seguridad y cumplimiento

- Secretos aislados en `.env` (excluido de git); en CI viven como GitHub Secrets.
- Enlaces de afiliado con `rel="sponsored nofollow"` (directriz Google) y divulgación visible en
  cada artículo + página `/aviso-afiliados` (requisito de Amazon Afiliados y LSSI).
- Los datos duros de producto (precio, specs, garantía) salen SIEMPRE del catálogo curado
  `data/products.json`; el LLM solo aporta la capa editorial. Ids desconocidos se descartan.
- Los precios se muestran como orientativos ("~X €"), conforme al acuerdo de Amazon Afiliados.

## Escalar el sistema

1. Añade keywords transaccionales a `data/keywords.json` (una publicación por ejecución).
2. Amplía `data/products.json` con nuevos productos (añade `asin` real cuando lo tengas para
   enlazar directo a la ficha en vez de a la búsqueda).
3. Ajusta el modelo en `.env` (`OPENAI_MODEL`) según coste/calidad.

import OpenAI from "openai";
import { config } from "./config.mjs";

// Contrato de salida del artículo. En OpenAI, response_format json_object
// garantiza JSON válido pero NO valida contra un esquema en el servidor,
// así que el esquema se inyecta en el prompt y se valida aquí al parsear.
const ARTICLE_SCHEMA = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description:
        "Título gancho SEO (H1) en español, <65 caracteres, con la keyword o una variante natural. Debe generar clic sin ser clickbait vacío.",
    },
    slug: {
      type: "string",
      description:
        "Slug URL: minúsculas, sin acentos ni ñ, palabras separadas por guiones, máximo 8 palabras.",
    },
    description: {
      type: "string",
      description: "Meta description SEO de 140-160 caracteres con intención de compra.",
    },
    excerpt: {
      type: "string",
      description: "Resumen editorial de 1-2 frases para la tarjeta de la portada.",
    },
    body_markdown: {
      type: "string",
      description:
        "Cuerpo editorial en Markdown, español de España, MÍNIMO 1500 palabras. Estructura: párrafo gancho inicial (problema + promesa), secciones ## y ###: análisis del mercado/contexto, análisis individual de cada producto recomendado (un ### por producto, citando specs reales del catálogo), guía de compra (qué mirar antes de comprar), errores comunes, y conclusión con recomendación clara. SIN H1 (se genera aparte). No inventar precios ni specs: usar solo los del catálogo. No incluir enlaces (se inyectan aparte). Tono: experto honesto que ha probado el sector, no folleto comercial.",
    },
    tags: {
      type: "array",
      items: { type: "string" },
      description: "3-5 etiquetas cortas en minúsculas.",
    },
    products: {
      type: "array",
      description:
        "Productos destacados EN ORDEN de recomendación, usando exclusivamente ids del catálogo proporcionado. Entre 3 y 6 productos.",
      items: {
        type: "object",
        properties: {
          id: { type: "string", description: "Id exacto del catálogo." },
          badge: {
            type: "string",
            description:
              "Etiqueta de posicionamiento corta, p. ej. 'Elección del editor', 'Mejor calidad-precio', 'Gama alta absoluta'.",
          },
          rating: {
            type: "string",
            description: "Nota editorial sobre 10 con un decimal, formato '9,2'.",
          },
          pros: { type: "array", items: { type: "string" }, description: "3-4 pros concretos." },
          cons: { type: "array", items: { type: "string" }, description: "2-3 contras honestos." },
          cta_label: {
            type: "string",
            description: "Texto del botón CTA, orientado a acción, p. ej. 'Ver precio en Amazon'.",
          },
        },
        required: ["id", "badge", "rating", "pros", "cons", "cta_label"],
        additionalProperties: false,
      },
    },
    faq: {
      type: "array",
      description: "4-6 preguntas frecuentes reales de compradores (formato People Also Ask).",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          answer: { type: "string", description: "Respuesta directa de 2-4 frases." },
        },
        required: ["question", "answer"],
        additionalProperties: false,
      },
    },
    verdict: {
      type: "object",
      description: "Veredicto final: el producto ganador y por qué, en 2-3 frases.",
      properties: {
        product_id: { type: "string", description: "Id del catálogo del producto ganador." },
        summary: { type: "string" },
      },
      required: ["product_id", "summary"],
      additionalProperties: false,
    },
  },
  required: [
    "title",
    "slug",
    "description",
    "excerpt",
    "body_markdown",
    "tags",
    "products",
    "faq",
    "verdict",
  ],
  additionalProperties: false,
};

const REQUIRED_KEYS = ARTICLE_SCHEMA.required;

const SYSTEM_PROMPT = `Eres el redactor jefe de un medio español especializado en ergonomía y equipamiento profesional de gama alta. Escribes en español de España (es-ES), con criterio técnico y honestidad radical: recomiendas lo que de verdad merece la pena y señalas los contras sin miedo, porque la confianza del lector es el activo del medio.

Reglas no negociables:
- Usa ÚNICAMENTE los datos de producto (precios orientativos, specs, garantías) del catálogo JSON que se te proporciona. No inventes cifras.
- Los precios del catálogo son orientativos: en el texto refiérete a ellos como "en torno a X €" o "suele rondar los X €".
- El cuerpo debe superar las 1500 palabras reales, con densidad informativa (nada de relleno).
- Optimiza para intención de búsqueda transaccional: el lector está decidiendo qué comprar.
- Nunca prometas resultados médicos; habla de ergonomía en términos de confort y prevención general.

FORMATO DE SALIDA: responde exclusivamente con un objeto JSON (sin markdown, sin comentarios) que cumpla EXACTAMENTE este JSON Schema:
${JSON.stringify(ARTICLE_SCHEMA, null, 2)}`;

export async function generateArticle({ keyword, intent, news, catalog }) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const newsBlock = news.length
    ? news.map((n) => `- ${n.title} (${n.source}, ${n.pubDate})`).join("\n")
    : "(sin titulares recientes disponibles)";

  const userPrompt = `Genera el artículo SEO (en JSON, según el esquema del sistema) para esta keyword objetivo de Google España:

KEYWORD: ${keyword}
INTENCIÓN: ${intent}
FECHA ACTUAL: ${new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}

TITULARES RECIENTES DEL SECTOR (contexto de actualidad, cítalos con criterio si aportan):
${newsBlock}

CATÁLOGO DE PRODUCTOS DISPONIBLES (usa solo estos, referenciados por id):
${JSON.stringify(catalog.map(({ url, ...p }) => p), null, 2)}`;

  const completion = await openai.chat.completions.create({
    model: config.model,
    max_tokens: 16000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const choice = completion.choices[0];
  if (choice.finish_reason === "length") {
    throw new Error("Salida truncada (finish_reason: length); reduce el catálogo o sube max_tokens.");
  }
  if (choice.finish_reason === "content_filter") {
    throw new Error("La API bloqueó la respuesta (finish_reason: content_filter).");
  }

  const article = JSON.parse(choice.message.content);

  // json_object no valida esquema en servidor: verificación mínima local
  // para que un JSON incompleto nunca llegue al publicador.
  const missing = REQUIRED_KEYS.filter((k) => !(k in article));
  if (missing.length) {
    throw new Error(`JSON incompleto, faltan claves: ${missing.join(", ")}`);
  }

  console.log(
    `[generate] Artículo generado con ${config.model} · ` +
      `${completion.usage.prompt_tokens} in / ${completion.usage.completion_tokens} out tokens`,
  );
  return article;
}

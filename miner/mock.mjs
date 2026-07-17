// Generador MOCK: produce un artículo determinista sin llamar a la API.
// Sirve para validar el pipeline completo (miner → markdown → Astro build)
// sin coste. En producción, con OPENAI_API_KEY presente, nunca se usa.

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .split("-")
    .slice(0, 8)
    .join("-");
}

export function generateMockArticle({ keyword, news, catalog }) {
  const picks = catalog.slice(0, Math.min(4, catalog.length));
  const winner = picks[0];

  const newsSection = news.length
    ? `El sector no está quieto: titulares recientes como «${news[0].title}» confirman que la ergonomía profesional sigue ganando tracción en España.`
    : `El interés por la ergonomía profesional en España sigue creciendo trimestre a trimestre.`;

  const productSections = picks
    .map(
      (p) => `### ${p.name} — análisis

${p.brand} posiciona este modelo en torno a los ${p.price_eur} €, y en nuestra experiencia el precio se justifica por la ejecución. ${Object.entries(
        p.specs,
      )
        .map(([k, v]) => `**${k}**: ${v}.`)
        .join(" ")}

En el uso diario destaca la sensación de producto pensado para años, no para temporadas. Es una compra de amortización lenta pero segura: el coste por hora de uso, en jornadas profesionales, acaba siendo marginal.`,
    )
    .join("\n\n");

  return {
    title: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} [ARTÍCULO DE MUESTRA]`,
    slug: slugify(keyword),
    description: `Comparativa honesta: analizamos ${picks.length} opciones premium del mercado español con precios orientativos, pros, contras y veredicto final del editor.`,
    excerpt: `Artículo de demostración del pipeline (modo mock, sin API key). Analiza ${picks.length} productos del catálogo con estructura de producción completa.`,
    body_markdown: `Si has llegado hasta aquí es porque te tomas en serio tu espacio de trabajo, y haces bien: pasamos más de 1.700 horas al año sentados frente a una pantalla, y el equipamiento que usamos determina cómo llegamos al final de cada jornada. ${newsSection}

## Cómo hemos seleccionado estas opciones

Nuestro criterio combina tres variables: calidad de construcción contrastada, garantía real del fabricante y relación coste-durabilidad. En equipamiento ergonómico premium, comprar barato dos veces sale más caro que comprar bien una.

## Análisis producto a producto

${productSections}

## Guía de compra: qué mirar antes de decidir

Antes de invertir en equipamiento premium, verifica tres cosas: la **garantía** (los fabricantes serios del sector ofrecen entre 10 y 15 años), la **ajustabilidad real** (no es lo mismo regular la altura que poder ajustar lumbar, tensión y reposabrazos de forma independiente) y el **canal de compra** (compra siempre en vendedores oficiales para no perder la garantía).

## Errores comunes al comprar

El error más caro es comprar por estética. El segundo, ignorar tu antropometría: una silla excelente en talla equivocada es una silla mala. Y el tercero, amueblar el puesto por partes sin pensar en el conjunto silla-mesa-monitor.

## Conclusión

*Este artículo es una muestra generada en modo mock para validar el pipeline. Configura OPENAI_API_KEY en .env para generar contenido real de +1500 palabras.*`,
    tags: ["ergonomía", "home office", "comparativa", "muestra"],
    products: picks.map((p, i) => ({
      id: p.id,
      badge: i === 0 ? "Elección del editor" : i === 1 ? "Mejor calidad-precio" : "Recomendado",
      rating: (9.4 - i * 0.4).toFixed(1).replace(".", ","),
      pros: [
        `Garantía y soporte de ${p.brand} contrastados`,
        "Construcción orientada a uso profesional intensivo",
        "Buena disponibilidad en el mercado español",
      ],
      cons: ["Precio de entrada exigente", "Plazo de entrega variable según configuración"],
      cta_label: "Ver precio en Amazon",
    })),
    faq: [
      {
        question: "¿Merece la pena pagar más por equipamiento ergonómico premium?",
        answer:
          "En uso profesional (más de 6 horas diarias), sí: la diferencia de durabilidad y garantía (10-15 años frente a 2) hace que el coste por año de uso sea inferior al de gamas baratas.",
      },
      {
        question: "¿Dónde es mejor comprar: web del fabricante o Amazon?",
        answer:
          "Ambos canales son válidos si el vendedor es oficial. Amazon suele ganar en plazos de entrega y gestión de devoluciones en España.",
      },
      {
        question: "¿Cada cuánto conviene renovar el equipamiento?",
        answer:
          "El equipamiento premium está diseñado para 10-15 años de uso intensivo. Renueva antes solo si cambia tu antropometría o tu forma de trabajar.",
      },
      {
        question: "¿Puedo desgravar este equipamiento como autónomo?",
        answer:
          "Como norma general, el mobiliario afecto a la actividad es deducible. Confirma tu caso concreto con tu asesor fiscal.",
      },
    ],
    verdict: {
      product_id: winner.id,
      summary: `${winner.name} es la compra más sólida del segmento: equilibrio entre construcción, garantía y experiencia de uso diario que ninguna alternativa iguala a este precio.`,
    },
  };
}

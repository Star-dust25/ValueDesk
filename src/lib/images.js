/** Construye URLs optimizadas de Unsplash (placeholders reales, sin descargas locales). */
export const img = (id, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`

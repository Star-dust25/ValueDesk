/** Normaliza texto para búsquedas: sin tildes y en minúsculas. */
export const normalize = (s = '') =>
  String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

/** true si todos los términos de la búsqueda aparecen en alguno de los campos. */
export function matches(query, ...fields) {
  const q = normalize(query.trim())
  if (!q) return true
  const haystack = normalize(fields.filter(Boolean).join(' '))
  return q.split(/\s+/).every((term) => haystack.includes(term))
}

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

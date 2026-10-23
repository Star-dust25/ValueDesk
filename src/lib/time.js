const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

/** "hace 5 minutos", "hace 2 horas", "ayer"… */
export function timeAgo(iso) {
  if (!iso) return '—'
  const diff = (new Date(iso).getTime() - Date.now()) / 1000
  const units = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [unit, secs] of units) {
    if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit)
  }
  return 'justo ahora'
}

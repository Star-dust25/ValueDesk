const money = new Intl.NumberFormat('es', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const date = new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short', year: 'numeric' })
const dateTime = new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
const weekday = new Intl.DateTimeFormat('es', { weekday: 'short' })

export const formatMoney = (n) => money.format(Number(n) || 0)
export const formatDate = (iso) => (iso ? date.format(new Date(iso)) : '—')
export const formatDateTime = (iso) => (iso ? dateTime.format(new Date(iso)) : '—')
export const formatWeekday = (ms) => weekday.format(new Date(ms)).replace('.', '')

/** 90 min → "1 h 30 min"; 50 h → "2 d 2 h". */
export function formatDuration(ms) {
  const totalMin = Math.max(0, Math.round(ms / 60000))
  const d = Math.floor(totalMin / 1440)
  const h = Math.floor((totalMin % 1440) / 60)
  const m = totalMin % 60
  if (d > 0) return `${d} d${h ? ` ${h} h` : ''}`
  if (h > 0) return `${h} h${m ? ` ${m} min` : ''}`
  return `${m} min`
}

/** ISO → valor para <input type="datetime-local"> (hora local). */
export function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null)

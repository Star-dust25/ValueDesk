import { serviceById } from '../data/services'

const HOUR = 3_600_000
/** SLA por prioridad cuando el ticket no está asociado a un servicio del catálogo. */
const DEFAULT_HOURS = { alta: 4, media: 24, baja: 72 }

export const slaHours = (t) => {
  const service = serviceById(t.service)
  return service ? parseFloat(service.sla) : (DEFAULT_HOURS[t.priority] ?? 24)
}

/**
 * Estado del SLA de un ticket:
 *  ok · riesgo (queda <25 % del plazo) · vencido · cumplido · incumplido
 */
export function slaInfo(t, now = Date.now()) {
  const created = new Date(t.created_at).getTime()
  const due = created + slaHours(t) * HOUR

  if (t.status === 'resuelto') {
    const end = t.resolved_at ? new Date(t.resolved_at).getTime() : now
    return { state: end <= due ? 'cumplido' : 'incumplido', due, left: due - end }
  }
  const left = due - now
  if (left <= 0) return { state: 'vencido', due, left }
  if (left < (due - created) * 0.25) return { state: 'riesgo', due, left }
  return { state: 'ok', due, left }
}

import { slaInfo } from './sla'
import { formatWeekday } from './format'
import { SERVICES } from '../data/services'
import { ASSET_TYPES, PRIORITIES, STATUSES } from '../data/constants'

const DAY = 86_400_000
const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null)

/** Métricas de gestión de servicio calculadas en el cliente a partir de los tickets. */
export function computeTicketMetrics(tickets = [], now = Date.now()) {
  const withSla = tickets.map((t) => ({ ...t, sla: slaInfo(t, now) }))
  const open = withSla.filter((t) => t.status !== 'resuelto')
  const resolved = withSla.filter((t) => t.status === 'resuelto')

  const closed = resolved.filter((t) => t.sla.state === 'cumplido' || t.sla.state === 'incumplido')
  const slaCompliance = closed.length
    ? Math.round((closed.filter((t) => t.sla.state === 'cumplido').length / closed.length) * 100)
    : null

  const mttr = avg(
    resolved
      .filter((t) => t.resolved_at)
      .map((t) => (new Date(t.resolved_at) - new Date(t.created_at)) / 3_600_000),
  )

  const rated = tickets.filter((t) => Number(t.csat) > 0)
  const csat = avg(rated.map((t) => Number(t.csat)))

  const atRisk = open
    .filter((t) => t.sla.state === 'riesgo' || t.sla.state === 'vencido')
    .sort((a, b) => a.sla.due - b.sla.due)

  const countBy = (list, key, options) =>
    options.map(({ id, label }) => ({ id, label, value: list.filter((t) => t[key] === id).length }))

  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const trend = Array.from({ length: 7 }, (_, i) => {
    const start = today.getTime() - (6 - i) * DAY
    const inDay = (iso) => {
      if (!iso) return false
      const t = new Date(iso).getTime()
      return t >= start && t < start + DAY
    }
    return {
      label: formatWeekday(start),
      created: tickets.filter((t) => inDay(t.created_at)).length,
      resolved: tickets.filter((t) => inDay(t.resolved_at)).length,
    }
  })

  return {
    total: tickets.length,
    open: open.length,
    resolved: resolved.length,
    overdue: open.filter((t) => t.sla.state === 'vencido').length,
    atRisk,
    slaCompliance,
    mttr,
    csat,
    csatCount: rated.length,
    byStatus: countBy(tickets, 'status', STATUSES),
    byPriority: countBy(open, 'priority', PRIORITIES),
    byService: SERVICES.map((s) => ({
      id: s.id,
      label: s.name,
      value: tickets.filter((t) => t.service === s.id).length,
    })).sort((a, b) => b.value - a.value),
    trend,
  }
}

export function computeAssetMetrics(assets = [], now = Date.now()) {
  const active = assets.filter((a) => a.status !== 'retirado')
  const warrantySoon = active
    .filter((a) => {
      if (!a.warranty_until) return false
      const left = new Date(a.warranty_until).getTime() - now
      return left >= 0 && left <= 60 * DAY
    })
    .sort((a, b) => a.warranty_until.localeCompare(b.warranty_until))
  return {
    total: assets.length,
    inUse: assets.filter((a) => a.status === 'en_uso').length,
    value: active.reduce((sum, a) => sum + (Number(a.cost) || 0), 0),
    warrantySoon,
    expired: active.filter((a) => a.warranty_until && new Date(a.warranty_until).getTime() < now).length,
    byType: ASSET_TYPES.map((t) => ({ id: t, label: t, value: assets.filter((a) => a.type === t).length })),
  }
}

/** Estado de garantía de un activo. */
export function warrantyState(a, now = Date.now()) {
  if (!a.warranty_until) return 'none'
  const left = new Date(a.warranty_until).getTime() - now
  if (left < 0) return 'expired'
  if (left <= 60 * DAY) return 'soon'
  return 'ok'
}

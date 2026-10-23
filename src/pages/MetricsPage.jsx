import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTickets } from '../hooks/useTickets'
import { useAssets } from '../hooks/useAssets'
import { computeTicketMetrics, computeAssetMetrics } from '../lib/metrics'
import { formatMoney, formatDateTime } from '../lib/format'
import { downloadCSV } from '../lib/csv'
import { serviceById } from '../data/services'
import './MetricsPage.css'

export default function MetricsPage() {
  const { data: tickets = [], isLoading: loadingTickets } = useTickets()
  const { data: assets = [] } = useAssets()

  const metrics = useMemo(() => computeTicketMetrics(tickets), [tickets])
  const assetMetrics = useMemo(() => computeAssetMetrics(assets), [assets])

  const handleExportTickets = () => {
    downloadCSV('valuedesk-tickets.csv', tickets, [
      { label: 'ID', key: 'id' },
      { label: 'Título', key: 'title' },
      { label: 'Tipo', key: 'type' },
      { label: 'Prioridad', key: 'priority' },
      { label: 'Estado', key: 'status' },
      { label: 'Asignado', key: 'assignee' },
      { label: 'Servicio', value: (t) => serviceById(t.service)?.name || 'General' },
      { label: 'CSAT', key: 'csat' },
      { label: 'Creado', value: (t) => formatDateTime(t.created_at) },
      { label: 'Resuelto', value: (t) => formatDateTime(t.resolved_at) },
    ])
  }

  if (loadingTickets) {
    return <div className="container section muted">Calculando métricas del servicio…</div>
  }

  const maxTrend = Math.max(
    1,
    ...metrics.trend.map((d) => Math.max(d.created, d.resolved)),
  )

  return (
    <div className="container">
      <header className="page-head metrics-head">
        <div>
          <p className="subtitle">Gestión de Niveles de Servicio · ITIL 4</p>
          <h1 className="h2">Métricas y Rendimiento del Servicio</h1>
          <p className="muted">
            Monitoreo en tiempo real de utilidad (MTTR, volumen), garantía (cumplimiento SLA) y
            satisfacción percibida (CSAT).
          </p>
        </div>
        <div className="metrics-head__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleExportTickets}
            id="export-tickets-csv"
          >
            Exportar CSV
          </button>
        </div>
      </header>

      {/* Tarjetas KPI Principales */}
      <section className="metrics-kpis" aria-label="KPIs principales">
        <div className="metric-card">
          <span className="metric-card__label">Cumplimiento SLA</span>
          <div className="metric-card__value accent">
            {metrics.slaCompliance !== null ? `${metrics.slaCompliance}%` : '—'}
          </div>
          <span className="metric-card__hint">
            Meta acordada: <b>≥ 95%</b> (garantía)
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-card__label">MTTR Promedio</span>
          <div className="metric-card__value">
            {metrics.mttr !== null ? `${metrics.mttr.toFixed(1)} h` : '—'}
          </div>
          <span className="metric-card__hint">Tiempo medio de resolución</span>
        </div>

        <div className="metric-card">
          <span className="metric-card__label">Satisfacción (CSAT)</span>
          <div className="metric-card__value accent">
            {metrics.csat !== null ? `${metrics.csat.toFixed(1)} / 5` : '—'}
          </div>
          <span className="metric-card__hint">
            {metrics.csatCount} valoraciones de usuarios
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-card__label">Tickets en Riesgo / Vencidos</span>
          <div className={`metric-card__value ${metrics.overdue > 0 ? 'text-danger' : ''}`}>
            {metrics.overdue}
          </div>
          <span className="metric-card__hint">
            {metrics.atRisk.length} tickets requieren atención prioritaria
          </span>
        </div>
      </section>

      {/* Gráfico de tendencia 7 días + Tickets en riesgo */}
      <div className="metrics-grid">
        <section className="card metrics-panel">
          <header className="metrics-panel__head">
            <h2 className="h3">Tendencia últimos 7 días</h2>
            <div className="metrics-legend">
              <span className="legend-item"><span className="legend-dot legend-dot--created" /> Creados</span>
              <span className="legend-item"><span className="legend-dot legend-dot--resolved" /> Resueltos</span>
            </div>
          </header>

          <div className="trend-bars">
            {metrics.trend.map((d) => (
              <div key={d.label} className="trend-col">
                <div className="trend-bars-pair">
                  <div
                    className="trend-bar trend-bar--created"
                    style={{ height: `${(d.created / maxTrend) * 100}%` }}
                    title={`Creados: ${d.created}`}
                  >
                    {d.created > 0 && <span className="trend-bar__num">{d.created}</span>}
                  </div>
                  <div
                    className="trend-bar trend-bar--resolved"
                    style={{ height: `${(d.resolved / maxTrend) * 100}%` }}
                    title={`Resueltos: ${d.resolved}`}
                  >
                    {d.resolved > 0 && <span className="trend-bar__num">{d.resolved}</span>}
                  </div>
                </div>
                <span className="trend-col__label">{d.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Panel de Tickets en Riesgo de SLA */}
        <section className="card metrics-panel">
          <header className="metrics-panel__head">
            <h2 className="h3">Alertas de SLA activas</h2>
            <span className="tag tag--outline">{metrics.atRisk.length} pendientes</span>
          </header>

          {metrics.atRisk.length === 0 ? (
            <p className="muted metrics-empty">No hay tickets próximos a vencer el SLA. ¡Excelente ritmo!</p>
          ) : (
            <div className="risk-list">
              {metrics.atRisk.slice(0, 5).map((t) => (
                <article key={t.id} className="risk-item">
                  <div className="risk-item__info">
                    <span className="risk-item__id">{t.id}</span>
                    <span className="risk-item__title">{t.title}</span>
                  </div>
                  <div className="risk-item__meta">
                    <span className={`tag ${t.sla.state === 'vencido' ? 'tag--danger' : 'tag--warning'}`}>
                      {t.sla.state === 'vencido' ? 'Vencido' : 'En riesgo (<25%)'}
                    </span>
                    <Link to="/tablero" className="btn btn--ghost risk-item__btn">
                      Ver
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Desglose por Servicio y por Prioridad */}
      <div className="metrics-grid metrics-grid--split">
        <section className="card metrics-panel">
          <h2 className="h3 metrics-panel__title">Demanda por Servicio</h2>
          <div className="breakdown-list">
            {metrics.byService.map((s) => {
              const pct = metrics.total ? Math.round((s.value / metrics.total) * 100) : 0
              return (
                <div key={s.id} className="breakdown-row">
                  <div className="breakdown-row__labels">
                    <span>{s.label}</span>
                    <b>{s.value} ({pct}%)</b>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="card metrics-panel">
          <h2 className="h3 metrics-panel__title">Resumen de Activos & Infraestructura</h2>
          <div className="asset-mini-stats">
            <div className="mini-stat">
              <span className="mini-stat__num">{assetMetrics.total}</span>
              <span className="muted">Activos registrados</span>
            </div>
            <div className="mini-stat">
              <span className="mini-stat__num accent">{formatMoney(assetMetrics.value)}</span>
              <span className="muted">Valor total inventariado</span>
            </div>
            <div className="mini-stat">
              <span className="mini-stat__num">{assetMetrics.inUse}</span>
              <span className="muted">En uso activo</span>
            </div>
            <div className="mini-stat">
              <span className={`mini-stat__num ${assetMetrics.warrantySoon.length > 0 ? 'text-warning' : ''}`}>
                {assetMetrics.warrantySoon.length}
              </span>
              <span className="muted">Garantías por vencer</span>
            </div>
          </div>
          <Link to="/activos" className="btn btn--ghost" style={{ marginTop: 'var(--space-4)', width: '100%' }}>
            Abrir CMDB de Activos →
          </Link>
        </section>
      </div>
      <div style={{ height: 'var(--space-12)' }} />
    </div>
  )
}

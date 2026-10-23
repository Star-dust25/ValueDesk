import { Suspense, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTickets } from '../hooks/useTickets'
import { useSessionStore } from '../store/useSessionStore'
import { computeTicketMetrics } from '../lib/metrics'
import { img } from '../lib/images'
import { lazyWithRetry } from '../lib/lazyWithRetry'
import ErrorBoundary from '../components/ErrorBoundary'
import './Home.css'

// R3F + three.js + drei pesan ~250 kB gz: se cargan diferidos para no bloquear el primer render.
const ServiceCube = lazyWithRetry(() => import('../components/ServiceCube'))

const SceneFallback = () => (
  <div className="scene scene--fallback" aria-hidden="true">
    <span className="scene__diamond" />
  </div>
)

const VALUE_PILLARS = [
  {
    tag: 'Utilidad',
    title: 'Resolución Ágil y Eficaz',
    text: 'Autoservicio, desvío de tickets y tablero visual interactivo que reducen el tiempo medio de resolución (MTTR).',
    image: img('photo-1551288049-bebda4e38f71'),
  },
  {
    tag: 'Garantía',
    title: 'Continuidad, CMDB y Cambios',
    text: 'Gestión rigurosa de activos, evaluación de riesgos RFC con plan de reversión y base de datos relacional con RLS.',
    image: img('photo-1558494949-ef010cbdcc31'),
  },
  {
    tag: 'Beneficio',
    title: 'Visibilidad y Co-creación Total',
    text: 'Métricas vivas de SLA y CSAT compartidas transparentemente entre colaboradores, agentes y gerencia.',
    image: img('photo-1522071820081-009f0129c71c'),
  },
]

const ITIL_MODULES = [
  {
    title: 'Mesa de Servicio & Incidentes',
    practice: 'Service Desk',
    desc: 'Tablero Kanban drag & drop con cálculo automático de SLA, historial de auditoría y comentarios.',
    link: '/tablero',
  },
  {
    title: 'Catálogo de Servicios',
    practice: 'Service Catalogue',
    desc: 'Servicios de conectividad, software y accesos con compromisos de tiempo (SLA) transparentes.',
    link: '/catalogo',
  },
  {
    title: 'Métricas y Nivel de Servicio',
    practice: 'Service Level Management',
    desc: 'Cumplimiento de SLA, tendencias semanales, MTTR promedio, satisfacción CSAT y exportación CSV.',
    link: '/metricas',
  },
  {
    title: 'Gestión de Activos (CMDB)',
    practice: 'IT Asset Management',
    desc: 'Inventario de configuración (CI): laptops, servidores, switches, control de costos y alertas de garantía.',
    link: '/activos',
  },
  {
    title: 'Habilitación del Cambio (RFC)',
    practice: 'Change Enablement',
    desc: 'Registro de solicitudes de cambio, evaluación de riesgos, ventanas de mantenimiento y plan de rollback.',
    link: '/cambios',
  },
  {
    title: 'Base de Conocimiento (KB)',
    practice: 'Knowledge Management',
    desc: 'Manuales de autoservicio con votación de utilidad y sugerencias automáticas al redactar tickets.',
    link: '/conocimiento',
  },
]

export default function Home() {
  const { data = [] } = useTickets()
  const metrics = useMemo(() => computeTicketMetrics(data), [data])
  const { isAuthenticated, user } = useSessionStore()

  return (
    <>
      <section className="hero container">
        <div className="hero__copy">
          <p className="subtitle">Plataforma Integral de Servicios TI · ITIL 4</p>
          <h1>
            Servicios TI que <span className="accent">generan valor</span>, no solo tickets.
          </h1>
          <p className="hero__lead muted">
            ValueDesk implementa el Sistema de Valor del Servicio (SVS) de ITIL 4: Mesa de Ayuda,
            Catálogo con SLAs, CMDB de Activos, Habilitación del Cambio, Autoservicio y Métricas en tiempo real.
          </p>
          <div className="hero__actions">
            {isAuthenticated ? (
              <>
                <Link to="/tablero" className="btn btn--primary" id="hero-cta-board">
                  Abrir Tablero ({user?.label || 'Activo'})
                </Link>
                <Link to="/catalogo" className="btn btn--ghost" id="hero-cta-catalog">
                  Catálogo de Servicios
                </Link>
                <Link to="/conocimiento" className="btn btn--ghost" id="hero-cta-kb">
                  Base de Conocimiento
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn--primary" id="hero-cta-login">
                  Iniciar Sesión por Rol
                </Link>
                <Link to="/tablero" className="btn btn--ghost" id="hero-cta-board">
                  Acceder a la Mesa de Ayuda
                </Link>
              </>
            )}
          </div>
        </div>
        <ErrorBoundary fallback={<SceneFallback />}>
          <Suspense fallback={<div className="scene scene--loading" />}>
            <ServiceCube />
          </Suspense>
        </ErrorBoundary>
      </section>

      {/* KPIs Dinámicos */}
      <section className="container">
        <dl className="kpis">
          <div className="kpi">
            <dt>Tickets Abiertos</dt>
            <dd>{metrics.open}</dd>
          </div>
          <div className="kpi">
            <dt>Cumplimiento SLA</dt>
            <dd className="accent">{metrics.slaCompliance !== null ? `${metrics.slaCompliance}%` : '98%'}</dd>
          </div>
          <div className="kpi">
            <dt>MTTR Promedio</dt>
            <dd>{metrics.mttr !== null ? `${metrics.mttr.toFixed(1)}h` : '3.2h'}</dd>
          </div>
          <div className="kpi">
            <dt>Satisfacción CSAT</dt>
            <dd className="accent">{metrics.csat !== null ? `${metrics.csat.toFixed(1)} / 5.0` : '4.8 / 5.0'}</dd>
          </div>
        </dl>
      </section>

      {/* Prácticas ITIL 4 */}
      <section className="section container">
        <p className="subtitle">Ecosistema Completo de Gestión de Servicios</p>
        <h2 className="section__title">Prácticas ITIL 4 Integradas</h2>
        <div className="grid grid--3">
          {ITIL_MODULES.map((m) => (
            <Link key={m.title} to={m.link} className="card itil-card">
              <div className="card__body">
                <span className="tag tag--outline">{m.practice}</span>
                <h3 className="itil-card__title">{m.title}</h3>
                <p className="muted text-xs">{m.desc}</p>
                <span className="itil-card__link accent">Explorar módulo →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Pilares de Valor ITIL 4 */}
      <section className="section container" style={{ paddingTop: 0 }}>
        <p className="subtitle">Fórmula de Valor ITIL 4 = Utilidad + Garantía + Beneficios percibidos</p>
        <h2 className="section__title">Co-creando valor para el negocio</h2>
        <div className="grid grid--3">
          {VALUE_PILLARS.map((p) => (
            <article key={p.title} className="card">
              <img className="card__img" src={p.image} alt="" loading="lazy" width="800" height="500" />
              <div className="card__body">
                <span className="tag">{p.tag}</span>
                <h3>{p.title}</h3>
                <p className="muted">{p.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

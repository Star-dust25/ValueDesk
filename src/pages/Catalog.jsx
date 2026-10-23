import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES, SERVICES } from '../data/services'
import { useTickets } from '../hooks/useTickets'
import { useUIStore } from '../store/useUIStore'
import './Catalog.css'

const normalize = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export default function Catalog() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todas')
  const openNewTicket = useUIStore((s) => s.openNewTicket)
  const { data: tickets = [] } = useTickets()

  // Tickets abiertos por servicio: visibilidad de la demanda real (principio "colaborar y promover la visibilidad").
  const openByService = useMemo(() => {
    const map = {}
    tickets.forEach((t) => {
      if (t.service && t.status !== 'resuelto') map[t.service] = (map[t.service] ?? 0) + 1
    })
    return map
  }, [tickets])

  const results = useMemo(() => {
    const q = normalize(query.trim())
    return SERVICES.filter(
      (s) =>
        (category === 'Todas' || s.category === category) &&
        (!q || normalize(`${s.name} ${s.description} ${s.category}`).includes(q)),
    )
  }, [query, category])

  const request = (s) =>
    openNewTicket({ type: 'solicitud', service: s.id, priority: s.priority, title: `Solicitud: ${s.name}` })

  const report = (s) =>
    openNewTicket({ type: 'incidente', service: s.id, priority: s.priority, title: `Falla en ${s.name}` })

  return (
    <div className="container">
      <header className="page-head">
        <p className="subtitle">Catálogo de servicios</p>
        <h1 className="h2">¿Qué necesitas hoy?</h1>
        <p className="muted">
          Cada servicio tiene un nivel de servicio (SLA) acordado y visible. Solicita algo nuevo o
          reporta una falla en un clic.
        </p>
      </header>

      <div className="catalog__toolbar">
        <label className="catalog__search">
          <span className="sr-only">Buscar servicio</span>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
          </svg>
          <input
            id="catalog-search"
            type="search"
            className="input"
            placeholder="Buscar: VPN, laptop, correo…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="filters" role="group" aria-label="Filtrar por categoría">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              id={`cat-${normalize(c)}`}
              className={`chip ${category === c ? 'is-active' : ''}`}
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <p className="catalog__count muted" aria-live="polite">
        {results.length} {results.length === 1 ? 'servicio' : 'servicios'}
      </p>

      {results.length === 0 ? (
        <div className="catalog__empty">
          <h2 className="h3">Sin resultados para “{query}”</h2>
          <p className="muted">¿No encuentras lo que buscas? Crea un ticket general y lo clasificamos.</p>
          <div className="catalog__empty-actions">
            <button className="btn btn--primary" id="catalog-generic-ticket" onClick={() => openNewTicket({ title: query })}>
              Crear ticket general
            </button>
            <button className="btn btn--ghost" id="catalog-clear" onClick={() => { setQuery(''); setCategory('Todas') }}>
              Limpiar filtros
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid--3 catalog__grid">
          {results.map((s) => (
            <article key={s.id} className="card service" id={`service-${s.id}`}>
              <div className="service__media">
                <img className="card__img" src={s.image} alt="" loading="lazy" width="800" height="500" />
                {openByService[s.id] > 0 && (
                  <Link to="/tablero" className="service__badge" title="Ver en el tablero">
                    {openByService[s.id]} abierto{openByService[s.id] > 1 ? 's' : ''}
                  </Link>
                )}
              </div>
              <div className="card__body">
                <div className="service__tags">
                  <span className="tag">SLA {s.sla}</span>
                  <span className="tag tag--outline">{s.category}</span>
                </div>
                <h3>{s.name}</h3>
                <p className="muted service__desc">{s.description}</p>
                <div className="service__actions">
                  <button className="btn btn--primary" id={`request-${s.id}`} onClick={() => request(s)}>
                    Solicitar
                  </button>
                  <button className="btn btn--ghost" id={`report-${s.id}`} onClick={() => report(s)}>
                    Reportar falla
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

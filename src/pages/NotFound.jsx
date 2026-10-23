import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container section" style={{ display: 'grid', gap: 'var(--space-4)', justifyItems: 'start' }}>
      <p className="subtitle">Error 404</p>
      <h1>
        Página no <span className="accent">encontrada</span>
      </h1>
      <Link to="/" className="btn btn--primary" id="notfound-home">Volver al inicio</Link>
    </div>
  )
}

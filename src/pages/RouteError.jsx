import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'

const isChunkError = (err) =>
  err instanceof TypeError &&
  /dynamically imported module|Importing a module script failed|error loading dynamically/i.test(err.message)

/**
 * Error de ruta: distingue un 404 real de un fallo de carga/ejecución,
 * en lugar de mostrar siempre "Página no encontrada".
 */
export default function RouteError() {
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <ErrorView code="Error 404" title="Página no" accent="encontrada" />
  }

  if (isChunkError(error)) {
    return (
      <ErrorView
        code={navigator.onLine ? 'Error de carga' : 'Sin conexión'}
        title="No se pudo cargar"
        accent="esta sección"
        detail={
          navigator.onLine
            ? 'Puede deberse a una nueva versión publicada o a una interrupción de red.'
            : 'El navegador está sin conexión (revisa tu red o el modo "Offline" de DevTools).'
        }
        retry
      />
    )
  }

  return (
    <ErrorView
      code="Error inesperado"
      title="Algo"
      accent="salió mal"
      detail={error?.message ?? String(error)}
      retry
    />
  )
}

function ErrorView({ code, title, accent, detail, retry = false }) {
  return (
    <div className="container section" style={{ display: 'grid', gap: 'var(--space-4)', justifyItems: 'start' }} role="alert">
      <p className="subtitle">{code}</p>
      <h1>
        {title} <span className="accent">{accent}</span>
      </h1>
      {detail && <p className="muted" style={{ maxWidth: '60ch' }}>{detail}</p>}
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        {retry && (
          <button className="btn btn--primary" id="error-retry" onClick={() => window.location.reload()}>
            Reintentar
          </button>
        )}
        <Link to="/" className={`btn ${retry ? 'btn--ghost' : 'btn--primary'}`} id="error-home" reloadDocument={retry}>
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}

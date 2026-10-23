import TicketBoard from '../components/TicketBoard'

export default function BoardPage() {
  return (
    <div className="container">
      <header className="page-head">
        <p className="subtitle">Gestión de incidentes y solicitudes</p>
        <h1 className="h2">Tablero de servicio</h1>
        <p className="muted">
          Arrastra los tickets entre columnas (ratón, toque prolongado o teclado). Los cambios se
          guardan al instante en la base de datos.
        </p>
      </header>
      <TicketBoard />
      <div style={{ height: 'var(--space-12)' }} />
    </div>
  )
}

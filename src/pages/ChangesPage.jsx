import { useState, useMemo } from 'react'
import {
  useChanges,
  useCreateChange,
  useUpdateChange,
} from '../hooks/useChanges'
import {
  CHANGE_TYPES,
  CHANGE_RISKS,
  CHANGE_STATUSES,
  labelOf,
} from '../data/constants'
import { SERVICES } from '../data/services'
import { formatDateTime, toLocalInput, fromLocalInput } from '../lib/format'
import { matches } from '../lib/text'
import { useCan } from '../lib/permissions'
import { useSessionStore } from '../store/useSessionStore'
import { useUIStore } from '../store/useUIStore'
import Modal from '../components/Modal'
import './ChangesPage.css'

export default function ChangesPage() {
  const { data: changes = [], isLoading } = useChanges()
  const createChange = useCreateChange()
  const updateChange = useUpdateChange()
  const can = useCan()
  const user = useSessionStore((s) => s.user)
  const showToast = useUIStore((s) => s.showToast)

  const [filterStatus, setFilterStatus] = useState('todos')
  const [query, setQuery] = useState('')
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [defaultSchedule] = useState(() => {
    const now = Date.now()
    return {
      start: toLocalInput(new Date(now).toISOString()),
      end: toLocalInput(new Date(now + 4 * 3600000).toISOString()),
    }
  })

  const filteredChanges = useMemo(() => {
    return changes.filter((c) => {
      const matchText = matches(query, c.id, c.title, c.description, c.requester, c.backout_plan)
      const matchStatus = filterStatus === 'todos' || c.status === filterStatus
      return matchText && matchStatus
    })
  }, [changes, query, filterStatus])

  const handleApprove = async (id) => {
    try {
      await updateChange.mutateAsync({
        id,
        status: 'aprobado',
        approver: `${user.name} (${user.label})`,
      })
      showToast(`Cambio ${id} aprobado con éxito`)
    } catch (err) {
      showToast(`Error al aprobar: ${err.message}`, 'error')
    }
  }

  const handleReject = async (id) => {
    const reason = window.prompt('Indica el motivo del rechazo del cambio:')
    if (!reason) return
    try {
      await updateChange.mutateAsync({
        id,
        status: 'rechazado',
        approver: `${user.name} (Rechazado: ${reason})`,
      })
      showToast(`Cambio ${id} marcado como rechazado`)
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error')
    }
  }

  const handleMarkImplemented = async (id) => {
    try {
      await updateChange.mutateAsync({
        id,
        status: 'implementado',
      })
      showToast(`Cambio ${id} implementado satisfactoriamente`)
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error')
    }
  }

  const handleSaveRFC = async (e) => {
    e.preventDefault()
    const form = e.target
    const formData = new FormData(form)

    const payload = {
      title: formData.get('title').trim(),
      type: formData.get('type'),
      risk: formData.get('risk'),
      service: formData.get('service') || null,
      scheduled_start: fromLocalInput(formData.get('scheduled_start')),
      scheduled_end: fromLocalInput(formData.get('scheduled_end')),
      description: formData.get('description').trim(),
      backout_plan: formData.get('backout_plan').trim(),
      requester: user.name,
    }

    if (!payload.title || !payload.description || !payload.backout_plan) {
      showToast('Título, justificación y plan de reversión son obligatorios', 'error')
      return
    }

    try {
      const created = await createChange.mutateAsync(payload)
      showToast(
        payload.type === 'estandar'
          ? `Cambio estándar ${created.id} registrado y pre-aprobado`
          : `RFC ${created.id} enviada para aprobación del comité`,
      )
      setIsNewModalOpen(false)
    } catch (err) {
      showToast(`Error al crear cambio: ${err.message}`, 'error')
    }
  }

  if (isLoading) {
    return <div className="container section muted">Cargando habilitación del cambio…</div>
  }

  return (
    <div className="container">
      <header className="page-head changes-head">
        <div>
          <p className="subtitle">Habilitación del Cambio (Change Enablement) · ITIL 4</p>
          <h1 className="h2">Control de Cambios e Infraestructura</h1>
          <p className="muted">
            Evalúa riesgos, aprueba ventanas de mantenimiento y mitiga impactos en el negocio con planes
            de reversión (backout) verificados.
          </p>
        </div>
        {can('changes:create') && (
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setIsNewModalOpen(true)}
            id="new-change-btn"
          >
            + Registrar RFC (Cambio)
          </button>
        )}
      </header>

      {/* Barra de Filtros */}
      <div className="changes-toolbar">
        <div className="filters" role="group" aria-label="Filtrar por estado del cambio">
          <button
            className={`chip ${filterStatus === 'todos' ? 'is-active' : ''}`}
            onClick={() => setFilterStatus('todos')}
          >
            Todos ({changes.length})
          </button>
          {CHANGE_STATUSES.map((s) => {
            const count = changes.filter((c) => c.status === s.id).length
            return (
              <button
                key={s.id}
                className={`chip ${filterStatus === s.id ? 'is-active' : ''}`}
                onClick={() => setFilterStatus(s.id)}
              >
                {s.label} ({count})
              </button>
            )
          })}
        </div>

        <input
          type="search"
          className="input changes-search"
          placeholder="Buscar RFC, solicitante, descripción…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Lista de Cambios */}
      <div className="changes-list">
        {filteredChanges.length === 0 ? (
          <div className="changes-empty">
            <h2 className="h3">No hay solicitudes de cambio en este estado</h2>
            <p className="muted">Los cambios gestionados aseguran la estabilidad y continuidad del servicio.</p>
          </div>
        ) : (
          filteredChanges.map((c) => (
            <article key={c.id} className="card change-card" id={`change-${c.id}`}>
              <header className="change-card__head">
                <div className="change-card__title-row">
                  <span className="change-card__id">{c.id}</span>
                  <span className={`tag tag--type-${c.type}`}>{labelOf(CHANGE_TYPES, c.type)}</span>
                  <span className={`tag tag--risk-${c.risk}`}>Riesgo {c.risk}</span>
                </div>
                <span className={`tag tag--chg-status-${c.status}`}>
                  {labelOf(CHANGE_STATUSES, c.status)}
                </span>
              </header>

              <h3 className="change-card__title">{c.title}</h3>
              <p className="muted change-card__desc">{c.description}</p>

              <div className="change-card__details">
                <div className="detail-item">
                  <span className="muted text-xs">Ventana Programada:</span>
                  <b>{formatDateTime(c.scheduled_start)} → {formatDateTime(c.scheduled_end)}</b>
                </div>
                <div className="detail-item">
                  <span className="muted text-xs">Solicitante:</span>
                  <span>{c.requester}</span>
                </div>
                <div className="detail-item">
                  <span className="muted text-xs">Aprobador / Estado:</span>
                  <span>{c.approver || 'Pendiente de revisión'}</span>
                </div>
              </div>

              {c.backout_plan && (
                <div className="change-card__backout">
                  <span className="muted text-xs">Plan de Reversión (Rollback):</span>
                  <code>{c.backout_plan}</code>
                </div>
              )}

              <footer className="change-card__actions">
                {c.status === 'pendiente' && can('changes:approve') && (
                  <>
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={() => handleApprove(c.id)}
                      id={`approve-${c.id}`}
                    >
                      Aprobar Cambio
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger"
                      onClick={() => handleReject(c.id)}
                    >
                      Rechazar
                    </button>
                  </>
                )}

                {c.status === 'aprobado' && can('changes:create') && (
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => handleMarkImplemented(c.id)}
                  >
                    Marcar como Implementado
                  </button>
                )}
              </footer>
            </article>
          ))
        )}
      </div>

      {/* Modal Registrar RFC */}
      <Modal
        id="rfc-modal"
        open={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Solicitud de Cambio (RFC)"
        subtitle="Habilitación del Cambio · ITIL 4"
      >
        <form className="form" onSubmit={handleSaveRFC}>
          <label className="field">
            <span className="field__label">Título del Cambio <span className="req">*</span></span>
            <input
              name="title"
              className="input"
              placeholder="Ej. Actualización de firmware en switches core"
              required
            />
          </label>

          <div className="form__row">
            <label className="field">
              <span className="field__label">Tipo de Cambio</span>
              <select name="type" className="select" defaultValue="normal">
                {CHANGE_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label} ({t.hint})</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">Nivel de Riesgo Evaluado</span>
              <select name="risk" className="select" defaultValue="medio">
                {CHANGE_RISKS.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="form__row">
            <label className="field">
              <span className="field__label">Servicio Impactado</span>
              <select name="service" className="select" defaultValue="">
                <option value="">— Ninguno / Infraestructura General —</option>
                {SERVICES.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="form__row">
            <label className="field">
              <span className="field__label">Inicio de Ventana Programada</span>
              <input
                type="datetime-local"
                name="scheduled_start"
                className="input"
                defaultValue={defaultSchedule.start}
              />
            </label>
            <label className="field">
              <span className="field__label">Fin de Ventana Programada</span>
              <input
                type="datetime-local"
                name="scheduled_end"
                className="input"
                defaultValue={defaultSchedule.end}
              />
            </label>
          </div>

          <label className="field">
            <span className="field__label">Descripción y Justificación del Negocio <span className="req">*</span></span>
            <textarea
              name="description"
              className="textarea"
              placeholder="¿Por qué es necesario este cambio? ¿Qué beneficios o corrección aporta?"
              required
            />
          </label>

          <label className="field">
            <span className="field__label">Plan de Reversión (Backout / Rollback) <span className="req">*</span></span>
            <textarea
              name="backout_plan"
              className="textarea"
              placeholder="¿Qué pasos exactos se ejecutarán si el cambio falla durante la ventana?"
              required
            />
            <span className="field__hint">
              Obligatorio en ITIL para garantizar la continuidad del servicio ante incidentes imprevistos.
            </span>
          </label>

          <div className="form__actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setIsNewModalOpen(false)}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary">
              Registrar Cambio
            </button>
          </div>
        </form>
      </Modal>
      <div style={{ height: 'var(--space-12)' }} />
    </div>
  )
}

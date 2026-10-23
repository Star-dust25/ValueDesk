import { useState } from 'react'
import Modal from './Modal'
import {
  AGENTS,
  PRIORITIES,
  STATUSES,
  TYPES,
  useDeleteTicket,
  useTickets,
  useUpdateTicket,
  useAddComment,
  useRateCSAT,
} from '../hooks/useTickets'
import { useAssets } from '../hooks/useAssets'
import { useKnowledge } from '../hooks/useKnowledge'
import { SERVICES, serviceById } from '../data/services'
import { useUIStore } from '../store/useUIStore'
import { useSessionStore } from '../store/useSessionStore'
import { useCan } from '../lib/permissions'
import { timeAgo } from '../lib/time'
import { slaInfo } from '../lib/sla'
import { formatDateTime } from '../lib/format'

function TicketDetailForm({ ticket, onDone }) {
  const [values, setValues] = useState({
    title: ticket.title,
    description: ticket.description ?? '',
    status: ticket.status,
    priority: ticket.priority,
    assignee: ticket.assignee,
    service: ticket.service ?? '',
    asset_id: ticket.asset_id ?? '',
    kb_id: ticket.kb_id ?? '',
  })
  const [commentText, setCommentText] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: assets = [] } = useAssets()
  const { data: kbArticles = [] } = useKnowledge()
  const update = useUpdateTicket()
  const remove = useDeleteTicket()
  const addComment = useAddComment()
  const rateCSAT = useRateCSAT()
  const showToast = useUIStore((s) => s.showToast)
  const user = useSessionStore((s) => s.user)
  const can = useCan()

  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }))
  
  // Validaciones rigurosas para edición de tickets
  const titleTrim = (values.title || '').trim()
  const descTrim = (values.description || '').trim()
  
  const titleError = !titleTrim
    ? 'El título es obligatorio.'
    : titleTrim.length < 5
    ? 'El título debe tener al menos 5 caracteres.'
    : titleTrim.length > 140
    ? 'Máximo 140 caracteres.'
    : /^[0-9]+$/.test(titleTrim)
    ? 'No puede contener solo números.'
    : null

  const descError = !descTrim
    ? 'La descripción es obligatoria.'
    : descTrim.length < 10
    ? `Detalla un poco más (${descTrim.length}/10 caracteres mínimos).`
    : descTrim.length > 1000
    ? 'Máximo 1000 caracteres.'
    : null

  const serviceError = (ticket.type === 'solicitud' || values.priority === 'alta') && !values.service
    ? 'Debes seleccionar el servicio correspondiente.'
    : null

  const hasErrors = !!titleError || !!descError || !!serviceError
  const dirty = Object.entries(values).some(([k, v]) => (ticket[k] ?? '') !== v)
  const service = serviceById(values.service)
  const sla = slaInfo(ticket)

  function handleSave(e) {
    e.preventDefault()
    if (hasErrors) {
      showToast('Corrige los errores antes de guardar el ticket', 'error')
      return
    }
    const patch = {
      ...values,
      title: titleTrim,
      description: descTrim,
      service: values.service || null,
      asset_id: values.asset_id || null,
      kb_id: values.kb_id || null,
    }
    update.mutate(
      { id: ticket.id, ...patch },
      {
        onSuccess: () => showToast(`Ticket ${ticket.id} actualizado`),
        onError: (err) => showToast(`Error al guardar: ${err.message}`, 'error'),
      },
    )
    onDone()
  }

  function handleDelete() {
    if (!confirmDelete) return setConfirmDelete(true)
    remove.mutate(ticket.id, {
      onSuccess: () => showToast(`Ticket ${ticket.id} eliminado`),
      onError: (err) => showToast(`Error al eliminar: ${err.message}`, 'error'),
    })
    onDone()
  }

  async function handleAddComment(e) {
    e.preventDefault()
    if (!commentText.trim()) return
    try {
      await addComment.mutateAsync({
        ticketId: ticket.id,
        text: commentText,
        author: user.name,
        role: user.role,
      })
      setCommentText('')
      showToast('Comentario registrado en el historial')
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error')
    }
  }

  async function handleRate(stars) {
    try {
      await rateCSAT.mutateAsync({
        ticketId: ticket.id,
        rating: stars,
      })
      showToast(`Calificación de ${stars} estrellas registrada. ¡Gracias!`)
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error')
    }
  }

  return (
    <div className="ticket-detail-flow">
      <form className="form" onSubmit={handleSave} noValidate id="ticket-detail-form">
        <dl className="meta">
          <div>
            <dt>Tipo</dt>
            <dd>{TYPES.find((t) => t.id === ticket.type)?.label}</dd>
          </div>
          <div>
            <dt>Creado</dt>
            <dd>{timeAgo(ticket.created_at)}</dd>
          </div>
          <div>
            <dt>Servicio</dt>
            <dd>{service?.name ?? '—'}</dd>
          </div>
          <div>
            <dt>Estado SLA</dt>
            <dd>
              <span className={`tag tag--sla-${sla.state}`}>
                {sla.state === 'cumplido' && 'Cumplido'}
                {sla.state === 'incumplido' && 'Incumplido'}
                {sla.state === 'vencido' && 'Vencido'}
                {sla.state === 'riesgo' && 'En riesgo (<25%)'}
                {sla.state === 'ok' && 'Dentro de plazo'}
              </span>
            </dd>
          </div>
        </dl>

        <label className="field">
          <span className="field__label">Título</span>
          <input
            id="td-title"
            className="input"
            value={values.title}
            onChange={set('title')}
            maxLength={140}
            disabled={!can('tickets:edit')}
            aria-invalid={!!titleError}
          />
          {titleError && <span className="field__error">{titleError}</span>}
        </label>

        <div className="field">
          <span className="field__label">Estado del Ticket</span>
          <div className="segmented" role="radiogroup" aria-label="Estado">
            {STATUSES.map((s) => (
              <label key={s.id}>
                <input
                  type="radio"
                  name="status"
                  value={s.id}
                  checked={values.status === s.id}
                  onChange={set('status')}
                  disabled={!can('tickets:edit')}
                  id={`td-status-${s.id}`}
                />
                <span>{s.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field__label">Prioridad</span>
          <div className="segmented" role="radiogroup" aria-label="Prioridad">
            {PRIORITIES.map((p) => (
              <label key={p.id}>
                <input
                  type="radio"
                  name="priority"
                  value={p.id}
                  checked={values.priority === p.id}
                  onChange={set('priority')}
                  disabled={!can('tickets:edit')}
                  id={`td-prio-${p.id}`}
                />
                <span>{p.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form__row">
          <label className="field">
            <span className="field__label">Asignado a</span>
            <select
              id="td-assignee"
              className="select"
              value={values.assignee}
              onChange={set('assignee')}
              disabled={!can('tickets:edit')}
            >
              {AGENTS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">
              Servicio {(ticket.type === 'solicitud' || values.priority === 'alta') && <span className="req">*</span>}
            </span>
            <select
              id="td-service"
              className="select"
              value={values.service}
              onChange={set('service')}
              disabled={!can('tickets:edit')}
              aria-invalid={!!serviceError}
            >
              <option value="">— Sin especificar —</option>
              {SERVICES.map((s) => (
                <option key={s.id} value={s.id}>{s.name} (SLA: {s.sla})</option>
              ))}
            </select>
            {serviceError && <span className="field__error">{serviceError}</span>}
          </label>
        </div>

        <div className="form__row">
          <label className="field">
            <span className="field__label">Elemento CMDB (Activo Vinculado)</span>
            <select
              id="td-asset"
              className="select"
              value={values.asset_id}
              onChange={set('asset_id')}
              disabled={!can('tickets:edit')}
            >
              <option value="">— Ninguno vinculado —</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>{a.id} · {a.name} ({a.serial})</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field__label">Guía / Artículo KB Vinculado</span>
            <select
              id="td-kb"
              className="select"
              value={values.kb_id}
              onChange={set('kb_id')}
              disabled={!can('tickets:edit')}
            >
              <option value="">— Ninguna guía vinculada —</option>
              {kbArticles.map((k) => (
                <option key={k.id} value={k.id}>{k.id} · {k.title}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="field">
          <div className="field__head">
            <span className="field__label">Descripción <span className="req">*</span></span>
            <span className={`field__counter ${values.description.length > 900 ? 'field__counter--warn' : ''}`}>
              {values.description.length}/1000
            </span>
          </div>
          <textarea
            id="td-description"
            className="textarea"
            value={values.description}
            onChange={set('description')}
            disabled={!can('tickets:edit')}
            maxLength={1000}
            aria-invalid={!!descError}
          />
          {descError && <span className="field__error">{descError}</span>}
        </label>

        {can('tickets:edit') && (
          <div className="form__actions form__actions--split">
            {can('tickets:delete') ? (
              <button
                type="button"
                id="td-delete"
                className={`btn btn--danger ${confirmDelete ? 'is-confirm' : ''}`}
                onClick={handleDelete}
                onBlur={() => setConfirmDelete(false)}
              >
                {confirmDelete ? '¿Confirmar eliminación?' : 'Eliminar'}
              </button>
            ) : <div />}

            <button
              type="submit"
              className="btn btn--primary"
              disabled={!dirty || hasErrors}
              id="td-save"
            >
              Guardar cambios
            </button>
          </div>
        )}
      </form>

      {/* Encuesta de satisfacción CSAT cuando está resuelto */}
      {ticket.status === 'resuelto' && (
        <section className="csat-box" aria-label="Calificación de servicio">
          <span className="csat-box__title">Encuesta de Satisfacción (CSAT)</span>
          <p className="muted text-xs">
            {ticket.csat
              ? `Calificado con ${ticket.csat} estrellas por el usuario.`
              : '¿Cómo calificarías la atención y resolución de este servicio?'}
          </p>
          <div className="csat-stars">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                type="button"
                className={`csat-star-btn ${Number(ticket.csat) >= score ? 'is-active' : ''}`}
                onClick={() => handleRate(score)}
                title={`Puntaje ${score} de 5`}
              >
                {score}
              </button>
            ))}
          </div>
          {ticket.csat_comment && (
            <p className="csat-box__comment">“{ticket.csat_comment}”</p>
          )}
        </section>
      )}

      {/* Historial de Comentarios y Trazabilidad (Timeline) */}
      <section className="ticket-comments" aria-label="Historial de actividad">
        <h3 className="h3">Historial de Comunicación ({ticket.comments?.length || 0})</h3>
        <div className="comments-list">
          {(!ticket.comments || ticket.comments.length === 0) ? (
            <p className="muted text-xs">No hay comentarios en la bitácora todavía.</p>
          ) : (
            ticket.comments.map((c) => (
              <article key={c.id} className="comment-bubble">
                <header className="comment-bubble__head">
                  <b>{c.author}</b>
                  <span className={`tag tag--outline text-xs`}>{c.role}</span>
                  <span className="muted text-xs">{formatDateTime(c.created_at)}</span>
                </header>
                <p className="comment-bubble__text">{c.text}</p>
              </article>
            ))
          )}
        </div>

        {can('comment') && (
          <form className="comment-form" onSubmit={handleAddComment}>
            <input
              className="input"
              placeholder={`Agregar nota como ${user.name}…`}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn--primary"
              disabled={!commentText.trim()}
            >
              Publicar
            </button>
          </form>
        )}
      </section>
    </div>
  )
}

export default function TicketDetailModal() {
  const id = useUIStore((s) => s.selectedTicketId)
  const close = useUIStore((s) => s.closeTicket)
  const { data = [] } = useTickets()
  const ticket = id ? data.find((t) => t.id === id) : null

  return (
    <Modal
      id="ticket-detail"
      open={!!ticket}
      onClose={close}
      subtitle={ticket?.id}
      title="Detalle del Ticket"
    >
      {ticket && <TicketDetailForm key={ticket.id} ticket={ticket} onDone={close} />}
    </Modal>
  )
}

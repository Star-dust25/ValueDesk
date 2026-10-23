import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from './Modal'
import { AGENTS, PRIORITIES, TYPES, useCreateTicket } from '../hooks/useTickets'
import { useKnowledge } from '../hooks/useKnowledge'
import { useAssets } from '../hooks/useAssets'
import { SERVICES, serviceById } from '../data/services'
import { useUIStore } from '../store/useUIStore'
import { useSessionStore } from '../store/useSessionStore'
import { matches } from '../lib/text'

const EMPTY = {
  title: '',
  description: '',
  type: 'incidente',
  priority: 'media',
  service: '',
  assignee: 'Sin asignar',
  asset_id: '',
  kb_id: '',
}

function validate(v) {
  const errors = {}
  const title = (v.title || '').trim()
  const description = (v.description || '').trim()

  // Validación de Título
  if (!title) {
    errors.title = 'El título del ticket es obligatorio.'
  } else if (title.length < 5) {
    errors.title = 'El título debe ser más descriptivo (mínimo 5 caracteres).'
  } else if (title.length > 140) {
    errors.title = 'El título no puede superar los 140 caracteres.'
  } else if (/^[0-9]+$/.test(title)) {
    errors.title = 'El título no puede contener solo números.'
  }

  // Validación de Servicio (100% obligatorio bajo estándar ITIL 4 para calcular SLA)
  if (!v.service) {
    errors.service = 'Selecciona el servicio afectado o solicitado para asignar el SLA.'
  }

  // Validación de Descripción
  if (!description) {
    errors.description = 'Ingresa una descripción del problema o necesidad (mínimo 10 caracteres).'
  } else if (description.length < 10) {
    errors.description = `Detalla un poco más el caso (${description.length}/10 caracteres mínimos).`
  } else if (description.length > 1000) {
    errors.description = 'La descripción supera el límite permitido de 1000 caracteres.'
  }

  return errors
}

function NewTicketForm({ preset, onDone }) {
  const [values, setValues] = useState({ ...EMPTY, ...preset })
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const { mutateAsync, isPending, error, reset } = useCreateTicket()
  const { data: kbArticles = [] } = useKnowledge()
  const { data: assets = [] } = useAssets()
  const showToast = useUIStore((s) => s.showToast)
  const user = useSessionStore((s) => s.user)
  const navigate = useNavigate()

  const errors = validate(values)
  const show = (k) => (submitted || touched[k]) && errors[k]
  const service = serviceById(values.service)

  // Sugerencias de autoservicio KB basadas en lo que escribe el usuario
  const suggestedArticles = useMemo(() => {
    if (!values.title || values.title.trim().length < 3) return []
    return kbArticles
      .filter((a) => matches(values.title, a.title, a.summary))
      .slice(0, 2)
  }, [values.title, kbArticles])

  const set = (k) => (e) => {
    const value = e.target.value
    reset()
    setValues((v) => {
      const next = { ...v, [k]: value }
      if (k === 'service' && serviceById(value)) next.priority = serviceById(value).priority
      return next
    })
  }
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
    if (Object.keys(errors).length) {
      showToast('Por favor completa todos los campos requeridos correctamente', 'error')
      return
    }
    try {
      const ticket = await mutateAsync({
        ...values,
        title: values.title.trim(),
        description: values.description.trim(),
        author: user?.name || 'Usuario',
        role: user?.role || 'usuario',
      })
      showToast(`Ticket ${ticket.id} creado correctamente`)
      onDone()
      navigate('/tablero')
    } catch (err) {
      showToast(`Error al crear el ticket: ${err.message}`, 'error')
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate id="new-ticket-form">
      <div className="field">
        <span className="field__label">Tipo</span>
        <div className="segmented" role="radiogroup" aria-label="Tipo de ticket">
          {TYPES.map((t) => (
            <label key={t.id}>
              <input
                type="radio"
                name="type"
                value={t.id}
                checked={values.type === t.id}
                onChange={set('type')}
                id={`nt-type-${t.id}`}
              />
              <span>{t.label}</span>
            </label>
          ))}
        </div>
        <span className="field__hint">
          {values.type === 'incidente' ? 'Algo dejó de funcionar.' : 'Necesitas algo nuevo del catálogo.'}
        </span>
      </div>

      <label className="field">
        <div className="field__head">
          <span className="field__label">Título del Ticket <span className="req">*</span></span>
          <span className={`field__counter ${values.title.length > 130 ? 'field__counter--danger' : ''}`}>
            {values.title.length}/140
          </span>
        </div>
        <input
          id="nt-title"
          className="input"
          value={values.title}
          onChange={set('title')}
          onBlur={blur('title')}
          placeholder="Ej. Error al conectar con la VPN corporativa desde casa"
          maxLength={140}
          autoFocus
          aria-invalid={!!show('title')}
          aria-describedby="nt-title-err"
        />
        {show('title') && <span className="field__error" id="nt-title-err">{errors.title}</span>}
      </label>

      {/* Sugerencia de Autoservicio / Desvío de Tickets ITIL 4 */}
      {suggestedArticles.length > 0 && (
        <aside className="kb-suggest-box" aria-label="Guías sugeridas">
          <span className="kb-suggest-box__title">Sugerencia de autoayuda: ¿Quizas esto resuelva tu problema?</span>
          <div className="kb-suggest-list">
            {suggestedArticles.map((a) => (
              <a
                key={a.id}
                href="/conocimiento"
                target="_blank"
                rel="noreferrer"
                className="kb-suggest-item"
              >
                <span>{a.title}</span>
                <span className="accent text-xs">[Abrir guia]</span>
              </a>
            ))}
          </div>
        </aside>
      )}

      <div className="form__row">
        <label className="field">
          <span className="field__label">
            Servicio TI <span className="req">*</span>
          </span>
          <select
            id="nt-service"
            className="select"
            value={values.service}
            onChange={set('service')}
            onBlur={blur('service')}
            aria-invalid={!!show('service')}
          >
            <option value="">— Seleccionar servicio —</option>
            {SERVICES.map((s) => (
              <option key={s.id} value={s.id}>{s.name} (SLA: {s.sla})</option>
            ))}
          </select>
          {show('service') && <span className="field__error">{errors.service}</span>}
        </label>

        <label className="field">
          <span className="field__label">Elemento CMDB (Activo relacionado)</span>
          <select id="nt-asset" className="select" value={values.asset_id} onChange={set('asset_id')}>
            <option value="">— Ninguno específico —</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>{a.id} · {a.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="form__row">
        <label className="field">
          <span className="field__label">Asignar a</span>
          <select id="nt-assignee" className="select" value={values.assignee} onChange={set('assignee')}>
            {AGENTS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>

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
                  id={`nt-prio-${p.id}`}
                />
                <span>{p.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {service && (
        <div className="sla-box" role="note">
          <span>Tiempo de atención acordado (SLA) para <b>{service.name}</b></span>
          <strong>{service.sla}</strong>
        </div>
      )}

      <label className="field">
        <div className="field__head">
          <span className="field__label">Descripción detallada <span className="req">*</span></span>
          <span className={`field__counter ${values.description.length > 900 ? 'field__counter--warn' : ''} ${values.description.length >= 1000 ? 'field__counter--danger' : ''}`}>
            {values.description.length}/1000
          </span>
        </div>
        <textarea
          id="nt-description"
          className="textarea"
          value={values.description}
          onChange={set('description')}
          onBlur={blur('description')}
          placeholder="Describe detalladamente qué ocurrió, mensaje de error, hora del suceso o impacto en tus labores…"
          maxLength={1000}
          aria-invalid={!!show('description')}
          aria-describedby="nt-desc-err"
        />
        {show('description') ? (
          <span className="field__error" id="nt-desc-err">{errors.description}</span>
        ) : (
          <span className="field__hint">Mínimo 10 caracteres. Proporciona contexto suficiente para el equipo de soporte.</span>
        )}
      </label>

      {error && <p className="form__error" role="alert">No se pudo crear el ticket: {error.message}</p>}

      <div className="form__actions">
        <button type="button" className="btn btn--ghost" onClick={onDone} id="nt-cancel">
          Cancelar
        </button>
        <button type="submit" className="btn btn--primary" disabled={isPending} id="nt-submit">
          {isPending ? 'Creando…' : 'Crear ticket'}
        </button>
      </div>
    </form>
  )
}

export default function NewTicketModal() {
  const preset = useUIStore((s) => s.newTicket)
  const close = useUIStore((s) => s.closeNewTicket)
  const isRequest = preset?.type === 'solicitud'

  return (
    <Modal
      id="new-ticket"
      open={!!preset}
      onClose={close}
      subtitle={isRequest ? 'Catálogo de servicios' : 'Mesa de servicio'}
      title={isRequest ? 'Nueva solicitud' : 'Nuevo ticket'}
    >
      {preset && <NewTicketForm preset={preset} onDone={close} />}
    </Modal>
  )
}

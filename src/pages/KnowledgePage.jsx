import { useState, useMemo } from 'react'
import {
  useKnowledge,
  useCreateArticle,
  useUpdateArticle,
  useDeleteArticle,
  useVoteArticle,
} from '../hooks/useKnowledge'
import { KB_CATEGORIES } from '../data/constants'
import { matches } from '../lib/text'
import { formatDate } from '../lib/format'
import { useCan } from '../lib/permissions'
import { useUIStore } from '../store/useUIStore'
import Modal from '../components/Modal'
import './KnowledgePage.css'

export default function KnowledgePage() {
  const { data: articles = [], isLoading } = useKnowledge()
  const createArticle = useCreateArticle()
  const updateArticle = useUpdateArticle()
  const deleteArticle = useDeleteArticle()
  const voteArticle = useVoteArticle()
  const can = useCan()
  const showToast = useUIStore((s) => s.showToast)
  const openNewTicket = useUIStore((s) => s.openNewTicket)

  const [query, setQuery] = useState('')
  const [selectedCat, setSelectedCat] = useState('Todas')
  const [activeArticle, setActiveArticle] = useState(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState(null)
  const [votedMap, setVotedMap] = useState({})

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const matchText = matches(query, a.title, a.summary, a.content, a.author)
      const matchCat = selectedCat === 'Todas' || a.category === selectedCat
      return matchText && matchCat
    })
  }, [articles, query, selectedCat])

  const handleVote = async (id, helpful) => {
    if (votedMap[id]) return
    setVotedMap((v) => ({ ...v, [id]: helpful ? 'yes' : 'no' }))
    try {
      await voteArticle.mutateAsync({ id, helpful })
      showToast(helpful ? '¡Gracias por tu valoración!' : 'Tomamos nota para mejorar este artículo.')
    } catch {
      /* ignore */
    }
  }

  const handleSaveArticle = async (e) => {
    e.preventDefault()
    const form = e.target
    const formData = new FormData(form)
    const payload = {
      title: formData.get('title').trim(),
      category: formData.get('category'),
      summary: formData.get('summary').trim(),
      content: formData.get('content').trim(),
      author: formData.get('author').trim() || 'Equipo TI',
    }

    if (!payload.title || !payload.content) {
      showToast('Título y contenido son requeridos', 'error')
      return
    }

    try {
      if (editingArticle?.id) {
        await updateArticle.mutateAsync({ id: editingArticle.id, ...payload })
        showToast('Artículo de conocimiento actualizado')
      } else {
        const created = await createArticle.mutateAsync(payload)
        showToast(`Artículo ${created.id} publicado`)
      }
      setIsEditorOpen(false)
      setEditingArticle(null)
    } catch (err) {
      showToast(`Error al guardar: ${err.message}`, 'error')
    }
  }

  const handleDeleteArticle = async (id) => {
    if (!window.confirm('¿Deseas eliminar este artículo de la base de conocimiento?')) return
    try {
      await deleteArticle.mutateAsync(id)
      showToast('Artículo eliminado')
      setIsEditorOpen(false)
      setActiveArticle(null)
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error')
    }
  }

  if (isLoading) {
    return <div className="container section muted">Cargando base de conocimiento…</div>
  }

  return (
    <div className="container">
      <header className="page-head kb-head">
        <div>
          <p className="subtitle">Gestión del Conocimiento (Autoservicio) · ITIL 4</p>
          <h1 className="h2">Base de Conocimiento y Guías</h1>
          <p className="muted">
            Soluciones verificadas, manuales paso a paso y guías rápidas para resolver incidentes comunes sin
            esperar la atención de un agente.
          </p>
        </div>
        {can('kb:edit') && (
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              setEditingArticle(null)
              setIsEditorOpen(true)
            }}
            id="new-article-btn"
          >
            + Publicar Artículo
          </button>
        )}
      </header>

      {/* Buscador grande tipo Help Desk */}
      <div className="kb-search-box">
        <label className="kb-search-label" htmlFor="kb-search-input">
          <input
            id="kb-search-input"
            type="search"
            className="input kb-search-input"
            placeholder="¿En qué podemos ayudarte? Busca: VPN, Outlook, contraseña, 2FA…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="filters" role="group" aria-label="Categorías de artículos">
          {['Todas', ...KB_CATEGORIES].map((cat) => (
            <button
              key={cat}
              className={`chip ${selectedCat === cat ? 'is-active' : ''}`}
              onClick={() => setSelectedCat(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Artículos */}
      <div className="grid grid--3 kb-grid">
        {filtered.length === 0 ? (
          <div className="kb-empty">
            <h2 className="h3">No encontramos artículos para “{query}”</h2>
            <p className="muted">¿No encuentras la solución? Puedes generar un ticket y un técnico te ayudará.</p>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => openNewTicket({ title: query, type: 'incidente' })}
            >
              Crear Ticket de Soporte
            </button>
          </div>
        ) : (
          filtered.map((a) => (
            <article
              key={a.id}
              className="card kb-card"
              onClick={() => setActiveArticle(a)}
              id={`kb-card-${a.id}`}
            >
              <div className="card__body kb-card__body">
                <div className="kb-card__tags">
                  <span className="tag">{a.category}</span>
                  <span className="kb-card__id">{a.id}</span>
                </div>
                <h3 className="kb-card__title">{a.title}</h3>
                <p className="muted kb-card__summary">{a.summary}</p>
                <div className="kb-card__foot">
                  <span className="muted text-xs">Por {a.author} · {formatDate(a.updated_at || a.created_at)}</span>
                  <span className="kb-card__helpful">
                    Util ({a.helpful_yes || 0})
                  </span>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Modal para Leer Artículo */}
      <Modal
        id="kb-reader-modal"
        open={!!activeArticle}
        onClose={() => setActiveArticle(null)}
        title={activeArticle?.title || ''}
        subtitle={`${activeArticle?.category} · Publicado por ${activeArticle?.author}`}
      >
        {activeArticle && (
          <div className="kb-article-view">
            <p className="kb-article-lead">{activeArticle.summary}</p>
            <div className="kb-article-body">
              <pre className="kb-article-text">{activeArticle.content}</pre>
            </div>

            <div className="kb-article-feedback">
              <span>¿Te fue útil este artículo?</span>
              <div className="kb-vote-buttons">
                <button
                  type="button"
                  className={`btn btn--ghost ${votedMap[activeArticle.id] === 'yes' ? 'is-voted' : ''}`}
                  onClick={() => handleVote(activeArticle.id, true)}
                  disabled={!!votedMap[activeArticle.id]}
                >
                  Util ({activeArticle.helpful_yes || 0})
                </button>
                <button
                  type="button"
                  className={`btn btn--ghost ${votedMap[activeArticle.id] === 'no' ? 'is-voted' : ''}`}
                  onClick={() => handleVote(activeArticle.id, false)}
                  disabled={!!votedMap[activeArticle.id]}
                >
                  No util ({activeArticle.helpful_no || 0})
                </button>
              </div>
            </div>

            <div className="kb-article-actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  const title = `Consulta sobre ${activeArticle.title}`
                  setActiveArticle(null)
                  openNewTicket({ title, type: 'incidente', kb_id: activeArticle.id })
                }}
              >
                ¿Aún necesitas ayuda? Abrir Ticket
              </button>
              {can('kb:edit') && (
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    setEditingArticle(activeArticle)
                    setActiveArticle(null)
                    setIsEditorOpen(true)
                  }}
                >
                  Editar Artículo
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Editor / Crear Artículo */}
      <Modal
        id="kb-editor-modal"
        open={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false)
          setEditingArticle(null)
        }}
        title={editingArticle ? 'Editar Artículo' : 'Publicar Nuevo Artículo'}
        subtitle="Base de Conocimiento · ITIL 4"
      >
        <form className="form" onSubmit={handleSaveArticle}>
          <label className="field">
            <span className="field__label">Título de la Guía <span className="req">*</span></span>
            <input
              name="title"
              className="input"
              defaultValue={editingArticle?.title || ''}
              placeholder="Ej. Cómo configurar la VPN corporativa desde casa"
              required
            />
          </label>

          <div className="form__row">
            <label className="field">
              <span className="field__label">Categoría</span>
              <select name="category" className="select" defaultValue={editingArticle?.category || 'General'}>
                {KB_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field__label">Autor</span>
              <input
                name="author"
                className="input"
                defaultValue={editingArticle?.author || 'Equipo de Soporte TI'}
              />
            </label>
          </div>

          <label className="field">
            <span className="field__label">Resumen Breve <span className="req">*</span></span>
            <input
              name="summary"
              className="input"
              defaultValue={editingArticle?.summary || ''}
              placeholder="Descripción de 1 o 2 oraciones para la vista previa…"
              required
            />
          </label>

          <label className="field">
            <span className="field__label">Contenido Detallado (Pasos y Solución) <span className="req">*</span></span>
            <textarea
              name="content"
              className="textarea"
              style={{ minHeight: '160px' }}
              defaultValue={editingArticle?.content || ''}
              placeholder="Escribe los pasos de forma clara y enumerada…"
              required
            />
          </label>

          <div className="form__actions form__actions--split">
            {editingArticle && can('kb:delete') ? (
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => handleDeleteArticle(editingArticle.id)}
              >
                Eliminar
              </button>
            ) : <div />}

            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setIsEditorOpen(false)
                  setEditingArticle(null)
                }}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn--primary">
                Guardar y Publicar
              </button>
            </div>
          </div>
        </form>
      </Modal>
      <div style={{ height: 'var(--space-12)' }} />
    </div>
  )
}

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import './Modal.css'

/**
 * Modal accesible basado en portal: atrapa Esc, cierra al hacer clic
 * en el backdrop y mantiene un z-index controlado para que notificaciones (Toast)
 * puedan superponerse correctamente.
 */
export default function Modal({ open, onClose, title, subtitle, id, children }) {
  useEffect(() => {
    if (!open) return

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="modal-backdrop"
      id={`${id}-backdrop`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        id={id}
        className="modal modal--portal"
      >
        <div className="modal__inner">
          <header className="modal__head">
            <div>
              {subtitle && <p className="subtitle">{subtitle}</p>}
              <h2 id={`${id}-title`} className="modal__title">{title}</h2>
            </div>
            <button
              type="button"
              className="modal__close"
              aria-label="Cerrar"
              onClick={onClose}
              id={`${id}-close`}
            >
              ×
            </button>
          </header>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}

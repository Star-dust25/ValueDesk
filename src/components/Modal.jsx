import { useEffect, useRef } from 'react'
import './Modal.css'

/**
 * Modal accesible basado en <dialog> nativo: atrapa el foco, cierra con Esc
 * y bloquea el fondo sin librerías extra. Estilo flat (borde, sin sombra).
 */
export default function Modal({ open, onClose, title, subtitle, id, children }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      id={id}
      className="modal"
      aria-labelledby={`${id}-title`}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      // Clic en el backdrop (el propio <dialog>, fuera del contenido) → cerrar.
      onMouseDown={(e) => e.target === ref.current && onClose()}
    >
      {open && (
        <div className="modal__inner">
          <header className="modal__head">
            <div>
              {subtitle && <p className="subtitle">{subtitle}</p>}
              <h2 id={`${id}-title`} className="modal__title">{title}</h2>
            </div>
            <button type="button" className="modal__close" aria-label="Cerrar" onClick={onClose} id={`${id}-close`}>
              ×
            </button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  )
}

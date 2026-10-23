import { useEffect } from 'react'
import { useUIStore } from '../store/useUIStore'

export default function Toast() {
  const toast = useUIStore((s) => s.toast)
  const hide = useUIStore((s) => s.hideToast)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(hide, 3500)
    return () => clearTimeout(t)
  }, [toast, hide])

  if (!toast) return null
  return (
    <div className={`toast toast--${toast.tone}`} role="status" aria-live="polite" id="toast">
      <span aria-hidden="true" style={{ fontWeight: 800 }}>{toast.tone === 'error' ? '!' : 'OK'}</span>
      {toast.message}
      <button type="button" onClick={hide} aria-label="Cerrar notificación">×</button>
    </div>
  )
}

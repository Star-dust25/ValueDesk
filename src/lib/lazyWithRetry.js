import { lazy } from 'react'

const FLAG = 'valuedesk-chunk-reload'

/**
 * React.lazy con recuperación: si un chunk falla (p. ej. tras un nuevo deploy en Vercel
 * los hashes cambian, o hubo un corte de red), reintenta una vez y, si vuelve a fallar,
 * recarga la página una sola vez para obtener el index.html actualizado.
 */
export function lazyWithRetry(factory) {
  return lazy(async () => {
    try {
      const mod = await factory()
      sessionStorage.removeItem(FLAG)
      return mod
    } catch (firstError) {
      await new Promise((r) => setTimeout(r, 800))
      try {
        return await factory()
      } catch {
        if (navigator.onLine && !sessionStorage.getItem(FLAG)) {
          sessionStorage.setItem(FLAG, '1')
          window.location.reload()
          return new Promise(() => {}) // se queda pendiente mientras recarga
        }
        throw firstError
      }
    }
  })
}

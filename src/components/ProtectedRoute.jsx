import { Navigate, useLocation } from 'react-router-dom'
import { useSessionStore } from '../store/useSessionStore'

/**
 * Guardian de Ruta Protegida:
 * Si el usuario no esta autenticado, redirige a /login recordando
 * la ruta a la que intentaba acceder en state.from.
 * Adicionalmente, si se especifican roles permitidos y el rol no coincide,
 * redirige a una pagina autorizada (o al tablero).
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role } = useSessionStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/tablero" replace />
  }

  return children
}

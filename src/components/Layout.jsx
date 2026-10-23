import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useUIStore } from '../store/useUIStore'
import { useSessionStore } from '../store/useSessionStore'
import { isDemoMode } from '../lib/supabase'
import { resetDemoData } from '../hooks/useTickets'
import NewTicketModal from './NewTicketModal'
import TicketDetailModal from './TicketDetailModal'
import Toast from './Toast'
import './Layout.css'

const ALL_LINKS = [
  { to: '/', label: 'Inicio', end: true, roles: ['usuario', 'agente', 'gerente'] },
  { to: '/tablero', label: 'Tablero', roles: ['usuario', 'agente', 'gerente'] },
  { to: '/catalogo', label: 'Catálogo', roles: ['usuario', 'agente', 'gerente'] },
  { to: '/metricas', label: 'Métricas', roles: ['agente', 'gerente'] },
  { to: '/activos', label: 'Activos CMDB', roles: ['agente', 'gerente'] },
  { to: '/cambios', label: 'Cambios', roles: ['agente', 'gerente'] },
  { to: '/conocimiento', label: 'Conocimiento', roles: ['usuario', 'agente', 'gerente'] },
]

export default function Layout() {
  const { menuOpen, toggleMenu, closeMenu, openNewTicket, showToast } = useUIStore()
  const { isAuthenticated, role, user, logout } = useSessionStore()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  function handleResetDemo() {
    resetDemoData()
    queryClient.invalidateQueries()
    showToast('Datos de demostracion restablecidos')
  }

  function handleLogout() {
    logout()
    showToast('Sesion cerrada correctamente')
    navigate('/login')
  }

  function handleNewTicketClick() {
    if (!isAuthenticated) {
      showToast('Debes iniciar sesion para crear un ticket', 'error')
      navigate('/login', { state: { from: { pathname: '/tablero' } } })
      return
    }
    openNewTicket()
  }

  // Cierra el menu movil al navegar.
  useEffect(() => {
    closeMenu()
  }, [pathname, closeMenu])

  // Filtrar enlaces de navegacion segun el rol activo
  // Si no esta autenticado, solo ve 'Inicio' y 'Iniciar Sesion'
  const visibleLinks = !isAuthenticated
    ? ALL_LINKS.filter((l) => l.to === '/')
    : ALL_LINKS.filter((l) => l.roles.includes(role))

  return (
    <>
      <header className="nav">
        <div className="container nav__inner">
          <div className="nav__brand-group">
            <Link to="/" className="nav__brand" id="nav-brand">
              <span className="nav__logo" aria-hidden="true" />
              Value<span className="accent">Desk</span>
            </Link>

            {/* Estado de Sesion / Usuario Activo */}
            {isAuthenticated && user ? (
              <div className="user-badge" title={`${user.name} - ${user.title}`}>
                <span className="user-badge__dot" />
                <span className="user-badge__label">{user.label}:</span>
                <span className="user-badge__name">{user.name}</span>
                <button
                  type="button"
                  className="user-badge__logout"
                  onClick={handleLogout}
                  id="nav-logout"
                  title="Cerrar sesion"
                >
                  Salir
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn btn--ghost user-badge__login-btn" id="nav-login">
                Acceso por Rol
              </Link>
            )}
          </div>

          <button
            id="nav-toggle"
            className="nav__toggle"
            aria-label={menuOpen ? 'Cerrar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            aria-controls="nav-menu"
            onClick={toggleMenu}
          >
            <span /><span /><span />
          </button>

          <nav
            id="nav-menu"
            className={`nav__menu ${menuOpen ? 'is-open' : ''}`}
            aria-label="Principal"
          >
            {visibleLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                id={`nav-link-${l.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`}
              >
                {l.label}
              </NavLink>
            ))}

            {!isAuthenticated && (
              <NavLink
                to="/login"
                id="nav-link-login"
                className={({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`}
              >
                Iniciar Sesion
              </NavLink>
            )}

            <button
              type="button"
              className="btn btn--primary nav__cta"
              id="nav-cta"
              onClick={handleNewTicketClick}
            >
              + Nuevo ticket
            </button>
          </nav>
        </div>
      </header>

      {isDemoMode && (
        <div className="demo-bar" role="status">
          {isAuthenticated && user ? (
            <span>
              Sesion activa: <b>{user.name}</b> ({user.label} - {user.department}) ·{' '}
              <Link to="/login" className="demo-bar__switch">Cambiar credenciales</Link>
              {' · '}
              <button
                type="button"
                className="demo-bar__reset"
                onClick={handleResetDemo}
                id="demo-reset"
              >
                Restablecer datos
              </button>
            </span>
          ) : (
            <span>
              Modo publico sin autenticar ·{' '}
              <Link to="/login" className="demo-bar__switch">Iniciar sesion por rol</Link>
            </span>
          )}
        </div>
      )}

      <main>
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container footer__inner">
          <div className="footer__col">
            <span className="footer__brand">ValueDesk · Plataforma de Servicios ITIL 4</span>
            <span className="muted text-xs">
              Mesa de Ayuda, Catalogo, CMDB de Activos, Gestion de Cambios y Metricas en Tiempo Real.
            </span>
          </div>
          <div className="footer__col footer__col--right">
            <span>© 2026 Grupo Andina Retail</span>
            <span className="muted text-xs">React · TanStack Query · dnd-kit · R3F · Supabase · Vercel</span>
          </div>
        </div>
      </footer>

      <NewTicketModal />
      <TicketDetailModal />
      <Toast />
    </>
  )
}

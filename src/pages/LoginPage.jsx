import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSessionStore, CREDENTIALS } from '../store/useSessionStore'
import { useUIStore } from '../store/useUIStore'
import './LoginPage.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useSessionStore((s) => s.login)
  const loginAs = useSessionStore((s) => s.loginAs)
  const showToast = useUIStore((s) => s.showToast)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const fromPath = location.state?.from?.pathname
  const redirectPath = fromPath && fromPath !== '/' ? fromPath : '/tablero'

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      const user = login(email, password)
      showToast(`Sesion iniciada como ${user.label} (${user.name})`)
      navigate(redirectPath, { replace: true })
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = (role) => {
    loginAs(role)
    const target = CREDENTIALS.find((c) => c.role === role)
    showToast(`Acceso directo activado: ${target.label} (${target.name})`)
    navigate(redirectPath, { replace: true })
  }

  return (
    <div className="login-wrapper">
      <div className="container login-container">
        <header className="login-header">
          <div className="login-brand">
            <span className="login-brand__logo" aria-hidden="true" />
            <span>Value<span className="accent">Desk</span></span>
          </div>
          <p className="subtitle">Portal de Gestion ITIL 4 · Control de Acceso</p>
          <h1 className="h2">Iniciar Sesion</h1>
          <p className="muted text-sm">
            Ingresa con las credenciales asignadas a tu rol para acceder a las funciones correspondientes.
          </p>
        </header>

        <div className="login-grid">
          {/* Formulario de Inicio de Sesión */}
          <section className="card login-form-card" aria-label="Formulario de acceso">
            <form onSubmit={handleSubmit} className="form" noValidate>
              {errorMsg && (
                <div className="form__error" role="alert">
                  {errorMsg}
                </div>
              )}

              <label className="field">
                <span className="field__label">Correo Electronico</span>
                <input
                  type="email"
                  className="input"
                  placeholder="ejemplo@andina.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </label>

              <label className="field">
                <span className="field__label">Contraseña</span>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>

              <button
                type="submit"
                className="btn btn--primary login-submit-btn"
                disabled={loading || !email || !password}
              >
                {loading ? 'Validando...' : 'Acceder al Sistema'}
              </button>
            </form>
          </section>

          {/* Tarjetas de Acceso Rapido con Credenciales */}
          <section className="card login-demo-accounts" aria-label="Cuentas de demostracion">
            <header className="login-demo-accounts__head">
              <span className="subtitle">Credenciales de Demostracion</span>
              <h2 className="h3">Selecciona un Rol de Prueba</h2>
              <p className="muted text-xs">
                Haz clic en cualquier perfil para cargar sus credenciales de inmediato.
              </p>
            </header>

            <div className="accounts-list">
              {CREDENTIALS.map((account) => (
                <article
                  key={account.role}
                  className="account-item"
                  onClick={() => handleQuickLogin(account.role)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickLogin(account.role)}
                >
                  <div className="account-item__header">
                    <div>
                      <span className="account-item__name">{account.name}</span>
                      <span className="tag account-item__tag">{account.label}</span>
                    </div>
                    <span className="account-item__dept muted text-xs">{account.department}</span>
                  </div>

                  <p className="account-item__desc muted text-xs">{account.description}</p>

                  <div className="account-item__creds">
                    <code>{account.email}</code>
                    <code>clave: {account.password}</code>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

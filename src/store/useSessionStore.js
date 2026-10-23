import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Cuentas oficiales para cada rol con credenciales demostrativas.
 */
export const CREDENTIALS = [
  {
    role: 'usuario',
    email: 'usuario@andina.com',
    password: 'user123',
    name: 'Maria Garcia',
    label: 'Usuario',
    title: 'Analista de Ventas',
    department: 'Comercial',
    description: 'Solicita servicios de TI, consulta manuales de autoservicio y califica la atencion recibida.',
  },
  {
    role: 'agente',
    email: 'agente@andina.com',
    password: 'agent123',
    name: 'Ana Rivas',
    label: 'Agente',
    title: 'Especialista N1 Service Desk',
    department: 'Mesa de Ayuda TI',
    description: 'Gestiona incidentes en el tablero Kanban, actualiza activos en la CMDB y publica guias.',
  },
  {
    role: 'gerente',
    email: 'gerente@andina.com',
    password: 'admin123',
    name: 'Jorge Torres',
    label: 'Gerente',
    title: 'Gerente de Tecnologia y Servicios',
    department: 'Direccion de TI',
    description: 'Supervisa metricas de cumplimiento SLA, aprueba solicitudes de cambio RFC y administra activos.',
  },
]

export const USERS = {
  usuario: CREDENTIALS[0],
  agente: CREDENTIALS[1],
  gerente: CREDENTIALS[2],
}

export const useSessionStore = create(
  persist(
    (set) => ({
      isAuthenticated: false,
      role: null,
      user: null,
      login: (email, password) => {
        const found = CREDENTIALS.find(
          (c) => c.email.toLowerCase() === email.trim().toLowerCase() && c.password === password,
        )
        if (!found) {
          throw new Error('Credenciales incorrectas. Verifique el correo o contraseña.')
        }
        set({
          isAuthenticated: true,
          role: found.role,
          user: found,
        })
        return found
      },
      loginAs: (role) => {
        const found = USERS[role]
        if (found) {
          set({
            isAuthenticated: true,
            role: found.role,
            user: found,
          })
        }
      },
      logout: () => {
        set({
          isAuthenticated: false,
          role: null,
          user: null,
        })
      },
    }),
    { name: 'valuedesk-session' },
  ),
)

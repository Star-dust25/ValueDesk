import { useSessionStore } from '../store/useSessionStore'

/**
 * Matriz de permisos por rol (ITIL: dimensión "Organizaciones y personas").
 * usuario → consume servicios · agente → los opera · gerente → los gobierna.
 */
const USER = ['tickets:create', 'kb:view', 'kb:vote', 'csat:rate', 'comment']
const AGENT = [
  ...USER,
  'panel:view',
  'tickets:view_all',
  'tickets:edit',
  'tickets:delete',
  'assets:view',
  'assets:edit',
  'kb:edit',
  'changes:view',
  'changes:create',
]
const MATRIX = {
  usuario: USER,
  agente: AGENT,
  gerente: [...AGENT, 'assets:delete', 'kb:delete', 'changes:approve'],
}

export const can = (role, perm) => !!MATRIX[role]?.includes(perm)

export function useCan() {
  const role = useSessionStore((s) => s.role)
  return (perm) => can(role, perm)
}

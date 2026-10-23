/* Catálogos de valores del dominio (fuente única para formularios, filtros y métricas). */

export const STATUSES = [
  { id: 'nuevo', label: 'Nuevo' },
  { id: 'en_progreso', label: 'En progreso' },
  { id: 'resuelto', label: 'Resuelto' },
]

export const PRIORITIES = [
  { id: 'alta', label: 'Alta' },
  { id: 'media', label: 'Media' },
  { id: 'baja', label: 'Baja' },
]

export const TYPES = [
  { id: 'incidente', label: 'Incidente', prefix: 'INC' },
  { id: 'solicitud', label: 'Solicitud', prefix: 'REQ' },
]

export const AGENTS = ['Sin asignar', 'Ana R.', 'Luis M.', 'Carlos P.']

export const ASSET_TYPES = ['Laptop', 'Servidor', 'Monitor', 'Red', 'Licencia', 'Periférico']

export const ASSET_STATUSES = [
  { id: 'en_uso', label: 'En uso' },
  { id: 'disponible', label: 'Disponible' },
  { id: 'en_reparacion', label: 'En reparación' },
  { id: 'retirado', label: 'Retirado' },
]

export const CHANGE_TYPES = [
  { id: 'estandar', label: 'Estándar', hint: 'Bajo riesgo, pre-aprobado.' },
  { id: 'normal', label: 'Normal', hint: 'Requiere aprobación del gerente.' },
  { id: 'emergencia', label: 'Emergencia', hint: 'Se implementa de inmediato, con revisión posterior.' },
]

export const CHANGE_RISKS = [
  { id: 'bajo', label: 'Bajo' },
  { id: 'medio', label: 'Medio' },
  { id: 'alto', label: 'Alto' },
]

export const CHANGE_STATUSES = [
  { id: 'borrador', label: 'Borrador' },
  { id: 'pendiente', label: 'Pendiente' },
  { id: 'aprobado', label: 'Aprobado' },
  { id: 'implementado', label: 'Implementado' },
  { id: 'rechazado', label: 'Rechazado' },
  { id: 'fallido', label: 'Fallido' },
]

export const KB_CATEGORIES = ['General', 'Seguridad', 'Hardware', 'Software', 'Conectividad']

export const labelOf = (list, id) => list.find((x) => x.id === id)?.label ?? id

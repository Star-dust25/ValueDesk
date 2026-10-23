import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createRepo } from '../lib/repo'

const agoHours = (h) => new Date(Date.now() - h * 3_600_000).toISOString()
const futureHours = (h) => new Date(Date.now() + h * 3_600_000).toISOString()

const SEED_CHANGES = [
  {
    id: 'CHG-101',
    title: 'Actualización de firmware en switches core de sucursal San Isidro',
    type: 'normal',
    risk: 'medio',
    status: 'pendiente',
    requester: 'Carlos P.',
    approver: 'Jorge T.',
    service: 'red',
    scheduled_start: futureHours(36),
    scheduled_end: futureHours(40),
    description: 'Parche de vulnerabilidad CVE-2024 y optimización de latencia en switches Cisco 2960.',
    backout_plan: 'Restaurar imagen previa de IOS desde backup en TFTP local (tiempo estimado 25 min).',
    created_at: agoHours(24),
  },
  {
    id: 'CHG-102',
    title: 'Ampliación de almacenamiento en volumen de base de datos Supabase',
    type: 'estandar',
    risk: 'bajo',
    status: 'aprobado',
    requester: 'Ana R.',
    approver: 'Pre-aprobado por CAB',
    service: 'acceso',
    scheduled_start: futureHours(12),
    scheduled_end: futureHours(13),
    description: 'Incrementar SSD provisionado de 50GB a 150GB para evitar alertas de espacio.',
    backout_plan: 'Operación no destructiva gestionada en caliente por la nube.',
    created_at: agoHours(8),
  },
  {
    id: 'CHG-103',
    title: 'Reinicio de emergencia de cluster de correo tras bloqueo de cola',
    type: 'emergencia',
    risk: 'alto',
    status: 'implementado',
    requester: 'Carlos P.',
    approver: 'Jorge T.',
    service: 'correo',
    scheduled_start: agoHours(4),
    scheduled_end: agoHours(3),
    description: 'Proceso de sincronización saturó memoria provocando caída del servicio de correos.',
    backout_plan: 'Aislamiento de nodo afectado y failover al secundario.',
    created_at: agoHours(5),
  },
]

export const changeRepo = createRepo('changes', SEED_CHANGES, { prefix: 'CHG' })
const KEY = ['changes']

export function useChanges() {
  return useQuery({ queryKey: KEY, queryFn: () => changeRepo.list() })
}

export function useCreateChange() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input) =>
      changeRepo.create({
        ...input,
        status: input.type === 'estandar' ? 'aprobado' : 'pendiente',
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateChange() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...patch }) => changeRepo.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteChange() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => changeRepo.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

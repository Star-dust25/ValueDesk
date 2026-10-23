import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createRepo } from '../lib/repo'

const agoDays = (d) => new Date(Date.now() - d * 86_400_000).toISOString()
const futureDays = (d) => new Date(Date.now() + d * 86_400_000).toISOString()

const SEED_ASSETS = [
  {
    id: 'AST-101',
    name: 'Dell Latitude 5540 #12',
    type: 'Laptop',
    serial: 'DL-5540-8831',
    assigned_to: 'Ana R.',
    status: 'en_uso',
    location: 'Sucursal Central - Piso 2',
    cost: 1450,
    warranty_until: futureDays(210),
    created_at: agoDays(120),
    notes: 'Intel i7 16GB RAM 512GB SSD. Asignado a Soporte N1.',
  },
  {
    id: 'AST-102',
    name: 'Dell Latitude 5540 #14',
    type: 'Laptop',
    serial: 'DL-5540-9104',
    assigned_to: 'María G.',
    status: 'en_uso',
    location: 'Sucursal Miraflores',
    cost: 1450,
    warranty_until: futureDays(45), // garantía por vencer (<60 días)
    created_at: agoDays(320),
    notes: 'Asignado a Ventas. Batería en 88% de salud.',
  },
  {
    id: 'AST-103',
    name: 'Servidor ProLiant DL380 Gen10',
    type: 'Servidor',
    serial: 'HPE-DL380-041',
    assigned_to: 'Infraestructura TI',
    status: 'en_uso',
    location: 'Datacenter Principal - Rack 4',
    cost: 6800,
    warranty_until: futureDays(480),
    created_at: agoDays(240),
    notes: 'Nodo principal de base de datos y virtualización VMware.',
  },
  {
    id: 'AST-104',
    name: 'Switch Cisco Catalyst 2960-X',
    type: 'Red',
    serial: 'CSCO-2960-551',
    assigned_to: 'Redes y Telecom',
    status: 'en_uso',
    location: 'Sucursal San Isidro - Rack B',
    cost: 1200,
    warranty_until: agoDays(15), // garantía vencida
    created_at: agoDays(400),
    notes: '48 puertos PoE+. Firmware actualizado v15.2.',
  },
  {
    id: 'AST-105',
    name: 'Monitor LG UltraFine 27" 4K',
    type: 'Monitor',
    serial: 'LG-27UP-3301',
    assigned_to: 'Stock de Reserva',
    status: 'disponible',
    location: 'Almacén TI - Estante 3',
    cost: 420,
    warranty_until: futureDays(300),
    created_at: agoDays(60),
    notes: 'En caja sellada para nuevos ingresos o reemplazos.',
  },
  {
    id: 'AST-106',
    name: 'Licencia Microsoft 365 E5 (Pool)',
    type: 'Licencia',
    serial: 'MS365-E5-POOL-50',
    assigned_to: 'Administración Global',
    status: 'en_uso',
    location: 'Cloud Tenant',
    cost: 2160,
    warranty_until: futureDays(180),
    created_at: agoDays(180),
    notes: 'Suscripción anual corporativa para 50 usuarios.',
  },
]

export const assetRepo = createRepo('assets', SEED_ASSETS, { prefix: 'AST' })
const KEY = ['assets']

export function useAssets() {
  return useQuery({ queryKey: KEY, queryFn: () => assetRepo.list() })
}

export function useCreateAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input) => assetRepo.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...patch }) => assetRepo.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => assetRepo.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

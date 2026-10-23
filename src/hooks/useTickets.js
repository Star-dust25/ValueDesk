import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, isDemoMode } from '../lib/supabase'
import { STATUSES, PRIORITIES, TYPES, AGENTS } from '../data/constants'
import { assetRepo } from './useAssets'
import { kbRepo } from './useKnowledge'
import { changeRepo } from './useChanges'

export { STATUSES, PRIORITIES, TYPES, AGENTS }

const KEY = ['tickets']
const COLUMNS =
  'id, title, description, service, type, priority, status, position, assignee, asset_id, kb_id, csat, csat_comment, comments, created_at, updated_at, resolved_at'
const LS_KEY = 'valuedesk-tickets-v2'

const ago = (h) => new Date(Date.now() - h * 3_600_000).toISOString()

const DEMO_TICKETS = [
  {
    id: 'INC-101',
    title: 'VPN no conecta desde casa',
    description: 'Error de autenticación al conectar con FortiClient (código de error -8).',
    service: 'red',
    type: 'incidente',
    priority: 'alta',
    status: 'nuevo',
    position: 0,
    assignee: 'Ana R.',
    asset_id: 'AST-101',
    kb_id: 'KB-101',
    created_at: ago(2.5),
    updated_at: ago(2),
    comments: [
      {
        id: 'c1',
        author: 'María G.',
        role: 'usuario',
        text: 'Intenté reinstalar la aplicación pero sigue saliendo el mismo error al pedir el token.',
        created_at: ago(2.2),
      },
      {
        id: 'c2',
        author: 'Ana R.',
        role: 'agente',
        text: 'Revisando logs en el firewall corporativo. Parece ser bloqueo por intentos fallidos.',
        created_at: ago(1.8),
      },
    ],
  },
  {
    id: 'REQ-204',
    title: 'Alta de laptop para nuevo ingreso',
    description: 'Ingresa el lunes al área de Ventas. Requiere paquetería Office y ERP.',
    service: 'equipo',
    type: 'solicitud',
    priority: 'media',
    status: 'nuevo',
    position: 1,
    assignee: 'Luis M.',
    asset_id: 'AST-105',
    created_at: ago(5),
    updated_at: ago(5),
    comments: [],
  },
  {
    id: 'INC-102',
    title: 'Impresora piso 3 sin tóner',
    description: 'Equipo HP LaserJet multifuncional reporta cartucho negro agotado.',
    service: 'activos',
    type: 'incidente',
    priority: 'baja',
    status: 'nuevo',
    position: 2,
    assignee: 'Sin asignar',
    created_at: ago(26),
    updated_at: ago(26),
    comments: [],
  },
  {
    id: 'REQ-205',
    title: 'Acceso a carpeta de Finanzas',
    description: 'Permiso de solo lectura a la carpeta presupuestos 2026, aprobado por gerencia.',
    service: 'acceso',
    type: 'solicitud',
    priority: 'media',
    status: 'en_progreso',
    position: 0,
    assignee: 'Ana R.',
    created_at: ago(30),
    updated_at: ago(4),
    comments: [
      {
        id: 'c3',
        author: 'Ana R.',
        role: 'agente',
        text: 'Solicitud tramitada con el oficial de seguridad. Esperando propagación de permisos en Active Directory.',
        created_at: ago(4),
      },
    ],
  },
  {
    id: 'INC-103',
    title: 'Correo lento en Outlook',
    description: 'Buzón tarda más de 3 minutos en sincronizar nuevos correos recibidos.',
    service: 'correo',
    type: 'incidente',
    priority: 'alta',
    status: 'en_progreso',
    position: 1,
    assignee: 'Carlos P.',
    kb_id: 'KB-102',
    created_at: ago(8),
    updated_at: ago(1),
    comments: [
      {
        id: 'c4',
        author: 'Carlos P.',
        role: 'agente',
        text: 'Se aplicó reducción del archivo .OST a modo caché de 6 meses según KB-102.',
        created_at: ago(1),
      },
    ],
  },
  {
    id: 'REQ-206',
    title: 'Instalar licencia de Figma',
    description: 'Asignar membresía del pool corporativo para diseñador UX.',
    service: 'software',
    type: 'solicitud',
    priority: 'baja',
    status: 'resuelto',
    position: 0,
    assignee: 'Luis M.',
    created_at: ago(72),
    updated_at: ago(48),
    resolved_at: ago(48),
    csat: 5,
    csat_comment: '¡Atención súper rápida y la licencia funcionó a la primera!',
    comments: [
      {
        id: 'c5',
        author: 'Luis M.',
        role: 'agente',
        text: 'Licencia aprovisionada en el workspace corporativo y verificada con el usuario.',
        created_at: ago(48),
      },
    ],
  },
]

function loadDemo() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* fallback a semilla */
  }
  return structuredClone(DEMO_TICKETS)
}

let demoStore = loadDemo()

function persistDemo(list) {
  demoStore = list
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list))
  } catch {
    /* noop */
  }
}

export function resetDemoData() {
  persistDemo(structuredClone(DEMO_TICKETS))
  assetRepo.reset()
  kbRepo.reset()
  changeRepo.reset()
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

export function nextTicketId(tickets, type) {
  const prefix = TYPES.find((t) => t.id === type)?.prefix ?? 'INC'
  const max = tickets
    .filter((t) => t.id.startsWith(`${prefix}-`))
    .reduce((m, t) => Math.max(m, Number(t.id.split('-')[1]) || 0), 100)
  return `${prefix}-${max + 1}`
}

const toRow = (t) => ({
  id: t.id,
  title: t.title,
  description: t.description ?? '',
  service: t.service ?? null,
  type: t.type,
  priority: t.priority,
  status: t.status,
  position: t.position,
  assignee: t.assignee,
  asset_id: t.asset_id ?? null,
  kb_id: t.kb_id ?? null,
  csat: t.csat ?? null,
  csat_comment: t.csat_comment ?? null,
  comments: t.comments ?? [],
  created_at: t.created_at,
  updated_at: t.updated_at ?? t.created_at,
  resolved_at: t.resolved_at ?? null,
})

async function fetchTickets() {
  if (isDemoMode) {
    await delay(180)
    return structuredClone(demoStore)
  }
  const { data, error } = await supabase
    .from('tickets')
    .select(COLUMNS)
    .order('position', { ascending: true })
  if (error) throw error
  return data
}

async function createTicket(input) {
  const current = isDemoMode ? demoStore : await fetchTickets()
  const inNew = current.filter((t) => t.status === 'nuevo')
  const now = new Date().toISOString()

  const ticket = toRow({
    id: nextTicketId(current, input.type),
    title: input.title.trim(),
    description: (input.description ?? '').trim(),
    service: input.service || null,
    type: input.type,
    priority: input.priority,
    status: 'nuevo',
    position: inNew.length ? Math.min(...inNew.map((t) => t.position)) - 1 : 0,
    assignee: input.assignee || 'Sin asignar',
    asset_id: input.asset_id || null,
    kb_id: input.kb_id || null,
    comments: input.initialComment
      ? [
          {
            id: crypto.randomUUID(),
            author: input.author || 'Usuario',
            role: input.role || 'usuario',
            text: input.initialComment,
            created_at: now,
          },
        ]
      : [],
    created_at: now,
    updated_at: now,
  })

  if (isDemoMode) {
    await delay(180)
    persistDemo([...demoStore, ticket])
    return ticket
  }
  const { data, error } = await supabase.from('tickets').insert(ticket).select(COLUMNS).single()
  if (error) throw error
  return data
}

async function updateTicket({ id, ...patch }) {
  const now = new Date().toISOString()
  const updatedPatch = { ...patch, updated_at: now }

  // Si cambia a resuelto y no tenía resolved_at, lo fijamos
  if (patch.status === 'resuelto' && !patch.resolved_at) {
    updatedPatch.resolved_at = now
  } else if (patch.status && patch.status !== 'resuelto') {
    updatedPatch.resolved_at = null
  }

  if (isDemoMode) {
    await delay(120)
    persistDemo(demoStore.map((t) => (t.id === id ? { ...t, ...updatedPatch } : t)))
    return
  }
  const { error } = await supabase.from('tickets').update(updatedPatch).eq('id', id)
  if (error) throw error
}

async function deleteTicket(id) {
  if (isDemoMode) {
    await delay(100)
    persistDemo(demoStore.filter((t) => t.id !== id))
    return
  }
  const { error } = await supabase.from('tickets').delete().eq('id', id)
  if (error) throw error
}

async function saveTickets(tickets) {
  if (isDemoMode) {
    await delay(100)
    persistDemo(structuredClone(tickets))
    return tickets
  }
  const { error } = await supabase.from('tickets').upsert(tickets.map(toRow), { onConflict: 'id' })
  if (error) throw error
  return tickets
}

async function addCommentToTicket({ ticketId, text, author, role }) {
  const current = isDemoMode ? demoStore : await fetchTickets()
  const target = current.find((t) => t.id === ticketId)
  if (!target) throw new Error('Ticket no encontrado')

  const newComment = {
    id: crypto.randomUUID(),
    author,
    role,
    text: text.trim(),
    created_at: new Date().toISOString(),
  }
  const nextComments = [...(target.comments || []), newComment]
  await updateTicket({ id: ticketId, comments: nextComments })
  return newComment
}

async function rateTicketCSAT({ ticketId, rating, comment }) {
  await updateTicket({
    id: ticketId,
    csat: Number(rating),
    csat_comment: (comment || '').trim() || null,
  })
}

export function useTickets() {
  return useQuery({ queryKey: KEY, queryFn: fetchTickets })
}

function useOptimistic(mutationFn, applyToCache) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: KEY })
      const previous = qc.getQueryData(KEY)
      qc.setQueryData(KEY, (old = []) => applyToCache(old, vars))
      return { previous }
    },
    onError: (_err, _vars, ctx) => ctx && qc.setQueryData(KEY, ctx.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useSaveTickets() {
  return useOptimistic(saveTickets, (_old, next) => next)
}

export function useUpdateTicket() {
  return useOptimistic(updateTicket, (old, { id, ...patch }) =>
    old.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  )
}

export function useDeleteTicket() {
  return useOptimistic(deleteTicket, (old, id) => old.filter((t) => t.id !== id))
}

export function useCreateTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createTicket,
    onSuccess: (ticket) => qc.setQueryData(KEY, (old = []) => [...old, ticket]),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useAddComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: addCommentToTicket,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useRateCSAT() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: rateTicketCSAT,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

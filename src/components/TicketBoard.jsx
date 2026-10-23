import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { STATUSES, useSaveTickets, useTickets } from '../hooks/useTickets'
import { useUIStore } from '../store/useUIStore'
import { serviceById } from '../data/services'
import { timeAgo } from '../lib/time'
import './TicketBoard.css'

const PRIORITIES = ['all', 'alta', 'media', 'baja']

/** Agrupa la lista plana de tickets en columnas { nuevo: [], en_progreso: [], resuelto: [] }. */
function groupByStatus(tickets = []) {
  const board = Object.fromEntries(STATUSES.map((s) => [s.id, []]))
  ;[...tickets]
    .sort((a, b) => a.position - b.position)
    .forEach((t) => board[t.status]?.push(t))
  return board
}

/** Aplana el tablero recalculando status y position según la columna/índice final. */
function flatten(board) {
  return Object.entries(board).flatMap(([status, list]) =>
    list.map((t, position) => ({ ...t, status, position })),
  )
}

/* ------------------------------------------------------------------ */
/* Tarjeta de ticket (presentacional, reutilizada en lista y overlay) */
/* ------------------------------------------------------------------ */
function TicketCard({ ticket, dragging = false, overlay = false, ...rest }) {
  const service = serviceById(ticket.service)
  return (
    <article
      className={`ticket ticket--${ticket.priority} ${dragging ? 'is-dragging' : ''} ${overlay ? 'is-overlay' : ''}`}
      {...rest}
    >
      <header className="ticket__head">
        <span className="ticket__id">{ticket.id}</span>
        <span className={`ticket__prio ticket__prio--${ticket.priority}`}>{ticket.priority}</span>
      </header>
      <h3 className="ticket__title">{ticket.title}</h3>
      {service && <span className="ticket__service">{service.name} · SLA {service.sla}</span>}
      <footer className="ticket__foot">
        <span className="tag tag--outline">{ticket.type}</span>
        <span className="ticket__assignee">{ticket.assignee} · {timeAgo(ticket.created_at)}</span>
      </footer>
    </article>
  )
}

function SortableTicket({ ticket }) {
  const openTicket = useUIStore((s) => s.openTicket)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket.id,
  })
  return (
    <TicketCard
      ticket={ticket}
      dragging={isDragging}
      ref={setNodeRef}
      id={`ticket-${ticket.id}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      aria-roledescription="ticket arrastrable"
      // Clic (sin arrastre) o Enter → abrir detalle. Espacio queda reservado para arrastrar.
      onClick={() => openTicket(ticket.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          openTicket(ticket.id)
        } else {
          listeners?.onKeyDown?.(e)
        }
      }}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Columna (droppable aunque esté vacía)                              */
/* ------------------------------------------------------------------ */
function Column({ status, tickets }) {
  const { setNodeRef, isOver } = useDroppable({ id: status.id })
  return (
    <section className={`column ${isOver ? 'is-over' : ''}`} aria-labelledby={`col-${status.id}`}>
      <header className="column__head">
        <h2 id={`col-${status.id}`} className="h3">{status.label}</h2>
        <span className="column__count">{tickets.length}</span>
      </header>
      <SortableContext items={tickets.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="column__list">
          {tickets.map((t) => (
            <SortableTicket key={t.id} ticket={t} />
          ))}
          {tickets.length === 0 && <p className="column__empty">Suelta un ticket aquí</p>}
        </div>
      </SortableContext>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Tablero                                                            */
/* ------------------------------------------------------------------ */
export default function TicketBoard() {
  const { data, isLoading, isError, error } = useTickets()
  const { mutate, isPending } = useSaveTickets()
  const { priorityFilter, setPriorityFilter, openNewTicket } = useUIStore()

  // Borrador local SOLO durante el arrastre; fuera de él, la fuente de verdad es TanStack Query.
  const [draft, setDraft] = useState(null)
  const [activeId, setActiveId] = useState(null)

  const board = useMemo(() => draft ?? groupByStatus(data), [draft, data])

  const visible = (list) =>
    priorityFilter === 'all' ? list : list.filter((t) => t.priority === priorityFilter)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // En móvil, un pequeño delay evita conflictos con el scroll vertical.
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space'] },
    }),
  )

  const findContainer = (b, id) =>
    id in b ? id : Object.keys(b).find((key) => b[key].some((t) => t.id === id))

  const activeTicket = activeId
    ? Object.values(board).flat().find((t) => t.id === activeId)
    : null

  function handleDragStart({ active }) {
    setActiveId(active.id)
    setDraft(groupByStatus(data))
  }

  // Mover entre columnas mientras se arrastra (feedback inmediato).
  function handleDragOver({ active, over }) {
    if (!over) return
    setDraft((prev) => {
      const from = findContainer(prev, active.id)
      const to = findContainer(prev, over.id)
      if (!from || !to || from === to) return prev

      const fromList = [...prev[from]]
      const toList = [...prev[to]]
      const [moved] = fromList.splice(fromList.findIndex((t) => t.id === active.id), 1)
      const overIndex = toList.findIndex((t) => t.id === over.id)
      toList.splice(overIndex >= 0 ? overIndex : toList.length, 0, { ...moved, status: to })

      return { ...prev, [from]: fromList, [to]: toList }
    })
  }

  // Reordenar dentro de la columna y persistir (optimista) en Supabase.
  function handleDragEnd({ active, over }) {
    let final = draft
    if (over && draft) {
      const container = findContainer(draft, active.id)
      const overContainer = findContainer(draft, over.id)
      if (container && container === overContainer && active.id !== over.id) {
        const list = draft[container]
        const oldIndex = list.findIndex((t) => t.id === active.id)
        const newIndex = list.findIndex((t) => t.id === over.id)
        if (newIndex >= 0) final = { ...draft, [container]: arrayMove(list, oldIndex, newIndex) }
      }
    }
    if (final) mutate(flatten(final))
    setDraft(null)
    setActiveId(null)
  }

  function handleDragCancel() {
    setDraft(null)
    setActiveId(null)
  }

  if (isLoading) return <BoardSkeleton />
  if (isError) return <p className="board__error">Error al cargar tickets: {error.message}</p>

  return (
    <div className="board">
      <div className="board__toolbar">
        <div className="filters" role="group" aria-label="Filtrar por prioridad">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              id={`filter-${p}`}
              className={`chip ${priorityFilter === p ? 'is-active' : ''}`}
              aria-pressed={priorityFilter === p}
              onClick={() => setPriorityFilter(p)}
            >
              {p === 'all' ? 'Todas' : p}
            </button>
          ))}
        </div>
        <div className="board__right">
          <span className={`board__sync ${isPending ? 'is-saving' : ''}`} aria-live="polite">
            {isPending ? 'Guardando…' : 'Sincronizado'}
          </span>
          <button type="button" className="btn btn--primary" id="board-new-ticket" onClick={() => openNewTicket()}>
            + Nuevo ticket
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        accessibility={{
          screenReaderInstructions: {
            draggable: 'Pulsa Enter para ver el detalle. Pulsa espacio para tomar el ticket, flechas para moverlo y espacio para soltarlo.',
          },
        }}
      >
        <div className="board__columns">
          {STATUSES.map((s) => (
            <Column key={s.id} status={s} tickets={visible(board[s.id] ?? [])} />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 160, easing: 'ease-out' }}>
          {activeTicket ? <TicketCard ticket={activeTicket} overlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

function BoardSkeleton() {
  return (
    <div className="board__columns" aria-busy="true">
      {STATUSES.map((s) => (
        <div key={s.id} className="column">
          <div className="skeleton skeleton--title" />
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      ))}
    </div>
  )
}

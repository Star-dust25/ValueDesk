import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Estado global de UI (cliente). El estado de servidor (tickets) vive en TanStack Query;
 * Zustand solo guarda preferencias y estado efímero de la interfaz.
 */
export const useUIStore = create(
  persist(
    (set) => ({
      menuOpen: false,
      priorityFilter: 'all', // 'all' | 'alta' | 'media' | 'baja'
      toggleMenu: () => set((s) => ({ menuOpen: !s.menuOpen })),
      closeMenu: () => set({ menuOpen: false }),
      setPriorityFilter: (priorityFilter) => set({ priorityFilter }),

      // Modal "Nuevo ticket": null = cerrado; objeto = abierto con valores pre-llenados.
      newTicket: null,
      openNewTicket: (preset = {}) => set({ newTicket: preset, menuOpen: false }),
      closeNewTicket: () => set({ newTicket: null }),

      // Modal de detalle/edición de un ticket existente.
      selectedTicketId: null,
      openTicket: (id) => set({ selectedTicketId: id }),
      closeTicket: () => set({ selectedTicketId: null }),

      // Notificación efímera.
      toast: null,
      showToast: (message, tone = 'success') => set({ toast: { message, tone, id: Date.now() } }),
      hideToast: () => set({ toast: null }),
    }),
    {
      name: 'valuedesk-ui',
      partialize: (s) => ({ priorityFilter: s.priorityFilter }),
    },
  ),
)

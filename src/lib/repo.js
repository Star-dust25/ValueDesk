import { supabase, isDemoMode } from './supabase'

const VERSION = 'v2'
const delay = (ms) => new Promise((r) => setTimeout(r, ms))

/** Siguiente ID correlativo con prefijo: AST-111, CHG-106… */
export function nextId(list, prefix) {
  const max = list
    .filter((r) => String(r.id).startsWith(`${prefix}-`))
    .reduce((m, r) => Math.max(m, Number(String(r.id).split('-')[1]) || 0), 100)
  return `${prefix}-${max + 1}`
}

/**
 * Repositorio genérico (patrón Repository): misma API para Supabase (PostgreSQL)
 * o para el modo demo (localStorage). Los módulos no saben dónde se guardan los datos.
 */
export function createRepo(table, seed = [], { prefix } = {}) {
  const key = `valuedesk-${table}-${VERSION}`

  const load = () => {
    try {
      const raw = localStorage.getItem(key)
      if (raw) return JSON.parse(raw)
    } catch {
      /* almacenamiento no disponible */
    }
    return structuredClone(seed)
  }

  let store = load()
  const save = (list) => {
    store = list
    try {
      localStorage.setItem(key, JSON.stringify(list))
    } catch {
      /* sin persistencia */
    }
  }

  async function list() {
    if (isDemoMode) {
      await delay(120)
      return structuredClone(store)
    }
    const { data, error } = await supabase.from(table).select('*')
    if (error) throw error
    return data
  }

  async function withId(row) {
    if (row.id) return row
    if (!prefix) return { ...row, id: crypto.randomUUID() }
    return { ...row, id: nextId(isDemoMode ? store : await list(), prefix) }
  }

  async function create(input) {
    const row = await withId({ created_at: new Date().toISOString(), ...input })
    if (isDemoMode) {
      await delay(150)
      save([...store, row])
      return structuredClone(row)
    }
    const { data, error } = await supabase.from(table).insert(row).select().single()
    if (error) throw error
    return data
  }

  async function update(id, patch) {
    if (isDemoMode) {
      await delay(100)
      save(store.map((r) => (r.id === id ? { ...r, ...patch } : r)))
      return
    }
    const { error } = await supabase.from(table).update(patch).eq('id', id)
    if (error) throw error
  }

  async function remove(id) {
    if (isDemoMode) {
      await delay(100)
      save(store.filter((r) => r.id !== id))
      return
    }
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw error
  }

  async function upsertMany(rows) {
    if (isDemoMode) {
      await delay(120)
      const map = new Map(store.map((r) => [r.id, r]))
      rows.forEach((r) => map.set(r.id, { ...map.get(r.id), ...r }))
      save([...map.values()])
      return
    }
    const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' })
    if (error) throw error
  }

  const reset = () => save(structuredClone(seed))

  return { table, list, create, update, remove, upsertMany, reset }
}

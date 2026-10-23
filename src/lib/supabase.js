import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Cliente Supabase (PostgreSQL gestionado + Auth + Realtime + RLS).
 * Si no hay variables de entorno, la app funciona en "modo demo" con datos locales,
 * lo que permite "empezar donde se está" sin bloquear el desarrollo del frontend.
 */
export const supabase = url && anonKey ? createClient(url, anonKey) : null
export const isDemoMode = !supabase

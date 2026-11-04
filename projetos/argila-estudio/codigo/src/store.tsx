import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import type { Booking } from './types'

interface State { favorites: string[]; bookings: Booking[] }
type Action =
  | { type: 'toggleFav'; id: string }
  | { type: 'book'; booking: Booking }
  | { type: 'cancel'; id: string }

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'toggleFav':
      return { ...s, favorites: s.favorites.includes(a.id) ? s.favorites.filter((x) => x !== a.id) : [...s.favorites, a.id] }
    case 'book':
      return { ...s, bookings: [...s.bookings, a.booking] }
    case 'cancel':
      return { ...s, bookings: s.bookings.filter((b) => b.id !== a.id) }
  }
}

const KEY = 'argila-state-v1'
function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as State
  } catch {
    /* corrupted storage: start fresh */
  }
  return { favorites: [], bookings: [] }
}

const Ctx = createContext<(State & { dispatch: React.Dispatch<Action> }) | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  useEffect(() => localStorage.setItem(KEY, JSON.stringify(state)), [state])
  return <Ctx.Provider value={{ ...state, dispatch }}>{children}</Ctx.Provider>
}

export function useStore() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useStore must be used inside StoreProvider')
  return c
}

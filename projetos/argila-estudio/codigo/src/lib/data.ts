import classesJson from '../data/classes.json'
import sessionsJson from '../data/sessions.json'
import type { ClassItem, Session, Booking } from '../types'

export const classes = classesJson as ClassItem[]
export const sessions = sessionsJson as Session[]

export const categories = ['All', ...Array.from(new Set(classes.map((c) => c.category)))]
export const levels = ['All', 'Beginner', 'Intermediate', 'Advanced']

export interface Filters { query: string; category: string; level: string; maxPrice: number }

export function filterClasses(list: ClassItem[], f: Filters): ClassItem[] {
  const q = f.query.trim().toLowerCase()
  return list.filter(
    (c) =>
      (!q || `${c.title} ${c.summary} ${c.teacher}`.toLowerCase().includes(q)) &&
      (f.category === 'All' || c.category === f.category) &&
      (f.level === 'All' || c.level === f.level) &&
      c.price <= f.maxPrice,
  )
}

export function seatsLeft(s: Session, bookings: Booking[]): number {
  return s.seats - bookings.filter((b) => b.sessionId === s.id).reduce((n, b) => n + b.people, 0)
}

export const money = (n: number) => `$${n}`
export const dateLabel = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

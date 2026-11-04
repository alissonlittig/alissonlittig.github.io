export type Level = 'Beginner' | 'Intermediate' | 'Advanced'
export interface Session { id: string; classId: string; date: string; time: string; seats: number }
export interface ClassItem {
  id: string; title: string; category: string; level: Level; duration: number
  price: number; teacher: string; summary: string; description: string; color: string
}
export interface Booking {
  id: string; sessionId: string; classId: string; name: string; email: string; people: number; note: string
}

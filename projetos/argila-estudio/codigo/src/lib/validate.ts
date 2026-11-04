export interface BookingForm { name: string; email: string; people: string; note: string }
export type Errors = Partial<Record<keyof BookingForm | 'session', string>>

export function validate(f: BookingForm, sessionId: string | null, seatsLeft: number): Errors {
  const e: Errors = {}
  if (!sessionId) e.session = 'Pick a date and time.'
  if (f.name.trim().length < 2) e.name = 'Please enter your full name.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = 'Enter a valid e-mail address.'
  const p = Number(f.people)
  if (!Number.isInteger(p) || p < 1) e.people = 'At least 1 person.'
  else if (sessionId && p > seatsLeft) e.people = `Only ${seatsLeft} seat(s) left.`
  if (f.note.length > 200) e.note = 'Keep it under 200 characters.'
  return e
}

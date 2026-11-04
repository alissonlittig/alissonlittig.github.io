import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { classes, dateLabel, money, seatsLeft, sessions } from '../lib/data'
import { validate, type BookingForm, type Errors } from '../lib/validate'
import { useStore } from '../store'

const empty: BookingForm = { name: '', email: '', people: '1', note: '' }

export default function ClassDetail() {
  const { id } = useParams()
  const c = classes.find((x) => x.id === id)
  const { bookings, dispatch } = useStore()
  const nav = useNavigate()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState<Errors>({})

  if (!c) return <section className="wrap"><h1>Class not found</h1><Link className="btn" to="/classes">All classes</Link></section>
  const list = sessions.filter((s) => s.classId === c.id).sort((a, b) => a.date.localeCompare(b.date))
  const current = list.find((s) => s.id === sessionId)
  const left = current ? seatsLeft(current, bookings) : 0

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const errs = validate(form, sessionId, left)
    setErrors(errs)
    if (Object.keys(errs).length) return
    dispatch({ type: 'book', booking: { id: crypto.randomUUID(), sessionId: sessionId!, classId: c.id, name: form.name.trim(), email: form.email.trim(), people: Number(form.people), note: form.note.trim() } })
    nav('/bookings')
  }
  const field = (k: keyof BookingForm) => ({
    id: `f-${k}`, value: form[k], 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `e-${k}` : undefined,
    onChange: (ev: { target: { value: string } }) => setForm({ ...form, [k]: ev.target.value }),
  })
  const err = (k: keyof Errors) => errors[k] && <span className="err" id={`e-${k}`} role="alert">{errors[k]}</span>
  const qty = Number(form.people) > 0 ? Number(form.people) : 1

  return (
    <section className="wrap detail">
      <Link to="/classes" className="back">← All classes</Link>
      <div className="swatch big" style={{ background: c.color }}><span>{c.category}</span></div>
      <h1>{c.title}</h1>
      <p className="meta"><span>{c.level}</span><span>{c.duration} min</span><span>with {c.teacher}</span><strong>{money(c.price)}</strong></p>
      <p>{c.description}</p>

      <form onSubmit={submit} noValidate className="booking" aria-label="Book this class">
        <fieldset>
          <legend>1. Choose a session</legend>
          <div className="sessions">
            {list.map((s) => {
              const n = seatsLeft(s, bookings)
              return (
                <label key={s.id} className={'session' + (n <= 0 ? ' full' : '') + (sessionId === s.id ? ' sel' : '')}>
                  <input type="radio" name="session" disabled={n <= 0} checked={sessionId === s.id} onChange={() => setSessionId(s.id)} />
                  <strong>{dateLabel(s.date)}</strong> {s.time}<small>{n <= 0 ? 'Full' : `${n} seats left`}</small>
                </label>
              )
            })}
          </div>
          {err('session')}
        </fieldset>
        <fieldset>
          <legend>2. Your details</legend>
          <label htmlFor="f-name">Full name</label><input autoComplete="name" {...field('name')} />{err('name')}
          <label htmlFor="f-email">E-mail</label><input type="email" autoComplete="email" {...field('email')} />{err('email')}
          <label htmlFor="f-people">People</label><input type="number" min={1} {...field('people')} />{err('people')}
          <label htmlFor="f-note">Note (optional)</label><textarea rows={3} {...field('note')} />{err('note')}
        </fieldset>
        <button className="btn" type="submit">Book {money(c.price * qty)}</button>
      </form>
    </section>
  )
}

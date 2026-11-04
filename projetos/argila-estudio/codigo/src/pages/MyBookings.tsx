import { Link } from 'react-router-dom'
import { classes, dateLabel, sessions } from '../lib/data'
import { useStore } from '../store'

export default function MyBookings() {
  const { bookings, dispatch } = useStore()
  return (
    <section className="wrap">
      <h1>My bookings</h1>
      {bookings.length === 0 ? (
        <p className="empty">No bookings yet. <Link to="/classes">Find a class</Link>.</p>
      ) : (
        <ul className="list">
          {bookings.map((b) => {
            const c = classes.find((x) => x.id === b.classId)!
            const s = sessions.find((x) => x.id === b.sessionId)!
            return (
              <li key={b.id}>
                <div><strong>{c.title}</strong><br /><small>{dateLabel(s.date)} · {s.time} · {b.people} {b.people === 1 ? 'person' : 'people'} · {b.name}</small></div>
                <button className="btn ghost" onClick={() => dispatch({ type: 'cancel', id: b.id })} aria-label={`Cancel ${c.title}`}>Cancel</button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

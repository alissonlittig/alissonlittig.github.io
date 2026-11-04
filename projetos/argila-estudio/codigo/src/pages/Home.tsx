import { Link } from 'react-router-dom'
import { classes } from '../lib/data'
import ClassCard from '../components/ClassCard'

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="wrap herogrid">
          <div>
          <p className="eyebrow">Ceramic studio · small groups · all levels</p>
          <h1>Make something with your hands.</h1>
          <p className="lead">Wheel, handbuilding, glazing and firing classes taught by working potters. Pick a class, choose a session, bring an apron — we handle the kiln.</p>
          <Link className="btn" to="/classes">Browse classes</Link>
          </div>
          <svg className="vessel" viewBox="0 0 240 280" aria-hidden="true"><ellipse cx="120" cy="262" rx="80" ry="10" fill="#5a2a14" opacity=".18"/><path d="M78 40h84l-8 44c40 24 44 110 6 160-14 14-30 16-40 16s-26-2-40-16c-38-50-34-136 6-160z" fill="#a1441f"/><path d="M78 40h84l-3 16H81z" fill="#7d3216"/><path d="M62 150c30 14 86 14 116 0" stroke="#f6efe6" strokeWidth="5" fill="none" opacity=".7"/><path d="M66 182c32 12 78 12 108 0" stroke="#f6efe6" strokeWidth="3" fill="none" opacity=".5"/></svg>
        </div>
      </section>
      <section className="wrap">
        <h2>Popular this month</h2>
        <div className="grid">{classes.slice(0, 3).map((c) => <ClassCard key={c.id} c={c} />)}</div>
      </section>
    </>
  )
}

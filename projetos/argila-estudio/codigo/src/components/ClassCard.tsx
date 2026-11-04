import { Link } from 'react-router-dom'
import type { ClassItem } from '../types'
import { money } from '../lib/data'
import { useStore } from '../store'

export default function ClassCard({ c }: { c: ClassItem }) {
  const { favorites, dispatch } = useStore()
  const fav = favorites.includes(c.id)
  return (
    <article className="card">
      <div className="swatch" style={{ background: c.color }}>
        <span>{c.category}</span>
        <button className={fav ? 'fav on' : 'fav'} aria-pressed={fav} aria-label={`${fav ? 'Remove' : 'Save'} ${c.title} ${fav ? 'from' : 'to'} favourites`} onClick={() => dispatch({ type: 'toggleFav', id: c.id })}>♥</button>
      </div>
      <div className="body">
        <h3><Link to={`/classes/${c.id}`}>{c.title}</Link></h3>
        <p>{c.summary}</p>
        <div className="meta"><span>{c.level}</span><span>{c.duration} min</span><strong>{money(c.price)}</strong></div>
      </div>
    </article>
  )
}

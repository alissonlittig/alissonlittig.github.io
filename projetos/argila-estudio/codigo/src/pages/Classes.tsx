import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { categories, classes, filterClasses, levels } from '../lib/data'
import { useStore } from '../store'
import ClassCard from '../components/ClassCard'

export default function Classes() {
  const [params, setParams] = useSearchParams()
  const [maxPrice, setMaxPrice] = useState(200)
  const [onlyFav, setOnlyFav] = useState(false)
  const { favorites } = useStore()
  const query = params.get('q') ?? ''
  const category = params.get('cat') ?? 'All'
  const level = params.get('level') ?? 'All'

  const set = (k: string, v: string) => {
    const p = new URLSearchParams(params)
    if (v && v !== 'All') p.set(k, v)
    else p.delete(k)
    setParams(p, { replace: true })
  }
  const result = useMemo(
    () => filterClasses(classes, { query, category, level, maxPrice }).filter((c) => !onlyFav || favorites.includes(c.id)),
    [query, category, level, maxPrice, onlyFav, favorites],
  )

  return (
    <section className="wrap">
      <h1>Classes</h1>
      <form className="filters" role="search" onSubmit={(e) => e.preventDefault()}>
        <label>Search
          <input type="search" value={query} placeholder="Wheel, glaze, Marina…" onChange={(e) => set('q', e.target.value)} />
        </label>
        <label>Category
          <select value={category} onChange={(e) => set('cat', e.target.value)}>{categories.map((c) => <option key={c}>{c}</option>)}</select>
        </label>
        <label>Level
          <select value={level} onChange={(e) => set('level', e.target.value)}>{levels.map((c) => <option key={c}>{c}</option>)}</select>
        </label>
        <label>Max price: ${maxPrice}
          <input type="range" min={50} max={200} step={5} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} />
        </label>
        <label className="check"><input type="checkbox" checked={onlyFav} onChange={(e) => setOnlyFav(e.target.checked)} /> Saved only</label>
      </form>
      <p role="status" className="count">{result.length} {result.length === 1 ? 'class' : 'classes'} found</p>
      {result.length === 0 ? <p className="empty">Nothing matches those filters. Try widening them.</p> : <div className="grid">{result.map((c) => <ClassCard key={c.id} c={c} />)}</div>}
    </section>
  )
}

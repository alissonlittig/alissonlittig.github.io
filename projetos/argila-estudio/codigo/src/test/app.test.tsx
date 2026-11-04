import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { StoreProvider, reducer } from '../store'
import { classes, filterClasses, seatsLeft, sessions } from '../lib/data'
import { validate } from '../lib/validate'

const all = { query: '', category: 'All', level: 'All', maxPrice: 200 }
const ok = { name: 'Ana Lima', email: 'ana@example.com', people: '2', note: '' }

function setup(path = '/classes') {
  render(<MemoryRouter initialEntries={[path]}><StoreProvider><App /></StoreProvider></MemoryRouter>)
}
beforeEach(() => localStorage.clear())

describe('filterClasses', () => {
  it('returns everything with default filters', () => expect(filterClasses(classes, all)).toHaveLength(classes.length))
  it('searches title/teacher case-insensitively', () => expect(filterClasses(classes, { ...all, query: 'HELENA' }).map((c) => c.id)).toContain('raku'))
  it('combines level and price', () => {
    const r = filterClasses(classes, { ...all, level: 'Beginner', maxPrice: 80 })
    expect(r.length).toBeGreaterThan(0)
    expect(r.every((c) => c.level === 'Beginner' && c.price <= 80)).toBe(true)
  })
})

describe('validate', () => {
  it('accepts a valid form', () => expect(validate(ok, 's1', 4)).toEqual({}))
  it('flags every bad field', () => {
    const e = validate({ name: 'A', email: 'nope', people: '0', note: '' }, null, 0)
    expect(Object.keys(e).sort()).toEqual(['email', 'name', 'people', 'session'])
  })
  it('blocks overbooking', () => expect(validate({ ...ok, people: '5' }, 's1', 4).people).toMatch(/Only 4/))
})

describe('store', () => {
  it('toggles favourites and books/cancels', () => {
    let s = reducer({ favorites: [], bookings: [] }, { type: 'toggleFav', id: 'raku' })
    expect(s.favorites).toEqual(['raku'])
    s = reducer(s, { type: 'toggleFav', id: 'raku' })
    expect(s.favorites).toEqual([])
    const b = { id: 'b1', sessionId: sessions[0].id, classId: sessions[0].classId, name: 'x', email: 'x@x.co', people: 2, note: '' }
    s = reducer(s, { type: 'book', booking: b })
    expect(seatsLeft(sessions[0], s.bookings)).toBe(sessions[0].seats - 2)
    expect(reducer(s, { type: 'cancel', id: 'b1' }).bookings).toEqual([])
  })
})

describe('app', () => {
  it('filters the list from the search box', async () => {
    setup()
    await userEvent.type(screen.getByLabelText('Search'), 'raku')
    expect(screen.getByRole('status')).toHaveTextContent('1 class found')
  })
  it('shows validation errors, then books a class', async () => {
    setup('/classes/raku')
    await userEvent.click(screen.getByRole('button', { name: /^Book/ }))
    expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(3)
    await userEvent.click(screen.getAllByRole('radio')[0])
    await userEvent.type(screen.getByLabelText('Full name'), 'Ana Lima')
    await userEvent.type(screen.getByLabelText('E-mail'), 'ana@example.com')
    await userEvent.click(screen.getByRole('button', { name: /^Book/ }))
    expect(await screen.findByRole('heading', { name: 'My bookings' })).toBeInTheDocument()
    expect(screen.getByText(/Ana Lima/)).toBeInTheDocument()
  })
  it('saves a favourite', async () => {
    setup()
    await userEvent.click(screen.getAllByRole('button', { name: /^Save/ })[0])
    expect(screen.getByLabelText('1 saved')).toBeInTheDocument()
  })
})

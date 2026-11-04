import { NavLink, Route, Routes, Link } from 'react-router-dom'
import { useStore } from './store'
import Home from './pages/Home'
import Classes from './pages/Classes'
import ClassDetail from './pages/ClassDetail'
import MyBookings from './pages/MyBookings'

export default function App() {
  const { bookings, favorites } = useStore()
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="top">
        <Link to="/" className="brand" aria-label="Argila & Fogo home">
          <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#b4532a" /><path d="M10 8h12l-2 6c3 2 3 8 0 10H12c-3-2-3-8 0-10z" fill="#f6efe6" /></svg>
          Argila &amp; Fogo
        </Link>
        <nav aria-label="Main">
          <NavLink to="/classes">Classes{favorites.length > 0 && <span className="pill" aria-label={`${favorites.length} saved`}>♥ {favorites.length}</span>}</NavLink>
          <NavLink to="/bookings">My bookings{bookings.length > 0 && <span className="pill">{bookings.length}</span>}</NavLink>
        </nav>
      </header>
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/classes/:id" element={<ClassDetail />} />
          <Route path="/bookings" element={<MyBookings />} />
          <Route path="*" element={<section className="wrap"><h1>Page not found</h1><Link className="btn" to="/">Back home</Link></section>} />
        </Routes>
      </main>
      <footer className="foot">Argila &amp; Fogo is a fictional studio — a portfolio demo built with React, TypeScript and Vite. Bookings are stored only in your browser.</footer>
    </>
  )
}

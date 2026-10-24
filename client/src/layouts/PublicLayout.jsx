import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import Button from '../components/ui/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'

// Links that point to sections of the landing page.
// About and Contact pages are not built yet, so they are intentionally not listed.
const navLinks = [
  { label: 'Services', to: '/#services' },
  { label: 'How it works', to: '/#how-it-works' },
]

// React Router does not scroll to #sections on its own, so we do it here.
function ScrollToHash() {
  const { hash, pathname } = useLocation()
  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView()
    } else {
      window.scrollTo(0, 0)
    }
  }, [hash, pathname])
  return null
}

function Navbar() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-950/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6" aria-label="Main">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:text-white">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <Button to={`/${user.role}`}>Go to dashboard</Button>
          ) : (
            <>
              <Button to="/login" variant="ghost">Log in</Button>
              <Button to="/register">Create account</Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-white hover:bg-white/10 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-white/10 px-4 pb-4 pt-2 md:hidden">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-3 text-base font-medium text-slate-200 hover:bg-white/10"
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <div className="mt-3"><Button to={`/${user.role}`} className="w-full" onClick={() => setOpen(false)}>Go to dashboard</Button></div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button to="/login" variant="outlineLight" onClick={() => setOpen(false)}>Log in</Button>
              <Button to="/register" onClick={() => setOpen(false)}>Create account</Button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}

function Footer() {
  return (
    <footer className="bg-navy-950 text-slate-400">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-sm">
            Smart Web-Based Vehicle Breakdown Assistance and Service Management System
          </p>
        </div>
        <p className="text-sm">&copy; {new Date().getFullYear()} VehicleCare. Academic project.</p>
      </div>
    </footer>
  )
}

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToHash />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

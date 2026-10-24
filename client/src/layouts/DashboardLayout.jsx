import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Car, AlertTriangle, ClipboardList, Users, LogOut, Menu, X, Wrench } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from '../components/Logo.jsx'
import NotificationBell from '../components/NotificationBell.jsx'

const navByRole = {
  customer: [
    { to: '/customer', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/customer/vehicles', label: 'My Vehicles', icon: Car },
    { to: '/customer/report', label: 'Report Breakdown', icon: AlertTriangle },
    { to: '/customer/service', label: 'Request Service', icon: Wrench },
    { to: '/customer/requests', label: 'My Requests', icon: ClipboardList },
  ],
  provider: [
    { to: '/provider', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/provider/requests', label: 'Assigned Requests', icon: ClipboardList },
  ],
  admin: [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/requests', label: 'All Requests', icon: ClipboardList },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/vehicles', label: 'Vehicles', icon: Car },
    { to: '/admin/services', label: 'Services', icon: Wrench },
  ],
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const links = navByRole[user.role]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-navy-950 p-4">
      <div className="px-2 py-3"><Logo /></div>
      <nav className="mt-6 flex-1 space-y-1" aria-label="Dashboard">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white"
      >
        <LogOut className="h-5 w-5" aria-hidden="true" /> Log out
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8">
          <button
            type="button"
            className="rounded-lg p-2 text-ink hover:bg-slate-100 lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <div className="ml-auto flex items-center gap-4">
            <NotificationBell />
            <div className="text-right">
              <p className="text-sm font-semibold text-ink">{user.name}</p>
              <p className="text-xs capitalize text-slate-500">{user.role}</p>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

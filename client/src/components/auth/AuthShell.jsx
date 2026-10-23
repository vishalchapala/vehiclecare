import { CheckCircle2 } from 'lucide-react'
import Logo from '../Logo.jsx'

const points = [
  'Report a breakdown with your location',
  'Book and track maintenance services',
  'See a timeline of every status change',
]

/** Shared full-screen layout for the login and registration pages. */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="hidden flex-col justify-between bg-navy-950 p-12 lg:flex">
        <Logo />
        <div>
          <p className="max-w-sm text-3xl font-bold leading-snug tracking-tight text-white">
            One place for breakdowns, services and your vehicle history.
          </p>
          <ul className="mt-8 space-y-3">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-3 text-slate-300">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-400" aria-hidden="true" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-slate-500">B.Tech CSE minor project</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo dark={false} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">{title}</h1>
          <p className="mt-2 text-slate-600">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-center text-sm text-slate-600">{footer}</p>
        </div>
      </main>
    </div>
  )
}

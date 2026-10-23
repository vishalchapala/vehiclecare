import { Link } from 'react-router-dom'
import { Check, Car, MapPin, Wrench, Bell, UserPlus, Send, UserCheck, Activity } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'

// ---- Sample data for the hero illustration (clearly labelled as a sample on screen) ----
const sampleSteps = [
  { label: 'Reported', state: 'done' },
  { label: 'Assigned', state: 'done' },
  { label: 'Accepted', state: 'done' },
  { label: 'En Route', state: 'current' },
  { label: 'In Progress', state: 'todo' },
  { label: 'Resolved', state: 'todo' },
]

const features = [
  {
    icon: MapPin,
    title: 'Report a breakdown',
    text: 'Pick your vehicle, describe the problem and share your location on a map. Nearby service providers can then be assigned to you.',
  },
  {
    icon: Wrench,
    title: 'Book maintenance',
    text: 'Choose a service category, see the estimated price and request a service for a date that suits you.',
  },
  {
    icon: Car,
    title: 'Keep your vehicles in one place',
    text: 'Save the details of every vehicle you own and attach them to any request in a couple of taps.',
  },
  {
    icon: Bell,
    title: 'Follow every update',
    text: 'See each status change on a timeline and get a notification when a provider accepts, arrives or finishes.',
  },
]

const steps = [
  { icon: UserPlus, title: 'Create an account', text: 'Sign up as a vehicle owner and add your vehicle.' },
  { icon: Send, title: 'Send a request', text: 'Describe the breakdown or service you need, with your location.' },
  { icon: UserCheck, title: 'A provider accepts', text: 'An assigned provider confirms and heads your way.' },
  { icon: Activity, title: 'Track until it is fixed', text: 'Watch progress, notes and costs until the request is resolved.' },
]

function SampleTracker() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-navy-900 p-6 shadow-2xl shadow-black/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">Sample request</p>
          <p className="mt-1 text-lg font-semibold text-white">Flat tyre on the highway</p>
        </div>
        <Badge tone="info">En Route</Badge>
      </div>

      <ol className="mt-6 space-y-0">
        {sampleSteps.map((s, i) => {
          const last = i === sampleSteps.length - 1
          return (
            <li key={s.label} className="relative flex gap-4 pb-5 last:pb-0">
              {!last && (
                <span
                  className={`absolute left-[11px] top-6 h-full w-0.5 ${s.state === 'done' ? 'bg-brand-600' : 'bg-white/10'}`}
                  aria-hidden="true"
                />
              )}
              <span
                className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                  s.state === 'done'
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : s.state === 'current'
                    ? 'border-brand-400 bg-navy-900 ring-4 ring-brand-600/25'
                    : 'border-white/20 bg-navy-900'
                }`}
              >
                {s.state === 'done' && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                {s.state === 'current' && <span className="h-2 w-2 rounded-full bg-brand-400" aria-hidden="true" />}
              </span>
              <span
                className={`text-sm ${
                  s.state === 'todo' ? 'text-slate-500' : s.state === 'current' ? 'font-semibold text-white' : 'text-slate-300'
                }`}
              >
                {s.label}
              </span>
            </li>
          )
        })}
      </ol>

      <p className="mt-6 border-t border-white/10 pt-4 text-xs text-slate-400">
        An example of the status tracking you see after reporting a breakdown. This is not live data.
      </p>
    </div>
  )
}

export default function Landing() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy-950">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
              Report a breakdown. Book a service. Follow it until it's fixed.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300">
              VehicleCare connects vehicle owners with service providers and shows every step of the repair, from
              the first report to the final bill.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button to="/register" size="lg">Report a breakdown</Button>
              <Button to="/register" size="lg" variant="outlineLight">Book a service</Button>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              Already registered? <Link to="/login" className="font-medium text-brand-400 underline-offset-4 hover:underline">Log in</Link>
            </p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <SampleTracker />
          </div>
        </div>
      </section>

      {/* What you can do */}
      <section id="services" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-ink">What you can do with VehicleCare</h2>
          <div className="mt-12 grid gap-x-12 gap-y-10 md:grid-cols-2">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4 border-t border-slate-200 pt-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-ink">{title}</h3>
                  <p className="mt-1.5 leading-relaxed text-slate-600">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works: a real sequence, so numbering is meaningful here */}
      <section id="how-it-works" className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-ink">How it works</h2>
          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <li key={title}>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <Icon className="h-5 w-5 text-brand-600" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 leading-relaxed text-slate-600">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Provider call to action */}
      <section className="bg-navy-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Are you a mechanic or tow operator?</h2>
            <p className="mt-2 max-w-xl text-slate-300">
              Register as a service provider to receive requests, update progress and record your service notes.
            </p>
          </div>
          <Button to="/register" size="lg" className="shrink-0">Register as a provider</Button>
        </div>
      </section>
    </>
  )
}

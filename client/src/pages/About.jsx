import Button from '../components/ui/Button.jsx'

const roles = [
  { title: 'Vehicle owners', text: 'Save their vehicles, report breakdowns, book maintenance services, follow every status change and rate the service afterwards.' },
  { title: 'Service providers', text: 'Receive requests automatically or take open ones, update progress, add notes and costs, and build a rating from customer reviews.' },
  { title: 'Administrators', text: 'See every request, user and vehicle, manage the service price list and disable accounts when needed.' },
]

export default function About() {
  return (
    <>
      <section className="bg-navy-950">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">About VehicleCare</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
            VehicleCare is a web platform that helps vehicle owners get help when a vehicle breaks down and book routine maintenance, while giving service providers and administrators one place to manage the work.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-ink">The problem we address</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-slate-600">
            When a vehicle stops on the road, owners often do not know whom to call, and they cannot see whether help is on the way. Providers get requests by phone with no record of what was done. VehicleCare keeps one clear record for every request, from the first report to the final bill.
          </p>

          <h2 className="mt-14 text-2xl font-bold tracking-tight text-ink">Who uses it</h2>
          <div className="mt-8 grid gap-x-12 gap-y-8 md:grid-cols-3">
            {roles.map((r) => (
              <div key={r.title} className="border-t border-slate-200 pt-5">
                <h3 className="text-lg font-semibold text-ink">{r.title}</h3>
                <p className="mt-2 leading-relaxed text-slate-600">{r.text}</p>
              </div>
            ))}
          </div>

          <h2 className="mt-14 text-2xl font-bold tracking-tight text-ink">How it is built</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-slate-600">
            The website uses React and Tailwind CSS. The server uses Node.js and Express with a MongoDB Atlas database. Passwords are stored hashed, logins use signed tokens, and every action is checked on the server by role. This is an academic minor project developed for a B.Tech Computer Science and Engineering programme.
          </p>
          <div className="mt-8"><Button to="/register" size="lg">Create an account</Button></div>
        </div>
      </section>
    </>
  )
}

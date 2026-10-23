import { Link } from 'react-router-dom'
import { Car } from 'lucide-react'

export default function Logo({ dark = true }) {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5" aria-label="VehicleCare home">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
        <Car className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className={`text-lg font-bold tracking-tight ${dark ? 'text-white' : 'text-ink'}`}>
        VehicleCare
      </span>
    </Link>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import api, { errorMessage } from '../../services/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { OPEN_STATUSES, STATUSES, formatDate } from '../../utils/constants.js'
import PageLoader from '../../components/ui/PageLoader.jsx'
import Alert from '../../components/ui/Alert.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import Button from '../../components/ui/Button.jsx'

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-ink">{value}</p>
    </div>
  )
}

function RecentRequests({ requests, base }) {
  if (requests.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No requests yet"
        text="When a breakdown is reported, it will appear here."
      />
    )
  }
  return (
    <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
      {requests.slice(0, 5).map((r) => (
        <li key={r._id}>
          <Link to={`${base}/requests/${r._id}`} className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-slate-50">
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{r.category}</p>
              <p className="truncate text-sm text-slate-500">
                {r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : 'Vehicle removed'} · {formatDate(r.createdAt)}
              </p>
            </div>
            <StatusBadge status={r.status} />
          </Link>
        </li>
      ))}
    </ul>
  )
}

// Admin: real counts from the database.
function AdminOverview() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/admin/stats').then((r) => setStats(r.data.data)).catch((e) => setError(errorMessage(e)))
  }, [])

  if (error) return <Alert>{error}</Alert>
  if (!stats) return <PageLoader />

  const by = stats.requestsByStatus
  const total = Object.values(by).reduce((a, b) => a + b, 0)
  const open = OPEN_STATUSES.reduce((sum, s) => sum + (by[s] || 0), 0)

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total requests" value={total} />
        <StatCard label="Open requests" value={open} />
        <StatCard label="Resolved" value={by.Resolved || 0} />
        <StatCard label="Customers" value={stats.usersByRole.customer || 0} />
        <StatCard label="Providers" value={stats.usersByRole.provider || 0} />
        <StatCard label="Registered vehicles" value={stats.totalVehicles} />
      </div>

      <h2 className="mt-10 text-lg font-semibold text-ink">Requests by status</h2>
      <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        {STATUSES.map((s) => (
          <div key={s} className="flex items-center gap-3 text-sm">
            <span className="w-24 shrink-0 text-slate-600">{s}</span>
            <div className="h-3 flex-1 rounded-full bg-slate-100">
              <div className="h-3 rounded-full bg-brand-600" style={{ width: total ? `${((by[s] || 0) / total) * 100}%` : 0 }} />
            </div>
            <span className="w-8 text-right font-semibold text-ink">{by[s] || 0}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button to="/admin/requests">Manage requests</Button>
        <Button to="/admin/users" variant="secondary">Manage users</Button>
      </div>
    </>
  )
}

// Customer and provider: counts based on their own most recent 50 requests.
function PersonalOverview({ role }) {
  const [requests, setRequests] = useState(null)
  const [vehicleCount, setVehicleCount] = useState(null)
  const [error, setError] = useState('')
  const base = `/${role}`

  useEffect(() => {
    const calls = [api.get('/requests?limit=50')]
    if (role === 'customer') calls.push(api.get('/vehicles'))
    Promise.all(calls)
      .then(([req, veh]) => {
        setRequests(req.data.data.requests)
        if (veh) setVehicleCount(veh.data.data.vehicles.length)
      })
      .catch((e) => setError(errorMessage(e)))
  }, [role])

  if (error) return <Alert>{error}</Alert>
  if (!requests) return <PageLoader />

  const open = requests.filter((r) => OPEN_STATUSES.includes(r.status)).length
  const done = requests.filter((r) => r.status === 'Resolved').length

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        {role === 'customer' && <StatCard label="My vehicles" value={vehicleCount} />}
        <StatCard label={role === 'customer' ? 'Open requests' : 'Active assignments'} value={open} />
        <StatCard label="Completed services" value={done} />
      </div>
      <div className="mb-4 mt-10 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">Recent requests</h2>
        <Link to={`${base}/requests`} className="text-sm font-semibold text-brand-600 hover:underline">View all</Link>
      </div>
      <RecentRequests requests={requests} base={base} />
      {role === 'customer' && (
        <div className="mt-6"><Button to="/customer/report">Report a breakdown</Button></div>
      )}
    </>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  return (
    <>
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-ink">Welcome, {user.name.split(' ')[0]}</h1>
      {user.role === 'admin' ? <AdminOverview /> : <PersonalOverview role={user.role} />}
    </>
  )
}

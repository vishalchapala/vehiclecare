import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import api, { errorMessage } from '../../services/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { STATUSES, formatDate } from '../../utils/constants.js'
import Badge from '../../components/ui/Badge.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import Select from '../../components/ui/Select.jsx'
import Button from '../../components/ui/Button.jsx'
import Alert from '../../components/ui/Alert.jsx'
import PageLoader from '../../components/ui/PageLoader.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'

const titles = { customer: 'My Requests', provider: 'My Requests', admin: 'All Requests' }

export default function Requests() {
  const { user } = useAuth()
  const base = `/${user.role}`
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')

  useEffect(() => {
    setData(null)
    const params = new URLSearchParams({ page, limit: 10 })
    if (status) params.set('status', status)
    if (type) params.set('type', type)
    api.get(`/requests?${params}`).then((r) => setData(r.data.data)).catch((e) => setError(errorMessage(e)))
  }, [status, type, page])

  const changeStatus = (e) => { setStatus(e.target.value); setPage(1) }
  const changeType = (e) => { setType(e.target.value); setPage(1) }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-ink">{titles[user.role]}</h1>
        <div className="flex flex-wrap gap-3">
        <Select id="typeFilter" label="Type" value={type} onChange={changeType} className="w-44">
          <option value="">All types</option>
          <option value="breakdown">Breakdowns</option>
          <option value="maintenance">Maintenance</option>
        </Select>
        <Select id="statusFilter" label="Filter by status" value={status} onChange={changeStatus} className="w-48">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        </div>
      </div>

      <Alert>{error}</Alert>
      {!data && !error && <PageLoader />}

      {data && data.requests.length === 0 && (
        <EmptyState icon={ClipboardList} title="No requests found"
          text={status ? 'No requests match this status.' : 'Requests will appear here.'}
          action={user.role === 'customer' && !status ? <Button to="/customer/report">Report a breakdown</Button> : null} />
      )}

      {data && data.requests.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Issue</th>
                  <th className="px-4 py-3 font-semibold">Vehicle</th>
                  {user.role !== 'customer' && <th className="px-4 py-3 font-semibold">Customer</th>}
                  {user.role === 'admin' && <th className="px-4 py-3 font-semibold">Provider</th>}
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Reported</th>
                  <th className="px-4 py-3"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.requests.map((r) => (
                  <tr key={r._id}>
                    <td className="px-4 py-3">
                      <span className="font-medium text-ink">{r.category}</span>{' '}
                      {r.priority === 'High' && <Badge tone="danger">High</Badge>}{r.type === 'maintenance' && <Badge tone="info">Service</Badge>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : 'Removed'}</td>
                    {user.role !== 'customer' && <td className="px-4 py-3 text-slate-600">{r.customer?.name}</td>}
                    {user.role === 'admin' && <td className="px-4 py-3 text-slate-600">{r.provider?.name || 'Not assigned'}</td>}
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(r.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`${base}/requests/${r._id}`} className="font-semibold text-brand-600 hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <span>Page {data.pagination.page} of {data.pagination.pages} ({data.pagination.total} total)</span>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <Button variant="secondary" disabled={page >= data.pagination.pages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Inbox } from 'lucide-react'
import api, { errorMessage } from '../../services/api.js'
import { formatDate } from '../../utils/constants.js'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Alert from '../../components/ui/Alert.jsx'
import PageLoader from '../../components/ui/PageLoader.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'

// Requests nobody has taken yet. The first provider to accept gets the job.
export default function OpenRequests() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')

  const load = useCallback(
    () => api.get('/requests?scope=open&limit=50').then((r) => setRequests(r.data.data.requests)).catch((e) => setError(errorMessage(e))),
    []
  )
  useEffect(() => { load() }, [load])

  const accept = async (r) => {
    setBusyId(r._id)
    setError('')
    try {
      await api.patch(`/requests/${r._id}/claim`)
      navigate(`/provider/requests/${r._id}`)
    } catch (err) {
      setError(errorMessage(err))
      await load()
    } finally {
      setBusyId('')
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Open requests</h1>
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>
      <p className="mb-6 text-sm text-slate-600">These requests have no provider yet. The first provider to accept one takes the job. Customer contact details appear after you accept.</p>
      <Alert>{error}</Alert>
      {!requests && !error && <PageLoader />}

      {requests && requests.length === 0 && (
        <EmptyState icon={Inbox} title="No open requests" text="New requests that need a provider will appear here." />
      )}

      {requests && requests.length > 0 && (
        <ul className="mt-4 space-y-4">
          {requests.map((r) => (
            <li key={r._id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-ink">{r.category}</p>
                    {r.priority === 'High' && <Badge tone="danger">High priority</Badge>}
                    {r.type === 'maintenance' && <Badge tone="info">Service</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {r.vehicle ? `${r.vehicle.make} ${r.vehicle.model} (${r.vehicle.registrationNumber})` : 'Vehicle'} · {formatDate(r.createdAt)}
                  </p>
                </div>
                <Button onClick={() => accept(r)} loading={busyId === r._id}>Accept</Button>
              </div>
              <p className="mt-3 text-sm text-slate-700"><span className="font-medium">Location:</span> {r.address}</p>
              <p className="mt-1 text-sm text-slate-600">{r.description}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

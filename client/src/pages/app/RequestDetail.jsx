import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import api, { errorMessage } from '../../services/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatDate } from '../../utils/constants.js'
import Badge from '../../components/ui/Badge.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import Textarea from '../../components/ui/Textarea.jsx'
import Alert from '../../components/ui/Alert.jsx'
import PageLoader from '../../components/ui/PageLoader.jsx'

const CANCELLABLE = ['Reported', 'Assigned', 'Accepted']
// The provider's next step in the workflow.
const NEXT_STEP = { Accepted: ['En Route', 'Mark as en route'], 'En Route': ['In Progress', 'Start work'], 'In Progress': ['Resolved', 'Mark as resolved'] }

function Detail({ label, children }) {
  return (
    <div>
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink">{children || '-'}</dd>
    </div>
  )
}

export default function RequestDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [request, setRequest] = useState(null)
  const [providers, setProviders] = useState([])
  const [providerId, setProviderId] = useState('')
  const [work, setWork] = useState({ notes: '', estimatedCost: '', finalCost: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(
    () => api.get(`/requests/${id}`).then((r) => {
      const req = r.data.data.request
      setRequest(req)
      setWork({ notes: req.providerNotes || '', estimatedCost: req.estimatedCost ?? '', finalCost: req.finalCost ?? '' })
    }).catch((e) => setError(errorMessage(e))),
    [id]
  )

  useEffect(() => { load() }, [load])

  // Admin needs the list of approved providers to assign one.
  useEffect(() => {
    if (user.role !== 'admin') return
    api.get('/admin/users?role=provider&approved=true&limit=50')
      .then((r) => {
        setProviders(r.data.data.users.filter((u) => u.isActive))
      })
      .catch(() => {})
  }, [user.role])

  const run = async (call, message) => {
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      await call()
      setSuccess(message)
      await load()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const changeStatus = (status, extra = {}) =>
    run(() => api.patch(`/requests/${id}/status`, { status, ...extra }), `Status updated to ${status}.`)

  const cancel = () => window.confirm('Cancel this request?') && changeStatus('Cancelled')

  const advance = (status) => {
    const body = {}
    if (work.notes) body.notes = work.notes
    if (work.estimatedCost !== '') body.estimatedCost = Number(work.estimatedCost)
    if (status === 'Resolved' && work.finalCost !== '') body.finalCost = Number(work.finalCost)
    return changeStatus(status, body)
  }

  const assign = () =>
    run(() => api.patch(`/requests/${id}/assign`, { providerId }), 'Provider assigned.')

  if (!request) return error ? <Alert>{error}</Alert> : <PageLoader />

  const r = request
  const isProvider = user.role === 'provider'
  const isAdmin = user.role === 'admin'
  const canCancel = (user.role === 'customer' || isAdmin) && CANCELLABLE.includes(r.status)
  const next = NEXT_STEP[r.status]

  return (
    <>
      <Link to={`/${user.role}/requests`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to requests
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-ink">{r.category}</h1>
        <StatusBadge status={r.status} />
        {r.priority === 'High' && <Badge tone="danger">High priority</Badge>}
      </div>

      <div className="mb-6 space-y-3">
        <Alert>{error}</Alert>
        <Alert type="success">{success}</Alert>
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-ink">Request details</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Vehicle">{r.vehicle ? `${r.vehicle.make} ${r.vehicle.model} (${r.vehicle.registrationNumber})` : 'Removed'}</Detail>
              <Detail label="Reported">{formatDate(r.createdAt)}</Detail>
              <Detail label="Location">{r.address}</Detail>
              <Detail label="Contact number">{r.contactPhone}</Detail>
              {r.latitude != null && <Detail label="Coordinates">{r.latitude.toFixed(5)}, {r.longitude.toFixed(5)}</Detail>}
              {user.role !== 'customer' && <Detail label="Customer">{r.customer?.name}</Detail>}
              <Detail label="Service provider">{r.provider ? `${r.provider.name} (${r.provider.phone})` : 'Not assigned yet'}</Detail>
            </dl>
            <div className="mt-4">
              <p className="text-sm text-slate-500">Problem description</p>
              <p className="mt-0.5 text-ink">{r.description}</p>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-ink">Service details</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Estimated cost">{r.estimatedCost != null ? `₹${r.estimatedCost}` : ''}</Detail>
              <Detail label="Final cost">{r.finalCost != null ? `₹${r.finalCost}` : ''}</Detail>
            </dl>
            <div className="mt-4">
              <p className="text-sm text-slate-500">Provider notes</p>
              <p className="mt-0.5 text-ink">{r.providerNotes || '-'}</p>
            </div>
          </section>

          {/* Actions depend on the role AND the current status. The server checks them again. */}
          {canCancel && (
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-2 text-lg font-semibold text-ink">Cancel request</h2>
              <p className="mb-4 text-sm text-slate-600">You can cancel until the provider is on the way.</p>
              <Button variant="secondary" onClick={cancel} loading={busy}>Cancel this request</Button>
            </section>
          )}

          {isAdmin && r.status === 'Reported' && (
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-ink">Assign a provider</h2>
              {providers.length === 0 ? (
                <p className="text-sm text-slate-600">No approved providers yet. Approve one in the Users page.</p>
              ) : (
                <div className="flex flex-wrap items-end gap-3">
                  <Select id="provider" label="Approved providers" value={providerId} onChange={(e) => setProviderId(e.target.value)} className="min-w-56 flex-1">
                    <option value="">Select a provider</option>
                    {providers.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </Select>
                  <Button onClick={assign} disabled={!providerId} loading={busy}>Assign</Button>
                </div>
              )}
            </section>
          )}

          {isAdmin && r.status === 'Assigned' && (
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-2 text-lg font-semibold text-ink">Change provider</h2>
              <p className="mb-4 text-sm text-slate-600">Unassigning sends the request back to Reported so you can pick someone else.</p>
              <Button variant="secondary" onClick={() => changeStatus('Reported')} loading={busy}>Unassign provider</Button>
            </section>
          )}

          {isProvider && r.status === 'Assigned' && (
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-2 text-lg font-semibold text-ink">New assignment</h2>
              <p className="mb-4 text-sm text-slate-600">Accept this request, or reject it to send it back to the admin.</p>
              <div className="flex gap-3">
                <Button onClick={() => changeStatus('Accepted')} loading={busy}>Accept</Button>
                <Button variant="secondary" onClick={() => window.confirm('Reject this request?') && changeStatus('Reported')} disabled={busy}>Reject</Button>
              </div>
            </section>
          )}

          {isProvider && next && (
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-ink">Update progress</h2>
              <div className="space-y-4">
                <Textarea id="notes" rows={3} label="Service notes" value={work.notes} onChange={(e) => setWork({ ...work, notes: e.target.value })} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input id="estimatedCost" type="number" min="0" label="Estimated cost (₹)" value={work.estimatedCost}
                    onChange={(e) => setWork({ ...work, estimatedCost: e.target.value })} />
                  {r.status === 'In Progress' && (
                    <Input id="finalCost" type="number" min="0" label="Final cost (₹)" value={work.finalCost}
                      onChange={(e) => setWork({ ...work, finalCost: e.target.value })} />
                  )}
                </div>
                <Button onClick={() => advance(next[0])} loading={busy}>{next[1]}</Button>
              </div>
            </section>
          )}
        </div>

        <section className="h-fit rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-5 text-lg font-semibold text-ink">Timeline</h2>
          <ol className="space-y-5">
            {[...r.statusHistory].reverse().map((h, i) => (
              <li key={i} className="relative border-l-2 border-slate-200 pl-5">
                <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-brand-600" aria-hidden="true" />
                <p className="font-semibold text-ink">{h.status}</p>
                <p className="text-sm text-slate-500">{formatDate(h.at)}{h.by ? ` · ${h.by.name}` : ''}</p>
                {h.note && <p className="mt-1 text-sm text-slate-600">{h.note}</p>}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  )
}

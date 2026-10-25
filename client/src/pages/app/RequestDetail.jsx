import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Star } from 'lucide-react'
import api, { errorMessage } from '../../services/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatDate } from '../../utils/constants.js'
import Badge from '../../components/ui/Badge.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
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

function Stars({ value, onPick }) {
  return (
    <div className="flex gap-1" role={onPick ? 'radiogroup' : undefined} aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => {
        const icon = <Star className={`h-6 w-6 ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} aria-hidden="true" />
        return onPick ? (
          <button key={n} type="button" onClick={() => onPick(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`}
            className="rounded p-0.5 hover:scale-110">{icon}</button>
        ) : (
          <span key={n}>{icon}</span>
        )
      })}
    </div>
  )
}

// Rating shown after the service is resolved. Customers can rate once.
function ReviewSection({ review, canReview, requestId, onDone }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (review) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 text-lg font-semibold text-ink">Customer rating</h2>
        <Stars value={review.rating} />
        {review.comment && <p className="mt-3 text-slate-700">{review.comment}</p>}
      </section>
    )
  }
  if (!canReview) return null

  const submit = async () => {
    setError('')
    if (!rating) return setError('Choose a star rating first.')
    setBusy(true)
    try {
      await api.post(`/requests/${requestId}/review`, { rating, comment })
      await onDone()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-1 text-lg font-semibold text-ink">Rate this service</h2>
      <p className="mb-4 text-sm text-slate-600">Your rating helps other customers and the provider.</p>
      <Stars value={rating} onPick={setRating} />
      <Textarea id="comment" rows={3} label="Comment (optional)" className="mt-4" value={comment} onChange={(e) => setComment(e.target.value)} />
      <div className="mt-4 space-y-3">
        <Alert>{error}</Alert>
        <Button onClick={submit} loading={busy}>Submit rating</Button>
      </div>
    </section>
  )
}

export default function RequestDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [request, setRequest] = useState(null)
  const [review, setReview] = useState(null)
  const [work, setWork] = useState({ notes: '', estimatedCost: '', finalCost: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(
    () => api.get(`/requests/${id}`).then((r) => {
      const req = r.data.data.request
      setRequest(req)
      setReview(r.data.data.review || null)
      setWork({ notes: req.providerNotes || '', estimatedCost: req.estimatedCost ?? '', finalCost: req.finalCost ?? '' })
    }).catch((e) => setError(errorMessage(e))),
    [id]
  )

  useEffect(() => { load() }, [load])

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

  const reject = () =>
    window.confirm('Reject this request? It will be offered to another provider.') &&
    changeStatus('Reported', { note: 'Rejected by provider' })

  const advance = (status) => {
    const body = {}
    if (work.notes) body.notes = work.notes
    if (work.estimatedCost !== '') body.estimatedCost = Number(work.estimatedCost)
    if (status === 'Resolved' && work.finalCost !== '') body.finalCost = Number(work.finalCost)
    return changeStatus(status, body)
  }

  if (!request) return error ? <Alert>{error}</Alert> : <PageLoader />

  const r = request
  const isProvider = user.role === 'provider'
  const canCancel = user.role === 'customer' && CANCELLABLE.includes(r.status)
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
        {r.type === 'maintenance' && <Badge tone="info">Maintenance service</Badge>}
      </div>

      <div className="mb-6 space-y-3">
        <Alert>{error}</Alert>
        <Alert type="success">{success}</Alert>
        {r.status === 'Reported' && user.role !== 'provider' && (
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            No provider is available right now, so this request is open. The first available provider to accept it will take the job.
          </p>
        )}
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
              {r.preferredDate && <Detail label="Preferred date">{new Date(r.preferredDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</Detail>}
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

          {r.status === 'Resolved' && (
            <>
              <ReviewSection review={review} canReview={user.role === 'customer'} requestId={id} onDone={load} />
              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="mb-2 text-lg font-semibold text-ink">Receipt</h2>
                <p className="mb-4 text-sm text-slate-600">Open a printable receipt. You can save it as a PDF from the print window.</p>
                <Button to={`/${user.role}/requests/${id}/receipt`} variant="secondary">View receipt</Button>
              </section>
            </>
          )}

          {/* Actions depend on the role AND the current status. The server checks them again. */}
          {canCancel && (
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-2 text-lg font-semibold text-ink">Cancel request</h2>
              <p className="mb-4 text-sm text-slate-600">You can cancel until the provider is on the way.</p>
              <Button variant="secondary" onClick={cancel} loading={busy}>Cancel this request</Button>
            </section>
          )}

          {isProvider && r.status === 'Assigned' && (
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-2 text-lg font-semibold text-ink">New assignment</h2>
              <p className="mb-4 text-sm text-slate-600">Accept this request, or reject it and it will be offered to another provider.</p>
              <div className="flex gap-3">
                <Button onClick={() => changeStatus('Accepted')} loading={busy}>Accept</Button>
                <Button variant="secondary" onClick={reject} disabled={busy}>Reject</Button>
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
                <p className="text-sm text-slate-500">{formatDate(h.at)}{h.by ? ` · ${h.by.name}` : h.status === 'Assigned' ? ' · System' : ''}</p>
                {h.note && <p className="mt-1 text-sm text-slate-600">{h.note}</p>}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  )
}

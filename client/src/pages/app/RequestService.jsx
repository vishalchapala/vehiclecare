import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Car } from 'lucide-react'
import api, { errorMessage } from '../../services/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import Textarea from '../../components/ui/Textarea.jsx'
import Alert from '../../components/ui/Alert.jsx'
import PageLoader from '../../components/ui/PageLoader.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'

const today = () => new Date().toISOString().slice(0, 10)

export default function RequestService() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [vehicles, setVehicles] = useState(null)
  const [services, setServices] = useState([])
  const [form, setForm] = useState({
    vehicle: '', serviceCategory: '', preferredDate: today(), description: '', address: '', contactPhone: user.phone || '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([api.get('/vehicles'), api.get('/services')])
      .then(([v, s]) => {
        const vs = v.data.data.vehicles
        const ss = s.data.data.services
        setVehicles(vs)
        setServices(ss)
        setForm((f) => ({ ...f, vehicle: vs[0]?._id || '', serviceCategory: ss[0]?._id || '' }))
      })
      .catch((e) => { setError(errorMessage(e)); setVehicles([]) })
  }, [])

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const chosen = services.find((s) => s._id === form.serviceCategory)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await api.post('/requests', { ...form, type: 'maintenance' })
      navigate(`/customer/requests/${res.data.data.request._id}`)
    } catch (err) {
      setError(errorMessage(err))
      setSaving(false)
    }
  }

  if (!vehicles) return <PageLoader />

  if (vehicles.length === 0) {
    return (
      <EmptyState icon={Car} title="Add a vehicle first" text="You need at least one saved vehicle to book a service."
        action={<Button to="/customer/vehicles">Go to My Vehicles</Button>} />
    )
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-ink">Request a maintenance service</h1>
      <form onSubmit={submit} className="max-w-2xl space-y-5 rounded-xl border border-slate-200 bg-white p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Select id="vehicle" name="vehicle" label="Vehicle" value={form.vehicle} onChange={update}>
            {vehicles.map((v) => <option key={v._id} value={v._id}>{v.make} {v.model} ({v.registrationNumber})</option>)}
          </Select>
          <Select id="serviceCategory" name="serviceCategory" label="Service" value={form.serviceCategory} onChange={update}>
            {services.map((s) => <option key={s._id} value={s._id}>{s.name} (₹{s.estimatedPrice})</option>)}
          </Select>
        </div>
        {chosen && (
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            {chosen.description} The estimated price is <strong>₹{chosen.estimatedPrice}</strong>. The provider confirms the final cost.
          </p>
        )}
        <Input id="preferredDate" name="preferredDate" type="date" min={today()} label="Preferred date"
          value={form.preferredDate} onChange={update} required />
        <Textarea id="description" name="description" label="Anything the mechanic should know?" value={form.description}
          onChange={update} hint="10 to 500 characters." required />
        <Input id="address" name="address" label="Where should the service happen?" placeholder="Address or landmark"
          value={form.address} onChange={update} required />
        <Input id="contactPhone" name="contactPhone" type="tel" label="Contact number" value={form.contactPhone}
          onChange={update} hint="10-digit mobile number." required />
        <Alert>{error}</Alert>
        <Button type="submit" size="lg" loading={saving}>Submit request</Button>
      </form>
    </>
  )
}

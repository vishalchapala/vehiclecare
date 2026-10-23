import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Car, MapPin } from 'lucide-react'
import api, { errorMessage } from '../../services/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { CATEGORIES } from '../../utils/constants.js'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import Textarea from '../../components/ui/Textarea.jsx'
import Alert from '../../components/ui/Alert.jsx'
import PageLoader from '../../components/ui/PageLoader.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'

export default function ReportBreakdown() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [vehicles, setVehicles] = useState(null)
  const [form, setForm] = useState({
    vehicle: '', category: CATEGORIES[0], description: '', address: '', contactPhone: user.phone || '',
  })
  const [coords, setCoords] = useState(null)
  const [error, setError] = useState('')
  const [locMsg, setLocMsg] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/vehicles')
      .then((r) => {
        const list = r.data.data.vehicles
        setVehicles(list)
        if (list.length) setForm((f) => ({ ...f, vehicle: list[0]._id }))
      })
      .catch((e) => { setError(errorMessage(e)); setVehicles([]) })
  }, [])

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  // Real browser location. The person must allow it; if not, they type the address instead.
  const useMyLocation = () => {
    setLocMsg('')
    if (!navigator.geolocation) return setLocMsg('Your browser does not support location. Please type your address.')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        setLocMsg('Location captured. Please also type a landmark or address so the provider can find you.')
      },
      () => setLocMsg('Could not get your location. Please type your address instead.')
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await api.post('/requests', { ...form, ...(coords || {}) })
      navigate(`/customer/requests/${res.data.data.request._id}`)
    } catch (err) {
      setError(errorMessage(err))
      setSaving(false)
    }
  }

  if (!vehicles) return <PageLoader />

  if (vehicles.length === 0) {
    return (
      <EmptyState icon={Car} title="Add a vehicle first" text="You need at least one saved vehicle to report a breakdown."
        action={<Button to="/customer/vehicles">Go to My Vehicles</Button>} />
    )
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-ink">Report a breakdown</h1>
      <form onSubmit={submit} className="max-w-2xl space-y-5 rounded-xl border border-slate-200 bg-white p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Select id="vehicle" name="vehicle" label="Vehicle" value={form.vehicle} onChange={update}>
            {vehicles.map((v) => <option key={v._id} value={v._id}>{v.make} {v.model} ({v.registrationNumber})</option>)}
          </Select>
          <Select id="category" name="category" label="What went wrong?" value={form.category} onChange={update}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        <Textarea id="description" name="description" label="Describe the problem" value={form.description}
          onChange={update} hint="10 to 500 characters." required />
        <Input id="address" name="address" label="Your location or address" placeholder="Road name, landmark, city"
          value={form.address} onChange={update} required />
        <div>
          <Button type="button" variant="secondary" onClick={useMyLocation}>
            <MapPin className="h-4 w-4" aria-hidden="true" /> Use my current location
          </Button>
          {locMsg && <p className="mt-2 text-sm text-slate-600">{locMsg}</p>}
          {coords && <p className="mt-1 text-sm text-slate-500">Coordinates: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}</p>}
        </div>
        <Input id="contactPhone" name="contactPhone" type="tel" label="Contact number" value={form.contactPhone}
          onChange={update} hint="10-digit mobile number." required />
        <Alert>{error}</Alert>
        <Button type="submit" size="lg" loading={saving}>Submit request</Button>
      </form>
    </>
  )
}

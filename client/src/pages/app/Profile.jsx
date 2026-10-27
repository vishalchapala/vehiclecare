import { useState } from 'react'
import api, { errorMessage } from '../../services/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { validateName, validatePhone, validatePassword } from '../../utils/validators.js'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import Alert from '../../components/ui/Alert.jsx'
import LocationPicker from '../../components/LocationPicker.jsx'

export default function Profile() {
  const { user, setUser } = useAuth()
  const [form, setForm] = useState({ name: user.name, phone: user.phone })
  const [errors, setErrors] = useState({})
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [saving, setSaving] = useState(false)

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [pwErrors, setPwErrors] = useState({})
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' })
  const [pwSaving, setPwSaving] = useState(false)

  const saveProfile = async (e) => {
    e.preventDefault()
    const found = { name: validateName(form.name), phone: validatePhone(form.phone) }
    setErrors(found)
    setMsg({ type: '', text: '' })
    if (found.name || found.phone) return
    setSaving(true)
    try {
      const res = await api.patch('/auth/profile', { name: form.name.trim(), phone: form.phone.replace(/[\s-]/g, '') })
      setUser(res.data.data.user)
      setMsg({ type: 'success', text: 'Profile updated.' })
    } catch (err) {
      setMsg({ type: 'error', text: errorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  const saved = user.providerProfile?.location
  const [spot, setSpot] = useState(saved?.lat != null ? { lat: saved.lat, lng: saved.lng } : null)
  const [spotMsg, setSpotMsg] = useState({ type: '', text: '' })
  const [spotSaving, setSpotSaving] = useState(false)

  const saveSpot = async () => {
    if (!spot) return setSpotMsg({ type: 'error', text: 'Click the map to place the pin first.' })
    setSpotSaving(true)
    setSpotMsg({ type: '', text: '' })
    try {
      const res = await api.patch('/auth/provider-location', spot)
      setUser(res.data.data.user)
      setSpotMsg({ type: 'success', text: 'Service location saved.' })
    } catch (err) {
      setSpotMsg({ type: 'error', text: errorMessage(err) })
    } finally {
      setSpotSaving(false)
    }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    const found = {
      currentPassword: pw.currentPassword ? '' : 'Enter your current password.',
      newPassword: validatePassword(pw.newPassword),
      confirm: pw.confirm === pw.newPassword ? '' : 'Passwords do not match.',
    }
    setPwErrors(found)
    setPwMsg({ type: '', text: '' })
    if (Object.values(found).some(Boolean)) return
    setPwSaving(true)
    try {
      await api.patch('/auth/password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword })
      setPw({ currentPassword: '', newPassword: '', confirm: '' })
      setPwMsg({ type: 'success', text: 'Password changed.' })
    } catch (err) {
      setPwMsg({ type: 'error', text: errorMessage(err) })
    } finally {
      setPwSaving(false)
    }
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-ink">My profile</h1>
      <div className="grid max-w-3xl gap-6">
        <form onSubmit={saveProfile} noValidate className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-ink">Account details</h2>
          <Input id="email" label="Email address" value={user.email} disabled hint="Your email cannot be changed." readOnly />
          <Input id="name" label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
          <Input id="phone" type="tel" label="Mobile number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} />
          <Alert type={msg.type === 'success' ? 'success' : 'error'}>{msg.text}</Alert>
          <Button type="submit" loading={saving}>Save changes</Button>
        </form>

        {user.role === 'provider' && (
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-ink">Your service location</h2>
            <p className="text-sm text-slate-600">
              Mark where you work from. New requests are matched to the nearest available provider, so setting this helps you receive nearby jobs.
            </p>
            <LocationPicker value={spot} onChange={setSpot} />
            <Alert type={spotMsg.type === 'success' ? 'success' : 'error'}>{spotMsg.text}</Alert>
            <Button onClick={saveSpot} loading={spotSaving}>Save location</Button>
          </section>
        )}

        <form onSubmit={savePassword} noValidate className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-ink">Change password</h2>
          <Input id="currentPassword" type="password" label="Current password" autoComplete="current-password"
            value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} error={pwErrors.currentPassword} />
          <Input id="newPassword" type="password" label="New password" autoComplete="new-password"
            hint="At least 8 characters, with a letter and a number."
            value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} error={pwErrors.newPassword} />
          <Input id="confirm" type="password" label="Confirm new password" autoComplete="new-password"
            value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} error={pwErrors.confirm} />
          <Alert type={pwMsg.type === 'success' ? 'success' : 'error'}>{pwMsg.text}</Alert>
          <Button type="submit" loading={pwSaving}>Change password</Button>
        </form>
      </div>
    </>
  )
}

import { useEffect, useState } from 'react'
import { Car, Pencil, Trash2, Plus } from 'lucide-react'
import api, { errorMessage } from '../../services/api.js'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import Textarea from '../../components/ui/Textarea.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Alert from '../../components/ui/Alert.jsx'
import PageLoader from '../../components/ui/PageLoader.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'

const emptyForm = { type: 'car', make: '', model: '', registrationNumber: '', fuelType: 'petrol', year: '', notes: '' }

export default function Vehicles() {
  const [vehicles, setVehicles] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () =>
    api.get('/vehicles').then((r) => setVehicles(r.data.data.vehicles)).catch((e) => setError(errorMessage(e)))

  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); setForm(emptyForm); setFormError(''); setModal(true) }
  const openEdit = (v) => {
    setEditing(v)
    setForm({ ...emptyForm, ...v, year: v.year || '', notes: v.notes || '' })
    setFormError('')
    setModal(true)
  }
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    const payload = {
      type: form.type, make: form.make, model: form.model, registrationNumber: form.registrationNumber,
      fuelType: form.fuelType, notes: form.notes,
    }
    if (form.year) payload.year = Number(form.year)
    try {
      if (editing) await api.put(`/vehicles/${editing._id}`, payload)
      else await api.post('/vehicles', payload)
      setModal(false)
      setSuccess(editing ? 'Vehicle updated.' : 'Vehicle added.')
      await load()
    } catch (err) {
      setFormError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (v) => {
    if (!window.confirm(`Remove ${v.make} ${v.model} (${v.registrationNumber})?`)) return
    setError('')
    setSuccess('')
    try {
      await api.delete(`/vehicles/${v._id}`)
      setSuccess('Vehicle removed.')
      await load()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  if (!vehicles && !error) return <PageLoader />

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-ink">My Vehicles</h1>
        <Button onClick={openAdd}><Plus className="h-4 w-4" aria-hidden="true" /> Add vehicle</Button>
      </div>
      <div className="mb-4 space-y-3">
        <Alert>{error}</Alert>
        <Alert type="success">{success}</Alert>
      </div>

      {vehicles && vehicles.length === 0 ? (
        <EmptyState icon={Car} title="No vehicles yet" text="Add your first vehicle so you can report breakdowns for it."
          action={<Button onClick={openAdd}>Add vehicle</Button>} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {vehicles?.map((v) => (
            <li key={v._id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-ink">{v.make} {v.model}</p>
                  <p className="mt-0.5 font-mono text-sm text-slate-600">{v.registrationNumber}</p>
                </div>
                <div className="flex gap-1">
                  <button type="button" onClick={() => openEdit(v)} aria-label={`Edit ${v.make} ${v.model}`}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Pencil className="h-4 w-4" /></button>
                  <button type="button" onClick={() => remove(v)} aria-label={`Remove ${v.make} ${v.model}`}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <p className="mt-3 text-sm capitalize text-slate-600">
                {v.type} · {v.fuelType}{v.year ? ` · ${v.year}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}

      {modal && (
        <Modal title={editing ? 'Edit vehicle' : 'Add vehicle'} onClose={() => setModal(false)}>
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select id="type" name="type" label="Vehicle type" value={form.type} onChange={update}>
                {['car', 'bike', 'auto', 'truck', 'bus', 'other'].map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
              </Select>
              <Select id="fuelType" name="fuelType" label="Fuel type" value={form.fuelType} onChange={update}>
                {['petrol', 'diesel', 'electric', 'cng', 'hybrid'].map((t) => <option key={t} value={t}>{t.toUpperCase() === 'CNG' ? 'CNG' : t[0].toUpperCase() + t.slice(1)}</option>)}
              </Select>
              <Input id="make" name="make" label="Manufacturer" placeholder="e.g. Maruti" value={form.make} onChange={update} required />
              <Input id="model" name="model" label="Model" placeholder="e.g. Swift" value={form.model} onChange={update} required />
              <Input id="registrationNumber" name="registrationNumber" label="Registration number" placeholder="TN01AB1234"
                value={form.registrationNumber} onChange={update} required />
              <Input id="year" name="year" type="number" label="Year (optional)" value={form.year} onChange={update} />
            </div>
            <Textarea id="notes" name="notes" rows={2} label="Notes (optional)" value={form.notes} onChange={update} />
            <Alert>{formError}</Alert>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Add vehicle'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil } from 'lucide-react'
import api, { errorMessage } from '../../services/api.js'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import Textarea from '../../components/ui/Textarea.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Alert from '../../components/ui/Alert.jsx'
import PageLoader from '../../components/ui/PageLoader.jsx'

const empty = { name: '', description: '', estimatedPrice: '' }

export default function AdminServices() {
  const [services, setServices] = useState(null)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(
    () => api.get('/admin/services').then((r) => setServices(r.data.data.services)).catch((e) => setError(errorMessage(e))),
    []
  )
  useEffect(() => { load() }, [load])

  const openAdd = () => { setEditing(null); setForm(empty); setFormError(''); setModal(true) }
  const openEdit = (s) => {
    setEditing(s)
    setForm({ name: s.name, description: s.description || '', estimatedPrice: s.estimatedPrice })
    setFormError('')
    setModal(true)
  }
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    const payload = { name: form.name, description: form.description, estimatedPrice: Number(form.estimatedPrice) }
    try {
      if (editing) await api.patch(`/admin/services/${editing._id}`, payload)
      else await api.post('/admin/services', payload)
      setModal(false)
      await load()
    } catch (err) {
      setFormError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (s) => {
    setError('')
    try {
      await api.patch(`/admin/services/${s._id}`, { isActive: !s.isActive })
      await load()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  if (!services && !error) return <PageLoader />

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Service price list</h1>
        <Button onClick={openAdd}><Plus className="h-4 w-4" aria-hidden="true" /> Add service</Button>
      </div>
      <Alert>{error}</Alert>
      {services && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Service</th>
                <th className="px-4 py-3 font-semibold">Estimated price</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {services.map((s) => (
                <tr key={s._id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.description}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">₹{s.estimatedPrice}</td>
                  <td className="px-4 py-3"><Badge tone={s.isActive ? 'success' : 'neutral'}>{s.isActive ? 'Available' : 'Hidden'}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" aria-hidden="true" /> Edit</Button>
                      <Button variant="secondary" onClick={() => toggle(s)}>{s.isActive ? 'Hide' : 'Show'}</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={editing ? 'Edit service' : 'Add service'} onClose={() => setModal(false)}>
          <form onSubmit={save} className="space-y-4">
            <Input id="name" name="name" label="Service name" value={form.name} onChange={update} required />
            <Textarea id="description" name="description" rows={2} label="Description" value={form.description} onChange={update} />
            <Input id="estimatedPrice" name="estimatedPrice" type="number" min="0" label="Estimated price (₹)"
              value={form.estimatedPrice} onChange={update} required />
            <Alert>{formError}</Alert>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>Save</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

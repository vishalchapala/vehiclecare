import { useEffect, useState, useCallback } from 'react'
import api, { errorMessage } from '../../services/api.js'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Select from '../../components/ui/Select.jsx'
import Alert from '../../components/ui/Alert.jsx'
import Modal from '../../components/ui/Modal.jsx'
import PageLoader from '../../components/ui/PageLoader.jsx'

export default function AdminUsers() {
  const [users, setUsers] = useState(null)
  const [role, setRole] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [temp, setTemp] = useState(null)

  const load = useCallback(() => {
    const params = new URLSearchParams({ limit: 50 })
    if (role) params.set('role', role)
    return api.get(`/admin/users?${params}`).then((r) => setUsers(r.data.data.users)).catch((e) => setError(errorMessage(e)))
  }, [role])

  useEffect(() => { setUsers(null); load() }, [load])

  const update = async (u, changes) => {
    setBusyId(u._id)
    setError('')
    try {
      await api.patch(`/admin/users/${u._id}`, changes)
      await load()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusyId('')
    }
  }

  const resetPassword = async (u) => {
    if (!window.confirm(`Reset the password for ${u.name}? They will get a temporary password.`)) return
    setBusyId(u._id)
    setError('')
    try {
      const res = await api.patch(`/admin/users/${u._id}/reset-password`)
      setTemp({ name: u.name, email: u.email, password: res.data.data.temporaryPassword })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusyId('')
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Users</h1>
        <Select id="roleFilter" label="Filter by role" value={role} onChange={(e) => setRole(e.target.value)} className="w-48">
          <option value="">All roles</option>
          <option value="customer">Customers</option>
          <option value="provider">Providers</option>
          <option value="admin">Admins</option>
        </Select>
      </div>
      <Alert>{error}</Alert>
      {!users && !error && <PageLoader />}
      {users && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="px-4 py-3 font-medium text-ink">{u.name}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3 capitalize text-slate-600">{u.role}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Active' : 'Disabled'}</Badge>
                      
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {u.role === 'admin' ? <span className="text-slate-400">-</span> : (
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" loading={busyId === u._id}
                          onClick={() => update(u, { isActive: !u.isActive })}>
                          {u.isActive ? 'Disable' : 'Enable'}
                        </Button>
                        <Button variant="secondary" loading={busyId === u._id} onClick={() => resetPassword(u)}>Reset password</Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {temp && (
        <Modal title="Temporary password" onClose={() => setTemp(null)}>
          <p className="text-sm text-slate-600">Give this password to <strong>{temp.name}</strong> ({temp.email}). It is shown only once. They should change it on their Profile page after logging in.</p>
          <p className="mt-4 select-all rounded-lg bg-slate-100 p-4 text-center font-mono text-xl font-bold tracking-wider text-ink">{temp.password}</p>
          <div className="mt-6 flex justify-end"><Button onClick={() => setTemp(null)}>Done</Button></div>
        </Modal>
      )}
    </>
  )
}

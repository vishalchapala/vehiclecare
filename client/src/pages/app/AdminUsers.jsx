import { useEffect, useState, useCallback } from 'react'
import api, { errorMessage } from '../../services/api.js'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Select from '../../components/ui/Select.jsx'
import Alert from '../../components/ui/Alert.jsx'
import PageLoader from '../../components/ui/PageLoader.jsx'

export default function AdminUsers() {
  const [users, setUsers] = useState(null)
  const [role, setRole] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')

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
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

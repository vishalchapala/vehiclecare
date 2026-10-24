import { useEffect, useState } from 'react'
import { Car } from 'lucide-react'
import api, { errorMessage } from '../../services/api.js'
import { formatDate } from '../../utils/constants.js'
import Button from '../../components/ui/Button.jsx'
import Alert from '../../components/ui/Alert.jsx'
import PageLoader from '../../components/ui/PageLoader.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'

export default function AdminVehicles() {
  const [data, setData] = useState(null)
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')

  useEffect(() => {
    setData(null)
    api.get(`/admin/vehicles?page=${page}&limit=10`)
      .then((r) => setData(r.data.data))
      .catch((e) => setError(errorMessage(e)))
  }, [page])

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-ink">Registered Vehicles</h1>
      <Alert>{error}</Alert>
      {!data && !error && <PageLoader />}

      {data && data.vehicles.length === 0 && (
        <EmptyState icon={Car} title="No vehicles yet" text="Vehicles added by customers will appear here." />
      )}

      {data && data.vehicles.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Vehicle</th>
                  <th className="px-4 py-3 font-semibold">Registration</th>
                  <th className="px-4 py-3 font-semibold">Type and fuel</th>
                  <th className="px-4 py-3 font-semibold">Owner</th>
                  <th className="px-4 py-3 font-semibold">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.vehicles.map((v) => (
                  <tr key={v._id}>
                    <td className="px-4 py-3 font-medium text-ink">{v.make} {v.model}{v.year ? ` (${v.year})` : ''}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{v.registrationNumber}</td>
                    <td className="px-4 py-3 capitalize text-slate-600">{v.type} · {v.fuelType}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {v.owner ? <>{v.owner.name}<span className="block text-xs text-slate-500">{v.owner.email}</span></> : 'Removed user'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(v.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <span>Page {data.pagination.page} of {data.pagination.pages} ({data.pagination.total} total)</span>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <Button variant="secondary" disabled={page >= data.pagination.pages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

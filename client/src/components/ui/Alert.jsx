import { AlertCircle, CheckCircle2 } from 'lucide-react'

export default function Alert({ type = 'error', children }) {
  if (!children) return null
  const ok = type === 'success'
  const Icon = ok ? CheckCircle2 : AlertCircle
  return (
    <div
      role={ok ? 'status' : 'alert'}
      className={`flex gap-3 rounded-lg p-3 text-sm ${ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>{children}</p>
    </div>
  )
}

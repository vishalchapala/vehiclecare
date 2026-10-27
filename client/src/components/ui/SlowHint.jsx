import { useEffect, useState } from 'react'
import { Info } from 'lucide-react'

// Appears when a request takes longer than 4 seconds. The free hosting plan puts the server to sleep when idle,
// so the first request after a pause can take up to a minute.
export default function SlowHint({ loading }) {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    if (!loading) {
      setSlow(false)
      return undefined
    }
    const timer = setTimeout(() => setSlow(true), 4000)
    return () => clearTimeout(timer)
  }, [loading])

  if (!slow) return null
  return (
    <div role="status" className="flex gap-3 rounded-lg bg-brand-50 p-3 text-sm text-brand-700">
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>The server is waking up after a quiet period. This can take up to a minute. Please keep this page open.</p>
    </div>
  )
}

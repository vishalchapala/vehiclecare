import { Loader2 } from 'lucide-react'

export default function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20 text-slate-500" role="status">
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
      <span className="sr-only">Loading</span>
    </div>
  )
}

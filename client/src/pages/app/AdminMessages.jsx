import { useEffect, useState } from 'react'
import { Mail } from 'lucide-react'
import api, { errorMessage } from '../../services/api.js'
import { formatDate } from '../../utils/constants.js'
import Alert from '../../components/ui/Alert.jsx'
import PageLoader from '../../components/ui/PageLoader.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'

export default function AdminMessages() {
  const [messages, setMessages] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/admin/messages?limit=50').then((r) => setMessages(r.data.data.messages)).catch((e) => setError(errorMessage(e)))
  }, [])

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-ink">Contact messages</h1>
      <Alert>{error}</Alert>
      {!messages && !error && <PageLoader />}
      {messages && messages.length === 0 && <EmptyState icon={Mail} title="No messages yet" text="Messages sent from the Contact page appear here." />}
      {messages && messages.length > 0 && (
        <ul className="space-y-4">
          {messages.map((m) => (
            <li key={m._id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-ink">{m.name} <span className="font-normal text-slate-500">&lt;{m.email}&gt;</span></p>
                <p className="text-sm text-slate-500">{formatDate(m.createdAt)}</p>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-slate-700">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

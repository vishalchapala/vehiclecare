import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import api from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { formatDate } from '../utils/constants.js'

// Bell with an unread counter. It asks the server for updates every 20 seconds (polling).
export default function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const box = useRef(null)

  const load = useCallback(
    () =>
      api.get('/notifications')
        .then((r) => {
          setItems(r.data.data.notifications)
          setUnread(r.data.data.unreadCount)
        })
        .catch(() => {}),
    []
  )

  useEffect(() => {
    load()
    const timer = setInterval(load, 20000)
    return () => clearInterval(timer)
  }, [load])

  // Close the panel when clicking elsewhere.
  useEffect(() => {
    const close = (e) => box.current && !box.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const openItem = async (n) => {
    setOpen(false)
    if (!n.isRead) {
      await api.patch(`/notifications/${n._id}/read`).catch(() => {})
      load()
    }
    if (n.kind === 'open') navigate('/provider/open')
    else if (n.request) navigate(`/${user.role}/requests/${n.request}`)
  }

  const readAll = async () => {
    await api.patch('/notifications/read-all').catch(() => {})
    load()
  }

  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); load() }}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        className="relative rounded-lg p-2 text-ink hover:bg-slate-100"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <p className="font-semibold text-ink">Notifications</p>
            {unread > 0 && (
              <button type="button" onClick={readAll} className="text-sm font-semibold text-brand-600 hover:underline">
                Mark all as read
              </button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {items.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet</li>}
            {items.map((n) => (
              <li key={n._id}>
                <button
                  type="button"
                  onClick={() => openItem(n)}
                  className={`w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 ${n.isRead ? '' : 'bg-brand-50'}`}
                >
                  <p className={`text-sm ${n.isRead ? 'text-slate-600' : 'font-semibold text-ink'}`}>{n.message}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{formatDate(n.createdAt)}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

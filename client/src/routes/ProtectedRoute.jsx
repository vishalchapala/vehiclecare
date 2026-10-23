import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import PageLoader from '../components/ui/PageLoader.jsx'

// Frontend gate. The backend repeats these checks, because hiding pages is not real security.
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to={`/${user.role}`} replace />
  return <Outlet />
}

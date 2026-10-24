import { Routes, Route } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout.jsx'
import DashboardLayout from './layouts/DashboardLayout.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import NotFound from './pages/NotFound.jsx'
import Dashboard from './pages/app/Dashboard.jsx'
import Vehicles from './pages/app/Vehicles.jsx'
import ReportBreakdown from './pages/app/ReportBreakdown.jsx'
import Requests from './pages/app/Requests.jsx'
import RequestDetail from './pages/app/RequestDetail.jsx'
import AdminUsers from './pages/app/AdminUsers.jsx'
import AdminVehicles from './pages/app/AdminVehicles.jsx'
import AdminServices from './pages/app/AdminServices.jsx'
import RequestService from './pages/app/RequestService.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Landing />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Customer area */}
      <Route path="/customer" element={<ProtectedRoute roles={['customer']} />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="report" element={<ReportBreakdown />} />
          <Route path="service" element={<RequestService />} />
          <Route path="requests" element={<Requests />} />
          <Route path="requests/:id" element={<RequestDetail />} />
        </Route>
      </Route>

      {/* Provider area */}
      <Route path="/provider" element={<ProtectedRoute roles={['provider']} />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="requests" element={<Requests />} />
          <Route path="requests/:id" element={<RequestDetail />} />
        </Route>
      </Route>

      {/* Admin area */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="requests" element={<Requests />} />
          <Route path="requests/:id" element={<RequestDetail />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="vehicles" element={<AdminVehicles />} />
          <Route path="services" element={<AdminServices />} />
        </Route>
      </Route>
    </Routes>
  )
}

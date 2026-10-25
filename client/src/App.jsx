import { Routes, Route } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout.jsx'
import DashboardLayout from './layouts/DashboardLayout.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
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
import OpenRequests from './pages/app/OpenRequests.jsx'
import Receipt from './pages/app/Receipt.jsx'
import Profile from './pages/app/Profile.jsx'
import AdminMessages from './pages/app/AdminMessages.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Landing />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Customer area */}
      <Route path="/customer" element={<ProtectedRoute roles={['customer']} />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="report" element={<ReportBreakdown />} />
          <Route path="service" element={<RequestService />} />
          <Route path="requests" element={<Requests />} />
          <Route path="requests/:id" element={<RequestDetail />} />
          <Route path="requests/:id/receipt" element={<Receipt />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Provider area */}
      <Route path="/provider" element={<ProtectedRoute roles={['provider']} />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="open" element={<OpenRequests />} />
          <Route path="requests" element={<Requests />} />
          <Route path="requests/:id" element={<RequestDetail />} />
          <Route path="requests/:id/receipt" element={<Receipt />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Admin area */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="requests" element={<Requests />} />
          <Route path="requests/:id" element={<RequestDetail />} />
          <Route path="requests/:id/receipt" element={<Receipt />} />
          <Route path="profile" element={<Profile />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="vehicles" element={<AdminVehicles />} />
          <Route path="services" element={<AdminServices />} />
        </Route>
      </Route>
    </Routes>
  )
}

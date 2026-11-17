import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import FloodMap from './pages/FloodMap'
import Transportation from './pages/Transportation'
import Announcements from './pages/Announcements'
import Emergency from './pages/Emergency'
import Register from './pages/Register'
import Login from './pages/Login'
import Profile from './pages/Profile'
import CompleteProfile from './pages/CompleteProfile'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import AuthCallback from './pages/AuthCallback'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/admin/AdminLayout'
import AdminRoute from './routes/AdminRoute'
import AdminHome from './pages/admin/AdminHome'
import AdminCommunications from './pages/admin/AdminCommunications'
import AdminReports from './pages/admin/AdminReports'
import AdminLocations from './pages/admin/AdminLocations'
import AdminHotlines from './pages/admin/AdminHotlines'
import AdminEvacuationCenters from './pages/admin/AdminEvacuationCenters'
import AdminTransportation from './pages/admin/AdminTransportation'
import AdminSettings from './pages/admin/AdminSettings'
import NotAuthorized from './pages/admin/NotAuthorized'
import AdminLogin from './pages/admin/AdminLogin'
import Report from './pages/Report'
import EditProfile from './pages/EditProfile'

function App() {
  return (
    <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />

      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/flood-map" element={<FloodMap />} />
        <Route path="/transportation" element={<Transportation />} />
        <Route path="/emergency" element={<Emergency />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/report" element={<Report />} />
        <Route path="/edit-profile" element={<EditProfile />} />
      </Route>

      <Route path="/admin/not-authorized" element={<NotAuthorized />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminHome />} />
          <Route path="/admin/dashboard" element={<AdminHome />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/communications" element={<AdminCommunications />} />
          <Route path="/admin/locations" element={<AdminLocations />} />
          <Route path="/admin/hotlines" element={<AdminHotlines />} />
          <Route path="/admin/evacuation-centers" element={<AdminEvacuationCenters />} />
          <Route path="/admin/transportation" element={<AdminTransportation />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/complete-profile" element={<CompleteProfile />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App

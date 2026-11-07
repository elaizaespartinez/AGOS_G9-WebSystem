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

import { useState } from 'react'
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
import CompleteProfile from './pages/CompleteProfile'

function App() {
  return (
     <Routes>
           
           
            <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/flood-map" element={<FloodMap />} />
                <Route path="/transportation" element={<Transportation />} />
                <Route path="/emergency" element={<Emergency />} />
                <Route path="/announcements" element={<Announcements />} />

            </Route>

           
            <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/complete-profile" element={<CompleteProfile />} />
            </Route>

        </Routes>
   
    
  )
}

export default App

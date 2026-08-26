import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import AdminLayout from './components/layout/AdminLayout'
import LoginPage from './pages/auth/LoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import NoticesEventsPage from './pages/admin/NoticesEventsPage'
import ExamsResultsPage from './pages/admin/ExamsResultsPage'
import PlacementsPage from './pages/admin/PlacementsPage'
import SettingsPage from './pages/admin/SettingsPage'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />

        {/* Public login route */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Protected admin routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/notices-events" element={<NoticesEventsPage />} />
            <Route path="/admin/exams-results" element={<ExamsResultsPage />} />
            <Route path="/admin/placements" element={<PlacementsPage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './components/layout/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import NoticesEventsPage from './pages/admin/NoticesEventsPage'
import ExamsResultsPage from './pages/admin/ExamsResultsPage'
import PlacementsPage from './pages/admin/PlacementsPage'
import SettingsPage from './pages/admin/SettingsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/notices-events" element={<NoticesEventsPage />} />
        <Route path="/admin/exams-results" element={<ExamsResultsPage />} />
        <Route path="/admin/placements" element={<PlacementsPage />} />
        <Route path="/admin/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  )
}

export default App
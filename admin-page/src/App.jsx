import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { ToastProvider } from './components/feedback/Toast'
import AdminLayout from './components/layout/AdminLayout'
import LoginPage from './pages/auth/LoginPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import StudentListPage from './pages/admin/StudentListPage'
import NoticesEventsPage from './pages/admin/NoticesEventsPage'
import ExamsResultsPage from './pages/admin/ExamsResultsPage'
import PlacementsPage from './pages/admin/PlacementsPage'
import SettingsPage from './pages/admin/SettingsPage'
import AlertsPage from './pages/admin/AlertsPage'
import FeedbackPage from './pages/admin/FeedbackPage'
import FacultyResearchPage from './pages/admin/FacultyResearchPage'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />

        {/* Public login route */}
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin/reset" element={<ResetPasswordPage />} />

        {/* Protected admin routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/students" element={<StudentListPage />} />
            <Route path="/admin/notices-events" element={<NoticesEventsPage />} />
            <Route path="/admin/exams-results" element={<ExamsResultsPage />} />
            <Route path="/admin/placements" element={<PlacementsPage />} />
            <Route path="/admin/alerts" element={<AlertsPage />} />
            <Route path="/admin/feedback" element={<FeedbackPage />} />
            <Route path="/admin/faculty-research" element={<FacultyResearchPage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App

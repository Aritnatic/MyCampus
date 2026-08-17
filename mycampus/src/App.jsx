import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import CampusMap from './pages/CampusMap'
import Students from './pages/Students'
import Faculty from './pages/Faculty'
import Events from './pages/Events'
import Jobs from './pages/Jobs'
import Research from './pages/Research'
import Projects from './pages/Projects'
import Startups from './pages/Startups'
import Notes from './pages/Notes'
import Timetable from './pages/Timetable'

const App = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/map" element={<CampusMap />} />
        <Route path="/students" element={<Students />} />
        <Route path="/faculty" element={<Faculty />} />
        <Route path="/events" element={<Events />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/research" element={<Research />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/startups" element={<Startups />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/profile" element={<div className="p-8 text-center"><h2 className="text-xl font-semibold">Profile Page - Coming Soon</h2></div>} />
        <Route path="/notifications" element={<div className="p-8 text-center"><h2 className="text-xl font-semibold">Notifications - Coming Soon</h2></div>} />
        <Route path="/settings" element={<div className="p-8 text-center"><h2 className="text-xl font-semibold">Settings - Coming Soon</h2></div>} />
        {/* Redirect old paths */}
        <Route path="/logout" element={<Navigate to="/" replace />} />
      </Route>
      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
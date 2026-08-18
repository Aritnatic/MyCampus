import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Briefcase,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowRight,
} from 'lucide-react'
import { currentUser, getAdminStats, getRecentActivity, getAdminUniversity } from '../../data'
import { formatDate, getRelativeDate } from '../../utils/format'

const StatsCard = ({ label, value, icon: Icon, trend, trendDirection = 'up', link }) => {
  const content = (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        {trend && (
          <p className={`text-sm mt-2 flex items-center gap-1 ${
            trendDirection === 'up' ? 'text-green-600' : trendDirection === 'down' ? 'text-red-600' : 'text-gray-500'
          }`}>
            {trendDirection === 'up' && <TrendingUp className="w-4 h-4" />}
            {trend}
          </p>
        )}
      </div>
      <div className="p-3 bg-gray-100">
        <Icon className="w-5 h-5 text-gray-700" />
      </div>
    </div>
  )

  if (link) {
    return (
      <Link to={link} className="block p-6 bg-white border border-gray-200 hover:border-gray-300 transition-colors">
        {content}
      </Link>
    )
  }

  return (
    <div className="p-6 bg-white border border-gray-200">
      {content}
    </div>
  )
}

const ActivityItem = ({ activity }) => {
  const statusIcon = () => {
    switch (activity.status) {
      case 'verified':
      case 'published':
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'pending':
      case 'pending_verification':
        return <AlertCircle className="w-4 h-4 text-amber-600" />
      case 'rejected':
      case 'blocked':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const statusText = () => {
    switch (activity.status) {
      case 'verified': return 'Verified'
      case 'pending': return 'Pending'
      case 'pending_verification': return 'Pending Verification'
      case 'published': return 'Published'
      case 'approved': return 'Approved'
      case 'rejected': return 'Rejected'
      default: return activity.status
    }
  }

  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-shrink-0">
        {statusIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
        <p className="text-sm text-gray-500">{activity.subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400">{getRelativeDate(activity.timestamp)}</span>
        <span className={`text-xs font-medium px-2 py-1 ${
          activity.status === 'verified' || activity.status === 'published' || activity.status === 'approved'
            ? 'bg-green-50 text-green-700'
            : activity.status === 'pending' || activity.status === 'pending_verification'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-gray-50 text-gray-700'
        }`}>
          {statusText()}
        </span>
      </div>
    </div>
  )
}

const AdminDashboard = () => {
  const stats = getAdminStats(currentUser.university)
  const recentActivity = getRecentActivity(currentUser.university, 8)
  const university = getAdminUniversity(currentUser.university)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Managing {university.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            Welcome back, {currentUser.name}
          </span>
          <div className="w-8 h-8 bg-gray-200 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Students"
          value={stats.students.total}
          icon={Users}
          trend={`${stats.students.verified} verified`}
          trendDirection="neutral"
          link="/admin/notices-events"
        />
        <StatsCard
          label="Faculty"
          value={stats.faculty.total}
          icon={Users}
          trend="Active staff"
          trendDirection="neutral"
          link="/admin/notices-events"
        />
        <StatsCard
          label="Active Events"
          value={stats.events.upcoming}
          icon={Calendar}
          trend={stats.events.pendingApproval > 0 ? `${stats.events.pendingApproval} pending approval` : 'All approved'}
          trendDirection={stats.events.pendingApproval > 0 ? 'up' : 'down'}
          link="/admin/notices-events"
        />
        <StatsCard
          label="Open Positions"
          value={stats.jobs.open}
          icon={Briefcase}
          trend={`${stats.jobs.verified} verified`}
          trendDirection="neutral"
          link="/admin/placements"
        />
      </div>

      {/* Quick Actions */}
      <div className="border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            to="/admin/notices-events"
            className="flex items-center gap-3 p-4 border border-gray-200 hover:border-gray-300 transition-colors group"
          >
            <FileText className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
            <div>
              <p className="text-sm font-medium text-gray-900">Publish Notice</p>
              <p className="text-xs text-gray-500">Create new announcement</p>
            </div>
          </Link>

          <Link
            to="/admin/exams-results"
            className="flex items-center gap-3 p-4 border border-gray-200 hover:border-gray-300 transition-colors group"
          >
            <Clock className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
            <div>
              <p className="text-sm font-medium text-gray-900">Schedule Exam</p>
              <p className="text-xs text-gray-500">Add new exam date</p>
            </div>
          </Link>

          <Link
            to="/admin/placements"
            className="flex items-center gap-3 p-4 border border-gray-200 hover:border-gray-300 transition-colors group"
          >
            <Briefcase className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
            <div>
              <p className="text-sm font-medium text-gray-900">Review Jobs</p>
              <p className="text-xs text-gray-500">Approve job postings</p>
            </div>
          </Link>

          <Link
            to="/admin/settings"
            className="flex items-center gap-3 p-4 border border-gray-200 hover:border-gray-300 transition-colors group"
          >
            <LayoutDashboard className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
            <div>
              <p className="text-sm font-medium text-gray-900">Manage Admins</p>
              <p className="text-xs text-gray-500">User roles & permissions</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Link to="/admin/notices-events" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div>
            {recentActivity.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </div>

        {/* Pending Items */}
        <div className="space-y-6">
          {/* Events Pending Approval */}
          <div className="border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Events Pending Approval</h2>
              <Link to="/admin/notices-events" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { title: 'Smart India Hackathon 2024', type: 'hackathon', organizer: 'Innovation Cell', date: '2024-02-17' },
                { title: 'TechFest 2024', type: 'fest', organizer: 'Student Council', date: '2024-03-15' },
                { title: 'Industry Connect 2024', type: 'workshop', organizer: 'TP Cell', date: '2024-01-22' },
              ].map((event, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{event.title}</p>
                    <p className="text-xs text-gray-500">{event.organizer} · {event.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{getRelativeDate(event.date)}</span>
                    <button className="text-xs px-2 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Jobs Pending Verification */}
          <div className="border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Jobs Pending Verification</h2>
              <Link to="/admin/placements" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { title: 'Frontend Developer', company: 'Zomato', posted: '2024-01-12' },
                { title: 'ML Research Intern', company: 'Google', posted: '2024-01-08' },
                { title: 'Data Analyst', company: 'Infosys', posted: '2024-01-09' },
              ].map((job, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{job.title}</p>
                    <p className="text-xs text-gray-500">{job.company}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{getRelativeDate(job.posted)}</span>
                    <button className="text-xs px-2 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                      Verify
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notices Management */}
      <div className="border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Campus Notices</h2>
          <Link to="/admin/notices-events" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
            Manage notices <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50">
            <p className="text-sm text-gray-500">Published</p>
            <p className="text-2xl font-bold text-gray-900">{stats.notices.published}</p>
          </div>
          <div className="p-4 bg-gray-50">
            <p className="text-sm text-gray-500">Drafts</p>
            <p className="text-2xl font-bold text-gray-900">{stats.notices.draft}</p>
          </div>
          <div className="p-4 bg-gray-50">
            <p className="text-sm text-gray-500">Pinned</p>
            <p className="text-2xl font-bold text-gray-900">{stats.notices.pinned}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
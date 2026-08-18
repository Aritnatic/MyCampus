import React from 'react'
import { AdminTable, createColumn } from '../../components/admin/AdminTable'
import { AdminBadge, AdminStatusDot } from '../../components/admin/AdminBadge'
import { AdminButton } from '../../components/admin/AdminForm'
import { formatDate, formatNumber, getRelativeDate, truncate } from '../../utils/format'
import {
  getDashboardStats,
  getRecentActivity,
  getPendingItems,
  currentAdmin,
} from '../../data/admin'
import {
  Users,
  BookOpen,
  Calendar,
  Briefcase,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  FileText,
  Upload,
  Plus,
  Download,
  ChevronRight,
  Activity,
  Clock,
} from 'lucide-react'

export default function AdminDashboard() {
  const uniId = currentAdmin.university
  const stats = getDashboardStats(uniId)
  const activity = getRecentActivity(uniId, 8)
  const pending = getPendingItems(uniId)

  const statCards = [
    {
      label: 'Total Students',
      value: formatNumber(stats.students),
      trend: '+2.3% vs last sem',
      trendUp: true,
      icon: Users,
      color: 'text-primary-600',
      bg: 'bg-primary-50',
    },
    {
      label: 'Faculty Members',
      value: formatNumber(stats.faculty),
      trend: 'Stable',
      trendUp: false,
      icon: BookOpen,
      color: 'text-success-600',
      bg: 'bg-success-50',
    },
    {
      label: 'Pending Approvals',
      value: formatNumber(stats.pendingApprovals),
      trend: `${pending.notices} notices, ${pending.events} events`,
      trendUp: false,
      icon: AlertTriangle,
      color: 'text-warning-600',
      bg: 'bg-warning-50',
    },
    {
      label: 'Active Events',
      value: formatNumber(stats.activeEvents),
      trend: `${stats.publishedNotices} published notices`,
      trendUp: true,
      icon: Calendar,
      color: 'text-primary-600',
      bg: 'bg-primary-50',
    },
    {
      label: 'Scheduled Exams',
      value: formatNumber(stats.scheduledExams),
      trend: `${stats.pendingResults} results pending`,
      trendUp: false,
      icon: BookOpen,
      color: 'text-danger-600',
      bg: 'bg-danger-50',
    },
    {
      label: 'Active Job Postings',
      value: formatNumber(stats.activeJobPostings),
      trend: `${formatNumber(stats.totalApplications)} applications`,
      trendUp: true,
      icon: Briefcase,
      color: 'text-success-600',
      bg: 'bg-success-50',
    },
  ]

  const activityColumns = [
    createColumn({ key: 'type', header: 'Type', width: '120px', render: (val, row) => {
      const icons = {
        notice_published: <FileText className="w-4 h-4 text-primary-600" />,
        event_approved: <Calendar className="w-4 h-4 text-success-600" />,
        exam_scheduled: <BookOpen className="w-4 h-4 text-danger-600" />,
        job_posted: <Briefcase className="w-4 h-4 text-warning-600" />,
        result_published: <CheckCircle className="w-4 h-4 text-success-600" />,
        notice_draft: <FileText className="w-4 h-4 text-admin-400" />,
        event_pending: <Clock className="w-4 h-4 text-warning-600" />,
        exam_pending: <Clock className="w-4 h-4 text-warning-600" />,
      }
      return (
        <span className="flex items-center gap-2">
          {icons[row.type] || <Activity className="w-4 h-4" />}
          <AdminBadge status={row.status} size="sm" />
        </span>
      )
    }}),
    createColumn({ key: 'title', header: 'Activity', width: '40%', render: (val) => truncate(val, 60) }),
    createColumn({ key: 'actor', header: 'By', width: '150px' }),
    createColumn({ key: 'timestamp', header: 'Time', width: '150px', render: (val) => (
      <span className="text-sm text-admin-600">{getRelativeDate(val)}</span>
    )}),
  ]

  const quickActions = [
    { label: 'Create Notice', icon: FileText, href: '/admin/notices-events?tab=notices&action=create', color: 'admin-btn-primary' },
    { label: 'Approve Events', icon: Calendar, href: '/admin/notices-events?tab=events', color: 'admin-btn-secondary' },
    { label: 'Schedule Exam', icon: BookOpen, href: '/admin/exams-results?tab=exams&action=create', color: 'admin-btn-secondary' },
    { label: 'Post Job', icon: Briefcase, href: '/admin/placements?action=create', color: 'admin-btn-secondary' },
    { label: 'Upload Results', icon: Upload, href: '/admin/exams-results?tab=results', color: 'admin-btn-secondary' },
    { label: 'Manage Admins', icon: Users, href: '/admin/settings', color: 'admin-btn-outline' },
  ]

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">Overview of {currentAdmin.name}'s university — {currentAdmin.university.toUpperCase()}</p>
        </div>
        <div className="flex gap-2">
          <AdminButton variant="ghost" size="sm">
            <Download className="w-4 h-4" />
            Export Report
          </AdminButton>
          <AdminButton variant="primary" size="sm">
            <Plus className="w-4 h-4" />
            Quick Action
          </AdminButton>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="admin-section mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map((stat, i) => (
            <div key={i} className="admin-stat">
              <div className="flex items-start justify-between">
                <div>
                  <p className="admin-stat-label">{stat.label}</p>
                  <p className="admin-stat-value">{stat.value}</p>
                  <p className="admin-stat-trend text-admin-500">
                    <TrendingUp className={`w-3 h-3 ${stat.trendUp ? 'text-success-600' : 'text-admin-400'}`} />
                    {stat.trend}
                  </p>
                </div>
                <div className={`p-3 rounded ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <section className="admin-section lg:col-span-1">
          <h2 className="admin-section-title">Quick Actions</h2>
          <div className="space-y-2">
            {quickActions.map((action, i) => (
              <a
                key={i}
                href={action.href}
                className={`admin-btn ${action.color} w-full justify-start gap-3`}
              >
                <action.icon className="w-5 h-5" />
                {action.label}
              </a>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="admin-section lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="admin-section-title">Recent Activity</h2>
            <AdminButton variant="ghost" size="sm" className="text-sm">
              View All
              <ChevronRight className="w-4 h-4" />
            </AdminButton>
          </div>
          <AdminTable
            columns={activityColumns}
            data={activity}
            keyField="id"
            emptyMessage="No recent activity"
            hoverable
            striped
          />
        </section>
      </div>

      {/* Pending Items Alert */}
      {(pending.notices > 0 || pending.events > 0 || pending.exams > 0 || pending.results > 0) && (
        <section className="admin-section mt-6 p-4 border border-warning-200 bg-warning-50">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-warning-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-warning-800">Items Requiring Attention</h3>
              <p className="text-sm text-warning-700 mt-1">
                {pending.notices > 0 && <span className="mr-3"><AdminBadge status="pending" size="sm" /> {pending.notices} Notices</span>}
                {pending.events > 0 && <span className="mr-3"><AdminBadge status="pending" size="sm" /> {pending.events} Events</span>}
                {pending.exams > 0 && <span className="mr-3"><AdminBadge status="pending" size="sm" /> {pending.exams} Exams</span>}
                {pending.results > 0 && <span><AdminBadge status="pending" size="sm" /> {pending.results} Results</span>}
              </p>
            </div>
            <AdminButton variant="primary" size="sm">Review All</AdminButton>
          </div>
        </section>
      )}
    </div>
  )
}


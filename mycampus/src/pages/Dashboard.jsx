import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Users, FlaskConical, FolderKanban, Rocket, FileText, Calendar, Briefcase,
  TrendingUp, Award, Target, Zap, Shield, Globe
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Badge, Avatar } from '../components/ui'
import { currentUser } from '../data'
import { getUpcomingEvents, getFeaturedJobs, getFeaturedResearch, getFeaturedProjects, getHiringStartups } from '../data'
import { formatDate, getRelativeDate } from '../utils/format'

const stats = [
  { label: 'Connections', value: currentUser.connections, icon: Users, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-100 dark:bg-primary-900/30', trend: '+12 this month' },
  { label: 'Projects', value: currentUser.projects, icon: FolderKanban, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30', trend: '+2 this semester' },
  { label: 'Events Joined', value: 7, icon: Calendar, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', trend: '3 upcoming' },
  { label: 'Achievements', value: currentUser.achievements.length, icon: Award, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', trend: 'Latest: SIH 2023' },
]

const quickActions = [
  { label: 'Find Collaborators', description: 'Discover students with complementary skills', icon: Users, path: '/students', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  { label: 'Explore Research', description: 'Find funded research opportunities', icon: FlaskConical, path: '/research', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  { label: 'Join Events', description: 'Hackathons, workshops & fests', icon: Calendar, path: '/events', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  { label: 'Browse Jobs', description: 'Internships & full-time roles', icon: Briefcase, path: '/jobs', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
  { label: 'View Projects', description: 'Student projects across universities', icon: FolderKanban, path: '/projects', color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-100 dark:bg-pink-900/30' },
  { label: 'Study Notes', description: 'Shared notes by subject', icon: FileText, path: '/notes', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
]

const upcomingEvents = getUpcomingEvents().slice(0, 3)
const featuredJobs = getFeaturedJobs().slice(0, 3)
const featuredResearch = getFeaturedResearch().slice(0, 3)
const featuredProjects = getFeaturedProjects().slice(0, 3)
const hiringStartups = getHiringStartups().slice(0, 3)

const Dashboard = () => {
  const navigate = useNavigate()

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Welcome back, {currentUser.name.split(' ')[0]}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Here&apos;s what&apos;s happening across your campus and beyond
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="success" dot className="hidden sm:inline-flex">
            Verified Student
          </Badge>
          <Badge variant="primary" dot className="hidden sm:inline-flex">
            Cross-University Access
          </Badge>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((stat, i) => (
          <Card key={stat.label} className="animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stat.value}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{stat.trend}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="section-title">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, i) => (
            <motion.button
              key={action.label}
              onClick={() => navigate(action.path)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="card-interactive p-6 text-left group"
              whileHover={{ y: -2 }}
            >
              <div className={`p-3 rounded-xl ${action.bg} mb-4`}>
                <action.icon className={`w-6 h-6 ${action.color}`} />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{action.label}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{action.description}</p>
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* Activity Feed */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="section-title">Upcoming Events</h2>
            <Badge variant="primary" size="sm">{upcomingEvents.length} this month</Badge>
          </div>
          <div className="space-y-3">
            {upcomingEvents.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="card p-4 flex items-center gap-4 group"
              >
                <div className="p-3 rounded-xl bg-primary-100 text-primary-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{event.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <span>{formatDate(event.startDate)}</span>
                    <span>·</span>
                    <span>{event.location}</span>
                  </p>
                </div>
                <Badge variant="primary" size="sm">{getRelativeDate(event.startDate)}</Badge>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Featured Jobs */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="section-title">Featured Opportunities</h2>
            <Badge variant="success" size="sm">{featuredJobs.length} hiring</Badge>
          </div>
          <div className="space-y-3">
            {featuredJobs.map((job, i) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 50 }}
                className="card p-4 flex items-center gap-4 group"
              >
                <div className="p-3 rounded-xl bg-green-100 text-green-600">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{job.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <span>{job.company}</span>
                    <span>·</span>
                    <span>{job.salary || job.stipend}</span>
                  </p>
                </div>
                <Badge variant="success" size="sm">{job.type}</Badge>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>

      {/* Cross-University Highlights */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="section-title">Cross-University Highlights</h2>
              <p className="text-gray-500 dark:text-gray-400">Opportunities from partner universities</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Research */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <FlaskConical className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-gray-900">Research</h3>
            </div>
            <p className="text-sm text-gray-500 mb-3">{featuredResearch.length} funded opportunities recruiting</p>
            {featuredResearch.slice(0, 2).map((r) => (
              <p key={r.id} className="text-sm text-gray-700 dark:text-gray-300 mb-2 truncate">• {r.title}</p>
            ))}
            <Badge variant="purple" size="sm">View all →</Badge>
          </Card>

          {/* Projects */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-pink-100 text-pink-600">
                <FolderKanban className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-gray-900">Projects</h3>
            </div>
            <p className="text-sm text-gray-500 mb-3">{featuredProjects.length} active cross-university projects</p>
            {featuredProjects.slice(0, 2).map((p) => (
              <p key={p.id} className="text-sm text-gray-700 dark:text-gray-300 mb-2 truncate">• {p.title}</p>
            ))}
            <Badge variant="pink" size="sm">View all →</Badge>
          </Card>

          {/* Startups */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                <Rocket className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-gray-900">Startups Hiring</h3>
            </div>
            <p className="text-sm text-gray-500 mb-3">{hiringStartups.length} student startups seeking team</p>
            {hiringStartups.slice(0, 2).map((s) => (
              <p key={s.id} className="text-sm text-gray-700 dark:text-gray-300 mb-2 truncate">• {s.name} - {s.rolesOpen[0]?.role}</p>
            ))}
            <Badge variant="orange" size="sm">View all →</Badge>
          </Card>
        </div>
      </motion.section>

      {/* Verification Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card p-6 bg-gradient-to-r from-primary-50 to-purple-50 border-primary-200"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-600">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Campus Verified</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your college identity is verified. Access to notices, results, exams & safety alerts.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="primary" dot>Verified</Badge>
            <Badge variant="purple" dot>Cross-University Enabled</Badge>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Dashboard
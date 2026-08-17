import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar, Clock, AlertCircle, CheckCircle, XCircle, Filter, ChevronDown,
  Search, Download, Eye, Bell, Building, MapPin
} from 'lucide-react'
import { Card, CardContent, Badge, Avatar, Button, Input, SearchInput, Dropdown, DropdownMenu, DropdownItem, Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui'
import { exams, results, getExamsByBranch } from '../data'
import { formatDate, formatTime, getRelativeDate } from '../utils/format'

const Timetable = () => {
  const [activeTab, setActiveTab] = useState('exams')
  const [filterBranch, setFilterBranch] = useState('CSE')
  const [filterStatus, setFilterStatus] = useState('all')

  const branches = ['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE']

  const filteredExams = exams.filter(e => {
    const matchesBranch = filterBranch === 'all' || e.branch === filterBranch
    const matchesStatus = filterStatus === 'all' || e.status === filterStatus
    return matchesBranch && matchesStatus
  })

  const branchResults = results.filter(r => r.branch === filterBranch)

  const getStatusConfig = (status) => {
    switch (status) {
      case 'upcoming': return { color: 'primary', icon: Clock, label: 'Upcoming' }
      case 'ongoing': return { color: 'warning', icon: AlertCircle, label: 'Ongoing' }
      case 'completed': return { color: 'success', icon: CheckCircle, label: 'Completed' }
      default: return { color: 'gray', icon: Clock, label: status }
    }
  }

  const getGradeConfig = (grade) => {
    const colors = {
      'A+': 'success',
      'A': 'success',
      'B+': 'primary',
      'B': 'primary',
      'C': 'warning',
      'D': 'danger',
      'F': 'danger',
    }
    return colors[grade] || 'gray'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Exams & Timetable</h1>
          <p className="text-gray-500 dark:text-gray-400">Exam schedules, results, and academic calendar</p>
        </div>
        <div className="flex items-center gap-2">
          <Dropdown
            trigger={
              <button className="btn-secondary flex items-center gap-2">
                <Building className="w-4 h-4" />
                Branch: {filterBranch === 'all' ? 'All' : filterBranch}
                <ChevronDown className="w-4 h-4" />
              </button>
            }
          >
            <DropdownMenu className="w-40">
              <DropdownItem onClick={() => setFilterBranch('all')}>All Branches</DropdownItem>
              {branches.map(b => (
                <DropdownItem key={b} onClick={() => setFilterBranch(b)}>{b}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
          <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Export Calendar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="w-full">
          <TabsTrigger value="exams" className="flex-1">
            <Calendar className="w-4 h-4 mr-2" />
            Exam Schedule
          </TabsTrigger>
          <TabsTrigger value="results" className="flex-1">
            <CheckCircle className="w-4 h-4 mr-2" />
            Results
          </TabsTrigger>
        </TabsList>

        {/* Exams Tab */}
        <TabsContent value="exams">
          <div className="space-y-4 mt-4">
            {/* Upcoming Exams Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['upcoming', 'ongoing', 'completed'].map(status => {
                const count = exams.filter(e => e.status === status && (filterBranch === 'all' || e.branch === filterBranch)).length
                const config = getStatusConfig(status)
                const Icon = config.icon
                return (
                  <motion.div
                    key={status}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-4 text-center"
                  >
                    <div className={`p-2 rounded-xl bg-${config.color}-100 dark:bg-${config.color}-900/30 text-${config.color}-600 dark:text-${config.color}-400 mx-auto mb-2 w-10 h-10 flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{count}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{config.label}</p>
                  </motion.div>
                )
              })}
            </div>

            {/* Exam Cards */}
            <div className="space-y-3">
              {filteredExams.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No exams found for {filterBranch === 'all' ? 'any branch' : filterBranch}</p>
                </div>
              ) : (
                filteredExams.map((exam, i) => {
                  const config = getStatusConfig(exam.status)
                  const Icon = config.icon
                  const daysLeft = getRelativeDate(exam.date)

                  return (
                    <motion.div
                      key={exam.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="card p-5 hover:shadow-card-hover group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h3 className="font-semibold text-gray-900">{exam.subjectName}</h3>
                            <Badge variant={config.color} size="sm">
                              <Icon className="w-3 h-3 mr-1" />
                              {config.label}
                            </Badge>
                            <Badge variant="gray" size="sm">{exam.type}</Badge>
                          </div>
                          <p className="text-sm text-gray-500 mb-1">{exam.subjectCode} · {exam.branch} · Sem {exam.semester}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(exam.date)} ({exam.day})
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatTime(exam.startTime)} - {formatTime(exam.endTime)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {exam.room}
                            </span>
                            <span className="flex items-center gap-1">
                              <Badge variant="primary" size="sm">Seat: {exam.seatNo}</Badge>
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge
                            variant={
                              daysLeft.includes('Today') ? 'danger' :
                              daysLeft.includes('Tomorrow') ? 'warning' : 'primary'
                            }
                            size="sm"
                          >
                            {daysLeft}
                          </Badge>
                          <div className="flex gap-1">
                            <Button variant="secondary" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                              Details
                            </Button>
                            <Button variant="secondary" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />}>
                              Hall Ticket
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          </div>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results">
          <div className="space-y-4 mt-4">
            {branchResults.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No results published for {filterBranch === 'all' ? 'any branch' : filterBranch}</p>
              </div>
            ) : (
              branchResults.map((result, i) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="card p-6"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{result.examName}</h3>
                      <p className="text-sm text-gray-500">{result.branch} · Sem {result.semester} · Announced {formatDate(result.announcedDate)}</p>
                    </div>
                    <Badge variant="success" size="sm" dot>Published</Badge>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{result.sgpa}</p>
                      <p className="text-sm text-gray-500">SGPA</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{result.cgpa}</p>
                      <p className="text-sm text-gray-500">CGPA</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">Rank {result.rank}/{result.totalStudents}</p>
                      <p className="text-sm text-gray-500">Class Rank</p>
                    </div>
                  </div>

                  {/* Subjects */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b border-gray-200">
                          <th className="pb-2 font-medium">Subject</th>
                          <th className="pb-2 font-medium text-center">Code</th>
                          <th className="pb-2 font-medium text-center">Credits</th>
                          <th className="pb-2 font-medium text-center">Grade</th>
                          <th className="pb-2 font-medium text-center">Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.subjects.map((sub, idx) => (
                          <tr key={sub.code} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3">{sub.name}</td>
                            <td className="py-3 text-center text-gray-500">{sub.code}</td>
                            <td className="py-3 text-center">{sub.credits}</td>
                            <td className="py-3 text-center">
                              <Badge variant={getGradeConfig(sub.grade)} size="sm">{sub.grade}</Badge>
                            </td>
                            <td className="py-3 text-center font-medium">{sub.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                    <Button variant="primary" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                      Download Grade Card
                    </Button>
                    <Button variant="secondary" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                      View Detailed
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Academic Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card p-6"
      >
        <h2 className="section-title mb-4">Academic Calendar Highlights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Even Sem Classes Start', date: '2024-01-02', icon: Calendar, color: 'primary' },
            { title: 'Mid Sem Exams', date: '2024-02-12', icon: Clock, color: 'warning' },
            { title: 'End Sem Exams', date: '2024-05-15', icon: AlertCircle, color: 'danger' },
            { title: 'Results Declaration', date: '2024-06-20', icon: CheckCircle, color: 'success' },
            { title: 'Summer Break', date: '2024-07-01', icon: Calendar, color: 'info' },
            { title: 'Odd Sem Classes Start', date: '2024-08-01', icon: Calendar, color: 'primary' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl bg-${item.color}-100 text-${item.color}-600`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-500">{formatDate(item.date)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default Timetable
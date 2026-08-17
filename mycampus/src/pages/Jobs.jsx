import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Briefcase, Building, MapPin, DollarSign, Clock, Calendar, Filter, ChevronDown,
  Star, Award, Zap, Globe, Target, Search, Heart, Users
} from 'lucide-react'
import { Card, CardContent, Badge, Avatar, Button, Input, SearchInput, Dropdown, DropdownMenu, DropdownItem } from '../components/ui'
import { jobs, getOpenJobs, getFeaturedJobs, getUniversity } from '../data'
import { formatDate, getRelativeDate } from '../utils/format'

const Jobs = () => {
  const [filterType, setFilterType] = useState('all')
  const [filterUniversity, setFilterUniversity] = useState('all')
  const [filterMode, setFilterMode] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [savedJobs, setSavedJobs] = useState(new Set())

  const universities = ['cvrp', 'kiit', 'iitbbs', 'soa', 'vit', 'nist']
  const roles = [...new Set(jobs.map(j => j.role))].sort()
  const modes = [...new Set(jobs.map(j => j.mode))].sort()

  const filteredJobs = jobs.filter(j => {
    const matchesSearch = j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesType = filterType === 'all' || j.role === filterType
    const matchesUniversity = filterUniversity === 'all' || j.university === filterUniversity
    const matchesMode = filterMode === 'all' || j.mode === filterMode

    return matchesSearch && matchesType && matchesUniversity && matchesMode
  })

  const openJobs = getOpenJobs()
  const featuredJobs = getFeaturedJobs()

  const typeFilters = [
    { key: 'all', label: 'All', icon: Briefcase, count: openJobs.length },
    { key: 'featured', label: 'Featured', icon: Star, count: featuredJobs.length },
    { key: 'intern', label: 'Internships', icon: Award, count: jobs.filter(j => j.role === 'intern').length },
    { key: 'full-time', label: 'Full-Time', icon: Briefcase, count: jobs.filter(j => j.role === 'full-time').length },
    { key: 'research', label: 'Research', icon: Zap, count: jobs.filter(j => j.role === 'research').length },
  ]

  const toggleSave = (jobId) => {
    setSavedJobs(prev => {
      const next = new Set(prev)
      if (next.has(jobId)) next.delete(jobId)
      else next.add(jobId)
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Career Opportunities</h1>
          <p className="text-gray-500 dark:text-gray-400">Internships, full-time roles, and research positions</p>
        </div>
      </div>

      {/* Quick Type Filters */}
      <div className="flex gap-2 flex-wrap">
        {typeFilters.map(filter => (
          <button
            key={filter.key}
            onClick={() => setFilterType(filter.key)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${filterType === filter.key
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}
            `}
          >
            <filter.icon className="w-4 h-4" />
            {filter.label}
            <Badge variant={filterType === filter.key ? 'gray' : 'primary'} size="sm">{filter.count}</Badge>
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <SearchInput
          placeholder="Search by role, company, skills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Dropdown
          trigger={
            <button className="btn-secondary flex items-center gap-2">
              <Building className="w-4 h-4" />
              University: {filterUniversity === 'all' ? 'All' : getUniversity(filterUniversity).short}
              <ChevronDown className="w-4 h-4" />
            </button>
          }
        >
          <DropdownMenu className="w-56">
            <DropdownItem onClick={() => setFilterUniversity('all')}>All Universities</DropdownItem>
            {universities.map(u => {
              const uni = getUniversity(u)
              return <DropdownItem key={u} onClick={() => setFilterUniversity(u)}>{uni.name} ({uni.short})</DropdownItem>
            })}
          </DropdownMenu>
        </Dropdown>
        <Dropdown
          trigger={
            <button className="btn-secondary flex items-center gap-2">
              <Target className="w-4 h-4" />
              Role: {filterType === 'all' ? 'All' : filterType}
              <ChevronDown className="w-4 h-4" />
            </button>
          }
        >
          <DropdownMenu className="w-48">
            <DropdownItem onClick={() => setFilterType('all')}>All Roles</DropdownItem>
            {roles.map(r => (
              <DropdownItem key={r} onClick={() => setFilterType(r)}>{r.charAt(0).toUpperCase() + r.slice(1)}</DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
        <Dropdown
          trigger={
            <button className="btn-secondary flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Mode: {filterMode === 'all' ? 'All' : filterMode}
              <ChevronDown className="w-4 h-4" />
            </button>
          }
        >
          <DropdownMenu className="w-48">
            <DropdownItem onClick={() => setFilterMode('all')}>All Modes</DropdownItem>
            {modes.map(m => (
              <DropdownItem key={m} onClick={() => setFilterMode(m)}>{m.charAt(0).toUpperCase() + m.slice(1)}</DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Showing <span className="font-medium text-gray-900 dark:text-gray-100">{filteredJobs.length}</span> opportunities
      </p>

      {/* Job Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredJobs.map((job, i) => {
          const uni = getUniversity(job.university)
          const isSaved = savedJobs.has(job.id)
          const deadline = getRelativeDate(job.deadline)

          return (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="card p-5 hover:shadow-card-hover group"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-primary-600 dark:text-primary-400 text-lg">{job.logo}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{job.title}</h3>
                    {job.featured && <Badge variant="primary" size="sm">Featured</Badge>}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{job.company}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSave(job.id) }}
                  className={`p-2 rounded-lg transition-colors ${isSaved ? 'text-red-500 bg-red-50 dark:bg-red-900/30' : 'text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30'}`}
                  aria-label={isSaved ? 'Remove from saved' : 'Save job'}
                >
                  <Heart className={isSaved ? 'fill-current' : ''} />
                </button>
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <span>{job.location}</span>
                  <span>·</span>
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs">{job.mode}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">{job.salary || job.stipend}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <span>Apply by {formatDate(job.deadline)}</span>
                  <Badge variant={deadline.includes('Today') ? 'danger' : deadline.includes('Tomorrow') ? 'warning' : 'gray'} size="sm">
                    {deadline}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <span>{uni.name}</span>
                </div>
              </div>

              {/* Required Skills */}
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">Required Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.slice(0, 5).map(skill => (
                    <Badge key={skill} variant="gray" size="sm">{skill}</Badge>
                  ))}
                  {job.skills.length > 5 && (
                    <Badge variant="gray" size="sm">+{job.skills.length - 5} more</Badge>
                  )}
                </div>
              </div>

              {/* Eligibility */}
              <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                <p><strong>Branches:</strong> {job.eligibleBranches.join(', ')}</p>
                <p><strong>Years:</strong> {job.eligibleYears.map(y => `${y}rd/4th year`).join(', ')}</p>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700 mb-4">
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {job.applicants} applicants
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" />
                    {job.positions} positions
                  </span>
                </div>
                <Badge variant={job.verified ? 'success' : 'warning'} size="sm" dot>
                  {job.verified ? 'Verified' : 'Unverified'}
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="primary" size="sm" className="flex-1" leftIcon={<Briefcase className="w-4 h-4" />}>
                  Apply Now
                </Button>
                <Button variant="secondary" size="sm" leftIcon={<Heart className="w-4 h-4" />}>
                  {isSaved ? 'Saved' : 'Save'}
                </Button>
              </div>
            </motion.div>
          )
        })}
      </div>

      {filteredJobs.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No opportunities found matching your filters.</p>
        </div>
      )}
    </div>
  )
}

export default Jobs
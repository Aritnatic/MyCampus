import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FlaskConical, Building, MapPin, DollarSign, Clock, Calendar, Filter, ChevronDown,
  Star, Award, Zap, Globe, Target, Search, BookOpen, Users, TrendingUp
} from 'lucide-react'
import { Card, CardContent, Badge, Avatar, Button, Input, SearchInput, Dropdown, DropdownMenu, DropdownItem } from '../components/ui'
import { research, getRecruitingResearch, getCrossUniversityResearch, getFeaturedResearch, getUniversity } from '../data'
import { formatDate, getRelativeDate, getVisibilityBadge } from '../utils/format'

const Research = () => {
  const [filterType, setFilterType] = useState('recruiting')
  const [filterUniversity, setFilterUniversity] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const universities = ['cvrp', 'kiit', 'iitbbs', 'soa', 'vit', 'nist']

  const filteredResearch = research.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.requiredSkills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesType = filterType === 'all' || r.status === filterType
    const matchesUniversity = filterUniversity === 'all' || r.university === filterUniversity

    return matchesSearch && matchesType && matchesUniversity
  })

  const getVis = (r) => getVisibilityBadge(r.visibility)

  const recruitingResearch = getRecruitingResearch()
  const crossUniResearch = getCrossUniversityResearch()
  const featuredResearch = getFeaturedResearch()

  const typeFilters = [
    { key: 'recruiting', label: 'Recruiting', icon: Target, count: recruitingResearch.length },
    { key: 'featured', label: 'Featured', icon: Star, count: featuredResearch.length },
    { key: 'cross-university', label: 'Cross-University', icon: Globe, count: crossUniResearch.length },
    { key: 'active', label: 'Active', icon: TrendingUp, count: research.filter(r => r.status === 'active').length },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Research Opportunities</h1>
          <p className="text-gray-500 dark:text-gray-400">Funded projects, PhD positions, and research collaborations</p>
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
          placeholder="Search by title, supervisor, skills..."
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
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Showing <span className="font-medium text-gray-900 dark:text-gray-100">{filteredResearch.length}</span> opportunities
      </p>

      {/* Research Cards */}
      <div className="space-y-4">
        {filteredResearch.map((r, i) => {
          const uni = getUniversity(r.university)
          const daysLeft = getRelativeDate(r.deadline)

          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="card p-6 hover:shadow-card-hover"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{r.title}</h3>
                    {r.featured && <Badge variant="primary" size="sm">Featured</Badge>}
                    {(() => { const vis = getVis(r); return (
                    <Badge variant={vis.color === 'primary' ? 'primary' : 'gray'} size="sm">
                      {vis.icon} {vis.label}
                    </Badge>
                    )})()}
                    <Badge variant={r.type === 'funded' ? 'success' : 'info'} size="sm">{r.type}</Badge>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">{r.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Building className="w-4 h-4" /> {uni.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" /> {r.department}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {r.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" /> {r.stipend}
                    </span>
                  </div>
                </div>
                <Badge
                  variant={
                    daysLeft.includes('Today') ? 'danger' :
                    daysLeft.includes('Tomorrow') ? 'warning' :
                    r.status === 'recruiting' ? 'success' : 'gray'
                  }
                  size="sm"
                >
                  {daysLeft}
                </Badge>
              </div>

              {/* Supervisor */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3">
                <Avatar size="sm" name="Dr. Supervisor" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Supervisor: Dr. {r.supervisor.split(' ').slice(1).join(' ')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{r.department}</p>
                </div>
              </div>

              {/* Required Skills */}
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <Target className="w-3 h-3" /> Required Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {r.requiredSkills.slice(0, 6).map(skill => (
                    <Badge key={skill} variant="gray" size="sm">{skill}</Badge>
                  ))}
                  {r.requiredSkills.length > 6 && (
                    <Badge variant="gray" size="sm">+{r.requiredSkills.length - 6} more</Badge>
                  )}
                </div>
              </div>

              {/* Preferred Skills */}
              {r.preferredSkills.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <Star className="w-3 h-3" /> Preferred
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {r.preferredSkills.slice(0, 4).map(skill => (
                      <Badge key={skill} variant="purple" size="sm">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Eligibility */}
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">Eligibility</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{r.eligibility.join(' · ')}</p>
              </div>

              {/* Tags */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {r.tags.map(tag => (
                  <Badge key={tag} variant="primary" size="sm">{tag}</Badge>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                <Button variant="primary" size="sm" leftIcon={<BookOpen className="w-4 h-4" />} className="flex-1">
                  View Details
                </Button>
                <Button variant="secondary" size="sm" leftIcon={<Users className="w-4 h-4" />} className="flex-1">
                  Apply Now
                </Button>
              </div>
            </motion.div>
          )
        })}
      </div>

      {filteredResearch.length === 0 && (
        <div className="text-center py-12">
          <FlaskConical className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No research opportunities found matching your filters.</p>
        </div>
      )}
    </div>
  )
}

export default Research
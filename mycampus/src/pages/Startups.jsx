import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Rocket, Building, MapPin, DollarSign, Clock, Filter, ChevronDown,
  Star, Globe, Target, Search, Users, Briefcase, TrendingUp, Heart
} from 'lucide-react'
import { Card, CardContent, Badge, Avatar, Button, Input, SearchInput, Dropdown, DropdownMenu, DropdownItem } from '../components/ui'
import { startups, getHiringStartups, getFeaturedStartups, getUniversity } from '../data'
import { formatDate } from '../utils/format'

const Startups = () => {
  const [filterType, setFilterType] = useState('hiring')
  const [filterUniversity, setFilterUniversity] = useState('all')
  const [filterSector, setFilterSector] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [savedStartups, setSavedStartups] = useState(new Set())

  const universities = ['cvrp', 'kiit', 'iitbbs', 'soa', 'vit', 'nist']
  const sectors = [...new Set(startups.map(s => s.sector))].sort()

  const filteredStartups = startups.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.skills.some(sk => sk.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesType = filterType === 'all' || s.status === filterType
    const matchesUniversity = filterUniversity === 'all' || s.university === filterUniversity
    const matchesSector = filterSector === 'all' || s.sector === filterSector

    return matchesSearch && matchesType && matchesUniversity && matchesSector
  })

  const hiringStartups = getHiringStartups()
  const featuredStartups = getFeaturedStartups()

  const typeFilters = [
    { key: 'hiring', label: 'Hiring', icon: Users, count: hiringStartups.length },
    { key: 'featured', label: 'Featured', icon: Star, count: featuredStartups.length },
    { key: 'all', label: 'All', icon: Rocket, count: startups.length },
  ]

  const toggleSave = (startupId) => {
    setSavedStartups(prev => {
      const next = new Set(prev)
      if (next.has(startupId)) next.delete(startupId)
      else next.add(startupId)
      return next
    })
  }

  const stageColors = {
    'Idea': 'gray',
    'Pre-Seed': 'purple',
    'Seed': 'success',
    'Series A': 'primary',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Student Startups</h1>
          <p className="text-gray-500 dark:text-gray-400">Discover startups founded by students, find co-founder roles, and join early teams</p>
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
          placeholder="Search by name, sector, role, skills..."
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
              Sector: {filterSector === 'all' ? 'All' : filterSector}
              <ChevronDown className="w-4 h-4" />
            </button>
          }
        >
          <DropdownMenu className="w-48">
            <DropdownItem onClick={() => setFilterSector('all')}>All Sectors</DropdownItem>
            {sectors.map(s => (
              <DropdownItem key={s} onClick={() => setFilterSector(s)}>{s}</DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Showing <span className="font-medium text-gray-900 dark:text-gray-100">{filteredStartups.length}</span> startups
      </p>

      {/* Startup Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStartups.map((startup, i) => {
          const uni = getUniversity(startup.university)
          const isSaved = savedStartups.has(startup.id)

          return (
            <motion.div
              key={startup.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="card p-5 hover:shadow-card-hover group"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{startup.name}</h3>
                    {startup.featured && <Badge variant="primary" size="sm">Featured</Badge>}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{startup.tagline}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSave(startup.id) }}
                  className={`p-2 rounded-lg transition-colors ${isSaved ? 'text-red-500 bg-red-50 dark:bg-red-900/30' : 'text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30'}`}
                  aria-label={isSaved ? 'Remove from saved' : 'Save startup'}
                >
                  <Heart className={isSaved ? 'fill-current' : ''} />
                </button>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{startup.description}</p>

              {/* Meta info */}
              <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium">{startup.sector}</span>
                  <Badge variant={stageColors[startup.stage] || 'gray'} size="sm">{startup.stage}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <span>{uni.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <span>{startup.funding}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <span>Team: {startup.teamSize}</span>
                </div>
              </div>

              {/* Skills */}
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">Tech Stack</p>
                <div className="flex flex-wrap gap-1.5">
                  {startup.skills.slice(0, 5).map(skill => (
                    <Badge key={skill} variant="gray" size="sm">{skill}</Badge>
                  ))}
                  {startup.skills.length > 5 && (
                    <Badge variant="gray" size="sm">+{startup.skills.length - 5}</Badge>
                  )}
                </div>
              </div>

              {/* Open Roles */}
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <Briefcase className="w-3 h-3" /> Open Roles
                </p>
                <div className="space-y-1.5 max-h-24 overflow-y-auto">
                  {startup.rolesOpen.slice(0, 3).map((role, idx) => (
                    <div key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Badge variant="success" size="sm">{role.type}</Badge>
                      <span className="font-medium">{role.role}</span>
                      {role.equity && <span className="text-green-600 dark:text-green-400 text-xs">{role.equity}</span>}
                      {role.salary && <span className="text-gray-500 dark:text-gray-400 text-xs">{role.salary}</span>}
                    </div>
                  ))}
                  {startup.rolesOpen.length > 3 && (
                    <Badge variant="primary" size="sm" className="w-full text-center">+{startup.rolesOpen.length - 3} more roles</Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                <Button variant="primary" size="sm" className="flex-1" leftIcon={<Users className="w-4 h-4" />}>
                  Apply
                </Button>
                <Button variant="secondary" size="sm" leftIcon={<Heart className="w-4 h-4" />}>
                  {isSaved ? 'Saved' : 'Save'}
                </Button>
              </div>
            </motion.div>
          )
        })}
      </div>

      {filteredStartups.length === 0 && (
        <div className="text-center py-12">
          <Rocket className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No startups found matching your filters.</p>
        </div>
      )}
    </div>
  )
}

export default Startups
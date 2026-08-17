import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar, Clock, MapPin, Users, Tag, Star, Filter, ChevronDown,
  Trophy, Award, Zap, Globe, Building
} from 'lucide-react'
import { Card, CardContent, Badge, Avatar, Button, Input, SearchInput, Dropdown, DropdownMenu, DropdownItem, DropdownDivider } from '../components/ui'
import { events, getUniversity, getUpcomingEvents, getFeaturedEvents, getCrossUniversityEvents } from '../data'
import { formatDate, formatTime, getRelativeDate, getVisibilityBadge } from '../utils/format'

const Events = () => {
  const [filterType, setFilterType] = useState('upcoming')
  const [filterUniversity, setFilterUniversity] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const universities = ['cvrp', 'kiit', 'iitbbs', 'soa', 'vit', 'nist']
  const categories = [...new Set(events.map(e => e.category))].sort()
  const types = [...new Set(events.map(e => e.type))].sort()

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesType = filterType === 'all' || e.status === filterType
    const matchesUniversity = filterUniversity === 'all' || e.university === filterUniversity
    const matchesCategory = filterCategory === 'all' || e.category === filterCategory

    return matchesSearch && matchesType && matchesUniversity && matchesCategory
  })

  const upcomingEvents = getUpcomingEvents()
  const featuredEvents = getFeaturedEvents()
  const crossUniEvents = getCrossUniversityEvents()

  const typeFilters = [
    { key: 'upcoming', label: 'Upcoming', icon: Calendar, count: upcomingEvents.length },
    { key: 'featured', label: 'Featured', icon: Star, count: featuredEvents.length },
    { key: 'cross-university', label: 'Cross-University', icon: Globe, count: crossUniEvents.length },
    { key: 'hackathon', label: 'Hackathons', icon: Zap, count: events.filter(e => e.type === 'hackathon').length },
    { key: 'workshop', label: 'Workshops', icon: Award, count: events.filter(e => e.type === 'workshop').length },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Events & Hackathons</h1>
          <p className="text-gray-500 dark:text-gray-400">Discover campus events, workshops, hackathons, and competitions</p>
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
          placeholder="Search events, tags, organizer..."
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
              <Tag className="w-4 h-4" />
              Category: {filterCategory === 'all' ? 'All' : filterCategory}
              <ChevronDown className="w-4 h-4" />
            </button>
          }
        >
          <DropdownMenu className="w-56">
            <DropdownItem onClick={() => setFilterCategory('all')}>All Categories</DropdownItem>
            {categories.map(c => (
              <DropdownItem key={c} onClick={() => setFilterCategory(c)}>{c}</DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Showing <span className="font-medium text-gray-900 dark:text-gray-100">{filteredEvents.length}</span> events
      </p>

      {/* Event Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEvents.map((event, i) => {
          const uni = getUniversity(event.university)
          const vis = getVisibilityBadge(event.visibility)
          const daysLeft = getRelativeDate(event.startDate)

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="card overflow-hidden hover:shadow-card-hover group"
            >
              {/* Event Image */}
              <div className="relative h-40 bg-gradient-to-br from-primary-500 to-purple-600">
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  {event.type === 'hackathon' && <Zap className="w-12 h-12 text-white/80" />}
                  {event.type === 'fest' && <Trophy className="w-12 h-12 text-white/80" />}
                  {event.type === 'workshop' && <Award className="w-12 h-12 text-white/80" />}
                  {event.type === 'symposium' && <Building className="w-12 h-12 text-white/80" />}
                  {event.type === 'startup' && <Zap className="w-12 h-12 text-white/80" />}
                  {event.type === 'competition' && <Award className="w-12 h-12 text-white/80" />}
                  {event.type === 'conference' && <Users className="w-12 h-12 text-white/80" />}
                  {event.type === 'safety' && <Award className="w-12 h-12 text-white/80" />}
                </div>
                {event.featured && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="gray" className="bg-white/90 text-gray-900">Featured</Badge>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 flex gap-1.5">
                  <Badge variant="primary" size="sm">{event.type}</Badge>
                  <Badge variant={vis.color === 'primary' ? 'primary' : 'gray'} size="sm">
                    {vis.icon} {vis.label}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-5 space-y-3">
                <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">{event.title}</h3>

                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>{formatDate(event.startDate)} - {formatDate(event.endDate)}</span>
                  <span>·</span>
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>{formatTime(event.startDate)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{event.location}</span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{event.description}</p>

                <div className="flex flex-wrap gap-1">
                  {event.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="gray" size="sm">{tag}</Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <Building className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{uni.short}</span>
                  </div>
                  <Badge variant={daysLeft.includes('Today') ? 'danger' : daysLeft.includes('Tomorrow') ? 'warning' : 'primary'} size="sm">
                    {daysLeft}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button variant="primary" size="sm" className="flex-1" leftIcon={<Calendar className="w-4 h-4" />}>
                    {event.status === 'upcoming' ? 'Register' : 'View'}
                  </Button>
                  <Button variant="secondary" size="sm" leftIcon={<Users className="w-4 h-4" />}>
                    {event.registeredCount}
                  </Button>
                </div>
              </CardContent>
            </motion.div>
          )
        })}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No events found matching your filters.</p>
        </div>
      )}
    </div>
  )
}

export default Events
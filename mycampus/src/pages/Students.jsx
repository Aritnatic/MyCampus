import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search, UserPlus, MessageCircle, Users, MapPin, Star, Filter, ChevronDown,
  Sparkles, Briefcase, Code, GraduationCap, Globe, Target
} from 'lucide-react'
import { Card, CardContent, Badge, Avatar, Button, Input, SearchInput, Dropdown, DropdownMenu, DropdownItem } from '../components/ui'
import { students, currentUser, getUniversity } from '../data'
import { useToast } from '../components/ui/Toast'

const Students = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [selectedInterest, setSelectedInterest] = useState('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [connecting, setConnecting] = useState({})
  const { toast } = useToast()

  const allInterests = [...new Set(students.flatMap(s => s.interests))].sort()

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.interests.some(i => i.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.skills.some(sk => sk.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.branch.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesInterest = selectedInterest === 'all' || s.interests.includes(selectedInterest)

    let matchesFilter = true
    if (filterType === 'similar') {
      matchesFilter = s.id !== currentUser.id &&
        (s.interests.some(i => currentUser.interests.includes(i)) || s.skills.some(sk => currentUser.skills.includes(sk)))
    } else if (filterType === 'mentorship') {
      matchesFilter = s.year > currentUser.year
    } else if (filterType === 'collaboration') {
      matchesFilter = s.skills.some(sk => !currentUser.skills.includes(sk)) && s.id !== currentUser.id
    } else if (filterType === 'cross-university') {
      matchesFilter = s.university !== currentUser.university
    }

    return matchesSearch && matchesInterest && matchesFilter
  })

  const handleConnect = (student) => {
    setConnecting(prev => ({ ...prev, [student.id]: true }))
    setTimeout(() => {
      setConnecting(prev => ({ ...prev, [student.id]: false }))
      toast({
        title: 'Connection request sent!',
        description: `Your request to ${student.name} has been sent.`,
        variant: 'success',
      })
    }, 1000)
  }

  const filters = [
    { key: 'all', label: 'All Students', icon: Users },
    { key: 'similar', label: 'Similar to You', icon: Target },
    { key: 'mentorship', label: 'Mentors (Seniors)', icon: GraduationCap },
    { key: 'collaboration', label: 'Collaborators', icon: Code },
    { key: 'cross-university', label: 'Cross-University', icon: Globe },
  ]

  const stats = [
    { label: 'Total Students', value: students.length, icon: Users },
    { label: 'Similar Interests', value: students.filter(s => s.interests.some(i => currentUser.interests.includes(i))).length, icon: Target },
    { label: 'Potential Mentors', value: students.filter(s => s.year > currentUser.year).length, icon: GraduationCap },
    { label: 'Cross-University', value: students.filter(s => s.university !== currentUser.university).length, icon: Globe },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Discover People</h1>
          <p className="text-gray-500 dark:text-gray-400">Find peers, mentors, and collaborators across universities</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Sparkles className="w-4 h-4" />}>
            AI Matching
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="card p-4 flex items-center gap-3"
          >
            <div className="p-2.5 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <SearchInput
          placeholder="Search by name, skill, interest, branch..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-2 flex-wrap">
          {filters.map(filter => (
            <button
              key={filter.key}
              onClick={() => setFilterType(filter.key)}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all
                ${filterType === filter.key
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}
              `}
            >
              <filter.icon className="w-4 h-4" />
              {filter.label}
            </button>
          ))}
        </div>
        <Dropdown
          trigger={
            <button className="btn-secondary flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Interest: {selectedInterest === 'all' ? 'All' : selectedInterest}
              <ChevronDown className="w-4 h-4" />
            </button>
          }
        >
          <DropdownMenu className="w-56">
            <DropdownItem onClick={() => setSelectedInterest('all')}>All Interests</DropdownItem>
            <DropdownItem onClick={() => setSelectedInterest('Web Development')}>Web Development</DropdownItem>
            <DropdownItem onClick={() => setSelectedInterest(' Machine Learning')}>Machine Learning</DropdownItem>
            {allInterests.map(interest => (
              <DropdownItem key={interest} onClick={() => setSelectedInterest(interest)}>{interest}</DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Showing <span className="font-medium text-gray-900 dark:text-gray-100">{filteredStudents.length}</span> students
        {filterType !== 'all' && (
          <span> · {filters.find(f => f.key === filterType)?.label}</span>
        )}
      </p>

      {/* Student grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredStudents.map((student, i) => {
          const uni = getUniversity(student.university)
          const isCurrentUser = student.id === currentUser.id
          const commonInterests = student.interests.filter(i => currentUser.interests.includes(i))
          const complementarySkills = student.skills.filter(s => !currentUser.skills.includes(s))

          return (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="card p-6 hover:shadow-card-hover group"
            >
              <div className="flex items-start gap-4">
                <div className="relative">
                  <Avatar name={student.name} size="xl" status="online" />
                  {student.verified && (
                    <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900" aria-label="Verified">
                      <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{student.name}</h3>
                    <Badge variant="gray" size="sm">{uni.short}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{student.branch}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Year {student.year} · Sem {student.semester}</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 line-clamp-2">{student.bio}</p>

              {/* Common interests */}
              {commonInterests.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <Target className="w-3 h-3" /> Shared interests
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {commonInterests.slice(0, 3).map(interest => (
                      <Badge key={interest} variant="primary" size="sm">{interest}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Complementary skills */}
              {complementarySkills.length > 0 && filterType === 'collaboration' && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">Can teach you</p>
                  <div className="flex flex-wrap gap-1.5">
                    {complementarySkills.slice(0, 3).map(skill => (
                      <Badge key={skill} variant="success" size="sm">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Looking for */}
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">Looking for</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">{student.lookingFor[0]}</p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  {student.rating}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {student.connections} connections
                </span>
                <span className="flex items-center gap-1">
                  <Code className="w-3.5 h-3.5" />
                  {student.projects} projects
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                {isCurrentUser ? (
                  <Button variant="secondary" size="sm" className="flex-1" disabled>This is you</Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    loading={connecting[student.id]}
                    leftIcon={<UserPlus className="w-4 h-4" />}
                    onClick={() => handleConnect(student)}
                  >
                    Connect
                  </Button>
                )}
                {!isCurrentUser && (
                  <Button variant="secondary" size="sm" leftIcon={<MessageCircle className="w-4 h-4" />}>
                    Message
                  </Button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No students found matching your filters.</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => { setSearchQuery(''); setFilterType('all'); setSelectedInterest('all') }}>
            Clear filters
          </Button>
        </div>
      )}
    </div>
  )
}

export default Students
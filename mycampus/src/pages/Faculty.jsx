import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search, GraduationCap, Mail, Phone, MapPin, Building, Award, BookOpen, ChevronDown, User, MessageCircle
} from 'lucide-react'
import { Card, CardContent, Badge, Avatar, Input, SearchInput, Dropdown, DropdownMenu, DropdownItem } from '../components/ui'
import { faculty, getUniversity, getFacultyByUniversity, getFacultyByDepartment, getFacultyByInterest } from '../data'

const Faculty = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterUniversity, setFilterUniversity] = useState('all')
  const [filterDepartment, setFilterDepartment] = useState('all')
  const [filterInterest, setFilterInterest] = useState('all')

  const universities = ['cvrp', 'kiit', 'iitbbs', 'soa', 'vit', 'nist']
  const departments = [...new Set(faculty.map(f => f.department))].sort()
  const interests = [...new Set(faculty.flatMap(f => f.researchInterests))].sort()

  const filteredFaculty = faculty.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.researchInterests.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesUniversity = filterUniversity === 'all' || f.university === filterUniversity
    const matchesDepartment = filterDepartment === 'all' || f.department === filterDepartment
    const matchesInterest = filterInterest === 'all' || f.researchInterests.includes(filterInterest)

    return matchesSearch && matchesUniversity && matchesDepartment && matchesInterest
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Faculty Directory</h1>
          <p className="text-gray-500 dark:text-gray-400">Find professors, researchers, and academic mentors</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <SearchInput
          placeholder="Search by name, department, research interest..."
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
              <GraduationCap className="w-4 h-4" />
              Department: {filterDepartment === 'all' ? 'All' : filterDepartment}
              <ChevronDown className="w-4 h-4" />
            </button>
          }
        >
          <DropdownMenu className="w-64">
            <DropdownItem onClick={() => setFilterDepartment('all')}>All Departments</DropdownItem>
            {departments.map(d => (
              <DropdownItem key={d} onClick={() => setFilterDepartment(d)}>{d}</DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
        <Dropdown
          trigger={
            <button className="btn-secondary flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Research: {filterInterest === 'all' ? 'All' : filterInterest}
              <ChevronDown className="w-4 h-4" />
            </button>
          }
        >
          <DropdownMenu className="w-64 max-h-60 overflow-y-auto">
            <DropdownItem onClick={() => setFilterInterest('all')}>All Interests</DropdownItem>
            {interests.map(i => (
              <DropdownItem key={i} onClick={() => setFilterInterest(i)}>{i}</DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Showing <span className="font-medium text-gray-900 dark:text-gray-100">{filteredFaculty.length}</span> faculty members
      </p>

      {/* Faculty Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFaculty.map((f, i) => {
          const uni = getUniversity(f.university)
          return (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="card p-6 hover:shadow-card-hover"
            >
              <div className="flex items-start gap-4">
                <Avatar name={f.name} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{f.name}</h3>
                    <Badge variant="primary" size="sm">{f.designation}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{f.department}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {uni.name}
                  </p>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{f.bio}</div>

              {/* Research Interests */}
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Research Interests
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {f.researchInterests.map(interest => (
                    <Badge key={interest} variant="purple" size="sm">{interest}</Badge>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {f.publications} papers
                </span>
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  {f.citations} citations
                </span>
              </div>

              {/* Contact Info */}
              <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <span className="truncate">{f.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <span>{f.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <span className="truncate">{f.office}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{f.availability}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <button className="btn-secondary flex-1 text-sm py-2 flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </button>
                <button className="btn-secondary flex-1 text-sm py-2 flex items-center justify-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Request Meeting
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>

      {filteredFaculty.length === 0 && (
        <div className="text-center py-12">
          <GraduationCap className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No faculty members found matching your filters.</p>
        </div>
      )}
    </div>
  )
}

export default Faculty
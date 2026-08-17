import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, Building, MapPin, Clock, Filter, ChevronDown,
  Star, Globe, Target, Search, Download, BookOpen, ThumbsUp, MessageCircle
} from 'lucide-react'
import { Card, CardContent, Badge, Avatar, Button, Input, SearchInput, Dropdown, DropdownMenu, DropdownItem } from '../components/ui'
import { notes, getFeaturedNotes, getCrossUniversityNotes, getNotesBySubject, getSubject, getSubjectsByBranch, subjects, getUniversity } from '../data'
import { formatDate } from '../utils/format'

const Notes = () => {
  const [filterType, setFilterType] = useState('all')
  const [filterUniversity, setFilterUniversity] = useState('all')
  const [filterBranch, setFilterBranch] = useState('all')
  const [filterSubject, setFilterSubject] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const universities = ['cvrp', 'kiit', 'iitbbs', 'soa', 'vit', 'nist']
  const branches = [...new Set(notes.map(n => n.branch))].sort()

  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesType = filterType === 'all' || n.visibility === filterType
    const matchesUniversity = filterUniversity === 'all' || n.university === filterUniversity
    const matchesBranch = filterBranch === 'all' || n.branch === filterBranch
    const matchesSubject = filterSubject === 'all' || n.subject === filterSubject

    return matchesSearch && matchesType && matchesUniversity && matchesBranch && matchesSubject
  })

  const featuredNotes = getFeaturedNotes()
  const crossUniNotes = getCrossUniversityNotes()

  const typeFilters = [
    { key: 'all', label: 'All', icon: FileText, count: notes.length },
    { key: 'featured', label: 'Featured', icon: Star, count: featuredNotes.length },
    { key: 'cross-university', label: 'Cross-University', icon: Globe, count: crossUniNotes.length },
    { key: 'campus', label: 'Campus Only', icon: Building, count: notes.filter(n => n.visibility === 'campus').length },
  ]

  const handleDownload = (note) => {
    alert(`Downloading: ${note.title}\n(${note.fileSize}, ${note.pages} pages)`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Study Notes</h1>
          <p className="text-gray-500 dark:text-gray-400">Shared, organized study materials by subject and branch</p>
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
          placeholder="Search by title, subject, tags..."
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
              Branch: {filterBranch === 'all' ? 'All' : filterBranch}
              <ChevronDown className="w-4 h-4" />
            </button>
          }
        >
          <DropdownMenu className="w-56">
            <DropdownItem onClick={() => setFilterBranch('all')}>All Branches</DropdownItem>
            {branches.map(b => (
              <DropdownItem key={b} onClick={() => setFilterBranch(b)}>{b}</DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Showing <span className="font-medium text-gray-900 dark:text-gray-100">{filteredNotes.length}</span> notes
      </p>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.map((note, i) => {
          const uni = getUniversity(note.university)
          const subject = getSubject(note.subject)

          return (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="card p-5 hover:shadow-card-hover group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  {note.verified && (
                    <Badge variant="success" size="sm" className="mb-2" dot>Verified</Badge>
                  )}
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{note.title}</h3>
                </div>
                {note.featured && (
                  <Badge variant="primary" size="sm">Featured</Badge>
                )}
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{note.description}</p>

              {/* Meta */}
              <div className="space-y-1.5 text-sm text-gray-500 dark:text-gray-400 mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{note.subject}{subject && ` - ${subject.name}`}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>{note.branch} · Sem {note.semester}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>Uploaded {formatDate(note.uploadDate)} by {note.uploadedBy}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="mb-4 flex flex-wrap gap-1.5">
                {note.tags.slice(0, 4).map(tag => (
                  <Badge key={tag} variant="gray" size="sm">{tag}</Badge>
                ))}
                {note.tags.length > 4 && (
                  <Badge variant="gray" size="sm">+{note.tags.length - 4}</Badge>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700 mb-3">
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" />
                    {note.downloads}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {note.rating}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" />
                    {note.reviews}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="gray" size="sm">{note.fileType.toUpperCase()}</Badge>
                  <Badge variant="gray" size="sm">{note.fileSize}</Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="primary" size="sm" className="flex-1" leftIcon={<Download className="w-4 h-4" />} onClick={() => handleDownload(note)}>
                  Download
                </Button>
                <Button variant="secondary" size="sm" leftIcon={<ThumbsUp className="w-4 h-4" />}>
                  {note.rating}
                </Button>
              </div>
            </motion.div>
          )
        })}
      </div>

      {filteredNotes.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No notes found matching your filters.</p>
        </div>
      )}

      {/* Subject Browser */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card p-6"
      >
        <h2 className="section-title mb-4">Browse by Subject</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {subjects.slice(0, 12).map(sub => (
            <button
              key={sub.code}
              className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-left"
            >
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{sub.code}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{sub.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub.branch} · Sem {sub.semester}</p>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default Notes
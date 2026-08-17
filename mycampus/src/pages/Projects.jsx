import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FolderKanban, Building, MapPin, Clock, Filter, ChevronDown,
  Star, Globe, Target, Search, Github, ExternalLink, Users, Code, Rocket
} from 'lucide-react'
import { Card, CardContent, Badge, Avatar, Button, Input, SearchInput, Dropdown, DropdownMenu, DropdownItem } from '../components/ui'
import { projects, getCrossUniversityProjects, getFeaturedProjects, getUniversity } from '../data'
import { formatDate, getRelativeDate } from '../utils/format'

const Projects = () => {
  const [filterType, setFilterType] = useState('all')
  const [filterUniversity, setFilterUniversity] = useState('all')
  const [filterStage, setFilterStage] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const universities = ['cvrp', 'kiit', 'iitbbs', 'soa', 'vit', 'nist']
  const stages = ['idea', 'prototype', 'alpha', 'beta', 'pilot', 'live']

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesType = filterType === 'all' || p.visibility === filterType
    const matchesUniversity = filterUniversity === 'all' || p.university === filterUniversity
    const matchesStage = filterStage === 'all' || p.stage === filterStage

    return matchesSearch && matchesType && matchesUniversity && matchesStage
  })

  const crossUniProjects = getCrossUniversityProjects()
  const featuredProjects = getFeaturedProjects()

  const typeFilters = [
    { key: 'all', label: 'All', icon: FolderKanban, count: projects.length },
    { key: 'featured', label: 'Featured', icon: Star, count: featuredProjects.length },
    { key: 'cross-university', label: 'Cross-University', icon: Globe, count: crossUniProjects.length },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Student Projects</h1>
          <p className="text-gray-500 dark:text-gray-400">Discover and collaborate on projects across universities</p>
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
          placeholder="Search by title, skills, description..."
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
              Stage: {filterStage === 'all' ? 'All' : filterStage}
              <ChevronDown className="w-4 h-4" />
            </button>
          }
        >
          <DropdownMenu className="w-48">
            <DropdownItem onClick={() => setFilterStage('all')}>All Stages</DropdownItem>
            {stages.map(s => (
              <DropdownItem key={s} onClick={() => setFilterStage(s)}>{s.charAt(0).toUpperCase() + s.slice(1)}</DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Showing <span className="font-medium text-gray-900 dark:text-gray-100">{filteredProjects.length}</span> projects
      </p>

      {/* Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((project, i) => {
          const uni = getUniversity(project.university)
          const stageColors = {
            idea: 'gray',
            prototype: 'purple',
            alpha: 'info',
            beta: 'primary',
            pilot: 'warning',
            live: 'success',
          }

          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="card p-5 hover:shadow-card-hover group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{project.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{project.category}</p>
                </div>
                <Badge variant={stageColors[project.stage] || 'gray'} size="sm">
                  {project.stage.charAt(0).toUpperCase() + project.stage.slice(1)}
                </Badge>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{project.description}</p>

              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                <Avatar size="xs" name={project.team[0]} />
                <span>{project.team.join(', ')}</span>
                <span>·</span>
                <span>{uni.short}</span>
              </div>

              {/* Skills */}
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">Tech Stack</p>
                <div className="flex flex-wrap gap-1.5">
                  {project.skills.slice(0, 5).map(skill => (
                    <Badge key={skill} variant="gray" size="sm">{skill}</Badge>
                  ))}
                  {project.skills.length > 5 && (
                    <Badge variant="gray" size="sm">+{project.skills.length - 5}</Badge>
                  )}
                </div>
              </div>

              {/* Looking for */}
              {project.lookingFor.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <Target className="w-3 h-3" /> Looking For
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.lookingFor.map(role => (
                      <Badge key={role} variant="success" size="sm">{role}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Links & Stats */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700 mb-3">
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {project.members}/{project.maxMembers}
                  </span>
                  <span className="flex items-center gap-1">
                    <Code className="w-3.5 h-3.5" />
                    {project.skills.length} skills
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {project.github && (
                    <a href={project.github} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                  {project.demo && (
                    <a href={project.demo} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="primary" size="sm" className="flex-1" leftIcon={<Users className="w-4 h-4" />}>
                  Join Team
                </Button>
                <Button variant="secondary" size="sm" leftIcon={<Code className="w-4 h-4" />}>
                  View Code
                </Button>
              </div>
            </motion.div>
          )
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <FolderKanban className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No projects found matching your filters.</p>
        </div>
      )}
    </div>
  )
}

export default Projects
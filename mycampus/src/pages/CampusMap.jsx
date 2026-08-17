import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, MapPin, Building, Navigation, Layers, Maximize, Minimize,
  Home, Wifi, Coffee, BookOpen, Dumbbell, HeartPulse, Car, DoorOpen
} from 'lucide-react'
import { campusBuildings, campusPaths, campusLandmarks, getBuilding, getBuildingsByDepartment } from '../data/campusMap'
import { Card, CardContent, CardHeader, CardTitle, Badge, Avatar, Input } from '../components/ui'
import { currentUser } from '../data'

const buildingIcons = {
  'block-a': Building,
  'block-b': Wifi,
  'block-c': Dumbbell,
  'block-d': BookOpen,
  'admin': Building,
  'library': BookOpen,
  'auditorium': Home,
  'canteen': Coffee,
  'hostel-b': Home,
  'hostel-g': Home,
  'sports': Dumbbell,
  'health': HeartPulse,
  'parking-1': Car,
  'parking-2': Car,
}

const landmarkIcons = {
  'main-gate': DoorOpen,
  'side-gate': DoorOpen,
  'fountain': Coffee,
  'statue': Home,
  'bus-stop': Car,
  'atm': Car,
  'photocopy': BookOpen,
}

const CampusMap = () => {
  const [selectedBuilding, setSelectedBuilding] = useState(null)
  const [hoveredBuilding, setHoveredBuilding] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const mapRef = useRef(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0 })

  const filteredBuildings = campusBuildings.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.departments.some(d => d.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesFilter = filter === 'all' || b.departments.some(d => d.toLowerCase().includes(filter.toLowerCase()))
    return matchesSearch && matchesFilter
  })

  const departments = [...new Set(campusBuildings.flatMap(b => b.departments))]

  const handleWheel = (e) => {
    e.preventDefault()
    setZoom(prev => Math.max(0.5, Math.min(3, prev - e.deltaY * 0.001)))
  }

  const handleMouseDown = (e) => {
    if (e.target === mapRef.current || e.target.classList.contains('map-canvas')) {
      setIsPanning(true)
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
    }
  }

  useEffect(() => {
    window.addEventListener('mousemove', (e) => {
      if (isPanning) {
        setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y })
      }
    })
    window.addEventListener('mouseup', () => setIsPanning(false))
  }, [isPanning])

  const BuildingComponent = ({ building }) => {
    const isSelected = selectedBuilding?.id === building.id
    const isHovered = hoveredBuilding?.id === building.id
    const Icon = buildingIcons[building.id] || Building

    return (
      <motion.g
        onClick={() => setSelectedBuilding(building)}
        onMouseEnter={() => setHoveredBuilding(building)}
        onMouseLeave={() => setHoveredBuilding(null)}
        className="cursor-pointer"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.rect
          x={building.x}
          y={building.y}
          width={building.width}
          height={building.height}
          rx={8}
          ry={8}
          fill={building.color}
          opacity={isSelected || isHovered ? 0.9 : 0.7}
          stroke={isSelected ? '#0c85e8' : 'transparent'}
          strokeWidth={isSelected ? 3 : 0}
          filter="drop-shadow(0 4px 8px rgba(0,0,0,0.15))"
          transition={{ duration: 0.2 }}
        />
        <text
          x={building.x + building.width / 2}
          y={building.y + building.height / 2 - 5}
          textAnchor="middle"
          fill="white"
          fontSize="11"
          fontWeight="600"
          fontFamily="Inter, system-ui"
        >
          {building.shortName}
        </text>
        <text
          x={building.x + building.width / 2}
          y={building.y + building.height / 2 + 10}
          textAnchor="middle"
          fill="white"
          fontSize="9"
          opacity="0.9"
          fontFamily="Inter, system-ui"
        >
          {building.floors.join('·')}
        </text>
      </motion.g>
    )
  }

  const PathComponent = ({ path }) => {
    const from = campusBuildings.find(b => b.id === path.from)
    const to = campusBuildings.find(b => b.id === path.to)
    if (!from || !to) return null

    const fromCenter = { x: from.x + from.width / 2, y: from.y + from.height / 2 }
    const toCenter = { x: to.x + to.width / 2, y: to.y + to.height / 2 }

    return (
      <path
        d={`M${fromCenter.x} ${fromCenter.y} L${toCenter.x} ${toCenter.y}`}
        stroke="#cbd5e1"
        strokeWidth={3}
        strokeDasharray="8,6"
        opacity={0.6}
      />
    )
  }

  const LandmarkComponent = ({ landmark }) => {
    const Icon = landmarkIcons[landmark.id] || MapPin

    return (
      <g onClick={() => setSelectedBuilding({ ...landmark, type: 'landmark' })}>
        <circle
          cx={landmark.x}
          cy={landmark.y}
          r={12}
          fill="white"
          stroke="#e2e8f0"
          strokeWidth={2}
          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
        />
        <text x={landmark.x} y={landmark.y + 4} textAnchor="middle" fontSize="16">{landmark.icon}</text>
      </g>
    )
  }

  const handleZoomIn = () => setZoom(prev => Math.min(3, prev + 0.2))
  const handleZoomOut = () => setZoom(prev => Math.max(0.5, prev - 0.2))
  const handleResetView = () => { setZoom(1); setPan({ x: 0, y: 0 }) }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interactive Campus Map</h1>
          <p className="text-gray-500">Click buildings to explore departments, facilities & navigate campus</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Input
            placeholder="Search buildings, departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="w-full sm:w-64"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Buildings</option>
            {departments.map(d => (
              <option key={d} value={d.toLowerCase()}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Map + Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Canvas */}
        <div className="flex-1 relative bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden map-canvas" ref={mapRef} onWheel={handleWheel} onMouseDown={handleMouseDown}>
          <svg
            viewBox="0 0 640 560"
            className="w-full h-full"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              transition: 'transform 0.1s ease-out'
            }}
          >
            <defs>
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000" floodOpacity="0.1" />
              </filter>
            </defs>

            {/* Background grid */}
            <g stroke="#e2e8f0" strokeWidth="0.5">
              {[...Array(13)].map((_, i) => (
                <line key={i} x1={i * 50} y1="0" x2={i * 50} y2="560" />
              ))}
              {[...Array(12)].map((_, i) => (
                <line key={i} x1="0" y1={i * 50} x2="640" y2={i * 50} />
              ))}
            </g>

            {/* Paths */}
            <g>
              {campusPaths.map(p => <PathComponent key={p.id} path={p} />)}
            </g>

            {/* Buildings */}
            <g filter="url(#shadow)">
              {campusBuildings.map(b => <BuildingComponent key={b.id} building={b} />)}
            </g>

            {/* Landmarks */}
            <g>
              {campusLandmarks.map(l => <LandmarkComponent key={l.id} landmark={l} />)}
            </g>
          </svg>

          {/* Zoom controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <button onClick={handleZoomIn} className="p-2 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-50 transition-colors" aria-label="Zoom in">
              <Maximize className="w-5 h-5" />
            </button>
            <button onClick={handleZoomOut} className="p-2 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-50 transition-colors" aria-label="Zoom out">
              <Minimize className="w-5 h-5" />
            </button>
            <button onClick={handleResetView} className="p-2 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-50 transition-colors" aria-label="Reset view">
              <Home className="w-5 h-5" />
            </button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-100 p-3 shadow-lg min-w-[180px]">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Buildings</p>
            <div className="space-y-1.5">
              {campusBuildings.slice(0, 8).map(b => (
                <div key={b.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: b.color }} />
                  <span>{b.shortName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Panel */}
        <AnimatePresence mode="wait">
          {selectedBuilding && (
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.2 }}
              className="w-80 bg-white border-l border-gray-100 p-4 overflow-y-auto flex-shrink-0"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-gray-900">{selectedBuilding.name}</h2>
                  {selectedBuilding.type === 'landmark' && (
                    <Badge variant="gray" size="sm" className="mt-1">Landmark</Badge>
                  )}
                </div>
                <button
                  onClick={() => setSelectedBuilding(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <Maximize className="w-4 h-4" />
                </button>
              </div>

              {selectedBuilding.departments && selectedBuilding.departments.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Departments</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedBuilding.departments.map(d => (
                      <Badge key={d} variant="primary" size="sm">{d}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedBuilding.facilities && selectedBuilding.facilities.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Facilities</p>
                  <ul className="space-y-1">
                    {selectedBuilding.facilities.map(f => (
                      <li key={f} className="text-sm text-gray-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedBuilding.floors && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Floors</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedBuilding.floors.map(f => (
                      <Badge key={f} variant="gray" size="sm">{f}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 flex gap-2">
                <button className="btn-primary flex-1 text-sm py-2">
                  <Navigation className="w-4 h-4 mr-1" />
                  Navigate
                </button>
                <button className="btn-secondary flex-1 text-sm py-2">
                  <Layers className="w-4 h-4 mr-1" />
                  Details
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state sidebar */}
        <AnimatePresence mode="wait">
          {!selectedBuilding && (
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className="w-80 bg-white border-l border-gray-100 p-4 overflow-y-auto flex-shrink-0"
            >
              <div className="text-center py-8 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium text-gray-700">Click a building</p>
                <p className="text-sm mt-1">Select any building to see departments, facilities, and navigation options</p>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Quick Links</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Library', icon: BookOpen },
                    { label: 'Canteen', icon: Coffee },
                    { label: 'Sports', icon: Dumbbell },
                    { label: 'Health Center', icon: HeartPulse },
                    { label: 'Auditorium', icon: Home },
                    { label: 'Admin Block', icon: Building },
                  ].map(item => (
                    <button
                      key={item.label}
                      onClick={() => {
                        const b = campusBuildings.find(b => b.shortName.toLowerCase().includes(item.label.toLowerCase().split(' ')[0]))
                        if (b) setSelectedBuilding(b)
                      }}
                      className="p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-left"
                    >
                      <item.icon className="w-5 h-5 text-gray-400 mb-1" />
                      <p className="text-sm font-medium text-gray-700">{item.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default CampusMap
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus, Edit, Trash2, Eye, Pin, Archive, Search, Filter, ChevronDown,
  Calendar, Users, AlertTriangle, CheckCircle, XCircle, Clock
} from 'lucide-react'
import { currentUser, getAdminNotices, getAdminEvents, getAdminUniversity } from '../../data'
import { getEvent } from '../../data/events'
import { formatDate, getRelativeDate } from '../../utils/format'
import { AdminTable, createColumn } from '../../components/admin/AdminTable'
import { AdminTabs, TabPanel } from '../../components/admin/AdminTabs'
import { AdminBadge, AdminStatusDot } from '../../components/admin/AdminBadge'
import { AdminModal, AdminInput, AdminTextarea, AdminSelect, AdminButton } from '../../components/admin/AdminForm'

const NoticesEventsPage = () => {
  const university = getAdminUniversity(currentUser.university)
  const notices = getAdminNotices(currentUser.university)
  const events = getAdminEvents(currentUser.university)

  // Notices state
  const [noticesFilter, setNoticesFilter] = useState('all') // all, published, draft, archived
  const [noticesSearch, setNoticesSearch] = useState('')
  const [noticesModalOpen, setNoticesModalOpen] = useState(false)
  const [editingNotice, setEditingNotice] = useState(null)
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    body: '',
    category: 'general',
    priority: 'normal',
    targetAudience: 'all',
    branches: [],
    pinned: false,
    expiresAt: '',
  })

  // Events state
  const [eventsFilter, setEventsFilter] = useState('all')
  const [eventsSearch, setEventsSearch] = useState('')

  // Filtered data
  const filteredNotices = notices
    .filter(n => {
      if (noticesFilter !== 'all' && n.status !== noticesFilter) return false
      if (noticesSearch && !n.title.toLowerCase().includes(noticesSearch.toLowerCase()) &&
          !n.body.toLowerCase().includes(noticesSearch.toLowerCase())) return false
      return true
    })
    .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))

  const filteredEvents = events
    .filter(e => {
      if (eventsFilter !== 'all' && e.approvalStatus !== eventsFilter) return false
      if (eventsSearch && !e.title.toLowerCase().includes(eventsSearch.toLowerCase())) return false
      return true
    })
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))

  // Notice columns
  const noticeColumns = [
    createColumn({ key: 'title', header: 'Title', width: '35%', render: (val, row) => (
      <div>
        <p className="font-medium text-gray-900 truncate max-w-xs">{row.title}</p>
        <p className="text-xs text-gray-500 truncate max-w-xs">{row.body.slice(0, 80)}...</p>
      </div>
    )}),
    createColumn({ key: 'category', header: 'Category', render: (val) => <AdminBadge status={val} size="xs" /> }),
    createColumn({ key: 'priority', header: 'Priority', render: (val) => <AdminBadge status={val} size="xs" /> }),
    createColumn({ key: 'status', header: 'Status', render: (val) => <AdminBadge status={val} size="xs" /> }),
    createColumn({ key: 'publishedAt', header: 'Published', render: (val) => val ? formatDate(val) : '—' }),
    createColumn({ key: 'actions', header: 'Actions', width: '150px', render: (_, row) => (
      <div className="flex items-center gap-2">
        <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors" title="View" aria-label="View notice">
          <Eye className="w-4 h-4" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); handleEditNotice(row); }} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors" title="Edit" aria-label="Edit notice">
          <Edit className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete" aria-label="Delete notice">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )}),
  ]

  // Event columns
  const eventColumns = [
    createColumn({ key: 'title', header: 'Event', width: '30%', render: (val, row) => (
      <div>
        <p className="font-medium text-gray-900 truncate max-w-xs">{row.title}</p>
        <p className="text-xs text-gray-500 truncate max-w-xs">{row.organizer}</p>
      </div>
    )}),
    createColumn({ key: 'type', header: 'Type', render: (val) => <AdminBadge status={val} size="xs" /> }),
    createColumn({ key: 'visibility', header: 'Visibility', render: (val) => <span className="text-sm text-gray-600 capitalize">{val}</span> }),
    createColumn({ key: 'approvalStatus', header: 'Status', render: (val) => <AdminBadge status={val} size="xs" /> }),
    createColumn({ key: 'startDate', header: 'Date', render: (val) => formatDate(val) }),
    createColumn({ key: 'actions', header: 'Actions', width: '150px', render: (_, row) => (
      <div className="flex items-center gap-2">
        <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors" title="View" aria-label="View event">
          <Eye className="w-4 h-4" />
        </button>
        {row.approvalStatus === 'pending' && (
          <>
            <button className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors" title="Approve" aria-label="Approve event">
              <CheckCircle className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Reject" aria-label="Reject event">
              <XCircle className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    )}),
  ]

  const handleEditNotice = (notice) => {
    setEditingNotice(notice)
    setNoticeForm({
      title: notice.title,
      body: notice.body,
      category: notice.category,
      priority: notice.priority,
      targetAudience: notice.targetAudience,
      branches: notice.branches || [],
      pinned: notice.pinned || false,
      expiresAt: notice.expiresAt ? notice.expiresAt.split('T')[0] : '',
    })
    setNoticesModalOpen(true)
  }

  const handleNewNotice = () => {
    setEditingNotice(null)
    setNoticeForm({
      title: '',
      body: '',
      category: 'general',
      priority: 'normal',
      targetAudience: 'all',
      branches: [],
      pinned: false,
      expiresAt: '',
    })
    setNoticesModalOpen(true)
  }

  const handleSaveNotice = () => {
    // In real app, this would call an API
    console.log('Save notice:', { ...noticeForm, id: editingNotice?.id || `not-${Date.now()}` })
    setNoticesModalOpen(false)
    setEditingNotice(null)
  }

  const tabs = [
    { id: 'notices', label: 'Notices', icon: FileText, badge: notices.length },
    { id: 'events', label: 'Events', icon: Calendar, badge: events.length },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notices & Events</h1>
          <p className="text-gray-500 mt-1">Manage campus announcements and event approvals</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleNewNotice} className="px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Notice
          </button>
        </div>
      </div>

      {/* Tabs */}
      <AdminTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Notices Tab */}
      <TabPanel id="notices" activeTab={activeTab}>
        <div className="space-y-4">
        {/* Filter/Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search notices..."
              value={noticesSearch}
              onChange={(e) => setNoticesSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
            />
          </div>
          <AdminSelect
            value={noticesFilter}
            onChange={(e) => setNoticesFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'published', label: 'Published' },
              { value: 'draft', label: 'Draft' },
              { value: 'archived', label: 'Archived' },
            ]}
            className="w-full sm:w-48"
          />
        </div>

        {/* Notices Table */}
        <AdminTable
          columns={noticeColumns}
          data={filteredNotices}
          keyField="id"
          emptyMessage="No notices found"
        />

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-gray-50">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{notices.length}</p>
          </div>
          <div className="p-4 bg-gray-50">
            <p className="text-sm text-gray-500">Published</p>
            <p className="text-2xl font-bold text-green-600">{notices.filter(n => n.status === 'published').length}</p>
          </div>
          <div className="p-4 bg-gray-50">
            <p className="text-sm text-gray-500">Drafts</p>
            <p className="text-2xl font-bold text-gray-500">{notices.filter(n => n.status === 'draft').length}</p>
          </div>
          <div className="p-4 bg-gray-50">
            <p className="text-sm text-gray-500">Pinned</p>
            <p className="text-2xl font-bold text-gray-900">{notices.filter(n => n.pinned).length}</p>
          </div>
        </div>
      </div>
    </TabPanel>

    {/* Events Tab */}
    <TabPanel id="events" activeTab={activeTab}>
      <div className="space-y-4">
        {/* Filter/Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search events..."
              value={eventsSearch}
              onChange={(e) => setEventsSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
            />
          </div>
          <AdminSelect
            value={eventsFilter}
            onChange={(e) => setEventsFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
            className="w-full sm:w-48"
          />
        </div>

        {/* Events Table */}
        <AdminTable
          columns={eventColumns}
          data={filteredEvents}
          keyField="id"
          emptyMessage="No events found"
        />

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-gray-50">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{events.length}</p>
          </div>
          <div className="p-4 bg-gray-50">
            <p className="text-sm text-gray-500">Approved</p>
            <p className="text-2xl font-bold text-green-600">{events.filter(e => e.approvalStatus === 'approved').length}</p>
          </div>
          <div className="p-4 bg-gray-50">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{events.filter(e => e.approvalStatus === 'pending').length}</p>
          </div>
          <div className="p-4 bg-gray-50">
            <p className="text-sm text-gray-500">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{events.filter(e => e.approvalStatus === 'rejected').length}</p>
          </div>
        </div>
      </div>
    </TabPanel>

      {/* Notice Modal */}
      <AdminModal
        isOpen={noticesModalOpen}
        onClose={() => setNoticesModalOpen(false)}
        title={editingNotice ? 'Edit Notice' : 'Create Notice'}
        size="lg"
      >
        <div className="space-y-6">
          <AdminInput
            label="Title"
            required
            value={noticeForm.title}
            onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
            placeholder="Enter notice title"
          />

          <AdminTextarea
            label="Content"
            required
            value={noticeForm.body}
            onChange={(e) => setNoticeForm({ ...noticeForm, body: e.target.value })}
            placeholder="Enter notice content (markdown supported)"
            rows={6}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AdminSelect
              label="Category"
              value={noticeForm.category}
              onChange={(e) => setNoticeForm({ ...noticeForm, category: e.target.value })}
              options={[
                { value: 'academic', label: 'Academic' },
                { value: 'general', label: 'General' },
                { value: 'safety', label: 'Safety' },
                { value: 'placement', label: 'Placement' },
              ]}
            />

            <AdminSelect
              label="Priority"
              value={noticeForm.priority}
              onChange={(e) => setNoticeForm({ ...noticeForm, priority: e.target.value })}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'normal', label: 'Normal' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
              ]}
            />
          </div>

          <AdminSelect
            label="Target Audience"
            value={noticeForm.targetAudience}
            onChange={(e) => setNoticeForm({ ...noticeForm, targetAudience: e.target.value })}
            options={[
              { value: 'all', label: 'All Users' },
              { value: 'students', label: 'Students Only' },
              { value: 'faculty', label: 'Faculty Only' },
            ]}
          />

          <AdminInput
            type="date"
            label="Expires At (optional)"
            value={noticeForm.expiresAt}
            onChange={(e) => setNoticeForm({ ...noticeForm, expiresAt: e.target.value })}
          />

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={noticeForm.pinned}
                onChange={(e) => setNoticeForm({ ...noticeForm, pinned: e.target.checked })}
                className="w-4 h-4 border-gray-300 rounded focus:ring-gray-900"
              />
              <span className="text-sm text-gray-700">Pin to top of notice board</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <AdminButton variant="secondary" onClick={() => setNoticesModalOpen(false)}>Cancel</AdminButton>
            <AdminButton onClick={handleSaveNotice}>{editingNotice ? 'Update' : 'Create'}</AdminButton>
          </div>
        </div>
      </AdminModal>
    </div>
  )
}

export default NoticesEventsPage
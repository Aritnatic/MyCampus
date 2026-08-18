import React, { useState } from 'react'
import { AdminTabs, TabPanel } from '../../components/admin/AdminTabs'
import { AdminTable, createColumn } from '../../components/admin/AdminTable'
import { AdminBadge, AdminStatusDot } from '../../components/admin/AdminBadge'
import { AdminModal, AdminInput, AdminTextarea, AdminSelect, AdminButton, FormRow, AdminConfirmDialog, FormSection } from '../../components/admin/AdminForm'
import { formatDate, formatNumber, truncate, statusClasses, getRelativeDate } from '../../utils/format'
import {
  getNoticesByUniversity,
  getPublishedNotices,
  getNoticesByStatus,
  notices,
} from '../../data/notices'
import {
  getEventsByUniversity,
  getEventsByApprovalStatus,
  events,
} from '../../data/events'
import { currentAdmin } from '../../data/admin'
import {
  FileText,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  ChevronRight,
  Download,
  Filter,
  Search,
} from 'lucide-react'

const noticeStatusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
]

const noticeCategoryOptions = [
  { value: 'academic', label: 'Academic' },
  { value: 'general', label: 'General' },
  { value: 'safety', label: 'Safety' },
  { value: 'placement', label: 'Placement' },
]

const eventStatusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending Review' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'published', label: 'Published' },
  { value: 'cancelled', label: 'Cancelled' },
]

const eventCategoryOptions = [
  { value: 'technical', label: 'Technical' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'sports', label: 'Sports' },
  { value: 'academic', label: 'Academic' },
  { value: 'social', label: 'Social' },
  { value: 'alumni', label: 'Alumni' },
  { value: 'entrepreneurship', label: 'Entrepreneurship' },
]

const initialNoticeForm = {
  title: '',
  body: '',
  category: 'academic',
  status: 'draft',
  priority: 'normal',
  targetAudience: 'students',
  branches: [],
  pinned: false,
  expiresAt: '',
}

const initialEventForm = {
  title: '',
  description: '',
  category: 'technical',
  type: 'fest',
  status: 'draft',
  approvalStatus: 'draft',
  startDate: '',
  endDate: '',
  venue: '',
  organizer: '',
  organizerContact: '',
  expectedAttendees: '',
  budget: '',
  tags: [],
}

export default function NoticesEventsPage({ defaultTab = 'notices' }) {
  const uniId = currentAdmin.university
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [noticesData] = useState(getNoticesByUniversity(uniId))
  const [eventsData] = useState(getEventsByUniversity(uniId))
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [noticeModalOpen, setNoticeModalOpen] = useState(false)
  const [eventModalOpen, setEventModalOpen] = useState(false)
  const [editingNotice, setEditingNotice] = useState(null)
  const [editingEvent, setEditingEvent] = useState(null)
  const [noticeForm, setNoticeForm] = useState(initialNoticeForm)
  const [eventForm, setEventForm] = useState(initialEventForm)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: null, id: null })

  // Filter functions
  const filteredNotices = noticesData.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.body.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || n.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredEvents = eventsData.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || e.approvalStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  // Notice columns
  const noticeColumns = [
    createColumn({ key: 'title', header: 'Title', width: '35%', render: (val, row) => (
      <div>
        <p className="font-medium text-admin-900">{truncate(val, 50)}</p>
        <p className="text-sm text-admin-500 mt-0.5">{truncate(row.body, 80)}</p>
      </div>
    )}),
    createColumn({ key: 'category', header: 'Category', width: '120px', render: (val) => (
      <AdminBadge status={val} size="sm" variant="outline" />
    )}),
    createColumn({ key: 'status', header: 'Status', width: '130px', render: (val) => (
      <AdminBadge status={val} size="sm" />
    )}),
    createColumn({ key: 'priority', header: 'Priority', width: '100px', render: (val) => (
      <AdminBadge status={val} size="sm" variant="dot" />
    )}),
    createColumn({ key: 'publishedAt', header: 'Published', width: '140px', render: (val) => (
      <span className="text-sm text-admin-600">{val ? formatDate(val) : '—'}</span>
    )}),
    createColumn({ key: 'expiresAt', header: 'Expires', width: '140px', render: (val) => (
      <span className="text-sm text-admin-600">{val ? formatDate(val) : '—'}</span>
    )}),
  ]

  // Event columns
  const eventColumns = [
    createColumn({ key: 'title', header: 'Event', width: '30%', render: (val, row) => (
      <div>
        <p className="font-medium text-admin-900">{truncate(val, 50)}</p>
        <p className="text-sm text-admin-500 mt-0.5 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDate(row.startDate)} - {formatDate(row.endDate)}
        </p>
      </div>
    )}),
    createColumn({ key: 'category', header: 'Category', width: '120px', render: (val) => (
      <AdminBadge status={val} size="sm" variant="outline" />
    )}),
    createColumn({ key: 'type', header: 'Type', width: '100px', render: (val) => (
      <span className="text-sm text-admin-600 capitalize">{val.replace('_', ' ')}</span>
    )}),
    createColumn({ key: 'approvalStatus', header: 'Approval', width: '140px', render: (val) => (
      <AdminBadge status={val} size="sm" />
    )}),
    createColumn({ key: 'expectedAttendees', header: 'Expected', width: '100px', render: (val) => (
      <span className="text-sm text-admin-600">{formatNumber(val)}</span>
    )}),
    createColumn({ key: 'registeredAttendees', header: 'Registered', width: '100px', render: (val) => (
      <span className="text-sm text-primary-600">{formatNumber(val)}</span>
    )}),
  ]

  // Handlers
  const openCreateNotice = () => {
    setEditingNotice(null)
    setNoticeForm(initialNoticeForm)
    setNoticeModalOpen(true)
  }

  const openEditNotice = (notice) => {
    setEditingNotice(notice)
    setNoticeForm({
      title: notice.title,
      body: notice.body,
      category: notice.category,
      status: notice.status,
      priority: notice.priority,
      targetAudience: notice.targetAudience,
      branches: notice.branches || [],
      pinned: notice.pinned || false,
      expiresAt: notice.expiresAt ? notice.expiresAt.split('T')[0] : '',
    })
    setNoticeModalOpen(true)
  }

  const handleNoticeSubmit = (e) => {
    e.preventDefault()
    // In real app, would call API
    console.log('Save notice:', noticeForm)
    setNoticeModalOpen(false)
  }

  const openCreateEvent = () => {
    setEditingEvent(null)
    setEventForm(initialEventForm)
    setEventModalOpen(true)
  }

  const openEditEvent = (event) => {
    setEditingEvent(event)
    setEventForm({
      title: event.title,
      description: event.description,
      category: event.category,
      type: event.type,
      status: event.status,
      approvalStatus: event.approvalStatus,
      startDate: event.startDate ? event.startDate.split('T')[0] : '',
      endDate: event.endDate ? event.endDate.split('T')[0] : '',
      venue: event.venue,
      organizer: event.organizer,
      organizerContact: event.organizerContact,
      expectedAttendees: event.expectedAttendees,
      budget: event.budget,
      tags: event.tags || [],
    })
    setEventModalOpen(true)
  }

  const handleEventSubmit = (e) => {
    e.preventDefault()
    console.log('Save event:', eventForm)
    setEventModalOpen(false)
  }

  const confirmDelete = (type, id) => {
    setDeleteConfirm({ open: true, type, id })
  }

  const handleDeleteConfirm = () => {
    console.log('Delete:', deleteConfirm.type, deleteConfirm.id)
    setDeleteConfirm({ open: false, type: null, id: null })
  }

  const tabs = [
    { id: 'notices', label: 'Notices', badge: filteredNotices.length, badgeColor: 'info' },
    { id: 'events', label: 'Events', badge: filteredEvents.length, badgeColor: 'warning' },
  ]

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Notices & Events</h1>
          <p className="admin-page-subtitle">Manage campus announcements and event approvals for {uniId.toUpperCase()}</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'notices' && (
            <AdminButton variant="primary" onClick={openCreateNotice}>
              <Plus className="w-4 h-4" />
              Create Notice
            </AdminButton>
          )}
          {activeTab === 'events' && (
            <AdminButton variant="primary" onClick={openCreateEvent}>
              <Plus className="w-4 h-4" />
              Create Event
            </AdminButton>
          )}
        </div>
      </header>

      <AdminTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Notices Tab */}
      <TabPanel id="notices" activeTab={activeTab}>
        <div className="admin-section">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-400" />
              <input
                type="text"
                placeholder="Search notices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="admin-input pl-10"
              />
            </div>
            <AdminSelect
              options={[{ value: 'all', label: 'All Status' }, ...noticeStatusOptions]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-48"
            />
          </div>

          <AdminTable
            columns={noticeColumns}
            data={filteredNotices}
            keyField="id"
            emptyMessage="No notices found"
            hoverable
            striped
            renderRowActions={(row) => (
              <div className="flex items-center justify-end gap-1">
                <button
                  className="admin-btn-ghost p-1.5"
                  onClick={() => openEditNotice(row)}
                  aria-label="Edit notice"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  className="admin-btn-ghost p-1.5 text-danger-600 hover:bg-danger-50"
                  onClick={() => confirmDelete('notice', row.id)}
                  aria-label="Delete notice"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          />
        </div>
      </TabPanel>

      {/* Events Tab */}
      <TabPanel id="events" activeTab={activeTab}>
        <div className="admin-section">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="admin-input pl-10"
              />
            </div>
            <AdminSelect
              options={[{ value: 'all', label: 'All Status' }, ...eventStatusOptions]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-56"
            />
          </div>

          <AdminTable
            columns={eventColumns}
            data={filteredEvents}
            keyField="id"
            emptyMessage="No events found"
            hoverable
            striped
            renderRowActions={(row) => (
              <div className="flex items-center justify-end gap-1">
                {row.approvalStatus === 'pending' && (
                  <AdminButton variant="secondary" size="sm" onClick={() => openEditEvent({...row, approvalStatus: 'approved'})}>
                    Approve
                  </AdminButton>
                )}
                {row.approvalStatus === 'pending' && (
                  <AdminButton variant="danger" size="sm" onClick={() => openEditEvent({...row, approvalStatus: 'rejected'})}>
                    Reject
                  </AdminButton>
                )}
                <button
                  className="admin-btn-ghost p-1.5"
                  onClick={() => openEditEvent(row)}
                  aria-label="Edit event"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  className="admin-btn-ghost p-1.5 text-danger-600 hover:bg-danger-50"
                  onClick={() => confirmDelete('event', row.id)}
                  aria-label="Delete event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          />
        </div>
      </TabPanel>

      {/* Notice Modal */}
      <AdminModal
        isOpen={noticeModalOpen}
        onClose={() => setNoticeModalOpen(false)}
        title={editingNotice ? 'Edit Notice' : 'Create Notice'}
        size="lg"
      >
        <form onSubmit={handleNoticeSubmit} className="space-y-4">
          <AdminInput label="Title" value={noticeForm.title} onChange={(e) => setNoticeForm({...noticeForm, title: e.target.value})} required />
          <AdminTextarea label="Content" value={noticeForm.body} onChange={(e) => setNoticeForm({...noticeForm, body: e.target.value})} rows={6} required />
          <FormRow cols={2}>
            <AdminSelect
              label="Category"
              options={noticeCategoryOptions}
              value={noticeForm.category}
              onChange={(e) => setNoticeForm({...noticeForm, category: e.target.value})}
            />
            <AdminSelect
              label="Status"
              options={noticeStatusOptions}
              value={noticeForm.status}
              onChange={(e) => setNoticeForm({...noticeForm, status: e.target.value})}
            />
          </FormRow>
          <FormRow cols={2}>
            <AdminSelect
              label="Priority"
              options={[
                { value: 'low', label: 'Low' },
                { value: 'normal', label: 'Normal' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
              ]}
              value={noticeForm.priority}
              onChange={(e) => setNoticeForm({...noticeForm, priority: e.target.value})}
            />
            <AdminSelect
              label="Target Audience"
              options={[
                { value: 'all', label: 'All' },
                { value: 'students', label: 'Students' },
                { value: 'faculty', label: 'Faculty' },
              ]}
              value={noticeForm.targetAudience}
              onChange={(e) => setNoticeForm({...noticeForm, targetAudience: e.target.value})}
            />
          </FormRow>
          <AdminInput
            label="Expires At (Optional)"
            type="date"
            value={noticeForm.expiresAt}
            onChange={(e) => setNoticeForm({...noticeForm, expiresAt: e.target.value})}
          />
          <div className="admin-modal-footer">
            <AdminButton variant="ghost" type="button" onClick={() => setNoticeModalOpen(false)}>Cancel</AdminButton>
            <AdminButton variant="primary" type="submit">{editingNotice ? 'Update' : 'Create'}</AdminButton>
          </div>
        </form>
      </AdminModal>

      {/* Event Modal */}
      <AdminModal
        isOpen={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        title={editingEvent ? 'Edit Event' : 'Create Event'}
        size="xl"
      >
        <form onSubmit={handleEventSubmit} className="space-y-4">
          <AdminInput label="Event Title" value={eventForm.title} onChange={(e) => setEventForm({...eventForm, title: e.target.value})} required />
          <AdminTextarea label="Description" value={eventForm.description} onChange={(e) => setEventForm({...eventForm, description: e.target.value})} rows={5} />
          <FormRow cols={3}>
            <AdminSelect
              label="Category"
              options={eventCategoryOptions}
              value={eventForm.category}
              onChange={(e) => setEventForm({...eventForm, category: e.target.value})}
            />
            <AdminSelect
              label="Type"
              options={[
                { value: 'fest', label: 'Festival' },
                { value: 'hackathon', label: 'Hackathon' },
                { value: 'seminar', label: 'Seminar' },
                { value: 'workshop', label: 'Workshop' },
                { value: 'camp', label: 'Camp' },
                { value: 'tournament', label: 'Tournament' },
                { value: 'meetup', label: 'Meetup' },
              ]}
              value={eventForm.type}
              onChange={(e) => setEventForm({...eventForm, type: e.target.value})}
            />
            <AdminSelect
              label="Status"
              options={eventStatusOptions}
              value={eventForm.status}
              onChange={(e) => setEventForm({...eventForm, status: e.target.value})}
            />
          </FormRow>
          <FormRow cols={2}>
            <AdminInput label="Start Date" type="date" value={eventForm.startDate} onChange={(e) => setEventForm({...eventForm, startDate: e.target.value})} required />
            <AdminInput label="End Date" type="date" value={eventForm.endDate} onChange={(e) => setEventForm({...eventForm, endDate: e.target.value})} required />
          </FormRow>
          <AdminInput label="Venue" value={eventForm.venue} onChange={(e) => setEventForm({...eventForm, venue: e.target.value})} required />
          <FormRow cols={2}>
            <AdminInput label="Organizer" value={eventForm.organizer} onChange={(e) => setEventForm({...eventForm, organizer: e.target.value})} />
            <AdminInput label="Contact Email" type="email" value={eventForm.organizerContact} onChange={(e) => setEventForm({...eventForm, organizerContact: e.target.value})} />
          </FormRow>
          <FormRow cols={2}>
            <AdminInput label="Expected Attendees" type="number" value={eventForm.expectedAttendees} onChange={(e) => setEventForm({...eventForm, expectedAttendees: e.target.value})} />
            <AdminInput label="Budget (₹)" type="number" value={eventForm.budget} onChange={(e) => setEventForm({...eventForm, budget: e.target.value})} />
          </FormRow>
          <div className="admin-modal-footer">
            <AdminButton variant="ghost" type="button" onClick={() => setEventModalOpen(false)}>Cancel</AdminButton>
            <AdminButton variant="primary" type="submit">{editingEvent ? 'Update' : 'Create'}</AdminButton>
          </div>
        </form>
      </AdminModal>

      {/* Delete Confirm Dialog */}
      <AdminConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, type: null, id: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Item"
        message={`Are you sure you want to delete this ${deleteConfirm.type}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
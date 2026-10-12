import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { tokens, radius } from '../../theme'
import { PageHeader, SectionCard, StatusPill, TagChip, PrimaryButton, SecondaryButton } from '../../components/admin/PageChrome'
import { formatDate, formatNumber, truncate } from '../../utils/format'
import { useStoreRevision } from '../../data/store'
import { getNoticesByUniversity, notices } from '../../data/notices'
import { getEventsByUniversity, events } from '../../data/events'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/feedback/Toast'
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Search,
  AlertCircle,
  X,
  CheckCircle2,
  Inbox,
  Pin,
  Megaphone,
  Users,
} from 'lucide-react'
import { AnnounceModal, RegistrationsModal } from '../../components/admin/NoticeExtras'

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
}

export default function NoticesEventsPage({ defaultTab = 'notices' }) {
  const { admin, hasPermission } = useAuth()
  const [announceOpen, setAnnounceOpen] = useState(false)
  const [regEvent, setRegEvent] = useState(null)
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const uniId = admin?.university
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || defaultTab)
  // Bump `rev` after any mutation to force the selectors to re-read
  // the persisted array (Proxy reads from localStorage each render).
  const [rev, setRev] = useState(0)
  const bump = () => setRev((r) => r + 1)
  const storeRev = useStoreRevision() // changes when the API sync or a failed write updates the lists
  const noticesData = useMemo(() => getNoticesByUniversity(uniId), [uniId, rev, storeRev])
  const eventsData = useMemo(() => getEventsByUniversity(uniId), [uniId, rev, storeRev])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [noticeModalOpen, setNoticeModalOpen] = useState(false)
  const [eventModalOpen, setEventModalOpen] = useState(false)
  const [editingNotice, setEditingNotice] = useState(null)
  const [editingEvent, setEditingEvent] = useState(null)
  const [noticeForm, setNoticeForm] = useState(initialNoticeForm)
  const [eventForm, setEventForm] = useState(initialEventForm)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: null, id: null })

  const draftNotices = noticesData.filter(n => n.status === 'draft').length
  const urgentNotices = noticesData.filter(n => n.priority === 'urgent' || n.priority === 'high').length
  const pendingEvents = eventsData.filter(e => e.approvalStatus === 'pending').length

  const filteredNotices = useMemo(() => noticesData.filter(n => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = !q || n.title.toLowerCase().includes(q) || (n.body || '').toLowerCase().includes(q)
    const matchesStatus = statusFilter === 'all' || n.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || n.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  }), [noticesData, searchQuery, statusFilter, categoryFilter])

  const filteredEvents = useMemo(() => eventsData.filter(e => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = !q || e.title.toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q)
    const matchesStatus = statusFilter === 'all' || e.approvalStatus === statusFilter
    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  }), [eventsData, searchQuery, statusFilter, categoryFilter])

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
      expiresAt: notice.expiresAt ? notice.expiresAt.split('T')[0] : '',
    })
    setNoticeModalOpen(true)
  }

  const handleNoticeSubmit = (e) => {
    e.preventDefault()
    if (editingNotice) {
      notices.update(editingNotice.id, {
        ...noticeForm,
        university: uniId,
        updatedAt: new Date().toISOString(),
      })
      toast.success('Notice updated.', { title: 'Saved' })
    } else {
      notices.add({
        id: `not-${Date.now()}`,
        university: uniId,
        ...noticeForm,
        publishedBy: admin?.id || 'admin-001',
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        pinned: false,
      })
      toast.success('Notice created.', { title: 'Saved' })
    }
    bump()
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
    })
    setEventModalOpen(true)
  }

  const handleEventSubmit = (e) => {
    e.preventDefault()
    if (editingEvent) {
      events.update(editingEvent.id, {
        ...eventForm,
        university: uniId,
        updatedAt: new Date().toISOString(),
      })
      toast.success('Event updated.', { title: 'Saved' })
    } else {
      events.add({
        id: `evt-${Date.now()}`,
        university: uniId,
        ...eventForm,
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        organizer: eventForm.organizer || admin?.name || 'Admin',
      })
      toast.success('Event created.', { title: 'Saved' })
    }
    bump()
    setEventModalOpen(false)
  }

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setSearchParams({ tab: tabId })
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <PageHeader
        title="Notices & Events"
        subtitle={`${noticesData.length} notices · ${eventsData.length} events · ${uniId?.toUpperCase() || 'your university'}`}
        actions={
          <>
            {hasPermission('notices') && <SecondaryButton icon={Megaphone} onClick={() => setAnnounceOpen(true)}>Announce</SecondaryButton>}
            {activeTab === 'notices' ? (
              <PrimaryButton icon={Plus} onClick={openCreateNotice}>New Notice</PrimaryButton>
            ) : (
              <PrimaryButton icon={Plus} onClick={openCreateEvent}>New Event</PrimaryButton>
            )}
          </>
        }
      />

      <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar-dark px-6 lg:px-8 py-6 max-w-7xl space-y-6">

        {/* Inbox callout — actionable items */}
        {(draftNotices > 0 || urgentNotices > 0 || pendingEvents > 0) && (
          <div
            className="p-4"
            style={{ background: tokens.surface, border: `1px solid ${tokens.hairline}`, borderRadius: radius.container }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Inbox className="w-4 h-4" style={{ color: tokens.violet }} />
              <h2 className="text-sm font-semibold" style={{ color: tokens.ink }}>Needs attention</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeTab === 'notices' && draftNotices > 0 && (
                <button
                  type="button"
                  onClick={() => setStatusFilter('draft')}
                  className="inline-flex items-center gap-1.5 px-3 h-8 text-xs font-medium transition-colors"
                  style={{
                    background: statusFilter === 'draft' ? tokens.accent : tokens.sunken,
                    color: statusFilter === 'draft' ? tokens.accentInk : tokens.ink,
                    border: `1px solid ${statusFilter === 'draft' ? tokens.accent : tokens.hairline}`,
                    borderRadius: radius.button,
                  }}
                >
                  {draftNotices} notice draft{draftNotices > 1 ? 's' : ''}
                </button>
              )}
              {activeTab === 'notices' && urgentNotices > 0 && (
                <span
                  className="inline-flex items-center gap-1.5 px-3 h-8 text-xs font-medium"
                  style={{
                    background: tokens.violetSoft, color: tokens.violet,
                    border: `1px solid ${tokens.violet}`,
                    borderRadius: radius.button,
                  }}
                >
                  <AlertCircle className="w-3 h-3" />
                  {urgentNotices} urgent
                </span>
              )}
              {activeTab === 'events' && pendingEvents > 0 && (
                <button
                  type="button"
                  onClick={() => setStatusFilter('pending')}
                  className="inline-flex items-center gap-1.5 px-3 h-8 text-xs font-medium transition-colors"
                  style={{
                    background: statusFilter === 'pending' ? tokens.accent : tokens.sunken,
                    color: statusFilter === 'pending' ? tokens.accentInk : tokens.ink,
                    border: `1px solid ${statusFilter === 'pending' ? tokens.accent : tokens.hairline}`,
                    borderRadius: radius.button,
                  }}
                >
                  {pendingEvents} event{pendingEvents > 1 ? 's' : ''} pending approval
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div
          className="flex items-center gap-1 px-1 self-start inline-flex"
          style={{ borderBottom: `1px solid ${tokens.hairline}` }}
          role="tablist"
        >
          {[
            { id: 'notices', label: 'Notices', count: filteredNotices.length },
            { id: 'events',  label: 'Events',  count: filteredEvents.length },
          ].map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleTabChange(tab.id)}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors"
                style={{
                  color: isActive ? tokens.ink : tokens.inkSoft,
                  borderBottom: `2px solid ${isActive ? tokens.accent : 'transparent'}`,
                  marginBottom: '-1px',
                }}
              >
                {tab.label}
                <span
                  className="px-1.5 py-px text-[10px] font-semibold"
                  style={{
                    background: isActive ? tokens.accent : tokens.sunken,
                    color: isActive ? tokens.accentInk : tokens.inkSoft,
                    borderRadius: radius.chip,
                  }}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Notices Table */}
        {activeTab === 'notices' && (
          <FilterBar
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            statusFilter={statusFilter}
            onStatus={setStatusFilter}
            statusOptions={[{ value: 'all', label: 'All Status' }, ...noticeStatusOptions]}
            categoryFilter={categoryFilter}
            onCategory={setCategoryFilter}
            categoryOptions={[{ value: 'all', label: 'All Categories' }, ...noticeCategoryOptions]}
            onClearFilters={() => { setStatusFilter('all'); setCategoryFilter('all'); setSearchQuery('') }}
            count={filteredNotices.length}
            total={noticesData.length}
            label="notices"
          >
            <NoticesTable
              rows={filteredNotices}
              onEdit={openEditNotice}
              onDelete={(n) => setDeleteConfirm({ open: true, type: 'notice', id: n.id })}
            />
          </FilterBar>
        )}

        {/* Events Table */}
        {activeTab === 'events' && (
          <FilterBar
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            statusFilter={statusFilter}
            onStatus={setStatusFilter}
            statusOptions={[{ value: 'all', label: 'All Status' }, ...eventStatusOptions]}
            categoryFilter={categoryFilter}
            onCategory={setCategoryFilter}
            categoryOptions={[{ value: 'all', label: 'All Categories' }, ...eventCategoryOptions]}
            onClearFilters={() => { setStatusFilter('all'); setCategoryFilter('all'); setSearchQuery('') }}
            count={filteredEvents.length}
            total={eventsData.length}
            label="events"
          >
            <EventsTable
              rows={filteredEvents}
              onRegistrations={setRegEvent}
              onEdit={openEditEvent}
              onDelete={(e) => setDeleteConfirm({ open: true, type: 'event', id: e.id })}
            />
          </FilterBar>
        )}
      </div>

      {announceOpen && <AnnounceModal onClose={() => setAnnounceOpen(false)} />}
      {regEvent && <RegistrationsModal event={regEvent} onClose={() => setRegEvent(null)} />}

      {/* Notice Modal */}
      {noticeModalOpen && (
        <Modal title={editingNotice ? 'Edit Notice' : 'New Notice'} onClose={() => setNoticeModalOpen(false)}>
          <form onSubmit={handleNoticeSubmit} className="space-y-4">
            <Field label="Title" required>
              <input
                type="text"
                value={noticeForm.title}
                onChange={(e) => setNoticeForm({...noticeForm, title: e.target.value})}
                required
                className="w-full px-3 h-9 text-sm outline-none"
                style={{ background: tokens.surface, border: `1px solid ${tokens.hairline}`, borderRadius: radius.button, color: tokens.ink }}
              />
            </Field>
            <Field label="Content" required>
              <textarea
                value={noticeForm.body}
                onChange={(e) => setNoticeForm({...noticeForm, body: e.target.value})}
                rows={6}
                required
                className="w-full px-3 py-2 text-sm outline-none resize-y"
                style={{ background: tokens.surface, border: `1px solid ${tokens.hairline}`, borderRadius: radius.button, color: tokens.ink }}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <select
                  value={noticeForm.category}
                  onChange={(e) => setNoticeForm({...noticeForm, category: e.target.value})}
                  className="w-full px-3 h-9 text-sm outline-none"
                  style={{ background: tokens.surface, border: `1px solid ${tokens.hairline}`, borderRadius: radius.button, color: tokens.ink }}
                >
                  {noticeCategoryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select
                  value={noticeForm.status}
                  onChange={(e) => setNoticeForm({...noticeForm, status: e.target.value})}
                  className="w-full px-3 h-9 text-sm outline-none"
                  style={{ background: tokens.surface, border: `1px solid ${tokens.hairline}`, borderRadius: radius.button, color: tokens.ink }}
                >
                  {noticeStatusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Priority">
                <select
                  value={noticeForm.priority}
                  onChange={(e) => setNoticeForm({...noticeForm, priority: e.target.value})}
                  className="w-full px-3 h-9 text-sm outline-none"
                  style={{ background: tokens.surface, border: `1px solid ${tokens.hairline}`, borderRadius: radius.button, color: tokens.ink }}
                >
                  {['low', 'normal', 'high', 'urgent'].map(p => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
                </select>
              </Field>
              <Field label="Target audience">
                <select
                  value={noticeForm.targetAudience}
                  onChange={(e) => setNoticeForm({...noticeForm, targetAudience: e.target.value})}
                  className="w-full px-3 h-9 text-sm outline-none"
                  style={{ background: tokens.surface, border: `1px solid ${tokens.hairline}`, borderRadius: radius.button, color: tokens.ink }}
                >
                  <option value="all">All</option>
                  <option value="students">Students</option>
                  <option value="faculty">Faculty</option>
                </select>
              </Field>
            </div>
            <Field label="Expires at (optional)">
              <input
                type="date"
                value={noticeForm.expiresAt}
                onChange={(e) => setNoticeForm({...noticeForm, expiresAt: e.target.value})}
                className="w-full px-3 h-9 text-sm outline-none"
                style={{ background: tokens.surface, border: `1px solid ${tokens.hairline}`, borderRadius: radius.button, color: tokens.ink }}
              />
            </Field>
            <div className="flex justify-end gap-2 pt-3" style={{ borderTop: `1px solid ${tokens.hairline}` }}>
              <SecondaryButton onClick={() => setNoticeModalOpen(false)}>Cancel</SecondaryButton>
              <PrimaryButton type="submit" icon={CheckCircle2}>{editingNotice ? 'Update' : 'Create'}</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {/* Event Modal */}
      {eventModalOpen && (
        <Modal title={editingEvent ? 'Edit Event' : 'New Event'} onClose={() => setEventModalOpen(false)} size="xl">
          <form onSubmit={handleEventSubmit} className="space-y-4">
            <Field label="Event title" required>
              <input
                type="text"
                value={eventForm.title}
                onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                required
                className="w-full px-3 h-9 text-sm outline-none"
                style={{ background: tokens.surface, border: `1px solid ${tokens.hairline}`, borderRadius: radius.button, color: tokens.ink }}
              />
            </Field>
            <Field label="Description">
              <textarea
                value={eventForm.description}
                onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 text-sm outline-none resize-y"
                style={{ background: tokens.surface, border: `1px solid ${tokens.hairline}`, borderRadius: radius.button, color: tokens.ink }}
              />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Category">
                <select
                  value={eventForm.category}
                  onChange={(e) => setEventForm({...eventForm, category: e.target.value})}
                  className="w-full px-3 h-9 text-sm outline-none"
                  style={{ background: tokens.surface, border: `1px solid ${tokens.hairline}`, borderRadius: radius.button, color: tokens.ink }}
                >
                  {eventCategoryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Type">
                <select
                  value={eventForm.type}
                  onChange={(e) => setEventForm({...eventForm, type: e.target.value})}
                  className="w-full px-3 h-9 text-sm outline-none"
                  style={{ background: tokens.surface, border: `1px solid ${tokens.hairline}`, borderRadius: radius.button, color: tokens.ink }}
                >
                  {['fest', 'hackathon', 'seminar', 'workshop', 'camp', 'tournament', 'meetup'].map(t => (
                    <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select
                  value={eventForm.status}
                  onChange={(e) => setEventForm({...eventForm, status: e.target.value})}
                  className="w-full px-3 h-9 text-sm outline-none"
                  style={{ background: tokens.surface, border: `1px solid ${tokens.hairline}`, borderRadius: radius.button, color: tokens.ink }}
                >
                  {eventStatusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start date" required>
                <input type="date" value={eventForm.startDate} onChange={(e) => setEventForm({...eventForm, startDate: e.target.value})} required
                  className="w-full px-3 h-9 text-sm outline-none"
                  style={{ background: tokens.surface, border: `1px solid ${tokens.hairline}`, borderRadius: radius.button, color: tokens.ink }} />
              </Field>
              <Field label="End date" required>
                <input type="date" value={eventForm.endDate} onChange={(e) => setEventForm({...eventForm, endDate: e.target.value})} required
                  className="w-full px-3 h-9 text-sm outline-none"
                  style={{ background: tokens.surface, border: `1px solid ${tokens.hairline}`, borderRadius: radius.button, color: tokens.ink }} />
              </Field>
            </div>
            <Field label="Venue" required>
              <input type="text" value={eventForm.venue} onChange={(e) => setEventForm({...eventForm, venue: e.target.value})} required
                className="w-full px-3 h-9 text-sm outline-none"
                style={{ background: tokens.surface, border: `1px solid ${tokens.hairline}`, borderRadius: radius.button, color: tokens.ink }} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Organizer">
                <input type="text" value={eventForm.organizer} onChange={(e) => setEventForm({...eventForm, organizer: e.target.value})}
                  className="w-full px-3 h-9 text-sm outline-none"
                  style={{ background: tokens.surface, border: `1px solid ${tokens.hairline}`, borderRadius: radius.button, color: tokens.ink }} />
              </Field>
              <Field label="Contact email">
                <input type="email" value={eventForm.organizerContact} onChange={(e) => setEventForm({...eventForm, organizerContact: e.target.value})}
                  className="w-full px-3 h-9 text-sm outline-none"
                  style={{ background: tokens.surface, border: `1px solid ${tokens.hairline}`, borderRadius: radius.button, color: tokens.ink }} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Expected attendees">
                <input type="number" value={eventForm.expectedAttendees} onChange={(e) => setEventForm({...eventForm, expectedAttendees: e.target.value})}
                  className="w-full px-3 h-9 text-sm outline-none"
                  style={{ background: tokens.surface, border: `1px solid ${tokens.hairline}`, borderRadius: radius.button, color: tokens.ink }} />
              </Field>
              <Field label="Budget (₹)">
                <input type="number" value={eventForm.budget} onChange={(e) => setEventForm({...eventForm, budget: e.target.value})}
                  className="w-full px-3 h-9 text-sm outline-none"
                  style={{ background: tokens.surface, border: `1px solid ${tokens.hairline}`, borderRadius: radius.button, color: tokens.ink }} />
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-3" style={{ borderTop: `1px solid ${tokens.hairline}` }}>
              <SecondaryButton onClick={() => setEventModalOpen(false)}>Cancel</SecondaryButton>
              <PrimaryButton type="submit" icon={CheckCircle2}>{editingEvent ? 'Update' : 'Create'}</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteConfirm.open && (
        <ConfirmDialog
          title="Delete this item?"
          message={`This will permanently delete the ${deleteConfirm.type}. This action cannot be undone.`}
          confirmText="Delete"
          onConfirm={() => {
            if (deleteConfirm.type === 'notice') notices.remove(deleteConfirm.id)
            else if (deleteConfirm.type === 'event') events.remove(deleteConfirm.id)
            toast.success(`${deleteConfirm.type} removed.`, { title: 'Removed' })
            bump()
            setDeleteConfirm({ open: false, type: null, id: null })
          }}
          onClose={() => setDeleteConfirm({ open: false, type: null, id: null })}
        />
      )}
    </div>
  )
}

// ─── Local sub-components styled to the new token system ────────────────

function FilterBar({
  searchQuery, onSearch,
  statusFilter, onStatus, statusOptions,
  categoryFilter, onCategory, categoryOptions,
  onClearFilters, count, total, label,
  children,
}) {
  const hasFilters = searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
  return (
    <div
      style={{ background: tokens.surface, border: `1px solid ${tokens.hairline}`, borderRadius: radius.container, overflow: 'hidden' }}
    >
      <div className="flex items-center gap-2 p-3" style={{ borderBottom: `1px solid ${tokens.hairline2}` }}>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: tokens.inkFaint }} />
          <input
            type="text"
            placeholder={`Search ${label}…`}
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-9 pr-3 h-8 text-sm outline-none"
            style={{ background: tokens.sunken, border: '1px solid transparent', borderRadius: radius.button, color: tokens.ink }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => onStatus(e.target.value)}
          className="h-8 px-2.5 text-sm outline-none"
          style={{ background: tokens.surface, border: `1px solid ${tokens.hairline}`, borderRadius: radius.button, color: tokens.ink }}
        >
          {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => onCategory(e.target.value)}
          className="h-8 px-2.5 text-sm outline-none"
          style={{ background: tokens.surface, border: `1px solid ${tokens.hairline}`, borderRadius: radius.button, color: tokens.ink }}
        >
          {categoryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {hasFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-1 px-2 h-8 text-xs hover:bg-white/[0.02] transition-colors"
            style={{ color: tokens.inkSoft, borderRadius: radius.button }}
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
        <div className="ml-auto text-xs" style={{ color: tokens.inkSoft, fontVariantNumeric: 'tabular-nums' }}>
          {count} of {total}
        </div>
      </div>
      {children}
    </div>
  )
}

function NoticesTable({ rows, onEdit, onDelete }) {
  if (rows.length === 0) return <EmptyState label="No notices match the current filters" />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <Th>Title</Th>
            <Th>Category</Th>
            <Th>Status</Th>
            <Th>Priority</Th>
            <Th>Published</Th>
            <Th align="right"></Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((n, i) => (
            <tr key={n.id} className="hover:bg-white/[0.02] transition-colors" style={{ borderTop: i === 0 ? 'none' : `1px solid ${tokens.hairline2}` }}>
              <Td>
                <div className="flex items-start gap-2 min-w-0">
                  {n.pinned && <Pin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: tokens.accent }} />}
                  <div className="min-w-0">
                    <div className="font-medium truncate" style={{ color: tokens.ink }}>{truncate(n.title, 70)}</div>
                    <div className="text-xs mt-0.5 truncate" style={{ color: tokens.inkSoft }}>{truncate(n.body, 90)}</div>
                  </div>
                </div>
              </Td>
              <Td>
                <TagChip>{n.category}</TagChip>
              </Td>
              <Td><StatusPill kind={n.status === 'published' ? 'approved' : n.status === 'draft' ? 'draft' : 'closed'}>{n.status}</StatusPill></Td>
              <Td>
                {n.priority === 'urgent'
                  ? <StatusPill kind="urgent">urgent</StatusPill>
                  : n.priority === 'high'
                    ? <StatusPill kind="pending">high</StatusPill>
                    : <span className="text-xs" style={{ color: tokens.inkSoft }}>{n.priority}</span>
                }
              </Td>
              <Td>
                <span className="text-xs" style={{ color: tokens.inkSoft, fontVariantNumeric: 'tabular-nums' }}>
                  {n.publishedAt ? formatDate(n.publishedAt) : '—'}
                </span>
              </Td>
              <Td align="right">
                <div className="flex items-center justify-end gap-0.5">
                  <IconButton onClick={() => onEdit(n)} title="Edit"><Edit className="w-3.5 h-3.5" /></IconButton>
                  <IconButton onClick={() => onDelete(n)} title="Delete" danger><Trash2 className="w-3.5 h-3.5" /></IconButton>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EventsTable({ rows, onEdit, onDelete, onRegistrations }) {
  if (rows.length === 0) return <EmptyState label="No events match the current filters" />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <Th>Event</Th>
            <Th>Category</Th>
            <Th>Status</Th>
            <Th>Venue</Th>
            <Th align="right">Expected</Th>
            <Th>Dates</Th>
            <Th align="right"></Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e, i) => (
            <tr key={e.id} className="hover:bg-white/[0.02] transition-colors" style={{ borderTop: i === 0 ? 'none' : `1px solid ${tokens.hairline2}` }}>
              <Td>
                <div className="min-w-0">
                  <div className="font-medium truncate" style={{ color: tokens.ink }}>{truncate(e.title, 50)}</div>
                  <div className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: tokens.inkSoft }}>
                    <TagChip>{e.category}</TagChip>
                    <span>·</span>
                    <span>{e.organizer || '—'}</span>
                  </div>
                </div>
              </Td>
              <Td>
                <span className="text-xs" style={{ color: tokens.inkSoft }}>{e.type}</span>
              </Td>
              <Td>
                <StatusPill kind={
                  e.approvalStatus === 'approved' || e.approvalStatus === 'published' ? 'approved'
                  : e.approvalStatus === 'pending' || e.approvalStatus === 'under_review' ? 'pending'
                  : e.approvalStatus === 'rejected' ? 'rejected'
                  : 'closed'
                }>
                  {e.approvalStatus}
                </StatusPill>
              </Td>
              <Td>
                <span className="text-xs" style={{ color: tokens.ink }}>{truncate(e.venue, 25)}</span>
              </Td>
              <Td align="right">
                <span className="text-xs font-semibold" style={{ color: tokens.ink, fontVariantNumeric: 'tabular-nums' }}>
                  {formatNumber(e.expectedAttendees)}
                </span>
              </Td>
              <Td>
                <span className="text-xs" style={{ color: tokens.inkSoft, fontVariantNumeric: 'tabular-nums' }}>
                  {formatDate(e.startDate, { day: 'numeric', month: 'short' })}
                </span>
              </Td>
              <Td align="right">
                <div className="flex items-center justify-end gap-0.5">
                  {e.approvalStatus === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => onEdit({...e, approvalStatus: 'approved'})}
                        className="inline-flex items-center px-2 h-7 text-[11px] font-medium transition-colors"
                        style={{ background: tokens.greenSoft, color: tokens.greenText, border: `1px solid ${tokens.green}`, borderRadius: radius.chip }}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit({...e, approvalStatus: 'rejected'})}
                        className="inline-flex items-center px-2 h-7 text-[11px] font-medium transition-colors"
                        style={{ background: tokens.violetSoft, color: tokens.violetText, border: `1px solid ${tokens.violet}`, borderRadius: radius.chip }}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <IconButton onClick={() => onRegistrations(e)} title="Registrations"><Users className="w-3.5 h-3.5" /></IconButton>
                  <IconButton onClick={() => onEdit(e)} title="Edit"><Edit className="w-3.5 h-3.5" /></IconButton>
                  <IconButton onClick={() => onDelete(e)} title="Delete" danger><Trash2 className="w-3.5 h-3.5" /></IconButton>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children, align = 'left' }) {
  return (
    <th
      className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{ color: tokens.inkFaint, textAlign: align, borderBottom: `1px solid ${tokens.hairline}`, background: tokens.surface }}
    >
      {children}
    </th>
  )
}

function Td({ children, align = 'left' }) {
  return <td className="px-4 py-3" style={{ textAlign: align, color: tokens.ink, verticalAlign: 'top' }}>{children}</td>
}

function IconButton({ onClick, title, danger, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="w-7 h-7 flex items-center justify-center transition-colors hover:bg-white/[0.04]"
      style={{ color: danger ? tokens.violet : tokens.inkSoft, borderRadius: radius.chip }}
    >
      {children}
    </button>
  )
}

function EmptyState({ label }) {
  return (
    <div className="px-4 py-12 text-center" style={{ color: tokens.inkSoft }}>
      <Inbox className="w-8 h-8 mx-auto mb-2" style={{ color: tokens.inkFaint }} />
      <p className="text-sm">{label}</p>
    </div>
  )
}

function Modal({ title, onClose, size = 'md', children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.6)' }} onClick={onClose}>
      <div
        className="w-full max-h-[85vh] overflow-y-auto"
        style={{
          background: tokens.surface,
          borderRadius: radius.container,
          width: size === 'xl' ? 720 : size === 'lg' ? 600 : 480,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${tokens.hairline}` }}>
          <h2 className="text-base font-semibold" style={{ color: tokens.ink }}>{title}</h2>
          <button type="button" onClick={onClose} className="w-7 h-7 flex items-center justify-center hover:bg-white/[0.02]" style={{ borderRadius: radius.chip, color: tokens.inkSoft }} aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: tokens.ink }}>
        {label} {required && <span style={{ color: tokens.violet }}>*</span>}
      </label>
      {children}
    </div>
  )
}

function ConfirmDialog({ title, message, confirmText = 'Confirm', onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.6)' }} onClick={onClose}>
      <div
        className="w-full max-w-sm p-5"
        style={{ background: tokens.surface, borderRadius: radius.container }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold mb-2" style={{ color: tokens.ink }}>{title}</h2>
        <p className="text-sm mb-4" style={{ color: tokens.inkSoft }}>{message}</p>
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton onClick={onConfirm} icon={Trash2}>{confirmText}</PrimaryButton>
        </div>
      </div>
    </div>
  )
}

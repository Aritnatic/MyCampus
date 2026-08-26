import { createColumn } from '../AdminTable'
import { AdminBadge, AdminStatusDot } from '../AdminBadge'
import { formatDate, formatNumber, truncate, getRelativeDate } from '../../../utils/format'
import {
  Calendar, Plus, Edit, Trash2, Eye, CheckCircle, XCircle, Clock,
  Users, MapPin, Mail, Tag, AlertTriangle
} from 'lucide-react'

export const EVENT_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending Review' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'published', label: 'Published' },
  { value: 'cancelled', label: 'Cancelled' },
]

export const EVENT_APPROVAL_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

export const EVENT_CATEGORY_OPTIONS = [
  { value: 'technical', label: 'Technical' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'sports', label: 'Sports' },
  { value: 'academic', label: 'Academic' },
  { value: 'social', label: 'Social' },
  { value: 'alumni', label: 'Alumni' },
  { value: 'entrepreneurship', label: 'Entrepreneurship' },
]

export const EVENT_TYPE_OPTIONS = [
  { value: 'fest', label: 'Festival' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'camp', label: 'Camp' },
  { value: 'tournament', label: 'Tournament' },
  { value: 'meetup', label: 'Meetup' },
]

export const eventTagOptions = [
  'hackathon', 'workshop', 'competition', 'tech-talks', 'dance', 'music', 'drama',
  'fashion', 'literary', 'ai', 'machine-learning', 'career', 'guest-lecture',
  'blood-donation', 'social', 'nss', 'health', 'sports', 'cricket', 'football',
  'tournament', 'inter-branch', 'alumni', 'reunion', 'networking', 'batch',
  'startup', 'entrepreneurship', 'bootcamp', 'mvp', 'funding', 'smart-campus',
  'innovation', 'coding', 'cultural',
]

export function createEventColumns({ onRowAction, actionsWidth = '120px' } = {}) {
  const columns = [
    createColumn({
      key: 'title',
      header: 'Event',
      width: '320px',
      sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-medium text-admin-900 truncate max-w-xs">{truncate(val, 50)}</p>
          <p className="text-sm text-admin-500 mt-0.5 flex items-center gap-1">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">
              {formatDate(row.startDate)} - {formatDate(row.endDate)}
            </span>
          </p>
        </div>
      ),
    }),
    createColumn({
      key: 'category',
      header: 'Category',
      width: '110px',
      sortable: true,
      render: (val) => (
        <AdminBadge status={val} size="sm" variant="outline" />
      ),
    }),
    createColumn({
      key: 'type',
      header: 'Type',
      width: '100px',
      sortable: true,
      render: (val) => (
        <span className="text-sm text-admin-600 capitalize">{val.replace('_', ' ')}</span>
      ),
    }),
    createColumn({
      key: 'approvalStatus',
      header: 'Approval',
      width: '130px',
      sortable: true,
      render: (val) => (
        <AdminBadge status={val} size="sm" />
      ),
    }),
    createColumn({
      key: 'expectedAttendees',
      header: 'Expected',
      width: '90px',
      sortable: true,
      render: (val) => (
        <span className="text-sm text-admin-600">{formatNumber(val)}</span>
      ),
    }),
    createColumn({
      key: 'registeredAttendees',
      header: 'Registered',
      width: '100px',
      sortable: true,
      render: (val) => (
        <span className="text-sm font-medium text-primary-600">{formatNumber(val)}</span>
      ),
    }),
    createColumn({
      key: 'venue',
      header: 'Venue',
      width: '180px',
      sortable: false,
      render: (val) => (
        <span className="text-sm text-admin-600 flex items-center gap-1">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{truncate(val, 30)}</span>
        </span>
      ),
    }),
  ]

  // Add actions column if handler provided
  if (onRowAction) {
    return [
      ...columns,
      createColumn({
        key: '__actions__',
        header: 'Actions',
        width: actionsWidth,
        sortable: false,
        align: 'right',
        render: (_, row) => onRowAction(row),
      }),
    ]
  }

  return columns
}

// Quick filter configurations for events
export const eventQuickFilters = [
  { value: 'all', label: 'All', count: null },
  { value: 'pending', label: 'Pending', count: null },
  { value: 'under_review', label: 'Under Review', count: null },
  { value: 'approved', label: 'Approved', count: null },
  { value: 'rejected', label: 'Rejected', count: null },
  { value: 'published', label: 'Published', count: null },
  { value: 'cancelled', label: 'Cancelled', count: null },
]

// Filter bar configurations for events
export const eventFilters = [
  {
    key: 'approvalStatus',
    type: 'select',
    placeholder: 'Approval Status',
    options: EVENT_APPROVAL_STATUS_OPTIONS,
    allLabel: 'All Approval',
    width: 48,
  },
  {
    key: 'category',
    type: 'select',
    placeholder: 'Category',
    options: EVENT_CATEGORY_OPTIONS,
    allLabel: 'All Categories',
    width: 44,
  },
  {
    key: 'type',
    type: 'select',
    placeholder: 'Type',
    options: EVENT_TYPE_OPTIONS,
    allLabel: 'All Types',
    width: 44,
  },
]

// Stats bar configurations for events
export function createEventStats(data) {
  const total = data.length
  const pending = data.filter(e => e.approvalStatus === 'pending').length
  const underReview = data.filter(e => e.approvalStatus === 'under_review').length
  const approved = data.filter(e => e.approvalStatus === 'approved').length
  const rejected = data.filter(e => e.approvalStatus === 'rejected').length
  const totalExpected = data.reduce((sum, e) => sum + (e.expectedAttendees || 0), 0)
  const totalRegistered = data.reduce((sum, e) => sum + (e.registeredAttendees || 0), 0)

  return [
    { key: 'total', label: 'Total Events', value: total, trend: 0, icon: () => <Calendar className="w-5 h-5 text-primary-600" /> },
    { key: 'pending', label: 'Pending Review', value: pending, trend: 0, icon: () => <Clock className="w-5 h-5 text-warning-600" />, iconBg: 'bg-warning-100' },
    { key: 'underReview', label: 'Under Review', value: underReview, trend: 0, icon: () => <Clock className="w-5 h-5 text-info-600" />, iconBg: 'bg-info-100' },
    { key: 'approved', label: 'Approved', value: approved, trend: 0, icon: () => <CheckCircle className="w-5 h-5 text-success-600" />, iconBg: 'bg-success-100' },
    { key: 'rejected', label: 'Rejected', value: rejected, trend: 0, icon: () => <XCircle className="w-5 h-5 text-danger-600" />, iconBg: 'bg-danger-100' },
  ]
}

// Initial form data for creating/editing events
export const initialEventForm = {
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

// Form sections configuration for event modal
export const eventFormSections = [
  {
    title: 'Event Details',
    fields: [
      { type: 'text', name: 'title', label: 'Event Title', required: true, placeholder: 'e.g., TechFest 2024 - Annual Technical Festival' },
      { type: 'textarea', name: 'description', label: 'Description', rows: 5, placeholder: 'Describe the event...' },
    ],
  },
  {
    title: 'Classification & Status',
    fields: [
      { type: 'select', name: 'category', label: 'Category', options: EVENT_CATEGORY_OPTIONS, required: true },
      { type: 'select', name: 'type', label: 'Type', options: EVENT_TYPE_OPTIONS, required: true },
      { type: 'select', name: 'status', label: 'Status', options: EVENT_STATUS_OPTIONS, required: true },
      { type: 'select', name: 'approvalStatus', label: 'Approval Status', options: EVENT_APPROVAL_STATUS_OPTIONS, required: true },
    ],
  },
  {
    title: 'Schedule & Venue',
    fields: [
      { type: 'date', name: 'startDate', label: 'Start Date', required: true },
      { type: 'date', name: 'endDate', label: 'End Date', required: true },
      { type: 'text', name: 'venue', label: 'Venue', required: true, placeholder: 'e.g., Main Auditorium, Academic Blocks' },
    ],
  },
  {
    title: 'Organizer & Logistics',
    fields: [
      { type: 'text', name: 'organizer', label: 'Organizer', placeholder: 'e.g., Student Technical Council' },
      { type: 'email', name: 'organizerContact', label: 'Contact Email', placeholder: 'organizer@cvrp.edu.in' },
      { type: 'number', name: 'expectedAttendees', label: 'Expected Attendees', placeholder: '1500' },
      { type: 'number', name: 'budget', label: 'Budget (₹)', placeholder: '500000' },
    ],
  },
  {
    title: 'Tags',
    fields: [
      { type: 'multiselect', name: 'tags', label: 'Tags', options: eventTagOptions.map(t => ({ value: t, label: t })), description: 'Select relevant tags' },
    ],
  },
]

export function mapEventToForm(event) {
  return {
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
    expectedAttendees: event.expectedAttendees || '',
    budget: event.budget || '',
    tags: event.tags || [],
  }
}

export function mapFormToEvent(formData, existingEvent = {}) {
  return {
    ...existingEvent,
    title: formData.title,
    description: formData.description,
    category: formData.category,
    type: formData.type,
    status: formData.status,
    approvalStatus: formData.approvalStatus,
    startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
    endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
    venue: formData.venue,
    organizer: formData.organizer,
    organizerContact: formData.organizerContact,
    expectedAttendees: parseInt(formData.expectedAttendees) || 0,
    budget: parseInt(formData.budget) || 0,
    tags: formData.tags || [],
    updatedAt: new Date().toISOString(),
  }
}
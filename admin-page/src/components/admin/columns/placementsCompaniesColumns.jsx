import { createColumn } from '../AdminTable'
import { AdminBadge, AdminStatusDot } from '../AdminBadge'
import { formatDate, formatNumber, truncate } from '../../../utils/format'
import { Building2, TrendingUp, Users, CheckCircle, MapPin, Mail, Phone } from 'lucide-react'

// Company tier options
export const COMPANY_TIER_OPTIONS = [
  { value: 'tier1', label: 'Tier 1' },
  { value: 'tier2', label: 'Tier 2' },
  { value: 'tier3', label: 'Tier 3' },
]

export const COMPANY_RELATIONSHIP_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'inactive', label: 'Inactive' },
]

export const industryOptions = [
  'IT Services',
  'Food Tech',
  'Engineering & Construction',
  'Industrial Automation',
  'Automotive',
  'Consulting & Services',
  'Semiconductor',
  'FinTech',
  'EdTech',
  'HealthTech',
  'E-Commerce',
  'Manufacturing',
  'Telecommunications',
  'Aerospace & Defense',
  'Energy & Utilities',
]

export function createCompanyColumns({ onRowAction, actionsWidth = '120px' } = {}) {
  const columns = [
    createColumn({
      key: 'name',
      header: 'Company',
      width: '280px',
      sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-medium text-admin-900 truncate max-w-xs">{truncate(val, 45)}</p>
          <p className="text-sm text-admin-500 mt-0.5 flex items-center gap-1">
            <Building2 className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{row.industry}</span>
          </p>
        </div>
      ),
    }),
    createColumn({
      key: 'tier',
      header: 'Tier',
      width: '90px',
      sortable: true,
      render: (val) => (
        <span className="text-sm font-medium text-admin-600 capitalize">{val.replace('tier', 'Tier ')}</span>
      ),
    }),
    createColumn({
      key: 'relationship',
      header: 'Status',
      width: '110px',
      sortable: true,
      render: (val) => (
        <AdminBadge status={val} size="sm" />
      ),
    }),
    createColumn({
      key: 'totalHires',
      header: 'Total Hires',
      width: '110px',
      sortable: true,
      render: (val) => (
        <span className="text-sm text-admin-600">{formatNumber(val)}</span>
      ),
    }),
    createColumn({
      key: 'currentOpenings',
      header: 'Openings',
      width: '90px',
      sortable: true,
      render: (val) => (
        <span className="text-sm font-medium text-primary-600">{formatNumber(val)}</span>
      ),
    }),
    createColumn({
      key: 'verified',
      header: 'Verified',
      width: '100px',
      sortable: true,
      render: (val) => (
        <AdminBadge status={val ? 'verified' : 'unverified'} size="sm" />
      ),
    }),
    createColumn({
      key: 'contactPerson',
      header: 'Contact',
      width: '180px',
      sortable: false,
      render: (val, row) => (
        <div className="text-sm">
          <p className="text-admin-600 flex items-center gap-1">
            <Users className="w-3 h-3" />
            {val}
          </p>
          <p className="text-admin-400 flex items-center gap-1">
            <Mail className="w-3 h-3" />
            {row.contactEmail}
          </p>
        </div>
      ),
    }),
    createColumn({
      key: 'lastDrive',
      header: 'Last Drive',
      width: '120px',
      sortable: true,
      render: (val) => (
        <span className="text-sm text-admin-600">{val ? formatDate(val) : '—'}</span>
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

// Quick filter configurations for companies
export const companyQuickFilters = [
  { value: 'all', label: 'All', count: null },
  { value: 'active', label: 'Active', count: null },
  { value: 'pending', label: 'Pending', count: null },
  { value: 'inactive', label: 'Inactive', count: null },
  { value: 'verified', label: 'Verified', count: null },
]

// Filter bar configurations for companies
export const companyFilters = [
  {
    key: 'relationship',
    type: 'select',
    placeholder: 'Relationship',
    options: COMPANY_RELATIONSHIP_OPTIONS,
    allLabel: 'All Status',
    width: 40,
  },
  {
    key: 'tier',
    type: 'select',
    placeholder: 'Tier',
    options: COMPANY_TIER_OPTIONS,
    allLabel: 'All Tiers',
    width: 40,
  },
  {
    key: 'verified',
    type: 'select',
    placeholder: 'Verified',
    options: [
      { value: 'true', label: 'Verified' },
      { value: 'false', label: 'Not Verified' },
    ],
    allLabel: 'All',
    width: 40,
  },
  {
    key: 'industry',
    type: 'select',
    placeholder: 'Industry',
    options: industryOptions.map(i => ({ value: i, label: i })),
    allLabel: 'All Industries',
    width: 52,
  },
]

// Stats bar configurations for companies
export function createCompanyStats(data) {
  const total = data.length
  const active = data.filter(c => c.relationship === 'active').length
  const pending = data.filter(c => c.relationship === 'pending').length
  const inactive = data.filter(c => c.relationship === 'inactive').length
  const verified = data.filter(c => c.verified).length
  const totalHires = data.reduce((sum, c) => sum + (c.totalHires || 0), 0)
  const totalOpenings = data.reduce((sum, c) => sum + (c.currentOpenings || 0), 0)

  return [
    { key: 'total', label: 'Total Companies', value: total, trend: 0, icon: () => <Building2 className="w-5 h-5 text-primary-600" /> },
    { key: 'active', label: 'Active', value: active, trend: 0, icon: () => <CheckCircle className="w-5 h-5 text-success-600" />, iconBg: 'bg-success-100' },
    { key: 'pending', label: 'Pending', value: pending, trend: 0, icon: () => <span className="w-5 h-5 text-warning-600">⏳</span>, iconBg: 'bg-warning-100' },
    { key: 'inactive', label: 'Inactive', value: inactive, trend: 0, icon: () => <span className="w-5 h-5 text-admin-400">⏸</span>, iconBg: 'bg-admin-100' },
    { key: 'verified', label: 'Verified', value: verified, trend: 0, icon: () => <span className="w-5 h-5 text-info-600">✓</span>, iconBg: 'bg-info-100' },
  ]
}

// Initial form data for creating/editing companies
export const initialCompanyForm = {
  name: '',
  industry: '',
  tier: 'tier1',
  contactPerson: '',
  contactEmail: '',
  relationship: 'pending',
  totalHires: 0,
  currentOpenings: 0,
  verified: false,
}

// Form sections configuration for company modal
export const companyFormSections = [
  {
    title: 'Basic Information',
    fields: [
      { type: 'text', name: 'name', label: 'Company Name', required: true, placeholder: 'e.g., Tata Consultancy Services' },
      { type: 'select', name: 'industry', label: 'Industry', options: industryOptions.map(i => ({ value: i, label: i })), required: true, placeholder: 'Select industry' },
      { type: 'select', name: 'tier', label: 'Tier', options: COMPANY_TIER_OPTIONS, required: true },
      { type: 'select', name: 'relationship', label: 'Relationship Status', options: COMPANY_RELATIONSHIP_OPTIONS, required: true },
    ],
  },
  {
    title: 'Contact Details',
    fields: [
      { type: 'text', name: 'contactPerson', label: 'Contact Person', placeholder: 'e.g., Mr. S. Mohanty' },
      { type: 'email', name: 'contactEmail', label: 'Contact Email', placeholder: 'campus@company.com' },
    ],
  },
  {
    title: 'Placement Statistics',
    fields: [
      { type: 'number', name: 'totalHires', label: 'Total Hires', min: 0, placeholder: '0' },
      { type: 'number', name: 'currentOpenings', label: 'Current Openings', min: 0, placeholder: '0' },
    ],
  },
  {
    title: 'Verification',
    fields: [
      { type: 'checkbox', name: 'verified', label: 'Verified Company' },
    ],
  },
]

export function mapCompanyToForm(company) {
  return {
    name: company.name,
    industry: company.industry,
    tier: company.tier,
    contactPerson: company.contactPerson,
    contactEmail: company.contactEmail,
    relationship: company.relationship,
    totalHires: company.totalHires,
    currentOpenings: company.currentOpenings,
    verified: company.verified || false,
  }
}

export function mapFormToCompany(formData, existingCompany = {}) {
  return {
    ...existingCompany,
    name: formData.name,
    industry: formData.industry,
    tier: formData.tier,
    contactPerson: formData.contactPerson,
    contactEmail: formData.contactEmail,
    relationship: formData.relationship,
    totalHires: parseInt(formData.totalHires) || 0,
    currentOpenings: parseInt(formData.currentOpenings) || 0,
    verified: formData.verified || false,
    updatedAt: new Date().toISOString(),
  }
}
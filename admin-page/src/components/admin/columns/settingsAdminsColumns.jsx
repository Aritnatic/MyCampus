import { createColumn } from '../AdminTable'
import { AdminBadge, AdminStatusDot } from '../AdminBadge'
import { formatDate, formatNumber, truncate, getRelativeDate } from '../../../utils/format'
import { Users, Shield, Lock, Activity, Plus, Edit, Trash2 } from 'lucide-react'

export const ROLE_OPTIONS = [
  { value: 'superadmin', label: 'Super Admin' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'exams', label: 'Exam Controller' },
  { value: 'placements', label: 'Placement Officer' },
  { value: 'content', label: 'Content Manager' },
]

export const ADMIN_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
]

export const rolePermissionsMap = {
  superadmin: ['notices', 'events', 'exams', 'results', 'placements', 'settings', 'users'],
  moderator: ['notices', 'events', 'placements'],
  exams: ['exams', 'results'],
  placements: ['placements'],
  content: ['notices'],
}

export function createAdminColumns({ onRowAction, actionsWidth = '120px', currentAdminId } = {}) {
  const columns = [
    createColumn({
      key: 'name',
      header: 'Name',
      width: '250px',
      sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-medium text-admin-900 truncate max-w-xs">{truncate(val, 30)}</p>
          <p className="text-sm text-admin-500 mt-0.5 flex items-center gap-1">
            <span className="w-3 h-3" />{row.email}
          </p>
        </div>
      ),
    }),
    createColumn({
      key: 'role',
      header: 'Role',
      width: '140px',
      sortable: true,
      render: (val) => (
        <AdminBadge status={val} size="sm" />
      ),
    }),
    createColumn({
      key: 'status',
      header: 'Status',
      width: '110px',
      sortable: true,
      render: (val) => (
        <AdminBadge status={val} size="sm" />
      ),
    }),
    createColumn({
      key: 'permissions',
      header: 'Permissions',
      width: '280px',
      sortable: false,
      render: (val) => (
        <div className="flex flex-wrap gap-1">
          {val.slice(0, 4).map((perm, i) => (
            <span key={i} className="text-xs px-1.5 py-0.5 bg-admin-100 text-admin-600 rounded">{perm}</span>
          ))}
          {val.length > 4 && <span className="text-xs text-admin-400">+{val.length - 4}</span>}
        </div>
      ),
    }),
    createColumn({
      key: 'lastLogin',
      header: 'Last Login',
      width: '150px',
      sortable: true,
      render: (val) => (
        <span className="text-sm text-admin-600">{val ? getRelativeDate(val) : 'Never'}</span>
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
        render: (_, row) => {
          // Don't show actions for current admin
          if (currentAdminId && row.id === currentAdminId) {
            return (
              <span className="text-sm text-admin-400">Current User</span>
            )
          }
          return onRowAction(row)
        },
      }),
    ]
  }

  return columns
}

// Quick filter configurations for admins
export const adminQuickFilters = [
  { value: 'all', label: 'All', count: null },
  { value: 'active', label: 'Active', count: null },
  { value: 'inactive', label: 'Inactive', count: null },
  { value: 'suspended', label: 'Suspended', count: null },
]

// Filter bar configurations for admins
export const adminFilters = [
  {
    key: 'status',
    type: 'select',
    placeholder: 'Status',
    options: ADMIN_STATUS_OPTIONS,
    allLabel: 'All Status',
    width: 40,
  },
  {
    key: 'role',
    type: 'select',
    placeholder: 'Role',
    options: ROLE_OPTIONS,
    allLabel: 'All Roles',
    width: 48,
  },
]

// Stats bar configurations for admins
export function createAdminStats(data, currentAdminId) {
  const total = data.length
  const active = data.filter(a => a.status === 'active').length
  const inactive = data.filter(a => a.status === 'inactive').length
  const suspended = data.filter(a => a.status === 'suspended').length
  const superadmins = data.filter(a => a.role === 'superadmin').length

  return [
    { key: 'total', label: 'Total Admins', value: total, trend: 0, icon: () => <Users className="w-5 h-5 text-primary-600" /> },
    { key: 'active', label: 'Active', value: active, trend: 0, icon: () => <span className="w-5 h-5 text-success-600">🟢</span>, iconBg: 'bg-success-100' },
    { key: 'inactive', label: 'Inactive', value: inactive, trend: 0, icon: () => <span className="w-5 h-5 text-admin-400">⏸</span>, iconBg: 'bg-admin-100' },
    { key: 'superadmins', label: 'Super Admins', value: superadmins, trend: 0, icon: () => <Shield className="w-5 h-5 text-warning-600" />, iconBg: 'bg-warning-100' },
  ]
}

// Initial form data for creating/editing admins
export const initialAdminForm = {
  name: '',
  email: '',
  role: 'content',
  status: 'active',
  permissions: [],
}

// Form sections configuration for admin modal
export const adminFormSections = (permissionsList = []) => [
  {
    title: 'Basic Information',
    fields: [
      { type: 'text', name: 'name', label: 'Full Name', required: true, placeholder: 'e.g., Dr. Rajesh Kumar' },
      { type: 'email', name: 'email', label: 'Email', required: true, placeholder: 'name@university.edu.in' },
      { type: 'select', name: 'role', label: 'Role', options: ROLE_OPTIONS, required: true },
      { type: 'select', name: 'status', label: 'Status', options: ADMIN_STATUS_OPTIONS, required: true },
    ],
  },
  {
    title: 'Permissions',
    description: 'Select modules this admin can access. Changing role will reset permissions.',
    fields: [
      {
        type: 'custom',
        name: 'permissions',
        render: () => (
          <div className="space-y-2">
            {permissionsList.map((perm) => (
              <div key={perm.id} className="flex items-center justify-between p-3 border border-admin-200 rounded-lg">
                <div>
                  <p className="font-medium text-admin-900 text-sm">{perm.name}</p>
                  <p className="text-xs text-admin-500">{perm.modules.join(', ')}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="permissions"
                    value={perm.id}
                    className="sr-only peer"
                    onChange={(e) => {
                      // This will be handled by the form component
                    }}
                  />
                  <div className="w-11 h-6 bg-admin-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
            ))}
          </div>
        ),
      },
    ],
  },
]

export function mapAdminToForm(admin, permissionsList = []) {
  return {
    name: admin.name,
    email: admin.email,
    role: admin.role,
    status: admin.status,
    permissions: admin.permissions || [],
    permissionsList, // Pass for custom field rendering
  }
}

export function mapFormToAdmin(formData, existingAdmin = {}) {
  // Get selected permissions from checkboxes
  const selectedPermissions = formData.permissions ?
    (Array.isArray(formData.permissions) ? formData.permissions : [formData.permissions]) : []

  return {
    ...existingAdmin,
    name: formData.name,
    email: formData.email,
    role: formData.role,
    status: formData.status,
    permissions: selectedPermissions,
    updatedAt: new Date().toISOString(),
  }
}

// Roles display columns for roles section
export const rolesDisplayColumns = [
  createColumn({
    key: 'name',
    header: 'Role',
    width: '200px',
    sortable: true,
    render: (val, row) => (
      <div>
        <p className="font-semibold text-admin-900">{val}</p>
        <p className="text-sm text-admin-500 mt-0.5">{row.description}</p>
      </div>
    ),
  }),
  createColumn({
    key: 'id',
    header: 'ID',
    width: '150px',
    sortable: true,
    render: (val) => (
      <AdminBadge status={val} size="sm" />
    ),
  }),
]

// Permissions matrix columns
export const permissionMatrixColumns = [
  createColumn({
    key: 'name',
    header: 'Permission',
    width: '30%',
    sortable: true,
    render: (val) => <span className="font-medium text-admin-900">{val}</span>,
  }),
  createColumn({
    key: 'modules',
    header: 'Actions',
    width: '70%',
    sortable: false,
    render: (_, row) => (
      <div className="flex flex-wrap gap-1.5">
        {row.modules.map((mod, i) => (
          <span key={i} className="text-xs px-2 py-0.5 bg-primary-50 text-primary-700 rounded">{mod}</span>
        ))}
      </div>
    ),
  }),
]
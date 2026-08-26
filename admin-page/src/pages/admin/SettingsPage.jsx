import React, { useState, useMemo } from 'react'
import { AdminPageLayout, AdminPageSection } from '../../components/admin/AdminPageLayout'
import { AdminDataTable } from '../../components/admin/AdminDataTable'
import { AdminFilterBar, AdminQuickFilters } from '../../components/admin/AdminFilterBar'
import { AdminFormModal } from '../../components/admin/AdminFormModal'
import { AdminStatBar } from '../../components/admin/AdminStatBar'
import { AdminButton } from '../../components/admin/AdminForm'
import { formatDate, formatNumber, truncate, getRelativeDate } from '../../utils/format'
import {
  adminUsers,
  roles,
  permissions,
  currentAdmin,
  getRoleById,
} from '../../data/admin'
import {
  Settings,
  Users,
  Shield,
  Key,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Database,
  Activity,
} from 'lucide-react'
import {
  createAdminColumns,
  adminFilters,
  adminQuickFilters,
  createAdminStats,
  initialAdminForm,
  adminFormSections,
  mapAdminToForm,
  mapFormToAdmin,
  rolesDisplayColumns,
  permissionMatrixColumns,
} from '../../components/admin/columns/settingsAdminsColumns'
import {
  securityAlertColumns,
  auditLogColumns,
  createSecurityStats,
  securityQuickFilters,
  securityFilters,
  securitySettings,
} from '../../components/admin/columns/settingsSecurityColumns'

export default function SettingsPage() {
  const uniId = currentAdmin.university
  const [activeSection, setActiveSection] = useState('admins')
  const [adminsData] = useState(adminUsers.filter(a => a.university === uniId))

  // Security alerts data
  const [securityAlerts] = useState([
    { id: 'sec-001', type: 'login_failed', severity: 'low', message: '3 failed login attempts from IP 192.168.1.45', timestamp: '2024-01-20T14:20:00Z', resolved: false },
    { id: 'sec-002', type: 'permission_change', severity: 'medium', message: 'Prof. Anita Sharma granted placements permission', timestamp: '2024-01-19T10:15:00Z', resolved: true },
    { id: 'sec-003', type: 'data_export', severity: 'low', message: 'Rajesh Kumar exported student data report', timestamp: '2024-01-18T16:45:00Z', resolved: true },
    { id: 'sec-004', type: 'password_reset', severity: 'medium', message: 'Vikram Singh requested password reset', timestamp: '2024-01-17T09:30:00Z', resolved: false },
  ])

  // Audit logs data
  const [auditLogs] = useState([
    { id: 'log-001', action: 'notice_published', actor: 'Dr. Rajesh Kumar', timestamp: '2024-01-20T09:00:00Z', status: 'completed' },
    { id: 'log-002', action: 'event_approved', actor: 'Dr. Rajesh Kumar', timestamp: '2024-01-19T10:00:00Z', status: 'completed' },
    { id: 'log-003', action: 'exam_scheduled', actor: 'Dr. Vikram Singh', timestamp: '2024-01-19T11:00:00Z', status: 'completed' },
    { id: 'log-004', action: 'user_permission_changed', actor: 'Dr. Rajesh Kumar', timestamp: '2024-01-18T14:15:00Z', status: 'completed' },
    { id: 'log-005', action: 'result_published', actor: 'Dr. Vikram Singh', timestamp: '2024-01-17T10:00:00Z', status: 'completed' },
    { id: 'log-006', action: 'login_failed', actor: 'Unknown IP', timestamp: '2024-01-16T22:30:00Z', status: 'failed' },
    { id: 'log-007', action: 'job_posted', actor: 'Prof. Anita Sharma', timestamp: '2024-01-15T14:20:00Z', status: 'completed' },
    { id: 'log-008', action: 'settings_updated', actor: 'Dr. Rajesh Kumar', timestamp: '2024-01-14T11:00:00Z', status: 'completed' },
  ])

  // Admins state
  const [adminSearch, setAdminSearch] = useState('')
  const [adminFiltersState, setAdminFiltersState] = useState({})
  const [adminModalOpen, setAdminModalOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState(null)
  const [adminForm, setAdminForm] = useState(initialAdminForm)

  // Security state
  const [securitySearch, setSecuritySearch] = useState('')
  const [securityFiltersState, setSecurityFiltersState] = useState({})

  // Filter functions
  const filteredAdmins = useMemo(() => {
    return adminsData.filter(a => {
      const matchesSearch = a.name.toLowerCase().includes(adminSearch.toLowerCase()) ||
        a.email.toLowerCase().includes(adminSearch.toLowerCase())
      const matchesStatus = adminFiltersState.status === 'all' || !adminFiltersState.status || a.status === adminFiltersState.status
      const matchesRole = adminFiltersState.role === 'all' || !adminFiltersState.role || a.role === adminFiltersState.role
      return matchesSearch && matchesStatus && matchesRole
    })
  }, [adminsData, adminSearch, adminFiltersState])

  const filteredAlerts = useMemo(() => {
    return securityAlerts.filter(a => {
      const matchesSearch = a.message.toLowerCase().includes(securitySearch.toLowerCase())
      const matchesResolved = securityFiltersState.resolved === 'all' || !securityFiltersState.resolved || String(a.resolved) === securityFiltersState.resolved
      const matchesSeverity = securityFiltersState.severity === 'all' || !securityFiltersState.severity || a.severity === securityFiltersState.severity
      const matchesType = securityFiltersState.type === 'all' || !securityFiltersState.type || a.type === securityFiltersState.type
      return matchesSearch && matchesResolved && matchesSeverity && matchesType
    })
  }, [securityAlerts, securitySearch, securityFiltersState])

  // Admin handlers
  const openCreateAdmin = () => {
    setEditingAdmin(null)
    setAdminForm(initialAdminForm)
    setAdminModalOpen(true)
  }

  const openEditAdmin = (admin) => {
    setEditingAdmin(admin)
    setAdminForm(mapAdminToForm(admin, permissions))
    setAdminModalOpen(true)
  }

  const handleAdminSubmit = (data) => {
    const adminData = mapFormToAdmin(data, editingAdmin)
    console.log('Save admin:', adminData)
    setAdminModalOpen(false)
  }

  const handleAdminFilterChange = (key, value) => {
    setAdminFiltersState(prev => ({ ...prev, [key]: value }))
  }

  const handleAdminSearchChange = (value) => {
    setAdminSearch(value)
  }

  const handleAdminRowAction = (row) => (
    <div className="flex items-center justify-end gap-1">
      {row.id !== currentAdmin.id && (
        <>
          <button className="admin-btn-ghost p-1.5" onClick={() => openEditAdmin(row)} aria-label="Edit admin">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <button className="admin-btn-ghost p-1.5 text-danger-600 hover:bg-danger-50" onClick={() => console.log('Delete admin:', row.id)} aria-label="Delete admin">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </>
      )}
    </div>
  )

  // Security handlers
  const handleSecurityFilterChange = (key, value) => {
    setSecurityFiltersState(prev => ({ ...prev, [key]: value }))
  }

  const handleSecuritySearchChange = (value) => {
    setSecuritySearch(value)
  }

  const handleAlertRowAction = (row) => (
    <div className="flex items-center justify-end gap-1">
      {!row.resolved ? (
        <button className="admin-btn-secondary admin-btn-sm">Resolve</button>
      ) : (
        <span className="text-sm text-success-600 flex items-center gap-1">
          <CheckCircle className="w-4 h-4" />
          Resolved
        </span>
      )}
    </div>
  )

  const sections = [
    { id: 'admins', label: 'Admin Users', icon: Users, badge: adminsData.length },
    { id: 'roles', label: 'Roles & Permissions', icon: Shield, badge: roles.length },
    { id: 'security', label: 'Security', icon: Lock, badge: securityAlerts.filter(s => !s.resolved).length, badgeColor: 'danger' },
    { id: 'audit', label: 'Audit Logs', icon: Activity, badge: null },
  ]

  return (
    <AdminPageLayout
      title="Settings & Security"
      subtitle={`Manage admin accounts, roles, and security for ${uniId.toUpperCase()}`}
      actions={activeSection === 'admins' ? [
        { label: 'Add Admin', icon: <Plus className="w-4 h-4" />, onClick: openCreateAdmin, variant: 'primary' }
      ] : []}
    >
      {/* Section Navigation */}
      <div className="admin-tabs mb-6">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`admin-tab ${activeSection === section.id ? 'admin-tab-active' : ''}`}
          >
            <span className="flex items-center gap-2">
              <section.icon className="w-4 h-4" />
              {section.label}
              {section.badge !== null && section.badge !== undefined && (
                <span className={`admin-badge text-xs px-1.5 py-0.5 admin-badge-${section.badgeColor || 'info'}`}>
                  {section.badge}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Admins Section */}
      {activeSection === 'admins' && (
        <AdminPageSection>
          {/* Stats Bar */}
          <AdminStatBar stats={createAdminStats(filteredAdmins, currentAdmin.id)} />

          {/* Filter Bar */}
          <AdminFilterBar
            searchPlaceholder="Search admins by name, email..."
            searchValue={adminSearch}
            onSearchChange={handleAdminSearchChange}
            filters={adminFilters}
            filterValues={adminFiltersState}
            onFilterChange={handleAdminFilterChange}
          />

          {/* Quick Filters */}
          <AdminQuickFilters
            filters={adminQuickFilters}
            activeFilter={adminFiltersState.status || 'all'}
            onChange={(value) => handleAdminFilterChange('status', value)}
            className="mb-4"
          />

          {/* Table */}
          <AdminDataTable
            columns={createAdminColumns({ onRowAction: handleAdminRowAction, currentAdminId: currentAdmin.id })}
            data={filteredAdmins}
            keyField="id"
            emptyMessage="No admin users found"
            hoverable
            striped
          />
        </AdminPageSection>
      )}

      {/* Roles Section */}
      {activeSection === 'roles' && (
        <AdminPageSection>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {roles.map((role) => (
              <div key={role.id} className="bg-white border border-admin-100 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-admin-900">{role.name}</h3>
                  <span className={`admin-badge text-xs px-2 py-0.5 ${role.color}`}>{role.id}</span>
                </div>
                <p className="text-sm text-admin-500 mb-3">{role.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {rolePermissionsMap[role.id]?.map((perm, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-admin-100 text-admin-600 rounded">
                      {permissions.find(p => p.id === perm)?.name || perm}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <AdminPageSection title="Permission Matrix">
            <AdminDataTable
              columns={permissionMatrixColumns}
              data={permissions}
              keyField="id"
              hoverable
              striped
            />
          </AdminPageSection>
        </AdminPageSection>
      )}

      {/* Security Section */}
      {activeSection === 'security' && (
        <AdminPageSection>
          {/* Security Stats */}
          <AdminStatBar stats={createSecurityStats(securityAlerts)} />

          {/* Security Alerts Table */}
          <AdminPageSection title="Security Alerts" action={<AdminButton variant="ghost" size="sm">View All</AdminButton>}>
            <AdminFilterBar
              searchPlaceholder="Search alerts..."
              searchValue={securitySearch}
              onSearchChange={handleSecuritySearchChange}
              filters={securityFilters}
              filterValues={securityFiltersState}
              onFilterChange={handleSecurityFilterChange}
            />

            <AdminQuickFilters
              filters={securityQuickFilters}
              activeFilter={securityFiltersState.resolved || 'all'}
              onChange={(value) => handleSecurityFilterChange('resolved', value)}
              className="mb-4"
            />

            <AdminDataTable
              columns={securityAlertColumns}
              data={filteredAlerts}
              keyField="id"
              hoverable
              striped
              renderRowActions={handleAlertRowAction}
            />
          </AdminPageSection>

          {/* Security Settings */}
          <AdminPageSection title="Security Settings">
            <div className="bg-white border border-admin-100 rounded-lg p-4">
              <div className="space-y-4">
                {securitySettings.map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between py-3 border-b border-admin-100 last:border-0">
                    <div>
                      <p className="font-medium text-admin-900">{setting.title}</p>
                      <p className="text-sm text-admin-500">{setting.description}</p>
                    </div>
                    {setting.type === 'toggle' && (
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked={setting.defaultValue} className="sr-only peer" />
                        <div className="w-11 h-6 bg-admin-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    )}
                    {setting.type === 'select' && (
                      <select
                        defaultValue={setting.defaultValue}
                        className="admin-input w-40"
                      >
                        {setting.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </AdminPageSection>
        </AdminPageSection>
      )}

      {/* Audit Section */}
      {activeSection === 'audit' && (
        <AdminPageSection>
          <AdminPageSection title="Recent Audit Logs">
            <AdminDataTable
              columns={auditLogColumns}
              data={auditLogs}
              keyField="id"
              hoverable
              striped
            />
          </AdminPageSection>
        </AdminPageSection>
      )}

      {/* Admin Modal */}
      <AdminFormModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        title={editingAdmin ? 'Edit Admin User' : 'Add Admin User'}
        sections={adminFormSections(permissions)}
        initialData={adminForm}
        onSubmit={handleAdminSubmit}
        size="lg"
      />
    </AdminPageLayout>
  )
}

// Role permissions map (used in roles display)
const rolePermissionsMap = {
  superadmin: ['notices', 'events', 'exams', 'results', 'placements', 'settings', 'users'],
  moderator: ['notices', 'events', 'placements'],
  exams: ['exams', 'results'],
  placements: ['placements'],
  content: ['notices'],
}
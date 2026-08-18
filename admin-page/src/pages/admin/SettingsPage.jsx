import React, { useState } from 'react'
import { AdminTable, createColumn } from '../../components/admin/AdminTable'
import { AdminBadge, AdminStatusDot } from '../../components/admin/AdminBadge'
import { AdminModal, AdminInput, AdminTextarea, AdminSelect, AdminButton, FormRow, AdminConfirmDialog, FormSection } from '../../components/admin/AdminForm'
import { formatDate, formatNumber, truncate, getRelativeDate } from '../../utils/format'
import {
  adminUsers,
  roles,
  permissions,
  currentAdmin,
  getRoleById,
} from '../../data/admin'
import { currentAdmin as _currentAdmin } from '../../data/admin'
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

const initialAdminForm = {
  name: '',
  email: '',
  role: 'content',
  status: 'active',
  permissions: [],
}

const rolePermissionsMap = {
  superadmin: ['notices', 'events', 'exams', 'results', 'placements', 'settings', 'users'],
  moderator: ['notices', 'events', 'placements'],
  exams: ['exams', 'results'],
  placements: ['placements'],
  content: ['notices'],
}

export default function SettingsPage() {
  const uniId = currentAdmin.university
  const [activeSection, setActiveSection] = useState('admins')
  const [adminsData] = useState(adminUsers.filter(a => a.university === uniId))
  const [adminModalOpen, setAdminModalOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState(null)
  const [adminForm, setAdminForm] = useState(initialAdminForm)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null })
  const [selectedPermissions, setSelectedPermissions] = useState([])
  const [securityAlerts] = useState([
    { id: 'sec-001', type: 'login_failed', severity: 'low', message: '3 failed login attempts from IP 192.168.1.45', timestamp: '2024-01-20T14:20:00Z', resolved: false },
    { id: 'sec-002', type: 'permission_change', severity: 'medium', message: 'Prof. Anita Sharma granted placements permission', timestamp: '2024-01-19T10:15:00Z', resolved: true },
    { id: 'sec-003', type: 'data_export', severity: 'low', message: 'Rajesh Kumar exported student data report', timestamp: '2024-01-18T16:45:00Z', resolved: true },
    { id: 'sec-004', type: 'password_reset', severity: 'medium', message: 'Vikram Singh requested password reset', timestamp: '2024-01-17T09:30:00Z', resolved: false },
  ])

  const adminColumns = [
    createColumn({ key: 'name', header: 'Name', width: '25%', render: (val, row) => (
      <div>
        <p className="font-medium text-admin-900">{val}</p>
        <p className="text-sm text-admin-500 mt-0.5">{row.email}</p>
      </div>
    )}),
    createColumn({ key: 'role', header: 'Role', width: '150px', render: (val) => (
      <AdminBadge status={val} size="sm" />
    )}),
    createColumn({ key: 'status', header: 'Status', width: '120px', render: (val) => (
      <AdminBadge status={val} size="sm" />
    )}),
    createColumn({ key: 'permissions', header: 'Permissions', width: '30%', render: (val) => (
      <div className="flex flex-wrap gap-1">
        {val.slice(0, 4).map((perm, i) => (
          <span key={i} className="text-xs px-1.5 py-0.5 bg-admin-100 text-admin-600 rounded">{perm}</span>
        ))}
        {val.length > 4 && <span className="text-xs text-admin-400">+{val.length - 4}</span>}
      </div>
    )}),
    createColumn({ key: 'lastLogin', header: 'Last Login', width: '140px', render: (val) => (
      <span className="text-sm text-admin-600">{val ? getRelativeDate(val) : 'Never'}</span>
    )}),
  ]

  const securityColumns = [
    createColumn({ key: 'type', header: 'Event', width: '200px', render: (val, row) => (
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${
          row.severity === 'high' ? 'bg-danger-500' :
          row.severity === 'medium' ? 'bg-warning-500' : 'bg-admin-400'
        }`} />
        <span className="text-sm text-admin-700 capitalize">{val.replace('_', ' ')}</span>
      </div>
    )}),
    createColumn({ key: 'message', header: 'Details', width: '45%', render: (val) => (
      <span className="text-sm text-admin-600">{truncate(val, 70)}</span>
    )}),
    createColumn({ key: 'timestamp', header: 'Time', width: '140px', render: (val) => (
      <span className="text-sm text-admin-600">{getRelativeDate(val)}</span>
    )}),
    createColumn({ key: 'resolved', header: 'Status', width: '120px', render: (val) => (
      <AdminBadge status={val ? 'approved' : 'pending'} size="sm" variant="dot" />
    )}),
  ]

  const openCreateAdmin = () => {
    setEditingAdmin(null)
    setAdminForm(initialAdminForm)
    setSelectedPermissions([])
    setAdminModalOpen(true)
  }

  const openEditAdmin = (admin) => {
    setEditingAdmin(admin)
    setAdminForm({
      name: admin.name,
      email: admin.email,
      role: admin.role,
      status: admin.status,
    })
    setSelectedPermissions(admin.permissions || [])
    setAdminModalOpen(true)
  }

  const handleAdminSubmit = (e) => {
    e.preventDefault()
    console.log('Save admin:', { ...adminForm, permissions: selectedPermissions, university: uniId })
    setAdminModalOpen(false)
  }

  const handleRoleChange = (role) => {
    const perms = rolePermissionsMap[role] || []
    setAdminForm({ ...adminForm, role })
    setSelectedPermissions(perms)
  }

  const togglePermission = (perm) => {
    if (selectedPermissions.includes(perm)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== perm))
    } else {
      setSelectedPermissions([...selectedPermissions, perm])
    }
  }

  const confirmDelete = (id) => {
    setDeleteConfirm({ open: true, id })
  }

  const handleDeleteConfirm = () => {
    console.log('Delete admin:', deleteConfirm.id)
    setDeleteConfirm({ open: false, id: null })
  }

  const sections = [
    { id: 'admins', label: 'Admin Users', icon: Users, badge: adminsData.length },
    { id: 'roles', label: 'Roles & Permissions', icon: Shield, badge: roles.length },
    { id: 'security', label: 'Security', icon: Lock, badge: securityAlerts.filter(s => !s.resolved).length, badgeColor: 'danger' },
    { id: 'audit', label: 'Audit Logs', icon: Activity, badge: null },
  ]

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Settings & Security</h1>
          <p className="admin-page-subtitle">Manage admin accounts, roles, and security for {uniId.toUpperCase()}</p>
        </div>
        {activeSection === 'admins' && (
          <AdminButton variant="primary" onClick={openCreateAdmin}>
            <Plus className="w-4 h-4" />
            Add Admin
          </AdminButton>
        )}
      </header>

      {/* Section Navigation */}
      <div className="admin-tabs mb-6">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`admin-tab ${activeSection === section.id ? 'admin-tab-active admin-tab-underline' : 'admin-tab-underline'} ${section.badgeColor === 'danger' ? 'relative' : ''}`}
            style={{ paddingRight: '1.5rem' }}
          >
            <span className="flex items-center gap-2">
              <section.icon className="w-4 h-4" />
              {section.label}
              {section.badge !== null && section.badge !== undefined && (
                <span className={`admin-badge text-xs px-1.5 py-0.5 ${section.badgeColor === 'danger' ? 'admin-badge-danger' : 'admin-badge-info'}`}>
                  {section.badge}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Admins Section */}
      {activeSection === 'admins' && (
        <div className="admin-section">
          <AdminTable
            columns={adminColumns}
            data={adminsData}
            keyField="id"
            emptyMessage="No admin users found"
            hoverable
            striped
            renderRowActions={(row) => (
              <div className="flex items-center justify-end gap-1">
                {row.id !== currentAdmin.id && (
                  <>
                    <button className="admin-btn-ghost p-1.5" onClick={() => openEditAdmin(row)} aria-label="Edit admin">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="admin-btn-ghost p-1.5 text-danger-600 hover:bg-danger-50" onClick={() => confirmDelete(row.id)} aria-label="Delete admin">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            )}
          />
        </div>
      )}

      {/* Roles Section */}
      {activeSection === 'roles' && (
        <div className="admin-section">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <div key={role.id} className="admin-card">
                <div className="admin-card-header">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-admin-900">{role.name}</h3>
                    <AdminBadge status={role.id} size="sm" />
                  </div>
                </div>
                <div className="admin-card-content">
                  <p className="text-sm text-admin-500 mb-3">{role.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {rolePermissionsMap[role.id]?.map((perm, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-admin-100 text-admin-600 rounded">
                        {permissions.find(p => p.id === perm)?.name || perm}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="admin-section mt-6">
            <h3 className="admin-section-title">Permission Matrix</h3>
            <AdminTable
              columns={[
                createColumn({ key: 'name', header: 'Permission', width: '30%', render: (val) => <span className="font-medium text-admin-900">{val}</span> }),
                createColumn({ key: 'modules', header: 'Actions', width: '70%', render: (val, row) => (
                  <div className="flex flex-wrap gap-1.5">
                    {row.modules.map((mod, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-primary-50 text-primary-700 rounded">{mod}</span>
                    ))}
                  </div>
                )}),
              ]}
              data={permissions}
              keyField="id"
              hoverable
              striped
            />
          </div>
        </div>
      )}

      {/* Security Section */}
      {activeSection === 'security' && (
        <div className="admin-section">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="admin-stat">
              <p className="admin-stat-label">Failed Logins (24h)</p>
              <p className="admin-stat-value text-2xl text-warning-600">12</p>
              <p className="admin-stat-trend text-admin-500">Monitor for brute force</p>
            </div>
            <div className="admin-stat">
              <p className="admin-stat-label">Active Sessions</p>
              <p className="admin-stat-value text-2xl">8</p>
              <p className="admin-stat-trend text-admin-500">3 admins, 5 students</p>
            </div>
            <div className="admin-stat">
              <p className="admin-stat-label">Unresolved Alerts</p>
              <p className="admin-stat-value text-2xl text-danger-600">{securityAlerts.filter(s => !s.resolved).length}</p>
              <p className="admin-stat-trend text-admin-500">Require attention</p>
            </div>
          </div>

          <div className="admin-section">
            <div className="flex items-center justify-between mb-4">
              <h3 className="admin-section-title">Security Alerts</h3>
              <AdminButton variant="ghost" size="sm">View All</AdminButton>
            </div>
            <AdminTable
              columns={securityColumns}
              data={securityAlerts}
              keyField="id"
              hoverable
              striped
              renderRowActions={(row) => (
                <div className="flex items-center justify-end gap-1">
                  {!row.resolved ? (
                    <AdminButton variant="secondary" size="sm">Resolve</AdminButton>
                  ) : (
                    <span className="text-sm text-success-600 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Resolved
                    </span>
                  )}
                </div>
              )}
            />
          </div>

          <div className="admin-section mt-6">
            <h3 className="admin-section-title">Security Settings</h3>
            <div className="admin-card">
              <div className="admin-card-content space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-admin-100">
                  <div>
                    <p className="font-medium text-admin-900">Two-Factor Authentication</p>
                    <p className="text-sm text-admin-500">Require 2FA for all admin accounts</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-admin-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-admin-100">
                  <div>
                    <p className="font-medium text-admin-900">Session Timeout</p>
                    <p className="text-sm text-admin-500">Auto-logout after 30 minutes of inactivity</p>
                  </div>
                  <AdminSelect
                    options={[
                      { value: '15', label: '15 minutes' },
                      { value: '30', label: '30 minutes' },
                      { value: '60', label: '1 hour' },
                      { value: '240', label: '4 hours' },
                    ]}
                    defaultValue="30"
                    className="w-40"
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-admin-100">
                  <div>
                    <p className="font-medium text-admin-900">IP Whitelist</p>
                    <p className="text-sm text-admin-500">Restrict admin access to campus network</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-admin-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-admin-900">Audit Logging</p>
                    <p className="text-sm text-admin-500">Log all admin actions for compliance</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-admin-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Section */}
      {activeSection === 'audit' && (
        <div className="admin-section">
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-section-title">Recent Audit Logs</h3>
            </div>
            <div className="admin-card-content">
              <AdminTable
                columns={[
                  createColumn({ key: 'action', header: 'Action', width: '30%', render: (val) => (
                    <span className="font-medium text-admin-900 capitalize">{val?.replace('_', ' ') || 'Unknown'}</span>
                  )}),
                  createColumn({ key: 'actor', header: 'Actor', width: '20%', render: (val) => (
                    <span className="text-sm text-admin-600">{val || 'System'}</span>
                  )}),
                  createColumn({ key: 'timestamp', header: 'Time', width: '25%', render: (val) => (
                    <span className="text-sm text-admin-600">{val ? getRelativeDate(val) : '—'}</span>
                  )}),
                  createColumn({ key: 'status', header: 'Status', width: '25%', render: (val) => (
                    <AdminBadge status={val || 'completed'} size="sm" variant="dot" />
                  )}),
                ]}
                data={[
                  { id: 'log-001', action: 'notice_published', actor: 'Dr. Rajesh Kumar', timestamp: '2024-01-20T09:00:00Z', status: 'completed' },
                  { id: 'log-002', action: 'event_approved', actor: 'Dr. Rajesh Kumar', timestamp: '2024-01-19T10:00:00Z', status: 'completed' },
                  { id: 'log-003', action: 'exam_scheduled', actor: 'Dr. Vikram Singh', timestamp: '2024-01-19T11:00:00Z', status: 'completed' },
                  { id: 'log-004', action: 'user_permission_changed', actor: 'Dr. Rajesh Kumar', timestamp: '2024-01-18T14:15:00Z', status: 'completed' },
                  { id: 'log-005', action: 'result_published', actor: 'Dr. Vikram Singh', timestamp: '2024-01-17T10:00:00Z', status: 'completed' },
                  { id: 'log-006', action: 'login_failed', actor: 'Unknown IP', timestamp: '2024-01-16T22:30:00Z', status: 'failed' },
                  { id: 'log-007', action: 'job_posted', actor: 'Prof. Anita Sharma', timestamp: '2024-01-15T14:20:00Z', status: 'completed' },
                  { id: 'log-008', action: 'settings_updated', actor: 'Dr. Rajesh Kumar', timestamp: '2024-01-14T11:00:00Z', status: 'completed' },
                ]}
                keyField="id"
                hoverable
                striped
              />
            </div>
          </div>
        </div>
      )}

      {/* Admin Modal */}
      <AdminModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        title={editingAdmin ? 'Edit Admin User' : 'Add Admin User'}
        size="lg"
      >
        <form onSubmit={handleAdminSubmit} className="space-y-4">
          <AdminInput label="Full Name" value={adminForm.name} onChange={(e) => setAdminForm({...adminForm, name: e.target.value})} required />
          <AdminInput label="Email" type="email" value={adminForm.email} onChange={(e) => setAdminForm({...adminForm, email: e.target.value})} required />
          <FormRow cols={2}>
            <AdminSelect
              label="Role"
              options={roles.map(r => ({ value: r.id, label: r.name }))}
              value={adminForm.role}
              onChange={(e) => handleRoleChange(e.target.value)}
            />
            <AdminSelect
              label="Status"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'suspended', label: 'Suspended' },
              ]}
              value={adminForm.status}
              onChange={(e) => setAdminForm({...adminForm, status: e.target.value})}
            />
          </FormRow>

          <FormSection title="Permissions" description="Select modules this admin can access">
            <div className="space-y-2">
              {permissions.map((perm) => (
                <div key={perm.id} className="flex items-center justify-between p-3 border border-admin-200">
                  <div>
                    <p className="font-medium text-admin-900 text-sm">{perm.name}</p>
                    <p className="text-xs text-admin-500">{perm.modules.join(', ')}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(perm.id)}
                      onChange={() => togglePermission(perm.id)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-admin-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
              ))}
            </div>
          </FormSection>

          <div className="admin-modal-footer">
            <AdminButton variant="ghost" type="button" onClick={() => setAdminModalOpen(false)}>Cancel</AdminButton>
            <AdminButton variant="primary" type="submit">{editingAdmin ? 'Update' : 'Add Admin'}</AdminButton>
          </div>
        </form>
      </AdminModal>

      {/* Delete Confirm Dialog */}
      <AdminConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Admin User"
        message="Are you sure you want to delete this admin user? They will lose access to the admin panel immediately."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
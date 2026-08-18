import React from 'react'
import { currentUser, getAdminUser, getAdminUniversity, hasPermission } from '../../data'
import { Shield, Users, Settings, Lock, Key, Bell, Database, Activity, Plus, Edit, Trash2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { AdminTable, createColumn } from '../../components/admin/AdminTable'
import { AdminBadge } from '../../components/admin/AdminBadge'
import { AdminModal, AdminInput, AdminSelect, AdminButton, FormRow } from '../../components/admin/AdminForm'

const adminUsers = [
  { id: 'admin-001', name: 'Dr. Admin User', email: 'admin@cvrp.edu.in', university: 'cvrp', role: 'superadmin', status: 'active', permissions: ['notices', 'events', 'exams', 'results', 'placements', 'settings', 'users'], lastLogin: '2024-01-18T08:30:00Z' },
  { id: 'admin-002', name: 'Prof. Anita Sharma', email: 'anita@cvrp.edu.in', university: 'cvrp', role: 'placements', status: 'active', permissions: ['placements'], lastLogin: '2024-01-19T10:15:00Z' },
  { id: 'admin-003', name: 'Dr. Vikram Singh', email: 'vikram@cvrp.edu.in', university: 'cvrp', role: 'exams', status: 'active', permissions: ['exams', 'results'], lastLogin: '2024-01-17T09:30:00Z' },
]

const roles = [
  { id: 'superadmin', name: 'Super Admin', description: 'Full access to all modules and user management' },
  { id: 'moderator', name: 'Moderator', description: 'Manage notices, events, and placements' },
  { id: 'exams', name: 'Exam Controller', description: 'Schedule exams and publish results' },
  { id: 'placements', name: 'Placement Officer', description: 'Manage job postings and company relations' },
  { id: 'content', name: 'Content Manager', description: 'Create and publish notices only' },
]

export default function SettingsPage() {
  const uniId = currentUser.university
  const adminUser = getAdminUser(uniId)
  const university = getAdminUniversity(uniId)
  const [activeSection, setActiveSection] = React.useState('admins')
  const [adminsData] = React.useState(adminUsers.filter(a => a.university === uniId))
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingAdmin, setEditingAdmin] = React.useState(null)

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
    createColumn({ key: 'lastLogin', header: 'Last Login', width: '140px', render: (val) => (
      <span className="text-sm text-admin-600">{val ? val : 'Never'}</span>
    )}),
  ]

  const sections = [
    { id: 'admins', label: 'Admin Users', icon: Users, badge: adminsData.length },
    { id: 'roles', label: 'Roles & Permissions', icon: Shield, badge: roles.length },
    { id: 'security', label: 'Security', icon: Lock, badge: 2, badgeColor: 'danger' },
  ]

  const openCreate = () => {
    setEditingAdmin(null)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings & Security</h1>
          <p className="text-gray-500 mt-1">Manage admin accounts, roles, and security for {university.name}</p>
        </div>
        {activeSection === 'admins' && (
          <AdminButton variant="primary" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Add Admin
          </AdminButton>
        )}
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeSection === section.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <section.icon className="w-4 h-4" />
              {section.label}
              {section.badge !== null && section.badge !== undefined && (
                <span className={`px-2 py-0.5 text-xs rounded ${
                  section.badgeColor === 'danger' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {section.badge}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Admins Section */}
      {activeSection === 'admins' && (
        <div className="border border-gray-200 bg-white">
          <AdminTable
            columns={adminColumns}
            data={adminsData}
            keyField="id"
            emptyMessage="No admin users found"
            hoverable
            striped
            renderRowActions={(row) => (
              <div className="flex items-center justify-end gap-1">
                {row.id !== adminUser.id && (
                  <>
                    <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors" onClick={() => openCreate()} aria-label="Edit admin">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" aria-label="Delete admin">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div key={role.id} className="border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{role.name}</h3>
                <AdminBadge status={role.id} size="sm" />
              </div>
              <p className="text-sm text-gray-500">{role.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Security Section */}
      {activeSection === 'security' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border border-gray-200 bg-white p-6">
              <p className="text-sm text-gray-500">Failed Logins (24h)</p>
              <p className="text-2xl font-bold text-amber-600">12</p>
              <p className="text-sm text-gray-500 mt-1">Monitor for brute force</p>
            </div>
            <div className="border border-gray-200 bg-white p-6">
              <p className="text-sm text-gray-500">Active Sessions</p>
              <p className="text-2xl font-bold text-gray-900">8</p>
              <p className="text-sm text-gray-500 mt-1">3 admins, 5 students</p>
            </div>
            <div className="border border-gray-200 bg-white p-6">
              <p className="text-sm text-gray-500">Unresolved Alerts</p>
              <p className="text-2xl font-bold text-red-600">2</p>
              <p className="text-sm text-gray-500 mt-1">Require attention</p>
            </div>
          </div>

          <div className="border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-500">Require 2FA for all admin accounts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Session Timeout</p>
                  <p className="text-sm text-gray-500">Auto-logout after 30 minutes of inactivity</p>
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
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">IP Whitelist</p>
                  <p className="text-sm text-gray-500">Restrict admin access to campus network</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-900">Audit Logging</p>
                  <p className="text-sm text-gray-500">Log all admin actions for compliance</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
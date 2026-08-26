import { createColumn } from '../AdminTable'
import { AdminBadge, AdminStatusDot } from '../AdminBadge'
import { formatDate, formatNumber, truncate, getRelativeDate } from '../../../utils/format'
import { CheckCircle, AlertTriangle, Shield, Database, Activity, Key, Bell, Lock, Eye, EyeOff } from 'lucide-react'

// Security alert columns
export const securityAlertColumns = [
  createColumn({
    key: 'type',
    header: 'Event',
    width: '200px',
    sortable: true,
    render: (val, row) => (
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${
          row.severity === 'high' ? 'bg-danger-500' :
          row.severity === 'medium' ? 'bg-warning-500' : 'bg-admin-400'
        }`} />
        <span className="text-sm text-admin-700 capitalize">{val.replace('_', ' ')}</span>
      </div>
    ),
  }),
  createColumn({
    key: 'severity',
    header: 'Severity',
    width: '100px',
    sortable: true,
    render: (val) => (
      <AdminBadge status={val} size="sm" />
    ),
  }),
  createColumn({
    key: 'message',
    header: 'Details',
    width: '45%',
    sortable: false,
    render: (val) => (
      <span className="text-sm text-admin-600">{truncate(val, 70)}</span>
    ),
  }),
  createColumn({
    key: 'timestamp',
    header: 'Time',
    width: '140px',
    sortable: true,
    render: (val) => (
      <span className="text-sm text-admin-600">{getRelativeDate(val)}</span>
    ),
  }),
  createColumn({
    key: 'resolved',
    header: 'Status',
    width: '120px',
    sortable: true,
    render: (val) => (
      <AdminBadge status={val ? 'approved' : 'pending'} size="sm" variant="dot" />
    ),
  }),
]

// Audit log columns
export const auditLogColumns = [
  createColumn({
    key: 'action',
    header: 'Action',
    width: '25%',
    sortable: true,
    render: (val) => (
      <span className="font-medium text-admin-900 capitalize">{val?.replace('_', ' ') || 'Unknown'}</span>
    ),
  }),
  createColumn({
    key: 'actor',
    header: 'Actor',
    width: '20%',
    sortable: true,
    render: (val) => (
      <span className="text-sm text-admin-600">{val || 'System'}</span>
    ),
  }),
  createColumn({
    key: 'target',
    header: 'Target',
    width: '20%',
    sortable: true,
    render: (val) => (
      <span className="text-sm text-admin-600">{val || '—'}</span>
    ),
  }),
  createColumn({
    key: 'timestamp',
    header: 'Time',
    width: '20%',
    sortable: true,
    render: (val) => (
      <span className="text-sm text-admin-600">{val ? getRelativeDate(val) : '—'}</span>
    ),
  }),
  createColumn({
    key: 'status',
    header: 'Status',
    width: '15%',
    sortable: true,
    render: (val) => (
      <AdminBadge status={val || 'completed'} size="sm" variant="dot" />
    ),
  }),
]

// Security stats
export function createSecurityStats(alerts) {
  const unresolved = alerts.filter(a => !a.resolved).length
  const high = alerts.filter(a => a.severity === 'high' && !a.resolved).length
  const medium = alerts.filter(a => a.severity === 'medium' && !a.resolved).length

  return [
    { key: 'unresolved', label: 'Unresolved Alerts', value: unresolved, trend: 0, icon: () => <AlertTriangle className="w-5 h-5 text-danger-600" />, iconBg: 'bg-danger-100' },
    { key: 'high', label: 'High Severity', value: high, trend: 0, icon: () => <AlertTriangle className="w-5 h-5 text-danger-600" />, iconBg: 'bg-danger-100' },
    { key: 'medium', label: 'Medium Severity', value: medium, trend: 0, icon: () => <AlertTriangle className="w-5 h-5 text-warning-600" />, iconBg: 'bg-warning-100' },
    { key: 'total', label: 'Total Alerts', value: alerts.length, trend: 0, icon: () => <Activity className="w-5 h-5 text-info-600" />, iconBg: 'bg-info-100' },
  ]
}

// Security settings options (for the security settings section)
export const securitySettings = [
  {
    key: 'twoFactor',
    title: 'Two-Factor Authentication',
    description: 'Require 2FA for all admin accounts',
    type: 'toggle',
    defaultValue: true,
  },
  {
    key: 'sessionTimeout',
    title: 'Session Timeout',
    description: 'Auto-logout after inactivity',
    type: 'select',
    options: [
      { value: '15', label: '15 minutes' },
      { value: '30', label: '30 minutes' },
      { value: '60', label: '1 hour' },
      { value: '240', label: '4 hours' },
    ],
    defaultValue: '30',
  },
  {
    key: 'ipWhitelist',
    title: 'IP Whitelist',
    description: 'Restrict admin access to campus network',
    type: 'toggle',
    defaultValue: false,
  },
  {
    key: 'auditLogging',
    title: 'Audit Logging',
    description: 'Log all admin actions for compliance',
    type: 'toggle',
    defaultValue: true,
  },
]

// Quick filter configurations for security alerts
export const securityQuickFilters = [
  { value: 'all', label: 'All', count: null },
  { value: 'unresolved', label: 'Unresolved', count: null },
  { value: 'resolved', label: 'Resolved', count: null },
  { value: 'high', label: 'High', count: null },
  { value: 'medium', label: 'Medium', count: null },
  { value: 'low', label: 'Low', count: null },
]

// Filter bar configurations for security alerts
export const securityFilters = [
  {
    key: 'resolved',
    type: 'select',
    placeholder: 'Status',
    options: [
      { value: 'true', label: 'Resolved' },
      { value: 'false', label: 'Unresolved' },
    ],
    allLabel: 'All',
    width: 40,
  },
  {
    key: 'severity',
    type: 'select',
    placeholder: 'Severity',
    options: [
      { value: 'high', label: 'High' },
      { value: 'medium', label: 'Medium' },
      { value: 'low', label: 'Low' },
    ],
    allLabel: 'All',
    width: 40,
  },
  {
    key: 'type',
    type: 'select',
    placeholder: 'Event Type',
    options: [
      { value: 'login_failed', label: 'Failed Login' },
      { value: 'permission_change', label: 'Permission Change' },
      { value: 'data_export', label: 'Data Export' },
      { value: 'password_reset', label: 'Password Reset' },
    ],
    allLabel: 'All Types',
    width: 48,
  },
]
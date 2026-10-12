// Campus Events - for admin approval/management
import { makeRemoteList } from './store'

export const events = makeRemoteList('events', 'events')

export const getEventsByUniversity = (uniId) => events.filter(e => e.university === uniId)
export const getEventsByStatus = (status) => events.filter(e => e.status === status)
export const getEventsByApprovalStatus = (approvalStatus) => events.filter(e => e.approvalStatus === approvalStatus)
export const getPendingEvents = (uniId) => events.filter(e => e.university === uniId && e.approvalStatus === 'pending')
export const getApprovedEvents = (uniId) => events.filter(e => e.university === uniId && e.approvalStatus === 'approved')
export const getEventById = (id) => events.find(e => e.id === id)
export const getUpcomingEvents = (uniId) => events.filter(e => e.university === uniId && new Date(e.startDate) > new Date())
export const getPastEvents = (uniId) => events.filter(e => e.university === uniId && new Date(e.endDate) < new Date())
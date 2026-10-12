// Campus Notices & Announcements
import { makeRemoteList } from './store'

// Backed by the API (admin scope, own university); see makeRemoteList in ./store.
export const notices = makeRemoteList('notices', 'notices')

export const getNotice = (id) => notices.find(n => n.id === id)
export const getNoticesByUniversity = (uniId) => notices.filter(n => n.university === uniId)
export const getNoticesByStatus = (status) => notices.filter(n => n.status === status)
export const getPublishedNotices = (uniId) => notices.filter(n => n.university === uniId && n.status === 'published' && new Date(n.expiresAt) > new Date())
export const getNoticesByCategory = (category) => notices.filter(n => n.category === category)
export const getPinnedNotices = (uniId) => notices.filter(n => n.university === uniId && n.pinned && n.status === 'published')
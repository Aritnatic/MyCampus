// Exam schedules and results
import { makeRemoteList } from './store'

// Backed by the API (admin scope, own university); see makeRemoteList in ./store.
export const exams = makeRemoteList('exams', 'exams')
export const results = makeRemoteList('results', 'results')

export const getExamsByUniversity = (uniId) => exams.filter(e => e.university === uniId)
export const getExamsByStatus = (status) => exams.filter(e => e.status === status)
export const getExamsByBranch = (branch) => exams.filter(e => e.branch === branch)
export const getExamById = (id) => exams.find(e => e.id === id)

export const getResultsByUniversity = (uniId) => results.filter(r => r.university === uniId)
export const getResultsByStatus = (status) => results.filter(r => r.status === status)
export const getResultByExamId = (examId) => results.find(r => r.examId === examId)
export const getResultById = (id) => results.find(r => r.id === id)

export const getPendingResults = (uniId) => results.filter(r => r.university === uniId && r.status === 'pending')
export const getPublishedResults = (uniId) => results.filter(r => r.university === uniId && r.status === 'published')
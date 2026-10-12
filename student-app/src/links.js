// Where a search hit or a recommendation opens. Discovery kinds share one detail screen.
const DISCOVER_KIND = { people: 'people', project: 'projects', startup: 'startups', research: 'research', job: 'jobs', faculty: 'faculty' }

export function hrefFor(kind, id) {
  if (kind === 'notice') return `/notice/${id}`
  if (kind === 'event') return `/event/${id}`
  if (kind === 'note') return '/notes'
  return DISCOVER_KIND[kind] ? `/discover/${DISCOVER_KIND[kind]}/${id}` : null
}

export const KIND_ICON = {
  notice: 'newspaper-outline', event: 'ticket-outline', note: 'book-outline', people: 'person-outline', project: 'rocket-outline',
  startup: 'bulb-outline', research: 'flask-outline', job: 'briefcase-outline', faculty: 'school-outline',
}

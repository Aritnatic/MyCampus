import { useMemo } from 'react'
import { useApi } from './useApi'

// How you relate to other people and to listings: connections, mentor requests and join requests.
// Detail screens use this to show "Request sent" / "Connected" instead of offering the action twice.
export function useRelations() {
  const connections = useApi('/connections')
  const collab = useApi('/collab')

  const relations = useMemo(() => {
    const person = new Map() // userId -> { status: 'connected' | 'sent' | 'incoming', id, kinds: Set }
    const note = (userId, status, id, kind) => {
      const cur = person.get(userId) ?? { status, id, kinds: new Set() }
      cur.kinds.add(kind)
      if (status === 'connected' || cur.status !== 'connected') Object.assign(cur, { status, id })
      person.set(userId, cur)
    }
    for (const c of connections.data?.accepted ?? []) note(c.person.id, 'connected', c.id, c.kind)
    for (const c of connections.data?.outgoing ?? []) note(c.person.id, 'sent', c.id, c.kind)
    for (const c of connections.data?.incoming ?? []) note(c.person.id, 'incoming', c.id, c.kind)
    const target = new Map() // `${kind}:${id}` -> request
    for (const r of collab.data?.sent ?? []) if (r.target) target.set(`${r.target.kind}:${r.target.id}`, r)
    return { person, target }
  }, [connections.data, collab.data])

  return { ...relations, loading: connections.loading || collab.loading, reload: () => { connections.reload(); collab.reload() } }
}

import { Router } from 'express'
import { requireAuth, requirePermission } from '../auth.js'
import { audit, docs } from '../db.js'
import { HttpError, parse, wrap, z } from '../http.js'

export const campusRoutes = Router()
campusRoutes.use(requireAuth)

const loadMap = (user) => {
  if (!user.university) throw new HttpError(403, 'The campus map is for verified campus members.')
  const map = docs.get('campus_map', `map-${user.university}`)
  if (!map) throw new HttpError(404, "Your campus hasn't published a map yet.")
  return map
}

campusRoutes.get('/campus/map', wrap(async (req, res) => { res.json(loadMap(req.user)) }))

const centre = (b) => ({ x: b.x + (b.width ?? 0) / 2, y: b.y + (b.height ?? 0) / 2 })
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

// A landmark isn't on the path graph, so it routes via the closest building.
function nodeFor(map, id) {
  const building = map.buildings.find((b) => b.id === id)
  if (building) return { building, via: null }
  const landmark = map.landmarks?.find((l) => l.id === id)
  if (!landmark) return null
  const nearest = map.buildings.reduce((best, b) => (dist(centre(b), landmark) < dist(centre(best), landmark) ? b : best))
  return { building: nearest, via: landmark }
}

// Dijkstra over the building graph; edge weight is straight-line distance between centres.
function shortestPath(map, from, to) {
  const pos = Object.fromEntries(map.buildings.map((b) => [b.id, centre(b)]))
  const adj = {}
  for (const p of map.paths) {
    if (!pos[p.from] || !pos[p.to]) continue
    const w = dist(pos[p.from], pos[p.to])
    ;(adj[p.from] ??= []).push([p.to, w])
    ;(adj[p.to] ??= []).push([p.from, w])
  }
  const best = { [from]: 0 }
  const prev = {}
  const todo = new Set(Object.keys(pos))
  while (todo.size) {
    let u = null
    for (const n of todo) if (best[n] !== undefined && (u === null || best[n] < best[u])) u = n
    if (u === null) break
    todo.delete(u)
    if (u === to) break
    for (const [v, w] of adj[u] ?? []) {
      if (best[u] + w < (best[v] ?? Infinity)) { best[v] = best[u] + w; prev[v] = u }
    }
  }
  if (best[to] === undefined) return null
  const ids = [to]
  while (ids[0] !== from) ids.unshift(prev[ids[0]])
  return { ids, distance: Math.round(best[to]) }
}

campusRoutes.get('/campus/route', wrap(async (req, res) => {
  const { from, to } = parse(z.object({ from: z.string().min(1), to: z.string().min(1) }), req.query)
  const map = loadMap(req.user)
  const a = nodeFor(map, from)
  const b = nodeFor(map, to)
  if (!a || !b) throw new HttpError(404, 'Unknown place. Use a building or landmark id from the map.')
  const route = shortestPath(map, a.building.id, b.building.id)
  if (!route) throw new HttpError(404, 'No walking path connects those places.')
  const name = (id) => map.buildings.find((x) => x.id === id).name
  res.json({
    from: a.via ?? a.building, to: b.via ?? b.building,
    path: route.ids, distance: route.distance, // map units, not metres
    steps: route.ids.map((id) => ({ id, name: name(id) })),
  })
}))

// "Where's the DSP lab?" — matches building names, departments and facilities.
campusRoutes.get('/campus/search', wrap(async (req, res) => {
  const { q } = parse(z.object({ q: z.string().trim().min(2).max(80) }), req.query)
  const needle = q.toLowerCase()
  const map = loadMap(req.user)
  const hits = []
  for (const b of map.buildings) {
    const facility = b.facilities?.find((f) => f.toLowerCase().includes(needle))
    const dept = b.departments?.find((d) => d.toLowerCase().includes(needle))
    if (b.name.toLowerCase().includes(needle)) hits.push({ building: b, match: b.name })
    else if (facility) hits.push({ building: b, match: facility })
    else if (dept) hits.push({ building: b, match: dept })
  }
  for (const l of map.landmarks ?? []) if (l.name.toLowerCase().includes(needle)) hits.push({ landmark: l, match: l.name })
  res.json(hits)
}))

// Admins with settings access can publish/replace their campus map.
const point = z.number().min(0).max(5000)
const mapBody = z.object({
  buildings: z.array(z.object({
    id: z.string().min(1).max(40), name: z.string().min(1).max(100), shortName: z.string().max(30).optional(),
    x: point, y: point, width: z.number().min(1).max(1000), height: z.number().min(1).max(1000),
    floors: z.array(z.string().max(10)).max(30).optional(), departments: z.array(z.string().max(100)).max(20).optional(),
    facilities: z.array(z.string().max(100)).max(50).optional(), color: z.string().max(20).optional(), icon: z.string().max(10).optional(),
  })).max(200),
  paths: z.array(z.object({ id: z.string().max(40), from: z.string().max(40), to: z.string().max(40), type: z.string().max(20).optional() })).max(1000),
  landmarks: z.array(z.object({ id: z.string().max(40), name: z.string().max(100), x: point, y: point, icon: z.string().max(10).optional(), type: z.string().max(20).optional() })).max(200).optional(),
})

campusRoutes.put('/admin/campus-map', requirePermission('settings'), wrap(async (req, res) => {
  const body = parse(mapBody, req.body)
  const ids = new Set(body.buildings.map((b) => b.id))
  const dangling = body.paths.find((p) => !ids.has(p.from) || !ids.has(p.to))
  if (dangling) throw new HttpError(400, `Path ${dangling.id} refers to a building that doesn't exist.`)
  const saved = docs.put('campus_map', { ...body, id: `map-${req.user.university}`, university: req.user.university, status: 'published' })
  audit(req.user, 'campus.map_update', saved.id)
  res.json(saved)
}))

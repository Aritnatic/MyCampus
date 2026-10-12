import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { as, call, stop } from './helpers.js'

after(stop)

describe('search', () => {
  it('understands abbreviations and word forms ("ml" finds machine learning)', async () => {
    const r = await call('/search?q=' + encodeURIComponent('ml projects'), { token: await as('aritra') })
    assert.equal(r.status, 200)
    assert.ok(r.body.length > 0)
    const text = r.body.map((x) => `${x.title} ${x.subtitle}`).join(' ').toLowerCase()
    assert.match(text, /learning|ml|data|ai/)
    assert.ok(r.body.every((x, i, a) => i === 0 || a[i - 1].score >= x.score), 'results are ranked best-first')
  })

  it('only returns what the searcher is allowed to see', async () => {
    const notice = (await call('/content/notices', { token: await as('aritra') })).body[0]
    const q = notice.title.split(' ').slice(0, 3).join(' ')
    const mine = await call('/search?q=' + encodeURIComponent(q), { token: await as('aritra') })
    assert.ok(mine.body.some((x) => x.kind === 'notice' && x.id === notice.id))
    const kiit = await call('/search?q=' + encodeURIComponent(q), { token: await as('rahul') })
    assert.ok(!kiit.body.some((x) => x.kind === 'notice'), 'another campus must not find campus notices')
    const indiv = await call('/search?q=' + encodeURIComponent(q), { token: await as('individual') })
    assert.ok(!indiv.body.some((x) => ['notice', 'faculty'].includes(x.kind)))
  })

  it('never surfaces students who are not visible to you', async () => {
    const rahul = (await call('/me', { token: await as('rahul') })).body
    const r = await call('/search?q=' + encodeURIComponent(rahul.name), { token: await as('aritra') })
    assert.ok(!r.body.some((x) => x.kind === 'people' && x.id === rahul.id))
  })

  it('rejects empty or tiny queries', async () => {
    assert.equal((await call('/search?q=a', { token: await as('aritra') })).status, 400)
  })
})

describe('people & mentors', () => {
  it('mentor filter returns only mentors, with no private fields', async () => {
    const r = await call('/discover/people?scope=all&mentors=1', { token: await as('individual') })
    assert.equal(r.status, 200)
    assert.ok(r.body.length > 0)
    assert.ok(r.body.every((p) => p.item.mentor.open === true))
    assert.ok(r.body.every((p) => !('email' in p.item)))
  })

  it('students can opt in or out of being a discoverable mentor', async () => {
    const aritra = await as('aritra')
    const me = (await call('/me', { token: aritra })).body
    const on = await call('/me', { token: aritra, method: 'PATCH', body: { mentor: { open: true, topics: ['React', 'System design'] } } })
    assert.equal(on.body.mentor.open, true)
    const seen = await call('/discover/people?scope=all&mentors=1', { token: await as('rahul') })
    assert.ok(seen.body.some((p) => p.item.id === me.id))
    await call('/me', { token: aritra, method: 'PATCH', body: { mentor: { open: false, topics: [] } } })
    const gone = await call('/discover/people?scope=all&mentors=1', { token: await as('rahul') })
    assert.ok(!gone.body.some((p) => p.item.id === me.id))
  })
})

describe('profile editing', () => {
  it('updates allowed fields, normalises tags, and refuses privileged ones', async () => {
    const token = await as('sneha')
    const r = await call('/me', { token, method: 'PATCH', body: { bio: 'Likes embedded systems.', skills: ['C', 'c', 'Rust'], lookingFor: ['Hardware cofounder'] } })
    assert.equal(r.status, 200)
    assert.equal(r.body.skills.length, 2) // "C" and "c" collapse into one
    assert.ok(r.body.skills.includes('Rust'))

    for (const body of [{ verified: false }, { university: 'kiit' }, { rating: 5 }, { role: 'admin' }, { email: 'x@y.com' }]) {
      assert.equal((await call('/me', { token, method: 'PATCH', body })).status, 400, JSON.stringify(body))
    }
    assert.equal((await call('/me', { token, method: 'PATCH', body: { bio: 'x'.repeat(501) } })).status, 400)
  })
})

describe('collaboration matching', () => {
  it('suggests projects, startups, research and people with reasons', async () => {
    const token = await as('aritra')
    const r = await call('/matches', { token })
    assert.equal(r.status, 200)
    for (const key of ['projects', 'startups', 'research', 'people']) assert.ok(Array.isArray(r.body[key]), key)
    const all = [...r.body.projects, ...r.body.startups, ...r.body.research, ...r.body.people]
    assert.ok(all.length > 0)
    assert.ok(all.every((m) => m.score > 0 && m.reasons.length > 0))
    // Reasons quote real phrases rather than loose word fragments.
    for (const m of all) for (const reason of m.reasons) assert.doesNotMatch(reason, /\w, \w+ —|^[a-z]/, reason)
    assert.ok(r.body.research.some((m) => m.reasons.some((x) => /^Requires Machine Learning — you list (TensorFlow|Machine Learning)/.test(x))))
    // Projects you're already on are never suggested.
    const myId = (await call('/me', { token })).body.id
    assert.ok(!r.body.projects.some((m) => (m.item.teamIds ?? []).includes(myId)))
  })
})

describe('campus map', () => {
  it('finds the shortest walking route between buildings and from landmarks', async () => {
    const token = await as('aritra')
    const route = await call('/campus/route?from=block-a&to=canteen', { token })
    assert.equal(route.status, 200)
    assert.equal(route.body.path[0], 'block-a')
    assert.equal(route.body.path.at(-1), 'canteen')
    assert.ok(route.body.distance > 0)
    assert.equal((await call('/campus/route?from=fountain&to=library', { token })).status, 200)
    assert.equal((await call('/campus/route?from=block-a&to=atlantis', { token })).status, 404)
  })

  it('keeps every landmark in open space, not inside a building', async () => {
    const { buildings, landmarks } = (await call('/campus/map', { token: await as('aritra') })).body
    for (const l of landmarks) {
      const clash = buildings.find((b) => l.x >= b.x && l.x <= b.x + b.width && l.y >= b.y && l.y <= b.y + b.height)
      assert.equal(clash, undefined, `${l.name} is inside ${clash?.name}`)
    }
  })

  it('searches facilities and rejects other campuses', async () => {
    const hits = await call('/campus/search?q=DSP', { token: await as('aritra') })
    assert.ok(hits.body.some((h) => h.building?.id === 'block-b'))
    assert.equal((await call('/campus/map', { token: await as('rahul') })).status, 404) // KIIT hasn't published one
  })
})

describe('career guidance', () => {
  it('shows a private skill-gap for each path and jobs that ask for those skills', async () => {
    const token = await as('aritra')
    const paths = await call('/career/paths', { token })
    assert.ok(paths.body.length >= 6)
    assert.ok(paths.body.every((p) => p.readiness >= 0 && p.readiness <= 100))

    const sw = await call('/career/paths/career-software', { token })
    assert.equal(sw.status, 200)
    assert.ok(sw.body.core.have.map((s) => s.toLowerCase()).includes('javascript')) // Aritra lists JavaScript
    assert.ok(sw.body.core.have.includes('SQL'), 'PostgreSQL should count as SQL')
    assert.equal(sw.body.core.via.SQL, 'PostgreSQL')
    assert.ok(sw.body.core.missing.length > 0)
    assert.ok(sw.body.roadmap.length > 0)
    assert.ok(sw.body.jobs.every((j) => j.onPath.length > 0))
    assert.equal((await call('/career/paths/nope', { token })).status, 404)
  })
})

describe('search intent', () => {
  it('treats kind words as intent: "projects" browses projects, "internships" ranks jobs first', async () => {
    const token = await as('aritra')
    const browse = (await call('/search?q=projects', { token })).body
    assert.ok(browse.length > 0)
    assert.ok(browse.every((h) => h.kind === 'project'), 'a bare kind word should list only that kind')
    const jobs = (await call('/search?q=internships', { token })).body
    assert.equal(jobs[0].kind, 'job')
  })
})

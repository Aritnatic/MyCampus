import { API_URL, request } from './api'

// Live events from the API over Server-Sent Events, using fetch streaming (works on phone and web).
// The server wants a one-time ticket instead of the access token, so tokens never appear in URLs.
// Reconnects with backoff until stopped; callers also refetch on foreground so a missed event can't stick.
export function connectStream({ onEvent, onStatus = () => {} }) {
  let stopped = false
  let controller = null

  async function once() {
    const { ticket } = await request('/stream/ticket', { method: 'POST' })
    controller = new AbortController()
    const res = await fetch(`${API_URL}/stream?ticket=${ticket}`, { signal: controller.signal, headers: { Accept: 'text/event-stream' } })
    if (!res.ok || !res.body) throw new Error(`stream ${res.status}`)
    onStatus('open')

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    for (;;) {
      const { value, done } = await reader.read()
      if (done) return
      buffer += decoder.decode(value, { stream: true })
      let split
      while ((split = buffer.indexOf('\n\n')) !== -1) {
        const raw = buffer.slice(0, split)
        buffer = buffer.slice(split + 2)
        let type = 'message'
        let data = ''
        for (const line of raw.split('\n')) {
          if (line.startsWith('event:')) type = line.slice(6).trim()
          else if (line.startsWith('data:')) data += line.slice(5).trim()
        }
        if (!data) continue // heartbeat comment
        try { onEvent(type, JSON.parse(data)) } catch { /* ignore a malformed frame */ }
      }
    }
  }

  ;(async () => {
    let delay = 1000
    while (!stopped) {
      try {
        await once()
        delay = 1000
      } catch (err) {
        if (stopped) break
        // 401 means the session ended: stop quietly, sign-out is handled elsewhere.
        if (err?.status === 401) break
      }
      onStatus('closed')
      if (stopped) break
      await new Promise((r) => setTimeout(r, delay))
      delay = Math.min(delay * 2, 30_000)
    }
  })()

  return () => {
    stopped = true
    controller?.abort()
  }
}

import { useCallback, useEffect, useState } from 'react'
import { request } from '../api'

// Fetches `path` (skipped while null) and refetches on change or `reload()`. Optional polling for live screens.
// The result is tied to the path it was fetched for, so switching filters never shows the previous
// filter's rows under the new one.
export function useAdminApi(path, { pollMs } = {}) {
  const [state, setState] = useState({ path: null, data: null, error: null })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!path) return undefined
    let stale = false
    const load = () => request(path)
      .then((data) => !stale && setState({ path, data, error: null }))
      .catch((e) => !stale && setState((s) => (s.path === path && s.data ? s : { path, data: null, error: e.message })))
    load()
    const id = pollMs ? setInterval(load, pollMs) : null
    return () => { stale = true; if (id) clearInterval(id) }
  }, [path, tick, pollMs])

  const reload = useCallback(() => setTick((n) => n + 1), [])
  if (!path) return { data: null, error: null, loading: false, reload }
  if (state.path !== path) return { data: null, error: null, loading: true, reload }
  return { data: state.data, error: state.error, loading: false, reload }
}

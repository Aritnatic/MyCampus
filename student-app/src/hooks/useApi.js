import { useCallback, useEffect, useState } from 'react'
import { request } from '../api'

// Fetches `path` (skipped while null) and refetches when it changes.
//
// The result remembers which path it belongs to. When the path changes (switching Discover from People
// to Faculty, opening another record) the old result is never handed back: screens render with
// `data: null` + `loading: true` until the new response arrives, so a list can't be drawn with the
// wrong layout from the previous request's records.
export function useApi(path) {
  const [state, setState] = useState({ path: null, data: null, error: null })
  const [tick, setTick] = useState(0)
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    if (!path) return undefined
    let stale = false
    setFetching(true)
    request(path)
      .then((data) => !stale && setState({ path, data, error: null }))
      .catch((e) => !stale && setState({ path, data: null, error: e.message }))
      .finally(() => !stale && setFetching(false))
    return () => { stale = true }
  }, [path, tick])

  const reload = useCallback(() => setTick((n) => n + 1), [])

  if (!path) return { data: null, error: null, loading: false, refreshing: false, reload }
  if (state.path !== path) return { data: null, error: null, loading: true, refreshing: false, reload }
  // A reload of the same path keeps showing what we have (so pull-to-refresh doesn't flash empty);
  // `refreshing` tells the screen a fetch is in flight.
  return { data: state.data, error: state.error, loading: false, refreshing: fetching, reload }
}

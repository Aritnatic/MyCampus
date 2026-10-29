import { useCallback, useEffect, useRef, useState } from 'react'
import { request } from '../api'
import { useAutoRefreshTick } from '../refresh'

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
  // Bumped when content may have changed (see refresh.js). Those refetches are quiet: no spinner, and a
  // failed one (a blip offline) keeps showing what we have instead of replacing it with an error.
  const auto = useAutoRefreshTick()
  const seenAuto = useRef(auto)

  useEffect(() => {
    if (!path) return undefined
    const quiet = seenAuto.current !== auto
    seenAuto.current = auto
    let stale = false
    if (!quiet) setFetching(true)
    request(path)
      .then((data) => !stale && setState({ path, data, error: null }))
      .catch((e) => !stale && setState((s) => (quiet && s.path === path && s.data ? s : { path, data: null, error: e.message })))
      .finally(() => !stale && setFetching(false))
    return () => { stale = true }
  }, [path, tick, auto])

  const reload = useCallback(() => setTick((n) => n + 1), [])

  if (!path) return { data: null, error: null, loading: false, refreshing: false, reload }
  if (state.path !== path) return { data: null, error: null, loading: true, refreshing: false, reload }
  // A reload of the same path keeps showing what we have (so pull-to-refresh doesn't flash empty);
  // `refreshing` tells the screen a fetch is in flight.
  return { data: state.data, error: state.error, loading: false, refreshing: fetching, reload }
}

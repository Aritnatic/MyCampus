import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import Svg, { Circle, G, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg'
import { Ionicons } from '@expo/vector-icons'
import { request } from '../api'
import { Async, Button, Card, Chip, Field, useToast } from '../components/ui'
import { useApi } from '../hooks/useApi'
import { tokens as t } from '../theme'

const PAD = 24
const centre = (b) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 })

export default function CampusMap() {
  const { width } = useWindowDimensions()
  const toast = useToast()
  const { data: map, loading, error, reload } = useApi('/campus/map')
  const [zoom, setZoom] = useState(1)
  const [selected, setSelected] = useState(null) // building id
  const [route, setRoute] = useState(null)
  const [q, setQ] = useState('')
  const [hits, setHits] = useState([])

  const byId = useMemo(() => Object.fromEntries((map?.buildings ?? []).map((b) => [b.id, b])), [map])
  const bounds = useMemo(() => {
    const bs = map?.buildings ?? []
    if (!bs.length) return { x: 0, y: 0, w: 100, h: 100 }
    const x1 = Math.min(...bs.map((b) => b.x), ...(map.landmarks ?? []).map((l) => l.x)) - PAD
    const y1 = Math.min(...bs.map((b) => b.y), ...(map.landmarks ?? []).map((l) => l.y)) - PAD
    const x2 = Math.max(...bs.map((b) => b.x + b.width)) + PAD
    const y2 = Math.max(...bs.map((b) => b.y + b.height)) + PAD
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 }
  }, [map])

  // Search "where is the DSP lab?" → buildings/landmarks.
  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) return setHits([])
    const id = setTimeout(() => request(`/campus/search?q=${encodeURIComponent(term)}`).then(setHits).catch(() => setHits([])), 300)
    return () => clearTimeout(id)
  }, [q])

  const chosen = selected ? byId[selected] : null
  const places = useMemo(() => [...(map?.landmarks ?? []).filter((l) => l.type === 'gate').map((l) => ({ id: l.id, name: l.name })), ...(map?.buildings ?? []).filter((b) => !b.id.startsWith('parking')).map((b) => ({ id: b.id, name: b.shortName ?? b.name }))], [map])

  const pick = (id) => { setSelected(id); setRoute(null); setQ(''); setHits([]) }
  const directions = async (from) => {
    try {
      setRoute(await request(`/campus/route?from=${encodeURIComponent(from)}&to=${encodeURIComponent(selected)}`))
    } catch (e) {
      toast.show(e.message, 'error')
    }
  }

  const size = Math.max(width - 32, 280)
  const scale = (size * zoom) / bounds.w
  const routePoints = route ? route.path.map((id) => centre(byId[id])) : []
  if (route?.from?.x !== undefined && route.from.id && !byId[route.from.id]) routePoints.unshift({ x: route.from.x, y: route.from.y })

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <Async loading={loading} error={error?.includes('hasn') || error?.includes('verified') ? null : error} onRetry={reload} skeletons={1}>
        {error ? <Card><Text style={styles.body}>{error}</Text></Card> : null}
        {map && (
          <>
            <Field value={q} onChangeText={setQ} placeholder="Find a lab, department or place" autoCorrect={false} accessibilityLabel="Find a place on campus" />
            {hits.length > 0 && (
              <View style={{ gap: 6 }}>
                {hits.slice(0, 6).map((h) => {
                  const id = h.building?.id ?? h.landmark?.id
                  return (
                    <Pressable key={`${id}:${h.match}`} onPress={() => pick(h.building ? id : null)} accessibilityRole="button" accessibilityLabel={`${h.match}${h.building ? `, in ${h.building.name}` : ''}`} style={styles.hit}>
                      <Ionicons name="location-outline" size={18} color={t.violetText} />
                      <Text style={styles.hitText}>{h.match}{h.building && h.building.name !== h.match ? <Text style={{ color: t.inkFaint }}> · {h.building.name}</Text> : null}</Text>
                    </Pressable>
                  )
                })}
              </View>
            )}
            {q.trim().length >= 2 && hits.length === 0 ? <Text style={styles.body}>Nothing matches “{q.trim()}”.</Text> : null}

            <View style={styles.zoomRow}>
              <Text style={styles.body}>Tap a building</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button label="−" variant="secondary" compact onPress={() => setZoom((z) => Math.max(1, +(z - 0.5).toFixed(1)))} disabled={zoom <= 1} style={styles.zoomBtn} />
                <Button label="+" variant="secondary" compact onPress={() => setZoom((z) => Math.min(3, +(z + 0.5).toFixed(1)))} disabled={zoom >= 3} style={styles.zoomBtn} />
              </View>
            </View>

            <ScrollView horizontal style={styles.mapBox} contentContainerStyle={{ width: size * zoom }} showsHorizontalScrollIndicator={zoom > 1}>
              <ScrollView nestedScrollEnabled style={{ height: Math.min(bounds.h * scale, 420) }} contentContainerStyle={{ height: bounds.h * scale }}>
                <Svg width={bounds.w * scale} height={bounds.h * scale} viewBox={`${bounds.x} ${bounds.y} ${bounds.w} ${bounds.h}`} accessibilityLabel="Campus map">
                  {map.paths.map((p) => {
                    const a = byId[p.from]; const b = byId[p.to]
                    if (!a || !b) return null
                    const ca = centre(a); const cb = centre(b)
                    return <Line key={p.id} x1={ca.x} y1={ca.y} x2={cb.x} y2={cb.y} stroke={t.hover} strokeWidth={5} strokeLinecap="round" />
                  })}
                  {route ? <Polyline points={routePoints.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={t.violet} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" /> : null}
                  {map.buildings.map((b) => {
                    const on = b.id === selected
                    return (
                      <G key={b.id} onPress={() => pick(b.id)}>
                        <Rect x={b.x} y={b.y} width={b.width} height={b.height} rx={6} fill={b.color ?? t.sunken} fillOpacity={on ? 0.9 : 0.45} stroke={on ? t.ink : b.color ?? t.hairline} strokeWidth={on ? 3 : 1.5} />
                        <SvgText x={b.x + b.width / 2} y={b.y + b.height / 2 + 4} fontSize={12} fontWeight="700" fill={t.ink} textAnchor="middle">{b.shortName ?? b.name}</SvgText>
                      </G>
                    )
                  })}
                  {(map.landmarks ?? []).filter((l) => l.type === 'gate').map((l) => (
                    <G key={l.id}>
                      <Circle cx={l.x} cy={l.y} r={6} fill={t.violetText} />
                      <SvgText x={l.x + 10} y={l.y + 4} fontSize={11} fill={t.inkSoft}>{l.name}</SvgText>
                    </G>
                  ))}
                </Svg>
              </ScrollView>
            </ScrollView>

            {chosen ? (
              <Card style={{ gap: 10 }}>
                <Text style={styles.title}>{chosen.name}</Text>
                {chosen.departments?.length ? <View style={styles.chips}>{chosen.departments.map((d) => <Chip key={d} label={d} tone="violet" />)}</View> : null}
                {chosen.facilities?.length ? <View style={styles.chips}>{chosen.facilities.map((f) => <Chip key={f} label={f} />)}</View> : null}
                {chosen.floors?.length ? <Text style={styles.body}>Floors: {chosen.floors.join(', ')}</Text> : null}

                <Text style={[styles.body, { fontWeight: '700', color: t.ink }]}>Get directions from</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {places.filter((p) => p.id !== chosen.id).map((p) => (
                    <Pressable key={p.id} onPress={() => directions(p.id)} accessibilityRole="button" accessibilityLabel={`Directions from ${p.name}`} style={styles.origin}>
                      <Text style={styles.originText}>{p.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                {route ? (
                  <View style={{ gap: 6 }}>
                    <Text style={styles.body}>{route.steps.map((s) => s.name).join('  →  ')}</Text>
                    <Text style={[styles.body, { color: t.inkFaint }]}>{route.steps.length - 1} {route.steps.length - 1 === 1 ? 'stop' : 'stops'} along marked footpaths</Text>
                  </View>
                ) : null}
              </Card>
            ) : null}
          </>
        )}
      </Async>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  body: { color: t.inkSoft, fontSize: 13, lineHeight: 19 },
  title: { color: t.ink, fontSize: 17, fontWeight: '800' },
  hit: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  hitText: { color: t.ink, fontSize: 14, flex: 1 },
  zoomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  zoomBtn: { minWidth: 44 },
  mapBox: { backgroundColor: t.surface, borderRadius: 14, borderWidth: 1, borderColor: t.hairline },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  origin: { minHeight: 40, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 10, backgroundColor: t.sunken, borderWidth: 1, borderColor: t.hairline },
  originText: { color: t.inkSoft, fontSize: 13, fontWeight: '600' },
})

import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { tokens as t, radius, themed } from '../theme'

const PAD = 16
const GAP = 10

// Washed tile colours shared by the shortcut grid and the banners.
const TONES = themed(() => ({
  violet: [t.violetSoft, t.violetText],
  green: [t.greenSoft, t.greenText],
  yellow: [t.yellowSoft, t.yellowText],
  blue: [t.blueSoft, t.blueText],
}))

// Swipeable highlight cards: profile nudge, next exam, pinned notice, next event.
// banners: [{ key, tone, icon, eyebrow, title, body, cta, onPress }]
export function BannerCarousel({ banners }) {
  const { width } = useWindowDimensions()
  const [page, setPage] = useState(0)
  if (banners.length === 0) return null

  const cardW = width - PAD * 2
  const step = cardW + GAP
  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: PAD, gap: GAP }}
        onScroll={(e) => setPage(Math.min(banners.length - 1, Math.round(e.nativeEvent.contentOffset.x / step)))}
        scrollEventThrottle={32}
      >
        {banners.map((b) => {
          const [bg, fg] = TONES[b.tone]
          return (
            <Pressable
              key={b.key}
              onPress={b.onPress}
              accessibilityRole="button"
              accessibilityLabel={`${b.eyebrow}. ${b.title}`}
              style={({ pressed }) => [styles.banner, { width: cardW, backgroundColor: bg, borderColor: fg + '33' }, pressed && { opacity: 0.85 }]}
            >
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={[styles.eyebrow, { color: fg }]}>{b.eyebrow.toUpperCase()}</Text>
                <Text style={styles.bannerTitle} numberOfLines={2}>{b.title}</Text>
                {b.body ? <Text style={styles.bannerBody} numberOfLines={1}>{b.body}</Text> : null}
                <View style={[styles.cta, { backgroundColor: fg }]}>
                  <Text style={styles.ctaText}>{b.cta}</Text>
                  <Ionicons name="arrow-forward" size={13} color={t.canvas} />
                </View>
              </View>
              <Ionicons name={b.icon} size={64} color={fg} style={{ opacity: 0.35 }} />
            </Pressable>
          )
        })}
      </ScrollView>
      {banners.length > 1 ? (
        <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {banners.map((b, i) => <View key={b.key} style={[styles.dot, i === page && styles.dotOn]} />)}
        </View>
      ) : null}
    </View>
  )
}

// Icon shortcuts in four columns. items: [{ key, icon, label, tone, onPress }]
export function ShortcutGrid({ items }) {
  return (
    <View style={styles.grid}>
      {items.map((s) => {
        const [bg, fg] = TONES[s.tone]
        return (
          <Pressable key={s.key} onPress={s.onPress} accessibilityRole="button" accessibilityLabel={s.label} style={({ pressed }) => [styles.shortcut, pressed && { opacity: 0.7 }]}>
            <View style={[styles.shortcutIcon, { backgroundColor: bg }]}>
              <Ionicons name={s.icon} size={22} color={fg} />
            </View>
            <Text style={styles.shortcutLabel} numberOfLines={2}>{s.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

// Horizontal filter chips for the feed. options: [{ value, label }]
export function FilterChips({ options, value, onChange }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.value === value
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[styles.filter, on && styles.filterOn]}
          >
            <Text style={[styles.filterText, on && { color: '#fff' }]}>{o.label}</Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const styles = themed(() => StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.container, borderWidth: 1, padding: 16, minHeight: 132 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  bannerTitle: { color: t.ink, fontSize: 18, fontWeight: '800', lineHeight: 23 },
  bannerBody: { color: t.inkSoft, fontSize: 13 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, marginTop: 4 },
  ctaText: { color: t.canvas, fontSize: 12, fontWeight: '800' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: t.hover },
  dotOn: { width: 18, backgroundColor: t.violet },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 },
  shortcut: { width: '25%', alignItems: 'center', gap: 6 },
  shortcutIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  shortcutLabel: { color: t.inkSoft, fontSize: 11.5, fontWeight: '600', textAlign: 'center', paddingHorizontal: 2 },
  filter: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: t.sunken, borderWidth: 1, borderColor: t.hairline },
  filterOn: { backgroundColor: t.violet, borderColor: t.violet },
  filterText: { color: t.inkSoft, fontSize: 13, fontWeight: '700' },
}))

import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Avatar, Chip, TONES } from './ui'
import { tokens as t, radius, themed } from '../theme'

// Building blocks for profile-style pages (people, projects, faculty…) and the hub screens.

// Cover band, overlapping avatar or icon, title, subtitle, badges and a stat strip.
// person: show initials in a ring · otherwise `icon` in a tinted tile.
export function ProfileHero({ name, icon = 'person', tone = 'violet', title, subtitle, badges = [], stats = [] }) {
  const [soft, strong] = TONES[tone]
  return (
    <View>
      <View style={[styles.cover, { backgroundColor: soft }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={[styles.blob, { width: 150, height: 150, right: -30, top: -60, backgroundColor: strong }]} />
        <View style={[styles.blob, { width: 90, height: 90, right: 70, top: 30, backgroundColor: strong, opacity: 0.1 }]} />
        <View style={[styles.blob, { width: 110, height: 110, left: -40, top: 20, backgroundColor: strong, opacity: 0.08 }]} />
      </View>
      <View style={styles.heroBody}>
        <View style={styles.avatarRing}>
          {name ? <Avatar name={name} size={84} /> : (
            <View style={[styles.iconTile, { backgroundColor: soft }]}><Ionicons name={icon} size={38} color={strong} /></View>
          )}
        </View>
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {badges.length > 0 ? <View style={styles.badges}>{badges.map((b) => <Chip key={b.label} label={b.label} tone={b.tone} />)}</View> : null}
      </View>
      {stats.length > 0 ? <StatStrip stats={stats} /> : null}
    </View>
  )
}

export function StatStrip({ stats }) {
  return (
    <View style={styles.strip}>
      {stats.map((s, i) => (
        <View key={s.label} style={[styles.stat, i > 0 && styles.statDivider]}>
          <Text style={styles.statValue} numberOfLines={1}>{String(s.value ?? '—')}</Text>
          <Text style={styles.statLabel} numberOfLines={1}>{s.label}</Text>
        </View>
      ))}
    </View>
  )
}

// A titled card. Children are the body.
export function Panel({ title, icon, children, style }) {
  return (
    <View style={[styles.panel, style]}>
      {title ? (
        <View style={styles.panelHead}>
          {icon ? <Ionicons name={icon} size={15} color={t.inkFaint} /> : null}
          <Text accessibilityRole="header" style={styles.panelTitle}>{title}</Text>
        </View>
      ) : null}
      {children}
    </View>
  )
}

export function TagGroup({ items, tone = 'violet' }) {
  return <View style={styles.tags}>{items.map((x) => <Chip key={x} label={x} tone={tone} />)}</View>
}

export function BulletList({ items }) {
  return (
    <View style={{ gap: 9 }}>
      {items.map((x) => (
        <View key={x} style={styles.bullet}>
          <View style={styles.bulletDot} />
          <Text style={styles.bulletText}>{x}</Text>
        </View>
      ))}
    </View>
  )
}

// icon + label + value, optionally tappable.
export function InfoRow({ icon, label, value, onPress }) {
  if (!value) return null
  const body = (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}><Ionicons name={icon} size={16} color={t.violetText} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, onPress && { color: t.violetText }]}>{value}</Text>
      </View>
      {onPress ? <Ionicons name="open-outline" size={16} color={t.inkFaint} /> : null}
    </View>
  )
  return onPress ? <Pressable onPress={onPress} accessibilityRole="link" accessibilityLabel={`${label}: ${value}`}>{body}</Pressable> : body
}

// A big tappable category tile for hub screens.
export function HubTile({ icon, label, body, tone = 'violet', onPress, wide }) {
  const [soft, strong] = TONES[tone]
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${body}`}
      style={({ pressed }) => [styles.tile, wide && { width: '100%' }, pressed && { backgroundColor: t.hover }]}
    >
      <View style={[styles.tileIcon, { backgroundColor: soft }]}><Ionicons name={icon} size={26} color={strong} /></View>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileBody} numberOfLines={3}>{body}</Text>
    </Pressable>
  )
}

// One row in a list: avatar (people) or tinted icon (everything else), title, subtitle, blurb, chips.
export function ListRow({ name, icon, tone = 'violet', title, subtitle, blurb, chips = [], badge, onPress }) {
  const [soft, strong] = TONES[tone]
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle ?? ''}`}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: t.hover }]}
    >
      {name ? <Avatar name={name} size={52} /> : <View style={[styles.rowIcon, { backgroundColor: soft }]}><Ionicons name={icon} size={24} color={strong} /></View>}
      <View style={{ flex: 1, gap: 3 }}>
        {badge ? <Chip label={badge} tone="green" /> : null}
        <Text style={styles.rowTitle} numberOfLines={2}>{title}</Text>
        {subtitle ? <Text style={styles.rowSub} numberOfLines={1}>{subtitle}</Text> : null}
        {blurb ? <Text style={styles.rowBlurb} numberOfLines={2}>{blurb}</Text> : null}
        {chips.length > 0 ? <View style={[styles.tags, { marginTop: 6 }]}>{chips.slice(0, 3).map((c) => <Chip key={c} label={c} tone={tone} />)}</View> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={t.inkFaint} />
    </Pressable>
  )
}

const styles = themed(() => StyleSheet.create({
  cover: { height: 112, overflow: 'hidden' },
  blob: { position: 'absolute', borderRadius: 999, opacity: 0.16 },
  heroBody: { alignItems: 'center', paddingHorizontal: 20, marginTop: -44, gap: 4 },
  avatarRing: { padding: 4, borderRadius: 999, backgroundColor: t.canvas },
  iconTile: { width: 84, height: 84, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  title: { color: t.ink, fontSize: 24, fontWeight: '800', textAlign: 'center', marginTop: 8, lineHeight: 30 },
  subtitle: { color: t.inkSoft, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 8 },
  strip: { flexDirection: 'row', marginHorizontal: 16, marginTop: 18, backgroundColor: t.surface, borderRadius: radius.container, borderWidth: 1, borderColor: t.hairline, paddingVertical: 14 },
  stat: { flex: 1, alignItems: 'center', paddingHorizontal: 6 },
  statDivider: { borderLeftWidth: 1, borderLeftColor: t.hairline },
  statValue: { color: t.ink, fontSize: 17, fontWeight: '800' },
  statLabel: { color: t.inkFaint, fontSize: 11, fontWeight: '600', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.4 },
  panel: { backgroundColor: t.surface, borderRadius: radius.container, borderWidth: 1, borderColor: t.hairline, padding: 16, gap: 12 },
  panelHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  panelTitle: { color: t.inkSoft, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  bullet: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: t.violet, marginTop: 8 },
  bulletText: { flex: 1, color: t.ink, fontSize: 14, lineHeight: 21 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: t.violetSoft, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { color: t.inkFaint, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  infoValue: { color: t.ink, fontSize: 14, marginTop: 1 },
  tile: { width: '48%', backgroundColor: t.surface, borderRadius: radius.container, borderWidth: 1, borderColor: t.hairline, padding: 16, gap: 6 },
  tileIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  tileLabel: { color: t.ink, fontSize: 16, fontWeight: '800' },
  tileBody: { color: t.inkSoft, fontSize: 12.5, lineHeight: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: t.surface, borderRadius: radius.container, borderWidth: 1, borderColor: t.hairline, padding: 14 },
  rowIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { color: t.ink, fontSize: 15.5, fontWeight: '700', lineHeight: 21 },
  rowSub: { color: t.violetText, fontSize: 12.5, fontWeight: '600' },
  rowBlurb: { color: t.inkSoft, fontSize: 13, lineHeight: 18, marginTop: 2 },
}))

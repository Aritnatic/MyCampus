import { useState } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { SITE_URL } from '../api'
import { tokens as t, radius, themed } from '../theme'

// A college's logo (or its initials when it has none) with its name. `college` is { name, short, logoUrl }.
export function CollegeLogo({ college, size = 28 }) {
  const [failed, setFailed] = useState(false)
  if (college?.logoUrl && !failed) {
    return <Image source={{ uri: `${SITE_URL}${college.logoUrl}` }} onError={() => setFailed(true)} style={{ width: size, height: size, borderRadius: Math.round(size / 4), backgroundColor: '#fff' }} accessibilityIgnoresInvertColors />
  }
  return (
    <View style={[styles.initials, { width: size, height: size, borderRadius: Math.round(size / 4) }]}>
      <Text style={[styles.initialsText, { fontSize: Math.max(9, size * 0.36) }]}>{(college?.short ?? '?').slice(0, 4)}</Text>
    </View>
  )
}

export function CollegeBadge({ college, style }) {
  if (!college) return null
  return (
    <View style={[styles.badge, style]} accessibilityLabel={`College: ${college.name}`}>
      <CollegeLogo college={college} size={24} />
      <Text style={styles.name} numberOfLines={1}>{college.name}</Text>
    </View>
  )
}

const styles = themed(() => StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center', paddingVertical: 6, paddingLeft: 6, paddingRight: 12, borderRadius: radius.pill ?? 999, backgroundColor: t.sunken, borderWidth: 1, borderColor: t.hairline, maxWidth: '100%' },
  name: { color: t.ink, fontSize: 13, fontWeight: '600', flexShrink: 1 },
  initials: { backgroundColor: t.violetSoft, alignItems: 'center', justifyContent: 'center' },
  initialsText: { color: t.violetText, fontWeight: '800' },
}))

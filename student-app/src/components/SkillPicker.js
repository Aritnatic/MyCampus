import { useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ALL_INTERESTS, ALL_SKILLS, INTEREST_GROUPS, SKILL_GROUPS } from '../catalog'
import { Chip } from './ui'
import { tokens as t, radius, themed } from '../theme'

// Pick skills or interests: suggestions drop down as you type (filtered by what you've typed), anything not in
// the list can be added as your own, and "Browse all" opens the full list grouped by department.
const CATALOGS = { skills: [SKILL_GROUPS, ALL_SKILLS], interests: [INTEREST_GROUPS, ALL_INTERESTS] }
const same = (a, b) => a.toLowerCase() === b.toLowerCase()

export function SkillPicker({ label, values, onChange, catalog = 'skills', max = 30, tone = 'violet', hint, placeholder }) {
  const [groups, all] = CATALOGS[catalog]
  const [draft, setDraft] = useState('')
  const [browsing, setBrowsing] = useState(false)
  const full = values.length >= max

  const add = (word) => {
    const w = word.trim()
    if (!w || full) return
    const known = all.find((x) => same(x, w)) // use the catalog's spelling when it's a known one
    if (!values.some((v) => same(v, w))) onChange([...values, known ?? w])
    setDraft('')
  }
  const toggle = (item) => (values.some((v) => same(v, item)) ? onChange(values.filter((v) => !same(v, item))) : !full && onChange([...values, item]))

  // Starts-with matches first, then contains; skip ones already picked.
  const suggestions = useMemo(() => {
    const q = draft.trim().toLowerCase()
    if (!q) return []
    const free = all.filter((x) => !values.some((v) => same(v, x)))
    const starts = free.filter((x) => x.toLowerCase().startsWith(q))
    const contains = free.filter((x) => !x.toLowerCase().startsWith(q) && x.toLowerCase().includes(q))
    return [...starts, ...contains].slice(0, 8)
  }, [draft, values, all])
  const exact = draft.trim() && (all.some((x) => same(x, draft)) || values.some((v) => same(v, draft)))

  return (
    <View style={{ gap: 8 }}>
      <View style={styles.head}>
        {label ? <Text style={styles.label}>{label}</Text> : <View />}
        <Pressable onPress={() => setBrowsing(true)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Browse all ${catalog}`}>
          <Text style={styles.browse}>Browse all</Text>
        </Pressable>
      </View>
      <View style={styles.inputWrap}>
        <Ionicons name="search" size={16} color={t.inkFaint} />
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={() => add(suggestions[0] && !exact ? draft : draft)}
          placeholder={full ? `You've added ${max}, the most allowed` : placeholder}
          placeholderTextColor={t.inkFaint}
          editable={!full}
          returnKeyType="done"
          autoCorrect={false}
          accessibilityLabel={label}
          maxLength={60}
        />
      </View>
      {draft.trim() ? (
        <View style={styles.dropdown} accessibilityRole="menu">
          {suggestions.map((s) => (
            <Pressable key={s} onPress={() => add(s)} accessibilityRole="menuitem" style={({ pressed }) => [styles.option, pressed && { backgroundColor: t.sunken }]}>
              <Ionicons name="add-circle-outline" size={16} color={t.violetText} />
              <Text style={styles.optionText}>{s}</Text>
            </Pressable>
          ))}
          {!exact ? (
            <Pressable onPress={() => add(draft)} accessibilityRole="menuitem" style={({ pressed }) => [styles.option, pressed && { backgroundColor: t.sunken }]}>
              <Ionicons name="create-outline" size={16} color={t.inkSoft} />
              <Text style={styles.optionText}>Add “{draft.trim()}” as your own</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {values.length ? <View style={styles.wrap}>{values.map((v) => <Chip key={v} label={v} tone={tone} onRemove={() => onChange(values.filter((x) => x !== v))} />)}</View> : null}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      <BrowseSheet visible={browsing} title={label ?? 'Browse'} groups={groups} values={values} onToggle={toggle} onClose={() => setBrowsing(false)} full={full} />
    </View>
  )
}

function BrowseSheet({ visible, title, groups, values, onToggle, onClose, full }) {
  const [open, setOpen] = useState(null)
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const shown = needle ? groups.map(([g, items]) => [g, items.filter((i) => i.toLowerCase().includes(needle))]).filter(([, items]) => items.length) : groups
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <View style={styles.sheet}>
        <View style={styles.sheetHead}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Done" hitSlop={8}><Text style={styles.browse}>Done ({values.length})</Text></Pressable>
        </View>
        <View style={[styles.inputWrap, { marginHorizontal: 16 }]}>
          <Ionicons name="search" size={16} color={t.inkFaint} />
          <TextInput style={styles.input} value={q} onChangeText={setQ} placeholder="Filter the list" placeholderTextColor={t.inkFaint} autoCorrect={false} accessibilityLabel="Filter the list" />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 48 }}>
          {shown.map(([group, items]) => {
            const expanded = needle || open === group
            const picked = items.filter((i) => values.some((v) => v.toLowerCase() === i.toLowerCase())).length
            return (
              <View key={group} style={styles.group}>
                <Pressable onPress={() => setOpen(expanded && !needle ? null : group)} accessibilityRole="button" accessibilityState={{ expanded: !!expanded }} style={styles.groupHead}>
                  <Text style={styles.groupTitle}>{group}</Text>
                  <Text style={styles.groupCount}>{picked ? `${picked} picked · ` : ''}{items.length}</Text>
                  <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={t.inkFaint} />
                </Pressable>
                {expanded ? (
                  <View style={styles.items}>
                    {items.map((i) => {
                      const on = values.some((v) => v.toLowerCase() === i.toLowerCase())
                      return (
                        <Pressable key={i} onPress={() => onToggle(i)} disabled={!on && full} accessibilityRole="checkbox" accessibilityState={{ checked: on }} style={[styles.pick, on && styles.pickOn]}>
                          {on ? <Ionicons name="checkmark" size={14} color={t.violetText} /> : null}
                          <Text style={[styles.pickText, on && { color: t.violetText }]}>{i}</Text>
                        </Pressable>
                      )
                    })}
                  </View>
                ) : null}
              </View>
            )
          })}
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = themed(() => StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: t.inkSoft, fontSize: 13, fontWeight: '600' },
  browse: { color: t.violetText, fontSize: 13, fontWeight: '700' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.sunken, borderRadius: radius.button, borderWidth: 1, borderColor: t.hairline, paddingHorizontal: 12 },
  input: { flex: 1, color: t.ink, paddingVertical: 12, fontSize: 14 },
  dropdown: { borderRadius: radius.button, borderWidth: 1, borderColor: t.hairline, backgroundColor: t.surface, overflow: 'hidden' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.hairline },
  optionText: { color: t.ink, fontSize: 14 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  hint: { color: t.inkFaint, fontSize: 12, lineHeight: 17 },
  sheet: { flex: 1, backgroundColor: t.canvas, gap: 12 },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 20 },
  sheetTitle: { color: t.ink, fontSize: 18, fontWeight: '800' },
  group: { borderRadius: radius.container, borderWidth: 1, borderColor: t.hairline, backgroundColor: t.surface, overflow: 'hidden' },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14 },
  groupTitle: { flex: 1, color: t.ink, fontSize: 15, fontWeight: '700' },
  groupCount: { color: t.inkFaint, fontSize: 12, fontWeight: '600' },
  items: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 12, paddingBottom: 14 },
  pick: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: t.sunken, borderWidth: 1, borderColor: t.hairline },
  pickOn: { backgroundColor: t.violetSoft, borderColor: t.violet },
  pickText: { color: t.inkSoft, fontSize: 13, fontWeight: '600' },
}))

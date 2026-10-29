import { Linking, ScrollView, StyleSheet, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Async, RichText, formatDate } from '../../../components/ui'
import { BulletList, InfoRow, Panel, ProfileHero, TagGroup } from '../../../components/profile'
import { DetailActions } from '../../../components/DetailActions'
import { useApi } from '../../../hooks/useApi'
import { KINDS } from '../../../discovery'
import { tokens as t, themed } from '../../../theme'

const BADGE_TONE = { Verified: 'green' }
// Dates in the stat strip are short ("Apr 2026") so they fit one line.
const statValue = (v) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? formatDate(v, { month: 'short', year: 'numeric' }) : v)
const GROUP_ICON = {
  Skills: 'construct-outline', Interests: 'heart-outline', 'Looking for': 'search-outline', Achievements: 'trophy-outline',
  Tech: 'code-slash-outline', Team: 'people-outline', 'Open roles': 'briefcase-outline', Founders: 'people-outline', Stipend: 'cash-outline',
  'Required skills': 'construct-outline', 'Preferred skills': 'sparkles-outline', Eligibility: 'checkmark-done-outline', Pay: 'cash-outline',
  Requirements: 'list-outline', 'Eligible branches': 'git-branch-outline', 'Research interests': 'flask-outline', Qualifications: 'ribbon-outline', Projects: 'rocket-outline',
}

// The page for one person, project, startup, research opening, job or teacher.
export default function DiscoverDetail() {
  const { kind, id } = useLocalSearchParams()
  const { data: item, loading, error, reload } = useApi(`/discover/${kind}/${id}`)
  const k = KINDS[kind]
  if (!item || !k) {
    return (
      <ScrollView contentContainerStyle={styles.pad}>
        <Async loading={loading} error={error ?? (!k ? 'That page doesn’t exist.' : null)} onRetry={reload} />
      </ScrollView>
    )
  }
  const d = k.detail(item)
  const isPerson = kind === 'people'
  const badges = [
    d.badge && { label: d.badge, tone: BADGE_TONE[d.badge] ?? 'violet' },
    isPerson && item.mentor?.open && { label: 'Open to mentor', tone: 'violet' },
    isPerson && item._uni?.short && { label: item._uni.short, tone: 'blue' },
  ].filter(Boolean)

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <ProfileHero
        name={isPerson ? item.name : undefined}
        icon={k.icon}
        tone={k.tone}
        title={d.title}
        subtitle={d.subtitle}
        badges={badges}
        stats={d.facts.map(([label, value]) => ({ label, value: statValue(value) }))}
      />

      <View style={styles.pad}>
        <DetailActions kind={kind} item={item} />

        {d.body ? <Panel title={isPerson ? 'About' : 'Overview'} icon="document-text-outline"><RichText text={d.body} /></Panel> : null}

        {d.email ? (
          <Panel title="Contact" icon="mail-outline" style={{ gap: 14 }}>
            <InfoRow icon="mail-outline" label="Email" value={d.email} onPress={() => Linking.openURL(`mailto:${d.email}`)} />
            <InfoRow icon="location-outline" label="Office" value={item.office} />
            <InfoRow icon="time-outline" label="Availability" value={item.availability} />
          </Panel>
        ) : null}

        {isPerson && item.mentor?.open && item.mentor.topics?.length > 0 ? (
          <Panel title="Can mentor you on" icon="school-outline"><TagGroup items={item.mentor.topics} tone="violet" /></Panel>
        ) : null}

        {d.groups
          .filter((g) => g.items?.length && !(d.email && g.title === 'Availability'))
          .map((g) => (
            <Panel key={g.title} title={g.title} icon={GROUP_ICON[g.title] ?? 'ellipse-outline'}>
              {g.list ? <BulletList items={g.items} /> : <TagGroup items={g.items} tone={g.tone} />}
            </Panel>
          ))}
      </View>
    </ScrollView>
  )
}

const styles = themed(() => StyleSheet.create({
  scroll: { paddingBottom: 48 },
  pad: { padding: 16, gap: 12 },
}))

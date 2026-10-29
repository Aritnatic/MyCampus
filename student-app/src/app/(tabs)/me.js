import { useState } from 'react'
import { useRouter } from 'expo-router'
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native'
import { request, SITE_URL } from '../../api'
import { Button, PasswordSheet, Segmented, useToast } from '../../components/ui'
import { Panel, ProfileHero, TagGroup } from '../../components/profile'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { saveJson } from '../../files'
import { missingProfile, profileScore } from '../../profileCompleteness'
import { tokens as t, themed } from '../../theme'

const SECTION_ICON = { Skills: 'construct-outline', Interests: 'heart-outline', 'Looking for': 'search-outline' }

export default function Me() {
  const { user, signOut, deleteAccount } = useAuth()
  const router = useRouter()
  const toast = useToast()
  const { choice, setChoice } = useTheme()
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const gaps = missingProfile(user)
  const sections = [['Skills', user.skills, 'violet'], ['Interests', user.interests, 'blue'], ['Looking for', user.lookingFor, 'yellow']].filter(([, xs]) => xs?.length)

  const score = profileScore(user)
  const stats = [
    { label: 'Skills', value: user.skills?.length ?? 0 },
    { label: 'Interests', value: user.interests?.length ?? 0 },
    { label: 'Profile', value: `${score}%` },
  ]
  const badges = [
    user.role === 'student' ? { label: 'Verified student', tone: 'green' } : { label: 'Individual account', tone: 'blue' },
    user.mentor?.open && { label: 'Open to mentor', tone: 'violet' },
  ].filter(Boolean)

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <ProfileHero
        name={user.name}
        title={user.name}
        subtitle={user.branch ? `${user.branch} · Year ${user.year} · Semester ${user.semester}` : user.email}
        badges={badges}
        stats={stats}
      />

      <View style={styles.pad}>
        <View style={styles.actionsRow}>
          <Button label="Edit profile" icon="create-outline" onPress={() => router.push('/profile-edit')} style={{ flex: 1 }} />
        </View>

        {gaps.length > 0 && (
          <Panel title="Finish your profile" icon="sparkles-outline" style={{ borderColor: t.violet }}>
            <Text style={styles.body}>Add {gaps.join(', ')} so people and projects can find you, and so we can suggest good matches.</Text>
            <Button label="Complete profile" onPress={() => router.push('/profile-edit')} compact />
          </Panel>
        )}

        {user.bio ? <Panel title="About" icon="document-text-outline"><Text style={styles.body}>{user.bio}</Text></Panel> : null}

        {sections.map(([title, items, tone]) => (
          <Panel key={title} title={title} icon={SECTION_ICON[title]}><TagGroup items={items} tone={tone} /></Panel>
        ))}

        <Panel title="Appearance" icon="contrast-outline">
          <Segmented
            value={choice}
            onChange={setChoice}
            options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]}
          />
        </Panel>

        <Panel title="Account" icon="settings-outline" style={{ gap: 10 }}>
          <Button label="Send feedback" icon="chatbubble-ellipses-outline" variant="secondary" onPress={() => router.push('/feedback')} />
          <Button label="Change password" icon="key-outline" variant="secondary" onPress={() => router.push('/change-password')} />
          <Button label="Download my data" icon="download-outline" variant="secondary" loading={exporting} onPress={async () => {
            setExporting(true)
            try { await saveJson('my-campus-data.json', await request('/me/export')) } catch (e) { toast.show(e.message, 'error') }
            setExporting(false)
          }} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label="Privacy policy" variant="ghost" compact style={{ flex: 1 }} onPress={() => Linking.openURL(`${SITE_URL}/legal/privacy`)} />
            <Button label="Terms of use" variant="ghost" compact style={{ flex: 1 }} onPress={() => Linking.openURL(`${SITE_URL}/legal/terms`)} />
          </View>
          <Button label="Sign out" icon="log-out-outline" variant="secondary" onPress={signOut} />
          {user.role !== 'admin' ? <Button label="Delete my account" icon="trash-outline" variant="danger" onPress={() => setDeleting(true)} /> : null}
        </Panel>
      </View>

      <PasswordSheet
        visible={deleting}
        danger
        title="Delete your account?"
        subtitle="This permanently removes your profile, notes, requests and notifications and signs you out everywhere. Projects you started with other people are handed to them. It can't be undone."
        submitLabel="Delete account"
        onClose={() => setDeleting(false)}
        onSubmit={async (password) => {
          const { error } = await deleteAccount(password)
          if (error) return error
          return null // the account is gone and the session is cleared, so the app returns to sign-in on its own
        }}
      />
    </ScrollView>
  )
}

const styles = themed(() => StyleSheet.create({
  scroll: { paddingBottom: 48 },
  pad: { padding: 16, gap: 12 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  body: { color: t.inkSoft, fontSize: 14, lineHeight: 21 },
}))

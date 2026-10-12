import { useState } from 'react'
import { useRouter } from 'expo-router'
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native'
import { request, SITE_URL } from '../../api'
import { Avatar, Button, Card, Chip, PasswordSheet, SectionHeader, useToast } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { saveJson } from '../../files'
import { missingProfile } from '../../profileCompleteness'
import { tokens as t } from '../../theme'

export default function Me() {
  const { user, signOut, deleteAccount } = useAuth()
  const router = useRouter()
  const toast = useToast()
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const gaps = missingProfile(user)
  const sections = [['Skills', user.skills, 'violet'], ['Interests', user.interests, 'blue'], ['Looking for', user.lookingFor, 'yellow']].filter(([, xs]) => xs?.length)

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.head}>
        <Avatar name={user.name} size={72} />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.sub}>{user.email}</Text>
        {user.branch ? <Text style={styles.sub}>{user.branch} · Year {user.year} · Semester {user.semester}</Text> : null}
        <View style={styles.badges}>
          {user.role === 'student' ? <Chip label="Verified student" tone="green" /> : <Chip label="Individual account" tone="blue" />}
          {user.mentor?.open ? <Chip label="Open to mentor" tone="violet" /> : null}
        </View>
      </View>

      {gaps.length > 0 && (
        <Card style={{ borderColor: t.violet, gap: 8 }}>
          <Text style={styles.cardTitle}>Finish your profile</Text>
          <Text style={styles.body}>Add {gaps.join(', ')} so people and projects can find you, and so we can suggest good matches.</Text>
          <Button label="Complete profile" onPress={() => router.push('/profile-edit')} compact />
        </Card>
      )}

      {user.bio ? <Card style={{ marginTop: gaps.length ? 12 : 0 }}><Text style={styles.body}>{user.bio}</Text></Card> : null}

      {sections.map(([title, items, tone]) => (
        <View key={title}>
          <SectionHeader title={title} />
          <View style={styles.wrap}>{items.map((s) => <Chip key={s} label={s} tone={tone} />)}</View>
        </View>
      ))}

      <View style={{ gap: 10, marginTop: 28 }}>
        <Button label="Edit profile" icon="create-outline" variant="secondary" onPress={() => router.push('/profile-edit')} />
        <Button label="Send feedback" icon="chatbubble-ellipses-outline" variant="secondary" onPress={() => router.push('/feedback')} />
        <Button label="Sign out" icon="log-out-outline" variant="secondary" onPress={signOut} />
      </View>

      <SectionHeader title="Account and privacy" />
      <View style={{ gap: 10 }}>
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
        {user.role !== 'admin' ? <Button label="Delete my account" icon="trash-outline" variant="danger" onPress={() => setDeleting(true)} /> : null}
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

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  head: { alignItems: 'center', marginBottom: 20, gap: 2 },
  name: { color: t.ink, fontSize: 22, fontWeight: '800', marginTop: 12 },
  sub: { color: t.inkSoft, fontSize: 13, marginTop: 2 },
  badges: { flexDirection: 'row', gap: 6, marginTop: 10 },
  cardTitle: { color: t.ink, fontSize: 16, fontWeight: '700' },
  body: { color: t.inkSoft, fontSize: 14, lineHeight: 21 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
})

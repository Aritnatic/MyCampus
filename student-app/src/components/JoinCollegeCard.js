import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import { tokens as t, radius, themed } from '../theme'

// Shown to accounts that aren't a verified student yet: invites them to join their college, or shows where
// their request stands. Hidden for students and admins.
export function JoinCollegeCard({ style }) {
  const router = useRouter()
  const { user } = useAuth()
  const isIndividual = user?.role === 'individual'
  const latest = useApi(isIndividual ? '/me/join-request' : null)
  if (!isIndividual || latest.loading) return null
  const status = latest.data?.status

  const look = status === 'pending'
    ? { icon: 'time-outline', color: t.yellow, title: 'Waiting for approval', body: `Roll no. ${latest.data.rollNumber}. You’ll be notified when an admin decides.` }
    : status === 'rejected'
      ? { icon: 'alert-circle-outline', color: t.red, title: 'Request not approved', body: latest.data.reason || 'Check your details and send it again.' }
      : { icon: 'school-outline', color: t.violet, title: 'Are you a college student?', body: 'Join your college with your roll number to unlock notices, exams, results and safety alerts.' }

  return (
    <Pressable onPress={() => router.push('/join')} accessibilityRole="button" accessibilityLabel={look.title} style={[styles.card, { borderColor: look.color }, style]}>
      <View style={[styles.icon, { backgroundColor: t.sunken }]}><Ionicons name={look.icon} size={20} color={look.color} /></View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.title}>{look.title}</Text>
        <Text style={styles.body}>{look.body}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={t.inkFaint} />
    </Pressable>
  )
}

const styles = themed(() => StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.card ?? 14, backgroundColor: t.surface, borderWidth: 1 },
  icon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { color: t.ink, fontSize: 15, fontWeight: '700' },
  body: { color: t.inkSoft, fontSize: 13, lineHeight: 18 },
}))

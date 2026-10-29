import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { request } from '../api'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import { useRelations } from '../hooks/useRelations'
import { tokens as t } from '../theme'
import { Button, Chip, MessageSheet, useToast } from './ui'

const TARGET_KIND = { projects: 'project', startups: 'startup', research: 'research' }

// The "what can I do with this?" row on a detail screen: connect, ask for mentorship, ask to join.
export function DetailActions({ kind, item }) {
  const { user } = useAuth()
  const toast = useToast()
  const rel = useRelations()
  const guidance = useApi(kind === 'faculty' ? '/me/guidance' : null)
  const [sheet, setSheet] = useState(null) // { type: 'peer'|'mentor'|'collab'|'guidance' }

  const done = (message) => { setSheet(null); rel.reload(); toast.show(message, 'success') }
  const call = async (path, body) => {
    try {
      await request(path, { method: 'POST', body })
      return null
    } catch (e) {
      return e.message
    }
  }
  const answer = async (id, verb) => {
    const err = await call(`/connections/${id}/${verb}`)
    if (err) return toast.show(err, 'error')
    rel.reload()
    toast.show(verb === 'accept' ? 'Connected' : 'Request declined', 'success')
  }

  if (kind === 'people') {
    if (item.id === user.id) return null
    const r = rel.person.get(item.id)
    const sameCampus = !!user.university && item.university === user.university
    return (
      <View style={styles.wrap}>
        {r?.status === 'connected' ? <Chip label={r.kinds.has('mentor') ? 'Your mentor connection' : 'Connected'} tone="green" /> : null}
        {r?.status === 'sent' ? <Button label="Request sent" variant="secondary" disabled /> : null}
        {r?.status === 'incoming' ? (
          <View style={{ gap: 8 }}>
            <Text style={styles.hint}>{item.name.split(' ')[0]} sent you a request.</Text>
            <View style={styles.row}>
              <Button label="Accept" onPress={() => answer(r.id, 'accept')} style={{ flex: 1 }} />
              <Button label="Decline" variant="secondary" onPress={() => answer(r.id, 'decline')} style={{ flex: 1 }} />
            </View>
          </View>
        ) : null}
        {!r ? (
          <View style={{ gap: 8 }}>
            {sameCampus && user.role === 'student' ? <Button label="Connect" icon="person-add-outline" onPress={() => setSheet({ type: 'peer' })} /> : null}
            {item.mentor?.open && user.role === 'student' ? <Button label="Ask to mentor me" icon="school-outline" variant={sameCampus ? 'secondary' : 'primary'} onPress={() => setSheet({ type: 'mentor' })} /> : null}
            {user.role !== 'student' ? <Text style={styles.hint}>Sign up with your college email to connect with students.</Text> : null}
            {user.role === 'student' && !sameCampus && !item.mentor?.open ? <Text style={styles.hint}>This student is on another campus and isn’t offering mentorship.</Text> : null}
          </View>
        ) : null}
        <MessageSheet
          visible={!!sheet && sheet.type !== 'collab'}
          title={sheet?.type === 'mentor' ? `Ask ${item.name.split(' ')[0]} to mentor you` : `Connect with ${item.name.split(' ')[0]}`}
          subtitle={sheet?.type === 'mentor' ? 'Say what you’d like guidance on. They choose whether to accept.' : 'Say hello and why you’d like to connect.'}
          placeholder={sheet?.type === 'mentor' ? 'I’m working on… and would love advice on…' : 'Hi! I saw we both like…'}
          submitLabel="Send request"
          onClose={() => setSheet(null)}
          onSubmit={async ({ message }) => {
            const err = await call('/connections', { to: item.id, kind: sheet.type, message })
            if (!err) done('Request sent')
            return err
          }}
        />
      </View>
    )
  }

  if (kind === 'faculty') {
    if (user.role !== 'student') return <Text style={styles.hint}>Sign up with your college email to ask a teacher for guidance.</Text>
    const mine = (guidance.data ?? []).find((g) => g.faculty.id === item.id && g.status !== 'withdrawn')
    const first = item.name.split(' ').slice(-1)[0]
    return (
      <View style={styles.wrap}>
        {mine?.status === 'pending' ? (
          <View style={styles.row}>
            <Button label="Request sent" variant="secondary" disabled style={{ flex: 1 }} />
            <Button label="Withdraw" variant="ghost" onPress={async () => { const err = await call(`/guidance/${mine.id}/withdraw`); if (err) toast.show(err, 'error'); else { guidance.reload(); toast.show('Request withdrawn') } }} />
          </View>
        ) : null}
        {mine?.status === 'accepted' ? (
          <View style={{ gap: 6 }}>
            <Chip label="Teacher can guide you" tone="green" />
            {mine.note ? <Text style={styles.hint}>{mine.note}</Text> : null}
          </View>
        ) : null}
        {mine?.status === 'declined' ? <Text style={styles.hint}>{first} can’t take this on right now.{mine.note ? ` “${mine.note}”` : ''} Try another teacher whose work fits yours.</Text> : null}
        {!mine || mine.status === 'declined' ? <Button label="Ask for guidance" icon="school-outline" onPress={() => setSheet({ type: 'guidance' })} /> : null}
        <MessageSheet
          visible={sheet?.type === 'guidance'}
          title={`Ask ${item.name} for guidance`}
          subtitle="Your name, branch, skills and college email are shared with the teacher so they can reply."
          placeholder="What are you building or researching, and why this teacher?"
          extraLabel="What do you want guidance on?"
          extraPlaceholder="e.g. Final-year ML project"
          extraRequired="Say what you want guidance on"
          required={false}
          submitLabel="Send request"
          onClose={() => setSheet(null)}
          onSubmit={async ({ message, extra }) => {
            const err = await call(`/faculty/${item.id}/guidance`, { topic: extra, ...(message && { message }) })
            if (!err) { setSheet(null); guidance.reload(); toast.show('Request sent', 'success') }
            return err
          }}
        />
      </View>
    )
  }

  const targetKind = TARGET_KIND[kind]
  if (!targetKind) return null
  const onTeam = (item.teamIds ?? []).includes(user.id)
  const owner = (item.ownerId ?? item.teamIds?.[0]) === user.id
  const req = rel.target.get(`${targetKind}:${item.id}`)
  const label = kind === 'research' ? 'I’m interested' : 'Ask to join'

  return (
    <View style={styles.wrap}>
      {owner ? <Chip label="You started this" tone="violet" /> : onTeam ? <Chip label="You're on the team" tone="green" /> : null}
      {!onTeam && req?.status === 'pending' ? (
        <View style={styles.row}>
          <Button label="Request sent" variant="secondary" disabled style={{ flex: 1 }} />
          <Button label="Withdraw" variant="ghost" onPress={async () => { const err = await call(`/collab/${req.id}/withdraw`); if (err) toast.show(err, 'error'); else { rel.reload(); toast.show('Request withdrawn') } }} />
        </View>
      ) : null}
      {!onTeam && req?.status === 'declined' ? <Text style={styles.hint}>The team couldn’t take your request this time.</Text> : null}
      {!onTeam && !owner && (!req || req.status === 'withdrawn') && user.role !== undefined ? (
        <Button label={label} icon="hand-right-outline" onPress={() => setSheet({ type: 'collab' })} />
      ) : null}
      <MessageSheet
        visible={sheet?.type === 'collab'}
        title={kind === 'research' ? 'Tell them why you’re interested' : 'Ask to join this team'}
        subtitle={kind === 'research' ? 'Your message goes to the people running this research.' : 'The person who started it will see your message and choose whether to accept.'}
        placeholder="What can you contribute, and what would you like to work on?"
        extraLabel={kind === 'research' ? undefined : 'Role you’d like (optional)'}
        extraPlaceholder="e.g. Backend developer"
        submitLabel="Send request"
        onClose={() => setSheet(null)}
        onSubmit={async ({ message, extra }) => {
          const err = await call('/collab', { targetKind, targetId: item.id, message, ...(extra && { role: extra }) })
          if (!err) done('Request sent')
          return err
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  hint: { color: t.inkFaint, fontSize: 13, lineHeight: 19 },
})

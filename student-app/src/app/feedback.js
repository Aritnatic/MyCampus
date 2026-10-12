import { useState } from 'react'
import { useRouter } from 'expo-router'
import Constants from 'expo-constants'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { request } from '../api'
import { Button, Field, FormError, useToast } from '../components/ui'
import { tokens as t, radius } from '../theme'

const CATEGORIES = [['bug', "Something's broken"], ['idea', 'An idea'], ['other', 'Something else']]

export default function Feedback() {
  const router = useRouter()
  const toast = useToast()
  const [category, setCategory] = useState('bug')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const send = async () => {
    if (message.trim().length < 5) return setError('Tell us a little more (at least 5 characters).')
    setBusy(true)
    try {
      await request('/feedback', { method: 'POST', body: { category, message: message.trim(), appVersion: Constants.expoConfig?.version } })
      toast.show('Thank you — the team will read this', 'success')
      router.back()
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>MyCampus is in its pilot, so what you tell us shapes what gets fixed next. Your name is shared with the admins who read this.</Text>
        <View style={{ gap: 8 }}>
          <Text style={styles.label}>What is it about?</Text>
          <View style={styles.row}>
            {CATEGORIES.map(([key, text]) => (
              <Pressable key={key} onPress={() => { setCategory(key); setError('') }} accessibilityRole="radio" accessibilityLabel={text} accessibilityState={{ checked: key === category }} style={[styles.choice, key === category && styles.choiceOn]}>
                <Text style={[styles.choiceText, key === category && { color: t.violetText }]}>{text}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Field label="Your message" value={message} onChangeText={(v) => { setMessage(v.slice(0, 2000)); setError('') }} multiline placeholder={category === 'bug' ? 'What did you do, and what happened instead?' : 'Tell us what you have in mind.'} hint={`${message.length}/2000`} />
        <FormError message={error} />
        <Button label="Send feedback" onPress={send} loading={busy} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48, gap: 18 },
  intro: { color: t.inkSoft, fontSize: 14, lineHeight: 21 },
  label: { color: t.inkSoft, fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minHeight: 40, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderRadius: radius.button, backgroundColor: t.sunken, borderWidth: 1, borderColor: t.hairline },
  choiceOn: { backgroundColor: t.violetSoft, borderColor: t.violet },
  choiceText: { color: t.inkSoft, fontSize: 13, fontWeight: '600' },
})

import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { tokens as t, radius } from '../theme'

// Shared frame for sign-in, sign-up, verification and password reset.
export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logo} accessibilityElementsHidden><Text style={styles.logoText}>M</Text></View>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
          <View style={{ gap: 14, marginTop: 20 }}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// Shown only when the development API hands back the code (it never does in production).
export function DevCode({ code, onUse }) {
  if (!code) return null
  return (
    <Text onPress={onUse} style={styles.dev} accessibilityRole="button" accessibilityLabel={`Use development code ${code}`}>
      Dev server code: <Text style={{ fontWeight: '800' }}>{code}</Text> — tap to fill
    </Text>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: t.canvas },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { width: 52, height: 52, borderRadius: radius.container, backgroundColor: t.violet, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { color: '#fff', fontSize: 26, fontWeight: '800' },
  title: { color: t.ink, fontSize: 28, fontWeight: '800' },
  sub: { color: t.inkSoft, fontSize: 15, lineHeight: 22, marginTop: 6 },
  footer: { marginTop: 22, alignItems: 'center', gap: 10 },
  dev: { color: t.yellowText, backgroundColor: t.yellowSoft, borderRadius: radius.button, padding: 10, fontSize: 12, textAlign: 'center', overflow: 'hidden' },
})

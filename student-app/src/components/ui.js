import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Animated, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { tokens as t, radius } from '../theme'

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

export function Card({ children, style, onPress, accessibilityLabel }) {
  const body = [styles.card, style]
  if (!onPress) return <View style={body}>{children}</View>
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [...body, pressed && { backgroundColor: t.hover }]}
    >
      {children}
    </Pressable>
  )
}

const TONES = {
  violet: [t.violetSoft, t.violetText],
  green: [t.greenSoft, t.greenText],
  yellow: [t.yellowSoft, t.yellowText],
  blue: [t.blueSoft, t.blueText],
  red: ['rgba(248, 113, 113, 0.14)', '#f87171'],
  neutral: [t.sunken, t.inkSoft],
}

export function Chip({ label, tone = 'neutral', onRemove }) {
  const [bg, fg] = TONES[tone]
  const text = label.charAt(0).toUpperCase() + label.slice(1)
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.chipText, { color: fg }]}>{text}</Text>
      {onRemove ? (
        <Pressable onPress={onRemove} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Remove ${label}`}>
          <Ionicons name="close" size={12} color={fg} />
        </Pressable>
      ) : null}
    </View>
  )
}

export function SectionHeader({ title, action, onAction }) {
  return (
    <View style={styles.sectionRow}>
      <Text accessibilityRole="header" style={styles.section}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="button">
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

export function Segmented({ options, value, onChange }) {
  return (
    <View style={styles.segmented} accessibilityRole="tablist">
      {options.map((o) => (
        <Pressable
          key={o.value}
          onPress={() => onChange(o.value)}
          accessibilityRole="tab"
          accessibilityLabel={o.label}
          accessibilityState={{ selected: value === o.value }}
          style={[styles.seg, value === o.value && styles.segOn]}
        >
          <Text style={[styles.segText, value === o.value && { color: t.ink }]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  )
}

export function Avatar({ name = '?', size = 44 }) {
  const initials = name.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w)).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?'
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.violetSoft, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ color: t.violetText, fontWeight: '800', fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Actions & form fields
// ---------------------------------------------------------------------------

const BUTTONS = {
  primary: { bg: t.violet, fg: '#fff', border: t.violet },
  secondary: { bg: 'transparent', fg: t.ink, border: t.hairline },
  ghost: { bg: 'transparent', fg: t.violetText, border: 'transparent' },
  danger: { bg: 'transparent', fg: '#f87171', border: t.hairline },
}

export function Button({ label, onPress, variant = 'primary', loading, disabled, icon, style, compact }) {
  const v = BUTTONS[variant]
  const off = disabled || loading
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: v.bg, borderColor: v.border, minHeight: compact ? 40 : 48 },
        off && { opacity: 0.5 },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={v.fg} size="small" /> : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={v.fg} /> : null}
          <Text style={[styles.buttonText, { color: v.fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  )
}

export function Field({ label, error, hint, secure, style, inputRef, ...input }) {
  const [hidden, setHidden] = useState(!!secure)
  return (
    <View style={[{ gap: 6 }, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputWrap, error && { borderColor: '#f87171' }]}>
        <TextInput
          ref={inputRef}
          style={[styles.input, input.multiline && { minHeight: 96, textAlignVertical: 'top' }]}
          placeholderTextColor={t.inkFaint}
          secureTextEntry={hidden}
          accessibilityLabel={label}
          {...input}
        />
        {secure ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10} accessibilityRole="button" accessibilityLabel={hidden ? 'Show password' : 'Hide password'}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={t.inkFaint} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  )
}

// Message for a failure that belongs to the whole form (server errors), shown above the submit button.
export function FormError({ message }) {
  if (!message) return null
  return <Text accessibilityLiveRegion="polite" accessibilityRole="alert" style={[styles.error, { fontSize: 13 }]}>{message}</Text>
}

// A list of short phrases: type, press add, tap × to remove. Used for skills, interests, etc.
export function TagInput({ label, values, onChange, placeholder, max = 30, tone = 'violet', hint }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const word = draft.trim()
    if (!word || values.length >= max) return
    if (!values.some((v) => v.toLowerCase() === word.toLowerCase())) onChange([...values, word])
    setDraft('')
  }
  return (
    <View style={{ gap: 8 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.tagRow}>
        <View style={[styles.inputWrap, { flex: 1 }]}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={add}
            placeholder={placeholder}
            placeholderTextColor={t.inkFaint}
            returnKeyType="done"
            accessibilityLabel={label}
            maxLength={80}
          />
        </View>
        <Button label="Add" variant="secondary" onPress={add} compact disabled={!draft.trim()} />
      </View>
      {values.length ? (
        <View style={styles.wrap}>{values.map((v) => <Chip key={v} label={v} tone={tone} onRemove={() => onChange(values.filter((x) => x !== v))} />)}</View>
      ) : null}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  )
}

// ---------------------------------------------------------------------------
// Loading, empty and error states
// ---------------------------------------------------------------------------

export function Skeleton({ height = 16, width = '100%', style }) {
  const pulse = useRef(new Animated.Value(0.45)).current
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.45, duration: 700, useNativeDriver: true }),
    ]))
    loop.start()
    return () => loop.stop()
  }, [pulse])
  return <Animated.View style={[{ height, width, borderRadius: 6, backgroundColor: t.hover, opacity: pulse }, style]} />
}

export function SkeletonCards({ count = 3 }) {
  return (
    <View style={{ gap: 10 }} accessibilityLabel="Loading" accessibilityRole="progressbar">
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} style={{ gap: 10 }}>
          <Skeleton width={70} height={18} />
          <Skeleton height={18} />
          <Skeleton width="60%" height={12} />
        </Card>
      ))}
    </View>
  )
}

export function EmptyState({ icon = 'file-tray-outline', title, body, action, onAction }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}><Ionicons name={icon} size={26} color={t.violetText} /></View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
      {action ? <Button label={action} onPress={onAction} variant="secondary" compact style={{ marginTop: 8 }} /> : null}
    </View>
  )
}

// Wraps a request's states: skeleton while loading, a retry prompt on failure, an empty state when there's nothing.
export function Async({ loading, error, onRetry, empty, emptyIcon, emptyTitle, children, skeletons = 3 }) {
  if (loading) return <SkeletonCards count={skeletons} />
  if (error) return <EmptyState icon="cloud-offline-outline" title="Couldn't load this" body={error} action={onRetry ? 'Try again' : undefined} onAction={onRetry} />
  if (empty) return <EmptyState icon={emptyIcon} title={emptyTitle ?? empty} body={emptyTitle ? empty : undefined} />
  return children
}

// ---------------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------------

const ToastContext = createContext({ show: () => {} })
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const opacity = useRef(new Animated.Value(0)).current
  const timer = useRef(null)

  const show = useCallback((message, kind = 'info') => {
    clearTimeout(timer.current)
    setToast({ message, kind })
    Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }).start()
    timer.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setToast(null))
    }, 3200)
  }, [opacity])

  const value = useMemo(() => ({ show }), [show])
  const color = toast?.kind === 'error' ? '#f87171' : toast?.kind === 'success' ? t.greenText : t.ink
  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View pointerEvents="none" accessibilityLiveRegion="polite" style={[styles.toast, { opacity, borderColor: color }]}>
          <Text style={[styles.toastText, { color }]}>{toast.message}</Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  )
}

// A bottom sheet that asks for a short message (connection requests, "ask to join"). Optional extra field.
export function MessageSheet({ visible, title, subtitle, placeholder, submitLabel = 'Send', extraLabel, extraPlaceholder, required = true, onClose, onSubmit }) {
  const [message, setMessage] = useState('')
  const [extra, setExtra] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (visible) { setMessage(''); setExtra(''); setError(null); setBusy(false) } }, [visible])

  const send = async () => {
    if (required && !message.trim()) return setError('Add a short message so they know who you are.')
    setBusy(true)
    const err = await onSubmit({ message: message.trim(), extra: extra.trim() })
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button" />
        <View style={styles.sheet} accessibilityViewIsModal>
          <Text accessibilityRole="header" style={styles.sheetTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sheetSub}>{subtitle}</Text> : null}
          {extraLabel ? <Field label={extraLabel} value={extra} onChangeText={setExtra} placeholder={extraPlaceholder} maxLength={80} /> : null}
          <Field label="Message" value={message} onChangeText={(v) => { setMessage(v.slice(0, 500)); setError(null) }} multiline placeholder={placeholder} error={error} hint={`${message.length}/500`} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
            <Button label={submitLabel} onPress={send} loading={busy} style={{ flex: 1 }} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// Asks for the account password before a destructive action (deleting the account).
export function PasswordSheet({ visible, title, subtitle, submitLabel, danger, onClose, onSubmit }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (visible) { setPassword(''); setError(null); setBusy(false) } }, [visible])

  const go = async () => {
    if (!password) return setError('Enter your password to continue.')
    setBusy(true)
    const err = await onSubmit(password)
    setBusy(false)
    if (err) setError(err)
  }
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button" />
        <View style={styles.sheet} accessibilityViewIsModal>
          <Text accessibilityRole="header" style={styles.sheetTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sheetSub}>{subtitle}</Text> : null}
          <Field label="Password" value={password} onChangeText={(v) => { setPassword(v); setError(null) }} secure onSubmitEditing={go} error={error} autoFocus textContentType="password" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
            <Button label={submitLabel} variant={danger ? 'danger' : 'primary'} onPress={go} loading={busy} style={{ flex: 1 }} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

// Minimal renderer for the **bold** / "- bullet" / "1. step" text used in notice bodies.
export function RichText({ text }) {
  return (
    <View style={{ gap: 8 }}>
      {String(text ?? '').split('\n').filter((l) => l.trim()).map((line, i) => {
        const bullet = /^(- |\d+\. )/.test(line)
        const parts = line.replace(/^- /, '• ').split(/\*\*(.+?)\*\*/g)
        return (
          <Text key={i} style={[styles.body, bullet && { paddingLeft: 8 }]}>
            {parts.map((p, j) => (j % 2 ? <Text key={j} style={{ color: t.ink, fontWeight: '600' }}>{p}</Text> : p))}
          </Text>
        )
      })}
    </View>
  )
}

export const formatDate = (iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', opts)
}

export const timeAgo = (iso) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d ago`
  return formatDate(iso, { day: 'numeric', month: 'short' })
}

const styles = StyleSheet.create({
  card: { backgroundColor: t.surface, borderRadius: radius.container, borderWidth: 1, borderColor: t.hairline, padding: 14 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.chip, alignSelf: 'flex-start' },
  chipText: { fontSize: 11, fontWeight: '600' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 10 },
  section: { color: t.ink, fontSize: 17, fontWeight: '700' },
  action: { color: t.violetText, fontSize: 13, fontWeight: '600' },
  segmented: { flexDirection: 'row', backgroundColor: t.sunken, borderRadius: radius.button, padding: 3 },
  seg: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, minHeight: 40, justifyContent: 'center' },
  segOn: { backgroundColor: t.hover },
  segText: { color: t.inkSoft, fontSize: 13, fontWeight: '600' },
  body: { color: t.inkSoft, fontSize: 14, lineHeight: 21 },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radius.button, borderWidth: 1, paddingHorizontal: 16 },
  buttonText: { fontSize: 15, fontWeight: '700' },
  label: { color: t.inkSoft, fontSize: 13, fontWeight: '600' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.sunken, borderRadius: radius.button, borderWidth: 1, borderColor: t.hairline, paddingHorizontal: 14 },
  input: { flex: 1, color: t.ink, fontSize: 15, paddingVertical: 13 },
  error: { color: '#f87171', fontSize: 12 },
  hint: { color: t.inkFaint, fontSize: 12 },
  tagRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  empty: { alignItems: 'center', gap: 6, paddingVertical: 36, paddingHorizontal: 24 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: t.violetSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emptyTitle: { color: t.ink, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  emptyBody: { color: t.inkSoft, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  sheetWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { backgroundColor: t.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32, gap: 14, borderWidth: 1, borderColor: t.hairline },
  sheetTitle: { color: t.ink, fontSize: 18, fontWeight: '800' },
  sheetSub: { color: t.inkSoft, fontSize: 13, lineHeight: 19, marginTop: -6 },
  toast: { position: 'absolute', left: 16, right: 16, bottom: 96, backgroundColor: t.surface, borderRadius: radius.button, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 16 },
  toastText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
})

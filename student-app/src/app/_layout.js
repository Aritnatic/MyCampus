import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View } from 'react-native'
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context'
import { activeAlerts, useAlerts } from '../alerts'
import { AlertBanner } from '../components/AlertBanner'
import { RealtimeBridge } from '../components/RealtimeBridge'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { ThemeProvider, useTheme } from '../context/ThemeContext'
import { ToastProvider } from '../components/ui'
import { tokens as t } from '../theme'

const detail = (title) => ({ title, headerBackTitle: 'Back' })

function RootStack() {
  const { user, ready } = useAuth()
  const insets = useSafeAreaInsets()
  const { mode } = useTheme()
  useAlerts()
  const live = user ? activeAlerts() : []
  const banner = live[0]
  if (!ready) return null

  // The banner owns the top safe-area inset while it's showing, so screen headers don't add it twice.
  return (
    <View key={mode} style={{ flex: 1, backgroundColor: t.canvas }}>
      {banner ? <AlertBanner alert={banner} count={live.length} /> : null}
      <SafeAreaInsetsContext.Provider value={banner ? { ...insets, top: 0 } : insets}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: t.canvas },
            headerTintColor: t.ink,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: t.canvas },
          }}
        >
          <Stack.Protected guard={!user}>
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen name="verify" options={{ headerShown: false }} />
            <Stack.Screen name="forgot" options={{ headerShown: false }} />
          </Stack.Protected>
          <Stack.Protected guard={!!user}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="alerts" options={detail('Safety alerts')} />
            <Stack.Screen name="notices" options={detail('Notices')} />
            <Stack.Screen name="search" options={{ ...detail('Search'), headerBackTitle: 'Home' }} />
            <Stack.Screen name="project-new" options={detail('Start a project')} />
            <Stack.Screen name="change-password" options={detail('Change password')} />
            <Stack.Screen name="feedback" options={detail('Send feedback')} />
            <Stack.Screen name="profile-edit" options={detail('Edit profile')} />
            <Stack.Screen name="exams" options={detail('Exams & results')} />
            <Stack.Screen name="notes" options={detail('Study notes')} />
            <Stack.Screen name="note-new" options={detail('Share notes')} />
            <Stack.Screen name="notice/[id]" options={detail('Notice')} />
            <Stack.Screen name="event/[id]" options={detail('Event')} />
            <Stack.Screen name="map" options={detail('Campus map')} />
            <Stack.Screen name="career" options={detail('Career paths')} />
            <Stack.Screen name="career/[id]" options={detail('Career path')} />
            <Stack.Screen name="my-events" options={detail('My events')} />
            <Stack.Screen name="discover/[kind]/[id]" options={detail('Details')} />
          </Stack.Protected>
        </Stack>
      </SafeAreaInsetsContext.Provider>
      {user ? <RealtimeBridge /> : null}
    </View>
  )
}

function ThemedStatusBar() {
  const { mode } = useTheme()
  return <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <ThemedStatusBar />
          <RootStack />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

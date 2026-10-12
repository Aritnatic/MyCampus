import Constants, { ExecutionEnvironment } from 'expo-constants'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { request } from './api'

// Remote push can't work everywhere, and on Android Expo Go merely *importing* expo-notifications throws.
// So the package is loaded lazily, and only where it can work: a real device running a development or
// store build. In Expo Go, on web and in simulators this is a no-op — the in-app live stream still
// delivers everything while the app is open.
const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient
let notifications // undefined = not tried yet, false = unavailable

function load() {
  if (notifications !== undefined) return notifications
  notifications = false
  if (Platform.OS === 'web' || inExpoGo || !Device.isDevice) return notifications
  try {
    const mod = require('expo-notifications')
    // Shown while the app is open: the in-app toast/banner already covers it, so skip the system banner.
    mod.setNotificationHandler({
      handleNotification: async () => ({ shouldPlaySound: false, shouldSetBadge: false, shouldShowBanner: false, shouldShowList: true }),
    })
    notifications = mod
  } catch {
    notifications = false
  }
  return notifications
}

let registered = null

// Registers this phone for push. Needs an EAS project id; without one it quietly does nothing.
export async function registerForPush() {
  try {
    const Notifications = load()
    if (!Notifications) return null
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
    if (!projectId) return null

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', { name: 'Campus updates', importance: Notifications.AndroidImportance.DEFAULT })
      await Notifications.setNotificationChannelAsync('alerts', { name: 'Safety alerts', importance: Notifications.AndroidImportance.MAX, vibrationPattern: [0, 250, 250, 250] })
    }
    const existing = await Notifications.getPermissionsAsync()
    const status = existing.status === 'granted' ? 'granted' : (await Notifications.requestPermissionsAsync()).status
    if (status !== 'granted') return null

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId })
    await request('/me/push-token', { method: 'POST', body: { token, platform: Platform.OS } })
    registered = token
    return token
  } catch {
    return null // push is best-effort; never block sign-in on it
  }
}

// Called on sign-out so the next person on this phone doesn't receive this account's notifications.
export async function unregisterPush() {
  if (!registered) return
  const token = registered
  registered = null
  await request('/me/push-token', { method: 'DELETE', body: { token } }).catch(() => {})
}

import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'

// Auth tokens go in the iOS Keychain / Android Keystore. SecureStore has no web
// implementation, so web builds (dev preview only) fall back to AsyncStorage.
const native = Platform.OS !== 'web'

export const secureStorage = {
  get: (key) => (native ? SecureStore.getItemAsync(key) : AsyncStorage.getItem(key)),
  set: (key, value) => (native ? SecureStore.setItemAsync(key, value) : AsyncStorage.setItem(key, value)),
  remove: (key) => (native ? SecureStore.deleteItemAsync(key) : AsyncStorage.removeItem(key)),
}

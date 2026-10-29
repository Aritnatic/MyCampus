import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { setPalette } from '../theme'

// The person's choice: follow the phone ('system'), or force 'light' / 'dark'. Remembered on the device.
const KEY = 'mycampus.theme'
const CHOICES = ['system', 'light', 'dark']

const ThemeContext = createContext({ choice: 'system', mode: 'dark', setChoice: () => {} })
export const useTheme = () => useContext(ThemeContext)

export function ThemeProvider({ children }) {
  const system = useColorScheme()
  const [choice, setChoiceState] = useState(null) // null until the saved choice has loaded

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => setChoiceState(CHOICES.includes(v) ? v : 'system')).catch(() => setChoiceState('system'))
  }, [])

  const setChoice = useCallback((next) => {
    setChoiceState(next)
    AsyncStorage.setItem(KEY, next).catch(() => {})
  }, [])

  const mode = (choice ?? 'system') === 'system' ? (system === 'light' ? 'light' : 'dark') : choice
  // Set before children render so their first read already sees the right palette.
  setPalette(mode)

  const value = useMemo(() => ({ choice: choice ?? 'system', mode, setChoice }), [choice, mode, setChoice])
  if (choice === null) return null // a beat on first launch, instead of flashing the wrong theme
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

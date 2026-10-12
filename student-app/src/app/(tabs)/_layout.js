import { useEffect } from 'react'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { refreshUnread, useUnread } from '../../unread'
import { tokens as t } from '../../theme'

const icon = (name) => ({ color, size }) => <Ionicons name={name} size={size} color={color} />

export default function TabLayout() {
  const unread = useUnread()

  // Keep the Inbox badge fresh while signed in.
  useEffect(() => {
    refreshUnread()
    const id = setInterval(refreshUnread, 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: t.canvas },
        headerTintColor: t.ink,
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: t.canvas },
        tabBarActiveTintColor: t.violetText,
        tabBarInactiveTintColor: t.inkFaint,
        tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.hairline },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home-outline') }} />
      <Tabs.Screen name="discover" options={{ title: 'Discover', tabBarIcon: icon('compass-outline') }} />
      <Tabs.Screen name="campus" options={{ title: 'Campus', tabBarIcon: icon('business-outline') }} />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: icon('notifications-outline'),
          tabBarBadge: unread > 0 ? (unread > 99 ? '99+' : unread) : undefined,
          tabBarBadgeStyle: { backgroundColor: t.violet, color: '#fff' },
        }}
      />
      <Tabs.Screen name="me" options={{ title: 'Me', tabBarIcon: icon('person-outline') }} />
    </Tabs>
  )
}

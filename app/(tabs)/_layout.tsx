import { Tabs } from 'expo-router'
import { House, Dumbbell, List, BarChart2, User } from 'lucide-react-native'
import TabBar, { TAB_BAR_HEIGHT } from '@/components/TabBar'
import { BG } from '@/lib/theme'

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: BG },
        tabBarStyle: { height: TAB_BAR_HEIGHT },
        animation: 'fade',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <House size={size} color={color} strokeWidth={1.6} />
          ),
        }}
      />

      <Tabs.Screen
        name="workout"
        options={{
          tabBarLabel: 'Workout',
          tabBarIcon: ({ color, size }) => (
            <Dumbbell size={size} color={color} strokeWidth={1.6} />
          ),
        }}
      />

      <Tabs.Screen
        name="exercises"
        options={{
          tabBarLabel: 'Exercises',
          tabBarIcon: ({ color, size }) => (
            <List size={size} color={color} strokeWidth={1.6} />
          ),
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          tabBarLabel: 'Progress',
          tabBarIcon: ({ color, size }) => (
            <BarChart2 size={size} color={color} strokeWidth={1.6} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} strokeWidth={1.6} />
          ),
        }}
      />

      {/* Explicitly hide unused files if they exist in the folder */}
      <Tabs.Screen name="activity" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="leaderboard" options={{ href: null }} />
    </Tabs>
  )
}

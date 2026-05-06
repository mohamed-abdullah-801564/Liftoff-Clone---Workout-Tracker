import { useState, useMemo, useEffect, useCallback } from 'react'
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import {
    ACCENT,
    BG,
    SURFACE,
    SURFACE2,
    TEXT_SECONDARY,
    TEXT_TERTIARY,
    BORDER,
} from '@/lib/theme'
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'
import { Trophy, Users, TrendingUp } from 'lucide-react-native'

type TabType = 'weekly' | 'monthly'

interface UserEntry {
    id: string
    name: string
    volume: number
    isMe?: boolean
}

const SIMULATED_USERS = [
    { id: '1', name: 'Marcus.S' },
    { id: '2', name: 'Alex_Riggs' },
    { id: '3', name: 'K_Baxter' },
    { id: '4', name: 'Sarah_Fit' },
    { id: '5', name: 'Iron_Mike' },
    { id: '6', name: 'Elena.V' },
    { id: '7', name: 'ChrisP_Bacon' },
    { id: '8', name: 'GymRat99' },
    { id: '9', name: 'Power_User' },
    { id: '10', name: 'Zoe_Strong' },
]

export default function LeaderboardScreen() {
    const insets = useSafeAreaInsets()
    const [activeTab, setActiveTab] = useState<TabType>('weekly')
    const [myVolume, setMyVolume] = useState({ weekly: 0, monthly: 0 })
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('You')

    const loadData = useCallback(async () => {
        try {
            const workoutsData = await AsyncStorage.getItem('workouts')
            const workouts = workoutsData ? JSON.parse(workoutsData) : []
            const name = await AsyncStorage.getItem('user_name')
            if (name) setUserName(name)

            const now = new Date()
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)))
            startOfWeek.setHours(0, 0, 0, 0)

            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

            let weeklyVolume = 0
            let monthlyVolume = 0

            workouts.forEach((w: any) => {
                const wDate = new Date(w.date)
                if (wDate >= startOfWeek) weeklyVolume += (w.volume || 0)
                if (wDate >= startOfMonth) monthlyVolume += (w.volume || 0)
            })

            setMyVolume({ weekly: weeklyVolume, monthly: monthlyVolume })
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }, [])

    useFocusEffect(
        useCallback(() => {
            loadData()
        }, [loadData])
    )

    const leaderboardData = useMemo(() => {
        const currentVolume = activeTab === 'weekly' ? myVolume.weekly : myVolume.monthly
        
        // Generate simulated volumes based on the tab
        const multiplier = activeTab === 'weekly' ? 1 : 4
        const entries: UserEntry[] = SIMULATED_USERS.map(u => ({
            id: u.id,
            name: u.name,
            volume: Math.floor((15000 + (parseInt(u.id) * 1200)) * multiplier + Math.random() * 500)
        }))

        // Add me
        entries.push({ id: 'me', name: userName, volume: currentVolume, isMe: true })

        // Sort by volume
        return entries.sort((a, b) => b.volume - a.volume)
    }, [activeTab, myVolume, userName])

    const getRankIcon = (index: number) => {
        if (index === 0) return '🥇'
        if (index === 1) return '🥈'
        if (index === 2) return '🥉'
        return null
    }

    const getInitials = (name: string) => {
        return name.substring(0, 2).toUpperCase()
    }

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: BG, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator color={ACCENT} size="large" />
            </View>
        )
    }

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <View style={[s.header, { paddingTop: insets.top + 10 }]}>
                <Text style={s.title}>Leaderboard</Text>
                <View style={s.tabRow}>
                    <Pressable 
                        onPress={() => setActiveTab('weekly')}
                        style={[s.tab, activeTab === 'weekly' && s.tabActive]}
                    >
                        <Text style={[s.tabText, activeTab === 'weekly' && s.tabTextActive]}>Weekly</Text>
                    </Pressable>
                    <Pressable 
                        onPress={() => setActiveTab('monthly')}
                        style={[s.tab, activeTab === 'monthly' && s.tabActive]}
                    >
                        <Text style={[s.tabText, activeTab === 'monthly' && s.tabTextActive]}>Monthly</Text>
                    </Pressable>
                </View>
            </View>

            <ScrollView 
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE + 20 }}
                showsVerticalScrollIndicator={false}
            >
                <View style={s.listContainer}>
                    {leaderboardData.map((user, index) => (
                        <Card 
                            key={user.id} 
                            style={[
                                s.row, 
                                user.isMe && s.rowMe,
                                index === 0 && s.rowTop1
                            ]}
                        >
                            <View style={s.rankWrap}>
                                {getRankIcon(index) ? (
                                    <Text style={s.rankEmoji}>{getRankIcon(index)}</Text>
                                ) : (
                                    <Text style={s.rankNum}>{index + 1}</Text>
                                )}
                            </View>

                            <View style={s.avatar}>
                                <Text style={s.avatarText}>{getInitials(user.name)}</Text>
                            </View>

                            <View style={s.info}>
                                <Text style={[s.name, user.isMe && s.nameMe]}>
                                    {user.isMe ? 'You' : user.name}
                                </Text>
                                <Text style={s.subText}>{user.isMe ? 'Keep pushing!' : 'Elite Member'}</Text>
                            </View>

                            <View style={s.volumeWrap}>
                                <Text style={s.volumeText}>{(user.volume / 1000).toFixed(1)}k</Text>
                                <Text style={s.volumeLabel}>KG</Text>
                            </View>
                        </Card>
                    ))}
                </View>
            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    header: { paddingHorizontal: 20, paddingBottom: 20 },
    title: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: 20 },
    
    tabRow: { flexDirection: 'row', backgroundColor: SURFACE, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: BORDER },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
    tabActive: { backgroundColor: SURFACE2 },
    tabText: { fontSize: 14, fontWeight: '700', color: TEXT_TERTIARY },
    tabTextActive: { color: '#fff' },

    listContainer: { paddingHorizontal: 20, gap: 10 },
    row: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
    rowMe: { borderColor: ACCENT, borderWidth: 2, shadowColor: ACCENT, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
    rowTop1: { backgroundColor: 'rgba(255, 215, 0, 0.05)', borderColor: 'rgba(255, 215, 0, 0.2)' },
    
    rankWrap: { width: 30, alignItems: 'center' },
    rankEmoji: { fontSize: 20 },
    rankNum: { fontSize: 14, fontWeight: '700', color: TEXT_TERTIARY },

    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: SURFACE2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER },
    avatarText: { fontSize: 14, fontWeight: '800', color: '#fff' },

    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: '700', color: '#fff' },
    nameMe: { color: ACCENT },
    subText: { fontSize: 12, color: TEXT_TERTIARY, marginTop: 2 },

    volumeWrap: { alignItems: 'flex-end' },
    volumeText: { fontSize: 17, fontWeight: '800', color: '#fff' },
    volumeLabel: { fontSize: 10, fontWeight: '800', color: TEXT_TERTIARY }
})

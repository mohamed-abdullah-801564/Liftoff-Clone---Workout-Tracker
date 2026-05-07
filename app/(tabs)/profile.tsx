import { useState, useMemo, useEffect, useCallback } from 'react'
import { View, ScrollView, StyleSheet, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native'
import { AvatarPicker, AvatarDisplay } from '@/components/AvatarPicker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect, router } from 'expo-router'
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
import { Dumbbell, Activity, Flame, Trophy, Settings, LogOut, User, Trash2, Users, Calendar } from 'lucide-react-native'

const SIMULATED_USERS = [
    { id: '1', name: 'Marcus.S' },
    { id: '2', name: 'Alex_Riggs' },
    { id: '3', name: 'K_Baxter' },
    { id: '4', name: 'Sarah_Fit' },
    { id: '5', name: 'Iron_Mike' },
]

export default function ProfileScreen() {
    const insets = useSafeAreaInsets()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Alex Riggs')
    const [userAvatar, setUserAvatar] = useState<any>(null)
    const [showAvatarPicker, setShowAvatarPicker] = useState(false)
    const [isEditingName, setIsEditingName] = useState(false)
    const [tempName, setTempName] = useState('')
    
    const [stats, setStats] = useState({
        totalWorkouts: 0,
        totalVolume: 0,
        streak: 0,
        weeklyVolume: 0,
        monthlyVolume: 0
    })
    const [leaderboardTab, setLeaderboardTab] = useState<'weekly' | 'monthly'>('weekly')
    const [prs, setPrs] = useState<any[]>([])

    const loadData = useCallback(async () => {
        try {
            const workoutsData = await AsyncStorage.getItem('workouts')
            const workouts = workoutsData ? JSON.parse(workoutsData) : []
            const savedName = await AsyncStorage.getItem('user_name')
            const savedAvatar = await AsyncStorage.getItem('user_avatar')
            if (savedName) setUserName(savedName)
            if (savedAvatar) setUserAvatar(JSON.parse(savedAvatar))

            // Calculate stats
            const totalWorkouts = workouts.length
            const totalVolume = workouts.reduce((acc: number, w: any) => acc + (w.volume || 0), 0)
            
            // Calculate weekly/monthly volumes
            const now = new Date()
            const startOfWeek = new Date(now.getTime())
            startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))
            startOfWeek.setHours(0, 0, 0, 0)
            const weeklyVolume = workouts.filter((w: any) => new Date(w.date) >= startOfWeek).reduce((acc: number, w: any) => acc + (w.volume || 0), 0)

            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            const monthlyVolume = workouts.filter((w: any) => new Date(w.date) >= startOfMonth).reduce((acc: number, w: any) => acc + (w.volume || 0), 0)

            // Calculate streak
            let streak = 0
            if (workouts.length > 0) {
                const sortedWorkouts = [...workouts].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                const today = new Date().setHours(0,0,0,0)
                let lastDate = new Date(sortedWorkouts[0].date).setHours(0,0,0,0)
                if (today - lastDate <= 86400000) {
                    streak = 1
                    let prevDate = lastDate
                    for (let i = 1; i < sortedWorkouts.length; i++) {
                        const d = new Date(sortedWorkouts[i].date).setHours(0,0,0,0)
                        if (prevDate - d === 86400000) { streak++; prevDate = d; }
                        else if (prevDate - d === 0) continue
                        else break
                    }
                }
            }

            setStats({ totalWorkouts, totalVolume, streak, weeklyVolume, monthlyVolume })

            // Calculate PRs
            const prMap = new Map<string, number>()
            workouts.forEach((w: any) => {
                w.exercises.forEach((ex: any) => {
                    const bestWeight = Math.max(...ex.sets.map((s: any) => parseFloat(s.weight) || 0))
                    if (!prMap.has(ex.name) || bestWeight > prMap.get(ex.name)!) prMap.set(ex.name, bestWeight)
                })
            })

            const prList = Array.from(prMap.entries())
                .map(([name, weight]) => ({ name, weight }))
                .filter(pr => pr.weight > 0)
                .sort((a, b) => b.weight - a.weight)
                .slice(0, 5)
            setPrs(prList)

        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }, [])

    useFocusEffect(useCallback(() => { loadData() }, [loadData]))

    const leaderboardData = useMemo(() => {
        const multiplier = leaderboardTab === 'weekly' ? 1 : 4
        const entries = SIMULATED_USERS.map(u => ({
            id: u.id,
            name: u.name,
            volume: Math.floor((15000 + (parseInt(u.id) * 1200) + Math.random() * 500) * multiplier)
        }))
        const myVol = leaderboardTab === 'weekly' ? stats.weeklyVolume : stats.monthlyVolume
        entries.push({ id: 'me', name: userName, volume: myVol })
        return entries.sort((a, b) => b.volume - a.volume)
    }, [userName, stats.weeklyVolume, stats.monthlyVolume, leaderboardTab])

    const handleSaveName = async () => {
        if (!tempName.trim()) return
        await AsyncStorage.setItem('user_name', tempName.trim())
        setUserName(tempName.trim())
        setIsEditingName(false)
    }

    const handleResetData = () => {
        Alert.alert("Reset All Data?", "This will permanently delete your workout history, PRs, and settings.", [
            { text: "Cancel", style: "cancel" },
            { text: "Reset", style: "destructive", onPress: async () => {
                await AsyncStorage.clear()
                setUserName('Alex Riggs')
                setStats({ totalWorkouts: 0, totalVolume: 0, streak: 0, weeklyVolume: 0, monthlyVolume: 0 })
                setPrs([])
                router.replace('/')
            }}
        ])
    }

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)

    if (loading) return (
        <View style={{ flex: 1, backgroundColor: BG, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color={ACCENT} size="large" />
        </View>
    )

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <ScrollView 
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: TAB_BAR_CLEARANCE + 20 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Header */}
                <View style={s.profileHeader}>
                    <Pressable style={s.avatarLarge} onPress={() => setShowAvatarPicker(true)}>
                        <AvatarDisplay avatar={userAvatar} size={80} fallbackText={getInitials(userName)} />
                        <View style={s.editAvatar}>
                            <Settings size={14} color="#fff" />
                        </View>
                    </Pressable>
                    
                    {isEditingName ? (
                        <View style={s.editNameRow}>
                            <TextInput 
                                style={s.nameInput}
                                value={tempName}
                                onChangeText={setTempName}
                                autoFocus
                                placeholder="Enter name"
                                placeholderTextColor={TEXT_TERTIARY}
                            />
                            <Pressable onPress={handleSaveName} style={s.saveBtn}>
                                <Text style={s.saveBtnText}>Save</Text>
                            </Pressable>
                        </View>
                    ) : (
                        <Pressable onPress={() => { setTempName(userName); setIsEditingName(true); }} style={s.nameWrap}>
                            <Text style={s.profileName}>{userName}</Text>
                            <Text style={s.profileSub}>Elite Athlete</Text>
                        </Pressable>
                    )}
                </View>

                {/* Main Stats */}
                <View style={s.statsGrid}>
                    <Card style={s.statBox}>
                        <Dumbbell size={20} color={ACCENT} />
                        <Text style={s.statVal}>{stats.totalWorkouts}</Text>
                        <Text style={s.statLabel}>Workouts</Text>
                    </Card>
                    <Card style={s.statBox}>
                        <Activity size={20} color="#10b981" />
                        <Text style={s.statVal}>{(stats.totalVolume / 1000).toFixed(1)}k</Text>
                        <Text style={s.statLabel}>Total Vol</Text>
                    </Card>
                    <Card style={s.statBox}>
                        <Flame size={20} color="#f59e0b" />
                        <Text style={s.statVal}>{stats.streak}</Text>
                        <Text style={s.statLabel}>Streak</Text>
                    </Card>
                </View>

                {/* Leaderboard Section */}
                <View style={s.section}>
                    <View style={s.sectionHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                            <Users size={18} color={ACCENT} />
                            <Text style={s.sectionTitle}>COMMUNITY RANKINGS ({leaderboardTab.toUpperCase()})</Text>
                        </View>
                        <View style={s.miniToggle}>
                            <Pressable 
                                onPress={() => setLeaderboardTab('weekly')}
                                style={[s.miniTab, leaderboardTab === 'weekly' && s.miniTabActive]}
                            >
                                <Text style={[s.miniTabText, leaderboardTab === 'weekly' && s.miniTabTextActive]}>W</Text>
                            </Pressable>
                            <Pressable 
                                onPress={() => setLeaderboardTab('monthly')}
                                style={[s.miniTab, leaderboardTab === 'monthly' && s.miniTabActive]}
                            >
                                <Text style={[s.miniTabText, leaderboardTab === 'monthly' && s.miniTabTextActive]}>M</Text>
                            </Pressable>
                        </View>
                    </View>
                    <Card style={s.listCard}>
                        {leaderboardData.map((user, index) => (
                            <View key={user.id} style={[s.listItem, index < leaderboardData.length - 1 && s.borderBottom, user.id === 'me' && s.rowMe]}>
                                <View style={s.listIconText}>
                                    <Text style={s.rankText}>{index + 1}</Text>
                                    <Text style={[s.listItemText, user.id === 'me' && { color: ACCENT }]}>{user.id === 'me' ? 'You' : user.name}</Text>
                                </View>
                                <Text style={s.listItemVal}>{(user.volume / 1000).toFixed(1)}k kg</Text>
                            </View>
                        ))}
                    </Card>
                </View>

                {/* Personal Records */}
                <View style={s.section}>
                    <View style={s.sectionHeader}>
                        <Trophy size={18} color="#f59e0b" />
                        <Text style={s.sectionTitle}>TOP PERSONAL RECORDS</Text>
                    </View>
                    <Card style={s.listCard}>
                        {prs.length === 0 ? <Text style={s.emptyText}>No records yet.</Text> : prs.map((pr, index) => (
                            <View key={pr.name} style={[s.listItem, index < prs.length - 1 && s.borderBottom]}>
                                <Text style={s.listItemName}>{pr.name}</Text>
                                <Text style={s.listItemVal}>{pr.weight} kg</Text>
                            </View>
                        ))}
                    </Card>
                </View>
                {/* Progress Actions */}
                <View style={s.section}>
                    <Pressable style={s.calendarBtn} onPress={() => router.push('/workout-calendar')}>
                        <View style={s.listIconText}>
                            <Calendar size={18} color={ACCENT} />
                            <Text style={[s.listItemText, { color: '#fff' }]}>View Workout Calendar</Text>
                        </View>
                        <Text style={s.chevron}>›</Text>
                    </Pressable>
                </View>

                {/* Settings Section */}
                <View style={s.section}>
                    <View style={s.sectionHeader}>
                        <Settings size={18} color={TEXT_SECONDARY} />
                        <Text style={s.sectionTitle}>SETTINGS</Text>
                    </View>
                    <Card style={s.listCard}>
                        <Pressable style={[s.listItem, s.borderBottom]} onPress={() => { setTempName(userName); setIsEditingName(true); }}>
                            <View style={s.listIconText}><User size={18} color={TEXT_SECONDARY} /><Text style={s.listItemText}>Edit Name</Text></View>
                            <Text style={s.chevron}>›</Text>
                        </Pressable>
                        <Pressable style={s.listItem} onPress={handleResetData}>
                            <View style={s.listIconText}><Trash2 size={18} color="#ef4444" /><Text style={[s.listItemText, { color: '#ef4444' }]}>Reset All Data</Text></View>
                        </Pressable>
                    </Card>
                </View>

                <AvatarPicker 
                    visible={showAvatarPicker} 
                    onClose={() => setShowAvatarPicker(false)} 
                    onSelect={setUserAvatar} 
                />

                <Pressable style={s.logoutBtn}>
                    <LogOut size={18} color={TEXT_TERTIARY} />
                    <Text style={s.logoutText}>Log Out</Text>
                </Pressable>
            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    profileHeader: { alignItems: 'center', marginBottom: 24 },
    avatarLarge: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    avatarLargeText: { fontSize: 28, fontWeight: '800', color: '#fff' },
    editAvatar: { position: 'absolute', bottom: 0, right: 0, backgroundColor: ACCENT, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: BG },
    nameWrap: { alignItems: 'center', marginTop: 12 },
    profileName: { fontSize: 22, fontWeight: '800', color: '#fff' },
    profileSub: { fontSize: 13, color: TEXT_TERTIARY, marginTop: 4 },
    editNameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, paddingHorizontal: 40 },
    nameInput: { flex: 1, backgroundColor: SURFACE, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: BORDER },
    saveBtn: { backgroundColor: ACCENT, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    saveBtnText: { color: '#fff', fontWeight: '700' },
    statsGrid: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 24 },
    statBox: { flex: 1, padding: 16, alignItems: 'center', gap: 6 },
    statVal: { fontSize: 18, fontWeight: '800', color: '#fff' },
    statLabel: { fontSize: 10, color: TEXT_TERTIARY, fontWeight: '700', textTransform: 'uppercase' },
    section: { paddingHorizontal: 20, marginBottom: 20 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    sectionTitle: { fontSize: 11, fontWeight: '800', color: TEXT_TERTIARY, letterSpacing: 1 },
    listCard: { paddingVertical: 2 },
    listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
    rowMe: { backgroundColor: 'rgba(59, 130, 246, 0.05)' },
    borderBottom: { borderBottomWidth: 1, borderBottomColor: BORDER },
    listIconText: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    rankText: { fontSize: 13, fontWeight: '800', color: TEXT_TERTIARY, width: 20 },
    listItemText: { fontSize: 14, fontWeight: '600', color: '#fff' },
    listItemName: { fontSize: 14, fontWeight: '600', color: '#fff' },
    listItemVal: { fontSize: 14, fontWeight: '700', color: ACCENT },
    chevron: { fontSize: 18, color: TEXT_TERTIARY, marginTop: -2 },
    emptyText: { padding: 16, textAlign: 'center', color: TEXT_TERTIARY, fontSize: 13 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginVertical: 10 },
    logoutText: { fontSize: 14, fontWeight: '600', color: TEXT_TERTIARY },

    calendarBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: SURFACE, borderRadius: 16, borderWidth: 1, borderColor: BORDER },
    
    miniToggle: { flexDirection: 'row', backgroundColor: SURFACE, borderRadius: 8, padding: 2, borderWidth: 1, borderColor: BORDER },
    miniTab: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    miniTabActive: { backgroundColor: SURFACE2 },
    miniTabText: { fontSize: 10, fontWeight: '800', color: TEXT_TERTIARY },
    miniTabTextActive: { color: '#fff' },
})

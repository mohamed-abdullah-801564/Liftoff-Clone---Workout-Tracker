import { useState, useMemo, useEffect, useCallback } from 'react'
import { View, ScrollView, StyleSheet, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native'
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
import { Dumbbell, Activity, Flame, Trophy, Settings, LogOut, User, Trash2 } from 'lucide-react-native'

export default function ProfileScreen() {
    const insets = useSafeAreaInsets()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Alex Riggs')
    const [isEditingName, setIsEditingName] = useState(false)
    const [tempName, setTempName] = useState('')
    
    const [stats, setStats] = useState({
        totalWorkouts: 0,
        totalVolume: 0,
        streak: 0
    })
    const [prs, setPrs] = useState<any[]>([])

    const loadData = useCallback(async () => {
        try {
            const workoutsData = await AsyncStorage.getItem('workouts')
            const workouts = workoutsData ? JSON.parse(workoutsData) : []
            const savedName = await AsyncStorage.getItem('user_name')
            if (savedName) setUserName(savedName)

            // Calculate stats
            const totalWorkouts = workouts.length
            const totalVolume = workouts.reduce((acc: number, w: any) => acc + (w.volume || 0), 0)
            
            // Calculate streak (simple logic: consecutive days)
            let streak = 0
            if (workouts.length > 0) {
                const sortedWorkouts = [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                
                let lastDate = new Date(sortedWorkouts[0].date)
                lastDate.setHours(0, 0, 0, 0)

                const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24))
                
                if (diffDays <= 1) {
                    streak = 1
                    for (let i = 1; i < sortedWorkouts.length; i++) {
                        const current = new Date(sortedWorkouts[i-1].date)
                        current.setHours(0,0,0,0)
                        const prev = new Date(sortedWorkouts[i].date)
                        prev.setHours(0,0,0,0)
                        
                        const diff = Math.floor((current.getTime() - prev.getTime()) / (1000 * 3600 * 24))
                        if (diff === 1) streak++
                        else if (diff > 1) break
                    }
                }
            }

            setStats({ totalWorkouts, totalVolume, streak })

            // Calculate PRs
            const prMap = new Map<string, number>()
            workouts.forEach((w: any) => {
                w.exercises.forEach((ex: any) => {
                    const bestWeight = Math.max(...ex.sets.map((s: any) => parseFloat(s.weight) || 0))
                    if (!prMap.has(ex.name) || bestWeight > prMap.get(ex.name)!) {
                        prMap.set(ex.name, bestWeight)
                    }
                })
            })

            const prList = Array.from(prMap.entries())
                .map(([name, weight]) => ({ name, weight }))
                .sort((a, b) => b.weight - a.weight)
                .slice(0, 5)
            
            setPrs(prList)

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

    const handleSaveName = async () => {
        if (!tempName.trim()) return
        await AsyncStorage.setItem('user_name', tempName.trim())
        setUserName(tempName.trim())
        setIsEditingName(false)
    }

    const handleResetData = () => {
        Alert.alert(
            "Reset All Data?",
            "This will permanently delete your workout history, PRs, and settings. This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Reset", 
                    style: "destructive",
                    onPress: async () => {
                        await AsyncStorage.clear()
                        setUserName('Alex Riggs')
                        setStats({ totalWorkouts: 0, totalVolume: 0, streak: 0 })
                        setPrs([])
                        router.replace('/')
                    }
                }
            ]
        )
    }

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
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
            <ScrollView 
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: TAB_BAR_CLEARANCE + 20 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Header */}
                <View style={s.profileHeader}>
                    <View style={s.avatarLarge}>
                        <Text style={s.avatarLargeText}>{getInitials(userName)}</Text>
                        <Pressable style={s.editAvatar}>
                            <Settings size={14} color="#fff" />
                        </Pressable>
                    </View>
                    
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
                            <Text style={s.profileSub}>Lifter since 2026</Text>
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
                        <Text style={s.statLabel}>Day Streak</Text>
                    </Card>
                </View>

                {/* Personal Records */}
                <View style={s.section}>
                    <View style={s.sectionHeader}>
                        <Trophy size={18} color="#f59e0b" />
                        <Text style={s.sectionTitle}>RECENT PERSONAL RECORDS</Text>
                    </View>
                    <Card style={s.listCard}>
                        {prs.length === 0 ? (
                            <Text style={s.emptyText}>Complete exercises to set PRs!</Text>
                        ) : (
                            prs.map((pr, index) => (
                                <View key={pr.name} style={[s.listItem, index < prs.length - 1 && s.borderBottom]}>
                                    <Text style={s.listItemName}>{pr.name}</Text>
                                    <Text style={s.listItemVal}>{pr.weight} kg</Text>
                                </View>
                            ))
                        )}
                    </Card>
                </View>

                {/* Settings Section */}
                <View style={s.section}>
                    <View style={s.sectionHeader}>
                        <Settings size={18} color={TEXT_SECONDARY} />
                        <Text style={s.sectionTitle}>SETTINGS</Text>
                    </View>
                    <Card style={s.listCard}>
                        <Pressable 
                            style={[s.listItem, s.borderBottom]}
                            onPress={() => { setTempName(userName); setIsEditingName(true); }}
                        >
                            <View style={s.listIconText}>
                                <User size={18} color={TEXT_SECONDARY} />
                                <Text style={s.listItemText}>Edit Name</Text>
                            </View>
                            <Text style={s.chevron}>›</Text>
                        </Pressable>
                        <Pressable 
                            style={s.listItem}
                            onPress={handleResetData}
                        >
                            <View style={s.listIconText}>
                                <Trash2 size={18} color="#ef4444" />
                                <Text style={[s.listItemText, { color: '#ef4444' }]}>Reset Data</Text>
                            </View>
                        </Pressable>
                    </Card>
                </View>

                <Pressable style={s.logoutBtn}>
                    <LogOut size={18} color={TEXT_TERTIARY} />
                    <Text style={s.logoutText}>Log Out</Text>
                </Pressable>

            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    profileHeader: { alignItems: 'center', marginBottom: 30 },
    avatarLarge: { width: 90, height: 90, borderRadius: 45, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: BORDER, position: 'relative' },
    avatarLargeText: { fontSize: 32, fontWeight: '800', color: '#fff' },
    editAvatar: { position: 'absolute', bottom: 0, right: 0, backgroundColor: ACCENT, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: BG },
    
    nameWrap: { alignItems: 'center', marginTop: 16 },
    profileName: { fontSize: 24, fontWeight: '800', color: '#fff' },
    profileSub: { fontSize: 14, color: TEXT_TERTIARY, marginTop: 4 },

    editNameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, paddingHorizontal: 40 },
    nameInput: { flex: 1, backgroundColor: SURFACE, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: BORDER },
    saveBtn: { backgroundColor: ACCENT, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
    saveBtnText: { color: '#fff', fontWeight: '700' },

    statsGrid: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 30 },
    statBox: { flex: 1, padding: 16, alignItems: 'center', gap: 6 },
    statVal: { fontSize: 20, fontWeight: '800', color: '#fff' },
    statLabel: { fontSize: 11, color: TEXT_TERTIARY, fontWeight: '700', textTransform: 'uppercase' },

    section: { paddingHorizontal: 20, marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sectionTitle: { fontSize: 12, fontWeight: '800', color: TEXT_TERTIARY, letterSpacing: 1 },

    listCard: { paddingVertical: 4 },
    listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    borderBottom: { borderBottomWidth: 1, borderBottomColor: BORDER },
    listIconText: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    listItemText: { fontSize: 15, fontWeight: '600', color: '#fff' },
    listItemName: { fontSize: 15, fontWeight: '600', color: '#fff' },
    listItemVal: { fontSize: 15, fontWeight: '700', color: ACCENT },
    chevron: { fontSize: 20, color: TEXT_TERTIARY, marginTop: -4 },
    emptyText: { padding: 20, textAlign: 'center', color: TEXT_TERTIARY, fontSize: 14 },

    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginVertical: 20 },
    logoutText: { fontSize: 15, fontWeight: '600', color: TEXT_TERTIARY },
})

import { useState, useEffect, useCallback } from 'react'
import { View, ScrollView, StyleSheet, Pressable, Dimensions, ActivityIndicator } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
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
    ACCENT_LIGHT,
    BORDER,
} from '@/lib/theme'
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'
import { Flame, Trophy, Calendar, ChevronRight, Play, ArrowUpRight, Plus } from 'lucide-react-native'

const { width } = Dimensions.get('window')

export default function HomeScreen() {
    const insets = useSafeAreaInsets()
    const [loading, setLoading] = useState(true)
    const [streak, setStreak] = useState(0)
    const [weeklyVolume, setWeeklyVolume] = useState('0')
    const [trend, setTrend] = useState(0)
    const [workouts, setWorkouts] = useState<any[]>([])

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const data = await AsyncStorage.getItem('workouts')
            const savedWorkouts = data ? JSON.parse(data) : []
            
            // Sort by date descending
            const sorted = savedWorkouts.sort((a: any, b: any) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
            )

            // Streak Calculation
            let currentStreak = 0
            if (sorted.length > 0) {
                const today = new Date().setHours(0,0,0,0)
                let lastDate = new Date(sorted[0].date).setHours(0,0,0,0)
                
                // If last workout was today or yesterday, we have a streak
                if (today - lastDate <= 86400000) {
                    currentStreak = 1
                    let prevDate = lastDate
                    for (let i = 1; i < sorted.length; i++) {
                        const d = new Date(sorted[i].date).setHours(0,0,0,0)
                        if (prevDate - d === 86400000) {
                            currentStreak++
                            prevDate = d
                        } else if (prevDate - d === 0) {
                            continue // Multiple workouts same day
                        } else {
                            break
                        }
                    }
                }
            }
            setStreak(currentStreak)

            // Weekly Volume Calculation
            const now = new Date()
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

            const thisWeekWorkouts = sorted.filter((w: any) => new Date(w.date) >= oneWeekAgo)
            const lastWeekWorkouts = sorted.filter((w: any) => new Date(w.date) >= twoWeeksAgo && new Date(w.date) < oneWeekAgo)

            const calculateVol = (list: any[]) => list.reduce((acc, w) => acc + (w.volume || 0), 0)
            
            const currentVol = calculateVol(thisWeekWorkouts)
            const prevVol = calculateVol(lastWeekWorkouts)

            setWeeklyVolume(currentVol.toLocaleString())
            if (prevVol > 0) {
                setTrend(Math.round(((currentVol - prevVol) / prevVol) * 100))
            } else if (currentVol > 0) {
                setTrend(100)
            }

            setWorkouts(sorted.slice(0, 3))
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

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: BG, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator color={ACCENT} size="large" />
            </View>
        )
    }

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: BG }}
            contentContainerStyle={[s.container, { paddingTop: insets.top + 20, paddingBottom: TAB_BAR_CLEARANCE + 20 }]}
            showsVerticalScrollIndicator={false}
        >
            {/* Header / Greeting */}
            <View style={s.header}>
                <View>
                    <Text style={s.greeting}>Welcome Back, Alex</Text>
                    <View style={s.streakBadge}>
                        <Flame size={14} color={ACCENT} fill={ACCENT} />
                        <Text style={s.streakText}>{streak} Day Streak</Text>
                    </View>
                </View>
                <View style={s.avatar} />
            </View>

            {/* Main Hero Stat */}
            <Card style={s.heroCard}>
                <View style={s.heroHeader}>
                    <Text style={s.heroLabel}>This Week's Volume</Text>
                    {trend !== 0 && (
                        <View style={[s.trendBadge, trend < 0 && { backgroundColor: 'rgba(248, 113, 113, 0.1)' }]}>
                            {trend > 0 ? <ArrowUpRight size={14} color="#4ade80" /> : <View style={{ transform: [{ rotate: '90deg' }] }}><ArrowUpRight size={14} color="#f87171" /></View>}
                            <Text style={[s.trendText, trend < 0 && { color: '#f87171' }]}>{trend > 0 ? '+' : ''}{trend}%</Text>
                        </View>
                    )}
                </View>
                <Text style={s.heroValue}>{weeklyVolume} <Text style={s.unitText}>kg</Text></Text>
                <View style={s.heroFooter}>
                    <Text style={s.heroSub}>Activity from last 7 days</Text>
                </View>
            </Card>

            {/* Start Workout Primary Action */}
            <Pressable 
                style={({ pressed }) => [s.startBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
                onPress={() => router.push('/workout')}
            >
                <View style={s.startBtnContent}>
                    <View style={s.playIconWrap}>
                        <Play size={22} color="#fff" fill="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.startBtnTitle}>Start Workout</Text>
                        <Text style={s.startBtnSub}>Select from your routines or a new one</Text>
                    </View>
                    <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
                </View>
                {/* Glow effect */}
                <View style={s.btnGlow} />
            </Pressable>

            {/* Recent Workouts List */}
            <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Recent Workouts</Text>
                <Pressable onPress={() => router.push('/activity')}><Text style={s.viewAll}>View All</Text></Pressable>
            </View>

            {workouts.length > 0 ? (
                workouts.map((workout) => (
                    <Card key={workout.id} style={s.workoutCard}>
                        <View style={s.workoutInfo}>
                            <Text style={s.workoutName}>{workout.name}</Text>
                            <Text style={s.workoutMeta}>
                                {new Date(workout.date).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {workout.duration} • {workout.totalSets || 0} sets
                            </Text>
                        </View>
                        <View style={s.workoutVolume}>
                            <Text style={s.volValue}>{(workout.volume || 0).toLocaleString()} kg</Text>
                            <Text style={s.volLabel}>Volume</Text>
                        </View>
                    </Card>
                ))
            ) : (
                <Card style={s.emptyState}>
                    <View style={s.emptyIcon}>
                        <Calendar size={32} color={TEXT_TERTIARY} />
                    </View>
                    <Text style={s.emptyText}>No workouts yet — start your first one!</Text>
                    <Pressable 
                        style={s.emptyBtn}
                        onPress={() => router.push('/workout')}
                    >
                        <Plus size={18} color="#fff" />
                        <Text style={s.emptyBtnText}>Start New</Text>
                    </Pressable>
                </Card>
            )}
        </ScrollView>
    )
}

const s = StyleSheet.create({
    container: { paddingHorizontal: 20, gap: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    greeting: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
    streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, backgroundColor: 'rgba(59, 130, 246, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    streakText: { fontSize: 13, color: ACCENT, fontWeight: '700' },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: SURFACE, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    
    heroCard: { padding: 24, gap: 8, backgroundColor: SURFACE, borderColor: 'rgba(255,255,255,0.05)' },
    heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    heroLabel: { fontSize: 14, fontWeight: '600', color: TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: 0.5 },
    trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(74, 222, 128, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    trendText: { fontSize: 12, fontWeight: '700', color: '#4ade80' },
    heroValue: { fontSize: 42, fontWeight: '800', color: '#fff', letterSpacing: -1 },
    unitText: { fontSize: 20, color: TEXT_TERTIARY, fontWeight: '600' },
    heroFooter: { marginTop: 4 },
    heroSub: { fontSize: 13, color: TEXT_TERTIARY, fontWeight: '500' },

    startBtn: { backgroundColor: ACCENT, borderRadius: 24, padding: 24, overflow: 'hidden' },
    startBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 16, zIndex: 1 },
    playIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
    startBtnTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
    startBtnSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontWeight: '500' },
    btnGlow: { position: 'absolute', top: -60, right: -60, width: 180, height: 180, borderRadius: 90, backgroundColor: '#fff', opacity: 0.15, filter: 'blur(50px)' },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
    viewAll: { fontSize: 14, color: ACCENT, fontWeight: '600' },

    workoutCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    workoutInfo: { gap: 6, flex: 1 },
    workoutName: { fontSize: 16, fontWeight: '700', color: '#fff' },
    workoutMeta: { fontSize: 13, color: TEXT_SECONDARY, fontWeight: '500' },
    workoutVolume: { alignItems: 'flex-end', gap: 2 },
    volValue: { fontSize: 15, fontWeight: '700', color: ACCENT_LIGHT },
    volLabel: { fontSize: 11, color: TEXT_TERTIARY, fontWeight: '600', textTransform: 'uppercase' },

    emptyState: { padding: 32, alignItems: 'center', gap: 16, backgroundColor: 'transparent', borderStyle: 'dashed', borderWidth: 1, borderColor: BORDER },
    emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
    emptyText: { fontSize: 15, color: TEXT_SECONDARY, fontWeight: '500', textAlign: 'center' },
    emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: ACCENT, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
    emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
})

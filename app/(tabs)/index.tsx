import { useState } from 'react'
import { View, ScrollView, StyleSheet, Pressable, Dimensions } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import {
    ACCENT,
    BG,
    SURFACE,
    TEXT_SECONDARY,
    TEXT_TERTIARY,
    ACCENT_LIGHT,
} from '@/lib/theme'
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'
import { Flame, Trophy, Calendar, ChevronRight, Play } from 'lucide-react-native'

const { width } = Dimensions.get('window')

export default function HomeScreen() {
    const insets = useSafeAreaInsets()
    
    // Mock data for the LiftUp UI
    const streak = 12
    const weeklyVolume = '42,500'
    const workouts = [
        { id: '1', name: 'Upper Body Power', date: 'Yesterday', duration: '64m', volume: '12,400kg' },
        { id: '2', name: 'Legs & Core', date: '3 days ago', duration: '52m', volume: '8,200kg' },
        { id: '3', name: 'Pull Session', date: '5 days ago', duration: '71m', volume: '11,100kg' },
    ]

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: BG }}
            contentContainerStyle={[s.container, { paddingTop: insets.top + 20, paddingBottom: TAB_BAR_CLEARANCE + 20 }]}
            showsVerticalScrollIndicator={false}
        >
            {/* Header / Greeting */}
            <View style={s.header}>
                <View>
                    <Text style={s.greeting}>Good morning, Alex</Text>
                    <Text style={s.subGreeting}>Ready to crush your goals?</Text>
                </View>
                <View style={s.avatar} />
            </View>

            {/* Streak & Stats Row */}
            <View style={s.statsRow}>
                <Card style={s.statCard}>
                    <View style={s.statIconWrap}>
                        <Flame size={20} color={ACCENT} fill={ACCENT} />
                    </View>
                    <Text style={s.statValue}>{streak}</Text>
                    <Text style={s.statLabel}>Day Streak</Text>
                </Card>

                <Card style={s.statCard}>
                    <View style={[s.statIconWrap, { backgroundColor: 'rgba(168, 85, 247, 0.12)' }]}>
                        <Trophy size={20} color="#A855F7" />
                    </View>
                    <Text style={s.statValue}>{weeklyVolume}</Text>
                    <Text style={s.statLabel}>Weekly (kg)</Text>
                </Card>
            </View>

            {/* Weekly Volume Visualization Placeholder */}
            <Card style={s.volumeCard}>
                <View style={s.volumeHeader}>
                    <Text style={s.cardTitle}>Weekly Activity</Text>
                    <Calendar size={16} color={TEXT_TERTIARY} />
                </View>
                <View style={s.chartContainer}>
                    {[40, 70, 45, 90, 65, 30, 20].map((h, i) => (
                        <View key={i} style={s.chartColumn}>
                            <View style={[s.chartBar, { height: h, backgroundColor: i === 3 ? ACCENT : SURFACE }]} />
                            <Text style={s.chartLabel}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</Text>
                        </View>
                    ))}
                </View>
            </Card>

            {/* Start Workout Primary Action */}
            <Pressable 
                style={({ pressed }) => [s.startBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
                onPress={() => router.push('/workout')}
            >
                <View style={s.startBtnContent}>
                    <View style={s.playIconWrap}>
                        <Play size={20} color="#fff" fill="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.startBtnTitle}>Start New Workout</Text>
                        <Text style={s.startBtnSub}>Upper Body A • 5 Exercises</Text>
                    </View>
                    <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
                </View>
                {/* Glow effect */}
                <View style={s.btnGlow} />
            </Pressable>

            {/* Recent Workouts List */}
            <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Recent Workouts</Text>
                <Pressable><Text style={s.viewAll}>View All</Text></Pressable>
            </View>

            {workouts.map((workout) => (
                <Card key={workout.id} style={s.workoutCard}>
                    <View style={s.workoutInfo}>
                        <Text style={s.workoutName}>{workout.name}</Text>
                        <Text style={s.workoutMeta}>{workout.date} • {workout.duration}</Text>
                    </View>
                    <View style={s.workoutVolume}>
                        <Text style={s.volValue}>{workout.volume}</Text>
                        <Text style={s.volLabel}>Volume</Text>
                    </View>
                </Card>
            ))}
        </ScrollView>
    )
}

const s = StyleSheet.create({
    container: { paddingHorizontal: 20, gap: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    greeting: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.8 },
    subGreeting: { fontSize: 16, color: TEXT_SECONDARY, marginTop: 2 },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: SURFACE, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    
    statsRow: { flexDirection: 'row', gap: 12 },
    statCard: { flex: 1, padding: 16, alignItems: 'center', gap: 6 },
    statIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(59, 130, 246, 0.12)', alignItems: 'center', justifyContent: 'center' },
    statValue: { fontSize: 20, fontWeight: '700', color: '#fff' },
    statLabel: { fontSize: 12, color: TEXT_TERTIARY, fontWeight: '600' },

    volumeCard: { padding: 18, gap: 20 },
    volumeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
    chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100, paddingHorizontal: 4 },
    chartColumn: { alignItems: 'center', gap: 8 },
    chartBar: { width: 32, borderRadius: 6, minHeight: 4 },
    chartLabel: { fontSize: 11, color: TEXT_TERTIARY, fontWeight: '600' },

    startBtn: { backgroundColor: ACCENT, borderRadius: 20, padding: 20, overflow: 'hidden' },
    startBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 16, zIndex: 1 },
    playIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    startBtnTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
    startBtnSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    btnGlow: { position: 'absolute', top: -50, right: -50, width: 150, height: 150, borderRadius: 75, backgroundColor: '#fff', opacity: 0.15, filter: 'blur(40px)' },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
    viewAll: { fontSize: 14, color: ACCENT, fontWeight: '600' },

    workoutCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    workoutInfo: { gap: 4 },
    workoutName: { fontSize: 16, fontWeight: '600', color: '#fff' },
    workoutMeta: { fontSize: 13, color: TEXT_SECONDARY },
    workoutVolume: { alignItems: 'flex-end', gap: 2 },
    volValue: { fontSize: 15, fontWeight: '700', color: ACCENT_LIGHT },
    volLabel: { fontSize: 11, color: TEXT_TERTIARY, fontWeight: '600' },
})

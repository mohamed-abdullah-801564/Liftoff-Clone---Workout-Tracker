import { useState, useMemo, useEffect, useCallback } from 'react'
import { View, ScrollView, StyleSheet, Pressable, Dimensions, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
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
import { ChevronLeft, Info, Trophy, Target, History, Plus } from 'lucide-react-native'
import { LineChart } from 'react-native-chart-kit'

const SCREEN_WIDTH = Dimensions.get('window').width

const EXERCISE_DESCRIPTIONS: Record<string, string> = {
    '1': 'The barbell bench press is a foundational compound movement designed to develop explosive upper-body power. It primarily targets the pectoralis major, while effectively engaging the triceps brachii and anterior deltoids.',
    '2': 'The deadlift is a powerhouse movement that builds total-body strength, focusing on the posterior chain including glutes, hamstrings, and lower back.',
    '3': 'Squats are the "king of all exercises," building massive lower-body strength and core stability.',
    '4': 'The overhead press builds broad shoulders and strong triceps while requiring significant core stability.',
    '5': 'Pull-ups are the ultimate upper-body pulling exercise, targeting the lats and biceps.',
    // ... more descriptions can be added
}

const DEFAULT_DESCRIPTION = 'This exercise is a key movement for building strength and muscle mass. Focus on controlled form and progressive overload for best results.'

export default function ExerciseDetailsScreen() {
    const { id, name: propName } = useLocalSearchParams()
    const insets = useSafeAreaInsets()
    const [loading, setLoading] = useState(true)
    const [workouts, setWorkouts] = useState<any[]>([])

    const exerciseId = id as string
    
    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const data = await AsyncStorage.getItem('workouts')
            const savedWorkouts = data ? JSON.parse(data) : []
            setWorkouts(savedWorkouts)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadData()
    }, [loadData])

    const exerciseName = useMemo(() => {
        if (propName) return propName as string
        // Find in history if possible
        for (const w of workouts) {
            const ex = w.exercises.find((e: any) => e.id === exerciseId)
            if (ex) return ex.name
        }
        return 'Exercise'
    }, [exerciseId, propName, workouts])

    const stats = useMemo(() => {
        const history = workouts
            .filter(w => w.exercises.some((ex: any) => ex.id === exerciseId || ex.name === exerciseName))
            .map(w => {
                const exInstance = w.exercises.find((ex: any) => ex.id === exerciseId || ex.name === exerciseName)
                const bestWeight = Math.max(...exInstance.sets.map((s: any) => parseFloat(s.weight) || 0))
                const bestReps = Math.max(...exInstance.sets.map((s: any) => parseInt(s.reps) || 0))
                return {
                    date: new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    weight: bestWeight,
                    reps: bestReps,
                    timestamp: new Date(w.date).getTime(),
                    sets: exInstance.completedSets,
                    volume: exInstance.volume
                }
            })
            .sort((a, b) => a.timestamp - b.timestamp)

        if (history.length === 0) return null

        const maxWeight = Math.max(...history.map(h => h.weight))
        const bestReps = Math.max(...history.map(h => h.reps))
        const totalSessions = history.length

        const chartLabels = history.slice(-6).map(h => h.date)
        const chartData = history.slice(-6).map(h => h.weight)

        return {
            history: history.reverse().slice(0, 5),
            maxWeight,
            bestReps,
            totalSessions,
            chart: {
                labels: chartLabels,
                datasets: [{ data: chartData }]
            }
        }
    }, [exerciseId, exerciseName, workouts])

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: BG, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator color={ACCENT} size="large" />
            </View>
        )
    }

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            {/* Header */}
            <View style={[s.header, { paddingTop: insets.top + 10 }]}>
                <Pressable onPress={() => router.back()} style={s.iconBtn}>
                    <ChevronLeft size={24} color="#fff" />
                </Pressable>
                <Text style={s.title}>{exerciseName}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={[s.container, { paddingBottom: insets.bottom + 100 }]}
                showsVerticalScrollIndicator={false}
            >
                {stats ? (
                    <>
                        {/* Performance Chart */}
                        <View style={s.sectionHeader}>
                            <Text style={s.sectionTitle}>WEIGHT PROGRESSION (KG)</Text>
                        </View>
                        <Card style={s.chartCard}>
                            <LineChart
                                data={stats.chart}
                                width={SCREEN_WIDTH - 40}
                                height={200}
                                chartConfig={chartConfig}
                                bezier
                                style={s.chart}
                            />
                        </Card>

                        {/* Stats Row */}
                        <View style={s.statsRow}>
                            <Card style={s.statCard}>
                                <Trophy size={18} color={ACCENT} />
                                <Text style={s.statValue}>{stats.maxWeight}kg</Text>
                                <Text style={s.statLabel}>Max Weight</Text>
                            </Card>
                            <Card style={s.statCard}>
                                <Target size={18} color="#A855F7" />
                                <Text style={s.statValue}>{stats.bestReps}</Text>
                                <Text style={s.statLabel}>Best Reps</Text>
                            </Card>
                            <Card style={s.statCard}>
                                <History size={18} color="#10b981" />
                                <Text style={s.statValue}>{stats.totalSessions}</Text>
                                <Text style={s.statLabel}>Sessions</Text>
                            </Card>
                        </View>
                    </>
                ) : (
                    <Card style={s.noDataCard}>
                        <Text style={s.noDataText}>No history for this exercise yet.</Text>
                    </Card>
                )}

                {/* About Section */}
                <Card style={s.aboutCard}>
                    <View style={s.aboutHeader}>
                        <Info size={18} color={ACCENT} />
                        <Text style={s.aboutTitle}>About this Exercise</Text>
                    </View>
                    <Text style={s.aboutText}>
                        {EXERCISE_DESCRIPTIONS[exerciseId] || DEFAULT_DESCRIPTION}
                    </Text>
                </Card>

                {/* Recent History */}
                {stats && (
                    <>
                        <View style={s.historyHeader}>
                            <History size={18} color={TEXT_SECONDARY} />
                            <Text style={s.historyTitle}>Recent Sessions</Text>
                        </View>
                        {stats.history.map((item, i) => (
                            <Card key={i} style={s.historyRow}>
                                <View>
                                    <Text style={s.historyDate}>{item.date}</Text>
                                    <Text style={s.historyDetail}>{item.sets} sets • {item.weight}kg best</Text>
                                </View>
                            </Card>
                        ))}
                    </>
                )}
            </ScrollView>

            {/* Bottom Action */}
            <View style={[s.bottomAction, { paddingBottom: insets.bottom + 20 }]}>
                <Pressable 
                    style={s.logBtn}
                    onPress={() => router.push('/workout')}
                >
                    <Plus size={20} color="#fff" />
                    <Text style={s.logBtnText}>Log New Session</Text>
                </Pressable>
            </View>
        </View>
    )
}

const chartConfig = {
    backgroundColor: '#131313',
    backgroundGradientFrom: '#131313',
    backgroundGradientTo: '#131313',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.5})`,
    style: { borderRadius: 16 },
    propsForDots: { r: "4", strokeWidth: "2", stroke: "#3B82F6" }
}

const s = StyleSheet.create({
    container: { padding: 20, gap: 24 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
    iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: SURFACE },
    title: { fontSize: 20, fontWeight: '800', color: '#fff' },

    sectionHeader: { marginBottom: 12 },
    sectionTitle: { fontSize: 12, fontWeight: '800', color: TEXT_TERTIARY, letterSpacing: 1 },

    chartCard: { paddingVertical: 16, paddingHorizontal: 0, alignItems: 'center', overflow: 'hidden' },
    chart: { borderRadius: 16, marginLeft: -10 },

    statsRow: { flexDirection: 'row', gap: 12 },
    statCard: { flex: 1, padding: 16, alignItems: 'center', gap: 6 },
    statValue: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
    statLabel: { fontSize: 11, color: TEXT_TERTIARY, fontWeight: '700', textTransform: 'uppercase' },

    aboutCard: { padding: 18, gap: 14 },
    aboutHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    aboutTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
    aboutText: { fontSize: 14, color: TEXT_SECONDARY, lineHeight: 22 },

    historyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 12 },
    historyTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
    historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, marginBottom: 10 },
    historyDate: { fontSize: 15, fontWeight: '700', color: '#fff' },
    historyDetail: { fontSize: 13, color: TEXT_SECONDARY, marginTop: 2 },

    bottomAction: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20 },
    logBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: ACCENT, borderRadius: 16, paddingVertical: 16 },
    logBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    noDataCard: { padding: 20, alignItems: 'center' },
    noDataText: { color: TEXT_SECONDARY, fontSize: 15 },
})

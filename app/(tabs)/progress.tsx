import { useState, useMemo, useEffect, useCallback } from 'react'
import { View, ScrollView, StyleSheet, Pressable, Dimensions, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useFocusEffect } from 'expo-router'
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
    ACCENT_LIGHT,
} from '@/lib/theme'
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'
import { LineChart, BarChart } from 'react-native-chart-kit'
import { ChevronDown, Trophy, Activity, Target } from 'lucide-react-native'

const SCREEN_WIDTH = Dimensions.get('window').width

export default function ProgressScreen() {
    const insets = useSafeAreaInsets()
    const [loading, setLoading] = useState(true)
    const [workouts, setWorkouts] = useState<any[]>([])
    const [selectedEx, setSelectedEx] = useState<string | null>(null)
    const [showExPicker, setShowExPicker] = useState(false)

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const data = await AsyncStorage.getItem('workouts')
            const savedWorkouts = data ? JSON.parse(data) : []
            setWorkouts(savedWorkouts)

            // Auto-select first exercise found in history
            if (!selectedEx) {
                const allExNames = new Set<string>()
                savedWorkouts.forEach((w: any) => {
                    w.exercises.forEach((ex: any) => allExNames.add(ex.name))
                })
                const names = Array.from(allExNames)
                if (names.length > 0) setSelectedEx(names[0])
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }, [selectedEx])

    useFocusEffect(
        useCallback(() => {
            loadData()
        }, [loadData])
    )

    const exerciseList = useMemo(() => {
        const names = new Set<string>()
        workouts.forEach(w => w.exercises.forEach((ex: any) => names.add(ex.name)))
        return Array.from(names).sort()
    }, [workouts])

    const exerciseData = useMemo(() => {
        if (!selectedEx) return null
        
        const history = workouts
            .filter(w => w.exercises.some((ex: any) => ex.name === selectedEx))
            .map(w => {
                const exInstance = w.exercises.find((ex: any) => ex.name === selectedEx)
                // Get best set weight
                const bestWeight = Math.max(...exInstance.sets.map((s: any) => parseFloat(s.weight) || 0))
                return {
                    date: new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    weight: bestWeight,
                    timestamp: new Date(w.date).getTime()
                }
            })
            .sort((a, b) => a.timestamp - b.timestamp)

        if (history.length === 0) return null

        const labels = history.slice(-6).map(h => h.date)
        const data = history.slice(-6).map(h => h.weight)

        // Stats
        const bestWeight = Math.max(...history.map(h => h.weight))
        const totalSets = workouts.reduce((acc, w) => {
            const exInstance = w.exercises.find((ex: any) => ex.name === selectedEx)
            return acc + (exInstance?.completedSets || 0)
        }, 0)
        const totalVolume = workouts.reduce((acc, w) => {
            const exInstance = w.exercises.find((ex: any) => ex.name === selectedEx)
            return acc + (exInstance?.volume || 0)
        }, 0)

        return { labels, data, stats: { bestWeight, totalSets, totalVolume } }
    }, [selectedEx, workouts])

    const weeklyVolumeData = useMemo(() => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        const volume = [0, 0, 0, 0, 0, 0, 0]
        
        const now = new Date()
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)))
        startOfWeek.setHours(0, 0, 0, 0)

        workouts.forEach(w => {
            const wDate = new Date(w.date)
            if (wDate >= startOfWeek) {
                const dayIdx = wDate.getDay() === 0 ? 6 : wDate.getDay() - 1
                volume[dayIdx] += (w.volume || 0)
            }
        })

        return { labels: days, datasets: [{ data: volume }] }
    }, [workouts])

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: BG, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator color={ACCENT} size="large" />
            </View>
        )
    }

    if (workouts.length === 0) {
        return (
            <View style={{ flex: 1, backgroundColor: BG, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
                <Activity size={48} color={TEXT_TERTIARY} style={{ marginBottom: 16 }} />
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff', textAlign: 'center' }}>No data yet</Text>
                <Text style={{ fontSize: 15, color: TEXT_SECONDARY, textAlign: 'center', marginTop: 8 }}>Complete a workout to see your progress charts.</Text>
                <Pressable 
                    style={s.startBtn}
                    onPress={() => router.push('/workout')}
                >
                    <Text style={s.startBtnText}>Log First Workout</Text>
                </Pressable>
            </View>
        )
    }

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <View style={[s.header, { paddingTop: insets.top + 10 }]}>
                <Text style={s.title}>Progress</Text>
            </View>

            <ScrollView 
                style={{ flex: 1 }} 
                contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE + 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Exercise Selector */}
                <Pressable style={s.selector} onPress={() => setShowExPicker(!showExPicker)}>
                    <View>
                        <Text style={s.selectorLabel}>TRACKING PROGRESS FOR</Text>
                        <Text style={s.selectorValue}>{selectedEx || 'Select Exercise'}</Text>
                    </View>
                    <ChevronDown size={20} color={ACCENT} />
                </Pressable>

                {showExPicker && (
                    <View style={s.pickerDropdown}>
                        {exerciseList.map(name => (
                            <Pressable 
                                key={name} 
                                style={s.pickerItem}
                                onPress={() => {
                                    setSelectedEx(name)
                                    setShowExPicker(false)
                                }}
                            >
                                <Text style={[s.pickerText, selectedEx === name && { color: ACCENT }]}>{name}</Text>
                            </Pressable>
                        ))}
                    </View>
                )}

                {/* Weight Progression Chart */}
                {exerciseData && (
                    <>
                        <View style={s.sectionHeader}>
                            <Text style={s.sectionTitle}>WEIGHT PROGRESSION (KG)</Text>
                        </View>
                        <Card style={s.chartCard}>
                            <LineChart
                                data={{
                                    labels: exerciseData.labels,
                                    datasets: [{ data: exerciseData.data }]
                                }}
                                width={SCREEN_WIDTH - 40}
                                height={220}
                                chartConfig={chartConfig}
                                bezier
                                style={s.chart}
                            />
                        </Card>

                        {/* Stats Row */}
                        <View style={s.statsRow}>
                            <Card style={s.statCard}>
                                <Trophy size={16} color={ACCENT} />
                                <Text style={s.statVal}>{exerciseData.stats.bestWeight}kg</Text>
                                <Text style={s.statLabel}>Best Weight</Text>
                            </Card>
                            <Card style={s.statCard}>
                                <Activity size={16} color="#10b981" />
                                <Text style={s.statVal}>{exerciseData.stats.totalSets}</Text>
                                <Text style={s.statLabel}>Total Sets</Text>
                            </Card>
                            <Card style={s.statCard}>
                                <Target size={16} color="#f59e0b" />
                                <Text style={s.statVal}>{(exerciseData.stats.totalVolume / 1000).toFixed(1)}k</Text>
                                <Text style={s.statLabel}>Total Vol</Text>
                            </Card>
                        </View>
                    </>
                )}

                {/* Weekly Volume Chart */}
                <View style={[s.sectionHeader, { marginTop: 12 }]}>
                    <Text style={s.sectionTitle}>WEEKLY VOLUME (KG)</Text>
                </View>
                <Card style={s.chartCard}>
                    <BarChart
                        data={weeklyVolumeData}
                        width={SCREEN_WIDTH - 40}
                        height={220}
                        chartConfig={barChartConfig}
                        style={s.chart}
                        yAxisLabel=""
                        yAxisSuffix=""
                    />
                </Card>
            </ScrollView>
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

const barChartConfig = {
    ...chartConfig,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity * 0.8})`,
}

const s = StyleSheet.create({
    header: { paddingHorizontal: 20, paddingBottom: 16 },
    title: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
    
    selector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginBottom: 20, padding: 16, backgroundColor: SURFACE, borderRadius: 16, borderWidth: 1, borderColor: BORDER },
    selectorLabel: { fontSize: 10, fontWeight: '800', color: TEXT_TERTIARY, letterSpacing: 1, marginBottom: 4 },
    selectorValue: { fontSize: 17, fontWeight: '700', color: '#fff' },

    pickerDropdown: { marginHorizontal: 20, marginBottom: 20, backgroundColor: SURFACE2, borderRadius: 16, padding: 8, borderWidth: 1, borderColor: BORDER },
    pickerItem: { padding: 12, borderRadius: 8 },
    pickerText: { fontSize: 15, color: TEXT_SECONDARY, fontWeight: '600' },

    sectionHeader: { paddingHorizontal: 20, marginBottom: 12 },
    sectionTitle: { fontSize: 12, fontWeight: '800', color: TEXT_TERTIARY, letterSpacing: 1 },

    chartCard: { marginHorizontal: 20, paddingVertical: 16, paddingHorizontal: 0, alignItems: 'center', overflow: 'hidden' },
    chart: { borderRadius: 16, marginLeft: -10 },

    statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginVertical: 20 },
    statCard: { flex: 1, padding: 16, alignItems: 'center', gap: 4 },
    statVal: { fontSize: 18, fontWeight: '800', color: '#fff' },
    statLabel: { fontSize: 11, color: TEXT_TERTIARY, fontWeight: '700', textTransform: 'uppercase' },

    startBtn: { marginTop: 24, backgroundColor: ACCENT, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
    startBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})

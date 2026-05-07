import { useState, useMemo, useCallback } from 'react'
import { View, ScrollView, StyleSheet, Pressable, Dimensions, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useFocusEffect } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Svg, { Path, G } from 'react-native-svg'
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
import { ChevronLeft, Info } from 'lucide-react-native'

const SCREEN_WIDTH = Dimensions.get('window').width

// Muscle group mapping
const MUSCLE_GROUPS: Record<string, string[]> = {
    'Chest': ['Bench Press (Barbell)', 'Incline Bench Press (Dumbbell)', 'Chest Fly (Machine)'],
    'Back': ['Deadlift (Conventional)', 'Pull Up', 'Barbell Row (Bent Over)', 'Lat Pulldown (Wide Grip)'],
    'Legs': ['Squat (Barbell High Bar)', 'Leg Press', 'Leg Curl (Lying)', 'Romanian Deadlift (Barbell)', 'Calf Raise (Standing)'],
    'Shoulders': ['Overhead Press (Barbell)', 'Lateral Raise (Dumbbell)', 'Face Pull'],
    'Arms': ['Bicep Curl (Dumbbell)', 'Tricep Pushdown', 'Hammer Curl (Dumbbell)'],
    'Core': ['Plank', 'Hanging Leg Raise'],
}

export default function MuscleHeatmapScreen() {
    const insets = useSafeAreaInsets()
    const [loading, setLoading] = useState(true)
    const [workouts, setWorkouts] = useState<any[]>([])
    const [timeframe, setTimeframe] = useState<'weekly' | 'allTime'>('weekly')

    const loadData = useCallback(async () => {
        try {
            const data = await AsyncStorage.getItem('workouts')
            setWorkouts(data ? JSON.parse(data) : [])
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }, [])

    useFocusEffect(useCallback(() => { loadData() }, [loadData]))

    const heatmapData = useMemo(() => {
        const volumes: Record<string, number> = {
            Chest: 0, Back: 0, Legs: 0, Shoulders: 0, Arms: 0, Core: 0
        }

        const now = new Date()
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        sevenDaysAgo.setHours(0, 0, 0, 0)

        workouts.forEach(w => {
            const wDate = new Date(w.date)
            if (timeframe === 'weekly' && wDate < sevenDaysAgo) return

            w.exercises.forEach((ex: any) => {
                // Find muscle group for this exercise
                let group = 'Other'
                for (const [g, names] of Object.entries(MUSCLE_GROUPS)) {
                    if (names.includes(ex.name)) {
                        group = g
                        break
                    }
                }
                if (volumes[group] !== undefined) {
                    volumes[group] += (ex.volume || 0)
                }
            })
        })

        // Normalize to 0-1 scale for coloring
        const maxVol = Math.max(...Object.values(volumes), 1000)
        const intensity: Record<string, number> = {}
        Object.keys(volumes).forEach(k => {
            intensity[k] = Math.min(volumes[k] / maxVol, 1)
        })

        return { volumes, intensity }
    }, [workouts, timeframe])

    const getMuscleColor = (group: string) => {
        const val = heatmapData.intensity[group] || 0
        if (val === 0) return '#262626'
        // Blend from dark grey to electric blue
        return `rgba(59, 130, 246, ${0.3 + (val * 0.7)})`
    }

    if (loading) return (
        <View style={{ flex: 1, backgroundColor: BG, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color={ACCENT} size="large" />
        </View>
    )

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <View style={[s.header, { paddingTop: insets.top + 10 }]}>
                <Pressable onPress={() => router.back()} style={s.backBtn}>
                    <ChevronLeft size={24} color="#fff" />
                </Pressable>
                <Text style={s.title}>Muscle Heatmap</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView 
                style={{ flex: 1 }} 
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Timeframe Toggle */}
                <View style={s.toggleRow}>
                    <Pressable 
                        onPress={() => setTimeframe('weekly')}
                        style={[s.toggle, timeframe === 'weekly' && s.toggleActive]}
                    >
                        <Text style={[s.toggleText, timeframe === 'weekly' && s.toggleTextActive]}>This Week</Text>
                    </Pressable>
                    <Pressable 
                        onPress={() => setTimeframe('allTime')}
                        style={[s.toggle, timeframe === 'allTime' && s.toggleActive]}
                    >
                        <Text style={[s.toggleText, timeframe === 'allTime' && s.toggleTextActive]}>All Time</Text>
                    </Pressable>
                </View>

                {/* Body Diagrams */}
                <View style={s.bodyContainer}>
                    <View style={s.diagramWrap}>
                        <Text style={s.diagramLabel}>FRONT</Text>
                        <Svg width={SCREEN_WIDTH * 0.45} height={SCREEN_WIDTH * 0.9} viewBox="0 0 100 200">
                            {/* Head */}
                            <Path d="M40,10 Q50,0 60,10 L60,20 Q50,30 40,20 Z" fill="#262626" />
                            {/* Chest */}
                            <Path d="M30,35 L70,35 L70,60 L30,60 Z" fill={getMuscleColor('Chest')} />
                            {/* Core/Abs */}
                            <Path d="M35,65 L65,65 L65,95 L35,95 Z" fill={getMuscleColor('Core')} />
                            {/* Shoulders */}
                            <Path d="M15,35 L30,35 L30,50 L15,50 Z" fill={getMuscleColor('Shoulders')} />
                            <Path d="M70,35 L85,35 L85,50 L70,50 Z" fill={getMuscleColor('Shoulders')} />
                            {/* Arms (Front) */}
                            <Path d="M10,50 L25,50 L25,90 L10,90 Z" fill={getMuscleColor('Arms')} />
                            <Path d="M75,50 L90,50 L90,90 L75,90 Z" fill={getMuscleColor('Arms')} />
                            {/* Quads (Legs) */}
                            <Path d="M25,105 L45,105 L45,160 L25,160 Z" fill={getMuscleColor('Legs')} />
                            <Path d="M55,105 L75,105 L75,160 L55,160 Z" fill={getMuscleColor('Legs')} />
                        </Svg>
                    </View>

                    <View style={s.diagramWrap}>
                        <Text style={s.diagramLabel}>BACK</Text>
                        <Svg width={SCREEN_WIDTH * 0.45} height={SCREEN_WIDTH * 0.9} viewBox="0 0 100 200">
                            {/* Back */}
                            <Path d="M25,35 L75,35 L75,90 L25,90 Z" fill={getMuscleColor('Back')} />
                            {/* Lower Back/Glutes (Legs) */}
                            <Path d="M30,95 L70,95 L70,115 L30,115 Z" fill={getMuscleColor('Legs')} />
                            {/* Hamstrings (Legs) */}
                            <Path d="M25,120 L45,120 L45,170 L25,170 Z" fill={getMuscleColor('Legs')} />
                            <Path d="M55,120 L75,120 L75,170 L55,170 Z" fill={getMuscleColor('Legs')} />
                            {/* Shoulders (Back) */}
                            <Path d="M15,35 L30,35 L30,50 L15,50 Z" fill={getMuscleColor('Shoulders')} />
                            <Path d="M70,35 L85,35 L85,50 L70,50 Z" fill={getMuscleColor('Shoulders')} />
                        </Svg>
                    </View>
                </View>

                {/* Legend/Stats */}
                <View style={s.legendContainer}>
                    <View style={s.legendHeader}>
                        <Info size={16} color={TEXT_TERTIARY} />
                        <Text style={s.legendTitle}>VOLUME BREAKDOWN (KG)</Text>
                    </View>
                    <View style={s.grid}>
                        {Object.keys(MUSCLE_GROUPS).map(group => (
                            <Card key={group} style={s.groupCard}>
                                <View style={[s.indicator, { backgroundColor: getMuscleColor(group) }]} />
                                <View>
                                    <Text style={s.groupName}>{group}</Text>
                                    <Text style={s.groupVol}>{(heatmapData.volumes[group] / 1000).toFixed(1)}k</Text>
                                </View>
                            </Card>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 20, fontWeight: '800', color: '#fff' },

    toggleRow: { flexDirection: 'row', backgroundColor: SURFACE, marginHorizontal: 20, marginTop: 10, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: BORDER },
    toggle: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
    toggleActive: { backgroundColor: SURFACE2 },
    toggleText: { fontSize: 14, fontWeight: '700', color: TEXT_TERTIARY },
    toggleTextActive: { color: '#fff' },

    bodyContainer: { flexDirection: 'row', justifyContent: 'space-around', padding: 20, gap: 10 },
    diagramWrap: { alignItems: 'center' },
    diagramLabel: { fontSize: 11, fontWeight: '800', color: TEXT_TERTIARY, marginBottom: 12, letterSpacing: 1 },

    legendContainer: { paddingHorizontal: 20, marginTop: 20 },
    legendHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    legendTitle: { fontSize: 12, fontWeight: '800', color: TEXT_TERTIARY, letterSpacing: 1 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    groupCard: { width: (SCREEN_WIDTH - 52) / 2, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
    indicator: { width: 4, height: 30, borderRadius: 2 },
    groupName: { fontSize: 13, fontWeight: '700', color: TEXT_SECONDARY },
    groupVol: { fontSize: 16, fontWeight: '800', color: '#fff', marginTop: 2 }
})

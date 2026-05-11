import React, { useState, useEffect, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ChevronLeft, Calendar, BarChart2, Dumbbell, ChevronRight } from 'lucide-react-native'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { BG, SURFACE, SURFACE2, ACCENT, TEXT_SECONDARY, TEXT_TERTIARY, BORDER, ACCENT_LIGHT } from '@/lib/theme'

export default function WorkoutHistoryScreen() {
    const insets = useSafeAreaInsets()
    const [workouts, setWorkouts] = useState<any[]>([])

    const loadHistory = useCallback(async () => {
        const data = await AsyncStorage.getItem('workouts')
        if (data) {
            const list = JSON.parse(data)
            setWorkouts(list.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()))
        }
    }, [])

    useEffect(() => {
        loadHistory()
    }, [loadHistory])

    return (
        <View style={[s.container, { paddingTop: insets.top }]}>
            <View style={s.header}>
                <Pressable onPress={() => router.back()} style={s.backBtn}>
                    <ChevronLeft size={24} color="#fff" />
                </Pressable>
                <Text style={s.title}>Workout History</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scrollContent}>
                {workouts.length === 0 ? (
                    <View style={s.emptyState}>
                        <Dumbbell size={48} color={SURFACE2} />
                        <Text style={s.emptyText}>No workouts recorded yet</Text>
                    </View>
                ) : (
                    workouts.map((w) => (
                        <TouchableOpacity
                            key={w.id}
                            activeOpacity={0.7}
                            onPress={() => router.push({ pathname: '/workout-detail', params: { workout: JSON.stringify(w) } })}
                        >
                            <Card style={s.workoutCard}>
                                <View style={s.cardPressable}>
                                    <View style={s.cardTop}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={s.workoutName}>{w.name}</Text>
                                        <View style={s.dateRow}>
                                            <Calendar size={12} color={TEXT_TERTIARY} />
                                            <Text style={s.dateText}>{new Date(w.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                                        </View>
                                        </View>
                                        <ChevronRight size={20} color={TEXT_TERTIARY} />
                                    </View>
                                    <View style={s.cardStats}>
                                        <View style={s.cardStat}>
                                            <BarChart2 size={14} color={ACCENT} />
                                            <Text style={s.cardStatText}>{w.volume.toLocaleString()} kg</Text>
                                        </View>
                                        <View style={s.cardStat}>
                                            <Dumbbell size={14} color={ACCENT} />
                                            <Text style={s.cardStatText}>{w.exercises.length} exercises</Text>
                                        </View>
                                    </View>
                                </View>
                            </Card>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: SURFACE2, borderRadius: 12 },
    title: { fontSize: 18, fontWeight: '800', color: '#fff' },
    scrollContent: { padding: 20, gap: 16 },
    
    workoutCard: { padding: 0, overflow: 'hidden' },
    cardPressable: { padding: 16, gap: 12 },
    cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    workoutName: { fontSize: 17, fontWeight: '700', color: ACCENT_LIGHT },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    dateText: { fontSize: 12, color: TEXT_TERTIARY, fontWeight: '600' },
    
    cardStats: { flexDirection: 'row', gap: 16, marginTop: 4 },
    cardStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    cardStatText: { fontSize: 13, color: TEXT_SECONDARY, fontWeight: '600' },

    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100, gap: 16 },
    emptyText: { fontSize: 16, color: TEXT_TERTIARY, fontWeight: '600' }
})

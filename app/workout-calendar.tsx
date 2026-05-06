import { useState, useMemo, useCallback } from 'react'
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useFocusEffect } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Calendar } from 'react-native-calendars'
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
import { ChevronLeft, Flame, Calendar as CalendarIcon, Info, Trophy } from 'lucide-react-native'

export default function WorkoutCalendarScreen() {
    const insets = useSafeAreaInsets()
    const [loading, setLoading] = useState(true)
    const [workouts, setWorkouts] = useState<any[]>([])
    const [selectedDate, setSelectedDate] = useState<string | null>(null)
    const [stats, setStats] = useState({ currentStreak: 0, longestStreak: 0 })

    const loadData = useCallback(async () => {
        try {
            const data = await AsyncStorage.getItem('workouts')
            const list = data ? JSON.parse(data) : []
            setWorkouts(list)

            // Calculate Streaks
            if (list.length > 0) {
                const sorted = [...list].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                
                // Current Streak
                let current = 0
                const today = new Date().setHours(0,0,0,0)
                let lastDate = new Date(sorted[0].date).setHours(0,0,0,0)
                
                if (today - lastDate <= 86400000) {
                    current = 1
                    let prev = lastDate
                    for (let i = 1; i < sorted.length; i++) {
                        const d = new Date(sorted[i].date).setHours(0,0,0,0)
                        if (prev - d === 86400000) { current++; prev = d; }
                        else if (prev - d === 0) continue
                        else break
                    }
                }

                // Longest Streak
                let longest = 0
                let temp = 1
                const allDates = Array.from(new Set(list.map((w: any) => new Date(w.date).setHours(0,0,0,0)))).sort((a: any, b: any) => b - a) as number[]
                
                for (let i = 0; i < allDates.length - 1; i++) {
                    if (allDates[i] - allDates[i+1] === 86400000) {
                        temp++
                    } else {
                        longest = Math.max(longest, temp)
                        temp = 1
                    }
                }
                longest = Math.max(longest, temp)

                setStats({ currentStreak: current, longestStreak: longest })
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }, [])

    useFocusEffect(useCallback(() => { loadData() }, [loadData]))

    const markedDates = useMemo(() => {
        const marked: any = {}
        workouts.forEach((w: any) => {
            const date = w.date.split('T')[0]
            marked[date] = {
                marked: true,
                dotColor: ACCENT,
                customStyles: {
                    container: { backgroundColor: SURFACE2, borderRadius: 8 },
                    text: { color: '#fff', fontWeight: '700' }
                }
            }
        })
        if (selectedDate) {
            marked[selectedDate] = {
                ...marked[selectedDate],
                selected: true,
                selectedColor: ACCENT,
            }
        }
        return marked
    }, [workouts, selectedDate])

    const selectedWorkout = useMemo(() => {
        if (!selectedDate) return null
        return workouts.filter(w => w.date.startsWith(selectedDate))
    }, [selectedDate, workouts])

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
                <Text style={s.title}>Workout Calendar</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView 
                style={{ flex: 1 }} 
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Streak Banner */}
                <View style={s.streakRow}>
                    <Card style={s.streakBox}>
                        <Flame size={20} color={ACCENT} fill={ACCENT} />
                        <View>
                            <Text style={s.streakVal}>{stats.currentStreak} Days</Text>
                            <Text style={s.streakLabel}>Current Streak</Text>
                        </View>
                    </Card>
                    <Card style={s.streakBox}>
                        <Trophy size={20} color="#f59e0b" />
                        <View>
                            <Text style={s.streakVal}>{stats.longestStreak} Days</Text>
                            <Text style={s.streakLabel}>Longest Streak</Text>
                        </View>
                    </Card>
                </View>

                {/* Calendar */}
                <View style={s.calendarWrap}>
                    <Calendar
                        theme={{
                            backgroundColor: BG,
                            calendarBackground: BG,
                            textSectionTitleColor: TEXT_TERTIARY,
                            selectedDayBackgroundColor: ACCENT,
                            selectedDayTextColor: '#ffffff',
                            todayTextColor: ACCENT,
                            dayTextColor: '#fff',
                            textDisabledColor: '#333',
                            dotColor: ACCENT,
                            selectedDotColor: '#ffffff',
                            arrowColor: ACCENT,
                            monthTextColor: '#fff',
                            indicatorColor: ACCENT,
                            textDayFontWeight: '600',
                            textMonthFontWeight: '800',
                            textDayHeaderFontWeight: '700',
                            textDayFontSize: 14,
                            textMonthFontSize: 18,
                            textDayHeaderFontSize: 12,
                        }}
                        markedDates={markedDates}
                        onDayPress={(day) => setSelectedDate(day.dateString)}
                        markingType={'custom'}
                    />
                </View>

                {/* Selection Details */}
                <View style={s.detailsContainer}>
                    <View style={s.detailsHeader}>
                        <CalendarIcon size={16} color={TEXT_TERTIARY} />
                        <Text style={s.detailsTitle}>
                            {selectedDate ? `SESSIONS ON ${selectedDate}` : 'SELECT A DAY TO VIEW DETAILS'}
                        </Text>
                    </View>

                    {selectedWorkout && selectedWorkout.length > 0 ? (
                        selectedWorkout.map((w: any) => (
                            <Card key={w.id} style={s.workoutCard}>
                                <View style={s.cardInfo}>
                                    <Text style={s.workoutName}>{w.name}</Text>
                                    <Text style={s.workoutMeta}>{w.exercises.length} Exercises • {w.duration}</Text>
                                </View>
                                <View style={s.volWrap}>
                                    <Text style={s.volVal}>{(w.volume / 1000).toFixed(1)}k</Text>
                                    <Text style={s.volUnit}>KG</Text>
                                </View>
                            </Card>
                        ))
                    ) : (
                        selectedDate && (
                            <View style={s.emptyState}>
                                <Info size={32} color={SURFACE2} />
                                <Text style={s.emptyText}>Rest Day. No workouts logged.</Text>
                            </View>
                        )
                    )}
                </View>
            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 20, fontWeight: '800', color: '#fff' },

    streakRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginTop: 10, marginBottom: 20 },
    streakBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
    streakVal: { fontSize: 18, fontWeight: '800', color: '#fff' },
    streakLabel: { fontSize: 10, color: TEXT_TERTIARY, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },

    calendarWrap: { marginHorizontal: 20, backgroundColor: BG, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: BORDER, paddingBottom: 10 },
    
    detailsContainer: { paddingHorizontal: 20, marginTop: 24 },
    detailsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    detailsTitle: { fontSize: 11, fontWeight: '800', color: TEXT_TERTIARY, letterSpacing: 1 },

    workoutCard: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 12 },
    cardInfo: { flex: 1 },
    workoutName: { fontSize: 16, fontWeight: '700', color: '#fff' },
    workoutMeta: { fontSize: 12, color: TEXT_TERTIARY, marginTop: 4 },
    volWrap: { alignItems: 'flex-end' },
    volVal: { fontSize: 17, fontWeight: '800', color: ACCENT },
    volUnit: { fontSize: 10, fontWeight: '800', color: TEXT_TERTIARY },

    emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
    emptyText: { fontSize: 14, color: TEXT_TERTIARY, fontWeight: '600' }
})

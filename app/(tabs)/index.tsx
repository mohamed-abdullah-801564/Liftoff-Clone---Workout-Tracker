import { useState, useEffect, useCallback } from 'react'
import { View, ScrollView, StyleSheet, Pressable, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native'
import { AvatarPicker, AvatarDisplay } from '@/components/AvatarPicker'
import { WorkoutDetailModal } from '@/components/WorkoutDetailModal'
import { Toast, ToastHandle } from '@/components/Toast'
import { useRef } from 'react'
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
import { Flame, Trophy, Calendar, ChevronRight, Play, ArrowUpRight, Plus, Accessibility, Dumbbell, List } from 'lucide-react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { useMemo } from 'react'
import { formatVolume } from '@/lib/utils'

const { width } = Dimensions.get('window')

export default function HomeScreen() {
    const insets = useSafeAreaInsets()
    const [loading, setLoading] = useState(true)
    const [streak, setStreak] = useState(0)
    const [weeklyVolume, setWeeklyVolume] = useState('0')
    const [trend, setTrend] = useState(0)
    const [workouts, setWorkouts] = useState<any[]>([])
    const [activeWorkout, setActiveWorkout] = useState<any[] | null>(null)
    const [userName, setUserName] = useState('Alex')
    const [userAvatar, setUserAvatar] = useState<any>(null)
    const [showAvatarPicker, setShowAvatarPicker] = useState(false)
    const [selectedWorkout, setSelectedWorkout] = useState<any>(null)
    const [savedRoutines, setSavedRoutines] = useState<any[]>([])
    const toastRef = useRef<ToastHandle>(null)
    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const snapPoints = useMemo(() => ['45%'], [])

    const [todayPlan, setTodayPlan] = useState<any>(null)

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            // Seed quick workouts if not done yet
            const seeded = await AsyncStorage.getItem('seeded_quick_workouts')
            if (!seeded) {
                const now = new Date()
                const today = new Date(now).toISOString()
                const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
                const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()

                const quickWorkouts = [
                    {
                        id: 'seed-1',
                        name: 'Push Day',
                        date: twoDaysAgo,
                        duration: '00:45:00',
                        volume: 1460,
                        totalSets: 3,
                        exercises: [
                            {
                                id: '1',
                                name: 'Bench Press (Barbell)',
                                volume: 500,
                                completedSets: 1,
                                sets: [{ id: 'bp-1', weight: '100', reps: '5', status: 'completed' }]
                            },
                            {
                                id: '4',
                                name: 'Overhead Press (Barbell)',
                                volume: 480,
                                completedSets: 1,
                                sets: [{ id: 'sp-1', weight: '60', reps: '8', status: 'completed' }]
                            },
                            {
                                id: '11',
                                name: 'Tricep Pushdown',
                                volume: 480,
                                completedSets: 1,
                                sets: [{ id: 'te-1', weight: '40', reps: '12', status: 'completed' }]
                            }
                        ]
                    },
                    {
                        id: 'seed-2',
                        name: 'Pull Day',
                        date: yesterday,
                        duration: '00:50:00',
                        volume: 1940,
                        totalSets: 3,
                        exercises: [
                            {
                                id: '2',
                                name: 'Deadlift (Conventional)',
                                volume: 600,
                                completedSets: 1,
                                sets: [{ id: 'dl-1', weight: '120', reps: '5', status: 'completed' }]
                            },
                            {
                                id: '5',
                                name: 'Pull Up',
                                volume: 640,
                                completedSets: 1,
                                sets: [{ id: 'pu-1', weight: '80', reps: '8', status: 'completed' }]
                            },
                            {
                                id: '7',
                                name: 'Barbell Row (Bent Over)',
                                volume: 700,
                                completedSets: 1,
                                sets: [{ id: 'br-1', weight: '70', reps: '10', status: 'completed' }]
                            }
                        ]
                    },
                    {
                        id: 'seed-3',
                        name: 'Leg Day',
                        date: today,
                        duration: '01:00:00',
                        volume: 2800,
                        totalSets: 3,
                        exercises: [
                            {
                                id: '3',
                                name: 'Squat (Barbell High Bar)',
                                volume: 500,
                                completedSets: 1,
                                sets: [{ id: 'sq-1', weight: '100', reps: '5', status: 'completed' }]
                            },
                            {
                                id: '8',
                                name: 'Leg Press',
                                volume: 1400,
                                completedSets: 1,
                                sets: [{ id: 'lp-1', weight: '140', reps: '10', status: 'completed' }]
                            },
                            {
                                id: '19',
                                name: 'Calf Raise (Standing)',
                                volume: 900,
                                completedSets: 1,
                                sets: [{ id: 'cr-1', weight: '60', reps: '15', status: 'completed' }]
                            }
                        ]
                    }
                ]

                const existingWorkoutsStr = await AsyncStorage.getItem('workouts')
                let existingWorkouts = existingWorkoutsStr ? JSON.parse(existingWorkoutsStr) : []
                
                // Add the seeded workouts to history if they aren't already there
                const filteredSeeds = quickWorkouts.filter(seed => !existingWorkouts.some((w: any) => w.id === seed.id))
                if (filteredSeeds.length > 0) {
                    existingWorkouts = [...existingWorkouts, ...filteredSeeds]
                    await AsyncStorage.setItem('workouts', JSON.stringify(existingWorkouts))
                }
                await AsyncStorage.setItem('seeded_quick_workouts', 'true')
            }

            const data = await AsyncStorage.getItem('workouts')
            const currentEx = await AsyncStorage.getItem('current_workout_exercises')
            const savedName = await AsyncStorage.getItem('user_name')
            const savedAvatar = await AsyncStorage.getItem('user_avatar')
            const routinesData = await AsyncStorage.getItem('routines')
            const p = await AsyncStorage.getItem('weekly_plan')

            if (savedName) setUserName(savedName.split(' ')[0]) // Just first name for greeting
            if (savedAvatar) setUserAvatar(JSON.parse(savedAvatar))
            if (routinesData) setSavedRoutines(JSON.parse(routinesData))
            
            if (p) {
                const plan = JSON.parse(p)
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                const todayName = days[new Date().getDay()]
                setTodayPlan(plan[todayName])
            }

            const savedWorkouts = data ? JSON.parse(data) : []
            const currentList = currentEx ? JSON.parse(currentEx) : []
            
            setActiveWorkout(currentList.length > 0 ? currentList : null)

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

            setWeeklyVolume(formatVolume(currentVol))
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

    const startPlan = async (routine: any) => {
        try {
            await AsyncStorage.setItem('current_workout_exercises', JSON.stringify(routine.exercises))
            await AsyncStorage.setItem('current_workout_name', routine.name)
            router.push('/workout')
        } catch (e) {
            console.error(e)
        }
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
                    <Text style={s.greeting}>Welcome Back, {userName}</Text>
                    <View style={s.streakBadge}>
                        <Flame size={14} color={ACCENT} fill={ACCENT} />
                        <Text style={s.streakText}>{streak} Day Streak</Text>
                    </View>
                </View>
                <Pressable onPress={() => setShowAvatarPicker(true)}>
                    <AvatarDisplay avatar={userAvatar} size={44} fallbackText={userName[0]} />
                </Pressable>
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
                <Text style={s.heroValue}>{weeklyVolume}</Text>
                <View style={s.heroFooter}>
                    <Text style={s.heroSub}>Activity from last 7 days</Text>
                </View>
            </Card>
            {/* Quick Actions */}
            <View style={s.actionRow}>
                <Pressable style={s.actionBtn} onPress={() => router.push('/routines')}>
                    <List size={20} color={ACCENT} />
                    <Text style={s.actionBtnText}>Routines</Text>
                </Pressable>
                <Pressable style={s.actionBtn} onPress={() => router.push('/muscle-heatmap')}>
                    <Accessibility size={20} color={ACCENT} />
                    <Text style={s.actionBtnText}>Muscle Map</Text>
                </Pressable>
                <Pressable style={s.actionBtn} onPress={() => bottomSheetModalRef.current?.present()}>
                    <Dumbbell size={20} color={ACCENT} />
                    <Text style={s.actionBtnText}>Start Workout</Text>
                </Pressable>
            </View>
            {activeWorkout && (
                <Pressable onPress={() => router.push('/workout')}>
                    <Card style={s.activeCard}>
                        <View style={s.activeHeader}>
                            <View style={s.liveBadge}>
                                <View style={s.liveDot} />
                                <Text style={s.liveText}>IN PROGRESS</Text>
                            </View>
                            <Text style={s.activeTime}>Active Now</Text>
                        </View>
                        <Text style={s.activeTitle}>Current Workout</Text>
                        <Text style={s.activeSub}>{activeWorkout.length} exercises added • Tap to resume</Text>
                    </Card>
                </Pressable>
            )}


            {/* Today's Plan */}
            {todayPlan && !activeWorkout && (
                <View style={s.section}>
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionTitle}>Today's Plan</Text>
                    </View>
                    <Card style={s.planCard}>
                        <View style={s.planInfo}>
                            <View style={s.planIcon}>
                                <Calendar size={20} color={ACCENT} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.planTitle}>{todayPlan.name}</Text>
                                <Text style={s.planSub}>{todayPlan.exercises.length} exercises scheduled</Text>
                            </View>
                            <Pressable style={s.planStartBtn} onPress={() => startPlan(todayPlan)}>
                                <Play size={16} color="#fff" fill="#fff" />
                                <Text style={s.planStartText}>Start</Text>
                            </Pressable>
                        </View>
                    </Card>
                </View>
            )}

            {/* Recent Workouts List */}
            <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Recent Workouts</Text>
                <Pressable onPress={() => router.push('/workout-history')}><Text style={s.viewAll}>View All</Text></Pressable>
            </View>

            {workouts.length > 0 ? (
                workouts.map((workout) => (
                    <TouchableOpacity 
                        key={workout.id} 
                        activeOpacity={0.7}
                        onPress={() => router.push({ pathname: '/workout-detail', params: { workout: JSON.stringify(workout) } })}
                    >
                        <Card style={s.workoutCard}>
                            <View style={s.workoutInfo}>
                                <Text style={s.workoutName}>{workout.name}</Text>
                                <Text style={s.workoutMeta}>
                                    {new Date(workout.date).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {workout.duration} • {workout.totalSets || 0} sets
                                </Text>
                            </View>
                            <View style={s.workoutVolume}>
                                <Text style={s.volValue}>{formatVolume(workout.volume || 0)}</Text>
                                <Text style={s.volLabel}>Volume</Text>
                            </View>
                        </Card>
                    </TouchableOpacity>
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

            <AvatarPicker 
                visible={showAvatarPicker} 
                onClose={() => setShowAvatarPicker(false)} 
                onSelect={setUserAvatar} 
            />

            <WorkoutDetailModal 
                visible={!!selectedWorkout} 
                onClose={() => setSelectedWorkout(null)} 
                workout={selectedWorkout} 
            />

            <Toast ref={toastRef} />

            <BottomSheetModal
                ref={bottomSheetModalRef}
                index={0}
                snapPoints={snapPoints}
                backdropComponent={(props) => (
                    <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
                )}
                backgroundStyle={{ backgroundColor: SURFACE }}
                handleIndicatorStyle={{ backgroundColor: BORDER }}
            >
                <BottomSheetView style={s.modalContent}>
                    <Text style={s.modalTitle}>Start Workout</Text>
                    
                    <Pressable 
                        style={s.modalOption}
                        onPress={() => {
                            bottomSheetModalRef.current?.dismiss()
                            router.push('/workout')
                        }}
                    >
                        <View style={s.optionIcon}>
                            <Plus size={22} color={ACCENT} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.optionTitle}>Quick Start</Text>
                            <Text style={s.optionSub}>Start an empty workout</Text>
                        </View>
                        <ChevronRight size={20} color={TEXT_TERTIARY} />
                    </Pressable>

                    <View style={s.divider} />

                    <View style={{ flex: 1 }}>
                        <View style={s.routineHeader}>
                            <Text style={s.routineSectionTitle}>My Routines</Text>
                            <Pressable onPress={() => {
                                bottomSheetModalRef.current?.dismiss()
                                router.push('/routines')
                            }}>
                                <Text style={s.manageLink}>Manage</Text>
                            </Pressable>
                        </View>

                        {savedRoutines.length > 0 ? (
                            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                                {savedRoutines.map((routine) => (
                                    <Pressable 
                                        key={routine.id} 
                                        style={s.routineItem}
                                        onPress={async () => {
                                            await AsyncStorage.setItem('current_workout_exercises', JSON.stringify(routine.exercises))
                                            bottomSheetModalRef.current?.dismiss()
                                            router.push({
                                                pathname: '/(tabs)/workout',
                                                params: { routineName: routine.name }
                                            })
                                        }}
                                    >
                                        <View style={s.routineIcon}>
                                            <List size={18} color={TEXT_SECONDARY} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={s.routineItemName}>{routine.name}</Text>
                                            <Text style={s.routineItemSub}>{routine.exercises.length} exercises</Text>
                                        </View>
                                        <Play size={16} color={ACCENT} fill={ACCENT} />
                                    </Pressable>
                                ))}
                            </ScrollView>
                        ) : (
                            <View style={s.emptyRoutines}>
                                <Text style={s.emptyRoutinesText}>No saved routines yet</Text>
                            </View>
                        )}
                    </View>
                </BottomSheetView>
            </BottomSheetModal>
        </ScrollView>
    )
}

const s = StyleSheet.create({
    container: { paddingHorizontal: 20, gap: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    greeting: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
    streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, backgroundColor: 'rgba(59, 130, 246, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    streakText: { fontSize: 13, color: ACCENT, fontWeight: '700' },
    
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

    section: { gap: 12, marginBottom: 24 },
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

    actionRow: { flexDirection: 'row', gap: 10, marginHorizontal: 20, marginBottom: 20 },
    actionBtn: { flex: 1, backgroundColor: SURFACE, borderRadius: 16, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: BORDER },
    actionBtnText: { color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', textAlign: 'center' },
    
    planCard: { padding: 16, backgroundColor: SURFACE, borderColor: BORDER, borderWidth: 1 },
    planInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    planIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: SURFACE2, alignItems: 'center', justifyContent: 'center' },
    planTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
    planSub: { fontSize: 12, color: TEXT_TERTIARY, marginTop: 2 },
    planStartBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: ACCENT, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    planStartText: { fontSize: 13, fontWeight: '700', color: '#fff' },

    activeCard: { padding: 20, backgroundColor: SURFACE, borderColor: 'rgba(59, 130, 246, 0.3)', borderWidth: 1.5, gap: 12 },
    activeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(59, 130, 246, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT },
    liveText: { fontSize: 10, fontWeight: '800', color: ACCENT, letterSpacing: 0.5 },
    activeTime: { fontSize: 12, color: TEXT_TERTIARY, fontWeight: '600' },
    activeTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
    activeSub: { fontSize: 14, color: TEXT_SECONDARY, fontWeight: '500' },

    // Modal Styles
    modalContent: { flex: 1, padding: 24, gap: 20 },
    modalTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
    modalOption: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 12 },
    optionIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(59, 130, 246, 0.1)', alignItems: 'center', justifyContent: 'center' },
    optionTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
    optionSub: { fontSize: 13, color: TEXT_TERTIARY, fontWeight: '500', marginTop: 2 },
    divider: { height: 1, backgroundColor: BORDER },
    routineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    routineSectionTitle: { fontSize: 14, fontWeight: '700', color: TEXT_TERTIARY, textTransform: 'uppercase', letterSpacing: 0.5 },
    manageLink: { fontSize: 13, color: ACCENT, fontWeight: '600' },
    routineItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
    routineIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: SURFACE2, alignItems: 'center', justifyContent: 'center' },
    routineItemName: { fontSize: 15, fontWeight: '600', color: '#fff' },
    routineItemSub: { fontSize: 12, color: TEXT_TERTIARY, fontWeight: '500', marginTop: 1 },
    emptyRoutines: { paddingVertical: 20, alignItems: 'center' },
    emptyRoutinesText: { fontSize: 13, color: TEXT_TERTIARY, fontStyle: 'italic' },
})

import { useState, useEffect, useCallback, useMemo } from 'react'
import { View, ScrollView, StyleSheet, Pressable, TextInput, ActivityIndicator, Animated, Dimensions } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Haptics from 'expo-haptics'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { Toast, ToastHandle } from '@/components/Toast'
import { useRef } from 'react'
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
import { Check, Plus, X, Timer, ChevronLeft, Trophy } from 'lucide-react-native'

const { width, height } = Dimensions.get('window')

export default function WorkoutScreen() {
    const insets = useSafeAreaInsets()
    const [loading, setLoading] = useState(false)
    const [secondsElapsed, setSecondsElapsed] = useState(0)
    const [timer, setTimer] = useState('01:24')
    const [workoutName, setWorkoutName] = useState('')
    const [exercises, setExercises] = useState<any[]>([])
    const [previousPRs, setPreviousPRs] = useState<Record<string, number>>({})
    const toastRef = useRef<ToastHandle>(null)
    
    // PR Celebration Animation
    const prAnim = useState(new Animated.Value(0))[0]
    const [showPR, setShowPR] = useState<string | null>(null)

    const loadWorkout = useCallback(async () => {
        try {
            const data = await AsyncStorage.getItem('current_workout_exercises')
            const history = await AsyncStorage.getItem('workouts')
            const workouts = history ? JSON.parse(history) : []
            
            // Calculate current PRs from history
            const prMap: Record<string, number> = {}
            workouts.forEach((w: any) => {
                w.exercises.forEach((ex: any) => {
                    const best = Math.max(...ex.sets.map((s: any) => parseFloat(s.weight) || 0))
                    if (!prMap[ex.name] || best > prMap[ex.name]) prMap[ex.name] = best
                })
            })
            setPreviousPRs(prMap)

            if (data) {
                const list = JSON.parse(data)
                setExercises(list.map((ex: any) => ({
                    ...ex,
                    sets: ex.sets || [{ id: Date.now() + Math.random(), weight: '', reps: '', status: 'active' }]
                })))
            }
        } catch (e) {
            console.error(e)
        }
    }, [])

    // Timer Logic
    useEffect(() => {
        const interval = setInterval(() => {
            setSecondsElapsed(prev => prev + 1)
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
        return [h, m, s].map(v => v < 10 ? '0' + v : v).join(':')
    }

    useFocusEffect(
        useCallback(() => {
            loadWorkout()
        }, [loadWorkout])
    )

    // Save to AsyncStorage whenever exercises change so Home screen count is accurate
    // and we don't lose set data when navigating to Add Exercises and back.
    useEffect(() => {
        if (!loading) {
            AsyncStorage.setItem('current_workout_exercises', JSON.stringify(exercises))
        }
    }, [exercises, loading])

    const triggerPRCelebration = (exerciseName: string) => {
        setShowPR(exerciseName)
        Animated.sequence([
            Animated.spring(prAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }),
            Animated.delay(2000),
            Animated.timing(prAnim, { toValue: 0, duration: 300, useNativeDriver: true })
        ]).start(() => setShowPR(null))
    }

    const updateSet = (exId: string, setId: string, fields: any) => {
        setExercises(prev => prev.map(ex => {
            if (ex.id !== exId && ex.instanceId !== exId) return ex
            return {
                ...ex,
                sets: ex.sets.map((s: any) => s.id === setId ? { ...s, ...fields } : s)
            }
        }))
    }

    const addSet = (exId: string) => {
        setExercises(prev => prev.map(ex => {
            if (ex.id !== exId && ex.instanceId !== exId) return ex
            const lastSet = ex.sets[ex.sets.length - 1]
            return {
                ...ex,
                sets: [...ex.sets, { 
                    id: Date.now() + Math.random(), 
                    weight: lastSet?.weight || '', 
                    reps: lastSet?.reps || '', 
                    status: 'active' 
                }]
            }
        }))
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }

    const removeExercise = (id: string) => {
        setExercises(prev => prev.filter(ex => ex.id !== id && ex.instanceId !== id))
    }

    const toggleSetStatus = (exId: string, setId: string) => {
        let isPR = false
        let exName = ''

        setExercises(prev => prev.map(ex => {
            if (ex.id !== exId && ex.instanceId !== exId) return ex
            exName = ex.name
            return {
                ...ex,
                sets: ex.sets.map((s: any) => {
                    if (s.id === setId) {
                        const newStatus = s.status === 'completed' ? 'active' : 'completed'
                        if (newStatus === 'completed') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                            const weight = parseFloat(s.weight) || 0
                            if (weight > (previousPRs[ex.name] || 0) && weight > 0) {
                                isPR = true
                            }
                        }
                        return { ...s, status: newStatus }
                    }
                    return s
                })
            }
        }))

        if (isPR) {
            triggerPRCelebration(exName)
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        }
    }

    const finishWorkout = async () => {
        if (exercises.length === 0) {
            toastRef.current?.show('Add some exercises before finishing!')
            return
        }

        try {
            let totalVolume = 0
            let totalSets = 0
            
            const processedExercises = exercises.map(ex => {
                const completedSets = ex.sets.filter((s: any) => s.status === 'completed')
                const vol = completedSets.reduce((acc: number, s: any) => acc + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0)
                totalVolume += vol
                totalSets += completedSets.length
                return { ...ex, volume: vol, completedSets: completedSets.length }
            })

            const now = new Date()
            const dateLabel = now.toLocaleDateString([], { month: 'short', day: 'numeric' })
            const finalName = workoutName.trim() || `Workout — ${dateLabel}`

            const workoutObj = {
                id: Date.now().toString(),
                name: finalName,
                date: now.toISOString(),
                duration: formatDuration(secondsElapsed),
                volume: totalVolume,
                totalSets,
                exercises: processedExercises
            }

            const existing = await AsyncStorage.getItem('workouts')
            const list = existing ? JSON.parse(existing) : []
            list.push(workoutObj)
            
            await AsyncStorage.setItem('workouts', JSON.stringify(list))
            await AsyncStorage.removeItem('current_workout_exercises')
            
            // Reset state
            setExercises([])
            setWorkoutName('')
            setSecondsElapsed(0)
            
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            toastRef.current?.show(`Workout Complete! Total Volume: ${totalVolume.toLocaleString()} kg`)
            setTimeout(() => router.replace('/(tabs)'), 1000)
        } catch (e) {
            console.error(e)
        }
    }



    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            {/* PR Celebration Overlay */}
            {showPR && (
                <Animated.View style={[s.prOverlay, { opacity: prAnim, transform: [{ scale: prAnim }] }]}>
                    <Trophy size={60} color="#f59e0b" />
                    <Text style={s.prTitle}>NEW PERSONAL RECORD!</Text>
                    <Text style={s.prSubtitle}>{showPR}</Text>
                </Animated.View>
            )}

            {/* Header */}
            <View style={[s.header, { paddingTop: insets.top + 10 }]}>
                <Pressable onPress={() => router.back()} style={s.backBtn}>
                    <ChevronLeft size={24} color="#fff" />
                </Pressable>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <TextInput 
                        style={s.workoutTitle} 
                        value={workoutName}
                        onChangeText={setWorkoutName}
                        placeholder={`Workout — ${new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })}`}
                        placeholderTextColor={TEXT_TERTIARY}
                    />
                    <Text style={s.workoutTime}>{formatDuration(secondsElapsed)}</Text>
                </View>
                <Pressable style={s.finishBtnSmall} onPress={finishWorkout}>
                    <Text style={s.finishTextSmall}>Finish</Text>
                </Pressable>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={[s.container, { paddingBottom: insets.bottom + 140 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Rest Timer UI */}
                <View style={s.timerSection}>
                    <View style={s.timerOuter}>
                        <View style={s.timerInner}>
                            <Timer size={24} color={ACCENT} style={{ marginBottom: 4 }} />
                            <Text style={s.timerValue}>{timer}</Text>
                            <Text style={s.timerLabel}>Rest Timer</Text>
                        </View>
                        <View style={s.timerProgress} />
                    </View>
                </View>

                {/* Exercises */}
                {exercises.map((ex) => (
                    <Card key={ex.instanceId || ex.id} style={s.exCard}>
                        <View style={s.exHeader}>
                            <Pressable onPress={() => router.push({ pathname: '/exercise-details', params: { id: ex.id, name: ex.name } })} style={{ flex: 1 }}>
                                <Text style={s.exName}>{ex.name}</Text>
                            </Pressable>
                            <Pressable onPress={() => removeExercise(ex.instanceId || ex.id)}>
                                <X size={20} color={TEXT_TERTIARY} />
                            </Pressable>
                        </View>

                        <View style={s.tableRow}>
                            <Text style={[s.tableHead, { flex: 1 }]}>SET</Text>
                            <Text style={[s.tableHead, { flex: 2 }]}>KG</Text>
                            <Text style={[s.tableHead, { flex: 2 }]}>REPS</Text>
                            <View style={{ width: 44 }} />
                        </View>

                        {ex.sets.map((set: any, i: number) => (
                            <View key={set.id} style={[s.tableRow, set.status === 'active' && s.activeRow]}>
                                <View style={{ flex: 1 }}><Text style={s.cellText}>{i + 1}</Text></View>
                                <View style={{ flex: 2 }}>
                                    <TextInput 
                                        style={s.cellInput}
                                        value={set.weight.toString()}
                                        onChangeText={(val) => updateSet(ex.instanceId || ex.id, set.id, { weight: val })}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        placeholderTextColor={TEXT_TERTIARY}
                                    />
                                </View>
                                <View style={{ flex: 2 }}>
                                    <TextInput 
                                        style={s.cellInput}
                                        value={set.reps.toString()}
                                        onChangeText={(val) => updateSet(ex.instanceId || ex.id, set.id, { reps: val })}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        placeholderTextColor={TEXT_TERTIARY}
                                    />
                                </View>
                                <Pressable 
                                    style={[s.checkBtn, set.status === 'completed' && s.checkBtnDone]}
                                    onPress={() => toggleSetStatus(ex.instanceId || ex.id, set.id)}
                                >
                                    <Check size={18} color={set.status === 'completed' ? '#fff' : TEXT_TERTIARY} />
                                </Pressable>
                            </View>
                        ))}

                        <Pressable style={s.addSetBtn} onPress={() => addSet(ex.instanceId || ex.id)}>
                            <Plus size={16} color={TEXT_SECONDARY} />
                            <Text style={s.addSetText}>Add Set</Text>
                        </Pressable>
                    </Card>
                ))}

                <Pressable style={s.addExBtn} onPress={() => router.push('/exercises')}>
                    <Plus size={20} color={ACCENT} />
                    <Text style={s.addExText}>Add Exercise</Text>
                </Pressable>
            </ScrollView>

            <View style={[s.bottomActions, { paddingBottom: insets.bottom + TAB_BAR_CLEARANCE + 10 }]}>
                <Pressable style={s.finishBtnLarge} onPress={finishWorkout}>
                    <Text style={s.finishBtnText}>Finish Workout</Text>
                </Pressable>
            </View>

            <Toast ref={toastRef} />
        </View>
    )
}

const s = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    workoutTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
    workoutTime: { fontSize: 13, color: ACCENT, fontWeight: '600', marginTop: 2 },
    finishBtnSmall: { backgroundColor: 'rgba(59,130,246,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    finishTextSmall: { color: ACCENT, fontSize: 13, fontWeight: '700' },

    container: { padding: 20, gap: 24 },
    timerSection: { alignItems: 'center', marginVertical: 10 },
    timerOuter: { width: 140, height: 140, borderRadius: 70, borderWidth: 6, borderColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
    timerInner: { alignItems: 'center' },
    timerValue: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -1 },
    timerLabel: { fontSize: 10, color: TEXT_TERTIARY, fontWeight: '600', marginTop: 2 },
    timerProgress: { position: 'absolute', top: -6, left: -6, right: -6, bottom: -6, borderRadius: 70, borderWidth: 6, borderColor: ACCENT, borderBottomColor: 'transparent', borderRightColor: 'transparent', transform: [{ rotate: '45deg' }] },

    exCard: { padding: 16, gap: 12 },
    exHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    exName: { fontSize: 17, fontWeight: '700', color: ACCENT_LIGHT },
    
    tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
    tableHead: { fontSize: 11, fontWeight: '700', color: TEXT_TERTIARY, letterSpacing: 0.5 },
    activeRow: { backgroundColor: 'rgba(59,130,246,0.08)' },
    cellText: { fontSize: 16, color: '#fff', fontWeight: '600' },
    cellInput: { flex: 1, fontSize: 16, color: '#fff', fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 6, textAlign: 'center' },
    checkBtn: { width: 44, height: 36, borderRadius: 8, backgroundColor: SURFACE2, alignItems: 'center', justifyContent: 'center' },
    checkBtnDone: { backgroundColor: '#22c55e' },

    addSetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, marginTop: 4, borderRadius: 8, borderStyle: 'dashed', borderWidth: 1, borderColor: BORDER },
    addSetText: { fontSize: 14, color: TEXT_SECONDARY, fontWeight: '600' },

    addExBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, backgroundColor: SURFACE, borderRadius: 16 },
    addExText: { fontSize: 16, color: ACCENT, fontWeight: '700' },

    bottomActions: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, backgroundColor: 'rgba(10,10,10,0.9)' },
    finishBtnLarge: { backgroundColor: '#3B82F6', borderRadius: 20, paddingVertical: 18, alignItems: 'center' },
    finishBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },

    prOverlay: { position: 'absolute', top: height / 2 - 100, left: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.9)', borderRadius: 20, padding: 30, alignItems: 'center', zIndex: 1000, borderWidth: 2, borderColor: '#f59e0b', shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20 },
    prTitle: { color: '#f59e0b', fontSize: 20, fontWeight: '900', marginTop: 16, textAlign: 'center' },
    prSubtitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 4, textAlign: 'center' },
})

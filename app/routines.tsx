import { useState, useCallback } from 'react'
import { View, ScrollView, StyleSheet, Pressable, Alert } from 'react-native'
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
import { ChevronLeft, Plus, Play, Trash2, Dumbbell, Calendar } from 'lucide-react-native'

export default function RoutinesScreen() {
    const insets = useSafeAreaInsets()
    const [routines, setRoutines] = useState<any[]>([])
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const toastRef = useRef<ToastHandle>(null)

    const loadRoutines = useCallback(async () => {
        try {
            const data = await AsyncStorage.getItem('routines')
            if (data) {
                setRoutines(JSON.parse(data))
            }
        } catch (e) {
            console.error(e)
        }
    }, [])

    useFocusEffect(
        useCallback(() => {
            loadRoutines()
        }, [loadRoutines])
    )

    const deleteRoutine = (id: string, name: string) => {
        Alert.alert(
            'Delete Routine',
            `Are you sure you want to delete "${name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const updated = routines.filter(r => r.id !== id)
                            await AsyncStorage.setItem('routines', JSON.stringify(updated))
                            setRoutines(updated)
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                            toastRef.current?.show('Routine deleted')
                        } catch (e) {
                            console.error(e)
                        }
                    }
                }
            ]
        )
    }

    const startRoutine = async (routine: any) => {
        try {
            // Load exercises into current workout
            await AsyncStorage.setItem('current_workout_exercises', JSON.stringify(routine.exercises))
            
            // Update last used date
            const updated = routines.map(r => 
                r.id === routine.id ? { ...r, lastUsed: new Date().toISOString() } : r
            )
            await AsyncStorage.setItem('routines', JSON.stringify(updated))
            
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            router.push({
                pathname: '/(tabs)/workout',
                params: { routineName: routine.name }
            })
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            {/* Header */}
            <View style={[s.header, { paddingTop: insets.top + 10 }]}>
                <Pressable onPress={() => router.back()} style={s.backBtn}>
                    <ChevronLeft size={24} color="#fff" />
                </Pressable>
                <Text style={s.title}>My Routines</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView 
                style={{ flex: 1 }}
                contentContainerStyle={[s.container, { paddingBottom: insets.bottom + 40 }]}
            >
                <Pressable 
                    style={s.createBtn}
                    onPress={() => router.push('/create-routine')}
                >
                    <Plus size={20} color="#fff" />
                    <Text style={s.createBtnText}>Create New Routine</Text>
                </Pressable>

                {routines.length > 0 ? (
                    routines.map((routine) => (
                        <Card key={routine.id} style={s.routineCard}>
                            <Pressable 
                                style={s.routineContent}
                                onPress={() => setExpandedId(expandedId === routine.id ? null : routine.id)}
                                onLongPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
                                    deleteRoutine(routine.id, routine.name)
                                }}
                            >
                                <View style={s.routineInfo}>
                                    <Text style={s.routineName}>{routine.name}</Text>
                                    <View style={s.metaRow}>
                                        <View style={s.metaItem}>
                                            <Dumbbell size={14} color={TEXT_TERTIARY} />
                                            <Text style={s.metaText}>{routine.exercises.length} Exercises</Text>
                                        </View>
                                        {routine.lastUsed && (
                                            <View style={s.metaItem}>
                                                <Calendar size={14} color={TEXT_TERTIARY} />
                                                <Text style={s.metaText}>
                                                    Last: {new Date(routine.lastUsed).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                                <View style={[s.playBtn, expandedId === routine.id && { backgroundColor: ACCENT }]}>
                                    <Play size={18} color="#fff" fill="#fff" />
                                </View>
                            </Pressable>

                            {expandedId === routine.id && (
                                <View style={s.expandedContent}>
                                    <View style={s.exerciseList}>
                                        {routine.exercises.map((ex: any, idx: number) => (
                                            <View key={ex.instanceId || idx} style={s.exerciseItem}>
                                                <Text style={s.exerciseItemText}>{ex.name}</Text>
                                                <Text style={s.exerciseItemMuscle}>{ex.muscle}</Text>
                                            </View>
                                        ))}
                                    </View>
                                    <Pressable 
                                        style={s.startBtn}
                                        onPress={() => startRoutine(routine)}
                                    >
                                        <Text style={s.startBtnText}>Start This Routine</Text>
                                    </Pressable>
                                </View>
                            )}
                        </Card>
                    ))
                ) : (
                    <View style={s.emptyState}>
                        <Dumbbell size={48} color={SURFACE2} />
                        <Text style={s.emptyTitle}>No routines yet</Text>
                        <Text style={s.emptySub}>Create a routine to quickly start your favorite workouts</Text>
                    </View>
                )}
            </ScrollView>

            <Toast ref={toastRef} />
        </View>
    )
}

const s = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 20, fontWeight: '800', color: '#fff' },
    
    container: { padding: 20, gap: 16 },
    createBtn: { backgroundColor: ACCENT, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 },
    createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    
    routineCard: { padding: 0, overflow: 'hidden' },
    routineContent: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    routineInfo: { flex: 1, gap: 8 },
    routineName: { fontSize: 18, fontWeight: '700', color: '#fff' },
    metaRow: { flexDirection: 'row', gap: 16 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 13, color: TEXT_TERTIARY, fontWeight: '500' },
    
    playBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(59, 130, 246, 0.15)', alignItems: 'center', justifyContent: 'center' },
    
    expandedContent: { padding: 16, paddingTop: 0, gap: 16 },
    exerciseList: { gap: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: BORDER },
    exerciseItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    exerciseItemText: { fontSize: 14, color: '#fff', fontWeight: '500' },
    exerciseItemMuscle: { fontSize: 11, color: TEXT_TERTIARY, fontWeight: '700', textTransform: 'uppercase' },
    startBtn: { backgroundColor: ACCENT, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    startBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: TEXT_SECONDARY },
    emptySub: { fontSize: 14, color: TEXT_TERTIARY, textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },
})

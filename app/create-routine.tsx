import { useState, useCallback, useEffect } from 'react'
import { View, ScrollView, StyleSheet, Pressable, TextInput, ActivityIndicator } from 'react-native'
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
import { ChevronLeft, Plus, X, Save, Dumbbell } from 'lucide-react-native'

export default function CreateRoutineScreen() {
    const insets = useSafeAreaInsets()
    const [routineName, setRoutineName] = useState('')
    const [exercises, setExercises] = useState<any[]>([])
    const [saving, setSaving] = useState(false)
    const toastRef = useRef<ToastHandle>(null)

    const loadTempExercises = useCallback(async () => {
        try {
            const data = await AsyncStorage.getItem('temp_routine_exercises')
            if (data) {
                setExercises(JSON.parse(data))
            }
        } catch (e) {
            console.error(e)
        }
    }, [])

    useFocusEffect(
        useCallback(() => {
            loadTempExercises()
        }, [loadTempExercises])
    )

    // Clear temp exercises when screen is unmounted (if not saved)
    // Actually, we might want to keep them if they navigate back and forth
    // But we should definitely clear them when we START a new routine creation
    useEffect(() => {
        return () => {
            // Optional: clear on cleanup
        }
    }, [])

    const removeExercise = async (instanceId: number) => {
        const updated = exercises.filter(ex => ex.instanceId !== instanceId)
        setExercises(updated)
        await AsyncStorage.setItem('temp_routine_exercises', JSON.stringify(updated))
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }

    const saveRoutine = async () => {
        if (!routineName.trim()) {
            toastRef.current?.show('Please enter a routine name')
            return
        }
        if (exercises.length === 0) {
            toastRef.current?.show('Add at least one exercise')
            return
        }

        setSaving(true)
        try {
            const routine = {
                id: Date.now().toString(),
                name: routineName.trim(),
                exercises: exercises,
                createdAt: new Date().toISOString(),
                lastUsed: null
            }

            const existing = await AsyncStorage.getItem('routines')
            const list = existing ? JSON.parse(existing) : []
            list.unshift(routine)
            
            await AsyncStorage.setItem('routines', JSON.stringify(list))
            await AsyncStorage.removeItem('temp_routine_exercises')
            
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            toastRef.current?.show('Routine saved!')
            setTimeout(() => router.replace('/routines'), 1000)
        } catch (e) {
            console.error(e)
            toastRef.current?.show('Error saving routine')
        } finally {
            setSaving(false)
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            {/* Header */}
            <View style={[s.header, { paddingTop: insets.top + 10 }]}>
                <Pressable onPress={() => router.back()} style={s.backBtn}>
                    <ChevronLeft size={24} color="#fff" />
                </Pressable>
                <Text style={s.title}>Create Routine</Text>
                <Pressable onPress={saveRoutine} disabled={saving} style={s.saveBtn}>
                    {saving ? <ActivityIndicator size="small" color={ACCENT} /> : <Text style={s.saveBtnText}>Save</Text>}
                </Pressable>
            </View>

            <ScrollView 
                style={{ flex: 1 }}
                contentContainerStyle={[s.container, { paddingBottom: insets.bottom + 40 }]}
            >
                <View style={s.inputSection}>
                    <Text style={s.label}>Routine Name</Text>
                    <TextInput 
                        style={s.nameInput}
                        value={routineName}
                        onChangeText={setRoutineName}
                        placeholder="e.g. Upper Body Power"
                        placeholderTextColor={TEXT_TERTIARY}
                        autoFocus
                    />
                </View>

                <View style={s.exerciseSection}>
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionTitle}>Exercises ({exercises.length})</Text>
                        <Pressable 
                            style={s.addExBtn}
                            onPress={() => router.push({ pathname: '/exercises', params: { mode: 'routine' } })}
                        >
                            <Plus size={18} color={ACCENT} />
                            <Text style={s.addExText}>Add</Text>
                        </Pressable>
                    </View>

                    {exercises.length > 0 ? (
                        <View style={s.exerciseList}>
                            {exercises.map((ex) => (
                                <Card key={ex.instanceId} style={s.exCard}>
                                    <View style={s.exInfo}>
                                        <Text style={s.exName}>{ex.name}</Text>
                                        <Text style={s.exMuscle}>{ex.muscle}</Text>
                                    </View>
                                    <Pressable onPress={() => removeExercise(ex.instanceId)}>
                                        <X size={20} color={TEXT_TERTIARY} />
                                    </Pressable>
                                </Card>
                            ))}
                        </View>
                    ) : (
                        <View style={s.emptyState}>
                            <Dumbbell size={40} color={SURFACE2} />
                            <Text style={s.emptyText}>No exercises added yet</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <Toast ref={toastRef} />
        </View>
    )
}

const s = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 20, fontWeight: '800', color: '#fff' },
    saveBtn: { paddingHorizontal: 12, paddingVertical: 6 },
    saveBtnText: { color: ACCENT, fontSize: 16, fontWeight: '700' },
    
    container: { padding: 20, gap: 24 },
    inputSection: { gap: 8 },
    label: { fontSize: 13, fontWeight: '700', color: TEXT_TERTIARY, textTransform: 'uppercase', letterSpacing: 1 },
    nameInput: { fontSize: 22, fontWeight: '700', color: '#fff', borderBottomWidth: 2, borderBottomColor: BORDER, paddingVertical: 8 },
    
    exerciseSection: { gap: 16 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
    addExBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(59, 130, 246, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    addExText: { color: ACCENT, fontSize: 14, fontWeight: '700' },
    
    exerciseList: { gap: 10 },
    exCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    exInfo: { gap: 4 },
    exName: { fontSize: 16, fontWeight: '600', color: '#fff' },
    exMuscle: { fontSize: 12, color: TEXT_TERTIARY, fontWeight: '600', textTransform: 'uppercase' },
    
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12, backgroundColor: SURFACE, borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: BORDER },
    emptyText: { fontSize: 14, color: TEXT_TERTIARY, fontWeight: '500' },
})

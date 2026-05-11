import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, Pressable, TouchableOpacity, Modal } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ChevronLeft, Calendar, Info, Check, X } from 'lucide-react-native'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { BG, SURFACE, SURFACE2, ACCENT, TEXT_SECONDARY, TEXT_TERTIARY, BORDER } from '@/lib/theme'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function WeeklyPlanScreen() {
    const insets = useSafeAreaInsets()
    const [plan, setPlan] = useState<Record<string, any>>({})
    const [routines, setRoutines] = useState<any[]>([])
    const [selectedDay, setSelectedDay] = useState<string | null>(null)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        const p = await AsyncStorage.getItem('weekly_plan')
        const r = await AsyncStorage.getItem('routines')
        if (p) setPlan(JSON.parse(p))
        if (r) setRoutines(JSON.parse(r))
    }

    const setDayRoutine = async (day: string, routine: any) => {
        const newPlan = { ...plan, [day]: routine }
        setPlan(newPlan)
        await AsyncStorage.setItem('weekly_plan', JSON.stringify(newPlan))
        setSelectedDay(null)
    }

    return (
        <View style={[s.container, { paddingTop: insets.top }]}>
            <View style={s.header}>
                <Pressable onPress={() => router.back()} style={s.backBtn}>
                    <ChevronLeft size={24} color="#fff" />
                </Pressable>
                <Text style={s.title}>Weekly Planner</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scrollContent}>
                <Card style={s.infoCard}>
                    <Info size={18} color={ACCENT} />
                    <Text style={s.infoText}>Assign your routines to specific days of the week to stay on track.</Text>
                </Card>

                {DAYS.map((day) => {
                    const assigned = plan[day]
                    return (
                        <Pressable key={day} onPress={() => setSelectedDay(day)}>
                            <Card style={s.dayCard}>
                                <View style={s.dayInfo}>
                                    <Text style={s.dayName}>{day}</Text>
                                    <Text style={[s.routineName, !assigned && { color: TEXT_TERTIARY }]}>
                                        {assigned ? assigned.name : 'Rest Day'}
                                    </Text>
                                </View>
                                <View style={[s.statusIndicator, assigned && { backgroundColor: ACCENT }]}>
                                    {assigned ? <Check size={14} color="#fff" /> : <X size={14} color={TEXT_TERTIARY} />}
                                </View>
                            </Card>
                        </Pressable>
                    )
                })}
            </ScrollView>

            <Modal visible={!!selectedDay} transparent animationType="fade">
                <View style={s.modalOverlay}>
                    <Card style={s.modalContent}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>Plan for {selectedDay}</Text>
                            <Pressable onPress={() => setSelectedDay(null)}>
                                <X size={20} color={TEXT_TERTIARY} />
                            </Pressable>
                        </View>
                        
                        <ScrollView style={s.routineList}>
                            <Pressable 
                                style={s.routineItem} 
                                onPress={() => selectedDay && setDayRoutine(selectedDay, null)}
                            >
                                <Text style={s.routineItemText}>Rest Day</Text>
                                {!plan[selectedDay || ''] && <Check size={18} color={ACCENT} />}
                            </Pressable>
                            
                            {routines.map((r) => (
                                <Pressable 
                                    key={r.id} 
                                    style={s.routineItem} 
                                    onPress={() => selectedDay && setDayRoutine(selectedDay, r)}
                                >
                                    <View>
                                        <Text style={s.routineItemText}>{r.name}</Text>
                                        <Text style={s.routineItemSub}>{r.exercises.length} exercises</Text>
                                    </View>
                                    {plan[selectedDay || '']?.id === r.id && <Check size={18} color={ACCENT} />}
                                </Pressable>
                            ))}
                        </ScrollView>
                    </Card>
                </View>
            </Modal>
        </View>
    )
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: SURFACE2, borderRadius: 12 },
    title: { fontSize: 18, fontWeight: '800', color: '#fff' },
    scrollContent: { padding: 20, gap: 12 },
    infoCard: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 16, backgroundColor: 'rgba(59, 130, 246, 0.05)', borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' },
    infoText: { flex: 1, fontSize: 13, color: TEXT_SECONDARY, lineHeight: 18 },
    dayCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    dayInfo: { gap: 4 },
    dayName: { fontSize: 13, fontWeight: '700', color: TEXT_TERTIARY, textTransform: 'uppercase', letterSpacing: 0.5 },
    routineName: { fontSize: 17, fontWeight: '700', color: '#fff' },
    statusIndicator: { width: 28, height: 28, borderRadius: 14, backgroundColor: SURFACE2, alignItems: 'center', justifyContent: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
    modalContent: { maxHeight: '70%', padding: 0, overflow: 'hidden', backgroundColor: SURFACE },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: BORDER },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
    routineList: { padding: 8 },
    routineItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12 },
    routineItemText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    routineItemSub: { fontSize: 12, color: TEXT_TERTIARY, marginTop: 2 },
})

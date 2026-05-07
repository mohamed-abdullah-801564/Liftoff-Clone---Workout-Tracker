import React from 'react'
import { View, StyleSheet, Modal, Pressable, ScrollView, Dimensions } from 'react-native'
import { X, Calendar, Dumbbell, Timer, BarChart2 } from 'lucide-react-native'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { BG, SURFACE, SURFACE2, ACCENT, TEXT_SECONDARY, TEXT_TERTIARY, BORDER, ACCENT_LIGHT } from '@/lib/theme'

const { height } = Dimensions.get('window')

interface WorkoutDetailModalProps {
    visible: boolean
    onClose: () => void
    workout: any
}

export function WorkoutDetailModal({ visible, onClose, workout }: WorkoutDetailModalProps) {
    if (!workout) return null

    const date = new Date(workout.date).toLocaleDateString([], { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    })

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={s.overlay}>
                <Pressable style={s.backdrop} onPress={onClose} />
                <View style={s.sheet}>
                    <View style={s.header}>
                        <View>
                            <Text style={s.title}>{workout.name}</Text>
                            <View style={s.dateRow}>
                                <Calendar size={14} color={TEXT_TERTIARY} />
                                <Text style={s.dateText}>{date}</Text>
                            </View>
                        </View>
                        <Pressable onPress={onClose} style={s.closeBtn}>
                            <X size={20} color={TEXT_SECONDARY} />
                        </Pressable>
                    </View>

                    <View style={s.statsRow}>
                        <View style={s.statItem}>
                            <BarChart2 size={18} color={ACCENT} />
                            <Text style={s.statValue}>{workout.volume.toLocaleString()}</Text>
                            <Text style={s.statLabel}>Volume (kg)</Text>
                        </View>
                        <View style={s.statItem}>
                            <Dumbbell size={18} color={ACCENT} />
                            <Text style={s.statValue}>{workout.exercises.length}</Text>
                            <Text style={s.statLabel}>Exercises</Text>
                        </View>
                        <View style={s.statItem}>
                            <Timer size={18} color={ACCENT} />
                            <Text style={s.statValue}>{workout.duration || '00:00:00'}</Text>
                            <Text style={s.statLabel}>Duration</Text>
                        </View>
                    </View>

                    <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
                        {workout.exercises.map((ex: any, idx: number) => (
                            <View key={idx} style={s.exItem}>
                                <Text style={s.exName}>{ex.name}</Text>
                                <View style={s.setsList}>
                                    {ex.sets.map((set: any, sIdx: number) => (
                                        <View key={sIdx} style={s.setRow}>
                                            <Text style={s.setText}>Set {sIdx + 1}</Text>
                                            <View style={s.setDetails}>
                                                <Text style={s.setVal}>{set.weight} kg</Text>
                                                <Text style={s.setDot}>•</Text>
                                                <Text style={s.setVal}>{set.reps} reps</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    )
}

const s = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)' },
    sheet: { 
        backgroundColor: SURFACE, 
        borderTopLeftRadius: 32, 
        borderTopRightRadius: 32, 
        padding: 24, 
        maxHeight: height * 0.85,
        borderWidth: 1,
        borderColor: BORDER,
        borderBottomWidth: 0
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    title: { fontSize: 24, fontWeight: '800', color: '#fff' },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    dateText: { fontSize: 13, color: TEXT_TERTIARY, fontWeight: '500' },
    closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: SURFACE2, alignItems: 'center', justifyContent: 'center' },
    
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    statItem: { flex: 1, backgroundColor: SURFACE2, padding: 16, borderRadius: 16, alignItems: 'center', gap: 4 },
    statValue: { fontSize: 16, fontWeight: '800', color: '#fff' },
    statLabel: { fontSize: 10, color: TEXT_TERTIARY, fontWeight: '600', textTransform: 'uppercase' },

    scroll: { flex: 1 },
    exItem: { marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: BORDER },
    exName: { fontSize: 17, fontWeight: '700', color: ACCENT_LIGHT, marginBottom: 12 },
    setsList: { gap: 8 },
    setRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    setText: { fontSize: 13, color: TEXT_SECONDARY, fontWeight: '500' },
    setDetails: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    setVal: { fontSize: 14, color: '#fff', fontWeight: '700' },
    setDot: { color: TEXT_TERTIARY, fontSize: 14 }
})

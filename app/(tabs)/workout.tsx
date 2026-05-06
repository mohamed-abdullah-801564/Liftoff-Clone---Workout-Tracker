import { useState } from 'react'
import { View, ScrollView, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
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
import { Check, Plus, X, Timer, ChevronLeft } from 'lucide-react-native'

export default function WorkoutScreen() {
    const insets = useSafeAreaInsets()
    const [timer, setTimer] = useState('01:24')

    const exercises = [
        {
            id: '1',
            name: 'Bench Press (Barbell)',
            sets: [
                { id: '1-1', weight: 80, reps: 8, status: 'completed' },
                { id: '1-2', weight: 80, reps: 8, status: 'completed' },
                { id: '1-3', weight: 85, reps: 6, status: 'active' },
            ]
        }
    ]

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            {/* Header */}
            <View style={[s.header, { paddingTop: insets.top + 10 }]}>
                <Pressable onPress={() => router.back()} style={s.backBtn}>
                    <ChevronLeft size={24} color="#fff" />
                </Pressable>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={s.workoutTitle}>Upper Body A</Text>
                    <Text style={s.workoutTime}>00:42:15</Text>
                </View>
                <Pressable style={s.finishBtnSmall}>
                    <Text style={s.finishTextSmall}>Finish</Text>
                </Pressable>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={[s.container, { paddingBottom: insets.bottom + 100 }]}
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
                        {/* Circular Progress Placeholder */}
                        <View style={s.timerProgress} />
                    </View>
                </View>

                {/* Exercises */}
                {exercises.map((ex) => (
                    <Card key={ex.id} style={s.exCard}>
                        <View style={s.exHeader}>
                            <Pressable onPress={() => router.push(`/exercise/${ex.id}`)}>
                                <Text style={s.exName}>{ex.name}</Text>
                            </Pressable>
                            <X size={20} color={TEXT_TERTIARY} />
                        </View>

                        {/* Table Header */}
                        <View style={s.tableRow}>
                            <Text style={[s.tableHead, { flex: 1 }]}>SET</Text>
                            <Text style={[s.tableHead, { flex: 2 }]}>KG</Text>
                            <Text style={[s.tableHead, { flex: 2 }]}>REPS</Text>
                            <View style={{ width: 44 }} />
                        </View>

                        {/* Table Body */}
                        {ex.sets.map((set, i) => (
                            <View key={set.id} style={[s.tableRow, set.status === 'active' && s.activeRow]}>
                                <View style={{ flex: 1 }}><Text style={s.cellText}>{i + 1}</Text></View>
                                <View style={{ flex: 2 }}><Text style={s.cellText}>{set.weight}</Text></View>
                                <View style={{ flex: 2 }}><Text style={s.cellText}>{set.reps}</Text></View>
                                <Pressable style={[s.checkBtn, set.status === 'completed' && s.checkBtnDone]}>
                                    <Check size={18} color={set.status === 'completed' ? '#fff' : TEXT_TERTIARY} />
                                </Pressable>
                            </View>
                        ))}

                        <Pressable style={s.addSetBtn}>
                            <Plus size={16} color={TEXT_SECONDARY} />
                            <Text style={s.addSetText}>Add Set</Text>
                        </Pressable>
                    </Card>
                ))}

                <Pressable style={s.addExBtn}>
                    <Plus size={20} color={ACCENT} />
                    <Text style={s.addExText}>Add Exercise</Text>
                </Pressable>
            </ScrollView>

            {/* Bottom Actions */}
            <View style={[s.bottomActions, { paddingBottom: insets.bottom + TAB_BAR_CLEARANCE + 10 }]}>
                <Pressable style={s.finishBtnLarge}>
                    <Text style={s.finishBtnText}>Finish Workout</Text>
                    <View style={s.finishBtnGlow} />
                </Pressable>
            </View>
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
    timerOuter: { width: 180, height: 180, borderRadius: 90, borderWidth: 8, borderColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
    timerInner: { alignItems: 'center' },
    timerValue: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: -1 },
    timerLabel: { fontSize: 12, color: TEXT_TERTIARY, fontWeight: '600', marginTop: 2 },
    timerProgress: { position: 'absolute', top: -8, left: -8, right: -8, bottom: -8, borderRadius: 90, borderWidth: 8, borderColor: ACCENT, borderBottomColor: 'transparent', borderRightColor: 'transparent', transform: [{ rotate: '45deg' }] },

    exCard: { padding: 16, gap: 12 },
    exHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    exName: { fontSize: 17, fontWeight: '700', color: ACCENT_LIGHT },
    
    tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderRadius: 8 },
    tableHead: { fontSize: 11, fontWeight: '700', color: TEXT_TERTIARY, letterSpacing: 0.5 },
    activeRow: { backgroundColor: 'rgba(59,130,246,0.08)' },
    cellText: { fontSize: 16, color: '#fff', fontWeight: '600' },
    checkBtn: { width: 44, height: 32, borderRadius: 8, backgroundColor: SURFACE2, alignItems: 'center', justifyContent: 'center' },
    checkBtnDone: { backgroundColor: '#22c55e' },

    addSetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, marginTop: 4, borderRadius: 8, borderStyle: 'dashed', borderWidth: 1, borderColor: BORDER },
    addSetText: { fontSize: 14, color: TEXT_SECONDARY, fontWeight: '600' },

    addExBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, backgroundColor: SURFACE, borderRadius: 16 },
    addExText: { fontSize: 16, color: ACCENT, fontWeight: '700' },

    bottomActions: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, backgroundColor: 'rgba(10,10,10,0.8)' },
    finishBtnLarge: { backgroundColor: ACCENT, borderRadius: 20, paddingVertical: 18, alignItems: 'center', overflow: 'hidden' },
    finishBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
    finishBtnGlow: { position: 'absolute', bottom: -40, width: '100%', height: 60, backgroundColor: '#fff', opacity: 0.2, filter: 'blur(30px)' },
})

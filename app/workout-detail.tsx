import { View, ScrollView, StyleSheet } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, Calendar, Timer, BarChart2, Check } from 'lucide-react-native'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { Pressable } from 'react-native'
import {
    BG, SURFACE, SURFACE2, ACCENT, ACCENT_LIGHT,
    TEXT_SECONDARY, TEXT_TERTIARY, BORDER
} from '@/lib/theme'
import { formatVolume } from '@/lib/utils'

export default function WorkoutDetailScreen() {
    const insets = useSafeAreaInsets()
    const { workout: workoutParam } = useLocalSearchParams()

    let workout: any = null
    try {
        workout = typeof workoutParam === 'string' ? JSON.parse(workoutParam) : null
    } catch {
        workout = null
    }

    if (!workout) {
        return (
            <View style={[s.container, { paddingTop: insets.top }]}>
                <View style={s.header}>
                    <Pressable onPress={() => router.back()} style={s.backBtn}>
                        <ChevronLeft size={24} color="#fff" />
                    </Pressable>
                    <Text style={s.title}>Workout Detail</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: TEXT_TERTIARY, fontSize: 16 }}>No workout data found.</Text>
                </View>
            </View>
        )
    }

    return (
        <View style={[s.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={s.header}>
                <Pressable onPress={() => router.back()} style={s.backBtn}>
                    <ChevronLeft size={24} color="#fff" />
                </Pressable>
                <Text style={s.title} numberOfLines={1}>{workout.name}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Meta Card */}
                <Card style={s.metaCard}>
                    <View style={s.metaRow}>
                        <View style={s.metaItem}>
                            <Calendar size={16} color={ACCENT} />
                            <Text style={s.metaLabel}>Date</Text>
                            <Text style={s.metaValue}>
                                {new Date(workout.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </Text>
                        </View>
                        <View style={s.metaDivider} />
                        <View style={s.metaItem}>
                            <Timer size={16} color={ACCENT} />
                            <Text style={s.metaLabel}>Duration</Text>
                            <Text style={s.metaValue}>{workout.duration || '—'}</Text>
                        </View>
                        <View style={s.metaDivider} />
                        <View style={s.metaItem}>
                            <BarChart2 size={16} color={ACCENT} />
                            <Text style={s.metaLabel}>Volume</Text>
                            <Text style={s.metaValue}>{formatVolume(workout.volume || 0)}</Text>
                        </View>
                    </View>
                </Card>

                {/* Exercises */}
                {(workout.exercises || []).map((ex: any, exIdx: number) => (
                    <Card key={ex.instanceId || ex.id || exIdx} style={s.exCard}>
                        <Text style={s.exName}>{ex.name}</Text>
                        {ex.muscle ? <Text style={s.exMuscle}>{ex.muscle}</Text> : null}

                        {/* Table header */}
                        <View style={s.tableRow}>
                            <Text style={[s.tableHead, { flex: 1 }]}>SET</Text>
                            <Text style={[s.tableHead, { flex: 2 }]}>WEIGHT (KG)</Text>
                            <Text style={[s.tableHead, { flex: 2 }]}>REPS</Text>
                            <Text style={[s.tableHead, { width: 44, textAlign: 'center' }]}>✓</Text>
                        </View>

                        {(ex.sets || []).map((set: any, i: number) => (
                            <View
                                key={set.id || i}
                                style={[s.tableRow, set.status === 'completed' && s.completedRow]}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={s.cellText}>{i + 1}</Text>
                                </View>
                                <View style={{ flex: 2 }}>
                                    <Text style={s.cellText}>{set.weight || '—'}</Text>
                                </View>
                                <View style={{ flex: 2 }}>
                                    <Text style={s.cellText}>{set.reps || '—'}</Text>
                                </View>
                                <View style={{ width: 44, alignItems: 'center' }}>
                                    {set.status === 'completed' ? (
                                        <View style={s.checkDone}>
                                            <Check size={14} color="#fff" />
                                        </View>
                                    ) : (
                                        <View style={s.checkEmpty} />
                                    )}
                                </View>
                            </View>
                        ))}
                    </Card>
                ))}
            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: SURFACE2, borderRadius: 12 },
    title: { fontSize: 18, fontWeight: '800', color: '#fff', flex: 1, textAlign: 'center' },

    scrollContent: { padding: 20, gap: 16 },

    metaCard: { padding: 20 },
    metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    metaItem: { flex: 1, alignItems: 'center', gap: 6 },
    metaDivider: { width: 1, height: 48, backgroundColor: BORDER },
    metaLabel: { fontSize: 11, color: TEXT_TERTIARY, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    metaValue: { fontSize: 15, color: '#fff', fontWeight: '700', textAlign: 'center' },

    exCard: { padding: 16, gap: 10 },
    exName: { fontSize: 17, fontWeight: '700', color: ACCENT_LIGHT },
    exMuscle: { fontSize: 12, color: TEXT_TERTIARY, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: -4 },

    tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
    tableHead: { fontSize: 11, fontWeight: '700', color: TEXT_TERTIARY, letterSpacing: 0.5 },
    completedRow: { backgroundColor: 'rgba(34,197,94,0.06)', borderRadius: 8 },
    cellText: { fontSize: 15, color: '#fff', fontWeight: '600' },
    checkDone: { width: 26, height: 26, borderRadius: 6, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' },
    checkEmpty: { width: 26, height: 26, borderRadius: 6, backgroundColor: SURFACE2 },
})

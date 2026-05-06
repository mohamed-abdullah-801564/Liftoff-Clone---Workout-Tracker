import { View, ScrollView, StyleSheet, Pressable, Dimensions } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
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
    ACCENT_LIGHT,
    BORDER,
} from '@/lib/theme'
import { ChevronLeft, Info, Trophy, Target, History, Settings } from 'lucide-react-native'
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg'
import { ExpoLinearGradient } from 'expo-linear-gradient'

const { width } = Dimensions.get('window')

export default function ExerciseDetailScreen() {
    const { id } = useLocalSearchParams()
    const insets = useSafeAreaInsets()

    // Mock data for Bench Press progress
    const chartData = [60, 65, 70, 68, 75, 80, 85, 90, 88, 95, 100, 105]
    const maxWeight = '120 kg'
    const maxReps = '12'

    // Simple line chart points calculation
    const chartWidth = width - 72
    const chartHeight = 120
    const points = chartData.map((val, i) => ({
        x: (i / (chartData.length - 1)) * chartWidth,
        y: chartHeight - ((val - 50) / (130 - 50)) * chartHeight
    }))

    const d = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            {/* Header */}
            <View style={[s.header, { paddingTop: insets.top + 10 }]}>
                <Pressable onPress={() => router.back()} style={s.iconBtn}>
                    <ChevronLeft size={24} color="#fff" />
                </Pressable>
                <Text style={s.title}>Bench Press</Text>
                <Pressable style={s.iconBtn}>
                    <Settings size={20} color={TEXT_SECONDARY} />
                </Pressable>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={[s.container, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Performance Chart */}
                <Card style={s.chartCard}>
                    <View style={s.chartHeader}>
                        <Text style={s.cardTitle}>Performance</Text>
                        <Text style={s.chartSub}>Last 6 Months</Text>
                    </View>
                    
                    <View style={s.chartContainer}>
                        <Svg width={chartWidth} height={chartHeight}>
                            <Defs>
                                <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                    <Stop offset="0" stopColor={ACCENT} stopOpacity="0.3" />
                                    <Stop offset="1" stopColor={ACCENT} stopOpacity="0" />
                                </LinearGradient>
                            </Defs>
                            {/* Area fill */}
                            <Path
                                d={`${d} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`}
                                fill="url(#grad)"
                            />
                            {/* Line */}
                            <Path
                                d={d}
                                fill="none"
                                stroke={ACCENT}
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </Svg>
                        {/* Glowing shadow effect */}
                        <View style={s.chartGlow} />
                    </View>

                    <View style={s.chartXLabels}>
                        {['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'].map(label => (
                            <Text key={label} style={s.xLabel}>{label}</Text>
                        ))}
                    </View>
                </Card>

                {/* Personal Records Row */}
                <View style={s.statsRow}>
                    <Card style={s.statCard}>
                        <View style={s.statIcon}>
                            <Trophy size={18} color={ACCENT} />
                        </View>
                        <Text style={s.statValue}>{maxWeight}</Text>
                        <Text style={s.statLabel}>Max Weight</Text>
                    </Card>
                    <Card style={s.statCard}>
                        <View style={[s.statIcon, { backgroundColor: 'rgba(168, 85, 247, 0.12)' }]}>
                            <Target size={18} color="#A855F7" />
                        </View>
                        <Text style={s.statValue}>{maxReps}</Text>
                        <Text style={s.statLabel}>Max Reps</Text>
                    </Card>
                </View>

                {/* About Section */}
                <Card style={s.aboutCard}>
                    <View style={s.sectionHeader}>
                        <Info size={18} color={ACCENT} />
                        <Text style={s.sectionTitle}>About this Exercise</Text>
                    </View>
                    <Text style={s.aboutText}>
                        The Bench Press is a fundamental compound movement that primarily targets the Pectoralis Major, while also engaging the Anterior Deltoids and Triceps Brachii. It is the cornerstone of upper body strength development.
                    </Text>
                    <View style={s.muscleTags}>
                        {['Chest', 'Triceps', 'Shoulders'].map(tag => (
                            <View key={tag} style={s.tag}>
                                <Text style={s.tagText}>{tag}</Text>
                            </View>
                        ))}
                    </View>
                </Card>

                {/* Recent History */}
                <View style={s.historyHeader}>
                    <History size={18} color={TEXT_SECONDARY} />
                    <Text style={s.sectionTitle}>Recent History</Text>
                </View>
                
                {[
                    { date: 'Nov 12', detail: '3 sets • 105kg x 6' },
                    { date: 'Nov 08', detail: '4 sets • 100kg x 8' },
                    { date: 'Nov 03', detail: '3 sets • 100kg x 7' }
                ].map((item, i) => (
                    <Card key={i} style={s.historyRow}>
                        <View>
                            <Text style={s.historyDate}>{item.date}</Text>
                            <Text style={s.historyDetail}>{item.detail}</Text>
                        </View>
                        <ChevronLeft size={20} color={TEXT_TERTIARY} style={{ transform: [{ rotate: '180deg' }] }} />
                    </Card>
                ))}
            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    container: { padding: 20, gap: 20 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
    iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: SURFACE },
    title: { fontSize: 20, fontWeight: '800', color: '#fff' },

    chartCard: { padding: 18, gap: 24 },
    chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
    chartSub: { fontSize: 12, color: TEXT_TERTIARY, fontWeight: '600' },
    chartContainer: { height: 120, position: 'relative' },
    chartGlow: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, shadowColor: ACCENT, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20 },
    chartXLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
    xLabel: { fontSize: 11, color: TEXT_TERTIARY, fontWeight: '600' },

    statsRow: { flexDirection: 'row', gap: 12 },
    statCard: { flex: 1, padding: 16, alignItems: 'center', gap: 6 },
    statIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(59, 130, 246, 0.12)', alignItems: 'center', justifyContent: 'center' },
    statValue: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
    statLabel: { fontSize: 12, color: TEXT_TERTIARY, fontWeight: '600' },

    aboutCard: { padding: 18, gap: 14 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
    aboutText: { fontSize: 14, color: TEXT_SECONDARY, lineHeight: 22 },
    muscleTags: { flexDirection: 'row', gap: 8, marginTop: 4 },
    tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER },
    tagText: { fontSize: 12, color: TEXT_SECONDARY, fontWeight: '600' },

    historyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    historyDate: { fontSize: 15, fontWeight: '700', color: '#fff' },
    historyDetail: { fontSize: 13, color: TEXT_SECONDARY, marginTop: 2 },
})

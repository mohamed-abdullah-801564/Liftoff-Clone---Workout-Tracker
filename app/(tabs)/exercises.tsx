import { useState, useMemo, useEffect } from 'react'
import { View, ScrollView, StyleSheet, Pressable, TextInput, Animated } from 'react-native'
import { Toast, ToastHandle } from '@/components/Toast'
import { useRef } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import {
    ACCENT,
    BG,
    SURFACE,
    SURFACE2,
    SURFACE3,
    TEXT_SECONDARY,
    TEXT_TERTIARY,
    BORDER,
    ACCENT_LIGHT,
} from '@/lib/theme'
import { Search, Plus, Filter, ChevronRight } from 'lucide-react-native'
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'

const CATEGORIES = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core']

const EXERCISES = [
    { id: '1', name: 'Bench Press (Barbell)', muscle: 'Chest' },
    { id: '2', name: 'Deadlift (Conventional)', muscle: 'Back' },
    { id: '3', name: 'Squat (Barbell High Bar)', muscle: 'Legs' },
    { id: '4', name: 'Overhead Press (Barbell)', muscle: 'Shoulders' },
    { id: '5', name: 'Pull Up', muscle: 'Back' },
    { id: '6', name: 'Incline Bench Press (Dumbbell)', muscle: 'Chest' },
    { id: '7', name: 'Barbell Row (Bent Over)', muscle: 'Back' },
    { id: '8', name: 'Leg Press', muscle: 'Legs' },
    { id: '9', name: 'Lateral Raise (Dumbbell)', muscle: 'Shoulders' },
    { id: '10', name: 'Bicep Curl (Dumbbell)', muscle: 'Arms' },
    { id: '11', name: 'Tricep Pushdown', muscle: 'Arms' },
    { id: '12', name: 'Plank', muscle: 'Core' },
    { id: '13', name: 'Leg Curl (Lying)', muscle: 'Legs' },
    { id: '14', name: 'Romanian Deadlift (Barbell)', muscle: 'Legs' },
    { id: '15', name: 'Chest Fly (Machine)', muscle: 'Chest' },
    { id: '16', name: 'Lat Pulldown (Wide Grip)', muscle: 'Back' },
    { id: '17', name: 'Hammer Curl (Dumbbell)', muscle: 'Arms' },
    { id: '18', name: 'Face Pull', muscle: 'Shoulders' },
    { id: '19', name: 'Calf Raise (Standing)', muscle: 'Legs' },
    { id: '20', name: 'Hanging Leg Raise', muscle: 'Core' },
]

export default function ExercisesScreen() {
    const insets = useSafeAreaInsets()
    const [search, setSearch] = useState('')
    const [activeCat, setActiveCat] = useState('All')
    const [recommended, setRecommended] = useState<typeof EXERCISES>([])
    const toastRef = useRef<ToastHandle>(null)

    // Update recommendations when filter changes
    useEffect(() => {
        const otherCats = CATEGORIES.filter(c => c !== 'All' && c !== activeCat)
        const randomCat = otherCats[Math.floor(Math.random() * otherCats.length)]
        const matches = EXERCISES.filter(ex => ex.muscle === randomCat)
        setRecommended(matches.sort(() => 0.5 - Math.random()).slice(0, 3))
    }, [activeCat])

    const filteredExercises = useMemo(() => {
        return EXERCISES.filter(ex => {
            const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase())
            const matchesCat = activeCat === 'All' || ex.muscle === activeCat
            return matchesSearch && matchesCat
        })
    }, [search, activeCat])

    const addToWorkout = async (exercise: typeof EXERCISES[0]) => {
        try {
            const existing = await AsyncStorage.getItem('current_workout_exercises')
            const list = existing ? JSON.parse(existing) : []
            
            list.push({ ...exercise, instanceId: Date.now() })
            await AsyncStorage.setItem('current_workout_exercises', JSON.stringify(list))
            
            toastRef.current?.show(`${exercise.name} added to workout!`)
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <View style={[s.header, { paddingTop: insets.top + 10 }]}>
                <Text style={s.title}>Exercise Library</Text>
            </View>

            {/* Search Bar */}
            <View style={s.searchContainer}>
                <View style={s.searchBar}>
                    <Search size={18} color={TEXT_TERTIARY} />
                    <TextInput
                        placeholder="Search 800+ exercises"
                        placeholderTextColor={TEXT_TERTIARY}
                        style={s.searchInput}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
                <Pressable style={s.filterBtn}>
                    <Filter size={18} color={ACCENT} />
                </Pressable>
            </View>

            {/* Filter Chips */}
            <View>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={s.filterScroll}
                >
                    {CATEGORIES.map(cat => (
                        <Pressable 
                            key={cat} 
                            onPress={() => setActiveCat(cat)}
                            style={[s.chip, activeCat === cat && s.chipActive]}
                        >
                            <Text style={[s.chipText, activeCat === cat && s.chipTextActive]}>{cat}</Text>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE + 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Recommended Section */}
                {recommended.length > 0 && (
                    <>
                        <View style={s.sectionHeader}>
                            <Text style={s.sectionTitle}>Recommended For You</Text>
                        </View>
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false} 
                            contentContainerStyle={{ paddingHorizontal: 20, gap: 12, marginBottom: 20 }}
                        >
                            {recommended.map(ex => (
                                <Card key={ex.id} style={s.recCard}>
                                    <View style={s.recInfo}>
                                        <Text style={s.recName} numberOfLines={2}>{ex.name}</Text>
                                        <Text style={s.recMuscle}>{ex.muscle}</Text>
                                    </View>
                                    <Pressable 
                                        style={s.recAddBtn}
                                        onPress={() => addToWorkout(ex)}
                                    >
                                        <Plus size={16} color="#fff" />
                                    </Pressable>
                                </Card>
                            ))}
                        </ScrollView>
                    </>
                )}

                {/* List Header */}
                <View style={[s.sectionHeader, { marginTop: 12 }]}>
                    <Text style={s.sectionTitle}>{activeCat} Exercises</Text>
                    <Text style={s.countText}>{filteredExercises.length}</Text>
                </View>

                {/* Exercise List */}
                <View style={s.listContainer}>
                    {filteredExercises.map((ex) => (
                        <Pressable 
                            key={ex.id} 
                            onPress={() => router.push({ pathname: '/exercise-details', params: { id: ex.id, name: ex.name } })}
                        >
                            <Card style={s.exCard}>
                                <View style={s.exImagePlaceholder}>
                                    <DumbbellIcon size={20} color={TEXT_TERTIARY} />
                                </View>
                                <View style={s.exInfo}>
                                    <Text style={s.exName}>{ex.name}</Text>
                                    <View style={s.muscleTag}>
                                        <Text style={s.muscleTagText}>{ex.muscle}</Text>
                                    </View>
                                </View>
                                <Pressable 
                                    style={s.addBtn}
                                    onPress={() => addToWorkout(ex)}
                                >
                                    <Plus size={20} color={ACCENT} />
                                </Pressable>
                            </Card>
                        </Pressable>
                    ))}
                </View>
            </ScrollView>

            <Toast ref={toastRef} />
        </View>
    )
}

function DumbbellIcon({ size, color }: { size: number, color: string }) {
    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: size, height: 4, backgroundColor: color, borderRadius: 2 }} />
            <View style={{ position: 'absolute', left: 0, width: 4, height: size, backgroundColor: color, borderRadius: 2 }} />
            <View style={{ position: 'absolute', right: 0, width: 4, height: size, backgroundColor: color, borderRadius: 2 }} />
        </View>
    )
}

const s = StyleSheet.create({
    header: { paddingHorizontal: 20, paddingBottom: 12 },
    title: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
    
    searchContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 16 },
    searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE, borderRadius: 14, paddingHorizontal: 12, height: 48, gap: 10, borderWidth: 1, borderColor: BORDER },
    searchInput: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '500' },
    filterBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER },

    filterScroll: { paddingHorizontal: 20, gap: 8, paddingBottom: 20 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER },
    chipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
    chipText: { fontSize: 14, fontWeight: '600', color: TEXT_SECONDARY },
    chipTextActive: { color: '#fff' },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
    countText: { fontSize: 14, color: TEXT_TERTIARY, fontWeight: '600' },

    promoCard: { marginHorizontal: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' },
    promoContent: { flex: 1, gap: 4 },
    promoTag: { fontSize: 10, fontWeight: '800', color: ACCENT, letterSpacing: 1 },
    promoTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
    promoSub: { fontSize: 13, color: TEXT_SECONDARY, lineHeight: 18 },
    promoBtn: { backgroundColor: SURFACE3, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    promoBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

    recCard: { width: 200, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER },
    recInfo: { flex: 1, paddingRight: 12, gap: 2 },
    recName: { fontSize: 14, fontWeight: '700', color: '#fff' },
    recMuscle: { fontSize: 11, color: TEXT_TERTIARY, fontWeight: '600', textTransform: 'uppercase' },
    recAddBtn: { backgroundColor: ACCENT, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

    listContainer: { paddingHorizontal: 20, gap: 10 },
    exCard: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
    exImagePlaceholder: { width: 48, height: 48, borderRadius: 12, backgroundColor: SURFACE2, alignItems: 'center', justifyContent: 'center' },
    exInfo: { flex: 1, gap: 4 },
    exName: { fontSize: 16, fontWeight: '600', color: '#fff' },
    muscleTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, backgroundColor: 'rgba(59, 130, 246, 0.1)' },
    muscleTagText: { fontSize: 11, color: ACCENT_LIGHT, fontWeight: '700', textTransform: 'uppercase' },
    addBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(59, 130, 246, 0.1)', alignItems: 'center', justifyContent: 'center' },


})

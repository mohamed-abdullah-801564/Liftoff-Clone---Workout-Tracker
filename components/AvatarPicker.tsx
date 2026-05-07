import React, { useState, useEffect } from 'react'
import { View, StyleSheet, Pressable, Modal, Dimensions } from 'react-native'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Text } from '@/components/ui/Text'
import { BG, SURFACE, SURFACE2, ACCENT, TEXT_SECONDARY, BORDER } from '@/lib/theme'
import { Camera, X } from 'lucide-react-native'

const { height } = Dimensions.get('window')

export const DEFAULT_AVATARS = [
    { id: 'av1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
    { id: 'av2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka' },
    { id: 'av3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Max' },
    { id: 'av4', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna' },
    { id: 'av5', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kai' },
]

interface AvatarPickerProps {
    visible: boolean
    onClose: () => void
    onSelect: (avatar: any) => void
}

export function AvatarPicker({ visible, onClose, onSelect }: AvatarPickerProps) {
    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        })

        if (!result.canceled) {
            const avatarData = { type: 'image', uri: result.assets[0].uri }
            await AsyncStorage.setItem('user_avatar', JSON.stringify(avatarData))
            onSelect(avatarData)
            onClose()
        }
    }

    const handleSelectDefault = async (avatar: any) => {
        const avatarData = { type: 'default', ...avatar }
        await AsyncStorage.setItem('user_avatar', JSON.stringify(avatarData))
        onSelect(avatarData)
        onClose()
    }

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={s.overlay}>
                <Pressable style={s.backdrop} onPress={onClose} />
                <View style={s.sheet}>
                    <View style={s.header}>
                        <Text style={s.title}>Choose Avatar</Text>
                        <Pressable onPress={onClose} style={s.closeBtn}>
                            <X size={20} color={TEXT_SECONDARY} />
                        </Pressable>
                    </View>

                    <Pressable style={s.uploadBtn} onPress={handlePickImage}>
                        <View style={s.uploadIcon}>
                            <Camera size={24} color={ACCENT} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.uploadText}>Upload your photo</Text>
                            <Text style={s.uploadSub}>Select a clear photo of yourself</Text>
                        </View>
                    </Pressable>

                    <View style={s.divider} />
                    <Text style={s.defaultTitle}>Or pick a default character</Text>
                    
                    <View style={s.defaultGrid}>
                        {DEFAULT_AVATARS.map((av) => (
                            <Pressable 
                                key={av.id} 
                                style={s.defaultAv}
                                onPress={() => handleSelectDefault(av)}
                            >
                                <Image 
                                    source={{ uri: av.url }} 
                                    style={s.avImage}
                                    contentFit="contain"
                                />
                            </Pressable>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    )
}

export function AvatarDisplay({ avatar, size = 44, fallbackText = '?' }: { avatar: any, size?: number, fallbackText?: string }) {
    if (!avatar) {
        return (
            <View style={[s.display, { width: size, height: size, borderRadius: size / 2 }]}>
                <Text style={{ fontSize: size * 0.4, color: '#fff', fontWeight: '800' }}>{fallbackText}</Text>
            </View>
        )
    }

    const uri = avatar.type === 'image' ? avatar.uri : avatar.url

    return (
        <Image 
            source={{ uri }} 
            style={{ 
                width: size, 
                height: size, 
                borderRadius: size / 2, 
                borderWidth: 1, 
                borderColor: BORDER,
                backgroundColor: avatar.type === 'default' ? SURFACE2 : 'transparent'
            }} 
            contentFit="cover"
        />
    )
}

const s = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
    sheet: { backgroundColor: SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    title: { fontSize: 20, fontWeight: '800', color: '#fff' },
    closeBtn: { padding: 4, backgroundColor: SURFACE2, borderRadius: 12 },
    uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: SURFACE2, padding: 16, borderRadius: 16 },
    uploadIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(59, 130, 246, 0.1)', alignItems: 'center', justifyContent: 'center' },
    uploadText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    uploadSub: { fontSize: 13, color: TEXT_SECONDARY, marginTop: 4 },
    divider: { height: 1, backgroundColor: BORDER, marginVertical: 24 },
    defaultTitle: { fontSize: 14, fontWeight: '600', color: TEXT_SECONDARY, marginBottom: 16 },
    defaultGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    defaultAv: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: SURFACE2, overflow: 'hidden' },
    avImage: { width: '100%', height: '100%' },
    display: { backgroundColor: SURFACE2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER }
})


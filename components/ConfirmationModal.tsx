import React from 'react'
import { View, StyleSheet, Modal, Pressable } from 'react-native'
import { AlertCircle } from 'lucide-react-native'
import { Text } from '@/components/ui/Text'
import { BG, SURFACE, SURFACE2, ACCENT, TEXT_SECONDARY, TEXT_TERTIARY, BORDER } from '@/lib/theme'

interface ConfirmationModalProps {
    visible: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmText?: string
    confirmColor?: string
}

export function ConfirmationModal({ 
    visible, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = 'Confirm', 
    confirmColor = '#ef4444' 
}: ConfirmationModalProps) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={s.overlay}>
                <Pressable style={s.backdrop} onPress={onClose} />
                <View style={s.card}>
                    <View style={s.iconWrap}>
                        <AlertCircle size={32} color={confirmColor} />
                    </View>
                    <Text style={s.title}>{title}</Text>
                    <Text style={s.message}>{message}</Text>
                    
                    <View style={s.actions}>
                        <Pressable style={s.cancelBtn} onPress={onClose}>
                            <Text style={s.cancelText}>Cancel</Text>
                        </Pressable>
                        <Pressable 
                            style={[s.confirmBtn, { backgroundColor: confirmColor }]} 
                            onPress={() => {
                                onConfirm()
                                onClose()
                            }}
                        >
                            <Text style={s.confirmText}>{confirmText}</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    )
}

const s = StyleSheet.create({
    overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)' },
    card: { 
        backgroundColor: SURFACE, 
        width: '100%', 
        borderRadius: 24, 
        padding: 24, 
        alignItems: 'center', 
        borderWidth: 1, 
        borderColor: BORDER 
    },
    iconWrap: { 
        width: 64, 
        height: 64, 
        borderRadius: 32, 
        backgroundColor: SURFACE2, 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginBottom: 16 
    },
    title: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 8, textAlign: 'center' },
    message: { fontSize: 14, color: TEXT_SECONDARY, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    actions: { flexDirection: 'row', gap: 12, width: '100%' },
    cancelBtn: { flex: 1, height: 48, borderRadius: 12, backgroundColor: SURFACE2, alignItems: 'center', justifyContent: 'center' },
    cancelText: { color: TEXT_SECONDARY, fontSize: 15, fontWeight: '700' },
    confirmBtn: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    confirmText: { color: '#fff', fontSize: 15, fontWeight: '700' }
})

import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'
import { View, StyleSheet, Animated, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'

export interface ToastHandle {
    show: (message: string) => void
}

export const Toast = forwardRef<ToastHandle, { bottomOffset?: number }>((props, ref) => {
    const insets = useSafeAreaInsets()
    const [message, setMessage] = useState('')
    const toastAnim = useState(new Animated.Value(100))[0]

    const show = useCallback((msg: string) => {
        setMessage(msg)
        Animated.sequence([
            Animated.spring(toastAnim, { 
                toValue: -insets.bottom - (props.bottomOffset || TAB_BAR_CLEARANCE + 20), 
                useNativeDriver: true, 
                tension: 50, 
                friction: 8 
            }),
            Animated.delay(2000),
            Animated.timing(toastAnim, { toValue: 100, duration: 300, useNativeDriver: true })
        ]).start()
    }, [insets.bottom, props.bottomOffset])

    useImperativeHandle(ref, () => ({ show }))

    return (
        <Animated.View style={[s.toast, { transform: [{ translateY: toastAnim }] }]}>
            <Text style={s.toastText}>{message}</Text>
        </Animated.View>
    )
})

const s = StyleSheet.create({
    toast: { 
        position: 'absolute', 
        left: 20, 
        right: 20, 
        backgroundColor: '#1A1A1A', 
        paddingVertical: 14, 
        paddingHorizontal: 20, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: 'rgba(59, 130, 246, 0.3)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 9999,
        bottom: 0,
    },
    toastText: { color: '#3B82F6', fontSize: 14, fontWeight: '700', textAlign: 'center' },
})

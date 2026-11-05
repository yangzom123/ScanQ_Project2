import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { OFFLINE_MESSAGE, isOfflineError } from '../services/network';

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

// Works like Android's Toast on both platforms
export function ToastProvider({ children }) {
  const [msg, setMsg] = useState('');
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);

  const show = useCallback((text, long = false) => {
    const message = String(text || '');
    setMsg(isOfflineError({ message }) ? OFFLINE_MESSAGE
      : message.includes('WRITE_TIMEOUT') ? 'The request is taking too long. Check your connection and try again.'
      : message);
    clearTimeout(timer.current);
    Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    timer.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    }, long ? 3500 : 2000);
  }, [opacity]);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <Animated.View pointerEvents="none" style={[s.toast, { opacity }]}>
        <Text style={s.text}>{msg}</Text>
      </Animated.View>
    </ToastCtx.Provider>
  );
}

const s = StyleSheet.create({
  toast: {
    position: 'absolute', left: 32, right: 32, bottom: 110, alignSelf: 'center',
    backgroundColor: '#e2e8f0', borderRadius: 24, paddingVertical: 12, paddingHorizontal: 20, zIndex: 999,
  },
  text: { color: colors.textDark, fontSize: 14, textAlign: 'center' },
});

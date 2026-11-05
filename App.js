import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';
import RootNavigator from './src/navigation';
import { colors } from './src/theme';
import { NetworkProvider, OfflineBanner } from './src/context/NetworkContext';

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.bgDark} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NetworkProvider>
          <ToastProvider>
            <AuthProvider>
              <ThemedStatusBar />
              <View style={{ flex: 1 }}>
                <OfflineBanner />
                <RootNavigator />
              </View>
            </AuthProvider>
          </ToastProvider>
        </NetworkProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

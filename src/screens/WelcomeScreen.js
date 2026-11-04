import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, PrimaryButton, OutlineButton } from '../components/ui';
import { colors } from '../theme';
import { useTheme } from '../context/ThemeContext';

export default function WelcomeScreen({ navigation }) {
  useTheme();
  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', padding: 32 }}>
        <View style={{ flex: 1 }} />
        <View style={{ width: 180, height: 180, padding: 28, borderRadius: 40, borderWidth: 6, borderColor: colors.logoBorder, backgroundColor: '#0f172a', overflow: 'hidden' }}>
          <Image source={require('../../assets/logo.jpeg')} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
        </View>
        <Text style={{ color: colors.textPrimary, fontSize: 26, fontWeight: 'bold', marginTop: 40 }}>
          Welcome to <Text style={{ color: colors.accentBlue }}>ScanQ</Text>
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 8, textAlign: 'center' }}>Smart attendance management made simple</Text>
        <View style={{ flex: 1 }} />
        <PrimaryButton title="Continue as Student" style={{ width: '100%', marginBottom: 16 }} onPress={() => navigation.navigate('Login', { role: 'student' })} />
        <OutlineButton title="Continue as Tutor" style={{ width: '100%', marginBottom: 24 }} onPress={() => navigation.navigate('Login', { role: 'tutor' })} />
      </View>
      <TouchableOpacity style={{ position: 'absolute', top: 60, right: 20, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }} onPress={() => navigation.navigate('About')}>
        <Ionicons name="information-circle-outline" size={30} color={colors.accentBlue} />
      </TouchableOpacity>
    </Screen>
  );
}

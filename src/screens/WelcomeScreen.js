import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, PrimaryButton, OutlineButton } from '../components/ui';
import { colors } from '../theme';

export default function WelcomeScreen({ navigation }) {
  return (
    <Screen>
      <View style={s.body}>
        <View style={{ flex: 1 }} />
        <View style={s.logoBox}>
          <Image source={require('../../assets/logo.jpeg')} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
        </View>
        <Text style={s.title}>
          Welcome to <Text style={{ color: colors.accentBlue }}>ScanQ</Text>
        </Text>
        <Text style={s.tagline}>Smart attendance management made simple</Text>
        <View style={{ flex: 1 }} />
        <PrimaryButton title="Continue as Student" style={{ width: '100%', marginBottom: 16 }}
          onPress={() => navigation.navigate('Login', { role: 'student' })} />
        <OutlineButton title="Continue as Tutor" style={{ width: '100%', marginBottom: 24 }}
          onPress={() => navigation.navigate('Login', { role: 'tutor' })} />
      </View>
      <TouchableOpacity style={s.about} onPress={() => navigation.navigate('About')}>
        <Ionicons name="information-circle-outline" size={30} color={colors.accentBlue} />
      </TouchableOpacity>
    </Screen>
  );
}

const s = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', padding: 32 },
  logoBox: {
    width: 180, height: 180, padding: 28, borderRadius: 40, borderWidth: 6, borderColor: colors.white,
    backgroundColor: colors.bgDark, overflow: 'hidden',
  },
  title: { color: colors.textPrimary, fontSize: 26, fontWeight: 'bold', marginTop: 40 },
  tagline: { color: colors.textSecondary, fontSize: 15, marginTop: 8, textAlign: 'center' },
  about: { position: 'absolute', top: 60, right: 20, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
});

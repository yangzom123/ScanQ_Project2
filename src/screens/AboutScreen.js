import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card } from '../components/ui';
import { colors } from '../theme';
import { useTheme } from '../context/ThemeContext';

const FEATURES = [
  ['Dynamic QR Code', 'Quick attendance tracking using QR scanning'],
  ['Analytics', 'Monitor attendance percentage and records'],
  ['Secure System', 'Reduce fake attendance and improve reliability'],
];

export default function AboutScreen({ navigation }) {
  useTheme();
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, marginTop: 8, justifyContent: 'center' }}>
          <Ionicons name="close" size={28} color={colors.accentBlue} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <View style={{ width: 100, height: 100, padding: 12, borderRadius: 40, borderWidth: 6, borderColor: colors.logoBorder, backgroundColor: '#0f172a', overflow: 'hidden' }}>
            <Image source={require('../../assets/logo.jpeg')} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          </View>
          <Text style={{ color: colors.accentBlue, fontSize: 24, fontWeight: 'bold', marginTop: 20 }}>ScanQ</Text>
        </View>
        <Text style={{ color: colors.textPrimary, fontSize: 15, marginTop: 12, textAlign: 'center' }}>
          A smart and efficient way to manage student attendance using QR technology and digital tracking
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 16, textAlign: 'center' }}>
          ScanQ helps universities and schools simplify attendance management through modern digital solutions. This app is designed to reduce manual work and improve accuracy thereby reducing the risk of proxy.
        </Text>
        <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginTop: 32 }}>Features</Text>
        {FEATURES.map(([t, d], i) => (
          <Card key={t} style={{ marginTop: i === 0 ? 16 : 12, marginBottom: i === 2 ? 32 : 0 }}>
            <Text style={{ color: colors.accentBlue, fontSize: 16, fontWeight: 'bold' }}>{t}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 6 }}>{d}</Text>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

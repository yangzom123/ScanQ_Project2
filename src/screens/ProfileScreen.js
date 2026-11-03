import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, TopBar, Card, OutlineButton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

export default function ProfileScreen() {
  const { profile, logout } = useAuth();
  const role = profile?.role || '';
  const isTutor = role.toLowerCase() === 'tutor';
  return (
    <Screen>
      <TopBar title="My Profile" />
      <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }}>
        <View style={{
          width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(56,189,248,0.07)', borderWidth: 1, borderColor: 'rgba(56,189,248,0.13)',
        }}>
          <Ionicons name={isTutor ? 'school' : 'person'} size={56} color={colors.accentBlue} />
        </View>
        <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: 'bold', marginTop: 16 }}>{profile?.fullName || 'Unknown'}</Text>
        <Text style={{ color: colors.accentBlue, fontSize: 14, fontWeight: 'bold', marginTop: 4 }}>{role.toUpperCase()}</Text>

        <Card style={{ width: '100%', marginTop: 32, padding: 20 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Student/Tutor ID</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 16, marginTop: 4 }}>{profile?.idNumber || 'N/A'}</Text>
          <View style={{ height: 1, backgroundColor: colors.cardDarkLight, marginVertical: 16 }} />
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Email Address</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 16, marginTop: 4 }}>{profile?.email || 'N/A'}</Text>
        </Card>

        <OutlineButton title="Logout" color={colors.warningRed} onPress={logout} style={{ width: '100%', marginTop: 40 }} />
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 24 }}>ScanQ Version 1.0.0</Text>
      </ScrollView>
    </Screen>
  );
}

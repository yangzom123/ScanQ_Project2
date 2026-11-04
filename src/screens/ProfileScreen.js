import React from 'react';
import { View, Text, ScrollView, Switch } from 'react-native';
import { Screen, TopBar, Card, Avatar, PrimaryButton, OutlineButton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme';

export default function ProfileScreen({ navigation }) {
  const { isDark, setDark } = useTheme();
  const { profile, logout } = useAuth();
  const role = profile?.role || '';
  return (
    <Screen>
      <TopBar title="My Profile" />
      <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }}>
        <Avatar uri={profile?.profilePhotoUrl} role={role} size={120} />
        <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: 'bold', marginTop: 16 }}>{profile?.fullName || 'Unknown'}</Text>
        <Text style={{ color: colors.accentBlue, fontSize: 14, fontWeight: 'bold', marginTop: 4 }}>{role.toUpperCase()}</Text>

        <Card style={{ width: '100%', marginTop: 32, padding: 20 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Student/Tutor ID</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 16, marginTop: 4 }}>{profile?.idNumber || 'N/A'}</Text>
          <View style={{ height: 1, backgroundColor: colors.cardDarkLight, marginVertical: 16 }} />
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Email Address</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 16, marginTop: 4 }}>{profile?.email || 'N/A'}</Text>
        </Card>

        <Card style={{ width: '100%', marginTop: 16, flexDirection: 'row', alignItems: 'center', padding: 20 }}>
          <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 16 }}>Dark Mode</Text>
          <Switch value={isDark} onValueChange={setDark} trackColor={{ true: colors.accentBlue, false: colors.cardDarkLight }} thumbColor={colors.white} />
        </Card>

        <PrimaryButton title="Edit Profile" onPress={() => navigation.navigate('EditProfile')} style={{ width: '100%', marginTop: 28 }} />
        <OutlineButton title="Logout" color={colors.warningRed} onPress={logout} style={{ width: '100%', marginTop: 16 }} />
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 24 }}>ScanQ Version 2.0.0</Text>
      </ScrollView>
    </Screen>
  );
}

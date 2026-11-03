import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Screen, Card, LightCard, Field, PrimaryButton, Fab } from '../../components/ui';
import { SessionCard } from '../../components/Cards';
import { fetchTutorSessions } from '../../services/data';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { colors } from '../../theme';

function Stat({ value, label, first }) {
  return (
    <LightCard style={{ flex: 1, marginLeft: first ? 0 : 8, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4 }}>
      <Text style={{ color: colors.accentBlueDark, fontSize: 20, fontWeight: 'bold' }}>{value}</Text>
      <Text style={{ color: colors.textDark, fontSize: 11 }}>{label}</Text>
    </LightCard>
  );
}

export default function TutorDashboard({ navigation }) {
  const { profile, user } = useAuth();
  const toast = useToast();
  const tabH = useBottomTabBarHeight();
  const uid = user?.uid;
  const [stats, setStats] = useState({ modules: 0, students: 0, sessions: 0, rate: 0 });
  const [recent, setRecent] = useState([]);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    if (!uid) return;
    try {
      const mods = await getDocs(query(collection(db, 'modules'), where('tutorId', '==', uid)));
      const studentIds = new Set();
      mods.docs.forEach((d) => (d.data().enrolledStudentIds || []).forEach((s) => studentIds.add(s)));
      const sessions = await fetchTutorSessions(uid);
      let expected = 0, present = 0;
      sessions.forEach((s) => { expected += s.totalStudents; present += s.presentCount; });
      setStats({
        modules: mods.size, students: studentIds.size, sessions: sessions.length,
        rate: expected > 0 ? Math.floor((present / expected) * 100) : 0,
      });
      setRecent(sessions.slice(0, 5));
    } catch (e) {
      toast(`Couldn't load data: ${e.message}`);
    }
  }, [uid, toast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const createModule = async () => {
    const n = name.trim();
    if (!n) { toast('Enter a module name'); return; }
    setCreating(true);
    try {
      await addDoc(collection(db, 'modules'), {
        name: n, code: n.slice(0, 6).toUpperCase(), tutorId: uid, enrolledStudentIds: [],
      });
      toast('Module created');
      setName('');
      load();
    } catch (e) {
      toast(`Failed: ${e.message}`, true);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingHorizontal: 20 }}>
        <Text style={{ color: colors.accentBlue, fontSize: 22, fontWeight: 'bold' }}>ScanQ</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(56,189,248,0.07)', borderWidth: 1, borderColor: 'rgba(56,189,248,0.13)' }}
        >
          <Ionicons name="school" size={26} color={colors.accentBlue} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: tabH + 90 }} keyboardShouldPersistTaps="handled">
        <Text style={{ color: colors.textSecondary, fontSize: 15 }}>Welcome back,</Text>
        <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' }}>{profile?.fullName || 'Tutor'}</Text>
        <Text style={{ color: colors.accentBlue, fontSize: 13 }}>Tutor</Text>

        <View style={{ flexDirection: 'row', marginTop: 20 }}>
          <Stat first value={stats.modules} label="Modules" />
          <Stat value={stats.students} label="Students" />
          <Stat value={stats.sessions} label="Sessions" />
          <Stat value={`${stats.rate}%`} label="Attendance" />
        </View>

        <Card style={{ marginTop: 20 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: 'bold' }}>Create Module</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <Field
              style={{ flex: 1, height: 48, fontSize: 13, paddingHorizontal: 14, marginTop: 8 }}
              placeholder="Enter Module Name" value={name} onChangeText={setName} autoCapitalize="words"
            />
            <PrimaryButton small title="Create Module" onPress={createModule} disabled={creating} style={{ marginLeft: 8, marginTop: 8 }} />
          </View>
        </Card>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24 }}>
          <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 16, fontWeight: 'bold' }}>Recent Sessions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Students')}>
            <Text style={{ color: colors.accentBlue, fontSize: 14 }}>View All --&gt;</Text>
          </TouchableOpacity>
        </View>
        <View style={{ marginTop: 12 }}>
          {recent.map((s) => <SessionCard key={s.sessionId} session={s} />)}
        </View>

        <View style={{ flexDirection: 'row', marginTop: 16 }}>
          <TouchableOpacity style={{ flex: 1, marginRight: 8 }} onPress={() => navigation.navigate('GenerateQr')}>
            <Card><Text style={{ color: colors.accentBlue, fontSize: 15, fontWeight: 'bold' }}>Generate QR</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Start new attendance</Text></Card>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, marginLeft: 8 }} onPress={() => navigation.navigate('Students')}>
            <Card><Text style={{ color: colors.accentBlue, fontSize: 15, fontWeight: 'bold' }}>Records</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>View all records</Text></Card>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Fab icon="qr-code" bottom={tabH + 8} onPress={() => navigation.navigate('GenerateQr')} />
    </Screen>
  );
}

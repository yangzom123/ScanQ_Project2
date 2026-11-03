import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { collection, query, where, limit, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';
import { Screen, Card, Field, PrimaryButton, Fab } from '../../components/ui';
import { StudentModuleCard } from '../../components/Cards';
import { fetchStudentModules } from '../../services/data';
import { useAuth, warningState } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { colors } from '../../theme';

function Ring({ percent }) {
  const size = 90, stroke = 6, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.cardDarkLight} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r} stroke={colors.accentBlue} strokeWidth={stroke} fill="none"
          strokeDasharray={`${c}`} strokeDashoffset={c * (1 - percent / 100)} strokeLinecap="round"
          rotation="-90" origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={{ color: colors.white, fontSize: 18, fontWeight: 'bold' }}>{percent}%</Text>
    </View>
  );
}

export default function StudentDashboard({ navigation }) {
  const { profile, user } = useAuth();
  const toast = useToast();
  const tabH = useBottomTabBarHeight();
  const uid = user?.uid;
  const [modules, setModules] = useState([]);
  const [overall, setOverall] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);

  const load = useCallback(async () => {
    if (!uid) return;
    try {
      const mods = await fetchStudentModules(uid);
      const avg = mods.length ? Math.floor(mods.reduce((a, m) => a + m.attendancePercent, 0) / mods.length) : 0;
      setModules(mods);
      setOverall(avg);
      setLoaded(true);
      // Low-attendance dialog: once per login
      if (mods.length && avg < 90 && !warningState.shown) {
        warningState.shown = true;
        Alert.alert(
          'Low Attendance Warning',
          `Your overall attendance is currently ${avg}%. This is below the required 90%. Please attend your upcoming classes to improve your attendance.`,
          [
            { text: 'Dismiss', style: 'cancel' },
            { text: 'View Details', onPress: () => navigation.navigate('Attendance') },
          ]
        );
      }
    } catch (e) {
      toast(`Couldn't load modules: ${e.message}`);
    }
  }, [uid, navigation, toast]);

  // = onResume(): refresh whenever we come back (e.g. after scanning)
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const join = async () => {
    const c = code.trim().toUpperCase();
    if (!c) { toast('Please enter a module code'); return; }
    setJoining(true);
    try {
      const snap = await getDocs(query(collection(db, 'modules'), where('code', '==', c), limit(1)));
      if (snap.empty) { toast('Invalid Module Code'); return; }
      const m = snap.docs[0];
      const enrolled = m.data().enrolledStudentIds || [];
      if (enrolled.includes(uid)) { toast('You are already enrolled in this module'); return; }
      try {
        await updateDoc(doc(db, 'modules', m.id), { enrolledStudentIds: arrayUnion(uid) });
        setCode('');
        toast('Successfully enrolled!');
        load();
      } catch (e) {
        toast(`Enrollment failed: ${e.message}`);
      }
    } catch (e) {
      toast(`Error checking code: ${e.message}`);
    } finally {
      setJoining(false);
    }
  };

  const good = overall >= 90;
  const statusColor = good ? colors.successGreen : colors.warningRed;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingHorizontal: 20 }}>
        <Text style={{ color: colors.accentBlue, fontSize: 22, fontWeight: 'bold' }}>ScanQ</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(56,189,248,0.07)', borderWidth: 1, borderColor: 'rgba(56,189,248,0.13)' }}
        >
          <Ionicons name="person" size={26} color={colors.accentBlue} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: tabH + 90 }} keyboardShouldPersistTaps="handled">
        <Text style={{ color: colors.textSecondary, fontSize: 15 }}>Welcome back,</Text>
        <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' }}>{profile?.fullName || 'Student'}</Text>
        <Text style={{ color: colors.accentBlue, fontSize: 13 }}>Student</Text>

        <Card style={{ marginTop: 20, padding: 20, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Overall Attendance</Text>
            <Text style={{ color: colors.accentBlue, fontSize: 32, fontWeight: 'bold', marginTop: 6 }}>{overall}%</Text>
            <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
              borderRadius: 16, paddingHorizontal: 14, paddingVertical: 4, marginTop: 8 }}>
              <Text style={{ color: statusColor, fontSize: 13 }}>{good ? 'Good' : 'Below 90%'}</Text>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: statusColor, marginLeft: 6 }} />
            </View>
          </View>
          <Ring percent={overall} />
        </Card>

        <Card style={{ marginTop: 20 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: 'bold' }}>Enroll in Module</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <Field
              style={{ flex: 1, height: 48, fontSize: 13, paddingHorizontal: 14, marginTop: 8 }}
              placeholder="Enter Module Code" value={code} onChangeText={setCode} autoCapitalize="characters"
            />
            <PrimaryButton small title={joining ? 'Joining...' : 'Join'} onPress={join} disabled={joining} style={{ marginLeft: 8, marginTop: 8 }} />
          </View>
        </Card>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24 }}>
          <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 16, fontWeight: 'bold' }}>Enrolled Modules</Text>
          <TouchableOpacity onPress={() => navigation.navigate('My Modules')}>
            <Text style={{ color: colors.accentBlue, fontSize: 14 }}>View All --&gt;</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 12 }}>
          {loaded && modules.length === 0 && (
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 12 }}>No modules enrolled yet</Text>
          )}
          {modules.map((m) => <StudentModuleCard key={m.moduleId} module={m} />)}
        </View>

        <View style={{ flexDirection: 'row', marginTop: 16 }}>
          <TouchableOpacity style={{ flex: 1, marginRight: 8 }} onPress={() => navigation.navigate('Scan')}>
            <Card><Text style={{ color: colors.accentBlue, fontSize: 15, fontWeight: 'bold' }}>Scan QR</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Tap to mark attendance</Text></Card>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, marginLeft: 8 }} onPress={() => navigation.navigate('Attendance')}>
            <Card><Text style={{ color: colors.accentBlue, fontSize: 15, fontWeight: 'bold' }}>My Attendance</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>View attendance stats</Text></Card>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Fab icon="camera" bottom={tabH + 8} onPress={() => navigation.navigate('Scan')} />
    </Screen>
  );
}

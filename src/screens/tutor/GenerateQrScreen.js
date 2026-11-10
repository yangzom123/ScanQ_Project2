import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Location from 'expo-location';
import { collection, query, where, getDocs, doc, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Screen, Label, Dropdown, PickerField, PrimaryButton, Loading } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { formatDate, formatTime, randomToken, combineDateTime } from '../../utils';
import { colors } from '../../theme';
import { runOnlineWrite } from '../../services/network';
import { safeBack } from '../../navigation/safeBack';

const REFRESH_INTERVAL = 10000; // QR token changes every 10 s
const RADII = [50, 100, 200];

/**
 * Schedule a session (date + start + end time), save the classroom location, then show the
 * rotating QR. Students can only check in inside the time window and inside the geo-fence.
 */
export default function GenerateQrScreen({ navigation }) {
  useTheme();
  const { user } = useAuth();
  const toast = useToast();
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(0);
  const [date, setDate] = useState(new Date());
  const [start, setStart] = useState(new Date());
  const [end, setEnd] = useState(new Date(Date.now() + 60 * 60 * 1000));
  const [radiusIdx, setRadiusIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [session, setSession] = useState(null); // { id, token, label, info }
  const [ended, setEnded] = useState(false);
  const timer = useRef(null);
  const sessionIdRef = useRef(null);
  const endAtRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'modules'), where('tutorId', '==', user.uid)));
        const opts = snap.docs.map((d) => ({
          id: d.id, name: d.data().name || '', code: d.data().code || '', enrolledCount: (d.data().enrolledStudentIds || []).length,
        }));
        if (opts.length === 0) { toast('Create a module first, then generate a QR for it', true); safeBack(navigation, 'TutorTabs'); return; }
        setOptions(opts);
        setLoading(false);
      } catch (e) {
        toast(`Couldn't load your modules: ${e.message}`, true);
        safeBack(navigation, 'TutorTabs');
      }
    })();
    return () => clearInterval(timer.current);
  }, []);

  const generate = async () => {
    const module = options[selected];
    if (!module) return;
    const startAt = combineDateTime(date, start);
    const endAt = combineDateTime(date, end);
    if (endAt <= startAt) { toast('End time must be after the start time'); return; }
    if (endAt.getTime() <= Date.now()) { toast('This time window is already over. Pick a later end time.'); return; }

    setGenerating(true);
    // classroom location for the geo-fence
    let coords;
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        if (!perm.canAskAgain) {
          Alert.alert('Location access is off', 'Allow location access in Settings to save the classroom location.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]);
        } else toast('Location access is needed to save the classroom location.', true);
        setGenerating(false);
        return;
      }
      if (!(await Location.hasServicesEnabledAsync())) {
        toast('Turn on location services, then try creating the session again.', true);
        setGenerating(false);
        return;
      }
      coords = (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })).coords;
    } catch (e) {
      toast(`Couldn't get your location: ${e.message}`, true);
      setGenerating(false);
      return;
    }

    const token = randomToken();
    try {
      const ref = doc(collection(db, 'sessions'));
      await runOnlineWrite(() => runTransaction(db, async (txn) => txn.set(ref, {
        moduleId: module.id, moduleName: module.name, tutorId: user.uid,
        date: formatDate(startAt), startTime: formatTime(startAt), endTime: formatTime(endAt),
        scheduledEndTime: formatTime(endAt),
        startAt: Timestamp.fromDate(startAt), endAt: Timestamp.fromDate(endAt),
        scheduledEndAt: Timestamp.fromDate(endAt), closed: false,
        latitude: coords.latitude, longitude: coords.longitude, radius: RADII[radiusIdx],
        totalStudents: module.enrolledCount, presentCount: 0,
        currentToken: token, createdAt: serverTimestamp(),
      })));
      sessionIdRef.current = ref.id;
      endAtRef.current = endAt.getTime();
      setSession({
        id: ref.id, token,
        label: `${module.code} - ${module.name}\n${formatDate(startAt)}, ${formatTime(startAt)} - ${formatTime(endAt)}`,
        info: `Open for check-in until ${formatTime(endAt)} • within ${RADII[radiusIdx]} m`,
      });
      startRefresh(module, startAt, endAt);
    } catch (e) {
      toast(`Failed to create session: ${e.message}`, true);
      setGenerating(false);
    }
  };

  // New token every 10 s; the session closes by itself when the end time is reached
  const startRefresh = (module, startAt, endAt) => {
    clearInterval(timer.current);
    timer.current = setInterval(async () => {
      const id = sessionIdRef.current;
      if (!id) return;
      if (Date.now() >= endAtRef.current) {
        clearInterval(timer.current);
        try { await runOnlineWrite(() => runTransaction(db, async (txn) => {
          const ref = doc(db, 'sessions', id);
          const snap = await txn.get(ref);
          if (snap.exists()) txn.update(ref, { closed: true });
        })); } catch (e) { /* ignore */ }
        setEnded(true);
        toast('Session time is over. Attendance is now closed.', true);
        return;
      }
      const newToken = randomToken();
      try {
        await runOnlineWrite(() => runTransaction(db, async (txn) => {
          const ref = doc(db, 'sessions', id);
          const snap = await txn.get(ref);
          if (snap.exists() && !snap.data().closed) txn.update(ref, { currentToken: newToken });
        }));
        setSession((prev) => ({ ...prev, token: newToken }));
      } catch (e) { /* the next tick retries */ }
    }, REFRESH_INTERVAL);
  };

  // Tutor can close attendance early (no need to keep the QR open for the full lecture)
  const stop = async () => {
    clearInterval(timer.current);
    const id = sessionIdRef.current;
    if (id && !ended) {
      try {
        await runOnlineWrite(() => runTransaction(db, async (txn) => {
          const ref = doc(db, 'sessions', id);
          const snap = await txn.get(ref);
          // Close check-in without changing the originally scheduled end time.
          if (snap.exists()) txn.update(ref, { closed: true });
        }));
        toast(`Attendance stopped. Scheduled end time: ${formatTime(new Date(endAtRef.current))}`);
      } catch (e) { toast(`Failed to stop session: ${e.message}`); }
    }
    safeBack(navigation, 'TutorTabs');
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 28 }}>
          <TouchableOpacity onPress={() => safeBack(navigation, 'TutorTabs')} style={{ width: 40, height: 40, justifyContent: 'center' }}>
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginLeft: 8 }}>
            {session ? 'Attendance QR' : 'Schedule Attendance Session'}
          </Text>
        </View>

        {loading && <Loading />}

        {!loading && !session && (
          <View>
            <Label>Select Module</Label>
            <Dropdown options={options.map((o) => `${o.code} - ${o.name}`)} selectedIndex={selected} onSelect={setSelected} />
            <Label style={{ marginTop: 18 }}>Date</Label>
            <PickerField value={date} mode="date" onChange={setDate} minimumDate={new Date(new Date().setHours(0, 0, 0, 0))} />
            <View style={{ flexDirection: 'row', marginTop: 18 }}>
              <View style={{ flex: 1, marginRight: 8 }}><Label>Start Time</Label><PickerField value={start} mode="time" onChange={setStart} /></View>
              <View style={{ flex: 1, marginLeft: 8 }}><Label>End Time</Label><PickerField value={end} mode="time" onChange={setEnd} /></View>
            </View>
            <Label style={{ marginTop: 18 }}>Allowed distance from classroom</Label>
            <Dropdown options={RADII.map((r) => `${r} m`)} selectedIndex={radiusIdx} onSelect={setRadiusIdx} />
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 12 }}>
              Your current location is saved as the classroom location. Students can only check in during this time window and within this distance.
            </Text>
            <PrimaryButton title={generating ? 'Creating...' : 'Create Session & Generate QR'} onPress={generate} disabled={generating} style={{ marginTop: 28 }} />
          </View>
        )}

        {session && (
          <View style={{ alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', width: 240, height: 240, marginTop: 12, padding: 12, alignItems: 'center', justifyContent: 'center', opacity: ended ? 0.25 : 1 }}>
              <QRCode value={`${session.id}|${session.token}`} size={216} />
            </View>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold', marginTop: 20, textAlign: 'center' }}>{session.label}</Text>
            <Text style={{ color: ended ? colors.warningRed : colors.textSecondary, fontSize: 13, marginTop: 8, textAlign: 'center' }}>
              {ended ? 'Session ended. Attendance is closed.' : session.info}
            </Text>
            <PrimaryButton title={ended ? 'Done' : 'Stop Session'} onPress={stop} style={{ width: '100%', marginTop: 36 }} />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

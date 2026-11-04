import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, runTransaction, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../../firebase';
import { Screen, PrimaryButton } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { distanceMeters } from '../../utils';
import { colors } from '../../theme';

// Returns a message when the session can't take attendance right now, otherwise null
function windowError(d) {
  const now = Date.now();
  if (d.closed) return 'This session has been closed by the tutor';
  if (d.startAt && now < d.startAt.toMillis()) return `This session hasn't started yet. It starts at ${d.startTime}.`;
  if (d.endAt && now > d.endAt.toMillis()) return `This session ended at ${d.endTime}.`;
  if (!d.endAt && d.endTime) return 'This session has been closed by the tutor'; // sessions from Project I
  return null;
}

// Geo-fence: student must be within `radius` metres of the classroom location saved by the tutor
async function checkLocation(d) {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (perm.status !== 'granted') throw new Error('Location permission is required to mark attendance for this session');
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  if (pos.mocked) throw new Error('Mock locations are not allowed');
  const dist = distanceMeters(pos.coords.latitude, pos.coords.longitude, d.latitude, d.longitude);
  const radius = d.radius || 100;
  if (dist > radius) {
    throw new Error(`You are about ${Math.round(dist)} m from the classroom. You must be within ${radius} m to mark attendance.`);
  }
}

export default function ScanScreen({ navigation }) {
  useTheme();
  const { user } = useAuth();
  const toast = useToast();
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const handled = useRef(false);

  const markAttendance = async (payload) => {
    const uid = user?.uid;
    if (!uid) { toast('Session expired, please log in again'); navigation.goBack(); return; }
    const parts = payload.split('|');
    if (parts.length < 2) { toast('Invalid or outdated QR code', true); navigation.goBack(); return; }
    const [sessionId, scannedToken] = parts;

    const sessionRef = doc(db, 'sessions', sessionId);
    const attendanceRef = doc(db, 'sessions', sessionId, 'attendance', uid);
    setBusy(true);
    try {
      // 1) schedule + location checks
      const first = await getDoc(sessionRef);
      if (!first.exists()) throw new Error("This QR code doesn't match any active session");
      const early = windowError(first.data());
      if (early) throw new Error(early);
      if (first.data().latitude != null && first.data().longitude != null) await checkLocation(first.data());

      // 2) atomic check-in (re-validates the window and token, rejects duplicates)
      const moduleName = await runTransaction(db, async (txn) => {
        const snap = await txn.get(sessionRef);
        if (!snap.exists()) throw new Error("This QR code doesn't match any active session");
        const data = snap.data();
        const err = windowError(data);
        if (err) throw new Error(err);
        if (data.currentToken !== scannedToken) throw new Error('QR_EXPIRED');
        const att = await txn.get(attendanceRef);
        if (att.exists()) throw new Error('ALREADY_MARKED');
        txn.set(attendanceRef, { studentId: uid, timestamp: serverTimestamp(), status: 'present' });
        txn.update(sessionRef, { presentCount: increment(1) });
        return data.moduleName || 'the session';
      });
      toast(`Attendance marked for ${moduleName}`, true);
    } catch (e) {
      const msg = {
        ALREADY_MARKED: "You've already marked attendance for this session",
        QR_EXPIRED: "This QR code has expired. Please scan the current one on the tutor's screen.",
      }[e.message]
        || (e.code === 'permission-denied' ? 'Attendance is not open for this session right now.' : null)
        || e.message || "Couldn't mark attendance";
      toast(msg, true);
    }
    navigation.goBack();
  };

  const onScanned = ({ data }) => {
    if (handled.current) return;
    handled.current = true;
    markAttendance(data);
  };

  if (!permission) return <Screen />;
  if (!permission.granted) {
    return (
      <Screen style={{ padding: 28, justifyContent: 'center' }}>
        <Text style={{ color: colors.textPrimary, fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
          Camera permission is needed to scan the attendance QR code.
        </Text>
        <PrimaryButton title="Allow Camera" onPress={requestPermission} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.accentBlue, textAlign: 'center', fontSize: 15 }}>Cancel</Text>
        </TouchableOpacity>
      </Screen>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={busy ? undefined : onScanned} />
      <View style={s.frame} pointerEvents="none" />
      <TouchableOpacity style={s.close} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={30} color="#fff" />
      </TouchableOpacity>
      <Text style={s.prompt}>{busy ? 'Checking schedule and location...' : "Scan your tutor's attendance QR code"}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  frame: { position: 'absolute', alignSelf: 'center', top: '30%', width: 250, height: 250, borderWidth: 3, borderColor: '#38bdf8', borderRadius: 16 },
  close: { position: 'absolute', top: 56, left: 20, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  prompt: { position: 'absolute', bottom: 90, alignSelf: 'center', color: '#fff', fontSize: 15, textAlign: 'center', paddingHorizontal: 24 },
});

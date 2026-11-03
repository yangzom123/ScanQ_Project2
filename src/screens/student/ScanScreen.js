import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { doc, runTransaction, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../../firebase';
import { Screen, PrimaryButton } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { colors } from '../../theme';

/**
 * Port of ScanQrActivity: scans the tutor's QR ("SessionID|Token") and
 * atomically writes an attendance record inside a Firestore transaction.
 */
export default function ScanScreen({ navigation }) {
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
      const moduleName = await runTransaction(db, async (txn) => {
        const snap = await txn.get(sessionRef);
        if (!snap.exists()) throw new Error("This QR code doesn't match any active session");
        const data = snap.data();
        if (data.endTime) throw new Error('SESSION_STOPPED');           // tutor closed it
        if (data.currentToken !== scannedToken) throw new Error('QR_EXPIRED'); // old screenshot
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
        SESSION_STOPPED: 'This session has been closed by the tutor',
        QR_EXPIRED: "This QR code has expired. Please scan the current one on the tutor's screen.",
      }[e.message] || e.message || "Couldn't mark attendance";
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
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={busy ? undefined : onScanned}
      />
      <View style={s.frame} pointerEvents="none" />
      <TouchableOpacity style={s.close} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={30} color={colors.white} />
      </TouchableOpacity>
      <Text style={s.prompt}>Scan your tutor's attendance QR code</Text>
    </View>
  );
}

const s = StyleSheet.create({
  frame: {
    position: 'absolute', alignSelf: 'center', top: '30%', width: 250, height: 250,
    borderWidth: 3, borderColor: colors.accentBlue, borderRadius: 16,
  },
  close: { position: 'absolute', top: 56, left: 20, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  prompt: { position: 'absolute', bottom: 90, alignSelf: 'center', color: colors.white, fontSize: 15, textAlign: 'center', paddingHorizontal: 24 },
});

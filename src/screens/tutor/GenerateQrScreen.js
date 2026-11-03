import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Screen, Label, Dropdown, PrimaryButton, Loading } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatTime, randomToken } from '../../utils';
import { colors } from '../../theme';

const REFRESH_INTERVAL = 10000; // 10 seconds

/** Port of GenerateQrActivity: create a session + a QR that rotates every 10 s. */
export default function GenerateQrScreen({ navigation }) {
  const { user } = useAuth();
  const toast = useToast();
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [session, setSession] = useState(null); // { id, module, token, label }
  const timer = useRef(null);
  const sessionIdRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'modules'), where('tutorId', '==', user.uid)));
        const opts = snap.docs.map((d) => ({
          id: d.id, name: d.data().name || '', code: d.data().code || '',
          enrolledCount: (d.data().enrolledStudentIds || []).length,
        }));
        if (opts.length === 0) {
          toast('Create a module first, then generate a QR for it', true);
          navigation.goBack();
          return;
        }
        setOptions(opts);
        setLoading(false);
      } catch (e) {
        toast(`Couldn't load your modules: ${e.message}`, true);
        navigation.goBack();
      }
    })();
    return () => clearInterval(timer.current); // onDestroy
  }, []);

  const generate = async () => {
    const module = options[selected];
    if (!module) return;
    setGenerating(true);
    const now = new Date();
    const date = formatDate(now), time = formatTime(now);
    const token = randomToken();
    try {
      const ref = await addDoc(collection(db, 'sessions'), {
        moduleId: module.id, moduleName: module.name, tutorId: user.uid,
        date, startTime: time, endTime: '',        // endTime is set when the tutor taps "Stop Session"
        totalStudents: module.enrolledCount, presentCount: 0,
        currentToken: token, createdAt: serverTimestamp(),
      });
      sessionIdRef.current = ref.id;
      setSession({ id: ref.id, token, label: `${module.code} - ${module.name}\n${date} at ${time}` });
      startRefresh(module);
    } catch (e) {
      toast(`Failed to create session: ${e.message}`, true);
      setGenerating(false);
    }
  };

  // Dynamic QR refresh loop: new token in Firestore + new QR every 10 s
  const startRefresh = (module) => {
    clearInterval(timer.current);
    timer.current = setInterval(async () => {
      const id = sessionIdRef.current;
      if (!id) return;
      const newToken = randomToken();
      const now = new Date();
      try {
        await updateDoc(doc(db, 'sessions', id), { currentToken: newToken });
        setSession({ id, token: newToken, label: `${module.code} - ${module.name}\n${formatDate(now)} at ${formatTime(now, true)}` });
      } catch (e) { /* ignore a failed tick, next one retries */ }
    }, REFRESH_INTERVAL);
  };

  const stop = async () => {
    clearInterval(timer.current);
    const id = sessionIdRef.current;
    if (!id) return;
    const stopTime = formatTime(new Date());
    try {
      await updateDoc(doc(db, 'sessions', id), { endTime: stopTime });
      toast(`Session stopped at ${stopTime}`);
    } catch (e) {
      toast(`Failed to stop session: ${e.message}`);
    }
    navigation.goBack();
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 28 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, justifyContent: 'center' }}>
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginLeft: 8 }}>Generate Attendance QR</Text>
        </View>

        {loading && <Loading />}

        {!loading && !session && (
          <View>
            <Label>Select Module</Label>
            <Dropdown
              options={options.map((o) => `${o.code} - ${o.name}`)}
              selectedIndex={selected}
              onSelect={setSelected}
            />
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 12 }}>
              This creates a fresh session and QR code. Students scan it to mark themselves present.
            </Text>
            <PrimaryButton title={generating ? 'Generating...' : 'Generate QR'} onPress={generate} disabled={generating} style={{ marginTop: 28 }} />
          </View>
        )}

        {session && (
          <View style={{ alignItems: 'center' }}>
            <View style={{ backgroundColor: colors.white, width: 240, height: 240, marginTop: 12, padding: 12, alignItems: 'center', justifyContent: 'center' }}>
              <QRCode value={`${session.id}|${session.token}`} size={216} />
            </View>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold', marginTop: 20, textAlign: 'center' }}>{session.label}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 8, textAlign: 'center' }}>Have students scan this to mark attendance</Text>
            <PrimaryButton title="Stop Session" onPress={stop} style={{ width: '100%', marginTop: 36 }} />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

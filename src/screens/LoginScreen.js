import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Screen, Field, Label, PrimaryButton } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { authErrorMessage } from '../utils';
import { colors } from '../theme';

export default function LoginScreen({ navigation, route }) {
  const role = route.params.role; // 'student' | 'tutor'
  const isStudent = role === 'student';
  const toast = useToast();
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const attemptLogin = async () => {
    const id = idNumber.trim();
    const pw = password.trim();
    if (!id || !pw) { toast('Please fill in all fields'); return; }
    setLoading(true);
    try {
      // 1) find the account's email via its Student/Tutor ID
      const snap = await getDocs(query(
        collection(db, 'users'), where('idNumber', '==', id), where('role', '==', role), limit(1)
      ));
      if (snap.empty) {
        setLoading(false);
        toast(`No account found with this ${isStudent ? 'Student' : 'Tutor'} ID.`);
        return;
      }
      const email = snap.docs[0].data().email;
      if (!email) {
        setLoading(false);
        toast('This account is missing an email on file. Contact support.', true);
        return;
      }
      // 2) sign in with Firebase Auth. AuthContext then routes to the right dashboard.
      try {
        await signInWithEmailAndPassword(auth, email, pw);
        toast('Login successful');
      } catch (e) {
        setLoading(false);
        toast(authErrorMessage(e), true);
      }
    } catch (e) {
      setLoading(false);
      toast(`Couldn't reach the database (${e.message}). Check your Firestore rules/connection.`, true);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 28 }} keyboardShouldPersistTaps="handled">
          <View style={{ backgroundColor: colors.cardDark, padding: 28 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>
              {isStudent ? 'Student Login' : 'Tutor Login'}
            </Text>
            <Label style={{ marginTop: 28 }}>{isStudent ? 'Student ID' : 'Tutor ID'}</Label>
            <Field value={idNumber} onChangeText={setIdNumber} editable={!loading} placeholder={isStudent ? 'Student ID' : 'Tutor ID'} />
            <Label style={{ marginTop: 20 }}>Password</Label>
            <Field value={password} onChangeText={setPassword} editable={!loading} placeholder="Password" secureTextEntry />
            <PrimaryButton title={loading ? 'Logging in...' : 'Login'} onPress={attemptLogin} disabled={loading} style={{ marginTop: 28 }} />
            <TouchableOpacity onPress={() => navigation.navigate('Register', { role })}>
              <Text style={{ color: colors.accentBlue, fontSize: 14, textAlign: 'center', marginTop: 20 }}>
                Don't have an account? Register
              </Text>
            </TouchableOpacity>
          </View>
          {loading && <ActivityIndicator color={colors.accentBlue} size="large" style={{ position: 'absolute', alignSelf: 'center' }} />}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

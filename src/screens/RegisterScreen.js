import React, { useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, limit, getDocs, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Screen, Field, PrimaryButton } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { isValidEmail } from '../utils';
import { colors } from '../theme';
import { useTheme } from '../context/ThemeContext';

export default function RegisterScreen({ navigation, route }) {
  useTheme();
  const role = route.params.role;
  const isStudent = role === 'student';
  const toast = useToast();
  const { beginRegistration, finishRegistration } = useAuth();
  const [f, setF] = useState({ fullName: '', idNumber: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const set = (k) => (v) => { setF({ ...f, [k]: v }); setErrors({ ...errors, [k]: undefined }); };

  const goLogin = () => navigation.replace('Login', { role });

  const register = async () => {
    const fullName = f.fullName.trim(), idNumber = f.idNumber.trim(), email = f.email.trim();
    const password = f.password.trim(), confirm = f.confirm.trim();
    if (!fullName || !idNumber || !email || !password || !confirm) { toast('Please fill in all fields'); return; }
    if (!isValidEmail(email)) { setErrors({ email: 'Enter a valid email address' }); return; }
    if (password.length < 6) { setErrors({ password: 'Password must contain at least 6 characters' }); return; }
    if (password !== confirm) { setErrors({ confirm: 'Passwords do not match' }); return; }

    setLoading(true);
    try {
      // Does the Student/Tutor ID already exist?
      const existing = await getDocs(query(collection(db, 'users'), where('idNumber', '==', idNumber), limit(1)));
      if (!existing.empty) {
        toast('An account with this ID already exists. Please log in instead.', true);
        goLogin();
        return;
      }
      beginRegistration();
      let cred;
      try {
        cred = await createUserWithEmailAndPassword(auth, email, password);
      } catch (e) {
        await finishRegistration();
        setLoading(false);
        if (e.code === 'auth/email-already-in-use') {
          toast('Email is already registered. Please login.', true);
          goLogin();
        } else {
          toast(`Registration failed: ${e.message}`, true);
        }
        return;
      }
      try {
        await setDoc(doc(db, 'users', cred.user.uid), {
          uid: cred.user.uid, fullName, idNumber, email, role, profilePhotoUrl: '', createdDate: Date.now(),
        });
        await finishRegistration(); // -> navigator switches to the dashboard
      } catch (e) {
        await finishRegistration();
        setLoading(false);
        toast(`Unable to save ${role} profile: ${e.message}`, true);
      }
    } catch (e) {
      setLoading(false);
      toast(`Error checking ID: ${e.message}`, true);
    }
  };

  const Err = ({ k }) => (errors[k] ? <Text style={{ color: colors.warningRed, fontSize: 12, marginTop: 4 }}>{errors[k]}</Text> : null);

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 28 }} keyboardShouldPersistTaps="handled">
          <View style={{ backgroundColor: colors.cardDark, padding: 28 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>
              {isStudent ? 'Student Register' : 'Tutor Register'}
            </Text>
            <Field style={{ marginTop: 28 }} placeholder="Full Name" value={f.fullName} onChangeText={set('fullName')} autoCapitalize="words" />
            <Field style={{ marginTop: 14 }} placeholder={isStudent ? 'Student ID' : 'Tutor ID'} value={f.idNumber} onChangeText={set('idNumber')} />
            <Field style={{ marginTop: 14 }} placeholder="Email" value={f.email} onChangeText={set('email')} keyboardType="email-address" />
            <Err k="email" />
            <Field style={{ marginTop: 14 }} placeholder="Password" value={f.password} onChangeText={set('password')} secureTextEntry />
            <Err k="password" />
            <Field style={{ marginTop: 14 }} placeholder="Confirm Password" value={f.confirm} onChangeText={set('confirm')} secureTextEntry />
            <Err k="confirm" />
            <PrimaryButton title={loading ? 'Registering...' : 'Register'} onPress={register} disabled={loading} style={{ marginTop: 24 }} />
            <TouchableOpacity onPress={goLogin}>
              <Text style={{ color: colors.accentBlue, fontSize: 14, textAlign: 'center', marginTop: 18 }}>
                Already have an account? Login
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

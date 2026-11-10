import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { Screen, Field, Label, Avatar, PrimaryButton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme';
import { runOnlineWrite } from '../services/network';
import { safeBack } from '../navigation/safeBack';

export default function EditProfileScreen({ navigation }) {
  useTheme();
  const { user, profile, refreshProfile } = useAuth();
  const toast = useToast();
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [photo, setPhoto] = useState(profile?.profilePhotoUrl || '');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);

  // The photo is stored (small, compressed) inside the user document, so no Firebase Storage plan is needed
  const pickPhoto = async () => {
    try {
      const current = await ImagePicker.getMediaLibraryPermissionsAsync();
      const permission = current.granted ? current : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        if (!permission.canAskAgain) {
          Alert.alert('Photo access is off', 'Allow photo access in Settings to choose a profile picture.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]);
        } else {
          toast('Photo access is needed to choose a profile picture.', true);
        }
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.15, base64: true,
      });
      if (res.canceled) return;
      const b64 = res.assets[0].base64;
      if (!b64) { toast("Couldn't read that photo"); return; }
      if (b64.length > 600000) { toast('Photo is too large. Please pick a smaller image.', true); return; }
      setPhoto(`data:image/jpeg;base64,${b64}`);
    } catch (e) {
      toast(`Couldn't choose a photo: ${e.message}`, true);
    }
  };

  const save = async () => {
    const name = fullName.trim();
    if (!name) { toast('Name cannot be empty'); return; }
    const changingPw = currentPw || newPw || confirmPw;
    if (changingPw) {
      if (!currentPw) { toast('Enter your current password'); return; }
      if (newPw.length < 6) { toast('New password must contain at least 6 characters'); return; }
      if (newPw !== confirmPw) { toast('New passwords do not match'); return; }
    }
    setSaving(true);
    try {
      if (changingPw) {
        const cred = EmailAuthProvider.credential(user.email, currentPw);
        await reauthenticateWithCredential(user, cred); // Firebase requires a recent login to change a password
        await updatePassword(user, newPw);
      }
      await runOnlineWrite(() => runTransaction(db, async (txn) => {
        const ref = doc(db, 'users', user.uid);
        const snap = await txn.get(ref);
        if (!snap.exists()) throw new Error('PROFILE_NOT_FOUND');
        txn.update(ref, { fullName: name, profilePhotoUrl: photo });
      }));
      await refreshProfile();
      toast('Profile updated');
      safeBack(navigation, profile?.role === 'tutor' ? 'TutorTabs' : 'StudentTabs');
    } catch (e) {
      const bad = e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password';
      toast(bad ? 'Current password is incorrect' : `Update failed: ${e.message}`, true);
      setSaving(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <TouchableOpacity onPress={() => safeBack(navigation, profile?.role === 'tutor' ? 'TutorTabs' : 'StudentTabs')} style={{ width: 40, height: 40, justifyContent: 'center' }}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginLeft: 8 }}>Edit Profile</Text>
          </View>

          <View style={{ alignItems: 'center' }}>
            <TouchableOpacity onPress={pickPhoto} activeOpacity={0.8}>
              <Avatar uri={photo} role={profile?.role} size={110} />
            </TouchableOpacity>
            <TouchableOpacity onPress={pickPhoto}><Text style={{ color: colors.accentBlue, fontSize: 14, marginTop: 10 }}>Change photo</Text></TouchableOpacity>
            {!!photo && <TouchableOpacity onPress={() => setPhoto('')}><Text style={{ color: colors.warningRed, fontSize: 13, marginTop: 6 }}>Remove photo</Text></TouchableOpacity>}
          </View>

          <Label style={{ marginTop: 28 }}>Full Name</Label>
          <Field value={fullName} onChangeText={setFullName} autoCapitalize="words" placeholder="Full Name" />

          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold', marginTop: 32 }}>Change Password (optional)</Text>
          <Field placeholder="Current password" value={currentPw} onChangeText={setCurrentPw} secureTextEntry />
          <Field placeholder="New password" value={newPw} onChangeText={setNewPw} secureTextEntry />
          <Field placeholder="Confirm new password" value={confirmPw} onChangeText={setConfirmPw} secureTextEntry />

          <PrimaryButton title={saving ? 'Saving...' : 'Save Changes'} onPress={save} disabled={saving} style={{ marginTop: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

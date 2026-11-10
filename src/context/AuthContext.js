import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../firebase';
import { isOfflineError, withTimeout } from '../services/network';

const AuthCtx = createContext(null);
const profileCacheKey = (uid) => `scanq_profile_${uid}`;
export const useAuth = () => useContext(AuthCtx);

// Equivalent of StudentDashboardActivity.hasShownLowAttendanceWarning
export const warningState = { shown: false };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const registering = useRef(false);

  const loadProfile = useCallback(async (u) => {
    if (!u) { setProfile(null); return; }
    try {
      const snap = await withTimeout(getDoc(doc(db, 'users', u.uid)), 12000, 'PROFILE_LOAD_TIMEOUT');
      if (snap.exists()) {
        const nextProfile = { uid: u.uid, ...snap.data() };
        setProfile(nextProfile);
        AsyncStorage.setItem(profileCacheKey(u.uid), JSON.stringify(nextProfile)).catch(() => {});
      } else if (!registering.current) {
        // Some existing accounts were provisioned outside the app. Keep the session and
        // restore the profile that LoginScreen found by ID instead of bouncing to Welcome.
        const cached = await AsyncStorage.getItem(profileCacheKey(u.uid));
        if (cached) setProfile(JSON.parse(cached));
      }
    } catch (e) {
      if (isOfflineError(e)) {
        try {
          const cached = await AsyncStorage.getItem(profileCacheKey(u.uid));
          if (cached) setProfile(JSON.parse(cached));
        } catch (_) { /* keep the authenticated user even if the local cache is unreadable */ }
      } else if (e.code === 'permission-denied' || e.message === 'PROFILE_LOAD_TIMEOUT') {
        // A Firestore rules mismatch or stalled read must not silently turn login into logout.
        try {
          const cached = await AsyncStorage.getItem(profileCacheKey(u.uid));
          if (cached) setProfile(JSON.parse(cached));
        } catch (_) { /* retain any profile already supplied by the login screen */ }
      } else if (!registering.current) {
        await signOut(auth);
        setProfile(null);
      }
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      await loadProfile(u);
      setLoading(false);
    });
    return unsub;
  }, [loadProfile]);

  const beginRegistration = () => { registering.current = true; };
  const acceptLoginProfile = (nextProfile) => {
    setProfile(nextProfile);
    AsyncStorage.setItem(profileCacheKey(nextProfile.uid), JSON.stringify(nextProfile)).catch(() => {});
  };
  const finishRegistration = (savedProfile) => {
    registering.current = false;
    if (savedProfile) {
      setProfile(savedProfile);
      AsyncStorage.setItem(profileCacheKey(savedProfile.uid), JSON.stringify(savedProfile)).catch(() => {});
      return;
    }
    loadProfile(auth.currentUser);
  };
  const refreshProfile = () => loadProfile(auth.currentUser);
  const logout = async () => {
    warningState.shown = false;
    await signOut(auth);
    setProfile(null);
    if (user?.uid) await AsyncStorage.removeItem(profileCacheKey(user.uid)).catch(() => {});
  };

  return (
    <AuthCtx.Provider value={{ user, profile, loading, beginRegistration, finishRegistration, acceptLoginProfile, refreshProfile, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

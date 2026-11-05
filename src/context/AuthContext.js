import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../firebase';
import { isOfflineError } from '../services/network';

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
      const snap = await getDoc(doc(db, 'users', u.uid));
      if (snap.exists()) {
        const nextProfile = { uid: u.uid, ...snap.data() };
        setProfile(nextProfile);
        AsyncStorage.setItem(profileCacheKey(u.uid), JSON.stringify(nextProfile)).catch(() => {});
      } else if (!registering.current) {
        await signOut(auth); // same as WelcomeActivity: no profile document -> sign out
        setProfile(null);
        AsyncStorage.removeItem(profileCacheKey(u.uid)).catch(() => {});
      }
    } catch (e) {
      if (isOfflineError(e)) {
        try {
          const cached = await AsyncStorage.getItem(profileCacheKey(u.uid));
          if (cached) setProfile(JSON.parse(cached));
        } catch (_) { /* keep the authenticated user even if the local cache is unreadable */ }
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
  const finishRegistration = async () => {
    registering.current = false;
    await loadProfile(auth.currentUser);
  };
  const refreshProfile = () => loadProfile(auth.currentUser);
  const logout = async () => {
    warningState.shown = false;
    await signOut(auth);
    setProfile(null);
    if (user?.uid) await AsyncStorage.removeItem(profileCacheKey(user.uid)).catch(() => {});
  };

  return (
    <AuthCtx.Provider value={{ user, profile, loading, beginRegistration, finishRegistration, refreshProfile, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

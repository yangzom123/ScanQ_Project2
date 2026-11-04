import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthCtx = createContext(null);
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
        setProfile({ uid: u.uid, ...snap.data() });
      } else if (!registering.current) {
        await signOut(auth); // same as WelcomeActivity: no profile document -> sign out
        setProfile(null);
      }
    } catch (e) {
      if (!registering.current) { await signOut(auth); setProfile(null); }
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
  };

  return (
    <AuthCtx.Provider value={{ user, profile, loading, beginRegistration, finishRegistration, refreshProfile, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

import React, { useState, useCallback } from 'react';
import { FlatList, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { collection, query, where, getDocs, doc, runTransaction } from 'firebase/firestore';
import { db } from '../../firebase';
import { Screen, TopBar, InputDialog, Empty } from '../../components/ui';
import { TutorModuleCard } from '../../components/Cards';
import { hashKey, newSalt } from '../../services/security';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { runOnlineWrite } from '../../services/network';

export default function TutorModules() {
  useTheme();
  const { user } = useAuth();
  const toast = useToast();
  const [modules, setModules] = useState([]);
  const [editing, setEditing] = useState(null);
  const [keyFor, setKeyFor] = useState(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const snap = await getDocs(query(collection(db, 'modules'), where('tutorId', '==', user.uid)));
      setModules(snap.docs.map((d) => ({
        moduleId: d.id, name: d.data().name || '', code: d.data().code || '',
        tutorId: user.uid, hasKey: !!d.data().enrollmentKeyHash,
      })));
    } catch (e) { toast(`Error: ${e.message}`); }
  }, [user, toast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const updateName = async (newName) => {
    const n = newName.trim(); const m = editing; setEditing(null);
    if (!n) return;
    try { await runOnlineWrite(() => runTransaction(db, async (txn) => {
      const ref = doc(db, 'modules', m.moduleId);
      const snap = await txn.get(ref);
      if (!snap.exists()) throw new Error('MODULE_NOT_FOUND');
      txn.update(ref, { name: n });
    })); toast('Module updated'); load(); }
    catch (e) { toast(`Update failed: ${e.message}`); }
  };

  // Set / change the enrollment key (stored as a salted SHA-256 hash)
  const saveKey = async (value) => {
    const k = value.trim(); const m = keyFor;
    if (k.length < 4) { toast('Enrollment key must be at least 4 characters'); return; }
    setKeyFor(null);
    try {
      const salt = newSalt();
      const enrollmentKeyHash = await hashKey(k, salt);
      await runOnlineWrite(() => runTransaction(db, async (txn) => {
        const ref = doc(db, 'modules', m.moduleId);
        const snap = await txn.get(ref);
        if (!snap.exists()) throw new Error('MODULE_NOT_FOUND');
        txn.update(ref, { keySalt: salt, enrollmentKeyHash });
      }));
      toast('Enrollment key saved');
      load();
    } catch (e) { toast(`Failed to save key: ${e.message}`); }
  };

  const confirmDelete = (module) =>
    Alert.alert('Delete Module', `Are you sure you want to delete '${module.name}'?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteModule(module.moduleId) },
    ]);

  const deleteModule = async (moduleId) => {
    try {
      const sessions = await getDocs(query(collection(db, 'sessions'), where('moduleId', '==', moduleId)));
      await runOnlineWrite(() => runTransaction(db, async (txn) => {
        const moduleRef = doc(db, 'modules', moduleId);
        const moduleSnap = await txn.get(moduleRef);
        if (!moduleSnap.exists()) throw new Error('MODULE_NOT_FOUND');
        const sessionSnaps = await Promise.all(sessions.docs.map((d) => txn.get(d.ref)));
        sessionSnaps.forEach((snap) => { if (snap.exists()) txn.delete(snap.ref); });
        txn.delete(moduleRef);
      }));
      toast('Module and its sessions deleted');
      load();
    } catch (e) { toast(`Delete failed: ${e.message}`); }
  };

  return (
    <Screen>
      <TopBar title="Manage Modules" />
      <FlatList
        contentContainerStyle={{ padding: 16 }}
        data={modules}
        keyExtractor={(m) => m.moduleId}
        renderItem={({ item }) => <TutorModuleCard module={item} onEdit={setEditing} onKey={setKeyFor} onDelete={confirmDelete} />}
        ListEmptyComponent={<Empty text="No modules yet" />}
      />
      <InputDialog visible={!!editing} title="Edit Module Name" initialValue={editing?.name || ''} confirmText="Update"
        onConfirm={updateName} onCancel={() => setEditing(null)} />
      <InputDialog visible={!!keyFor} title={`Enrollment Key for ${keyFor?.code || ''}`} initialValue="" placeholder="New key (min 4 characters)"
        confirmText="Save" onConfirm={saveKey} onCancel={() => setKeyFor(null)} />
    </Screen>
  );
}

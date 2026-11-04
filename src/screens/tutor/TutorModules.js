import React, { useState, useCallback } from 'react';
import { FlatList, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { collection, query, where, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import { Screen, TopBar, InputDialog, Empty } from '../../components/ui';
import { TutorModuleCard } from '../../components/Cards';
import { hashKey, newSalt } from '../../services/security';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';

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
    try { await updateDoc(doc(db, 'modules', m.moduleId), { name: n }); toast('Module updated'); load(); }
    catch (e) { toast(`Update failed: ${e.message}`); }
  };

  // Set / change the enrollment key (stored as a salted SHA-256 hash)
  const saveKey = async (value) => {
    const k = value.trim(); const m = keyFor;
    if (k.length < 4) { toast('Enrollment key must be at least 4 characters'); return; }
    setKeyFor(null);
    try {
      const salt = newSalt();
      await updateDoc(doc(db, 'modules', m.moduleId), { keySalt: salt, enrollmentKeyHash: await hashKey(k, salt) });
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
      const batch = writeBatch(db);
      sessions.docs.forEach((d) => batch.delete(d.ref));
      batch.delete(doc(db, 'modules', moduleId));
      await batch.commit();
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

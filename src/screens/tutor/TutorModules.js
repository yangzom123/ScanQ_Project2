import React, { useState, useCallback } from 'react';
import { FlatList, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import { Screen, TopBar, InputDialog, Empty } from '../../components/ui';
import { TutorModuleCard } from '../../components/Cards';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function TutorModules() {
  const { user } = useAuth();
  const toast = useToast();
  const [modules, setModules] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const snap = await getDocs(query(collection(db, 'modules'), where('tutorId', '==', user.uid)));
      setModules(snap.docs.map((d) => ({ moduleId: d.id, name: d.data().name || '', code: d.data().code || '', tutorId: user.uid })));
    } catch (e) {
      toast(`Error: ${e.message}`);
    }
  }, [user, toast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const updateModule = async (newName) => {
    const n = newName.trim();
    const m = editing;
    setEditing(null);
    if (!n) return;
    try {
      await updateDoc(doc(db, 'modules', m.moduleId), { name: n });
      toast('Module updated');
      load();
    } catch (e) {
      toast(`Update failed: ${e.message}`);
    }
  };

  const confirmDelete = (module) =>
    Alert.alert('Delete Module', `Are you sure you want to delete '${module.name}'?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteModule(module.moduleId) },
    ]);

  // Deletes the module AND all of its sessions in one batch
  const deleteModule = async (moduleId) => {
    try {
      const sessions = await getDocs(query(collection(db, 'sessions'), where('moduleId', '==', moduleId)));
      const batch = writeBatch(db);
      sessions.docs.forEach((d) => batch.delete(d.ref));
      batch.delete(doc(db, 'modules', moduleId));
      await batch.commit();
      toast('Module and its sessions deleted');
      load();
    } catch (e) {
      try { await deleteDoc(doc(db, 'modules', moduleId)); load(); }
      catch { toast(`Cleanup failed: ${e.message}`); }
    }
  };

  return (
    <Screen>
      <TopBar title="Manage Modules" />
      <FlatList
        contentContainerStyle={{ padding: 16 }}
        data={modules}
        keyExtractor={(m) => m.moduleId}
        renderItem={({ item }) => <TutorModuleCard module={item} onEdit={setEditing} onDelete={confirmDelete} />}
        ListEmptyComponent={<Empty text="No modules yet" />}
      />
      <InputDialog
        visible={!!editing}
        title="Edit Module Name"
        initialValue={editing?.name || ''}
        confirmText="Update"
        onConfirm={updateModule}
        onCancel={() => setEditing(null)}
      />
    </Screen>
  );
}

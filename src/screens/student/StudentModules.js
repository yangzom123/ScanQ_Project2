import React, { useState, useCallback, useMemo } from 'react';
import { View, FlatList, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase';
import { Screen, TopBar, SearchInput, Empty, Loading } from '../../components/ui';
import { StudentModuleCard } from '../../components/Cards';
import { fetchStudentModules } from '../../services/data';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';

export default function StudentModules() {
  useTheme();
  const { user } = useAuth();
  const toast = useToast();
  const [all, setAll] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try { setAll(await fetchStudentModules(user.uid)); }
    catch (e) { toast(`Error: ${e.message}`); }
    finally { setLoading(false); }
  }, [user, toast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    return t ? all.filter((m) => m.name.toLowerCase().includes(t) || m.code.toLowerCase().includes(t)) : all;
  }, [all, search]);

  const unenroll = (module) =>
    Alert.alert('Unenroll Module', `Are you sure you want to unenroll from '${module.name}'?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unenroll',
        onPress: async () => {
          setLoading(true);
          try {
            await updateDoc(doc(db, 'modules', module.moduleId), { enrolledStudentIds: arrayRemove(user.uid) });
            toast('Successfully unenrolled');
            load();
          } catch (e) {
            setLoading(false);
            toast(`Unenrollment failed: ${e.message}`);
          }
        },
      },
    ]);

  return (
    <Screen>
      <TopBar title="My Modules" />
      <View style={{ paddingHorizontal: 16 }}>
        <SearchInput placeholder="Search your modules..." value={search} onChangeText={setSearch} />
      </View>
      {loading && <Loading style={{ marginTop: 16 }} />}
      <FlatList
        style={{ marginTop: 8 }}
        contentContainerStyle={{ padding: 16 }}
        data={filtered}
        keyExtractor={(m) => m.moduleId}
        renderItem={({ item }) => <StudentModuleCard module={item} onUnenroll={unenroll} />}
        ListEmptyComponent={!loading ? <Empty text="No modules found" /> : null}
      />
    </Screen>
  );
}

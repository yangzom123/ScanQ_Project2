import React, { useState, useCallback, useMemo } from 'react';
import { View, FlatList, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Screen, TopBar, SearchInput, Chip, Empty } from '../../components/ui';
import { SessionCard } from '../../components/Cards';
import { fetchTutorSessions } from '../../services/data';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function TutorRecords() {
  const { user } = useAuth();
  const toast = useToast();
  const [sessions, setSessions] = useState([]);
  const [moduleNames, setModuleNames] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null); // null = "All Modules"

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const mods = await getDocs(query(collection(db, 'modules'), where('tutorId', '==', user.uid)));
      setModuleNames(mods.docs.map((d) => d.data().name || 'Unknown'));
      setSessions(await fetchTutorSessions(user.uid));
    } catch (e) {
      toast(`Error: ${e.message}`);
    }
  }, [user, toast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    return sessions.filter((s) => s.moduleName.toLowerCase().includes(t) && (selected ? s.moduleName === selected : true));
  }, [sessions, search, selected]);

  return (
    <Screen>
      <TopBar title="Attendance Records" />
      <View style={{ paddingHorizontal: 16 }}>
        <SearchInput placeholder="Search by module name..." value={search} onChangeText={setSearch} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8, flexGrow: 0 }}>
          <Chip label="All Modules" selected={selected === null} onPress={() => setSelected(null)} />
          {moduleNames.map((n, i) => (
            <Chip key={n + i} label={n} selected={selected === n} onPress={() => setSelected(n)} />
          ))}
        </ScrollView>
      </View>
      <FlatList
        style={{ marginTop: 8 }}
        contentContainerStyle={{ padding: 16 }}
        data={filtered}
        keyExtractor={(s) => s.sessionId}
        renderItem={({ item }) => <SessionCard session={item} />}
        ListEmptyComponent={<Empty text="No records found" />}
      />
    </Screen>
  );
}

import React, { useState, useCallback, useMemo } from 'react';
import { View, FlatList, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, TopBar, SearchInput, Chip, Empty, Loading } from '../../components/ui';
import { AttendanceCard } from '../../components/Cards';
import { fetchStudentHistory } from '../../services/data';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function StudentAttendance() {
  const { user } = useAuth();
  const toast = useToast();
  const [all, setAll] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try { setAll(await fetchStudentHistory(user.uid)); }
    catch (e) { toast(`Error: ${e.message}`); }
    finally { setLoading(false); }
  }, [user, toast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    return all.filter((r) =>
      r.moduleName.toLowerCase().includes(t) &&
      (filter === 'All' ? true : filter === 'Present' ? r.isPresent : !r.isPresent)
    );
  }, [all, search, filter]);

  return (
    <Screen>
      <TopBar title="Attendance History" />
      <View style={{ paddingHorizontal: 16 }}>
        <SearchInput placeholder="Search by module name..." value={search} onChangeText={setSearch} />
        <View style={{ flexDirection: 'row', marginTop: 8 }}>
          {['All', 'Present', 'Absent'].map((c) => (
            <Chip key={c} label={c} selected={filter === c} onPress={() => setFilter(c)} />
          ))}
        </View>
      </View>
      {loading && <Loading style={{ marginTop: 16 }} />}
      <FlatList
        style={{ marginTop: 8 }}
        contentContainerStyle={{ padding: 16 }}
        data={filtered}
        keyExtractor={(r) => r.sessionId}
        renderItem={({ item }) => <AttendanceCard item={item} />}
        ListEmptyComponent={!loading ? <Empty text="No records found" /> : null}
      />
    </Screen>
  );
}

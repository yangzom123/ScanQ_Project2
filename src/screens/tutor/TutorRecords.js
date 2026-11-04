import React, { useState, useCallback, useMemo } from 'react';
import { View, FlatList, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Screen, TopBar, SearchInput, Chip, Empty, PrimaryButton } from '../../components/ui';
import { SessionCard } from '../../components/Cards';
import ExportDialog from '../../components/ExportDialog';
import { fetchTutorSessions } from '../../services/data';
import { buildReport, exportCsv, exportPdf } from '../../services/reports';
import { startOfDay, endOfDay } from '../../utils';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';

export default function TutorRecords() {
  useTheme();
  const { user } = useAuth();
  const toast = useToast();
  const [sessions, setSessions] = useState([]);
  const [modules, setModules] = useState([]);      // [{moduleId, name, code}]
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);  // moduleId, null = "All Modules"
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const mods = await getDocs(query(collection(db, 'modules'), where('tutorId', '==', user.uid)));
      setModules(mods.docs.map((d) => ({ moduleId: d.id, name: d.data().name || 'Unknown', code: d.data().code || '' })));
      setSessions(await fetchTutorSessions(user.uid));
    } catch (e) { toast(`Error: ${e.message}`); }
  }, [user, toast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    return sessions.filter((s) => s.moduleName.toLowerCase().includes(t) && (selected ? s.moduleId === selected : true));
  }, [sessions, search, selected]);

  const selectedModule = modules.find((m) => m.moduleId === selected);
  const moduleSessions = sessions.filter((s) => s.moduleId === selected);
  const earliest = moduleSessions.length ? new Date(Math.min(...moduleSessions.map((s) => s.createdAt || Date.now()))) : new Date();

  const openExport = () => {
    if (!selectedModule) { toast('Select a module first, then tap Export Report'); return; }
    setExportOpen(true);
  };

  const doExport = async (kind, from, to) => {
    if (from > to) { toast('"From" date must be before "To" date'); return; }
    setExporting(true);
    try {
      const inRange = moduleSessions
        .filter((s) => !s.createdAt || (s.createdAt >= startOfDay(from).getTime() && s.createdAt <= endOfDay(to).getTime()))
        .sort((a, b) => a.createdAt - b.createdAt);
      const report = await buildReport(selectedModule, inRange);
      const period = { from, to };
      if (kind === 'csv') await exportCsv(report, period); else await exportPdf(report, period);
      setExportOpen(false);
    } catch (e) {
      toast(`Export failed: ${e.message}`, true);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Screen>
      <TopBar title="Attendance Records" />
      <View style={{ paddingHorizontal: 16 }}>
        <SearchInput placeholder="Search by module name..." value={search} onChangeText={setSearch} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8, flexGrow: 0 }}>
          <Chip label="All Modules" selected={selected === null} onPress={() => setSelected(null)} />
          {modules.map((m) => <Chip key={m.moduleId} label={m.name} selected={selected === m.moduleId} onPress={() => setSelected(m.moduleId)} />)}
        </ScrollView>
        <PrimaryButton small title="Export Report (CSV / PDF)" onPress={openExport} style={{ marginTop: 12 }} />
      </View>
      <FlatList
        style={{ marginTop: 8 }}
        contentContainerStyle={{ padding: 16 }}
        data={filtered}
        keyExtractor={(s) => s.sessionId}
        renderItem={({ item }) => <SessionCard session={item} />}
        ListEmptyComponent={<Empty text="No records found" />}
      />
      <ExportDialog visible={exportOpen} moduleName={selectedModule ? `${selectedModule.code} - ${selectedModule.name}` : ''}
        defaultFrom={earliest} busy={exporting} onClose={() => setExportOpen(false)} onExport={doExport} />
    </Screen>
  );
}

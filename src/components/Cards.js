import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { Card, LightCard } from './ui';

/* item_module_student.xml */
export function StudentModuleCard({ module, onUnenroll }) {
  const p = module.attendancePercent;
  const good = p >= 90;
  const status = good ? (p >= 95 ? 'Excellent' : 'Good') : 'Below 90%';
  return (
    <LightCard style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.accentBlueDark, fontSize: 17, fontWeight: 'bold' }}>{module.code}</Text>
        <Text style={{ color: colors.textDark, fontSize: 13 }}>{module.name}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ color: colors.accentBlueDark, fontSize: 20, fontWeight: 'bold' }}>{p}%</Text>
        <Text style={{ color: good ? colors.successGreen : colors.warningRed, fontSize: 12 }}>{status}</Text>
      </View>
      {onUnenroll && (
        <TouchableOpacity onPress={() => onUnenroll(module)} style={{ width: 40, height: 40, marginLeft: 8, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="trash" size={22} color={colors.warningRed} />
        </TouchableOpacity>
      )}
    </LightCard>
  );
}

/* item_session_tutor.xml */
export function SessionCard({ session }) {
  const pct = session.totalStudents > 0 ? Math.floor((session.presentCount * 100) / session.totalStudents) : 0;
  return (
    <LightCard style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.accentBlueDark, fontSize: 16, fontWeight: 'bold' }}>{session.moduleName}</Text>
        <Text style={{ color: colors.textDark, fontSize: 12 }}>
          {session.date} : {session.startTime}-{session.endTime}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ color: colors.accentBlueDark, fontSize: 20, fontWeight: 'bold' }}>{pct}%</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
          Present: {session.presentCount}/{session.totalStudents}
        </Text>
      </View>
    </LightCard>
  );
}

/* item_module_tutor.xml */
export function TutorModuleCard({ module, onEdit, onDelete }) {
  return (
    <Card style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>{module.name}</Text>
        <TouchableOpacity onPress={() => onEdit(module)} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="pencil" size={22} color={colors.accentBlue} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(module)} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="trash" size={22} color={colors.warningRed} />
        </TouchableOpacity>
      </View>
      <Text style={{ color: colors.accentBlue, fontSize: 14, fontWeight: 'bold', marginTop: 4 }}>{module.code}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 8 }}>Module Code: {module.code}</Text>
    </Card>
  );
}

/* item_attendance_record.xml */
export function AttendanceCard({ item }) {
  const timeRange = item.endTime ? `${item.startTime} - ${item.endTime}` : item.startTime;
  return (
    <Card style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold' }}>{item.moduleName}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
          {item.date} • {timeRange}
        </Text>
      </View>
      <View style={{ backgroundColor: colors.white, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4 }}>
        <Text style={{ fontSize: 12, fontWeight: 'bold', color: item.isPresent ? colors.successGreen : colors.warningRed }}>
          {item.isPresent ? 'Present' : 'Absent'}
        </Text>
      </View>
    </Card>
  );
}

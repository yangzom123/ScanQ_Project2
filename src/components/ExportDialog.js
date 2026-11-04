import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { Label, PickerField, PrimaryButton, OutlineButton } from './ui';

/** Date-range picker + CSV / PDF buttons for the attendance report. */
export default function ExportDialog({ visible, moduleName, defaultFrom, busy, onClose, onExport }) {
  useTheme();
  const [from, setFrom] = useState(defaultFrom || new Date());
  const [to, setTo] = useState(new Date());
  useEffect(() => {
    if (visible) { setFrom(defaultFrom || new Date()); setTo(new Date()); }
  }, [visible]);

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 24 }}>
        <View style={{ backgroundColor: colors.cardDark, borderRadius: 20, padding: 24 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>Export Attendance Report</Text>
          <Text style={{ color: colors.accentBlue, fontSize: 14, marginTop: 4, marginBottom: 16 }}>{moduleName}</Text>
          <Label>From</Label>
          <PickerField value={from} mode="date" onChange={setFrom} />
          <Label style={{ marginTop: 12 }}>To</Label>
          <PickerField value={to} mode="date" onChange={setTo} />
          <PrimaryButton title={busy ? 'Preparing...' : 'Export as CSV'} disabled={busy} style={{ marginTop: 24 }} onPress={() => onExport('csv', from, to)} />
          <OutlineButton title="Export as PDF" style={{ marginTop: 12, opacity: busy ? 0.6 : 1 }} onPress={() => !busy && onExport('pdf', from, to)} />
          <TouchableOpacity onPress={onClose} style={{ padding: 14, alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 15 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

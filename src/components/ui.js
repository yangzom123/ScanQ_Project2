import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, FlatList, ActivityIndicator, Pressable, Platform, Image,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { formatDate, formatTime } from '../utils';

// Styles are built per render so they always use the current light/dark colours
const makeS = () => StyleSheet.create({
  topBar: { height: 64, paddingHorizontal: 16, justifyContent: 'center' },
  topBarTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' },
  input: {
    height: 52, backgroundColor: colors.white, borderRadius: 14, paddingHorizontal: 16,
    color: colors.textDark, fontSize: 15, marginTop: 8, borderWidth: 1, borderColor: colors.border,
  },
  dropdown: { flexDirection: 'row', alignItems: 'center' },
  btn: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  btnSmall: { height: 48, paddingHorizontal: 18 },
  btnText: { color: colors.white, fontSize: 16 },
  card: { backgroundColor: colors.cardDark, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.border },
  lightCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  chip: {
    backgroundColor: colors.cardDark, borderRadius: 8, paddingHorizontal: 14, height: 34,
    justifyContent: 'center', marginRight: 8, borderWidth: 1, borderColor: colors.border,
  },
  fab: {
    position: 'absolute', alignSelf: 'center', width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.accentBlue, alignItems: 'center', justifyContent: 'center', elevation: 6,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 28 },
  sheet: { backgroundColor: colors.white, borderRadius: 14, maxHeight: 320, overflow: 'hidden' },
  option: { paddingVertical: 16, paddingHorizontal: 18 },
  dialog: { backgroundColor: colors.cardDark, borderRadius: 20, padding: 24 },
});

/* ---- Screen wrapper ---- */
export function Screen({ children, style, edges = ['top'] }) {
  useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[{ flex: 1, backgroundColor: colors.bgDark, paddingTop: edges.includes('top') ? insets.top : 0 }, style]}>
      {children}
    </View>
  );
}

export function TopBar({ title }) {
  useTheme(); const s = makeS();
  return (<View style={s.topBar}><Text style={s.topBarTitle}>{title}</Text></View>);
}

/* ---- Inputs ---- */
export function Field({ style, ...props }) {
  useTheme(); const s = makeS();
  return <TextInput placeholderTextColor={colors.textSecondary} style={[s.input, style]} autoCapitalize="none" {...props} />;
}
export function SearchInput(props) {
  return <Field style={{ height: 48, fontSize: 14 }} autoCapitalize="none" {...props} />;
}
export function Label({ children, style }) {
  useTheme();
  return <Text style={[{ color: colors.textSecondary, fontSize: 14 }, style]}>{children}</Text>;
}

/* ---- Buttons ---- */
export function PrimaryButton({ title, onPress, disabled, style, small }) {
  useTheme(); const s = makeS();
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} disabled={disabled}
      style={[s.btn, small && s.btnSmall, { backgroundColor: colors.accentBlue, opacity: disabled ? 0.6 : 1 }, style]}>
      <Text style={[s.btnText, small && { fontSize: 13 }]}>{title}</Text>
    </TouchableOpacity>
  );
}
export function OutlineButton({ title, onPress, color, style }) {
  useTheme(); const s = makeS();
  const c = color || colors.accentBlue;
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[s.btn, { borderWidth: 2, borderColor: c }, style]}>
      <Text style={[s.btnText, { color: c }]}>{title}</Text>
    </TouchableOpacity>
  );
}

/* ---- Cards ---- */
export const Card = ({ children, style }) => { useTheme(); return <View style={[makeS().card, style]}>{children}</View>; };
export const LightCard = ({ children, style }) => { useTheme(); return <View style={[makeS().lightCard, style]}>{children}</View>; };

export function Chip({ label, selected, onPress }) {
  useTheme(); const s = makeS();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[s.chip, selected && { backgroundColor: colors.accentBlue }]}>
      <Text style={{ color: selected ? colors.white : colors.textPrimary, fontSize: 14 }}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Fab({ icon, onPress, bottom }) {
  useTheme(); const s = makeS();
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[s.fab, { bottom }]}>
      <Ionicons name={icon} size={28} color={colors.white} />
    </TouchableOpacity>
  );
}

export const Empty = ({ text }) => {
  useTheme();
  return <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 24, fontSize: 14 }}>{text}</Text>;
};
export const Loading = ({ style }) => { useTheme(); return <ActivityIndicator color={colors.accentBlue} size="large" style={style} />; };

/* ---- Round profile picture (photo, or role icon when there is none) ---- */
export function Avatar({ uri, role, size = 52 }) {
  useTheme();
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      backgroundColor: 'rgba(56,189,248,0.07)', borderWidth: 1, borderColor: 'rgba(56,189,248,0.13)',
    }}>
      {uri ? <Image source={{ uri }} style={{ width: size, height: size }} />
        : <Ionicons name={role === 'tutor' ? 'school' : 'person'} size={size * 0.5} color={colors.accentBlue} />}
    </View>
  );
}

/* ---- Dropdown (Spinner) ---- */
export function Dropdown({ options, selectedIndex, onSelect }) {
  useTheme(); const s = makeS();
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity style={[s.input, s.dropdown]} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Text style={{ color: colors.textDark, fontSize: 15, flex: 1 }} numberOfLines={1}>{options[selectedIndex]}</Text>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable style={s.overlay} onPress={() => setOpen(false)}>
          <View style={s.sheet}>
            <FlatList
              data={options}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item, index }) => (
                <TouchableOpacity style={s.option} onPress={() => { onSelect(index); setOpen(false); }}>
                  <Text style={{ color: index === selectedIndex ? colors.accentBlueDark : colors.textDark, fontSize: 16 }}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

/* ---- Date / time field. Android uses the system dialog, iOS a spinner sheet ---- */
export function PickerField({ value, mode, onChange, minimumDate }) {
  useTheme(); const s = makeS();
  const [show, setShow] = useState(false);
  const text = mode === 'date' ? formatDate(value) : formatTime(value);
  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value, mode, is24Hour: false, minimumDate,
        onChange: (e, d) => { if (e.type === 'set' && d) onChange(d); },
      });
    } else setShow(true);
  };
  return (
    <>
      <TouchableOpacity style={[s.input, s.dropdown]} onPress={open} activeOpacity={0.8}>
        <Text style={{ color: colors.textDark, fontSize: 15, flex: 1 }}>{text}</Text>
        <Ionicons name={mode === 'date' ? 'calendar' : 'time'} size={20} color={colors.textSecondary} />
      </TouchableOpacity>
      {Platform.OS === 'ios' && (
        <Modal transparent animationType="fade" visible={show} onRequestClose={() => setShow(false)}>
          <Pressable style={s.overlay} onPress={() => setShow(false)}>
            <Pressable style={[s.sheet, { maxHeight: undefined }]} onPress={() => {}}>
              <DateTimePicker value={value} mode={mode} display="spinner" themeVariant="light" minimumDate={minimumDate}
                onChange={(e, d) => { if (d) onChange(d); }} />
              <TouchableOpacity onPress={() => setShow(false)} style={{ padding: 14, alignItems: 'center' }}>
                <Text style={{ color: colors.accentBlueDark, fontSize: 16, fontWeight: '600' }}>Done</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

/* ---- Dialog with a text input ---- */
export function InputDialog({ visible, title, initialValue, placeholder, confirmText, onConfirm, onCancel }) {
  useTheme(); const s = makeS();
  const [value, setValue] = useState(initialValue);
  React.useEffect(() => { setValue(initialValue); }, [initialValue, visible]);
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={s.overlay}>
        <View style={s.dialog}>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>{title}</Text>
          <TextInput value={value} onChangeText={setValue} autoFocus placeholder={placeholder} autoCapitalize="none"
            style={[s.input, { marginTop: 16 }]} placeholderTextColor={colors.textSecondary} />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 }}>
            <TouchableOpacity onPress={onCancel} style={{ padding: 10 }}>
              <Text style={{ color: colors.accentBlue, fontSize: 15, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onConfirm(value)} style={{ padding: 10, marginLeft: 8 }}>
              <Text style={{ color: colors.accentBlue, fontSize: 15, fontWeight: '600' }}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

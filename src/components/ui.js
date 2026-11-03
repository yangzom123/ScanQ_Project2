import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, FlatList, ActivityIndicator, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

/* ---- Screen wrapper (bg_dark) ---- */
export function Screen({ children, style, edges = ['top'] }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[{ flex: 1, backgroundColor: colors.bgDark, paddingTop: edges.includes('top') ? insets.top : 0 }, style]}>
      {children}
    </View>
  );
}

/* ---- Top bar: white 20sp bold title, 64dp high ---- */
export function TopBar({ title }) {
  return (
    <View style={s.topBar}>
      <Text style={s.topBarTitle}>{title}</Text>
    </View>
  );
}

/* ---- Inputs ---- */
export function Field({ style, ...props }) {
  return (
    <TextInput
      placeholderTextColor={colors.textSecondary}
      style={[s.input, style]}
      autoCapitalize="none"
      {...props}
    />
  );
}
export function SearchInput(props) {
  return <Field style={{ height: 48, fontSize: 14 }} autoCapitalize="none" {...props} />;
}
export function Label({ children, style }) {
  return <Text style={[{ color: colors.textSecondary, fontSize: 14 }, style]}>{children}</Text>;
}

/* ---- Buttons (28dp radius pill) ---- */
export function PrimaryButton({ title, onPress, disabled, style, small }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[s.btn, small && s.btnSmall, { backgroundColor: colors.accentBlue, opacity: disabled ? 0.6 : 1 }, style]}
    >
      <Text style={[s.btnText, small && { fontSize: 13 }]}>{title}</Text>
    </TouchableOpacity>
  );
}
export function OutlineButton({ title, onPress, color = colors.accentBlue, style }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[s.btn, { borderWidth: 2, borderColor: color }, style]}
    >
      <Text style={[s.btnText, { color }]}>{title}</Text>
    </TouchableOpacity>
  );
}

/* ---- Cards ---- */
export const Card = ({ children, style }) => <View style={[s.card, style]}>{children}</View>;
export const LightCard = ({ children, style }) => <View style={[s.lightCard, style]}>{children}</View>;

/* ---- Chips (ChipGroup single selection) ---- */
export function Chip({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[s.chip, selected && { backgroundColor: colors.accentBlue }]}
    >
      <Text style={{ color: colors.white, fontSize: 14 }}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ---- Round floating button (bg_circle_blue, 64dp) ---- */
export function Fab({ icon, onPress, bottom }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[s.fab, { bottom }]}>
      <Ionicons name={icon} size={28} color={colors.white} />
    </TouchableOpacity>
  );
}

/* ---- Centre empty / loading text ---- */
export const Empty = ({ text }) => (
  <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 24, fontSize: 14 }}>{text}</Text>
);
export const Loading = ({ style }) => (
  <ActivityIndicator color={colors.accentBlue} size="large" style={style} />
);

/* ---- Spinner-like dropdown (white bg_input) ---- */
export function Dropdown({ options, selectedIndex, onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity style={[s.input, s.dropdown]} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Text style={{ color: colors.textDark, fontSize: 15, flex: 1 }} numberOfLines={1}>
          {options[selectedIndex]}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable style={s.overlay} onPress={() => setOpen(false)}>
          <View style={s.sheet}>
            <FlatList
              data={options}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={s.option}
                  onPress={() => { onSelect(index); setOpen(false); }}
                >
                  <Text style={{ color: index === selectedIndex ? colors.accentBlueDark : colors.textDark, fontSize: 16 }}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

/* ---- Dialog with a text input (used for "Edit Module Name") ---- */
export function InputDialog({ visible, title, initialValue, confirmText, onConfirm, onCancel }) {
  const [value, setValue] = useState(initialValue);
  React.useEffect(() => { setValue(initialValue); }, [initialValue, visible]);
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={s.overlay}>
        <View style={s.dialog}>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>{title}</Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            autoFocus
            style={[s.input, { marginTop: 16 }]}
            placeholderTextColor={colors.textSecondary}
          />
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

const s = StyleSheet.create({
  topBar: { height: 64, paddingHorizontal: 16, justifyContent: 'center' },
  topBarTitle: { color: colors.white, fontSize: 20, fontWeight: 'bold' },
  input: {
    height: 52, backgroundColor: colors.white, borderRadius: 14, paddingHorizontal: 16,
    color: colors.textDark, fontSize: 15, marginTop: 8,
  },
  dropdown: { flexDirection: 'row', alignItems: 'center' },
  btn: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  btnSmall: { height: 48, paddingHorizontal: 18 },
  btnText: { color: colors.white, fontSize: 16 },
  card: { backgroundColor: colors.cardDark, borderRadius: 20, padding: 16 },
  lightCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16 },
  chip: {
    backgroundColor: colors.cardDark, borderRadius: 8, paddingHorizontal: 14, height: 34,
    justifyContent: 'center', marginRight: 8,
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

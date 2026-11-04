// Palette. `colors` is ONE shared object whose values are swapped by applyTheme()
// (see context/ThemeContext.js), so every screen reads the current theme at render time.
const dark = {
  bgDark: '#0f172a', cardDark: '#293548', cardDarkLight: '#1F2C44',
  accentBlue: '#38bdf8', accentBlueDark: '#1E8FD1',
  white: '#FFFFFF', textPrimary: '#FFFFFF', textSecondary: '#64748b', textDark: '#1e293b',
  successGreen: '#3ED598', warningRed: '#E0645B',
  border: 'transparent', logoBorder: '#FFFFFF',
};
const light = {
  bgDark: '#F1F5F9', cardDark: '#FFFFFF', cardDarkLight: '#E2E8F0',
  accentBlue: '#0284c7', accentBlueDark: '#0369a1',
  white: '#FFFFFF', textPrimary: '#0f172a', textSecondary: '#64748b', textDark: '#1e293b',
  successGreen: '#16a34a', warningRed: '#dc2626',
  border: '#CBD5E1', logoBorder: '#CBD5E1',
};

export const colors = { ...dark };
export const applyTheme = (mode) => Object.assign(colors, mode === 'light' ? light : dark);

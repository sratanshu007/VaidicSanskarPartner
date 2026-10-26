import { StyleSheet, Platform } from 'react-native';
import colors from './colors';

// Serif display font (headings, titles) — matching VaidicSanskar-v2
export const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' });

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 100 };
export function shadow(elevation = 3) {
  const elev = typeof elevation === 'number' ? elevation : 3;
  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: Math.max(1, Math.round(elev / 2)) },
    shadowOpacity: Math.min(0.2, 0.05 + elev * 0.015),
    shadowRadius: Math.max(2, elev * 2),
    elevation: elev,
  };
}

// Assign properties directly to function so both `...shadow` and `...shadow(x)` work
Object.assign(shadow, {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 3,
});

export const g = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadow },
  h1: { fontFamily: serif, fontSize: 24, fontWeight: '800', color: colors.maroon },
  h2: { fontFamily: serif, fontSize: 19, fontWeight: '700', color: colors.maroon },
  muted: { fontSize: 13, color: colors.textMuted },
});

export default g;


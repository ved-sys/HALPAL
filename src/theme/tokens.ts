// Design tokens for Kaam ("work" — Tamil/Hindi).
// Direction: a digital job board, not a generic gig-app template.
// These jobs are currently arranged informally — word of mouth, a notice
// pinned to a board. The UI leans into that: job posts read like index
// cards, verification reads like a stamp of trust, not a corporate badge.
//
// Palette + type below are pinned to the "editorial" branch of
// kaam-design-reference.jsx (see themeFor() in that file) — warm
// terracotta/coral, italic Fraunces display, Manrope body, quieter
// outline-style chips. Values not covered by that reference (teal,
// danger, canvasAlt, borderStrong, white) are left as-is; revisit once
// the reference is extended to cover those roles.

export const colors = {
  // Canvas — reference bg/surface
  canvas: '#FCF2E5',
  canvasAlt: '#E8E1D0', // not in reference — unchanged
  surface: '#FFFAF1',
  surfaceRaised: '#FFFFFF', // not in reference — unchanged

  // Ink
  ink: '#524646',
  inkSoft: '#7a6a67',
  inkFaint: '#A8A492',
  border: '#EADFCB',
  borderStrong: '#C7BB9E', // not in reference — unchanged

  // Primary — coral/terracotta, deliberately not turmeric anymore
  primary: '#EC5B38',
  primaryDark: '#B23F1F',
  primarySoft: '#FDE0D2',
  onPrimary: '#FFFFFF', // reference renders white text on primary fills/pills

  // Muted — reference's separate muted/mutedSoft role (distinct from ink*
  // even though muted === inkFaint in the reference's own P object)
  muted: '#A8A492',
  mutedSoft: '#E5E1D3',

  // Secondary — deep teal, used for trust/verification signals.
  // Not present in the reference; unchanged for now.
  teal: '#0E5C56',
  tealSoft: '#D6E8E5',
  onTeal: '#FFFFFF',

  // Danger / urgent — vermilion, reserved for SOS and disputes only.
  // Not present in the reference; unchanged for now.
  danger: '#C1432A',
  dangerSoft: '#F3D8CF',

  success: '#7a8a5e',
  successSoft: '#E7EDD9',

  white: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
  // Named to match the reference's t.radiusCard / t.radiusBig (editorial theme)
  card: 18,
  big: 22,
} as const;

// Font families loaded via @expo-google-fonts/fraunces + /manrope in App.tsx
// (useFonts + loading gate). Keys are the exact export names from those
// packages so `fonts.display` etc. can be dropped straight into useFonts().
export const fonts = {
  display: 'Fraunces_400Regular_Italic',
  displayUpright: 'Fraunces_400Regular',
  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodySemiBold: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
} as const;

// Type scale — editorial theme: italic Fraunces display (weight 400, the
// italic does the work a bold weight would elsewhere), Manrope body.
export const type = {
  display: { fontFamily: fonts.display, fontSize: 30, fontWeight: '400' as const, fontStyle: 'italic' as const, letterSpacing: -0.6 },
  h1: { fontFamily: fonts.display, fontSize: 24, fontWeight: '400' as const, fontStyle: 'italic' as const, letterSpacing: -0.5 },
  h2: { fontFamily: fonts.display, fontSize: 19, fontWeight: '400' as const, fontStyle: 'italic' as const, letterSpacing: -0.4 },
  h3: { fontFamily: fonts.display, fontSize: 16, fontWeight: '400' as const, fontStyle: 'italic' as const, letterSpacing: -0.3 },
  body: { fontFamily: fonts.body, fontSize: 15, fontWeight: '400' as const, lineHeight: 21 },
  bodyStrong: { fontFamily: fonts.bodySemiBold, fontSize: 15, fontWeight: '600' as const, lineHeight: 21 },
  small: { fontFamily: fonts.body, fontSize: 13, fontWeight: '400' as const },
  smallStrong: { fontFamily: fonts.bodySemiBold, fontSize: 13, fontWeight: '700' as const },
  label: { fontFamily: fonts.bodyBold, fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.6 },
  mono: { fontFamily: fonts.body, fontSize: 13, fontWeight: '600' as const, fontVariant: ['tabular-nums'] as ['tabular-nums'] },
};

export const shadow = {
  card: {
    shadowColor: '#3A2E14',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  raised: {
    shadowColor: '#3A2E14',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6,
  },
};

// Non-color/type theme knobs from the reference's themeFor('editorial') that
// don't fit the buckets above — consumed by Pill/Blob in atoms.tsx.
export const themeMeta = {
  label: 'EDITORIAL',
  blobOpacity: 0.65,
  chipStyle: 'outline' as const,
} as const;

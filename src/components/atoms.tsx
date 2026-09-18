import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fonts, radius, spacing, themeMeta, type } from '@/theme/tokens';

export function Badge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'primary' | 'teal' | 'danger' | 'success';
}) {
  const toneMap: Record<string, { bg: string; fg: string }> = {
    neutral: { bg: colors.canvasAlt, fg: colors.inkSoft },
    primary: { bg: colors.primarySoft, fg: colors.primaryDark },
    teal: { bg: colors.tealSoft, fg: colors.teal },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    success: { bg: colors.successSoft, fg: colors.success },
  };
  const t = toneMap[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[type.label, { color: t.fg }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

export function VerificationStamp({ isVerified }: { isVerified: boolean }) {
  if (!isVerified) return <Badge label="Unverified" tone="neutral" />;
  return (
    <View style={styles.stampRow}>
      <Text style={[type.smallStrong, { color: colors.success }]}>✓ Verified</Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  style,
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'teal' | 'outline' | 'danger';
  style?: ViewStyle;
  disabled?: boolean;
}) {
  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'teal'
      ? colors.teal
      : variant === 'danger'
      ? colors.danger
      : 'transparent';
  const fg = variant === 'outline' ? colors.ink : variant === 'primary' ? colors.onPrimary : colors.white;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        variant === 'outline' && styles.buttonOutline,
        style,
      ]}
    >
      <Text style={[type.bodyStrong, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function RatingLine({ rating, count }: { rating: number; count: number }) {
  return (
    <View style={styles.ratingRow}>
      <Text style={[type.smallStrong, { color: colors.primaryDark }]}>★ {rating.toFixed(1)}</Text>
      <Text style={[type.small, { color: colors.inkFaint }]}>· {count} jobs done</Text>
    </View>
  );
}

// ── Reference primitives (kaam-design-reference.jsx, editorial theme) ──
// Pill, Blob, Avatar below are new additions that mirror the reference's
// components 1:1. They intentionally don't replace Badge/PrimaryButton/
// RatingLine above — screens still use those and haven't been migrated yet.

export type PillKind = 'soft' | 'primary' | 'outline' | 'sage' | 'muted';

const pillTone: Record<PillKind, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.primary, fg: colors.onPrimary },
  outline: { bg: 'transparent', fg: colors.ink, border: colors.border },
  sage: { bg: colors.successSoft, fg: colors.success },
  muted: { bg: colors.mutedSoft, fg: colors.inkSoft },
  soft: { bg: colors.primarySoft, fg: colors.primaryDark },
};

export function Pill({
  children,
  kind = 'soft',
  style,
}: {
  children: React.ReactNode;
  kind?: PillKind;
  style?: ViewStyle;
}) {
  const tone = pillTone[kind];
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: tone.bg },
        tone.border ? { borderWidth: 1, borderColor: tone.border } : null,
        style,
      ]}
    >
      <Text style={[styles.pillText, { color: tone.fg }]}>{children}</Text>
    </View>
  );
}

// Decorative background circle. The reference blurs its edge with a CSS
// filter — RN has no blur filter, so this is flat color + opacity only,
// same as the reference's own fallback note.
export function Blob({
  size = 200,
  color = colors.primary,
  opacity = themeMeta.blobOpacity,
  style,
}: {
  size?: number;
  color?: string;
  opacity?: number;
  style?: ViewStyle;
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function Avatar({
  name,
  color = colors.primary,
  size = 40,
}: {
  name: string;
  color?: string;
  size?: number;
}) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('');
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  stampRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOutline: {
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontFamily: fonts.bodyBold,
    fontWeight: '700',
    color: colors.white,
  },
});

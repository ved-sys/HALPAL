import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing, type } from '@/theme/tokens';
import { Blob, PrimaryButton } from '@/components/atoms';
import { useAppMode } from '@/state/AppMode';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

// Matches kaam-design-reference.jsx's LoginScreen (editorial theme): two
// background blobs, italic-Fraunces headline, pill phone/password fields,
// a role picker that doubles as the app's existing worker/customer mode
// switch, and a pill CTA. No real auth backend — Continue just enters the
// app; the role picked here is the same AppMode used throughout.
export function LoginScreen({ navigation }: Props) {
  const { mode, setMode } = useAppMode();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  function handleContinue() {
    navigation.replace('Tabs');
  }

  return (
    <View style={styles.root}>
      <Blob size={260} color={colors.primary} opacity={0.65} style={{ top: -80, right: -90 }} />
      <Blob size={140} color={colors.muted} opacity={0.5} style={{ top: 120, left: -50 }} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[type.label, { color: colors.primaryDark }]}>KAAM</Text>
          <Text style={styles.headline}>Odd jobs,{'\n'}done kindly.</Text>
          <Text style={styles.subtitle}>
            Sign in to post a small job or offer a skill to your neighbourhood.
          </Text>

          <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
            <FieldPill label="Phone">
              <Text style={styles.flagText}>🇮🇳 +91</Text>
              <View style={styles.divider} />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="98404 22188"
                placeholderTextColor={colors.inkFaint}
                keyboardType="phone-pad"
                style={styles.pillInput}
              />
            </FieldPill>

            <FieldPill label="Password">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.inkFaint}
                secureTextEntry
                style={[styles.pillInput, password ? { letterSpacing: 3 } : null]}
              />
            </FieldPill>
          </View>

          <View style={{ marginTop: spacing.lg }}>
            <Text style={styles.sectionLabel}>I'm joining as</Text>
            <View style={styles.roleRow}>
              <RoleCard
                label="Worker"
                sub="Offer skills, apply to jobs"
                active={mode === 'worker'}
                onPress={() => setMode('worker')}
              />
              <RoleCard
                label="Customer"
                sub="Post a job to get help"
                active={mode === 'customer'}
                onPress={() => setMode('customer')}
              />
            </View>
          </View>

          <PrimaryButton label="Continue" onPress={handleContinue} style={styles.continueBtn} />

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>New here? </Text>
            <Text style={styles.footerLink}>Create an account</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function FieldPill({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.pillField}>{children}</View>
    </View>
  );
}

function RoleCard({
  label,
  sub,
  active,
  onPress,
}: {
  label: string;
  sub: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.roleCard, active ? styles.roleCardActive : styles.roleCardInactive]}
    >
      {active && (
        <Blob size={60} color={colors.primary} opacity={0.9} style={{ top: -20, right: -20 }} />
      )}
      <Text style={[styles.roleLabel, { color: active ? colors.canvas : colors.ink }]}>{label}</Text>
      <Text style={[styles.roleSub, { color: active ? colors.canvas : colors.inkSoft, opacity: active ? 0.75 : 1 }]}>
        {sub}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas, overflow: 'hidden' },
  content: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxxl },
  headline: {
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontWeight: '400',
    fontSize: 40,
    lineHeight: 42,
    letterSpacing: -0.8,
    color: colors.ink,
    marginTop: spacing.xxxl,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkSoft,
    marginTop: spacing.md,
    maxWidth: 280,
  },
  fieldLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  pillField: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flagText: { fontFamily: fonts.body, fontSize: 14, color: colors.inkFaint },
  divider: { width: 1, height: 16, backgroundColor: colors.border },
  pillInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
    padding: 0,
  },
  sectionLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  roleRow: { flexDirection: 'row', gap: spacing.sm },
  roleCard: {
    flex: 1,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    borderRadius: radius.big,
    overflow: 'hidden',
    position: 'relative',
  },
  roleCardActive: { backgroundColor: colors.ink },
  roleCardInactive: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  roleLabel: {
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontWeight: '400',
    fontSize: 22,
    letterSpacing: -0.4,
  },
  roleSub: {
    fontFamily: fonts.body,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  continueBtn: {
    marginTop: spacing.xl,
    borderRadius: radius.pill,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  footerText: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft },
  footerLink: { fontFamily: fonts.bodyBold, fontSize: 13, fontWeight: '700', color: colors.primaryDark },
});

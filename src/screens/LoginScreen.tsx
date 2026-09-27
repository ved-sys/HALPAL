import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing, type } from '@/theme/tokens';
import { Blob, PrimaryButton } from '@/components/atoms';
import { useAppMode } from '@/state/AppMode';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { supabase } from '@/lib/supabase';
import { currentCustomer, currentWorker } from '@/data/mockData';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

type Step = 'phone' | 'code';

// Matches kaam-design-reference.jsx's LoginScreen (editorial theme): two
// background blobs, italic-Fraunces headline, pill phone field, pill CTA.
// Real Supabase phone-OTP auth — signInWithOtp sends the SMS code,
// verifyOtp confirms it and starts the session. AppMode defaults to
// 'customer' on first login; ProfileScreen's existing toggle still
// handles switching to worker mode afterward.
export function LoginScreen({ navigation }: Props) {
  const { setMode } = useAppMode();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const digits = phone.replace(/\D/g, '');
  // Supabase's configured test numbers use E.164-without-plus (e.g.
  // 919999999999), so prepend '91' rather than '+91'.
  const e164Phone = `91${digits}`;

  async function handleSendCode() {
    setError(null);
    if (digits.length !== 10) {
      setError('Enter a valid 10-digit phone number.');
      return;
    }
    setSending(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({ phone: e164Phone });
    setSending(false);
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setStep('code');
  }

  async function handleVerify() {
    setError(null);
    const token = code.trim();
    if (token.length !== 6) {
      setError('Enter the 6-digit code.');
      return;
    }
    setVerifying(true);
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone: e164Phone,
      token,
      type: 'sms',
    });
    setVerifying(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    const userId = data.session?.user.id ?? data.user?.id;
    if (userId) {
      currentCustomer.id = userId;
      currentWorker.id = userId;
    }
    setMode('customer');
    navigation.replace('Tabs');
  }

  function handleUseDifferentNumber() {
    setStep('phone');
    setCode('');
    setError(null);
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
          <Text style={styles.headline}>Simple work,{'\n'}better pay.</Text>
          <Text style={styles.subtitle}>
            Sign in to post a quick job, or pick up simple work nearby — better pay than delivery apps.
          </Text>

          <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
            <FieldPill label="Phone">
              <Text style={styles.flagText}>🇮🇳 +91</Text>
              <View style={styles.divider} />
              <TextInput
                value={phone}
                onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))}
                placeholder="98404 22188"
                placeholderTextColor={colors.inkFaint}
                keyboardType="phone-pad"
                editable={step === 'phone'}
                style={styles.pillInput}
              />
            </FieldPill>

            {step === 'code' && (
              <FieldPill label="Verification code">
                <TextInput
                  value={code}
                  onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  placeholderTextColor={colors.inkFaint}
                  keyboardType="number-pad"
                  autoFocus
                  style={[styles.pillInput, { letterSpacing: 3 }]}
                />
              </FieldPill>
            )}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {step === 'phone' ? (
            <PrimaryButton
              label={sending ? 'Sending code…' : 'Send code'}
              onPress={handleSendCode}
              disabled={sending}
              style={styles.continueBtn}
            />
          ) : (
            <>
              <PrimaryButton
                label={verifying ? 'Verifying…' : 'Verify'}
                onPress={handleVerify}
                disabled={verifying}
                style={styles.continueBtn}
              />
              <Pressable onPress={handleUseDifferentNumber} style={styles.footerRow}>
                <Text style={styles.footerLink}>Use a different number</Text>
              </Pressable>
            </>
          )}
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
  errorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.danger,
    marginTop: spacing.md,
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
  footerLink: { fontFamily: fonts.bodyBold, fontSize: 13, fontWeight: '700', color: colors.primaryDark },
});

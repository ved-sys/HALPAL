import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing, type } from '@/theme/tokens';
import { Blob, ErrorNote, PrimaryButton } from '@/components/atoms';
import { useStore } from '@/state/store';
import { useAuth } from '@/state/AuthContext';
import { NAME_MAX, validateFullName } from '@/lib/profileRules';

/**
 * Shown once, right after the first sign-in, while the profile still has
 * the placeholder name. RootNavigator decides when it appears. Saving a
 * real name refreshes the profile, and the navigator swaps to the tabs on
 * its own, so there is no navigation call here.
 */
export function NameSetupScreen() {
  const { profile, updateProfile } = useStore();
  const { signOut } = useAuth();
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameError = validateFullName(fullName);

  async function save() {
    if (saving || nameError || !profile) return;
    setError(null);
    setSaving(true);
    // Only the name changes here; everything else is passed through as-is.
    const res = await updateProfile({
      fullName: fullName.trim(),
      bio: profile.bio,
      skills: profile.skills,
      avatarColor: profile.avatarColor,
    });
    setSaving(false);
    if (!res.ok) setError(res.error);
  }

  return (
    <View style={styles.root}>
      <Blob size={220} color={colors.primary} opacity={0.55} style={{ top: -70, right: -80 }} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[type.label, { color: colors.primaryDark }]}>WELCOME TO HALPAL</Text>
          <Text style={styles.headline}>What should{'\n'}we call you?</Text>
          <Text style={[type.body, { color: colors.inkSoft, marginTop: spacing.md }]}>
            This is the name customers and workers will see on your jobs, applications and chats.
          </Text>

          <TextInput
            value={fullName}
            onChangeText={setFullName}
            maxLength={NAME_MAX}
            autoFocus
            autoCapitalize="words"
            placeholder="Your name"
            placeholderTextColor={colors.inkFaint}
            onSubmitEditing={() => void save()}
            style={styles.input}
          />
          {nameError && fullName.length > 0 ? (
            <Text style={[type.small, { color: colors.danger, marginTop: spacing.xs }]}>{nameError}</Text>
          ) : null}

          <PrimaryButton
            label={saving ? 'Saving…' : 'Continue'}
            disabled={saving || !!nameError}
            onPress={() => void save()}
            style={{ marginTop: spacing.xl, borderRadius: radius.pill }}
          />
          <ErrorNote message={error} />

          <Pressable onPress={() => void signOut()} style={{ marginTop: spacing.lg, alignSelf: 'center' }}>
            <Text style={[type.small, { color: colors.inkSoft }]}>Not you? Sign out</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas, overflow: 'hidden' },
  content: { padding: spacing.lg, paddingTop: spacing.xxxl },
  headline: {
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontWeight: '400',
    fontSize: 36,
    lineHeight: 40,
    color: colors.ink,
    marginTop: spacing.md,
  },
  input: {
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    fontSize: 16,
    color: colors.ink,
  },
});

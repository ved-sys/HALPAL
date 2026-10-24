import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, type } from '@/theme/tokens';
import { ErrorNote, PrimaryButton } from '@/components/atoms';
import { useStore } from '@/state/store';

const CONFIRM_WORD = 'DELETE';

export function DeleteAccountScreen() {
  const { deleteMyAccount } = useStore();
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmed = typed.trim() === CONFIRM_WORD;

  async function handleDelete() {
    if (!confirmed || deleting) return;
    setError(null);
    setDeleting(true);
    const res = await deleteMyAccount();
    // On success the session is gone and RootNavigator has already swapped
    // to Login, unmounting this screen, so there is nothing left to update.
    if (!res.ok) {
      setDeleting(false);
      // Shown as-is: the server's refusal (for example, active jobs) says
      // exactly what to do next.
      setError(res.error);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.warningBox}>
          <Text style={[type.h2, { color: colors.danger }]}>Delete your account?</Text>
          <Text style={[type.body, { color: colors.ink, marginTop: spacing.sm }]}>
            This permanently deletes your sign-in. It cannot be undone.
          </Text>
          <Text style={[type.small, { color: colors.inkSoft, marginTop: spacing.sm }]}>
            • Your profile is replaced by "Deleted user".{'\n'}• Your open jobs, applications, offerings and pending
            bookings are cancelled.{'\n'}• Past job records, reviews and chat messages stay visible to the other
            person on each job.
          </Text>
          <Text style={[type.small, { color: colors.inkSoft, marginTop: spacing.sm }]}>
            You can't delete your account while a job is under way, awaiting confirmation or disputed. Finish,
            cancel or resolve those first.
          </Text>
        </View>

        <Text style={[type.smallStrong, { color: colors.inkSoft, marginTop: spacing.xl }]}>
          Type {CONFIRM_WORD} to confirm
        </Text>
        <TextInput
          value={typed}
          onChangeText={setTyped}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!deleting}
          placeholder={CONFIRM_WORD}
          placeholderTextColor={colors.inkFaint}
          style={styles.input}
        />

        <PrimaryButton
          label={deleting ? 'Deleting…' : 'Delete my account'}
          variant="danger"
          disabled={!confirmed || deleting}
          onPress={() => void handleDelete()}
          style={{ marginTop: spacing.lg }}
        />
        <ErrorNote message={error} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  warningBox: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
    backgroundColor: colors.surface,
    fontSize: 15,
    letterSpacing: 2,
    color: colors.ink,
  },
});

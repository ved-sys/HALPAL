import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, type } from '@/theme/tokens';
import { PrimaryButton } from '@/components/atoms';

export function DeleteAccountScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}>
        <View style={styles.warningBox}>
          <Text style={[type.h2, { color: colors.danger }]}>Delete your account?</Text>
          <Text style={[type.body, { color: colors.ink, marginTop: spacing.sm }]}>
            This permanently removes your profile, your offerings and your sign-in. It cannot be undone.
          </Text>
          <Text style={[type.small, { color: colors.inkSoft, marginTop: spacing.sm }]}>
            Jobs you're part of, their chats and reviews may be kept where the other person still needs them,
            or while a dispute is open.
          </Text>
        </View>

        {/* TODO: wire this to a server-side account-deletion function once
            the backend has one. Deleting the auth user needs a privileged
            call that the client must not make itself, so there is nothing
            for this button to call yet. Do not delete anything client-side. */}
        <PrimaryButton
          label="Account deletion will be available soon"
          variant="danger"
          disabled
          onPress={() => {}}
          style={{ marginTop: spacing.xl }}
        />
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
});

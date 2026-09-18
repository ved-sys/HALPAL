import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadow, spacing, type } from '@/theme/tokens';
import { Avatar } from '@/components/WorkerCards';
import { RatingLine } from '@/components/atoms';
import { currentWorker } from '@/data/mockData';
import { useAppMode } from '@/state/AppMode';
import { useStore } from '@/state/store';

export function ProfileScreen() {
  const { mode, setMode } = useAppMode();
  const { currentWorkerVerified, verifyCurrentWorker } = useStore();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <View style={styles.header}>
          <Avatar name={currentWorker.fullName} color={currentWorker.avatarColor} size={64} />
          <View style={{ marginLeft: spacing.lg }}>
            <Text style={[type.h1, { color: colors.ink }]}>{currentWorker.fullName}</Text>
            <RatingLine rating={currentWorker.avgRating} count={currentWorker.totalJobsCompleted} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[type.label, { color: colors.inkFaint }]}>ACCOUNT MODE</Text>
          <Text style={[type.small, { color: colors.inkSoft, marginTop: 2, marginBottom: spacing.sm }]}>
            One account, two hats — switch to post jobs as a customer, or browse and apply as a worker.
          </Text>
          <View style={styles.modeToggle}>
            <ModeButton label="Worker" active={mode === 'worker'} onPress={() => setMode('worker')} />
            <ModeButton label="Customer" active={mode === 'customer'} onPress={() => setMode('customer')} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[type.label, { color: colors.inkFaint, marginBottom: spacing.sm }]}>VERIFICATION</Text>
          <View style={[styles.tierRow, shadow.card]}>
            <View style={[styles.tierDot, { backgroundColor: currentWorkerVerified ? colors.success : colors.border }]} />
            <View style={{ flex: 1 }}>
              <Text style={[type.bodyStrong, { color: colors.ink }]}>
                {currentWorkerVerified ? 'Verified' : 'Not verified'}
              </Text>
              <Text style={[type.small, { color: colors.inkFaint }]}>
                {currentWorkerVerified
                  ? 'Your ID has been verified.'
                  : 'Verify your ID to apply for jobs and post offerings.'}
              </Text>
            </View>
            {currentWorkerVerified ? (
              <Text style={[type.smallStrong, { color: colors.success }]}>✓ Done</Text>
            ) : (
              <Pressable style={styles.verifyBtn} onPress={verifyCurrentWorker}>
                <Text style={[type.smallStrong, { color: colors.primaryDark }]}>Verify your ID</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[type.label, { color: colors.inkFaint, marginBottom: spacing.sm }]}>SKILLS</Text>
          <View style={styles.skillRow}>
            {currentWorker.skills.map((s) => (
              <View key={s} style={styles.skillChip}>
                <Text style={[type.small, { color: colors.inkSoft }]}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ModeButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.modeBtn, active && styles.modeBtnActive]}>
      <Text style={[type.bodyStrong, { color: active ? colors.onPrimary : colors.inkSoft }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  section: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  modeToggle: { flexDirection: 'row', backgroundColor: colors.canvasAlt, borderRadius: radius.pill, padding: 4 },
  modeBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.pill, alignItems: 'center' },
  modeBtnActive: { backgroundColor: colors.primary },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  tierDot: { width: 10, height: 10, borderRadius: 5 },
  verifyBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  skillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  skillChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

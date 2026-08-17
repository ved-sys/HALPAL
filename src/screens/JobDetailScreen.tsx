import React, { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, type } from '@/theme/tokens';
import { PrimaryButton, VerificationStamp } from '@/components/atoms';
import { ApplicantRow } from '@/components/WorkerCards';
import { useStore } from '@/state/store';
import { useAppMode } from '@/state/AppMode';
import { currentWorker } from '@/data/mockData';
import { verificationTierLabel } from '@/types/models';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'JobDetail'>;

export function JobDetailScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const { jobs, applications, setApplicationStatus, addApplication } = useStore();
  const { mode } = useAppMode();
  const job = jobs.find((j) => j.id === jobId);
  const jobApplications = applications[jobId] ?? [];

  const [quotedRate, setQuotedRate] = useState(String(job?.budgetMin ?? ''));
  const [note, setNote] = useState('');
  const [applied, setApplied] = useState(false);

  if (!job) return null;

  const alreadyApplied = applied || jobApplications.some((a) => a.worker.id === currentWorker.id);
  const meetsVerification =
    currentWorker.verificationTier === 'level_3' ||
    (currentWorker.verificationTier === 'level_2' && job.minVerificationTierRequired !== 'level_3') ||
    (currentWorker.verificationTier === 'level_1' && job.minVerificationTierRequired === 'level_1');

  function submitApplication() {
    addApplication(job!.id, {
      id: `app_${Date.now()}`,
      jobId: job!.id,
      worker: currentWorker,
      quotedRate: Number(quotedRate) || job!.budgetMin,
      note: note.trim() || undefined,
      status: 'applied',
      appliedAt: new Date().toISOString(),
    });
    setApplied(true);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <View style={styles.headerCard}>
          <View style={styles.tagRow}>
            {job.categoryTags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={[type.label, { color: colors.inkSoft }]}>{tag.toUpperCase()}</Text>
              </View>
            ))}
          </View>
          <Text style={[type.h1, { color: colors.ink, marginTop: spacing.sm }]}>{job.description}</Text>

          <View style={styles.metaGrid}>
            <MetaItem label="Budget" value={`₹${job.budgetMin}–₹${job.budgetMax}`} />
            <MetaItem label="Location" value={job.locationLabel} />
            <MetaItem label="Timing" value={job.urgency === 'asap' ? 'ASAP' : 'Scheduled'} />
            <MetaItem label="Min. verification" value={verificationTierLabel[job.minVerificationTierRequired]} />
          </View>
        </View>

        {mode === 'worker' && (
          <View style={styles.section}>
            <Text style={[type.h2, { color: colors.ink }]}>Apply to this job</Text>

            {!meetsVerification ? (
              <View style={styles.warningBox}>
                <Text style={[type.small, { color: colors.danger }]}>
                  This job requires {verificationTierLabel[job.minVerificationTierRequired]}. Complete that
                  verification tier from your profile to apply.
                </Text>
              </View>
            ) : alreadyApplied ? (
              <View style={styles.infoBox}>
                <Text style={[type.body, { color: colors.teal }]}>
                  Application sent. You'll be notified if the customer accepts, shortlists, or rejects it.
                </Text>
              </View>
            ) : (
              <View>
                <Text style={[type.smallStrong, { color: colors.inkSoft, marginTop: spacing.md }]}>
                  Your quoted rate (₹)
                </Text>
                <TextInput
                  value={quotedRate}
                  onChangeText={setQuotedRate}
                  keyboardType="numeric"
                  style={styles.input}
                />
                <Text style={[type.smallStrong, { color: colors.inkSoft, marginTop: spacing.md }]}>
                  Note (optional)
                </Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="Anything the customer should know"
                  placeholderTextColor={colors.inkFaint}
                  multiline
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                />
                <PrimaryButton
                  label="Submit application"
                  onPress={submitApplication}
                  style={{ marginTop: spacing.lg }}
                />
              </View>
            )}
          </View>
        )}

        {mode === 'customer' && (
          <View style={styles.section}>
            <Text style={[type.h2, { color: colors.ink, marginBottom: spacing.sm }]}>
              Applications ({jobApplications.length})
            </Text>
            {jobApplications.length === 0 ? (
              <Text style={[type.body, { color: colors.inkFaint }]}>No applications yet.</Text>
            ) : (
              <FlatList
                data={jobApplications}
                keyExtractor={(a) => a.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <ApplicantRow
                    application={item}
                    onAccept={() => setApplicationStatus(job.id, item.id, 'accepted')}
                    onShortlist={() => setApplicationStatus(job.id, item.id, 'shortlisted')}
                    onReject={() => setApplicationStatus(job.id, item.id, 'rejected')}
                  />
                )}
              />
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={[type.label, { color: colors.inkFaint }]}>{label.toUpperCase()}</Text>
      <Text style={[type.bodyStrong, { color: colors.ink, marginTop: 2 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  headerCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tagRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.canvasAlt,
  },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, marginTop: spacing.lg },
  metaItem: { minWidth: '40%' },
  section: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
    backgroundColor: colors.surface,
    fontSize: 15,
    color: colors.ink,
  },
  warningBox: {
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  infoBox: {
    backgroundColor: colors.tealSoft,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
});

import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, type } from '@/theme/tokens';
import { PrimaryButton, VerificationStamp } from '@/components/atoms';
import { ApplicantRow } from '@/components/WorkerCards';
import { useStore } from '@/state/store';
import { useAppMode } from '@/state/AppMode';
import { currentWorker } from '@/data/mockData';
import { JobStatus } from '@/types/models';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'JobDetail'>;

const REVIEW_TAGS = ['Punctual', 'Friendly', 'Careful with items', 'Great communication'];

// Everything from worker_selected onward has an underlying chat — it
// should stay reachable for the rest of the job's life, cancellation
// included, since the thread's history doesn't disappear with the job.
const CHAT_ELIGIBLE_STATUSES: JobStatus[] = [
  'worker_selected',
  'in_progress',
  'awaiting_confirmation',
  'confirmed_completed',
  'disputed',
  'cancelled',
];
const APPLICABLE_STATUSES: JobStatus[] = ['open', 'applications_received'];

export function JobDetailScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const {
    jobs,
    applications,
    setApplicationStatus,
    addApplication,
    currentWorkerVerified,
    ensureChatForJob,
    otpByJob,
    startJob,
    markJobComplete,
    confirmJobCompletion,
    raiseDispute,
  } = useStore();
  const { mode } = useAppMode();
  const job = jobs.find((j) => j.id === jobId);
  const jobApplications = applications[jobId] ?? [];

  const [quotedRate, setQuotedRate] = useState(String(job?.budgetMin ?? ''));
  const [note, setNote] = useState('');
  const [applied, setApplied] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [stars, setStars] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  if (!job) return null;

  const alreadyApplied = applied || jobApplications.some((a) => a.worker.id === currentWorker.id);

  function toggleTag(tag: string) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function handleConfirmCompletion() {
    const ok = confirmJobCompletion(job!.id, otpInput.trim());
    setOtpError(!ok);
  }

  function submitApplication() {
    addApplication(job!.id, {
      id: `app_${Date.now()}`,
      jobId: job!.id,
      worker: { ...currentWorker, isVerified: currentWorkerVerified },
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
          </View>
        </View>

        {CHAT_ELIGIBLE_STATUSES.includes(job.status) && (
          <View style={styles.section}>
            <PrimaryButton
              label="Open chat"
              variant="teal"
              onPress={() => {
                const chat = ensureChatForJob(job.id);
                if (chat) navigation.navigate('Chat', { chatId: chat.id });
              }}
            />
          </View>
        )}

        {mode === 'worker' && job.status === 'worker_selected' && (
          <View style={styles.section}>
            <PrimaryButton label="Start job" onPress={() => startJob(job.id)} />
          </View>
        )}

        {job.status === 'in_progress' && (
          <View style={styles.section}>
            {mode === 'worker' && (
              <PrimaryButton
                label="Mark complete"
                onPress={() => markJobComplete(job.id)}
                style={{ marginBottom: spacing.md }}
              />
            )}
            <PrimaryButton label="SOS" variant="danger" onPress={() => setSosActive(true)} />
            {sosActive && (
              <View style={styles.sosBanner}>
                <Text style={[type.bodyStrong, { color: colors.danger }]}>
                  SOS alert active — demo only, nothing is actually dispatched.
                </Text>
              </View>
            )}
          </View>
        )}

        {mode === 'worker' && job.status === 'awaiting_confirmation' && (
          <View style={styles.section}>
            <View style={styles.infoBox}>
              <Text style={[type.body, { color: colors.teal }]}>
                Job marked complete. Share this code with the customer to confirm:
              </Text>
              <Text style={[type.display, { color: colors.ink, marginTop: spacing.xs }]}>
                {otpByJob[job.id] ?? '——————'}
              </Text>
            </View>
          </View>
        )}

        {mode === 'customer' && job.status === 'awaiting_confirmation' && (
          <View style={styles.section}>
            <Text style={[type.h2, { color: colors.ink }]}>Confirm completion</Text>
            <Text style={[type.small, { color: colors.inkSoft, marginTop: spacing.xs }]}>
              Ask the worker for the 6-digit code and enter it below.
            </Text>
            <TextInput
              value={otpInput}
              onChangeText={(t) => {
                setOtpInput(t);
                setOtpError(false);
              }}
              keyboardType="numeric"
              maxLength={6}
              placeholder="6-digit code"
              placeholderTextColor={colors.inkFaint}
              style={[styles.input, { marginTop: spacing.sm }]}
            />
            {otpError && (
              <Text style={[type.small, { color: colors.danger, marginTop: spacing.xs }]}>
                That code doesn't match. Try again.
              </Text>
            )}
            <PrimaryButton
              label="Confirm completion"
              onPress={handleConfirmCompletion}
              disabled={otpInput.trim().length !== 6}
              style={{ marginTop: spacing.md }}
            />
            <Pressable onPress={() => raiseDispute(job.id)} style={{ marginTop: spacing.md }}>
              <Text style={[type.small, { color: colors.danger }]}>Report a problem</Text>
            </Pressable>
          </View>
        )}

        {job.status === 'disputed' && (
          <View style={styles.section}>
            <View style={styles.warningBox}>
              <Text style={[type.small, { color: colors.danger }]}>
                This job is under dispute. Our team will review the chat and get back to you.
              </Text>
            </View>
          </View>
        )}

        {job.status === 'confirmed_completed' && (
          <View style={styles.section}>
            <Text style={[type.h2, { color: colors.ink }]}>Leave a review</Text>
            {reviewSubmitted ? (
              <View style={styles.infoBox}>
                <Text style={[type.body, { color: colors.teal }]}>Thanks for your review!</Text>
              </View>
            ) : (
              <View>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Pressable key={n} onPress={() => setStars(n)}>
                      <Text style={[type.display, { color: n <= stars ? colors.primary : colors.border }]}>★</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.pillRow}>
                  {REVIEW_TAGS.map((tag) => {
                    const selected = selectedTags.includes(tag);
                    return (
                      <Pressable
                        key={tag}
                        onPress={() => toggleTag(tag)}
                        style={[styles.tagPill, selected && styles.tagPillActive]}
                      >
                        <Text style={[type.smallStrong, { color: selected ? colors.onPrimary : colors.inkSoft }]}>
                          {tag}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <TextInput
                  value={reviewText}
                  onChangeText={setReviewText}
                  placeholder="Anything else? (optional)"
                  placeholderTextColor={colors.inkFaint}
                  multiline
                  style={[styles.input, { height: 70, textAlignVertical: 'top', marginTop: spacing.sm }]}
                />
                <PrimaryButton
                  label="Submit review"
                  onPress={() => setReviewSubmitted(true)}
                  disabled={stars === 0}
                  style={{ marginTop: spacing.md }}
                />
              </View>
            )}
          </View>
        )}

        {mode === 'worker' && APPLICABLE_STATUSES.includes(job.status) && (
          <View style={styles.section}>
            <Text style={[type.h2, { color: colors.ink }]}>Apply to this job</Text>

            {!currentWorkerVerified ? (
              <View style={styles.warningBox}>
                <Text style={[type.small, { color: colors.danger }]}>
                  Complete verification from your profile to apply.
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
  sosBanner: {
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  starRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  pillRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginTop: spacing.md },
  tagPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.canvasAlt,
  },
  tagPillActive: { backgroundColor: colors.primary },
});

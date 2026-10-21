import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, type } from '@/theme/tokens';
import { ErrorNote, PrimaryButton, VerificationStamp } from '@/components/atoms';
import { ApplicantRow } from '@/components/WorkerCards';
import { useStore } from '@/state/store';
import { useAuth } from '@/state/AuthContext';
import { useAppMode } from '@/state/AppMode';
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
// Past worker_selected the job is under way, and cancel_job rejects it.
const CANCELLABLE_STATUSES: JobStatus[] = ['open', 'applications_received', 'worker_selected'];

export function JobDetailScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const {
    jobsById,
    applications,
    myApplications,
    chats,
    profile,
    loading,
    errors,
    loadJob,
    loadApplicationsForJob,
    acceptApplication,
    addApplication,
    startJob,
    markJobComplete,
    confirmJobCompletion,
    raiseDispute,
    cancelJob,
    submitReview,
    loadReviews,
    reviewsByJob,
    peekJobOtp,
  } = useStore();
  const { user } = useAuth();
  const { mode } = useAppMode();

  const job = jobsById[jobId];
  const jobApplications = applications[jobId] ?? [];

  const [quotedRate, setQuotedRate] = useState('');
  const [note, setNote] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpMismatch, setOtpMismatch] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [stars, setStars] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reviewText, setReviewText] = useState('');
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [peekedOtp, setPeekedOtp] = useState<string | null>(null);

  useEffect(() => {
    void loadJob(jobId);
  }, [jobId, loadJob]);

  // Only the posting customer can read the application list, so asking as
  // a worker would just trip RLS.
  useEffect(() => {
    if (mode === 'customer') void loadApplicationsForJob(jobId);
  }, [jobId, mode, loadApplicationsForJob]);

  // The review each side left is the thing to show after submitting, so
  // it has to be read back rather than assumed from local state.
  useEffect(() => {
    if (job?.status === 'confirmed_completed') void loadReviews(jobId);
  }, [jobId, job?.status, loadReviews]);

  // Seed the quote with the job's floor once the job itself has loaded.
  useEffect(() => {
    if (job && quotedRate === '') setQuotedRate(String(job.budgetMin));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.id]);

  if (!job) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingBox}>
          {loading.jobs ? <ActivityIndicator color={colors.primary} /> : <ErrorNote message={errors.jobs ?? 'Job not found.'} />}
        </View>
      </SafeAreaView>
    );
  }

  const alreadyApplied = myApplications.some((a) => a.jobId === jobId);
  const isVerified = profile?.isVerified ?? false;
  const chat = chats.find((c) => c.jobId === jobId);
  // The job row carries no worker, so the counterparty comes from the chat
  // that accepting the application opened.
  const revieweeId = mode === 'customer' ? chat?.workerId : job.customerId;
  const myReview = (reviewsByJob[jobId] ?? []).find((r) => r.reviewerId === user?.id);

  function toggleTag(tag: string) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function run(key: string, action: () => Promise<{ ok: boolean; error: string | null }>) {
    if (busy) return;
    setActionError(null);
    setBusy(key);
    const res = await action();
    setBusy(null);
    if (!res.ok) setActionError(res.error);
  }

  async function handleConfirmCompletion() {
    if (busy) return;
    setActionError(null);
    setOtpMismatch(false);
    setBusy('confirm');
    const res = await confirmJobCompletion(jobId, otpInput.trim());
    setBusy(null);
    if (!res.ok) {
      setActionError(res.error);
      return;
    }
    setOtpMismatch(!res.matched);
  }

  async function handlePeekOtp() {
    setActionError(null);
    const res = await peekJobOtp(jobId);
    if (res.error) {
      setActionError(res.error);
      return;
    }
    setPeekedOtp(res.otp ?? 'unavailable');
  }

  async function handleSubmitReview() {
    if (!revieweeId) {
      setActionError('Cannot tell who to review until the chat for this job exists.');
      return;
    }
    await run('review', () => submitReview(jobId, revieweeId, stars, selectedTags, reviewText.trim()));
  }

  async function submitApplication() {
    await run('apply', () => addApplication(jobId, Number(quotedRate) || job.budgetMin, note.trim() || undefined));
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

        <ErrorNote message={actionError} style={{ marginHorizontal: spacing.lg }} />

        {CHAT_ELIGIBLE_STATUSES.includes(job.status) && chat && (
          <View style={styles.section}>
            <PrimaryButton
              label="Open chat"
              variant="teal"
              onPress={() => navigation.navigate('Chat', { chatId: chat.id })}
            />
          </View>
        )}

        {mode === 'worker' && job.status === 'worker_selected' && (
          <View style={styles.section}>
            <PrimaryButton
              label={busy === 'start' ? 'Starting…' : 'Start job'}
              disabled={busy !== null}
              onPress={() => void run('start', () => startJob(jobId))}
            />
          </View>
        )}

        {job.status === 'in_progress' && (
          <View style={styles.section}>
            {mode === 'worker' && (
              <PrimaryButton
                label={busy === 'complete' ? 'Marking…' : 'Mark complete'}
                disabled={busy !== null}
                onPress={() => void run('complete', () => markJobComplete(jobId))}
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
                Marked complete. Waiting for the customer to confirm with their code.
              </Text>
            </View>
          </View>
        )}

        {mode === 'customer' && job.status === 'awaiting_confirmation' && (
          <View style={styles.section}>
            <Text style={[type.h2, { color: colors.ink }]}>Confirm completion</Text>
            <Text style={[type.small, { color: colors.inkSoft, marginTop: spacing.xs }]}>
              Enter the 6-digit completion code for this job.
            </Text>
            <TextInput
              value={otpInput}
              onChangeText={(t) => {
                setOtpInput(t);
                setOtpMismatch(false);
              }}
              keyboardType="numeric"
              maxLength={6}
              placeholder="6-digit code"
              placeholderTextColor={colors.inkFaint}
              style={[styles.input, { marginTop: spacing.sm }]}
            />
            {otpMismatch && (
              <Text style={[type.small, { color: colors.danger, marginTop: spacing.xs }]}>
                That code doesn't match. Try again.
              </Text>
            )}
            <PrimaryButton
              label={busy === 'confirm' ? 'Confirming…' : 'Confirm completion'}
              onPress={() => void handleConfirmCompletion()}
              disabled={otpInput.trim().length !== 6 || busy !== null}
              style={{ marginTop: spacing.md }}
            />

            {/* Temporary development affordance. In production this code is
                delivered out of band; dev_peek_job_otp exists only so the
                flow is testable, and the server restricts it to the
                customer. The worker's view never shows it. */}
            <View style={styles.devBox}>
              <Text style={[type.label, { color: colors.inkFaint }]}>DEV ONLY</Text>
              {peekedOtp ? (
                <Text style={[type.mono, { color: colors.ink, marginTop: spacing.xs }]}>{peekedOtp}</Text>
              ) : (
                <Pressable onPress={() => void handlePeekOtp()}>
                  <Text style={[type.small, { color: colors.primaryDark, marginTop: spacing.xs }]}>
                    Reveal completion code (development shortcut)
                  </Text>
                </Pressable>
              )}
            </View>

            <Pressable
              onPress={() => void run('dispute', () => raiseDispute(jobId))}
              disabled={busy !== null}
              style={{ marginTop: spacing.md }}
            >
              <Text style={[type.small, { color: colors.danger }]}>
                {busy === 'dispute' ? 'Reporting…' : 'Report a problem'}
              </Text>
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
            {myReview ? (
              <View style={styles.reviewCard}>
                <Text style={[type.display, { color: colors.primary }]}>
                  {'★'.repeat(myReview.stars)}
                  <Text style={{ color: colors.border }}>{'★'.repeat(5 - myReview.stars)}</Text>
                </Text>
                {myReview.tags.length > 0 && (
                  <View style={styles.pillRow}>
                    {myReview.tags.map((tag) => (
                      <View key={tag} style={[styles.tagPill, styles.tagPillActive]}>
                        <Text style={[type.smallStrong, { color: colors.onPrimary }]}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {myReview.reviewText ? (
                  <Text style={[type.body, { color: colors.ink, marginTop: spacing.sm }]}>
                    "{myReview.reviewText}"
                  </Text>
                ) : null}
                <Text style={[type.small, { color: colors.inkFaint, marginTop: spacing.sm }]}>
                  Your review, submitted {new Date(myReview.createdAt).toLocaleDateString()}.
                </Text>
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
                  label={busy === 'review' ? 'Submitting…' : 'Submit review'}
                  onPress={() => void handleSubmitReview()}
                  disabled={stars === 0 || !revieweeId || busy !== null}
                  style={{ marginTop: spacing.md }}
                />
                {!revieweeId && (
                  <Text style={[type.small, { color: colors.inkFaint, marginTop: spacing.xs }]}>
                    Waiting on this job's chat to identify the other party.
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {mode === 'worker' && APPLICABLE_STATUSES.includes(job.status) && job.customerId !== user?.id && (
          <View style={styles.section}>
            <Text style={[type.h2, { color: colors.ink }]}>Apply to this job</Text>

            {!isVerified ? (
              <View style={styles.warningBox}>
                <Text style={[type.small, { color: colors.danger }]}>
                  Complete verification from your profile to apply.
                </Text>
              </View>
            ) : alreadyApplied ? (
              <View style={styles.infoBox}>
                <Text style={[type.body, { color: colors.teal }]}>
                  Application sent. You'll see the outcome under My Activity.
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
                  label={busy === 'apply' ? 'Sending…' : 'Submit application'}
                  disabled={busy !== null}
                  onPress={() => void submitApplication()}
                  style={{ marginTop: spacing.lg }}
                />
              </View>
            )}
          </View>
        )}

        {mode === 'customer' && CANCELLABLE_STATUSES.includes(job.status) && (
          <View style={styles.section}>
            {confirmingCancel ? (
              <View style={styles.warningBox}>
                <Text style={[type.bodyStrong, { color: colors.ink }]}>Cancel this job?</Text>
                <Text style={[type.small, { color: colors.inkSoft, marginTop: spacing.xs }]}>
                  Anyone who applied will see it was cancelled. This can't be undone.
                </Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
                  <PrimaryButton
                    label={busy === 'cancel' ? 'Cancelling…' : 'Yes, cancel'}
                    variant="danger"
                    disabled={busy !== null}
                    onPress={() => void run('cancel', () => cancelJob(jobId))}
                    style={{ flex: 1 }}
                  />
                  <PrimaryButton
                    label="Keep it"
                    variant="outline"
                    disabled={busy !== null}
                    onPress={() => setConfirmingCancel(false)}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            ) : (
              <PrimaryButton label="Cancel job" variant="outline" onPress={() => setConfirmingCancel(true)} />
            )}
          </View>
        )}

        {mode === 'customer' && (
          <View style={styles.section}>
            <Text style={[type.h2, { color: colors.ink, marginBottom: spacing.sm }]}>
              Applications ({jobApplications.length})
            </Text>
            <ErrorNote message={errors.applications} />
            {loading.applications && jobApplications.length === 0 ? (
              <ActivityIndicator color={colors.primary} />
            ) : jobApplications.length === 0 ? (
              <Text style={[type.body, { color: colors.inkFaint }]}>No applications yet.</Text>
            ) : (
              <FlatList
                data={jobApplications}
                keyExtractor={(a) => a.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <ApplicantRow
                    application={item}
                    busy={busy === `accept_${item.id}`}
                    onAccept={() => void run(`accept_${item.id}`, () => acceptApplication(jobId, item.id))}
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
    <View style={{ flex: 1 }}>
      <Text style={[type.label, { color: colors.inkFaint }]}>{label}</Text>
      <Text style={[type.small, { color: colors.ink, marginTop: 2 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  loadingBox: { padding: spacing.xxl, alignItems: 'center' },
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
  metaGrid: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
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
  infoBox: {
    backgroundColor: colors.tealSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  warningBox: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  devBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    backgroundColor: colors.canvasAlt,
  },
  sosBanner: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
  },
  reviewCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  starRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  tagPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.canvasAlt,
  },
  tagPillActive: { backgroundColor: colors.primary },
});

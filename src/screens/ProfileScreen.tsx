import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadow, spacing, type } from '@/theme/tokens';
import { Avatar } from '@/components/WorkerCards';
import { ErrorNote, PrimaryButton, RatingLine } from '@/components/atoms';
import { useAppMode } from '@/state/AppMode';
import { useAuth } from '@/state/AuthContext';
import { useStore } from '@/state/store';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/RootNavigator';
import type { TabParamList } from '@/navigation/TabNavigator';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList, 'Tabs'>
>;

export function ProfileScreen({ navigation }: Props) {
  const { mode, setMode } = useAppMode();
  const { profile, profileError, verifyCurrentWorker, myOfferings } = useStore();
  const { signOut } = useAuth();
  const [verifying, setVerifying] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleVerify() {
    if (verifying) return;
    setActionError(null);
    setVerifying(true);
    const res = await verifyCurrentWorker();
    setVerifying(false);
    if (!res.ok) setActionError(res.error);
  }

  // The profile row is the only source for name, rating and skills. Until
  // it arrives there is nothing truthful to render in its place.
  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingBox}>
          {profileError ? (
            <ErrorNote message={profileError} />
          ) : (
            <ActivityIndicator color={colors.primary} />
          )}
          <PrimaryButton label="Sign out" variant="outline" onPress={() => void signOut()} style={{ marginTop: spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  const isVerified = profile.isVerified;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <View style={styles.header}>
          <Avatar name={profile.fullName} color={profile.avatarColor} size={64} />
          <View style={{ marginLeft: spacing.lg }}>
            <Text style={[type.h1, { color: colors.ink }]}>{profile.fullName}</Text>
            <RatingLine rating={profile.avgRating} count={profile.totalJobsCompleted} />
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
            <View style={[styles.tierDot, { backgroundColor: isVerified ? colors.success : colors.border }]} />
            <View style={{ flex: 1 }}>
              <Text style={[type.bodyStrong, { color: colors.ink }]}>
                {isVerified ? 'Verified' : 'Not verified'}
              </Text>
              <Text style={[type.small, { color: colors.inkFaint }]}>
                {isVerified
                  ? 'Your ID has been verified.'
                  : 'Verify your ID to apply for jobs and post offerings.'}
              </Text>
            </View>
            {isVerified ? (
              <Text style={[type.smallStrong, { color: colors.success }]}>✓ Done</Text>
            ) : (
              <Pressable style={styles.verifyBtn} disabled={verifying} onPress={() => void handleVerify()}>
                <Text style={[type.smallStrong, { color: colors.primaryDark }]}>
                  {verifying ? 'Verifying…' : 'Verify your ID'}
                </Text>
              </Pressable>
            )}
          </View>
          <ErrorNote message={actionError} />
        </View>

        {mode === 'worker' && (
          <View style={styles.section}>
            <Text style={[type.label, { color: colors.inkFaint, marginBottom: spacing.sm }]}>
              YOUR OFFERINGS
            </Text>
            <Text style={[type.small, { color: colors.inkSoft, marginBottom: spacing.sm }]}>
              {myOfferings.length === 0
                ? "You haven't listed a service yet."
                : `${myOfferings.length} listed.`}
            </Text>
            {myOfferings.map((o) => (
              <View key={o.id} style={styles.offeringRow}>
                <Text style={[type.bodyStrong, { color: colors.ink }]} numberOfLines={1}>
                  {o.title}
                </Text>
                <Text style={[type.small, { color: colors.inkFaint }]}>
                  ₹{o.rate}/session ·{' '}
                  {o.moderationStatus === 'pending_review' ? 'In review' : o.status === 'active' ? 'Live' : 'Inactive'}
                </Text>
              </View>
            ))}
            <PrimaryButton
              label="List a service"
              variant="outline"
              onPress={() => navigation.navigate('CreateOffering')}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={[type.label, { color: colors.inkFaint, marginBottom: spacing.sm }]}>SKILLS</Text>
          {profile.skills.length === 0 ? (
            <Text style={[type.small, { color: colors.inkFaint }]}>No skills listed yet.</Text>
          ) : (
            <View style={styles.skillRow}>
              {profile.skills.map((s) => (
                <View key={s} style={styles.skillChip}>
                  <Text style={[type.small, { color: colors.inkSoft }]}>{s}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <PrimaryButton label="Sign out" variant="outline" onPress={() => void signOut()} />
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
  loadingBox: { padding: spacing.xxl, alignItems: 'center' },
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
  offeringRow: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
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

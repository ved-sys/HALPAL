import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, type } from '@/theme/tokens';
import { ErrorNote, PrimaryButton, RatingLine, VerificationStamp } from '@/components/atoms';
import { Avatar } from '@/components/WorkerCards';
import { useStore } from '@/state/store';
import { useAppMode } from '@/state/AppMode';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'OfferingDetail'>;

export function OfferingDetailScreen({ route, navigation }: Props) {
  const { offeringId } = route.params;
  const { offerings, requestOfferingBooking, refreshOfferings, loading } = useStore();
  const { mode } = useAppMode();
  const offering = offerings.find((o) => o.id === offeringId);
  const [requesting, setRequesting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Reached from the list, so the row is normally in memory already; this
  // covers a cold navigation (deep link, reload) without inventing data.
  useEffect(() => {
    if (!offering && !loading.offerings) void refreshOfferings();
  }, [offering, loading.offerings, refreshOfferings]);

  if (!offering) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.section}>
          <Text style={[type.body, { color: colors.inkFaint }]}>
            {loading.offerings ? 'Loading offering…' : 'Offering not found.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  async function handleRequestBooking() {
    if (requesting) return;
    setActionError(null);
    setRequesting(true);
    // The RPC opens the booking request and its chat together, and hands
    // back the chat id to jump straight into.
    const res = await requestOfferingBooking(offeringId);
    setRequesting(false);
    if (!res.ok || !res.chatId) {
      setActionError(res.error ?? 'Could not request the booking.');
      return;
    }
    navigation.replace('Chat', { chatId: res.chatId });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <View style={styles.headerCard}>
          <View style={styles.workerRow}>
            <Avatar name={offering.worker.fullName} color={offering.worker.avatarColor} size={52} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[type.bodyStrong, { color: colors.ink }]}>{offering.worker.fullName}</Text>
              <RatingLine rating={offering.worker.avgRating} count={offering.worker.totalJobsCompleted} />
            </View>
          </View>
          <View style={{ marginTop: spacing.sm }}>
            <VerificationStamp isVerified={offering.worker.isVerified} />
          </View>

          <Text style={[type.h1, { color: colors.ink, marginTop: spacing.md }]}>{offering.title}</Text>
          <Text style={[type.body, { color: colors.inkSoft, marginTop: spacing.sm }]}>{offering.description}</Text>

          <View style={styles.tagRow}>
            {offering.categoryTags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={[type.label, { color: colors.inkSoft }]}>{tag.toUpperCase()}</Text>
              </View>
            ))}
          </View>

          <Text style={[type.mono, { color: colors.primaryDark, marginTop: spacing.lg }]}>
            ₹{offering.rate}/session
          </Text>
        </View>

        {mode === 'customer' ? (
          <View style={styles.section}>
            <PrimaryButton
              label={requesting ? 'Requesting…' : 'Request booking'}
              disabled={requesting}
              onPress={() => void handleRequestBooking()}
            />
            <ErrorNote message={actionError} />
            <Text style={[type.small, { color: colors.inkFaint, marginTop: spacing.sm }]}>
              This opens a chat with {offering.worker.fullName.split(' ')[0]} right away — they'll confirm the
              booking once you've worked out the details.
            </Text>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={[type.small, { color: colors.inkFaint }]}>
              Switch to customer mode to request a booking.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
  workerRow: { flexDirection: 'row', alignItems: 'center' },
  tagRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap', marginTop: spacing.md },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.canvasAlt,
  },
  section: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
});

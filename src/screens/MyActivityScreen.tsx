import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadow, spacing, type } from '@/theme/tokens';
import { useStore } from '@/state/store';
import { useAppMode } from '@/state/AppMode';
import { currentWorker } from '@/data/mockData';
import { JobStatus } from '@/types/models';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/RootNavigator';
import type { TabParamList } from '@/navigation/TabNavigator';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'MyActivity'>,
  NativeStackScreenProps<RootStackParamList, 'Tabs'>
>;

const statusTone: Record<JobStatus, { bg: string; fg: string; label: string }> = {
  open: { bg: colors.canvasAlt, fg: colors.inkSoft, label: 'Open' },
  applications_received: { bg: colors.primarySoft, fg: colors.primaryDark, label: 'Applications in' },
  worker_selected: { bg: colors.tealSoft, fg: colors.teal, label: 'Worker selected' },
  in_progress: { bg: colors.tealSoft, fg: colors.teal, label: 'In progress' },
  awaiting_confirmation: { bg: colors.primarySoft, fg: colors.primaryDark, label: 'Awaiting confirmation' },
  confirmed_completed: { bg: colors.successSoft, fg: colors.success, label: 'Completed' },
  disputed: { bg: colors.dangerSoft, fg: colors.danger, label: 'Disputed' },
  cancelled: { bg: colors.canvasAlt, fg: colors.inkFaint, label: 'Cancelled' },
};

export function MyActivityScreen({ navigation }: Props) {
  const { jobs, applications } = useStore();
  const { mode } = useAppMode();

  if (mode === 'customer') {
    const myJobs = jobs; // in this mock, all posted jobs belong to the current customer
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Your posted jobs" subtitle="Track applications and job status here." />
        <FlatList
          data={myJobs}
          keyExtractor={(j) => j.id}
          contentContainerStyle={{ paddingBottom: spacing.xxxl }}
          renderItem={({ item }) => {
            const tone = statusTone[item.status];
            return (
              <Pressable onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}>
                <View style={[styles.row, shadow.card]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[type.bodyStrong, { color: colors.ink }]} numberOfLines={2}>
                      {item.description}
                    </Text>
                    <Text style={[type.small, { color: colors.inkFaint, marginTop: 2 }]}>
                      {item.locationLabel} · {applications[item.id]?.length ?? 0} applications
                    </Text>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: tone.bg }]}>
                    <Text style={[type.small, { color: tone.fg }]}>{tone.label}</Text>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    );
  }

  // Worker mode: flatten this worker's applications across all jobs
  const myApplications = Object.values(applications)
    .flat()
    .filter((a) => a.worker.id === currentWorker.id);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Your applications" subtitle="Jobs you've applied to, and where they stand." />
      <FlatList
        data={myApplications}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        renderItem={({ item }) => {
          const job = jobs.find((j) => j.id === item.jobId);
          if (!job) return null;
          const label =
            item.status === 'accepted'
              ? 'Accepted'
              : item.status === 'rejected'
              ? 'Not selected'
              : item.status === 'shortlisted'
              ? 'Shortlisted'
              : 'Applied';
          const tone =
            item.status === 'accepted'
              ? { bg: colors.successSoft, fg: colors.success }
              : item.status === 'rejected'
              ? { bg: colors.canvasAlt, fg: colors.inkFaint }
              : item.status === 'shortlisted'
              ? { bg: colors.primarySoft, fg: colors.primaryDark }
              : { bg: colors.tealSoft, fg: colors.teal };
          return (
            <Pressable onPress={() => navigation.navigate('JobDetail', { jobId: job.id })}>
              <View style={[styles.row, shadow.card]}>
                <View style={{ flex: 1 }}>
                  <Text style={[type.bodyStrong, { color: colors.ink }]} numberOfLines={2}>
                    {job.description}
                  </Text>
                  <Text style={[type.small, { color: colors.inkFaint, marginTop: 2 }]}>
                    Quoted ₹{item.quotedRate}
                  </Text>
                </View>
                <View style={[styles.statusChip, { backgroundColor: tone.bg }]}>
                  <Text style={[type.small, { color: tone.fg }]}>{label}</Text>
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[type.body, { color: colors.inkFaint }]}>
              You haven't applied to anything yet — browse the feed to get started.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, marginBottom: spacing.sm }}>
      <Text style={[type.display, { color: colors.ink }]}>{title}</Text>
      <Text style={[type.body, { color: colors.inkSoft, marginTop: spacing.xs }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusChip: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  empty: { padding: spacing.xxl, alignItems: 'center' },
});

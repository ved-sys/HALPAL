import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadow, spacing, type } from '@/theme/tokens';
import { JobCard } from '@/components/JobCard';
import { ErrorNote, ListEmpty } from '@/components/atoms';
import { useStore } from '@/state/store';
import { useAppMode } from '@/state/AppMode';
import { JobCategory } from '@/types/models';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/RootNavigator';
import type { TabParamList } from '@/navigation/TabNavigator';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Feed'>,
  NativeStackScreenProps<RootStackParamList, 'Tabs'>
>;

const allCategories: JobCategory[] = [
  'Delivery & Pickup',
  'Loading & Moving Help',
  'Errands & Queueing',
  'Cleaning & Household Help',
  'Event & Setup Help',
  'General Labor',
  'Other',
];

export function FeedScreen({ navigation }: Props) {
  // `jobs` is already the open, non-held board: status and moderation are
  // filtered server-side by fetchOpenJobs. Only the category chip is local.
  const { jobs, loading, errors, refreshJobs } = useStore();
  const { mode } = useAppMode();
  const [activeCategory, setActiveCategory] = useState<JobCategory | 'All'>('All');
  const openJobs = jobs.filter(
    (j) => activeCategory === 'All' || j.categoryTags.includes(activeCategory)
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={[type.label, { color: colors.primaryDark }]}>HALPAL</Text>
          <Text style={[type.display, { color: colors.ink }]}>Job board</Text>
        </View>
        {mode === 'customer' && (
          <Pressable style={styles.postBtn} onPress={() => navigation.navigate('PostJob')}>
            <Text style={[type.h1, { color: colors.onPrimary, lineHeight: 28 }]}>+</Text>
          </Pressable>
        )}
      </View>
      <Text style={[type.body, { color: colors.inkSoft, marginHorizontal: spacing.lg, marginBottom: spacing.sm }]}>
        {mode === 'worker'
          ? 'Simple jobs near you, paid better \u2014 we take less so you keep more.'
          : 'Post simple, everyday jobs \u2014 help is nearby.'}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {(['All', ...allCategories] as const).map((category) => {
          const active = activeCategory === category;
          return (
            <Pressable
              key={category}
              onPress={() => setActiveCategory(category)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[type.smallStrong, { color: active ? colors.onPrimary : colors.inkSoft }]}>
                {category}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <ErrorNote message={errors.jobs} style={{ marginHorizontal: spacing.lg }} />
      <FlatList
        data={openJobs}
        keyExtractor={(j) => j.id}
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        refreshControl={<RefreshControl refreshing={loading.jobs && jobs.length > 0} onRefresh={() => void refreshJobs()} />}
        renderItem={({ item }) => (
          <JobCard job={item} onPress={() => navigation.navigate('JobDetail', { jobId: item.id })} />
        )}
        ListEmptyComponent={<ListEmpty loading={loading.jobs} error={errors.jobs} message="No open jobs right now." />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  postBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  chipRow: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.canvasAlt,
  },
  chipActive: { backgroundColor: colors.primary },
});

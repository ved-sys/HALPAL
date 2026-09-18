import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadow, spacing, type } from '@/theme/tokens';
import { JobCard } from '@/components/JobCard';
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
  const { jobs } = useStore();
  const { mode } = useAppMode();
  const [activeCategory, setActiveCategory] = useState<JobCategory | 'All'>('All');
  const openJobs = jobs.filter(
    (j) =>
      (j.status === 'open' || j.status === 'applications_received') &&
      j.moderationStatus !== 'pending_review' &&
      (activeCategory === 'All' || j.categoryTags.includes(activeCategory))
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={[type.label, { color: colors.primaryDark }]}>KAAM</Text>
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
      <FlatList
        data={openJobs}
        keyExtractor={(j) => j.id}
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        renderItem={({ item }) => (
          <JobCard job={item} onPress={() => navigation.navigate('JobDetail', { jobId: item.id })} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[type.body, { color: colors.inkFaint }]}>No open jobs right now.</Text>
          </View>
        }
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
  empty: { padding: spacing.xxl, alignItems: 'center' },
  chipRow: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.canvasAlt,
  },
  chipActive: { backgroundColor: colors.primary },
});

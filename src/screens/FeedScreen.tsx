import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadow, spacing, type } from '@/theme/tokens';
import { JobCard } from '@/components/JobCard';
import { useStore } from '@/state/store';
import { useAppMode } from '@/state/AppMode';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Tabs'>;

export function FeedScreen({ navigation }: Props) {
  const { jobs } = useStore();
  const { mode } = useAppMode();
  const openJobs = jobs.filter((j) => j.status === 'open' || j.status === 'applications_received');

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
          ? 'Odd jobs near you, described in the customer\u2019s own words.'
          : 'What people nearby have posted right now.'}
      </Text>
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
});

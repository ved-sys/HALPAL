import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, type } from '@/theme/tokens';
import { OfferingCard } from '@/components/WorkerCards';
import { ErrorNote, ListEmpty } from '@/components/atoms';
import { useStore } from '@/state/store';
import { useAppMode } from '@/state/AppMode';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Tabs'>;

export function OfferingsScreen({ navigation }: Props) {
  // fetchOfferings already restricts to active, non-rejected rows.
  const { offerings, loading, errors, refreshOfferings } = useStore();
  const { mode } = useAppMode();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={[type.label, { color: colors.teal }]}>OFFERINGS</Text>
        <Text style={[type.display, { color: colors.ink }]}>Book a skill</Text>
        <Text style={[type.body, { color: colors.inkSoft, marginTop: spacing.xs }]}>
          {mode === 'customer'
            ? 'Workers offering a specific service — request a booking to start a chat.'
            : 'What other workers are listing. Post your own from your profile.'}
        </Text>
      </View>
      <ErrorNote message={errors.offerings} style={{ marginHorizontal: spacing.lg }} />
      <FlatList
        data={offerings}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ paddingBottom: spacing.xxxl, paddingTop: spacing.sm }}
        refreshControl={<RefreshControl refreshing={loading.offerings && offerings.length > 0} onRefresh={() => void refreshOfferings()} />}
        renderItem={({ item }) => (
          <OfferingCard offering={item} onPress={() => navigation.navigate('OfferingDetail', { offeringId: item.id })} />
        )}
        ListEmptyComponent={<ListEmpty loading={loading.offerings} error={errors.offerings} message="No offerings listed yet." />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
});

import React from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadow, spacing, type } from '@/theme/tokens';
import { ErrorNote, ListEmpty } from '@/components/atoms';
import { useStore } from '@/state/store';
import { useAuth } from '@/state/AuthContext';
import { useAppMode } from '@/state/AppMode';
import { isDeletedProfile } from '@/lib/profileRules';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Tabs'>;

export function MessagesScreen({ navigation }: Props) {
  // RLS restricts `chats` to its two participants, so no client-side
  // filtering is needed — every row here is one the user belongs to. The
  // mode only decides which side of the conversation to name.
  const { chats, messagesByChat, unreadCounts, loading, errors, refreshChats } = useStore();
  const { user } = useAuth();
  const { mode } = useAppMode();
  const currentUserId = user?.id ?? '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={[type.label, { color: colors.primaryDark }]}>MESSAGES</Text>
        <Text style={[type.display, { color: colors.ink }]}>Chats</Text>
      </View>
      <ErrorNote message={errors.chats} style={{ marginHorizontal: spacing.lg }} />
      <FlatList
        data={chats}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        refreshControl={<RefreshControl refreshing={loading.chats && chats.length > 0} onRefresh={() => void refreshChats()} />}
        renderItem={({ item }) => {
          const other = currentUserId === item.customerId ? item.worker : item.customer;
          const subtitle = item.jobDescription ?? item.offeringTitle ?? 'Booking request';
          // Only threads already opened have their messages in memory; the
          // rest show no preview rather than a guessed one.
          const loaded = messagesByChat[item.id];
          const lastMessage = loaded?.[loaded.length - 1];
          const hasUnread = (unreadCounts[item.id] ?? 0) > 0;
          // Still opens, so the history can be read; the chat itself is
          // read-only for a deleted account.
          const deleted = isDeletedProfile(other);
          return (
            <Pressable onPress={() => navigation.navigate('Chat', { chatId: item.id })}>
              <View style={[styles.row, shadow.card, deleted && { opacity: 0.55 }]}>
                <View style={{ flex: 1 }}>
                  <View style={styles.rowHeader}>
                    <Text style={[type.bodyStrong, { color: deleted ? colors.inkFaint : colors.ink }]}>
                      {other?.fullName ?? (currentUserId === item.customerId ? 'Worker' : 'Customer')}
                    </Text>
                    {hasUnread && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={[type.small, { color: colors.inkFaint, marginTop: 2 }]} numberOfLines={1}>
                    {subtitle}
                  </Text>
                  {lastMessage && (
                    <Text style={[type.small, { color: colors.inkSoft, marginTop: 2 }]} numberOfLines={1}>
                      {lastMessage.text}
                    </Text>
                  )}
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={<ListEmpty loading={loading.chats} error={errors.chats} message="No conversations yet. A chat opens once a worker is accepted for a job, or when you request a booking." />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
});

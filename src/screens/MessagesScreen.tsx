import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadow, spacing, type } from '@/theme/tokens';
import { useStore } from '@/state/store';
import { useAppMode } from '@/state/AppMode';
import { currentCustomer, currentWorker } from '@/data/mockData';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Tabs'>;

export function MessagesScreen({ navigation }: Props) {
  const { chats, messagesByChat, jobs, applications, offerings, bookingRequests } = useStore();
  const { mode } = useAppMode();
  const currentUserId = mode === 'worker' ? currentWorker.id : currentCustomer.id;

  // Every seeded offering belongs to an NPC worker, never the interactive
  // worker persona — so a pending booking's workerId never matches
  // currentWorker.id. Without this carve-out, worker mode could never
  // reach the chat to confirm it. The carve-out only holds while the
  // booking is 'pending'; once resolved the chat falls back to the
  // ordinary strict workerId match, same as any job chat.
  const myChats = chats
    .filter((c) => {
      if (mode === 'customer') return c.customerId === currentUserId;
      if (c.workerId === currentUserId) return true;
      const pendingBooking =
        c.bookingRequestId && bookingRequests.find((b) => b.id === c.bookingRequestId && b.status === 'pending');
      return Boolean(pendingBooking);
    })
    .slice()
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={[type.label, { color: colors.primaryDark }]}>MESSAGES</Text>
        <Text style={[type.display, { color: colors.ink }]}>Chats</Text>
      </View>
      <FlatList
        data={myChats}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        renderItem={({ item }) => {
          const job = jobs.find((j) => j.id === item.jobId);
          const bookingRequest = item.bookingRequestId
            ? bookingRequests.find((b) => b.id === item.bookingRequestId)
            : undefined;
          const offering = bookingRequest ? offerings.find((o) => o.id === bookingRequest.offeringId) : undefined;
          const subtitle = job?.description ?? offering?.title ?? 'Booking request';
          const accepted = (applications[item.jobId ?? ''] ?? []).find((a) => a.status === 'accepted');
          const otherName =
            mode === 'worker'
              ? currentCustomer.fullName
              : accepted?.worker.fullName ?? offering?.worker.fullName ?? 'Worker';
          const messages = messagesByChat[item.id] ?? [];
          const lastMessage = messages[messages.length - 1];
          const hasUnread = messages.some((m) => m.senderId !== currentUserId && !m.read);
          return (
            <Pressable onPress={() => navigation.navigate('Chat', { chatId: item.id })}>
              <View style={[styles.row, shadow.card]}>
                <View style={{ flex: 1 }}>
                  <View style={styles.rowHeader}>
                    <Text style={[type.bodyStrong, { color: colors.ink }]}>{otherName}</Text>
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
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[type.body, { color: colors.inkFaint }]}>
              No conversations yet — a chat opens once a worker is accepted for a job.
            </Text>
          </View>
        }
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
  empty: { padding: spacing.xxl, alignItems: 'center' },
});

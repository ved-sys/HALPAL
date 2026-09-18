import React, { useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, type } from '@/theme/tokens';
import { PrimaryButton } from '@/components/atoms';
import { useStore } from '@/state/store';
import { useAppMode } from '@/state/AppMode';
import { currentCustomer, currentWorker } from '@/data/mockData';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export function ChatScreen({ route }: Props) {
  const { chatId } = route.params;
  const { messagesByChat, sendMessage, markChatRead, chats, bookingRequests, confirmBooking } = useStore();
  const { mode } = useAppMode();
  const currentUserId = mode === 'worker' ? currentWorker.id : currentCustomer.id;
  const messages = messagesByChat[chatId] ?? [];
  const [text, setText] = useState('');

  const chat = chats.find((c) => c.id === chatId);
  const bookingRequest = chat?.bookingRequestId
    ? bookingRequests.find((b) => b.id === chat.bookingRequestId)
    : undefined;
  const showConfirmBooking = mode === 'worker' && bookingRequest?.status === 'pending';

  useEffect(() => {
    markChatRead(chatId, currentUserId);
    // Also re-mark on new incoming messages (e.g. the auto-reply) while the
    // thread is still open, so the unread dot doesn't relight behind it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, currentUserId, messages.length]);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage(chatId, currentUserId, trimmed);
    setText('');
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
          renderItem={({ item }) => {
            const mine = item.senderId === currentUserId;
            return (
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={[type.body, { color: mine ? colors.onPrimary : colors.ink }]}>{item.text}</Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[type.body, { color: colors.inkFaint }]}>Say hello to get started.</Text>
            </View>
          }
        />
        {showConfirmBooking && (
          <View style={styles.confirmBanner}>
            <Text style={[type.small, { color: colors.inkSoft, marginBottom: spacing.sm }]}>
              This customer wants to book your service.
            </Text>
            <PrimaryButton
              label="Confirm booking"
              variant="teal"
              onPress={() => confirmBooking(bookingRequest!.id)}
            />
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message"
            placeholderTextColor={colors.inkFaint}
            style={styles.input}
            onSubmitEditing={handleSend}
          />
          <Pressable style={styles.sendBtn} onPress={handleSend}>
            <Text style={[type.bodyStrong, { color: colors.onPrimary }]}>Send</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  bubble: {
    maxWidth: '80%',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bubbleMine: { backgroundColor: colors.primary, alignSelf: 'flex-end' },
  bubbleTheirs: {
    backgroundColor: colors.surfaceRaised,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
  },
  empty: { padding: spacing.xxl, alignItems: 'center' },
  confirmBanner: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.tealSoft,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.canvas,
    fontSize: 15,
    color: colors.ink,
  },
  sendBtn: {
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
});

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, type } from '@/theme/tokens';
import { ErrorNote, PrimaryButton } from '@/components/atoms';
import { useStore } from '@/state/store';
import { useAuth } from '@/state/AuthContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export function ChatScreen({ route }: Props) {
  const { chatId } = route.params;
  const {
    messagesByChat,
    sendMessage,
    markChatRead,
    loadMessages,
    chats,
    confirmBooking,
    declineBooking,
    cancelBooking,
    loading,
    errors,
  } = useStore();
  const { user } = useAuth();
  const currentUserId = user?.id ?? '';
  const messages = messagesByChat[chatId] ?? [];
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [bookingBusy, setBookingBusy] = useState<'confirm' | 'decline' | 'cancel' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const chat = chats.find((c) => c.id === chatId);
  // bookingStatus rides along on the chat row (see fetchMyChats), so the
  // booking controls need no separate lookup. Who sees which control comes
  // from the chat's own participants, not the mode toggle: on a booking
  // chat, workerId is the offering's owner and customerId the requester.
  const pendingBookingId =
    chat?.bookingRequestId != null && chat.bookingStatus === 'pending' ? chat.bookingRequestId : null;
  const isOfferingOwner = pendingBookingId != null && chat?.workerId === currentUserId;
  const isRequester = pendingBookingId != null && chat?.customerId === currentUserId;

  useEffect(() => {
    void loadMessages(chatId);
  }, [chatId, loadMessages]);

  // Clearing unread is a server call, so it runs on open and whenever new
  // messages land while the thread is in the foreground.
  useEffect(() => {
    void markChatRead(chatId);
  }, [chatId, markChatRead, messages.length]);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setActionError(null);
    setSending(true);
    const res = await sendMessage(chatId, trimmed);
    setSending(false);
    if (!res.ok) {
      setActionError(res.error);
      return;
    }
    setText('');
  }

  async function runBooking(
    key: 'confirm' | 'decline' | 'cancel',
    action: (bookingId: string) => Promise<{ ok: boolean; error: string | null }>
  ) {
    if (!pendingBookingId || bookingBusy) return;
    setActionError(null);
    setBookingBusy(key);
    // Each action refetches the chats, so the controls disappear once the
    // server reports the booking is no longer pending.
    const res = await action(pendingBookingId);
    setBookingBusy(null);
    if (!res.ok) setActionError(res.error);
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
              {loading.messages ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={[type.body, { color: colors.inkFaint }]}>Say hello to get started.</Text>
              )}
            </View>
          }
        />
        <ErrorNote message={actionError ?? errors.messages} style={{ marginHorizontal: spacing.lg }} />
        {isOfferingOwner && (
          <View style={styles.confirmBanner}>
            <Text style={[type.small, { color: colors.inkSoft, marginBottom: spacing.sm }]}>
              This customer wants to book your service.
            </Text>
            <View style={styles.bookingRow}>
              <PrimaryButton
                label={bookingBusy === 'confirm' ? 'Confirming…' : 'Confirm'}
                variant="teal"
                disabled={bookingBusy !== null}
                onPress={() => void runBooking('confirm', confirmBooking)}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                label={bookingBusy === 'decline' ? 'Declining…' : 'Decline'}
                variant="outline"
                disabled={bookingBusy !== null}
                onPress={() => void runBooking('decline', declineBooking)}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        )}
        {isRequester && (
          <View style={styles.confirmBanner}>
            <Text style={[type.small, { color: colors.inkSoft, marginBottom: spacing.sm }]}>
              Your booking request is waiting for the worker to confirm.
            </Text>
            <PrimaryButton
              label={bookingBusy === 'cancel' ? 'Cancelling…' : 'Cancel request'}
              variant="outline"
              disabled={bookingBusy !== null}
              onPress={() => void runBooking('cancel', cancelBooking)}
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
            editable={!sending}
            onSubmitEditing={() => void handleSend()}
          />
          <Pressable
            style={[styles.sendBtn, sending && { opacity: 0.5 }]}
            disabled={sending}
            onPress={() => void handleSend()}
          >
            <Text style={[type.bodyStrong, { color: colors.onPrimary }]}>{sending ? '…' : 'Send'}</Text>
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
  bookingRow: { flexDirection: 'row', gap: spacing.sm },
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

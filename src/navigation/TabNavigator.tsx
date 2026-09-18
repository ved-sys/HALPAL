import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/tokens';
import { FeedScreen } from '@/screens/FeedScreen';
import { OfferingsScreen } from '@/screens/OfferingsScreen';
import { MyActivityScreen } from '@/screens/MyActivityScreen';
import { MessagesScreen } from '@/screens/MessagesScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { useStore } from '@/state/store';
import { useAppMode } from '@/state/AppMode';
import { currentCustomer, currentWorker } from '@/data/mockData';

export type TabParamList = {
  Feed: undefined;
  Offerings: undefined;
  MyActivity: undefined;
  Messages: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const icons: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  Feed: 'newspaper-outline',
  Offerings: 'sparkles-outline',
  MyActivity: 'briefcase-outline',
  Messages: 'chatbubbles-outline',
  Profile: 'person-circle-outline',
};

export function TabNavigator() {
  const { chats, messagesByChat, bookingRequests } = useStore();
  const { mode } = useAppMode();
  const currentUserId = mode === 'worker' ? currentWorker.id : currentCustomer.id;
  // Mirrors MessagesScreen's visibility rule (see comment there): a pending
  // booking's chat is reachable from worker mode regardless of workerId,
  // since every seeded offering belongs to an NPC worker.
  const visibleChats = chats.filter((c) => {
    if (mode === 'customer') return c.customerId === currentUserId;
    if (c.workerId === currentUserId) return true;
    const pendingBooking =
      c.bookingRequestId && bookingRequests.find((b) => b.id === c.bookingRequestId && b.status === 'pending');
    return Boolean(pendingBooking);
  });
  const hasUnreadMessages = visibleChats.some((c) =>
    (messagesByChat[c.id] ?? []).some((m) => m.senderId !== currentUserId && !m.read)
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarIcon: ({ color, size }) => (
          <View>
            <Ionicons name={icons[route.name as keyof TabParamList]} size={size} color={color} />
            {route.name === 'Messages' && hasUnreadMessages && <View style={styles.dot} />}
          </View>
        ),
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Offerings" component={OfferingsScreen as any} />
      <Tab.Screen name="MyActivity" component={MyActivityScreen} options={{ title: 'My Activity' }} />
      <Tab.Screen name="Messages" component={MessagesScreen as any} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
});

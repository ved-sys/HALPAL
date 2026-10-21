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
  // Unread counts come from the server, scoped by RLS to the chats this
  // user is in, so the dot needs no client-side participant filtering.
  const { unreadCounts } = useStore();
  const hasUnreadMessages = Object.values(unreadCounts).some((n) => n > 0);

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

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/tokens';
import { FeedScreen } from '@/screens/FeedScreen';
import { OfferingsScreen } from '@/screens/OfferingsScreen';
import { MyActivityScreen } from '@/screens/MyActivityScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';

export type TabParamList = {
  Feed: undefined;
  Offerings: undefined;
  MyActivity: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const icons: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  Feed: 'newspaper-outline',
  Offerings: 'sparkles-outline',
  MyActivity: 'briefcase-outline',
  Profile: 'person-circle-outline',
};

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={icons[route.name as keyof TabParamList]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen as any} />
      <Tab.Screen name="Offerings" component={OfferingsScreen} />
      <Tab.Screen name="MyActivity" component={MyActivityScreen as any} options={{ title: 'My Activity' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

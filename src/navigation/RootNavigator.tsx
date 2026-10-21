import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, spacing, type } from '@/theme/tokens';
import { TabNavigator } from './TabNavigator';
import { useAuth } from '@/state/AuthContext';
import { LoginScreen } from '@/screens/LoginScreen';
import { JobDetailScreen } from '@/screens/JobDetailScreen';
import { PostJobScreen } from '@/screens/PostJobScreen';
import { ChatScreen } from '@/screens/ChatScreen';
import { OfferingDetailScreen } from '@/screens/OfferingDetailScreen';
import { CreateOfferingScreen } from '@/screens/CreateOfferingScreen';

export type RootStackParamList = {
  Login: undefined;
  Tabs: undefined;
  JobDetail: { jobId: string };
  PostJob: undefined;
  Chat: { chatId: string };
  OfferingDetail: { offeringId: string };
  CreateOffering: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) return <View style={{ flex: 1, backgroundColor: colors.canvas }} />;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.ink },
        headerShadowVisible: false,
        headerTintColor: colors.ink,
      }}
    >
      {!session ? (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
          <Stack.Screen
            name="JobDetail"
            component={JobDetailScreen}
            options={{ title: 'Job details' }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ title: 'Chat' }}
          />
          <Stack.Screen
            name="OfferingDetail"
            component={OfferingDetailScreen}
            options={{ title: 'Offering' }}
          />
          <Stack.Screen
            name="CreateOffering"
            component={CreateOfferingScreen}
            options={{ title: 'List a service' }}
          />
          <Stack.Screen
            name="PostJob"
            component={PostJobScreen}
            options={({ navigation }) => ({
              title: 'Post a job',
              presentation: 'modal',
              headerRight: () => (
                <Pressable onPress={() => navigation.goBack()} hitSlop={spacing.sm}>
                  <Text style={[type.bodyStrong, { color: colors.inkSoft }]}>Cancel</Text>
                </Pressable>
              ),
            })}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

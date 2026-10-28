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
import { SettingsScreen } from '@/screens/SettingsScreen';
import { PrivacyPolicyScreen, TermsScreen } from '@/screens/LegalScreens';
import { DeleteAccountScreen } from '@/screens/DeleteAccountScreen';
import { EditProfileScreen } from '@/screens/EditProfileScreen';
import { NameSetupScreen } from '@/screens/NameSetupScreen';
import { useStore } from '@/state/store';
import { PLACEHOLDER_NAME } from '@/lib/profileRules';

export type RootStackParamList = {
  Login: undefined;
  NameSetup: undefined;
  Tabs: undefined;
  JobDetail: { jobId: string };
  PostJob: undefined;
  Chat: { chatId: string };
  OfferingDetail: { offeringId: string };
  CreateOffering: undefined;
  Settings: undefined;
  PrivacyPolicy: undefined;
  Terms: undefined;
  DeleteAccount: undefined;
  EditProfile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { session, loading } = useAuth();
  const { profile, profileError } = useStore();

  // Hold a blank canvas until the profile row has answered, so a first-run
  // user doesn't see the tabs flash before the name step. A failed fetch
  // falls through to the tabs, where Profile shows the error.
  const awaitingProfile = session != null && profile == null && profileError == null;
  if (loading || awaitingProfile) return <View style={{ flex: 1, backgroundColor: colors.canvas }} />;

  // Only the exact placeholder triggers the step: 'Deleted user' never does,
  // and once a real name is saved the refreshed profile ends it.
  const needsName = profile?.fullName === PLACEHOLDER_NAME;

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
      ) : needsName ? (
        <Stack.Screen name="NameSetup" component={NameSetupScreen} options={{ headerShown: false }} />
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
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Privacy Policy' }} />
          <Stack.Screen name="Terms" component={TermsScreen} options={{ title: 'Terms of Service' }} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit profile' }} />
          <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} options={{ title: 'Delete account' }} />
          <Stack.Screen
            name="PostJob"
            component={PostJobScreen}
            options={({ navigation }) => ({
              title: 'Post a job',
              presentation: 'modal',
              headerRight: () => (
                // Right padding keeps the label clear of the screen edge; on web the
                // header gives headerRight no inset of its own.
                <Pressable
                  onPress={() => navigation.goBack()}
                  hitSlop={spacing.sm}
                  style={{ paddingHorizontal: spacing.sm }}
                >
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

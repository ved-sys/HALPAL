import React from 'react';
import { Pressable, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, spacing, type } from '@/theme/tokens';
import { TabNavigator } from './TabNavigator';
import { LoginScreen } from '@/screens/LoginScreen';
import { JobDetailScreen } from '@/screens/JobDetailScreen';
import { PostJobScreen } from '@/screens/PostJobScreen';

export type RootStackParamList = {
  Login: undefined;
  Tabs: undefined;
  JobDetail: { jobId: string };
  PostJob: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.ink },
        headerShadowVisible: false,
        headerTintColor: colors.ink,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen
        name="JobDetail"
        component={JobDetailScreen}
        options={{ title: 'Job details' }}
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
    </Stack.Navigator>
  );
}

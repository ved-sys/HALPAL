import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import {
  useFonts,
  Fraunces_400Regular,
  Fraunces_400Regular_Italic,
} from '@expo-google-fonts/fraunces';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import { RootNavigator } from '@/navigation/RootNavigator';
import { AppModeProvider } from '@/state/AppMode';
import { StoreProvider } from '@/state/store';
import { colors } from '@/theme/tokens';

export default function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_400Regular_Italic,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  if (!fontsLoaded) {
    // Loading gate — avoids a system-font flash before Fraunces/Manrope land.
    return <View style={{ flex: 1, backgroundColor: colors.canvas }} />;
  }

  return (
    <SafeAreaProvider>
      <AppModeProvider>
        <StoreProvider>
          <StatusBar style="dark" />
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </StoreProvider>
      </AppModeProvider>
    </SafeAreaProvider>
  );
}

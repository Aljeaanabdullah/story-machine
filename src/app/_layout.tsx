import { Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { Cinzel_400Regular, Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { Lora_400Regular, Lora_400Regular_Italic, Lora_700Bold } from '@expo-google-fonts/lora';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DraftProvider } from '@/state/draft';
import { SettingsProvider, useSettings } from '@/state/settings';
import { StoriesProvider } from '@/state/stories';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootStack() {
  const { ready, calm } = useSettings();
  const [fontsLoaded, fontError] = useFonts({
    Cinzel_400Regular,
    Cinzel_700Bold,
    Lora_400Regular,
    Lora_400Regular_Italic,
    Lora_700Bold,
    Cairo_400Regular,
    Cairo_700Bold,
  });
  // A font failure must not brick the app; system fonts are an acceptable fallback.
  const loaded = (fontsLoaded || !!fontError) && ready;

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  if (!loaded) return <View style={styles.root} />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: calm ? 'none' : 'fade_from_bottom',
        animationDuration: 320,
      }}
    >
      <Stack.Screen name="index" options={{ animation: 'none' }} />
      <Stack.Screen name="home" options={{ animation: calm ? 'none' : 'fade', gestureEnabled: false }} />
      <Stack.Screen name="generating" options={{ gestureEnabled: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider style={styles.root}>
      <SettingsProvider>
        <StoriesProvider>
          <DraftProvider>
            <StatusBar style="light" />
            <RootStack />
          </DraftProvider>
        </StoriesProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});

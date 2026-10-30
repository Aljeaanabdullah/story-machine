import { Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { Cinzel_400Regular, Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { Lora_400Regular, Lora_400Regular_Italic, Lora_700Bold } from '@expo-google-fonts/lora';
import { useFonts } from 'expo-font';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { strings } from '@/i18n/strings';
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

/**
 * Last-resort crash screen. It replaces the whole layout (providers included), so it
 * shows both languages and only uses plain components. Saved stories live in storage
 * and are untouched.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  if (__DEV__) console.error('[StoryVerse] crash', error);
  return (
    <View style={[styles.root, styles.crash]}>
      <Text style={styles.crashTitle}>{strings.en.crashTitle}</Text>
      <Text style={styles.crashTitle}>{strings.ar.crashTitle}</Text>
      <Text style={styles.crashBody}>{strings.en.crashBody}</Text>
      <Text style={[styles.crashBody, { writingDirection: 'rtl' }]}>{strings.ar.crashBody}</Text>
      <Pressable accessibilityRole="button" onPress={retry} style={styles.crashButton}>
        <Text style={styles.crashButtonText}>{strings.en.retry} · {strings.ar.retry}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  crash: { alignItems: 'center', justifyContent: 'center', padding: 28, gap: 10 },
  crashTitle: { color: colors.gold, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  crashBody: { color: colors.textDim, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  crashButton: { marginTop: 16, minHeight: 50, paddingHorizontal: 28, borderRadius: 999, backgroundColor: colors.gold, justifyContent: 'center' },
  crashButtonText: { color: '#24170A', fontSize: 16, fontWeight: '700' },
});

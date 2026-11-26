import {
  SourceSans3_400Regular,
  SourceSans3_400Regular_Italic,
  SourceSans3_700Bold,
  SourceSans3_700Bold_Italic,
  useFonts,
} from "@expo-google-fonts/source-sans-3";
import LucideFont from "@react-native-vector-icons/lucide/fonts/Lucide.ttf";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { LogBox, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import ChangelogModal from "#/components/popups/ChangelogModal";
import PopupHost from "#/components/popups/PopupHost";
import ToastHost from "#/components/popups/ToastHost";
import StripeWrapper from "#/components/providers/StripeWrapper";
import UiSpinner from "#/components/ui/UiSpinner";
import AppFrame from "#/components/views/AppFrame";
import Changelog from "#/constants/Changelog";
import { fontFamily } from "#/constants/FontFamily";
import NotificationManager from "#/helpers/Notifications";
import PersonalStore from "#/helpers/Stores/PersonalStore";
import { AudioProvider } from "#/helpers/provider/AudioProvider";
import { BadgeProvider } from "#/helpers/provider/BadgeProvider";
import { SettingsProvider } from "#/helpers/provider/SettingsProvider";
import { useNotificationObserver } from "#/hooks/useNotificationObserver";
import { useScreenViewTracking } from "#/hooks/useScreenViewTracking";

// Hide warning for new native event emitter
LogBox.ignoreLogs(["new NativeEventEmitter"]);

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const RootLayout = () => {
  useNotificationObserver();
  useScreenViewTracking();

  const [loaded] = useFonts({
    [fontFamily.regular]: SourceSans3_400Regular,
    [fontFamily.italic]: SourceSans3_400Regular_Italic,
    [fontFamily.bold]: SourceSans3_700Bold,
    [fontFamily.boldItalic]: SourceSans3_700Bold_Italic,
    // The icon font is bundled natively by the vector-icons config plugin,
    // but on web it has to be registered explicitly
    ...(Platform.OS === "web" && { Lucide: LucideFont }),
  });

  const [showChangelog, setShowChangelog] = useState(false);

  // On first mount: read onboarding state once, then gate both notification
  // permission request and changelog display on it.
  useEffect(() => {
    (async () => {
      try {
        const onboardingDone = await PersonalStore.isOnboardingDone();
        if (!onboardingDone) return;

        await NotificationManager.checkAndRequestOnLaunch();

        if (Changelog.notes) {
          const lastSeen =
            await PersonalStore.getLastSeenChangelogVersionCode();
          if (lastSeen < Changelog.versionCode) {
            setShowChangelog(true);
          }
        }
      } catch (error) {
        console.error("Error during post-onboarding startup checks:", error);
      }
    })();
  }, []);

  const dismissChangelog = async () => {
    setShowChangelog(false);
    await PersonalStore.setLastSeenChangelogVersionCode(Changelog.versionCode);
  };

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return <UiSpinner size="large" />;
  }

  // Create the main app content
  const appContent = (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SettingsProvider>
          <BadgeProvider>
            <AudioProvider>
              <AppFrame>
                <Stack
                  // SDK 58 types `id` as required once strictNullChecks is off
                  // (string | undefined collapses to string); undefined keeps
                  // the navigator unnamed as before.
                  id={undefined}
                  screenOptions={{
                    headerShown: false,
                    gestureEnabled: true,
                  }}
                >
                  <Stack.Screen name="(tabs)" options={{ title: "Home" }} />
                  <Stack.Screen
                    name="[category]/[slug]"
                    options={{ title: "Artikel" }}
                  />
                  <Stack.Screen
                    name="insta/[post_id]"
                    options={{ title: "Artikel" }}
                  />
                  <Stack.Screen
                    name="podcast/[id]"
                    options={{ title: "Podcast" }}
                  />
                  <Stack.Screen name="search" options={{ title: "Suche" }} />
                  <Stack.Screen
                    name="+not-found"
                    options={{ title: "Nicht gefunden" }}
                  />
                  <Stack.Screen
                    name="support"
                    options={{ title: "Unterstutzen" }}
                  />
                  <Stack.Screen
                    name="licenses"
                    options={{ title: "Lizenzen" }}
                  />
                </Stack>
                <ToastHost />
                <PopupHost />
                <ChangelogModal
                  isVisible={showChangelog}
                  onClose={dismissChangelog}
                />
              </AppFrame>
            </AudioProvider>
          </BadgeProvider>
        </SettingsProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );

  return <StripeWrapper>{appContent}</StripeWrapper>;
};

/**
 * Sets the default screen of the stack when deep linking
 * @see https://docs.expo.dev/router/advanced/router-settings/#initialroutename
 */
export const unstable_settings = {
  anchor: "(tabs)",
};

export default RootLayout;

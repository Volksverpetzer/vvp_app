import {
  SourceSans3_400Regular,
  SourceSans3_400Regular_Italic,
  SourceSans3_700Bold,
  SourceSans3_700Bold_Italic,
  useFonts,
} from "@expo-google-fonts/source-sans-3";
import OcticonsFont from "@react-native-vector-icons/octicons/fonts/Octicons.ttf";
import { Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { type PropsWithChildren, useEffect, useState } from "react";
import { LogBox, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import type { ToastConfig } from "react-native-toast-message";
import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";

import ChangelogModal from "#/components/popups/ChangelogModal";
import MissionPopup from "#/components/popups/MissionPopup";
import ToastShareSheet from "#/components/popups/ToastShareSheet";
import StripeWrapper from "#/components/providers/StripeWrapper";
import UiSpinner from "#/components/ui/UiSpinner";
import Changelog from "#/constants/Changelog";
import Colors from "#/constants/Colors";
import { fontSizes } from "#/constants/FontSizes";
import NotificationManager from "#/helpers/Notifications";
import PersonalStore from "#/helpers/Stores/PersonalStore";
import { AudioProvider } from "#/helpers/provider/AudioProvider";
import { BadgeProvider } from "#/helpers/provider/BadgeProvider";
import { SettingsProvider } from "#/helpers/provider/SettingsProvider";
import { isDarkMode } from "#/helpers/utils/color";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import { useNotificationObserver } from "#/hooks/useNotificationObserver";

// Hide warning for new native event emitter
LogBox.ignoreLogs(["new NativeEventEmitter"]);

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const SECONDARY_BG_SCREENS = new Set(["action", "support"]);

const TOAST_TEXT_STYLES = {
  text1Style: { fontSize: fontSizes.base },
  text2Style: { fontSize: fontSizes.sm },
};

/**
 * Manages the background color for the app shell — including the notch/status bar
 * area — based on the current screen and color scheme. Lives inside all providers
 * so forced dark mode is respected.
 */
const AppFrame = ({ children }: PropsWithChildren) => {
  const colorScheme = useAppColorScheme();
  const insets = useSafeAreaInsets();
  const segments = useSegments() as string[];

  const isSecondaryBg = segments.some((s) => SECONDARY_BG_SCREENS.has(s));
  const backgroundColor = isSecondaryBg
    ? Colors[colorScheme].surface
    : Colors[colorScheme].background;

  useEffect(() => {
    if (Platform.OS === "web") return;
    SystemUI.setBackgroundColorAsync(backgroundColor).catch((error) => {
      console.warn("Failed to set system background color", error);
    });
  }, [backgroundColor]);

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        backgroundColor,
      }}
    >
      <StatusBar style={isDarkMode(colorScheme) ? "light" : "dark"} />
      {children}
    </View>
  );
};

/**
 * Wraps Toast so its bottom offset clears the Android nav bar, matching the
 * padding approach used by BottomSheetModal/ChangelogModal.
 */
const AppToast = ({ config }: { config: ToastConfig }) => {
  const insets = useSafeAreaInsets();
  return <Toast config={config} bottomOffset={40 + insets.bottom} />;
};

const RootLayout = () => {
  useNotificationObserver();

  const [loaded] = useFonts({
    SourceSansPro: SourceSans3_400Regular,
    SourceSansProItalic: SourceSans3_400Regular_Italic,
    SourceSansProBold: SourceSans3_700Bold,
    SourceSansProBoldItalic: SourceSans3_700Bold_Italic,
    // The icon font is bundled natively by the vector-icons config plugin,
    // but on web it has to be registered explicitly
    ...(Platform.OS === "web" && { Octicons: OcticonsFont }),
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

  const toastConfig: ToastConfig = {
    success: (props) => <BaseToast {...props} {...TOAST_TEXT_STYLES} />,
    info: (props) => <BaseToast {...props} {...TOAST_TEXT_STYLES} />,
    error: (props) => <ErrorToast {...props} {...TOAST_TEXT_STYLES} />,
    achievement: ({ text1, text2 }) => (
      <MissionPopup text1={text1} text2={text2} />
    ),
    share: ({ props }) => (
      <ToastShareSheet items={props.items} onCancel={props.onCancel} />
    ),
  };

  // Create the main app content
  const appContent = (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SettingsProvider>
          <BadgeProvider>
            <AudioProvider>
              <AppFrame>
                <Stack
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
                <AppToast config={toastConfig} />
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
  initialRouteName: "(tabs)",
};

export default RootLayout;

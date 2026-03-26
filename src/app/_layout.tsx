import {
  SourceSans3_400Regular,
  SourceSans3_600SemiBold,
  SourceSans3_700Bold,
  useFonts,
} from "@expo-google-fonts/source-sans-3";
import { StripeProvider } from "@stripe/stripe-react-native";
import { Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { LogBox, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import type { ToastConfig } from "react-native-toast-message";
import Toast from "react-native-toast-message";

import View from "#/components/design/View";
import MissionPopup from "#/components/popups/MissionPopup";
import ToastShareSheet from "#/components/popups/ToastShareSheet";
import UiSpinner from "#/components/ui/UiSpinner";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import NotificationManager from "#/helpers/Notifications";
import PersonalStore from "#/helpers/Stores/PersonalStore";
import { BadgeProvider } from "#/helpers/provider/BadgeProvider";
import { SettingsProvider } from "#/helpers/provider/SettingsProvider";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import { useNotificationObserver } from "#/hooks/useNotificationObserver";

// Hide warning for new native event emitter
LogBox.ignoreLogs(["new NativeEventEmitter"]);

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const RootLayout = () => {
  useNotificationObserver();

  const segments = useSegments() as string[];
  const isTabsAndAction =
    segments.includes("(tabs)") && segments.includes("action");

  const [loaded] = useFonts({
    SourceSansPro: SourceSans3_400Regular,
    SourceSansProSemiBold: SourceSans3_600SemiBold,
    SourceSansProBold: SourceSans3_700Bold,
  });

  const colorScheme = useAppColorScheme();
  const insets = useSafeAreaInsets();
  const systemBackgroundColor = isTabsAndAction
    ? Colors[colorScheme].secondaryBackground
    : Colors[colorScheme].background;

  // On first mount check notification permissions and request if appropriate.
  // The NotificationManager itself will skip simulators and respects canAskAgain.
  useEffect(() => {
    (async () => {
      try {
        const onboardingDone = await PersonalStore.isOnboardingDone();
        if (onboardingDone) {
          await NotificationManager.checkAndRequestOnLaunch();
        }
      } catch (error) {
        console.error(
          "Error checking onboarding status for notifications:",
          error,
        );
      }
    })();
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    if (Platform.OS === "web") return;

    SystemUI.setBackgroundColorAsync(systemBackgroundColor).catch((error) => {
      console.warn("Failed to set system background color", error);
    });
  }, [systemBackgroundColor]);

  if (!loaded) {
    return <UiSpinner size="large" />;
  }

  const toastConfig: ToastConfig = {
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
            <View
              style={{
                flex: 1,
                paddingTop: insets.top,
                backgroundColor: systemBackgroundColor,
              }}
            >
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
                <Stack.Screen name="search" options={{ title: "Suche" }} />
                <Stack.Screen
                  name="+not-found"
                  options={{ title: "Nicht gefunden" }}
                />
                <Stack.Screen
                  name="support"
                  options={{ title: "Unterstutzen" }}
                />
                <Stack.Screen name="licenses" options={{ title: "Lizenzen" }} />
              </Stack>
              <Toast config={toastConfig} />
            </View>
          </BadgeProvider>
        </SettingsProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );

  // On web, skip native-only providers (Stripe)
  if (Platform.OS === "web") {
    return appContent;
  }

  // On native platforms, wrap with native-only providers
  return (
    <StripeProvider
      publishableKey="pk_live_51MAUglFricedKvSmI93lGEtbVgTLl3ng0X0CIKMacMDSmgSLtiRZYGDSTWLHvUuQHnONs4hvFUAfH5cmDkZ4wAvF00WDS1HasH" // cspell:disable-line
      merchantIdentifier={Config.donations.merchantIdentifier}
    >
      {appContent}
    </StripeProvider>
  );
};

/**
 * Sets the default screen of the stack when deep linking
 * @see https://docs.expo.dev/router/advanced/router-settings/#initialroutename
 */
export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default RootLayout;

import { StripeProvider } from "@stripe/stripe-react-native";
import { useFonts } from "expo-font";
import { Stack, useSegments } from "expo-router";
import { ShareIntentProvider } from "expo-share-intent";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Toast, { ToastConfig } from "react-native-toast-message";

import AnimatedLoading from "#/components/animations/AnimatedLoading";
import View from "#/components/design/View";
import MissionPopup from "#/components/popups/MissionPopup";
import ToastShareSheet from "#/components/popups/ToastShareSheet";
import Colors from "#/constants/Colors";
import { BadgeProvider } from "#/helpers/BadgeContext";
import { SettingsProvider } from "#/helpers/SettingsContext";
import useColorScheme from "#/hooks/useColorScheme";
import { useNotificationObserver } from "#/hooks/useNotificationObserver";

import SourceSansProBold from "#assets/fonts/SourceSansPro-Bold.ttf";
import SourceSansPro from "#assets/fonts/SourceSansPro-Regular.ttf";
import SourceSansProSemiBold from "#assets/fonts/SourceSansPro-SemiBold.ttf";

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
    SourceSansPro: SourceSansPro,
    SourceSansProBold: SourceSansProBold,
    SourceSansProSemiBold: SourceSansProSemiBold,
  });
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return <AnimatedLoading />;
  }

  const toastConfig: ToastConfig = {
    achievement: ({ text1, text2 }) => (
      <MissionPopup text1={text1} text2={text2} />
    ),
    share: ({ props }) => (
      <ToastShareSheet items={props.items} onCancel={props.onCancel} />
    ),
  };

  return (
    <ShareIntentProvider options={{ debug: false }}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StripeProvider
            publishableKey="pk_live_51MAUglFricedKvSmI93lGEtbVgTLl3ng0X0CIKMacMDSmgSLtiRZYGDSTWLHvUuQHnONs4hvFUAfH5cmDkZ4wAvF00WDS1HasH" // cspell:disable-line
            merchantIdentifier="merchant.volksverpetzer.de"
          >
            <SettingsProvider>
              <BadgeProvider>
                <View
                  style={{
                    flex: 1,
                    paddingTop: insets.top,
                    backgroundColor: isTabsAndAction
                      ? Colors[colorScheme].secondaryBackground
                      : Colors[colorScheme].background,
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
                      getId={({ params }) =>
                        params.category + "/" + params.slug
                      }
                    />
                    <Stack.Screen
                      name="insta/[post_id]"
                      options={{ title: "Artikel" }}
                      getId={({ params }) => params.post_id}
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
                  <Toast config={toastConfig} />
                </View>
              </BadgeProvider>
            </SettingsProvider>
          </StripeProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ShareIntentProvider>
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

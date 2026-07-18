import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import { useContext, useEffect, useRef, useState } from "react";
import { AppState, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FeedIcon, NotificationIcon, SafetyIcon } from "#/components/Icons";
import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import SettingsList from "#/components/views/SettingsList";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import Notifications from "#/helpers/Notifications";
import PersonalStore from "#/helpers/Stores/PersonalStore";
import SettingsStore from "#/helpers/Stores/SettingsStore";
import { updateBadgeState } from "#/helpers/provider/BadgeProvider";
import { SettingsContext } from "#/helpers/provider/SettingsProvider";
import { isVolksverpetzer } from "#/helpers/utils/variant";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import FlatBoard from "#/screens/Onboarding/components/Flatboard";
import type { OnBoardingData } from "#/screens/Onboarding/components/Flatboard";
import type { NotificationSettingType, SettingType } from "#/types";

import WelcomeVVP from "#assets/images/welcome.webp";

const NOTIFICATION_STEP_ID = 7;

const Onboarding = () => {
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettingType>(
      SettingsStore.defaultNotificationSettings,
    );
  const appName = Constants.expoConfig.name;
  const { contentSettings, setContentSettings } = useContext(SettingsContext);
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].background;
  const corporate = Colors[colorScheme].primary;
  const { bottom } = useSafeAreaInsets();
  const router = useRouter();

  const isFoss = Config.isFoss ?? false;
  const hasRequestedNotificationPermission = useRef(false);
  const isOnNotificationStepRef = useRef(false);
  const [notificationPermissionDenied, setNotificationPermissionDenied] =
    useState(false);

  const onStepChange = (item: OnBoardingData) => {
    isOnNotificationStepRef.current = item.id === NOTIFICATION_STEP_ID;
    if (item.id !== NOTIFICATION_STEP_ID) return;
    if (hasRequestedNotificationPermission.current) return;
    hasRequestedNotificationPermission.current = true;

    Notifications.requestPermissionAndApplyDefaults()
      .then(({ status, notificationSettings: updatedNotificationSettings }) => {
        setNotificationSettings(updatedNotificationSettings);
        setNotificationPermissionDenied(status === "denied");
      })
      .catch((error) => {
        console.error("Failed to request notification permission:", error);
      });
  };

  // If the user backgrounds the app to flip the OS permission in system
  // Settings (via the disabled-message deep link) and comes back while still
  // on the notification step, re-check the outcome so the switches unlock
  // without waiting for a remount. Only re-checks, never re-prompts.
  useEffect(() => {
    if (isFoss) return;
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") return;
      if (!hasRequestedNotificationPermission.current) return;
      if (!isOnNotificationStepRef.current) return;

      Notifications.getPermissions()
        .then((permissions) => {
          setNotificationPermissionDenied(permissions.status === "denied");
        })
        .catch((error) => {
          console.error("Failed to re-check notification permission:", error);
        });
    });
    return () => subscription.remove();
  }, [isFoss]);

  const agreeToTerms = async () => {
    await PersonalStore.setOnboardingDone();
    updateBadgeState({ personal: false, action: true });
    router.replace("/");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Permission was already requested on the notification step; this just
    // makes sure the token/server registration is in sync, fire-and-forget
    // so it doesn't block the home screen.
    if (!isFoss) {
      Notifications.registerForPushNotifications().catch((error) => {
        console.error("Failed to register for push notifications:", error);
      });
    }
  };

  const saveContentSetting = (
    value: boolean,
    key: string,
    setting: SettingType,
  ): void => {
    const newSetting = { ...setting, value };
    const updatedContentSettings = { ...contentSettings, [key]: newSetting };
    setContentSettings(updatedContentSettings);
  };

  const saveNotificationSetting = async (
    value: boolean,
    key: keyof NotificationSettingType,
    setting: SettingType,
  ): Promise<void> => {
    const newSetting = { ...setting, value };
    const { notificationSettings: updatedNotificationSettings } =
      await Notifications.registerForPushNotifications({ [key]: newSetting });
    setNotificationSettings(updatedNotificationSettings);
    Haptics.selectionAsync();
  };

  const data = [
    {
      id: 1,
      title: "Willkommen",
      description: `Willkommen bei der ${appName}-App!`,
      icon: isVolksverpetzer ? WelcomeVVP : undefined,
    },
    {
      id: 3,
      title: "Welche Inhalte möchtest du sehen?",
      description: `Du kannst deinen Feed jederzeit individuell anpassen. `,
      Component: () => (
        <View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 30,
            }}
          >
            <FeedIcon color={corporate} size={20} />
            <UiText bold size="lg" style={{ textAlign: "left" }}>
              Feed-Einstellungen
            </UiText>
          </View>
          <SettingsList
            saveSettings={saveContentSetting}
            settings={contentSettings}
          />
        </View>
      ),
    },
    ...(!isFoss
      ? [
          {
            id: NOTIFICATION_STEP_ID,
            title: "Push Benachrichtigungen",
            description: `Faktenchecks hinken naturgemäß immer hinterher. Um schnellstmöglich Faktenchecks zu erhalten und zu teilen, kannst du dir Push-Benachrichtigungen aktivieren. Das kann wichtig sein, damit die Fakten deine Freunde oder Familie erreichen, bevor der Fake sie aufs Glatteis führt.`,
            Component: () => (
              <View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 30,
                  }}
                >
                  <NotificationIcon color={corporate} size={20} />
                  <UiText
                    bold
                    size="lg"
                    style={{
                      textAlign: "left",
                    }}
                  >
                    Benachrichtigungen
                  </UiText>
                </View>
                <SettingsList
                  saveSettings={saveNotificationSetting}
                  settings={notificationSettings}
                  disabled={notificationPermissionDenied}
                  disabledMessage="Benachrichtigungen sind deaktiviert. Tippe hier, um sie in den Einstellungen zu aktivieren."
                  onDisabledPress={() => Linking.openSettings()}
                />
              </View>
            ),
          },
        ]
      : []),
    {
      id: 8,
      title: "Prio: Datenschutz",
      description: `Unser Versprechen: Wir geben uns alle Mühe, den Datenkraken so wenig zu überliefern wie möglich. Du braucht keine Accounts, wir tracken dich nicht. Mit der Nutzung stimmst du unserer Datenschutzerklärung zu.`,
      TopComponent: () => <SafetyIcon color={corporate} size={80} />,
      Component: () => (
        <UiPressable
          accessibilityRole="button"
          onPress={() => {
            openBrowserAsync(Constants.expoConfig.extra.dataProtectionUrl);
          }}
        >
          <UiText
            size="xl"
            style={{
              color: corporate,
              textAlign: "center",
              padding: 40,
            }}
          >
            Datenschutzerklärung
          </UiText>
        </UiPressable>
      ),
    },
  ];

  return (
    <View
      style={{
        flex: 1,
        paddingBottom: bottom,
        backgroundColor,
      }}
    >
      <FlatBoard
        data={data}
        onFinish={agreeToTerms}
        onStepChange={onStepChange}
        accentColor={corporate}
        buttonTitle="Los geht's"
        hideIndicator
        variant="standard"
      />
    </View>
  );
};

export default Onboarding;

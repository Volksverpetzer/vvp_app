import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import { useContext, useEffect, useState } from "react";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Feed, Safety } from "#/components/Icons";
import Text from "#/components/design/Text";
import View from "#/components/design/View";
import SettingsList from "#/components/views/SettingsList";
import Colors from "#/constants/Colors";
import { styles } from "#/constants/Styles";
import Notifications from "#/helpers/Notifications";
import PersonalStore from "#/helpers/Stores/PersonalStore";
import SettingsStore from "#/helpers/Stores/SettingsStore";
import { updateBadgeState } from "#/helpers/provider/BadgeProvider";
import { SettingsContext } from "#/helpers/provider/SettingsProvider";
import { isVolksverpetzer } from "#/helpers/utils/variant";
import { useCorporateColor } from "#/hooks/useAppColorScheme";
import FlatBoard from "#/screens/Onboarding/components/Flatboard";
import { NotificationSettingType, SettingType } from "#/types";

import WelcomeVVP from "#assets/images/welcome.webp";

const Onboarding = () => {
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettingType>(
      SettingsStore.defaultNotificationSettings,
    );
  const [currentStep, setCurrentStep] = useState(0);
  const [hasRequestedPermissions, setHasRequestedPermissions] = useState(false);
  const appName = Constants.expoConfig.name;
  const { contentSettings, setContentSettings } = useContext(SettingsContext);
  const corporate = useCorporateColor();
  const { bottom } = useSafeAreaInsets();
  const router = useRouter();

  useEffect(() => {
    PersonalStore.isOnboardingDone().then((value) => {
      if (value === true) {
        Notifications.getPermissions().then((status) => {
          if (status.status !== "granted") {
            Notifications.registerForPushNotifications();
          }
        });
        router.replace("/");
      }
    });
  }, []);

  // Request notification permissions when user reaches the notification slide
  useEffect(() => {
    // Notification slide is at index 2 (the third slide in the onboarding flow)
    if (currentStep === 2 && !hasRequestedPermissions) {
      setHasRequestedPermissions(true);
      Notifications.registerForPushNotifications()
        .then((result) => {
          setNotificationSettings(result.notificationSettings);
        })
        .catch((error) => {
          console.warn("Failed to request notification permissions:", error);
        });
    }
  }, [currentStep, hasRequestedPermissions]);

  const agreeToTerms = () => {
    PersonalStore.setOnboardingDone().then(() => {
      updateBadgeState({ personal: false, action: true });
      router.replace("/");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });
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
            }}
          >
            <Feed color={corporate} />
            <Text
              style={{ ...styles.heading, textAlign: "left", paddingLeft: 30 }}
            >
              Feed-Einstellungen
            </Text>
          </View>
          <SettingsList
            saveSettings={saveContentSetting}
            settings={contentSettings}
          />
        </View>
      ),
    },
    {
      id: 7,
      title: "Push Benachrichtigungen",
      description: `Faktenchecks hinken naturgemäß immer hinterher. Um schnellstmöglich Faktenchecks zu erhalten und zu teilen, kannst du dir Push-Benachrichtigungen aktivieren. Das kann wichtig sein, damit die Fakten deine Freunde oder Familie erreichen, bevor der Fake sie aufs Glatteis führt.`,
      Component: () => (
        <View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Feed color={corporate} />
            <Text
              style={{ ...styles.heading, textAlign: "left", paddingLeft: 30 }}
            >
              Feed-Einstellungen
            </Text>
          </View>
          <SettingsList
            saveSettings={saveNotificationSetting}
            settings={notificationSettings}
          />
        </View>
      ),
    },
    {
      id: 8,
      title: "Prio: Datenschutz",
      description: `Unser Versprechen: Wir geben uns alle Mühe, den Datenkraken so wenig zu überliefern wie möglich. Du braucht keine Accounts, wir tracken dich nicht. Mit der Nutzung stimmst du unserer Datenschutzerklärung zu.`,
      TopComponent: () => <Safety color={corporate} width={80} />,
      Component: () => (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            openBrowserAsync(Constants.expoConfig.extra.dataProtectionUrl);
          }}
        >
          <Text
            style={{
              color: corporate,
              textAlign: "center",
              padding: 40,
              fontSize: 20,
            }}
          >
            Datenschutzerklärung
          </Text>
        </Pressable>
      ),
    },
  ];

  return (
    <View style={{ flex: 1, paddingBottom: bottom }}>
      <FlatBoard
        data={data}
        onFinish={agreeToTerms}
        onStepChange={setCurrentStep}
        accentColor={Colors["light"].heading}
        buttonTitle="Los geht's"
        hideIndicator
        variant="standard"
      />
    </View>
  );
};

export default Onboarding;

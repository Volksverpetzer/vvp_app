import * as Application from "expo-application";
import * as Linking from "expo-linking";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import {
  CodeIcon,
  FeedIcon,
  GiveIcon,
  ImprintIcon,
  LockIcon,
  NotificationIcon,
  SearchIcon,
  SettingsIcon,
} from "#/components/Icons";
import AnimatedHeader from "#/components/animations/AnimatedHeader";
import UiCollapsable from "#/components/ui/UiCollapsable";
import UiDivider from "#/components/ui/UiDivider";
import UiLink from "#/components/ui/UiLink";
import UiPressable from "#/components/ui/UiPressable";
import UiSpace from "#/components/ui/UiSpace";
import UiText from "#/components/ui/UiText";
import Donate from "#/components/views/Donate";
import SettingsList from "#/components/views/SettingsList";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { globalStyles } from "#/constants/GlobalStyles";
import { Achievements } from "#/helpers/Achievements";
import Notifications from "#/helpers/Notifications";
import PersonalStore from "#/helpers/Stores/PersonalStore";
import SettingsStore from "#/helpers/Stores/SettingsStore";
import { SettingsContext } from "#/helpers/provider/SettingsProvider";
import { toast } from "#/helpers/toast";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import BackupView from "#/screens/Settings/components/BackupView";
import type { NotificationSettingType, SettingType } from "#/types";

const SettingsScreen = () => {
  const [token, setToken] = useState<string | undefined>();
  const scrollOffsetY = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettingType>(
      SettingsStore.defaultNotificationSettings,
    );
  const [notificationPermissionDenied, setNotificationPermissionDenied] =
    useState(false);
  const {
    contentSettings,
    setContentSettings,
    advancedSettings,
    setAdvancedSettings,
  } = useContext(SettingsContext);
  const colorScheme = useAppColorScheme();
  const primary = Colors[colorScheme].primary;
  const backgroundColor = Colors[colorScheme].surface;
  const HEADER_HEIGHT = 150;

  // Update content settings
  const saveContentSetting = (
    value: boolean,
    key: string,
    setting: SettingType,
  ): void => {
    const newSetting = { ...setting, value };
    const updatedContentSettings = { ...contentSettings, [key]: newSetting };
    setContentSettings(updatedContentSettings);
  };

  // Update advanced settings
  const saveAdvancedSetting = (
    value: boolean,
    key: string,
    setting: SettingType,
  ): void => {
    const newSetting = { ...setting, value };
    const updatedAdvancedSettings = { ...advancedSettings, [key]: newSetting };
    setAdvancedSettings(updatedAdvancedSettings);
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
  };

  useEffect(() => {
    const getToken = async () => {
      const token = await Notifications.getToken();
      setToken(token);
    };
    getToken();
  }, []);

  // Re-check the OS permission whenever this tab regains focus (e.g. the
  // user just came back from toggling it in the system Settings app), so the
  // switches reflect reality rather than a request made once at mount.
  useFocusEffect(
    useCallback(() => {
      if (Config.isFoss || Platform.OS === "web") return;
      let isActive = true;
      Notifications.getPermissions()
        .then((permissions) => {
          if (isActive) {
            setNotificationPermissionDenied(permissions.status === "denied");
          }
        })
        .catch((error) => {
          console.error("Failed to check notification permission:", error);
        });
      return () => {
        isActive = false;
      };
    }, []),
  );

  return (
    <>
      <AnimatedHeader
        title="Einstellungen"
        scrollOffsetY={scrollOffsetY}
        minHeight={100}
        maxHeight={HEADER_HEIGHT}
      />
      <ScrollView
        style={{
          backgroundColor,
          flex: 1,
        }}
        contentContainerStyle={[
          globalStyles.content,
          {
            paddingTop: HEADER_HEIGHT,
            gap: 20,
            paddingHorizontal: 0,
          },
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollOffsetY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
      >
        <View>
          <UiCollapsable
            icon={<FeedIcon color={primary} size={24} />}
            title="Feed"
            borderRadius={0}
          >
            <UiText size="base" style={styles.sectionText}>
              Was möchtest du in deinem Feed sehen?
            </UiText>
            <SettingsList
              saveSettings={saveContentSetting}
              settings={contentSettings}
            />
          </UiCollapsable>
          {!Config.isFoss && (
            <UiCollapsable
              icon={<NotificationIcon color={primary} size={24} />}
              title="Benachrichtigungen"
              borderRadius={0}
            >
              <SettingsList
                saveSettings={saveNotificationSetting}
                settings={notificationSettings}
                disabled={notificationPermissionDenied}
                disabledMessage="Benachrichtigungen sind in den Systemeinstellungen deaktiviert. Tippe hier, um sie zu aktivieren."
                onDisabledPress={() => Linking.openSettings()}
              />
            </UiCollapsable>
          )}
          <UiCollapsable
            icon={<SettingsIcon color={primary} size={24} />}
            title="Erweitert"
            borderRadius={0}
          >
            <SettingsList
              saveSettings={saveAdvancedSetting}
              settings={advancedSettings}
            />
            {Config.enableEngagement && <BackupView />}
          </UiCollapsable>
        </View>
        <UiDivider paddingHorizontal={35} paddingVertical={5} />
        <View style={styles.linksContainer}>
          <UiLink
            url={Config.aboutUrl}
            icon={<SearchIcon color={primary} size={24} />}
            text="Über uns"
          />
          <UiLink
            url={Config.donations.support}
            icon={<GiveIcon color={primary} size={24} />}
            text="Unterstützen"
          />
          <UiLink
            url={Config.dataProtectionUrl}
            icon={<LockIcon color={primary} size={24} />}
            text="Datenschutz"
          />
          <UiLink
            url={Config.imprintUrl}
            icon={<ImprintIcon color={primary} size={24} />}
            text="Impressum"
          />
          <UiLink
            url={Config.sourceUrl}
            icon={<CodeIcon color={primary} size={24} />}
            text="Quellcode"
          />
        </View>
        <Donate showPicker={false} />
        <View style={styles.infoContainer}>
          <UiPressable
            accessibilityRole="button"
            onPress={() => router.push("/licenses")}
          >
            <UiText>Lizenzen</UiText>
          </UiPressable>
          <UiPressable
            accessibilityRole="button"
            onPress={() => {
              toast.confirm(
                "Intro zurücksetzen?",
                "Drücke hier, um das Intro zurückzusetzen",
                () => {
                  PersonalStore.setOnboardingDone(false);
                  PersonalStore.setLastSeenChangelogVersionCode(0);
                  toast.success("Intro zurückgesetzt");
                },
              );
            }}
          >
            <UiText>Intro zurücksetzen</UiText>
          </UiPressable>
          {!Config.isFoss && (
            <UiPressable
              accessibilityRole="button"
              onPress={() => {
                toast.confirm(
                  "Benachrichtigungen zurücksetzen?",
                  "Drücke hier, um sie zurückzusetzen",
                  () => {
                    Notifications.registerForPushNotifications();
                    toast.success("Benachrichtigungen zurückgesetzt");
                  },
                );
              }}
            >
              <UiText>Benachrichtigungen zurücksetzen</UiText>
            </UiPressable>
          )}
          <UiPressable
            accessibilityRole="button"
            onPress={() => {
              toast.confirm(
                "Erfolge zurücksetzen?",
                "Drücke hier, um alle Erfolge zurückzusetzen",
                () => {
                  Achievements.resetEverything();
                  toast.success("Erfolge zurückgesetzt");
                },
              );
            }}
          >
            <UiText>Alle Erfolge zurücksetzen</UiText>
          </UiPressable>
          <UiText selectable>
            Versionskennung: {Application.nativeApplicationVersion}
            &nbsp;-&nbsp;
            {Application.nativeBuildVersion}
            {Config.buildLabel && ` - ${Config.buildLabel}`}
            {Config.isFoss && " - FOSS"}
            {!Config.isFoss && `\nToken: ${token}`}
          </UiText>
        </View>
        <UiSpace size={100} />
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  linksContainer: {
    paddingHorizontal: 20,
    gap: 20,
  },
  infoContainer: {
    paddingHorizontal: 20,
    gap: 20,
  },
  sectionText: {
    paddingHorizontal: 20,
  },
});

export default SettingsScreen;

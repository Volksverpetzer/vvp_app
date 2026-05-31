import * as Application from "expo-application";
import { useRouter } from "expo-router";
import { useContext, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";

import {
  CodeIcon,
  FeedIcon,
  FeedbackIcon,
  GiveIcon,
  ImprintIcon,
  LockIcon,
  NotificationIcon,
  SearchIcon,
  SettingsIcon,
} from "#/components/Icons";
import AnimatedHeader from "#/components/animations/AnimatedHeader";
import Collapsable from "#/components/design/Collapsable";
import DesignedLink from "#/components/design/DesignedLink";
import Space from "#/components/design/Space";
import UiDivider from "#/components/ui/UiDivider";
import UiPressable from "#/components/ui/UiPressable";
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
          <Collapsable
            icon={<FeedIcon color={primary} size={24} />}
            title="Feed"
          >
            <UiText style={styles.sectionText}>
              Was möchtest du in deinem Feed sehen?
            </UiText>
            <SettingsList
              saveSettings={saveContentSetting}
              settings={contentSettings}
            />
          </Collapsable>
          {!Config.isFoss && (
            <Collapsable
              icon={<NotificationIcon color={primary} size={24} />}
              title="Benachrichtigungen"
            >
              <SettingsList
                saveSettings={saveNotificationSetting}
                settings={notificationSettings}
              />
            </Collapsable>
          )}
          <Collapsable
            icon={<SettingsIcon color={primary} size={24} />}
            title="Erweitert"
          >
            <SettingsList
              saveSettings={saveAdvancedSetting}
              settings={advancedSettings}
            />
            {Config.enableEngagement && <BackupView />}
          </Collapsable>
        </View>
        <UiDivider paddingHorizontal={35} paddingVertical={5} />
        <View style={styles.linksContainer}>
          <DesignedLink
            url={Config.aboutUrl}
            icon={<SearchIcon color={primary} size={24} />}
            text="Über uns"
          />
          <DesignedLink
            url={Config.donations.support}
            icon={<GiveIcon color={primary} size={24} />}
            text="Unterstützen"
          />
          <DesignedLink
            url={encodeURI("mailto:app@volksverpetzer.de")}
            icon={<FeedbackIcon color={primary} size={24} />}
            text="App-Feedback"
          />
          <DesignedLink
            url={Config.dataProtectionUrl}
            icon={<LockIcon color={primary} size={24} />}
            text="Datenschutz"
          />
          <DesignedLink
            url={Config.imprintUrl}
            icon={<ImprintIcon color={primary} size={24} />}
            text="Impressum"
          />
          <DesignedLink
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
              PersonalStore.setOnboardingDone(false);
              PersonalStore.setLastSeenChangelogVersionCode(0);
            }}
          >
            <UiText>Intro zurücksetzen</UiText>
          </UiPressable>
          {!Config.isFoss && (
            <UiPressable
              accessibilityRole="button"
              onPress={() => Notifications.registerForPushNotifications()}
            >
              <UiText>Benachrichtigungen zurücksetzen</UiText>
            </UiPressable>
          )}
          <UiPressable
            accessibilityRole="button"
            onPress={() => {
              Toast.show({
                type: "info",
                text1: "Erfolge zurücksetzen?",
                text2: "Drücke hier um alle Erfolge zurückzusetzen",
                position: "bottom",
                visibilityTime: 5000,
                autoHide: true,
                onPress: () => {
                  Toast.hide();
                  Achievements.resetEverything();
                  Toast.show({
                    type: "success",
                    text1: "Erfolge zurückgesetzt",
                    text2: "Alle Erfolge wurden zurückgesetzt",
                    visibilityTime: 3000,
                    autoHide: true,
                  });
                },
              });
            }}
          >
            <UiText>Alle Erfolge zurücksetzen</UiText>
          </UiPressable>
          <UiText selectable>
            Versionskennung: {Application.nativeApplicationVersion}
            &nbsp;-&nbsp;
            {Application.nativeBuildVersion}
            {Config.isFoss && " - FOSS"}
            {!Config.isFoss && `\nToken: ${token}`}
          </UiText>
        </View>
        <Space size={100} />
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
    fontSize: 16,
    paddingHorizontal: 20,
  },
});

export default SettingsScreen;

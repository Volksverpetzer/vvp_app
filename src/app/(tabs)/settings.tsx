import * as Application from "expo-application";
import { useRouter } from "expo-router";
import { useContext, useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

import {
  Feed,
  FeedbackIcon,
  Give,
  LockIcon,
  NotificationIcon,
  Search,
  Settings,
} from "#/components/Icons";
import AnimatedHeader from "#/components/animations/AnimatedHeader";
import ShopButton from "#/components/buttons/ShopButton";
import Collapsable from "#/components/design/Collapsable";
import DesignedLink from "#/components/design/DesignedLink";
import Divider from "#/components/design/Divider";
import Space from "#/components/design/Space";
import Text from "#/components/design/Text";
import Donate from "#/components/views/Donate";
import SettingsList from "#/components/views/SettingsList";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { Achievements } from "#/helpers/Achievements";
import Notifications from "#/helpers/Notifications";
import PersonalStore from "#/helpers/Stores/PersonalStore";
import SettingsStore from "#/helpers/Stores/SettingsStore";
import { SettingsContext } from "#/helpers/provider/SettingsProvider";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import { NotificationSettingType, SettingType } from "#/types";

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
  const corporate = Colors[colorScheme].corporate;
  const backgroundColor = Colors[colorScheme].secondaryBackground;
  const secondaryBackground = Colors[colorScheme].background;

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

  const pressableStyle = ({ pressed }: { pressed: boolean }) => [
    pressed && { backgroundColor: secondaryBackground },
  ];

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
        contentContainerStyle={[
          styles.container,
          { backgroundColor, paddingTop: HEADER_HEIGHT },
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollOffsetY } } }],
          { useNativeDriver: false },
        )}
      >
        <Collapsable
          icon={<Feed color={corporate} />}
          title="Feed"
          titleStyle={styles.collapsibleTitle}
        >
          <Text style={styles.sectionText}>
            Was möchtest du in deinem Feed sehen?
          </Text>
          <SettingsList
            saveSettings={saveContentSetting}
            settings={contentSettings}
          />
        </Collapsable>
        <Collapsable
          icon={<NotificationIcon size={24} color={corporate} />}
          title="Benachrichtigungen"
          titleStyle={styles.collapsibleTitle}
        >
          <SettingsList
            saveSettings={saveNotificationSetting}
            settings={notificationSettings}
          />
        </Collapsable>
        <Collapsable
          icon={<Settings size={24} color={corporate} />}
          title="Erweitert"
          titleStyle={styles.collapsibleTitle}
        >
          <SettingsList
            saveSettings={saveAdvancedSetting}
            settings={advancedSettings}
          />
        </Collapsable>
        <Divider paddingHorizontal={35} paddingVertical={10} />
        <View style={styles.linksContainer}>
          <DesignedLink
            url={Config.aboutUrl}
            icon={<Search color={corporate} width={20} />}
            text="Über uns"
          />
          <DesignedLink
            url={Config.donations.support}
            icon={<Give color={corporate} />}
            text="Unterstützen"
          />
          <DesignedLink
            url={encodeURI("mailto:app@volksverpetzer.de")}
            icon={<FeedbackIcon size={24} color={corporate} />}
            text="App-Feedback"
          />
          <DesignedLink
            url={Config.dataProtectionUrl}
            icon={<LockIcon size={24} color={corporate} />}
            text="Datenschutz"
          />
        </View>
        <View style={styles.donateContainer}>
          <Donate showPicker={false} />
          <Space size={20} />
          <ShopButton article_link={Config.wpUrl} />
        </View>
        <View style={styles.infoContainer}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/licenses")}
            style={pressableStyle}
          >
            <Text>Lizenzen</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={pressableStyle}
            onPress={() => PersonalStore.setOnboardingDone(false)}
          >
            <Text>Intro zurücksetzen</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={pressableStyle}
            onPress={() => Notifications.registerForPushNotifications()}
          >
            <Text>Benachrichtigungen zurücksetzen</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={pressableStyle}
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
            <Text>Alle Erfolge zurücksetzen</Text>
          </Pressable>
          <Text selectable>
            Versionskennung: {Application.nativeApplicationVersion}
            &nbsp;-&nbsp;
            {Application.nativeBuildVersion}
            {"\n"}
            Token: {token}
          </Text>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 100,
  },
  donateContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  linksContainer: {
    paddingHorizontal: 20,
  },
  infoContainer: {
    flex: 1,
    padding: 20,
    gap: 20,
  },
  sectionText: {
    fontSize: 16,
    paddingHorizontal: 20,
  },
  collapsibleTitle: {
    fontSize: 18,
    fontWeight: "bold",
    paddingVertical: 10,
  },
});

export default SettingsScreen;

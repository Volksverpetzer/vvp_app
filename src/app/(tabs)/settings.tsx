import * as Application from "expo-application";
import * as Haptics from "expo-haptics";
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
import UiText from "#/components/ui/UiText";
import Donate from "#/components/views/Donate";
import SettingsList from "#/components/views/SettingsList";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { globalStyles } from "#/constants/GlobalStyles";
import { spacing } from "#/constants/Spacing";
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
  // Monotonic id for settings syncs: a sync only applies its full-object
  // result to state if no newer sync started in the meantime — otherwise a
  // slow, stale sync would visibly revert a newer optimistic toggle of a
  // *different* switch.
  const settingsSyncSeqRef = useRef(0);
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
    // Flip the switch immediately — the token fetch and server registration
    // below can take seconds on a real device and must not block the UI.
    // The sync's merged full-settings result is applied afterwards, but only
    // if no newer sync started meanwhile (see settingsSyncSeqRef).
    setNotificationSettings((previous) => ({ ...previous, [key]: newSetting }));
    Haptics.selectionAsync();
    const syncId = ++settingsSyncSeqRef.current;
    try {
      const { notificationSettings: updatedNotificationSettings } =
        await Notifications.registerForPushNotifications({ [key]: newSetting });
      if (syncId === settingsSyncSeqRef.current) {
        setNotificationSettings(updatedNotificationSettings);
      }
    } catch (error) {
      console.error("Failed to sync notification setting:", error);
    }
  };

  useEffect(() => {
    const getToken = async () => {
      try {
        const token = await Notifications.getToken();
        setToken(token);
      } catch (error) {
        // getToken rethrows (no network, no Play Services, …) — the token
        // line simply stays empty in that case.
        console.error("Failed to get push token:", error);
      }
    };
    getToken();
  }, []);

  // Re-check the OS permission whenever this tab regains focus (e.g. the
  // user just came back from toggling it in the system Settings app), so the
  // switches reflect reality rather than a request made once at mount. Also
  // load the stored notification settings — without this the switches show
  // the defaults, not what the user actually configured.
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const seqAtFocus = settingsSyncSeqRef.current;
      SettingsStore.getNotificationSettings()
        .then((storedSettings) => {
          // Skip if a toggle sync started since focus — its optimistic state
          // is newer than what storage held when this load began.
          if (isActive && seqAtFocus === settingsSyncSeqRef.current) {
            setNotificationSettings(storedSettings);
          }
        })
        .catch((error) => {
          console.error("Failed to load notification settings:", error);
        });
      if (!Config.isFoss && Platform.OS !== "web") {
        Notifications.getPermissions()
          .then((permissions) => {
            if (isActive) {
              setNotificationPermissionDenied(permissions.status === "denied");
            }
          })
          .catch((error) => {
            console.error("Failed to check notification permission:", error);
          });
      }
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
            paddingBottom: 100,
            gap: spacing.xl,
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
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  linksContainer: {
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  infoContainer: {
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  sectionText: {
    paddingHorizontal: spacing.xl,
  },
});

export default SettingsScreen;

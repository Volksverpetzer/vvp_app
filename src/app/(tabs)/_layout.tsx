import Lucide from "@react-native-vector-icons/lucide/static";
import { NativeTabs } from "expo-router/unstable-native-tabs";

import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { useBadge } from "#/helpers/provider/BadgeProvider";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

/**
 * The layout for the tab navigator.
 * @returns The tab navigator.
 */
const TabLayout = () => {
  const { badgeState } = useBadge();
  const colorScheme = useAppColorScheme();
  const {
    primary: corporate,
    accent,
    background,
    textMuted,
    onPrimary,
    surfaceDisabled,
  } = Colors[colorScheme];
  const actionsActive = Config.enableActions;
  const engagementActive = Config.enableEngagement;

  return (
    <NativeTabs
      backBehavior="history"
      backgroundColor={background}
      badgeBackgroundColor={accent}
      disableTransparentOnScrollEdge
      iconColor={{
        default: textMuted,
        selected: onPrimary,
      }}
      indicatorColor={corporate}
      labelVisibilityMode="unlabeled"
      shadowColor={surfaceDisabled}
      // iOS 26+ draws the tab bar itself (backgroundColor/iconColor are
      // ignored by the iPad top tab bar), so use the corporate color for the
      // selected item instead of the system tint. Its light/dark look follows
      // the in-app theme via Appearance.setColorScheme in SettingsProvider.
      tintColor={corporate}
    >
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Icon
          src={<NativeTabs.Trigger.VectorIcon family={Lucide} name="house" />}
        />
        <NativeTabs.Trigger.Label hidden>Startseite</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger hidden={!engagementActive} name="personal">
        <NativeTabs.Trigger.Icon
          src={<NativeTabs.Trigger.VectorIcon family={Lucide} name="star" />}
        />
        <NativeTabs.Trigger.Badge hidden={!badgeState.personal} />
        <NativeTabs.Trigger.Label hidden>Favoriten</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger hidden={!actionsActive} name="action">
        <NativeTabs.Trigger.Icon
          src={<NativeTabs.Trigger.VectorIcon family={Lucide} name="trophy" />}
        />
        <NativeTabs.Trigger.Badge hidden={!badgeState.action} />
        <NativeTabs.Trigger.Label hidden>Aktionen</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="contact">
        <NativeTabs.Trigger.Icon
          src={<NativeTabs.Trigger.VectorIcon family={Lucide} name="mail" />}
        />
        <NativeTabs.Trigger.Badge hidden={!badgeState.contact} />
        <NativeTabs.Trigger.Label hidden>Kontakt</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon
          src={
            <NativeTabs.Trigger.VectorIcon family={Lucide} name="settings" />
          }
        />
        <NativeTabs.Trigger.Label hidden>
          Einstellungen
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
};

export default TabLayout;

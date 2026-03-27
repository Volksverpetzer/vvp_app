import Octicons from "@expo/vector-icons/Octicons";
import { NativeTabs } from "expo-router/unstable-native-tabs";

import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { useBadge } from "#/helpers/provider/BadgeProvider";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

export const unstable_settings = {
  initialRouteName: "home",
};

/**
 * The layout for the tab navigator.
 * @returns The tab navigator.
 */
const TabLayout = () => {
  const { badgeState } = useBadge();
  const colorScheme = useAppColorScheme();
  const { corporate, background, tabIconDefault, tabIconSelected, grayedOut } =
    Colors[colorScheme];
  const actionsActive = Config.enableActions;
  const engagementActive = Config.enableEngagement;

  return (
    <NativeTabs
      backBehavior="history"
      backgroundColor={background}
      badgeBackgroundColor={corporate}
      disableTransparentOnScrollEdge
      iconColor={{
        default: tabIconDefault,
        selected: tabIconSelected,
      }}
      indicatorColor={corporate}
      labelVisibilityMode="unlabeled"
      shadowColor={grayedOut}
    >
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Icon
          src={{
            default: (
              <NativeTabs.Trigger.VectorIcon family={Octicons} name="home" />
            ),
            selected: (
              <NativeTabs.Trigger.VectorIcon
                family={Octicons}
                name="home-fill"
              />
            ),
          }}
        />
        <NativeTabs.Trigger.Label hidden>Startseite</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger hidden={!engagementActive} name="personal">
        <NativeTabs.Trigger.Icon
          src={{
            default: (
              <NativeTabs.Trigger.VectorIcon family={Octicons} name="star" />
            ),
            selected: (
              <NativeTabs.Trigger.VectorIcon
                family={Octicons}
                name="star-fill"
              />
            ),
          }}
        />
        <NativeTabs.Trigger.Badge hidden={!badgeState.personal} />
        <NativeTabs.Trigger.Label hidden>Favoriten</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger hidden={!actionsActive} name="action">
        <NativeTabs.Trigger.Icon
          src={{
            default: (
              <NativeTabs.Trigger.VectorIcon family={Octicons} name="trophy" />
            ),
            selected: (
              <NativeTabs.Trigger.VectorIcon family={Octicons} name="trophy" />
            ),
          }}
        />
        <NativeTabs.Trigger.Badge hidden={!badgeState.action} />
        <NativeTabs.Trigger.Label hidden>Aktionen</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="report">
        <NativeTabs.Trigger.Icon
          src={{
            default: (
              <NativeTabs.Trigger.VectorIcon family={Octicons} name="report" />
            ),
            selected: (
              <NativeTabs.Trigger.VectorIcon family={Octicons} name="report" />
            ),
          }}
        />
        <NativeTabs.Trigger.Label hidden>Fake melden</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon
          src={{
            default: (
              <NativeTabs.Trigger.VectorIcon family={Octicons} name="gear" />
            ),
            selected: (
              <NativeTabs.Trigger.VectorIcon family={Octicons} name="gear" />
            ),
          }}
        />
        <NativeTabs.Trigger.Label hidden>
          Einstellungen
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
};

export default TabLayout;

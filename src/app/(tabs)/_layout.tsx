import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
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
  const corporate = Colors[colorScheme].corporate;
  const actionsActive = Config.enableActions;
  const engagementActive = Config.enableEngagement;

  return (
    <NativeTabs
      backBehavior="history"
      backgroundColor={Colors[colorScheme].background}
      badgeBackgroundColor={corporate}
      disableTransparentOnScrollEdge
      iconColor={{
        default: Colors[colorScheme].tabIconDefault,
        selected: Colors[colorScheme].text,
      }}
      indicatorColor={corporate}
      labelVisibilityMode="unlabeled"
      shadowColor={Colors[colorScheme].grayedOut}
    >
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Icon
          src={{
            default: (
              <NativeTabs.Trigger.VectorIcon
                family={MaterialCommunityIcons}
                name="home-outline"
              />
            ),
            selected: (
              <NativeTabs.Trigger.VectorIcon
                family={MaterialCommunityIcons}
                name="home"
              />
            ),
          }}
        />
        <NativeTabs.Trigger.Label hidden />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger hidden={!engagementActive} name="personal">
        <NativeTabs.Trigger.Icon
          src={{
            default: (
              <NativeTabs.Trigger.VectorIcon
                family={MaterialCommunityIcons}
                name="star-outline"
              />
            ),
            selected: (
              <NativeTabs.Trigger.VectorIcon
                family={MaterialCommunityIcons}
                name="star"
              />
            ),
          }}
        />
        <NativeTabs.Trigger.Badge hidden={!badgeState.personal} />
        <NativeTabs.Trigger.Label hidden />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger hidden={!actionsActive} name="action">
        <NativeTabs.Trigger.Icon
          src={{
            default: (
              <NativeTabs.Trigger.VectorIcon
                family={MaterialCommunityIcons}
                name="trophy-outline"
              />
            ),
            selected: (
              <NativeTabs.Trigger.VectorIcon
                family={MaterialCommunityIcons}
                name="trophy"
              />
            ),
          }}
        />
        <NativeTabs.Trigger.Badge hidden={!badgeState.action} />
        <NativeTabs.Trigger.Label hidden />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="report">
        <NativeTabs.Trigger.Icon
          src={{
            default: (
              <NativeTabs.Trigger.VectorIcon
                family={MaterialCommunityIcons}
                name="alert-circle-outline"
              />
            ),
            selected: (
              <NativeTabs.Trigger.VectorIcon
                family={MaterialCommunityIcons}
                name="alert-circle"
              />
            ),
          }}
        />
        <NativeTabs.Trigger.Label hidden />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon
          src={{
            default: (
              <NativeTabs.Trigger.VectorIcon
                family={MaterialCommunityIcons}
                name="cog-outline"
              />
            ),
            selected: (
              <NativeTabs.Trigger.VectorIcon
                family={MaterialCommunityIcons}
                name="cog"
              />
            ),
          }}
        />
        <NativeTabs.Trigger.Label hidden />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
};

export default TabLayout;

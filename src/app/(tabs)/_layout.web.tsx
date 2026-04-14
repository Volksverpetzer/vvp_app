import { Tabs } from "expo-router";

import {
  HomeIcon,
  ReportIcon,
  SettingsIcon,
  StarIcon,
  TrophyIcon,
} from "#/components/Icons";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { useBadge } from "#/helpers/provider/BadgeProvider";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

/**
 * Web-specific tab layout using standard expo-router Tabs to avoid
 * expo-font.renderToImageAsync which is not available on web.
 */
const TabLayout = () => {
  const { badgeState } = useBadge();
  const colorScheme = useAppColorScheme();
  const corporate = Colors[colorScheme].corporate;
  const actionsActive = Config.enableActions;
  const engagementActive = Config.enableEngagement;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors[colorScheme].text,
        tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme].background,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Startseite",
          tabBarShowLabel: false,
          tabBarIcon: ({ color, size }) => (
            <HomeIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="personal"
        options={{
          title: "Favoriten",
          href: engagementActive ? undefined : null,
          tabBarShowLabel: false,
          tabBarBadge: badgeState.personal ? " " : undefined,
          tabBarBadgeStyle: { backgroundColor: corporate },
          tabBarIcon: ({ color, size }) => (
            <StarIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="action"
        options={{
          title: "Aktionen",
          href: actionsActive ? undefined : null,
          tabBarShowLabel: false,
          tabBarBadge: badgeState.action ? " " : undefined,
          tabBarBadgeStyle: { backgroundColor: corporate },
          tabBarIcon: ({ color, size }) => (
            <TrophyIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: "Fake melden",
          tabBarShowLabel: false,
          tabBarIcon: ({ color, size }) => (
            <ReportIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Einstellungen",
          tabBarShowLabel: false,
          tabBarIcon: ({ color, size }) => (
            <SettingsIcon color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
};

export const unstable_settings = {
  initialRouteName: "home",
};

export default TabLayout;

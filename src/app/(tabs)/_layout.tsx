import { Tabs } from "expo-router";
import { View } from "react-native";

import {
  EmptyStar,
  FilledStar,
  Home,
  Pokal,
  Report,
  Settings,
} from "#/components/Icons";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { styles } from "#/constants/Styles";
import { useBadge } from "#/helpers/provider/BadgeProvider";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

/**
 * The layout for the tab navigator.
 * @returns The tab navigator.
 */
const TabLayout = () => {
  const { badgeState } = useBadge();
  const colorScheme = useAppColorScheme();
  const corporate = Colors[colorScheme].corporate;
  const actionsActive = Config.enabledActions;

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: corporate,
        tabBarShowLabel: false,
        tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
        tabBarIconStyle: {
          marginVertical: 5,
        },
        tabBarStyle: {
          paddingBottom: 10,
          backgroundColor: Colors[colorScheme].background,
          borderTopWidth: 1,
          borderColor: Colors[colorScheme].grayedOut,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home color={color} />,
          tabBarAccessibilityLabel: "Home",
        }}
      />
      <Tabs.Screen
        name="personal"
        options={{
          title: "Favs",
          tabBarIcon: ({ color, focused }) => (
            <>
              {focused ? (
                <FilledStar color={color} width={50} />
              ) : (
                <EmptyStar color={color} width={50} />
              )}

              {badgeState.personal && <View style={styles.badge} />}
            </>
          ),
          tabBarAccessibilityLabel: "Favoriten",
        }}
      />
      <Tabs.Screen
        name="action"
        options={{
          href: actionsActive ? "/action" : null,
          title: "Action",
          tabBarIcon: ({ color, focused }) => {
            return (
              <View
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  padding: 10,
                  marginTop: 0,
                  backgroundColor: focused
                    ? Colors[colorScheme].secondaryBackground
                    : Colors[colorScheme].background,
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 1,
                  borderBottomColor: Colors[colorScheme].background,
                  borderLeftColor: Colors[colorScheme].background,
                  borderRightColor: Colors[colorScheme].background,
                  borderTopColor: Colors[colorScheme].grayedOut,
                }}
              >
                <Pokal color={focused ? corporate : color} />
                {badgeState.action && <View style={styles.badge} />}
              </View>
            );
          },
          tabBarAccessibilityLabel: "Aktionen",
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: "Petzen",
          tabBarIcon: ({ color }) => <Report color={color} />,
          tabBarAccessibilityLabel: "Fake melden",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Konfig",
          tabBarIcon: ({ color }) => <Settings color={color} width={50} />,
          tabBarAccessibilityLabel: "Einstellungen",
        }}
      />
    </Tabs>
  );
};

export default TabLayout;

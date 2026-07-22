import type { ReactNode } from "react";
import { useRef, useState } from "react";
import type { ColorValue } from "react-native";
import { Animated, StyleSheet, View } from "react-native";

import { ChevronIcon } from "#/components/Icons";
import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

interface UiCollapsableProps {
  title: string;
  defaultOpen?: boolean;
  onToggle?: (open: boolean) => void;
  children?: ReactNode;
  icon?: ReactNode;
  cardBackground?: ColorValue;
  borderRadius?: number;
}

const UiCollapsable = ({
  title,
  defaultOpen = false,
  onToggle,
  children,
  icon,
  cardBackground,
  borderRadius = 20,
}: UiCollapsableProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const fadeAnim = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  const colorScheme = useAppColorScheme();
  const textColor = Colors[colorScheme].text;
  const resolvedCardBg = cardBackground ?? Colors[colorScheme].background;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    onToggle?.(next);
    Animated.timing(fadeAnim, {
      toValue: next ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={{ paddingHorizontal: 20, borderRadius, overflow: "hidden" }}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: resolvedCardBg, opacity: fadeAnim },
          { pointerEvents: "none" },
        ]}
      />
      <UiPressable
        accessibilityRole="button"
        onPress={toggle}
        style={styles.header}
      >
        <View style={styles.title}>
          {icon}
          <UiText bold size="lg">
            {title}
          </UiText>
        </View>
        <ChevronIcon
          direction={open ? "up" : "down"}
          size={24}
          color={textColor}
        />
      </UiPressable>
      {open && <View style={styles.content}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingBottom: 15,
  },
  title: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  content: {
    paddingTop: 5,
  },
});

export default UiCollapsable;

import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { ChevronIcon } from "#/components/Icons";
import Heading from "#/components/typography/Heading";
import UiPressable from "#/components/ui/UiPressable";
import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

interface UiCollapsableProps {
  title: string;
  defaultOpen?: boolean;
  onToggle?: (open: boolean) => void;
  children?: ReactNode;
  icon?: ReactNode;
  cardBackground?: string;
}

const UiCollapsable = ({
  title,
  defaultOpen = false,
  onToggle,
  children,
  icon,
  cardBackground,
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
    <View style={{ paddingHorizontal: 20 }}>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: resolvedCardBg, opacity: fadeAnim },
        ]}
      />
      <UiPressable
        accessibilityRole="button"
        onPress={toggle}
        style={styles.header}
      >
        <View style={styles.title}>
          {icon}
          <Heading style={[{ color: textColor }]}>{title}</Heading>
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

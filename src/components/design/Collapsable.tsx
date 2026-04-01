import type { ReactElement, ReactNode } from "react";
import { useState } from "react";
import type { StyleProp, TextStyle } from "react-native";
import { Pressable, StyleSheet, View } from "react-native";

import { ChevronIcon } from "#/components/Icons";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

interface CollapsableProps {
  title: string;
  defaultOpen?: boolean;
  onToggle?: (open: boolean) => void;
  titleStyle?: StyleProp<TextStyle>;
  children?: ReactNode;
  icon?: ReactNode;
}

const Collapsable = ({
  title,
  defaultOpen = false,
  onToggle,
  children,
  titleStyle,
  icon,
}: CollapsableProps): ReactElement => {
  const [open, setOpen] = useState(defaultOpen);

  const colorScheme = useAppColorScheme();
  const textColor = Colors[colorScheme].text;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    onToggle?.(next);
  };

  return (
    <View
      style={{
        backgroundColor: open ? Colors[colorScheme].background : undefined,
        paddingHorizontal: 20,
      }}
    >
      <Pressable
        accessibilityRole="button"
        onPress={toggle}
        style={styles.header}
      >
        <View style={styles.title}>
          {icon}
          <UiText style={[{ color: textColor }, titleStyle]}>{title}</UiText>
        </View>
        <ChevronIcon
          direction={open ? "up" : "down"}
          size={24}
          color={textColor}
        />
      </Pressable>
      {open && <View>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  title: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default Collapsable;

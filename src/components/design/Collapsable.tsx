import type { ReactElement, ReactNode } from "react";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ChevronIcon } from "#/components/Icons";
import Heading from "#/components/typography/Heading";
import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

interface CollapsableProps {
  title: string;
  defaultOpen?: boolean;
  onToggle?: (open: boolean) => void;
  children?: ReactNode;
  icon?: ReactNode;
}

const Collapsable = ({
  title,
  defaultOpen = false,
  onToggle,
  children,
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
          <Heading style={[{ color: textColor }]}>{title}</Heading>
        </View>
        <ChevronIcon
          direction={open ? "up" : "down"}
          size={24}
          color={textColor}
        />
      </Pressable>
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
    alignItems: "flex-start",
    gap: 10,
  },
  content: {
    paddingTop: 5,
  },
});

export default Collapsable;

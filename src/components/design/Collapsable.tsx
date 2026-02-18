import { ReactElement, ReactNode, useState } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from "react-native";

import { ChevronIcon } from "#/components/Icons";
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
          <Text style={[styles.titleText, { color: textColor }, titleStyle]}>
            {title}
          </Text>
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
    gap: 10,
  },
  titleText: {
    fontSize: 16,
  },
});

export default Collapsable;

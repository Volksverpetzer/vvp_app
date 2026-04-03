import type { ReactNode } from "react";
import type { TextProps, TextStyle } from "react-native";

import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

interface HeadingProperties extends TextProps {
  children: ReactNode;
  styles?: TextStyle;
}

const Heading = (properties: HeadingProperties) => {
  const { styles, children } = properties;
  const colorScheme = useAppColorScheme();
  return (
    <UiText
      style={{
        fontFamily: "SourceSansProSemiBold",
        fontSize: 18,
        fontWeight: "bold",
        padding: 10,
        color: Colors[colorScheme].heading,
        ...styles,
      }}
    >
      {children}
    </UiText>
  );
};

export default Heading;

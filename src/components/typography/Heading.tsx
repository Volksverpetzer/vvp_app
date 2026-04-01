import type { ReactNode } from "react";
import type { TextProps, TextStyle } from "react-native";

import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { styles as _styles } from "#/constants/Styles";
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
        ...styles,
        ..._styles.heading,
        color: Colors[colorScheme].heading,
      }}
    >
      {children}
    </UiText>
  );
};

export default Heading;

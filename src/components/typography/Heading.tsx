import { ReactNode } from "react";
import { Text, TextProps, TextStyle } from "react-native";

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
    <Text
      style={{
        ...styles,
        ..._styles.heading,
        color: Colors[colorScheme].heading,
      }}
    >
      {children}
    </Text>
  );
};

export default Heading;

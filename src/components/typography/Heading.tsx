import type { ReactNode } from "react";
import type { TextProps } from "react-native";

import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

interface HeadingProperties extends TextProps {
  children: ReactNode;
}

const Heading = ({ style, children, ...props }: HeadingProperties) => {
  const colorScheme = useAppColorScheme();
  return (
    <UiText
      style={[
        {
          color: Colors[colorScheme].heading,
          fontFamily: "SourceSansProSemiBold",
          fontSize: 18,
          fontWeight: "bold",
          paddingBottom: 10,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </UiText>
  );
};

export default Heading;

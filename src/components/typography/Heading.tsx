import type { ReactNode } from "react";
import type { TextProps } from "react-native";

import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { fontSizes } from "#/constants/FontSizes";
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
          color: Colors[colorScheme].text,
          fontFamily: "SourceSansProBold",
          fontSize: fontSizes.lg,
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

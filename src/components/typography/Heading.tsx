import type { ReactNode } from "react";
import type { TextProps } from "react-native";

import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import type { FontSizeToken } from "#/constants/FontSizes";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

interface HeadingProperties extends TextProps {
  children: ReactNode;
  /** Font size from the shared scale. Defaults to `lg` (18). */
  size?: FontSizeToken;
}

const Heading = ({
  style,
  children,
  size = "lg",
  ...props
}: HeadingProperties) => {
  const colorScheme = useAppColorScheme();
  return (
    <UiText
      size={size}
      style={[
        {
          color: Colors[colorScheme].text,
          fontFamily: "SourceSansProBold",
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

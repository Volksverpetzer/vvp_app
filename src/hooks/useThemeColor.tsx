import useAppColorScheme from "src/hooks/useAppColorScheme";

import Colors from "#/constants/Colors";

export function useThemeColor(
  properties: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark,
) {
  const theme = useAppColorScheme();
  const colorFromProperties = properties[theme];

  return colorFromProperties || Colors[theme][colorName];
}

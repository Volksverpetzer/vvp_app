import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

export const useThemeColor = (
  properties: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark,
) => {
  const theme = useAppColorScheme();
  const colorFromProperties = properties[theme];

  return colorFromProperties || Colors[theme][colorName];
};

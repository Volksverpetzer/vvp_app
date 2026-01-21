import Colors from "../constants/Colors";
import useColorScheme from "./useColorScheme";

export function useThemeColor(
  properties: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark,
) {
  const theme = useColorScheme();
  const colorFromProperties = properties[theme];

  return colorFromProperties || Colors[theme][colorName];
}

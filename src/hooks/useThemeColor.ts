import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

export const useThemeColor = (
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark,
) => {
  const theme = useAppColorScheme();
  return Colors[theme][colorName];
};

import { ErrorIcon } from "#/components/Icons";
import type { CardProperties } from "#/components/design/Card";
import Card from "#/components/design/Card";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import { useThemeColor } from "#/hooks/useThemeColor";

type ErrorCardProperties = CardProperties & { text?: string };

const ErrorCard = (properties: ErrorCardProperties) => {
  const { text, style, lightColor, darkColor, ...otherProperties } = properties;
  const colorScheme = useAppColorScheme();
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "errorBackground",
  );

  return (
    <Card
      style={[{ backgroundColor, alignItems: "center", gap: 5 }, style]}
      {...otherProperties}
    >
      <ErrorIcon color={Colors[colorScheme].errorBackground} />
      <UiText style={{ color: Colors[colorScheme].errorText }}>
        {text || "An error occurred. Please try again later."}
      </UiText>
    </Card>
  );
};

export default ErrorCard;

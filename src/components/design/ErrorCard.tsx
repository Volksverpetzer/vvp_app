import { ErrorIcon } from "#/components/Icons";
import Card, { CardProperties } from "#/components/design/Card";
import Text from "#/components/design/Text";
import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import { useThemeColor } from "#/hooks/useThemeColor";

type ErrorCardProperties = CardProperties & { text?: string };

const ErrorCard = (properties: ErrorCardProperties) => {
  const { style, lightColor, darkColor, ...otherProperties } = properties;
  const colorScheme = useAppColorScheme();
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "error",
  );

  return (
    <Card
      style={[{ backgroundColor, alignItems: "center", gap: 5 }, style]}
      {...otherProperties}
    >
      <ErrorIcon color={"black"} />
      <Text style={{ color: Colors[colorScheme].text }}>
        {properties.text || "An error occurred. Please try again later."}
      </Text>
    </Card>
  );
};

export default ErrorCard;

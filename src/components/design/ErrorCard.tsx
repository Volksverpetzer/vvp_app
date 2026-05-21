import { ErrorIcon } from "#/components/Icons";
import type { CardProperties } from "#/components/design/Card";
import Card from "#/components/design/Card";
import UiText from "#/components/ui/UiText";
import { useThemeColor } from "#/hooks/useThemeColor";

type ErrorCardProperties = CardProperties & { text?: string };

const ErrorCard = (properties: ErrorCardProperties) => {
  const { text, style, ...otherProperties } = properties;
  const backgroundColor = useThemeColor("errorBackground");
  const errorText = useThemeColor("errorText");

  return (
    <Card
      style={[{ backgroundColor, alignItems: "center", gap: 5 }, style]}
      {...otherProperties}
    >
      <ErrorIcon color={errorText} />
      <UiText style={{ color: errorText }}>
        {text || "An error occurred. Please try again later."}
      </UiText>
    </Card>
  );
};

export default ErrorCard;

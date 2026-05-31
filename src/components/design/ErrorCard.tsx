import { ErrorIcon } from "#/components/Icons";
import type { UiCardProperties } from "#/components/ui/UiCard";
import UiCard from "#/components/ui/UiCard";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

type ErrorCardProperties = UiCardProperties & { text?: string };

const ErrorCard = (properties: ErrorCardProperties) => {
  const { text, style, ...otherProperties } = properties;
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].errorBackground;
  const errorText = Colors[colorScheme].errorText;

  return (
    <UiCard
      style={[{ backgroundColor, alignItems: "center", gap: 5 }, style]}
      {...otherProperties}
    >
      <ErrorIcon color={errorText} />
      <UiText style={{ color: errorText }}>
        {text || "An error occurred. Please try again later."}
      </UiText>
    </UiCard>
  );
};

export default ErrorCard;

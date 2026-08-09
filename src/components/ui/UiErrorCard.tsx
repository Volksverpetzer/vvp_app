import { ErrorIcon } from "#/components/Icons";
import type { UiCardProperties } from "#/components/ui/UiCard";
import UiCard from "#/components/ui/UiCard";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { spacing } from "#/constants/Spacing";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

type UiErrorCardProperties = UiCardProperties & { text?: string };

const UiErrorCard = (properties: UiErrorCardProperties) => {
  const { text, style, ...otherProperties } = properties;
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].surfaceError;
  const onError = Colors[colorScheme].onError;

  return (
    <UiCard
      style={[
        { backgroundColor, alignItems: "center", gap: spacing.xs },
        style,
      ]}
      {...otherProperties}
    >
      <ErrorIcon color={onError} />
      <UiText style={{ color: onError }}>
        {text || "An error occurred. Please try again later."}
      </UiText>
    </UiCard>
  );
};

export default UiErrorCard;
